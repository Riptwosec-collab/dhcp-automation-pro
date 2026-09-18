# DHCP Mission Control Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready Manifest V3 Chrome Extension companion for DHCP Mission Control with a toolbar popup, full local app, DHCP/Subnet/Log generators, local persistence, keyboard shortcut, local assets, tests, and packaging.

**Architecture:** Keep the existing website untouched and add a self-contained `chrome-extension/` subtree. Browser-facing files use only packaged HTML/CSS/JavaScript, while calculation and formatting logic lives in pure ES modules that can be imported by both the extension UI and Node tests. The service worker is intentionally small and handles only install defaults and the `open-mission-control` command.

**Tech Stack:** Chrome Extension Manifest V3, HTML5, CSS3, ES modules, `chrome.storage.local`, `chrome.tabs`, Node.js built-in test runner (`node:test`), Python 3 standard library for deterministic icon and ZIP generation.

**Spec:** `docs/superpowers/specs/2026-09-18-chrome-extension-design.md`

## Global Constraints

- Manifest version must be exactly `3`.
- The extension must not execute remote code.
- No `https://cdn.tailwindcss.com`.
- No remote Lucide script.
- No Google Fonts dependency.
- No `eval()` or dynamic code execution.
- No inline JavaScript event handlers.
- JavaScript must load only from packaged extension files.
- CSS must load only from packaged extension files.
- Permission set must contain `storage` and must not contain `<all_urls>`.
- Production web app remains `https://dhcp-automation-pro.vercel.app/#dhcp`.
- Local persistence must never store credentials, passwords, tokens, or private network authentication material.
- Supported full-app routes are exactly `#dhcp`, `#subnet`, and `#logs`; unknown hashes normalize to `#dhcp`.
- Suggested keyboard shortcut is `Ctrl+Shift+D` on Windows/Linux and `Command+Shift+D` on macOS.
- Visual default is Gold Cyber, with optional Blue Cyber.
- Full app must honor `prefers-reduced-motion`.

---

## File Map

The implementation creates these focused units:

```text
chrome-extension/
├── manifest.json                 # Manifest V3 contract and command declaration
├── background.js                 # install defaults + keyboard command
├── popup.html                    # compact launcher markup
├── popup.css                     # popup-only visual system
├── popup.js                      # popup state + navigation
├── app.html                      # full local Mission Control shell
├── app.css                       # full-app visual system
├── app.js                        # hash routing + DOM integration
├── lib/
│   ├── dhcp.mjs                  # deterministic DHCP CLI generator
│   ├── subnet.mjs                # IPv4/CIDR parsing and calculation
│   ├── logs.mjs                  # deterministic operations log formatter
│   └── storage.mjs               # chrome.storage.local wrapper
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon512.png
├── tests/
│   ├── manifest.test.mjs
│   ├── subnet.test.mjs
│   ├── dhcp.test.mjs
│   ├── logs.test.mjs
│   ├── storage.test.mjs
│   └── csp.test.mjs
└── README.md

scripts/
├── generate-extension-icons.py
└── package-chrome-extension.py
```

---

### Task 1: Manifest V3 Contract and Static Guardrails

**Files:**
- Create: `chrome-extension/manifest.json`
- Create: `chrome-extension/tests/manifest.test.mjs`
- Create: `chrome-extension/tests/csp.test.mjs`

**Interfaces:**
- Consumes: approved design spec.
- Produces: the extension entry-point contract expected by every later task; `action.default_popup = "popup.html"`; `background.service_worker = "background.js"`; `commands.open-mission-control`.

- [ ] **Step 1: Write the failing manifest test**

Create `chrome-extension/tests/manifest.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(
  fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8')
);

test('uses Manifest V3 and minimum permissions', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.ok(!JSON.stringify(manifest).includes('<all_urls>'));
});

test('declares popup, service worker, and keyboard command', () => {
  assert.equal(manifest.action.default_popup, 'popup.html');
  assert.equal(manifest.background.service_worker, 'background.js');
  assert.equal(manifest.commands['open-mission-control'].suggested_key.default, 'Ctrl+Shift+D');
  assert.equal(manifest.commands['open-mission-control'].suggested_key.mac, 'Command+Shift+D');
});
```

- [ ] **Step 2: Run the test and confirm the expected failure**

Run:

```bash
node --test chrome-extension/tests/manifest.test.mjs
```

Expected: FAIL because `chrome-extension/manifest.json` does not exist.

