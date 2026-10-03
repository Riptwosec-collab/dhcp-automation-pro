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
    'id="tab-system-owner"',
    'FIND SYSTEM OWNER',
    'href="system-owner-finder.html"',
    'target="_blank"',
    'rel="noopener noreferrer"',
    'id="tab-voip"',
    'VOIP Finder',
    'href="voip-finder.html"',
    'function positionUtilityToolsMenu(',
    'function setUtilityToolsOpen(',
    'function toggleUtilityTools(',
    'function closeUtilityToolsOnOutside(',
]
for needle in required_index:
    assert needle in index, f'missing standalone Utility Dock integration: {needle}'

for needle in ['utilityToolsDock', 'positionUtilityToolsMenu', 'system-owner-finder.html', 'voip-finder.html']:
    assert needle in generator, f'generator must preserve standalone Utility Dock integration: {needle}'

# Finder tools must no longer be embedded as hidden workspace views/iframes.
for needle in [
    'id="view-system-owner"',
    'id="systemOwnerFinderFrame"',
    'id="view-voip"',
    'id="voipFinderFrame"',
    "switchTab('system-owner')",
    "switchTab('voip')",
]:
    assert needle not in index, f'finder must be standalone instead of embedded in main workspace: {needle}'

for needle in [
    'id="view-system-owner"',
    'id="systemOwnerFinderFrame"',
    'id="view-voip"',
    'id="voipFinderFrame"',
]:
    assert needle not in generator, f'generator must not restore embedded finder views: {needle}'

assert 'onclick="switchTab(\'system-owner\')" id="tab-system-owner"' not in index, 'System Owner must not remain a direct topbar tab'
assert 'onclick="switchTab(\'voip\')" id="tab-voip"' not in index, 'VOIP Finder must not remain a direct topbar tab'
assert 'href="system-owner-finder.html" target="_blank" rel="noopener noreferrer"' in index, 'System Owner must open in a secure new tab'
assert 'href="voip-finder.html" target="_blank" rel="noopener noreferrer"' in index, 'VOIP Finder must open in a secure new tab'
assert 'id="btnSystemOwnerFinder"' not in index, 'old inline System Owner Finder button must stay removed from Generate Log traffic'
assert 'id="systemOwnerFinderPanel"' not in index, 'old inline System Owner Finder panel must stay removed from Generate Log traffic'

uih_pos = index.find('id="tab-uih"')
nav_end = index.find('</nav>', uih_pos)
dock_pos = index.find('id="utilityToolsDock"')
brand_pos = index.find('class="brand-block"', dock_pos)
assert 0 <= uih_pos < nav_end < dock_pos < brand_pos, 'Utility Dock must sit after the main navigation and before the DHCP brand block'

assert '.utility-tools-menu{position:fixed;' in index, 'Utility menu must escape topbar overflow using fixed positioning'
assert 'positionUtilityToolsMenu();' in index, 'Utility menu must anchor to the visible toggle when opened'
assert "window.addEventListener('resize'" in index and 'positionUtilityToolsMenu()' in index, 'Utility menu must reposition on viewport changes'

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

# Operations Messages must live on the standalone VOIP page and use live client time.
required_operations = [
    'operations-messages-v1',
    'id="operationsMessages"',
    'Alerts & Incidents',
    'Standard Operations',
    'Device Hang',
    'ไม่สามารถติดต่อเจ้าหน้าที่ได้',
    'วงจรกลับมาปกติ',
    'ปิดระบบ 10 นาที',
    'ครบ 10 นาที',
    'ไฟฟ้าดับ / Log reboot - ตรวจสอบ',
    'ไฟฟ้าดับ - แก้ไข',
    'function formatOperationsNow(',
    'function renderOperationsNow(',
    'function operationText(',
    'function copyOperationMessage(',
    'new Date()',
    'data-op-time',
]
for needle in required_operations:
    assert needle in voip_loader, f'missing standalone VOIP operations feature: {needle}'

# Avoid shipping the screenshot sample timestamps as fixed runtime values.
for stale_time in ['20.49', '08.30', '20.59']:
    assert stale_time not in voip_loader, f'operations timestamps must be generated at runtime, not hard-coded: {stale_time}'

print('standalone Finder pages + themed live-time Operations Messages: OK')
