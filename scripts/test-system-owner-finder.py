from pathlib import Path
import base64
import gzip

index = Path('index.html').read_text(encoding='utf-8')
generator = Path('scripts/add-system-owner-finder.py').read_text(encoding='utf-8')
finder_path = Path('system-owner-finder.html')
voip_path = Path('voip-finder.html')
assert finder_path.exists(), 'system-owner-finder.html must be bundled with the app'
assert voip_path.exists(), 'voip-finder.html must be bundled with the app'
loader = finder_path.read_text(encoding='utf-8')
voip_loader = voip_path.read_text(encoding='utf-8')

required_index = [
    'id="utilityToolsDock"',
    'id="utilityToolsToggle"',
    'id="utilityToolsMenu"',
    'aria-expanded="false"',
    '/* utility-tools-dock-v1 */',
    'function setUtilityToolsOpen(',
    'function toggleUtilityTools(',
    'function closeUtilityToolsOnOutside(',
    'id="tab-system-owner"',
    'FIND SYSTEM OWNER',
    "switchTab('system-owner')",
    'id="tab-voip"',
    'VOIP Finder',
    "switchTab('voip')",
    'id="view-system-owner"',
    'id="systemOwnerFinderFrame"',
    'src="system-owner-finder.html"',
    'id="view-voip"',
    'id="voipFinderFrame"',
    'src="voip-finder.html"',
    'function syncSystemOwnerFinderTheme(',
    'function syncVoipFinderTheme(',
    'function parseOwnerContact(',
    'data-owner-copy="prefix"',
    'data-owner-copy="name"',
    'data-owner-copy="phone"',
    'data-owner-copy="email"',
]
for needle in required_index:
    assert needle in index, f'missing hidden utility dock integration: {needle}'

for needle in ['utility-tools-dock-v1', 'utilityToolsDock', 'utilityToolsToggle', 'utilityToolsMenu', 'setUtilityToolsOpen', 'toggleUtilityTools']:
    assert needle in generator, f'generator must preserve hidden utility dock behavior: {needle}'

assert 'id="btnSystemOwnerFinder"' not in index, 'old inline System Owner Finder button must be removed from Generate Log traffic'
assert 'id="systemOwnerFinderPanel"' not in index, 'old inline System Owner Finder panel must be removed from Generate Log traffic'

uih_pos = index.find('id="tab-uih"')
dock_pos = index.find('id="utilityToolsDock"')
menu_pos = index.find('id="utilityToolsMenu"')
owner_pos = index.find('id="tab-system-owner"')
voip_pos = index.find('id="tab-voip"')
assert 0 <= uih_pos < dock_pos < menu_pos < owner_pos < voip_pos, 'Utility dock must replace direct System Owner and VOIP topbar tabs after Generate Log UIh'
menu_end = index.find('</div>', menu_pos)
assert menu_end > voip_pos, 'System Owner and VOIP actions must live inside the hidden utility menu'
assert "document.addEventListener('pointerdown',closeUtilityToolsOnOutside" in index, 'outside pointer interaction must close the utility menu'
assert "event.key==='Escape'" in index, 'Escape must close the utility menu'
assert "setUtilityToolsOpen(false);switchTab('system-owner')" in index, 'System Owner action must close the dock and preserve existing tab navigation'
assert "setUtilityToolsOpen(false);switchTab('voip')" in index, 'VOIP action must close the dock and preserve existing tab navigation'

payload_paths = [Path(f'assets/system-owner-finder-payload-{i:02d}.txt') for i in range(1, 8)]
for payload_path in payload_paths:
    assert payload_path.exists(), f'missing compressed TOR Finder payload: {payload_path}'
    assert payload_path.name in loader, f'loader must fetch {payload_path.name}'

payload_b64 = ''.join(path.read_text(encoding='ascii').strip() for path in payload_paths)
finder = gzip.decompress(base64.b64decode(payload_b64)).decode('utf-8')

required_finder = [
    'TOR SYSTEM FINDER',
    'Analyze System',
    'Import Excel',
    'CONTACT ROUTING',
    'const BUNDLED_TOR=',
    'function findMatches(',
    'async function parseTorXlsx(',
    "window.addEventListener('message'",
    "event.data?.type === 'dhcp-theme'",
    'document.body.dataset.theme',
]
for needle in required_finder:
    assert needle in finder, f'missing source TOR Finder behavior/theme bridge: {needle}'

assert '--accent:' in finder and '--accentRgb:' in finder, 'finder must expose parent-theme compatible accent variables'
assert 'body[data-theme="gold"]' in finder and 'body[data-theme="cyber"]' in finder, 'finder must support GOLD and CYBER theme envelopes'
assert 'target="_blank"' in finder, 'existing endpoint links must remain independently openable'
assert "DecompressionStream('gzip')" in loader, 'loader must restore the bundled source locally in browser'
for needle in ['owner-split-copy', 'OWNER QUICK COPY', 'PREFIX', 'NAME', 'PHONE', 'EMAIL']:
    assert needle in loader, f'missing contact split/copy enhancement: {needle}'

voip_payload_paths = [Path(f'assets/voip-finder-payload-{i:02d}.txt') for i in range(1, 9)]
for payload_path in voip_payload_paths:
    assert payload_path.exists(), f'missing VOIP Finder payload: {payload_path}'
    assert payload_path.name in voip_loader, f'VOIP loader must fetch {payload_path.name}'
voip_payload_b64 = ''.join(path.read_text(encoding='ascii').strip() for path in voip_payload_paths)
voip_source = gzip.decompress(base64.b64decode(voip_payload_b64)).decode('utf-8')
for needle in ['VOIP Finder', 'หัวข้อใหญ่', 'พื้นที่ / หน่วยงาน', 'VOIP', '1090']:
    assert needle in voip_source, f'missing source VOIP Finder content: {needle}'
for needle in ['data-theme="gold"', 'dhcp-theme', "DecompressionStream('gzip')", "type:'voip-ready'"]:
    assert needle in voip_loader, f'missing VOIP Finder loader/theme behavior: {needle}'

print('hidden utility dock + System Owner + VOIP integration: OK')