- [ ] **Step 3: Create the minimal Manifest V3 file**

Create `chrome-extension/manifest.json` with this contract:

```json
{
  "manifest_version": 3,
  "name": "DHCP Mission Control",
  "version": "1.0.0",
  "description": "Local-first DHCP, subnet, and operations log tools for network support workflows.",
  "permissions": ["storage"],
  "action": {
    "default_title": "DHCP Mission Control",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "commands": {
    "open-mission-control": {
      "suggested_key": {
        "default": "Ctrl+Shift+D",
        "mac": "Command+Shift+D"
      },
      "description": "Open DHCP Mission Control"
    }
  }
}
```

- [ ] **Step 4: Add a static CSP/remote-code audit test**

Create `chrome-extension/tests/csp.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const htmlFiles = ['popup.html', 'app.html'];
const forbidden = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'eval(',
  'javascript:'
];

test('extension HTML uses no remote scripts, styles, or inline handlers', () => {
  for (const name of htmlFiles) {
    if (!fs.existsSync(path.join(root, name))) continue;
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    for (const token of forbidden) assert.equal(html.includes(token), false, `${name} contains ${token}`);
    assert.equal(/\son[a-z]+\s*=/.test(html), false, `${name} contains inline event handler`);
    assert.equal(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), false, `${name} contains inline script`);
  }
});
```

- [ ] **Step 5: Run the static tests**

```bash
node --test chrome-extension/tests/manifest.test.mjs chrome-extension/tests/csp.test.mjs
```

Expected: PASS. The CSP test permits missing UI files at this stage and becomes effective as soon as later tasks create them.

- [ ] **Step 6: Commit the guardrails**

```bash
git add chrome-extension/manifest.json chrome-extension/tests/manifest.test.mjs chrome-extension/tests/csp.test.mjs
git commit -m "feat(extension): add Manifest V3 contract and CSP guardrails"
```

---

### Task 2: IPv4/CIDR and Subnet Calculation Core

**Files:**
- Create: `chrome-extension/lib/subnet.mjs`
- Create: `chrome-extension/tests/subnet.test.mjs`

**Interfaces:**
- Produces: `parseIPv4(input) -> number`, `intToIPv4(value) -> string`, `parseCIDR(input) -> { ip, prefix }`, `calculateSubnet(input) -> SubnetResult`.
- `SubnetResult` keys: `ip`, `prefix`, `mask`, `network`, `broadcast`, `firstHost`, `lastHost`, `totalAddresses`, `usableHosts`.

- [ ] **Step 1: Write failing subnet tests**

Create `chrome-extension/tests/subnet.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIPv4, intToIPv4, parseCIDR, calculateSubnet } from '../lib/subnet.mjs';

test('round-trips IPv4 addresses', () => {
  assert.equal(intToIPv4(parseIPv4('192.168.10.25')), '192.168.10.25');
});

test('rejects invalid IPv4 octets', () => {
  assert.throws(() => parseIPv4('10.0.0.999'), /Invalid IPv4/);
  assert.throws(() => parseIPv4('10.0.0'), /Invalid IPv4/);
});

test('parses CIDR and rejects invalid prefixes', () => {
  assert.deepEqual(parseCIDR('10.20.47.130/24'), { ip: '10.20.47.130', prefix: 24 });
  assert.throws(() => parseCIDR('10.20.47.130/33'), /Invalid CIDR/);
});

test('calculates a normal /24 subnet', () => {
  assert.deepEqual(calculateSubnet('10.20.47.130/24'), {
    ip: '10.20.47.130',
    prefix: 24,
    mask: '255.255.255.0',
    network: '10.20.47.0',
    broadcast: '10.20.47.255',
    firstHost: '10.20.47.1',
    lastHost: '10.20.47.254',
    totalAddresses: 256,
    usableHosts: 254
  });
});

test('handles /31 and /32 without inventing broadcast-style usable ranges', () => {
  assert.equal(calculateSubnet('192.0.2.10/31').usableHosts, 2);
  assert.equal(calculateSubnet('192.0.2.10/32').usableHosts, 1);
});
```

- [ ] **Step 2: Run the tests and confirm failure**

```bash
node --test chrome-extension/tests/subnet.test.mjs
```

Expected: FAIL with module-not-found for `lib/subnet.mjs`.

- [ ] **Step 3: Implement deterministic subnet helpers**

Implement `chrome-extension/lib/subnet.mjs` using unsigned 32-bit arithmetic. Required behavior:

