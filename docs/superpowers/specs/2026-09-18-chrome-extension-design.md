# DHCP Mission Control Chrome Extension Design

## Goal

Build a Manifest V3 Chrome Extension for DHCP Mission Control & Log Generator that gives fast access to DHCP Generator, Subnet Calculator, and Log Generator workflows from the Chrome toolbar while keeping a full-page Mission Control experience available inside the extension.

## Scope

The extension will live under `chrome-extension/` in the existing `dhcp-automation-pro` repository. It will be installable with Chrome's **Load unpacked** workflow and structured so it can later be prepared for Chrome Web Store submission.

The existing production web app remains available at `https://dhcp-automation-pro.vercel.app/#dhcp`. The extension will not replace the website; it will provide a local-first companion UI and quick access back to production.

## Product Experience

### Toolbar Popup

Clicking the extension icon opens a compact Mission Control popup with:

- DHCP Generator quick action
- Subnet Calculator quick action
- Log Generator quick action
- `OPEN FULL MISSION CONTROL` action
- `OPEN WEB APP` action
- Gold Cyber / Blue Cyber theme toggle
- `ONLINE` / `LOCAL` status indicator
- Last-used module indicator

The popup is intentionally a launcher and fast-action surface rather than a miniature copy of the full application.

### Full Extension App

`chrome-extension://<extension-id>/app.html#dhcp` opens a full-page extension UI with three modules:

- `#dhcp` — DHCP Generator
- `#subnet` — Subnet Calculator
- `#logs` — Log Generator

The full app provides the same visual language as the existing Mission Control site: dark glass panels, gold/cyan cyber accents, terminal-style output, and strong focus states.

### Persistence

Use `chrome.storage.local` for:

- selected theme
- last opened module
- last-used non-sensitive form values
- user preferences

No credentials, tokens, passwords, or private network authentication material are stored.

## Architecture

### `chrome-extension/manifest.json`

Manifest V3 configuration. It declares the popup, service worker, extension icons, storage permission, commands, and only the minimum host permissions required for opening the production web app.

### `chrome-extension/popup.html`

Static popup markup. No inline JavaScript and no remote assets.

### `chrome-extension/popup.css`

Popup-only visual system using local CSS. It mirrors the Cyber Gold / Cyber Blue design language without loading Google Fonts, Tailwind CDN, or Lucide CDN.

### `chrome-extension/popup.js`

Controls popup navigation, theme state, status text, keyboard-accessible actions, storage synchronization, and opening the full app or production website.

### `chrome-extension/app.html`

Full-page extension shell with module navigation, hash routing, forms, output panels, and copy actions.

### `chrome-extension/app.css`

Full-page local styles. All styling must remain compatible with Manifest V3 CSP and must not depend on externally hosted CSS or scripts.

### `chrome-extension/app.js`

Owns hash routing and UI integration. Domain calculations are imported from focused local modules rather than embedded as one large script.

### `chrome-extension/lib/dhcp.js`

Pure DHCP configuration-generation functions. Accepts validated structured input and returns generated CLI/output strings.

### `chrome-extension/lib/subnet.js`

Pure IPv4/CIDR parsing and subnet calculation utilities.

### `chrome-extension/lib/logs.js`

Pure log-formatting functions used by the Log Generator.

### `chrome-extension/lib/storage.js`

Thin wrapper around `chrome.storage.local` with defaults and explicit keys.

### `chrome-extension/background.js`

Manifest V3 service worker. Handles install initialization and the keyboard command that opens the full extension application.

### `chrome-extension/icons/`

Local PNG icons at 16, 32, 48, 128, and 512 pixels.

### `chrome-extension/README.md`

Installation instructions, keyboard shortcut information, architecture notes, and packaging steps.

## Data Flow

1. User opens popup.
2. `popup.js` loads theme and last module from `chrome.storage.local`.
3. Selecting a module opens `app.html#<module>`.
4. `app.js` reads the hash and renders/activates the matching module.
5. Form values are validated in the UI layer.
6. Pure domain modules generate DHCP CLI, subnet results, or formatted logs.
7. User can copy generated output through the Clipboard API.
8. Non-sensitive preferences are persisted locally.

## Manifest V3 / CSP Requirements

The extension must not execute remote code.

Specifically:

- no `https://cdn.tailwindcss.com`
- no remote Lucide script
- no Google Fonts dependency
- no `eval()` or dynamic code execution
- no inline JavaScript event handlers
- JavaScript loaded only from packaged extension files
- CSS loaded only from packaged extension files

This is a deliberate divergence from the current web page, which currently loads remote Tailwind, Lucide, and Google Fonts resources.

## Permissions

Use the minimum permission set:

- `storage`

The extension can open the public production URL with `chrome.tabs.create()` without requesting broad host access. No `<all_urls>` permission is allowed.

## Keyboard Shortcut

Expose a command named `open-mission-control` with a suggested shortcut of:

- Windows/Linux: `Ctrl+Shift+D`
- macOS: `Command+Shift+D`

The service worker opens `app.html#dhcp` when the command runs.

## Error Handling

- Invalid IPv4/CIDR inputs display an inline validation message and never generate partial output.
- Copy failures fall back to selecting output and displaying a clear copy instruction.
- Storage read failures fall back to safe defaults without blocking core generation tools.
- Unknown hashes redirect to `#dhcp`.
- Popup actions remain usable even if the production website is offline because core tools are packaged locally.

## Testing Strategy

Tests are dependency-light and run with Node's built-in test runner where possible.

Required coverage:

- subnet parsing and CIDR edge cases
- DHCP generator deterministic output
- log formatter deterministic output
- storage default-object behavior using a mocked `chrome.storage.local`
- manifest validation for Manifest V3, required files, and forbidden broad permissions
- static CSP audit that fails if extension HTML references remote scripts/styles

Manual verification:

1. Load `chrome-extension/` through `chrome://extensions` → Developer mode → Load unpacked.
2. Open popup and switch Gold/Cyber themes.
3. Open each module.
4. Generate and copy sample output.
5. Reload Chrome and confirm saved theme/module state.
6. Trigger the keyboard shortcut.
7. Open production web app from the popup.
8. Inspect extension errors and confirm no CSP violations.

## Visual Direction

The extension retains the Mission Control identity already present in the website:

- near-black base
- Gold Cyber default theme
- optional Blue Cyber theme
- glass panels
- thin luminous borders
- mono terminal output
- restrained ambient glow
- readable high-contrast form controls

Animations must remain subtle and lightweight in the popup. The full app can use richer ambient effects but must honor `prefers-reduced-motion`.

## Non-Goals for Version 1

- authenticating to DHCP/network appliances
- sending SSH/Telnet/API commands directly to routers or switches
- cloud sync
- user accounts
- background network scanning
- `<all_urls>` access
- replacing the Vercel deployment

## Deliverables

- complete `chrome-extension/` folder
- Manifest V3 configuration
- popup launcher
- full local Mission Control app
- DHCP/Subnet/Log domain modules
- local persistence
- keyboard shortcut
- extension icons
- tests
- extension README
- packaged ZIP suitable for manual installation/distribution
