import { generateDhcpConfig } from './lib/dhcp.mjs';
import { calculateSubnet } from './lib/subnet.mjs';
import { formatOpsLog } from './lib/logs.mjs';
import { loadState, saveState } from './lib/storage.mjs';

const VALID_ROUTES = new Set(['dhcp', 'subnet', 'logs']);
const SAFE_THEMES = new Set(['gold', 'cyber']);
let state = await loadState().catch(() => ({ theme: 'gold', lastModule: 'dhcp', dhcpDraft: {}, subnetDraft: {}, logDraft: {} }));

function currentRoute() {
  const candidate = location.hash.replace(/^#/, '');
  return VALID_ROUTES.has(candidate) ? candidate : 'dhcp';
}

function applyRoute() {
  const route = currentRoute();
  if (location.hash !== `#${route}`) history.replaceState(null, '', `#${route}`);
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== route;
  });
  document.querySelectorAll('[data-route]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.route === route);
    tab.setAttribute('aria-current', tab.dataset.route === route ? 'page' : 'false');
  });
  state.lastModule = route;
  saveState({ lastModule: route }).catch(() => {});
}

function applyTheme(theme) {
  const safe = SAFE_THEMES.has(theme) ? theme : 'gold';
  document.body.dataset.theme = safe;
  state.theme = safe;
  document.querySelector('#themeToggle').textContent = safe === 'gold' ? 'Switch to Cyber' : 'Switch to Gold';
}

function splitDns(value) {
  return String(value ?? '').split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);
}

function showError(id, error) {
  const box = document.querySelector(`#${id}`);
  box.textContent = error instanceof Error ? error.message : String(error);
  box.hidden = false;
}

function clearError(id) {
  const box = document.querySelector(`#${id}`);
  box.textContent = '';
  box.hidden = true;
}

function value(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function setValue(id, valueToSet) {
  if (valueToSet === undefined || valueToSet === null) return;
  document.querySelector(`#${id}`).value = String(valueToSet);
}

function readDhcpDraft() {
  return {
    poolName: value('dhcpPoolName'),
    network: value('dhcpNetwork'),
    mask: value('dhcpMask'),
    defaultRouter: value('dhcpRouter'),
    dnsServers: value('dhcpDns'),
    domainName: value('dhcpDomain'),
    leaseDays: value('dhcpLease'),
    excludeStart: value('dhcpExcludeStart'),
    excludeEnd: value('dhcpExcludeEnd')
  };
}

function readSubnetDraft() {
  return { cidr: value('subnetCidr') };
}

function readLogDraft() {
  return {
    date: value('logDate'), time: value('logTime'), site: value('logSite'), device: value('logDevice'),
    ticket: value('logTicket'), status: value('logStatus'), summary: value('logSummary'),
    action: value('logAction'), owner: value('logOwner')
  };
}

function restoreDrafts() {
  const dhcp = state.dhcpDraft ?? {};
  setValue('dhcpPoolName', dhcp.poolName); setValue('dhcpNetwork', dhcp.network); setValue('dhcpMask', dhcp.mask);
  setValue('dhcpRouter', dhcp.defaultRouter); setValue('dhcpDns', dhcp.dnsServers); setValue('dhcpDomain', dhcp.domainName);
  setValue('dhcpLease', dhcp.leaseDays); setValue('dhcpExcludeStart', dhcp.excludeStart); setValue('dhcpExcludeEnd', dhcp.excludeEnd);
  setValue('subnetCidr', state.subnetDraft?.cidr);
  const log = state.logDraft ?? {};
  for (const [key, id] of Object.entries({ date:'logDate',time:'logTime',site:'logSite',device:'logDevice',ticket:'logTicket',status:'logStatus',summary:'logSummary',action:'logAction',owner:'logOwner' })) setValue(id, log[key]);
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function copyOutput(pre, statusElement) {
  const text = pre.textContent.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    statusElement.textContent = 'Copied';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(pre);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    statusElement.textContent = 'Selected — press Ctrl+C';
  }
}

applyTheme(state.theme);
restoreDrafts();
if (!location.hash && VALID_ROUTES.has(state.lastModule)) history.replaceState(null, '', `#${state.lastModule}`);
applyRoute();
addEventListener('hashchange', applyRoute);

document.querySelector('#themeToggle').addEventListener('click', async () => {
  const next = state.theme === 'gold' ? 'cyber' : 'gold';
  applyTheme(next);
  await saveState({ theme: next }).catch(() => {});
});

document.querySelector('#dhcpForm').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const draft = readDhcpDraft();
    const excludedRanges = draft.excludeStart ? [{ start: draft.excludeStart, end: draft.excludeEnd }] : [];
    const output = generateDhcpConfig({
      poolName: draft.poolName,
      network: draft.network,
      mask: draft.mask,
      defaultRouter: draft.defaultRouter,
      dnsServers: splitDns(draft.dnsServers),
      domainName: draft.domainName,
      leaseDays: draft.leaseDays,
      excludedRanges
    });
    document.querySelector('#dhcpOutput').textContent = output;
    document.querySelector('#dhcpCopyStatus').textContent = 'Config generated locally';
    clearError('dhcpError');
  } catch (error) {
    document.querySelector('#dhcpOutput').textContent = '';
    showError('dhcpError', error);
  }
});

document.querySelector('#subnetForm').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const result = calculateSubnet(value('subnetCidr'));
    document.querySelector('#subnetOutput').textContent = [
      `IP Address      : ${result.ip}`,
      `Prefix          : /${result.prefix}`,
      `Subnet Mask     : ${result.mask}`,
      `Network         : ${result.network}`,
      `Broadcast       : ${result.broadcast}`,
      `First Host      : ${result.firstHost}`,
      `Last Host       : ${result.lastHost}`,
      `Total Addresses : ${result.totalAddresses}`,
      `Usable Hosts    : ${result.usableHosts}`
    ].join('\n');
    document.querySelector('#subnetCopyStatus').textContent = 'Subnet calculated locally';
    clearError('subnetError');
  } catch (error) {
    document.querySelector('#subnetOutput').textContent = '';
    showError('subnetError', error);
  }
});

document.querySelector('#logForm').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const output = formatOpsLog(readLogDraft());
    document.querySelector('#logOutput').textContent = output;
    document.querySelector('#logCopyStatus').textContent = 'Log generated locally';
    clearError('logError');
  } catch (error) {
    document.querySelector('#logOutput').textContent = '';
    showError('logError', error);
  }
});

document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', () => copyOutput(
    document.querySelector(`#${button.dataset.copyTarget}`),
    document.querySelector(`#${button.dataset.copyStatus}`)
  ));
});

const saveDrafts = debounce(() => {
  state.dhcpDraft = readDhcpDraft();
  state.subnetDraft = readSubnetDraft();
  state.logDraft = readLogDraft();
  saveState({ dhcpDraft: state.dhcpDraft, subnetDraft: state.subnetDraft, logDraft: state.logDraft }).catch(() => {});
});

document.querySelectorAll('input, textarea').forEach((control) => {
  control.addEventListener('input', saveDrafts);
  control.addEventListener('change', saveDrafts);
});