```js
export function parseIPv4(input) {
  const parts = String(input).trim().split('.');
  if (parts.length !== 4) throw new Error('Invalid IPv4 address');
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) throw new Error('Invalid IPv4 address');
    const octet = Number(part);
    if (octet < 0 || octet > 255) throw new Error('Invalid IPv4 address');
    value = ((value << 8) | octet) >>> 0;
  }
  return value >>> 0;
}

export function intToIPv4(value) {
  const v = Number(value) >>> 0;
  return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

export function parseCIDR(input) {
  const match = String(input).trim().match(/^(.+)\/(\d{1,2})$/);
  if (!match) throw new Error('Invalid CIDR');
  parseIPv4(match[1]);
  const prefix = Number(match[2]);
  if (prefix < 0 || prefix > 32) throw new Error('Invalid CIDR');
  return { ip: match[1], prefix };
}

export function calculateSubnet(input) {
  const { ip, prefix } = parseCIDR(input);
  const ipInt = parseIPv4(ip);
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);
  const usableHosts = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.max(totalAddresses - 2, 0);
  const firstHostInt = prefix >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastHostInt = prefix === 32 ? networkInt : prefix === 31 ? broadcastInt : (broadcastInt - 1) >>> 0;
  return {
    ip,
    prefix,
    mask: intToIPv4(maskInt),
    network: intToIPv4(networkInt),
    broadcast: intToIPv4(broadcastInt),
    firstHost: intToIPv4(firstHostInt),
    lastHost: intToIPv4(lastHostInt),
    totalAddresses,
    usableHosts
  };
}
```

- [ ] **Step 4: Run subnet tests**

```bash
node --test chrome-extension/tests/subnet.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit subnet core**

```bash
git add chrome-extension/lib/subnet.mjs chrome-extension/tests/subnet.test.mjs
git commit -m "feat(extension): add subnet calculation core"
```

---

### Task 3: DHCP CLI Generator Core

**Files:**
- Create: `chrome-extension/lib/dhcp.mjs`
- Create: `chrome-extension/tests/dhcp.test.mjs`

**Interfaces:**
- Consumes: IPv4 validation via `parseIPv4()` from `subnet.mjs`.
- Produces: `generateDhcpConfig(input) -> string`.
- Input object keys: `poolName`, `network`, `mask`, `defaultRouter`, `dnsServers`, `domainName`, `leaseDays`, `excludedRanges`.

- [ ] **Step 1: Write failing DHCP generator tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDhcpConfig } from '../lib/dhcp.mjs';

test('generates stable Cisco IOS DHCP configuration', () => {
  const output = generateDhcpConfig({
    poolName: 'VLAN47-USERS',
    network: '10.20.47.0',
    mask: '255.255.255.0',
    defaultRouter: '10.20.47.1',
    dnsServers: ['10.20.1.10', '8.8.8.8'],
    domainName: 'corp.local',
    leaseDays: 7,
    excludedRanges: [{ start: '10.20.47.1', end: '10.20.47.20' }]
  });

  assert.equal(output, [
    'ip dhcp excluded-address 10.20.47.1 10.20.47.20',
    '!',
    'ip dhcp pool VLAN47-USERS',
    ' network 10.20.47.0 255.255.255.0',
    ' default-router 10.20.47.1',
    ' dns-server 10.20.1.10 8.8.8.8',
    ' domain-name corp.local',
    ' lease 7',
    '!'
  ].join('\n'));
});

test('rejects missing pool names and malformed addresses', () => {
  assert.throws(() => generateDhcpConfig({ poolName: '' }), /Pool name/);
  assert.throws(() => generateDhcpConfig({
    poolName: 'BAD', network: '10.0.0.999', mask: '255.255.255.0', defaultRouter: '10.0.0.1'
  }), /Invalid IPv4/);
});
```

- [ ] **Step 2: Run the test and confirm failure**

```bash
node --test chrome-extension/tests/dhcp.test.mjs
```

Expected: FAIL because `lib/dhcp.mjs` does not exist.

- [ ] **Step 3: Implement the DHCP generator**

Create `chrome-extension/lib/dhcp.mjs` with explicit validation and deterministic line ordering:

