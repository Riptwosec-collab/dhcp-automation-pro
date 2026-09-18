# DHCP Mission Control — Chrome Extension

Manifest V3 launcher for **DHCP Mission Control & Log Generator**.

Version 1.0.1 changes the primary extension behavior so the toolbar icon and keyboard shortcut open the exact production Mission Control UI instead of a separately designed clone. The local extension app is still packaged as an offline fallback, but it is no longer the default surface.

## Install with Load unpacked

1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `chrome-extension` folder.
5. Pin **DHCP Mission Control** from Chrome's Extensions menu.

## Primary behavior

Click the extension icon to open the production UI:

`https://dhcp-automation-pro.vercel.app/#dhcp`

Because this is the same production page, the layout, fields, Gold/Cyber themes, DHCP Generator, Subnet Calculator, and Generate Log traffic screens are the same as the web version.

## Keyboard shortcut

- Windows / Linux: `Ctrl+Shift+D`
- macOS: `Command+Shift+D`

The shortcut opens the same production Mission Control UI. Chrome may reserve or remap shortcuts; review them at `chrome://extensions/shortcuts`.

## Offline fallback

The package still includes the local extension files (`app.html`, local CSS/JS, DHCP/Subnet/Log modules) for offline/manual fallback use. They are intentionally not the default toolbar experience because the production page is the visual source of truth.

## Privacy

The launcher does not inject scripts into the production page and requests no broad host permission. The extension permission set remains limited to `storage`. Local fallback preferences remain in `chrome.storage.local`; credentials, passwords, and authentication tokens are not stored.

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
