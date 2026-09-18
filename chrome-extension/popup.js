import { loadState, saveState } from './lib/storage.mjs';

const APP_URL = 'https://dhcp-automation-pro.vercel.app/#dhcp';
const labels = { dhcp: 'DHCP', subnet: 'Subnet', logs: 'Logs' };
let activeState = await loadState().catch(() => ({ theme: 'gold', lastModule: 'dhcp' }));

function normalizeTheme(theme) {
  return theme === 'cyber' ? 'cyber' : 'gold';
}

function normalizeModule(module) {
  return Object.hasOwn(labels, module) ? module : 'dhcp';
}

function paintTheme(theme) {
  const safeTheme = normalizeTheme(theme);
  document.body.dataset.theme = safeTheme;
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.classList.toggle('active', button.dataset.themeChoice === safeTheme);
  });
}

function paintModule(module) {
  const safeModule = normalizeModule(module);
  document.querySelector('#lastModule').textContent = labels[safeModule];
}

function paintConnectivity() {
  const pill = document.querySelector('#statusPill');
  pill.textContent = navigator.onLine ? 'ONLINE' : 'LOCAL';
}

function openLocal(module) {
  const safeModule = normalizeModule(module);
  const url = chrome.runtime.getURL(`app.html#${safeModule}`);
  return chrome.tabs.create({ url });
}

activeState = {
  ...activeState,
  theme: normalizeTheme(activeState.theme),
  lastModule: normalizeModule(activeState.lastModule)
};
paintTheme(activeState.theme);
paintModule(activeState.lastModule);
paintConnectivity();
addEventListener('online', paintConnectivity);
addEventListener('offline', paintConnectivity);

document.querySelectorAll('[data-module]').forEach((button) => {
  button.addEventListener('click', async () => {
    const module = normalizeModule(button.dataset.module);
    activeState.lastModule = module;
    paintModule(module);
    await saveState({ lastModule: module }).catch(() => {});
    await openLocal(module);
  });
});

document.querySelectorAll('[data-theme-choice]').forEach((button) => {
  button.addEventListener('click', async () => {
    const theme = normalizeTheme(button.dataset.themeChoice);
    activeState.theme = theme;
    paintTheme(theme);
    await saveState({ theme }).catch(() => {});
  });
});

document.querySelector('#openFull').addEventListener('click', () => openLocal(activeState.lastModule));
document.querySelector('#openWeb').addEventListener('click', () => chrome.tabs.create({ url: APP_URL }));