```js
import { parseIPv4 } from './subnet.mjs';

function requireIPv4(value) {
  parseIPv4(value);
  return String(value).trim();
}

export function generateDhcpConfig(input = {}) {
  const poolName = String(input.poolName ?? '').trim();
  if (!poolName) throw new Error('Pool name is required');

  const network = requireIPv4(input.network);
  const mask = requireIPv4(input.mask);
  const defaultRouter = requireIPv4(input.defaultRouter);
  const dnsServers = Array.isArray(input.dnsServers)
    ? input.dnsServers.map(requireIPv4)
    : [];

  const exclusions = Array.isArray(input.excludedRanges) ? input.excludedRanges : [];
  const lines = [];

  for (const range of exclusions) {
    const start = requireIPv4(range.start);
    const end = range.end ? requireIPv4(range.end) : start;
    lines.push(start === end
      ? `ip dhcp excluded-address ${start}`
      : `ip dhcp excluded-address ${start} ${end}`);
  }

  if (lines.length) lines.push('!');
  lines.push(`ip dhcp pool ${poolName}`);
  lines.push(` network ${network} ${mask}`);
  lines.push(` default-router ${defaultRouter}`);
  if (dnsServers.length) lines.push(` dns-server ${dnsServers.join(' ')}`);

  const domainName = String(input.domainName ?? '').trim();
  if (domainName) lines.push(` domain-name ${domainName}`);

  const leaseDays = Number(input.leaseDays ?? 0);
  if (Number.isFinite(leaseDays) && leaseDays > 0) lines.push(` lease ${Math.floor(leaseDays)}`);
  lines.push('!');
  return lines.join('\n');
}
```

- [ ] **Step 4: Run DHCP tests**

```bash
node --test chrome-extension/tests/dhcp.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit DHCP core**

```bash
git add chrome-extension/lib/dhcp.mjs chrome-extension/tests/dhcp.test.mjs
git commit -m "feat(extension): add DHCP CLI generator"
```

---

### Task 4: Operations Log Generator Core

**Files:**
- Create: `chrome-extension/lib/logs.mjs`
- Create: `chrome-extension/tests/logs.test.mjs`

**Interfaces:**
- Produces: `formatOpsLog(input) -> string`.
- Input keys: `date`, `time`, `site`, `device`, `ticket`, `status`, `summary`, `action`, `owner`.

- [ ] **Step 1: Write failing log tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOpsLog } from '../lib/logs.mjs';

test('formats a compact deterministic NOC log', () => {
  assert.equal(formatOpsLog({
    date: '2026-09-18',
    time: '17:30',
    site: 'HQ',
    device: 'SW-CORE-01',
    ticket: 'INC-240918-01',
    status: 'Monitoring',
    summary: 'DHCP pool utilization high',
    action: 'Checked bindings and free addresses',
    owner: 'NOC'
  }), [
    '[2026-09-18 17:30] HQ / SW-CORE-01',
    'Ticket: INC-240918-01',
    'Status: Monitoring',
    'Issue: DHCP pool utilization high',
    'Action: Checked bindings and free addresses',
    'Owner: NOC'
  ].join('\n'));
});

test('omits optional empty fields but requires summary', () => {
  assert.equal(formatOpsLog({ date: '2026-09-18', time: '17:30', summary: 'Checked DHCP service' }),
    '[2026-09-18 17:30]\nIssue: Checked DHCP service');
  assert.throws(() => formatOpsLog({}), /Summary is required/);
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
node --test chrome-extension/tests/logs.test.mjs
```

Expected: FAIL because `lib/logs.mjs` does not exist.

- [ ] **Step 3: Implement formatter**

```js
function clean(value) {
  return String(value ?? '').trim();
}

export function formatOpsLog(input = {}) {
  const summary = clean(input.summary);
  if (!summary) throw new Error('Summary is required');

  const stamp = [clean(input.date), clean(input.time)].filter(Boolean).join(' ');
  const location = [clean(input.site), clean(input.device)].filter(Boolean).join(' / ');
  const head = [stamp ? `[${stamp}]` : '', location].filter(Boolean).join(' ');
  const lines = [];
  if (head) lines.push(head);
  if (clean(input.ticket)) lines.push(`Ticket: ${clean(input.ticket)}`);
  if (clean(input.status)) lines.push(`Status: ${clean(input.status)}`);
  lines.push(`Issue: ${summary}`);
  if (clean(input.action)) lines.push(`Action: ${clean(input.action)}`);
  if (clean(input.owner)) lines.push(`Owner: ${clean(input.owner)}`);
  return lines.join('\n');
}
```

- [ ] **Step 4: Run log tests**

