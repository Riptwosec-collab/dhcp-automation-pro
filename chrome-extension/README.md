# DHCP Mission Control — Chrome Extension

A local-first Manifest V3 companion for **DHCP Mission Control & Log Generator**. The extension provides quick access to a DHCP configuration generator, IPv4/CIDR subnet calculator, and NOC log formatter without requiring a network-device connection.

## Install with Load unpacked

1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode** in the upper-right corner.
3. Choose **Load unpacked**.
4. Select the `chrome-extension` folder from this repository.
5. Pin **DHCP Mission Control** from Chrome's Extensions menu for quick access.

## Popup usage

Click the extension icon to open the compact Mission Control launcher. From the popup you can open **DHCP Generator**, **Subnet Calculator**, or **Log Generator**, switch between **Gold** and **Cyber** themes, open the full local application, or launch the production web app.

## Full Mission Control

The full extension app uses three local routes:

- `app.html#dhcp` — Cisco IOS DHCP pool configuration
- `app.html#subnet` — IPv4/CIDR calculation
- `app.html#logs` — NOC operational log formatting

Invalid routes automatically normalize to `#dhcp`.

## Keyboard shortcut

- Windows / Linux: `Ctrl+Shift+D`
- macOS: `Command+Shift+D`

Chrome may reserve or remap shortcuts. You can review extension shortcuts at `chrome://extensions/shortcuts`.

## Privacy

Tool preferences and non-sensitive drafts remain in `chrome.storage.local`. The extension does **not** store credentials, passwords, authentication tokens, or private network authentication material. Core DHCP, subnet, and log generation runs locally inside the extension.

## Production web app

The existing hosted application remains available at:

`https://dhcp-automation-pro.vercel.app/#dhcp`

## Run tests

From the repository root:

```bash
node --test chrome-extension/tests/*.test.mjs
```

## Generate icons

```bash
python scripts/generate-extension-icons.py
```

## Package ZIP

```bash
python scripts/package-chrome-extension.py
```

The package is written to `dist/dhcp-mission-control-extension.zip`. Test files are excluded from the distributable ZIP.