```bash
node --test chrome-extension/tests/logs.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit log core**

```bash
git add chrome-extension/lib/logs.mjs chrome-extension/tests/logs.test.mjs
git commit -m "feat(extension): add operations log formatter"
```

---

### Task 5: Local Preference Storage Wrapper

**Files:**
- Create: `chrome-extension/lib/storage.mjs`
- Create: `chrome-extension/tests/storage.test.mjs`

**Interfaces:**
- Produces: `DEFAULT_STATE`, `loadState(storageArea?)`, `saveState(patch, storageArea?)`.
- State keys are exactly: `theme`, `lastModule`, `dhcpDraft`, `subnetDraft`, `logDraft`.

- [ ] **Step 1: Write failing storage tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, loadState, saveState } from '../lib/storage.mjs';

function fakeStorage(seed = {}) {
  const db = { ...seed };
  return {
    async get() { return { ...db }; },
    async set(value) { Object.assign(db, value); },
    snapshot() { return { ...db }; }
  };
}

test('fills missing values from defaults', async () => {
  const storage = fakeStorage({ theme: 'cyber' });
  const state = await loadState(storage);
  assert.equal(state.theme, 'cyber');
  assert.equal(state.lastModule, 'dhcp');
});

test('saves only allowed state keys', async () => {
  const storage = fakeStorage();
  await saveState({ theme: 'gold', lastModule: 'logs', password: 'secret' }, storage);
  assert.deepEqual(storage.snapshot(), { theme: 'gold', lastModule: 'logs' });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
node --test chrome-extension/tests/storage.test.mjs
```

Expected: FAIL because `lib/storage.mjs` does not exist.

- [ ] **Step 3: Implement storage wrapper with explicit allowlist**

```js
export const DEFAULT_STATE = Object.freeze({
  theme: 'gold',
  lastModule: 'dhcp',
  dhcpDraft: {},
  subnetDraft: {},
  logDraft: {}
});

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_STATE));

function resolveStorage(storageArea) {
  if (storageArea) return storageArea;
  if (!globalThis.chrome?.storage?.local) throw new Error('chrome.storage.local is unavailable');
  return globalThis.chrome.storage.local;
}

export async function loadState(storageArea) {
  const storage = resolveStorage(storageArea);
  const saved = await storage.get(Object.keys(DEFAULT_STATE));
  return { ...DEFAULT_STATE, ...saved };
}

export async function saveState(patch, storageArea) {
  const storage = resolveStorage(storageArea);
  const safe = {};
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (ALLOWED_KEYS.has(key)) safe[key] = value;
  }
  if (Object.keys(safe).length) await storage.set(safe);
  return safe;
}
```

- [ ] **Step 4: Run storage tests**

```bash
node --test chrome-extension/tests/storage.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit persistence layer**

```bash
git add chrome-extension/lib/storage.mjs chrome-extension/tests/storage.test.mjs
git commit -m "feat(extension): add safe local preference storage"
```

---

### Task 6: Toolbar Popup and Keyboard Command

**Files:**
- Create: `chrome-extension/popup.html`
- Create: `chrome-extension/popup.css`
- Create: `chrome-extension/popup.js`
- Create: `chrome-extension/background.js`

**Interfaces:**
- Consumes: `loadState()` / `saveState()` from `lib/storage.mjs`.
- Popup module buttons map to `app.html#dhcp`, `app.html#subnet`, `app.html#logs`.
- Production action opens exactly `https://dhcp-automation-pro.vercel.app/#dhcp`.

- [ ] **Step 1: Create semantic popup markup without inline JavaScript**

`popup.html` must contain:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DHCP Mission Control</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body data-theme="gold">
  <main class="popup-shell">
    <header class="brand-row">
      <div class="brand-mark" aria-hidden="true">D</div>
      <div>
        <p class="eyebrow">NETWORK OPS TOOLKIT</p>
        <h1>DHCP Mission Control</h1>
      </div>
      <span class="status-pill" id="statusPill">LOCAL</span>
    </header>

    <section class="module-grid" aria-label="Quick tools">
      <button class="module-card" data-module="dhcp"><strong>DHCP Generator</strong><span>Build Cisco IOS pool config</span></button>
      <button class="module-card" data-module="subnet"><strong>Subnet Calculator</strong><span>IPv4 / CIDR analysis</span></button>
      <button class="module-card" data-module="logs"><strong>Log Generator</strong><span>Create clean NOC notes</span></button>
    </section>

    <div class="theme-row" aria-label="Theme">
      <button data-theme-choice="gold" class="theme-choice">Gold Cyber</button>
      <button data-theme-choice="cyber" class="theme-choice">Blue Cyber</button>
    </div>

    <button id="openFull" class="primary-action">OPEN FULL MISSION CONTROL</button>
    <button id="openWeb" class="secondary-action">OPEN WEB APP</button>
    <p class="last-used">Last module: <span id="lastModule">DHCP</span></p>
  </main>
  <script type="module" src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: Implement popup visual system**

`popup.css` must use system fonts only, fixed popup width around `390px`, near-black background, glass cards, CSS variables for both themes, visible `:focus-visible` outlines, and `@media (prefers-reduced-motion: reduce)` that disables transitions/animations.

- [ ] **Step 3: Implement popup behavior**

`popup.js` must:

```js
import { loadState, saveState } from './lib/storage.mjs';

const APP_URL = 'https://dhcp-automation-pro.vercel.app/#dhcp';
const labels = { dhcp: 'DHCP', subnet: 'Subnet', logs: 'Logs' };

function openLocal(module) {
  const url = chrome.runtime.getURL(`app.html#${module}`);
  return chrome.tabs.create({ url });
}

const state = await loadState().catch(() => ({ theme: 'gold', lastModule: 'dhcp' }));
document.body.dataset.theme = state.theme;
document.querySelector('#lastModule').textContent = labels[state.lastModule] ?? 'DHCP';

document.querySelectorAll('[data-module]').forEach((button) => {
  button.addEventListener('click', async () => {
    const module = button.dataset.module;
    await saveState({ lastModule: module }).catch(() => {});
    await openLocal(module);
  });
});

document.querySelectorAll('[data-theme-choice]').forEach((button) => {
  button.addEventListener('click', async () => {
    const theme = button.dataset.themeChoice;
    document.body.dataset.theme = theme;
    await saveState({ theme }).catch(() => {});
  });
});

document.querySelector('#openFull').addEventListener('click', () => openLocal(state.lastModule ?? 'dhcp'));
document.querySelector('#openWeb').addEventListener('click', () => chrome.tabs.create({ url: APP_URL }));
```

- [ ] **Step 4: Implement service worker**

`background.js` must initialize defaults on install and open `app.html#dhcp` for the command:

```js
import { DEFAULT_STATE } from './lib/storage.mjs';

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  const missing = {};
  for (const [key, value] of Object.entries(DEFAULT_STATE)) {
    if (current[key] === undefined) missing[key] = value;
  }
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-mission-control') return;
  await chrome.tabs.create({ url: chrome.runtime.getURL('app.html#dhcp') });
});
```

- [ ] **Step 5: Re-run CSP and manifest tests**

```bash
node --test chrome-extension/tests/manifest.test.mjs chrome-extension/tests/csp.test.mjs chrome-extension/tests/storage.test.mjs
```

Expected: PASS with no remote references or inline handlers.

- [ ] **Step 6: Commit popup and service worker**

```bash
git add chrome-extension/popup.html chrome-extension/popup.css chrome-extension/popup.js chrome-extension/background.js
git commit -m "feat(extension): add toolbar launcher and keyboard command"
```

---

### Task 7: Full Local Mission Control App

**Files:**
- Create: `chrome-extension/app.html`
- Create: `chrome-extension/app.css`
- Create: `chrome-extension/app.js`

**Interfaces:**
- Consumes: `generateDhcpConfig()`, `calculateSubnet()`, `formatOpsLog()`, `loadState()`, `saveState()`.
- Hash router accepts `dhcp`, `subnet`, `logs`; all other values normalize to `dhcp`.

- [ ] **Step 1: Build full-page shell and three panels**

`app.html` must provide:

```html
<nav class="topbar" aria-label="Mission Control modules">
  <a class="brand" href="#dhcp">DHCP Mission Control</a>
  <div class="nav-tabs">
    <a href="#dhcp" data-route="dhcp">DHCP Generator</a>
    <a href="#subnet" data-route="subnet">Subnet Calculator</a>
    <a href="#logs" data-route="logs">Log Generator</a>
  </div>
  <button id="themeToggle" type="button">Switch Theme</button>
</nav>
```

and three `<section data-panel="...">` panels with explicit labeled form fields and `<pre>` output areas. DHCP fields: pool name, network, mask, default router, DNS servers, domain name, lease days, one exclusion start/end. Subnet fields: CIDR input. Log fields: date, time, site, device, ticket, status, summary, action, owner. Every generator panel must include Generate/Calculate and Copy buttons plus an `.error-box[role="alert"]`.

- [ ] **Step 2: Implement the local visual system**

`app.css` must include:

- CSS variables for `body[data-theme="gold"]` and `body[data-theme="cyber"]`.
- dark gradient background and subtle grid using CSS gradients only.
- glass panel borders/backgrounds.
- responsive two-column desktop layout and one-column layout below `900px`.
- terminal output with `ui-monospace, SFMono-Regular, Consolas, monospace`.
- strong keyboard focus states.
- `@media (prefers-reduced-motion: reduce)` disabling ambient movement.

- [ ] **Step 3: Implement hash routing and module integration**

`app.js` must use these imports:

```js
import { generateDhcpConfig } from './lib/dhcp.mjs';
import { calculateSubnet } from './lib/subnet.mjs';
import { formatOpsLog } from './lib/logs.mjs';
import { loadState, saveState } from './lib/storage.mjs';
```

Use this route contract:

```js
const VALID_ROUTES = new Set(['dhcp', 'subnet', 'logs']);

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
  });
  saveState({ lastModule: route }).catch(() => {});
}
```

Wire each form to its pure module. Catch thrown validation errors and render `error.message` inside the current panel's error box. Clear the error on successful generation.

- [ ] **Step 4: Implement resilient copy behavior**

Use a shared helper:

```js
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
```

- [ ] **Step 5: Persist theme and non-sensitive drafts**

On startup call `loadState()`, apply `theme`, populate any available draft values, and then call `applyRoute()`. Save draft objects on `change`/`input` with a short 250 ms debounce. Store only the fields described in the spec; do not store credentials or network-authentication secrets.

- [ ] **Step 6: Run all Node tests and static CSP audit**

```bash
node --test chrome-extension/tests/*.test.mjs
```

Expected: all tests PASS; CSP audit sees `popup.html` and `app.html` and reports no remote script/style references.

- [ ] **Step 7: Commit the full local app**

```bash
git add chrome-extension/app.html chrome-extension/app.css chrome-extension/app.js
git commit -m "feat(extension): add full local Mission Control app"
```

---

### Task 8: Icons, Documentation, Packaging, and Final Verification

**Files:**
- Create: `scripts/generate-extension-icons.py`
- Create: `scripts/package-chrome-extension.py`
- Generate: `chrome-extension/icons/icon16.png`
- Generate: `chrome-extension/icons/icon32.png`
- Generate: `chrome-extension/icons/icon48.png`
- Generate: `chrome-extension/icons/icon128.png`
- Generate: `chrome-extension/icons/icon512.png`
- Create: `chrome-extension/README.md`

**Interfaces:**
- Produces: deterministic PNG assets and `dist/dhcp-mission-control-extension.zip`.

- [ ] **Step 1: Add a dependency-free PNG icon generator**

Create `scripts/generate-extension-icons.py` using only `struct`, `zlib`, and `pathlib`. It must render a square RGBA image with near-black background, cyan outer border, gold inner `D` glyph built from rectangles, and write PNG chunks (`IHDR`, `IDAT`, `IEND`) for sizes `16, 32, 48, 128, 512`.

Core PNG writer contract:

```python
import struct, zlib
from pathlib import Path

SIZES = (16, 32, 48, 128, 512)
OUT = Path('chrome-extension/icons')


def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)


def write_png(path: Path, size: int, rows: list[bytes]) -> None:
    raw = b''.join(b'\x00' + row for row in rows)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)
```

The rendering loop must calculate pixels directly and must not import Pillow or any external imaging library.

- [ ] **Step 2: Generate and verify icons**

```bash
python scripts/generate-extension-icons.py
```

Expected: all five PNG files exist and each starts with the PNG signature `89 50 4E 47 0D 0A 1A 0A`.

- [ ] **Step 3: Write extension README**

`chrome-extension/README.md` must include:

1. `chrome://extensions` installation steps.
2. Enable Developer mode.
3. Choose **Load unpacked** and select the `chrome-extension` folder.
4. Pin the extension.
5. Popup usage.
6. Full Mission Control usage.
7. Shortcut: `Ctrl+Shift+D` / `Command+Shift+D`.
8. Privacy statement: all tool data remains in `chrome.storage.local`; no credentials are stored.
9. Production web app link text: `https://dhcp-automation-pro.vercel.app/#dhcp`.
10. Packaging command below.

- [ ] **Step 4: Add deterministic ZIP packager**

Create `scripts/package-chrome-extension.py` using `zipfile` and `pathlib`:

```python
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path('chrome-extension')
DIST = Path('dist')
OUTPUT = DIST / 'dhcp-mission-control-extension.zip'
EXCLUDED_PARTS = {'tests', '__pycache__'}

DIST.mkdir(exist_ok=True)
with ZipFile(OUTPUT, 'w', ZIP_DEFLATED) as zf:
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        zf.write(path, rel.as_posix())
print(OUTPUT)
```

- [ ] **Step 5: Run automated verification**

```bash
node --test chrome-extension/tests/*.test.mjs
python scripts/generate-extension-icons.py
python scripts/package-chrome-extension.py
```

Expected: all Node tests PASS and `dist/dhcp-mission-control-extension.zip` is created.

- [ ] **Step 6: Inspect ZIP contents**

Run:

```bash
python - <<'PY'
from zipfile import ZipFile
with ZipFile('dist/dhcp-mission-control-extension.zip') as zf:
    names = zf.namelist()
    required = {
        'manifest.json', 'background.js', 'popup.html', 'popup.css', 'popup.js',
        'app.html', 'app.css', 'app.js', 'lib/dhcp.mjs', 'lib/subnet.mjs',
        'lib/logs.mjs', 'lib/storage.mjs', 'icons/icon128.png'
    }
    missing = required - set(names)
    assert not missing, missing
    assert all(not name.startswith('tests/') for name in names)
    print(f'{len(names)} packaged files OK')
PY
```

Expected: prints packaged file count and `OK` with no assertion error.

- [ ] **Step 7: Manual Chrome verification**

Verify exactly this checklist:

1. `chrome://extensions` → Developer mode → Load unpacked → `chrome-extension/`.
2. No extension errors appear.
3. Toolbar icon opens popup.
4. Gold Cyber and Blue Cyber both render and persist after reopening popup.
5. DHCP button opens `app.html#dhcp`.
6. Subnet button opens `app.html#subnet`.
7. Log button opens `app.html#logs`.
8. Invalid CIDR displays inline error and no partial result.
9. DHCP sample generates deterministic IOS CLI and copy works.
10. Log sample generates formatted text and copy works.
11. Reloading Chrome preserves theme and last module.
12. `Ctrl+Shift+D` opens full Mission Control on Windows/Linux; `Command+Shift+D` does so on macOS if Chrome has not reserved the shortcut.
13. OPEN WEB APP opens `https://dhcp-automation-pro.vercel.app/#dhcp`.
14. DevTools console shows no Manifest V3 CSP violations.

- [ ] **Step 8: Commit packaging and documentation**

```bash
git add chrome-extension/icons chrome-extension/README.md scripts/generate-extension-icons.py scripts/package-chrome-extension.py
git commit -m "feat(extension): add icons docs and packaging"
```

---

## Final Quality Gate

Run from repository root:

```bash
node --test chrome-extension/tests/*.test.mjs
python scripts/generate-extension-icons.py
python scripts/package-chrome-extension.py
```

Then inspect Git status:

```bash
git status --short
```

Expected: no unexpected generated files except the intentionally untracked `dist/` artifact if `dist/` is excluded from version control.

Review the branch diff against `main` and confirm the existing website files (`index.html`, `scroll-fix.css`, existing `scripts/*`) were not modified by this feature unless a later explicit requirement changes scope.

## Spec Coverage Self-Review

- Toolbar popup: Task 6.
- Full extension app with `#dhcp/#subnet/#logs`: Task 7.
- Gold Cyber / Blue Cyber: Tasks 6–7.
- Local-only core tools: Tasks 2–4 and 7.
- `chrome.storage.local`: Task 5 and UI integration in Tasks 6–7.
- Keyboard shortcut: Tasks 1 and 6.
- Minimum permissions / no `<all_urls>`: Task 1.
- No remote code / Manifest V3 CSP compatibility: Tasks 1, 6, 7.
- Copy fallback: Task 7.
- Unknown hash normalization: Task 7.
- Reduced motion: Tasks 6–7.
- PNG icons: Task 8.
- Manual-install README: Task 8.
- ZIP distribution artifact: Task 8.
- Tests for subnet, DHCP, logs, storage, manifest, CSP: Tasks 1–5.
- Existing Vercel app remains unchanged: enforced by Final Quality Gate.

No design requirement remains without an implementation task.