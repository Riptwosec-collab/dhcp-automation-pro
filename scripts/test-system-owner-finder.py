from pathlib import Path
import base64
import gzip

index = Path('index.html').read_text(encoding='utf-8')
generator = Path('scripts/add-system-owner-finder.py').read_text(encoding='utf-8')
finder_path = Path('system-owner-finder.html')
voip_path = Path('voip-finder.html')
operations_path = Path('operations-messages.html')
tor_core_path = Path('tor-system-finder-core.js')
tor_ui_path = Path('tor-system-finder-upgrade.js')
tor_css_path = Path('tor-system-finder-upgrade.css')

assert finder_path.exists(), 'system-owner-finder.html must be bundled with the app'
assert voip_path.exists(), 'voip-finder.html must be bundled with the app'
assert operations_path.exists(), 'operations-messages.html must be bundled with the app'
assert tor_core_path.exists(), 'TOR System Finder core must be bundled with the app'
assert tor_ui_path.exists(), 'TOR System Finder upgrade UI must be bundled with the app'
assert tor_css_path.exists(), 'TOR System Finder upgrade CSS must be bundled with the app'

loader = finder_path.read_text(encoding='utf-8')
voip_loader = voip_path.read_text(encoding='utf-8')
operations = operations_path.read_text(encoding='utf-8')

required_index = [
    'id="utilityToolsDock"',
    'id="utilityToolsToggle"',
    'id="utilityToolsMenu"',
    'id="tab-system-owner"',
    'FIND SYSTEM OWNER',
    'id="tab-voip"',
    'VOIP Finder',
    'id="tab-operations"',
    'Operations Messages',
    'function openUtilityWorkspace(',
    'function returnFromUtilityWorkspace(',
    'function positionUtilityToolsMenu(',
    'function setUtilityToolsOpen(',
    'function toggleUtilityTools(',
    'function closeUtilityToolsOnOutside(',
    'id="view-system-owner"',
    'id="systemOwnerFinderFrame"',
    'src="system-owner-finder.html"',
    'id="view-voip"',
    'id="voipFinderFrame"',
    'src="voip-finder.html"',
    'id="view-operations"',
    'id="operationsMessagesFrame"',
    'src="operations-messages.html"',
]
for needle in required_index:
    assert needle in index, f'missing same-page Utility integration: {needle}'

for needle in ['utilityToolsDock', 'openUtilityWorkspace', 'view-system-owner', 'view-voip', 'view-operations', 'operations-messages.html']:
    assert needle in generator, f'generator must preserve same-page Utility integration: {needle}'

# Utility items must stay inside the current DHCP page: no navigation, no new browser tab.
for tool_id in ['tab-system-owner', 'tab-voip', 'tab-operations']:
    start = index.index(f'id="{tool_id}"')
    tag_start = index.rfind('<', 0, start)
    tag_end = index.find('>', start)
    tag = index[tag_start:tag_end + 1]
    assert tag.startswith('<button'), f'{tool_id} must be a same-page button, not a link'
    assert 'target=' not in tag, f'{tool_id} must not open a new browser tab'
    assert 'href=' not in tag, f'{tool_id} must not navigate away from the current URL'

assert "openUtilityWorkspace('system-owner')" in index, 'System Owner menu item must open the same-page workspace view'
assert "openUtilityWorkspace('voip')" in index, 'VOIP menu item must open the same-page workspace view'
assert "openUtilityWorkspace('operations')" in index, 'Operations menu item must open the same-page workspace view'
workspace_tabs = "['dhcp','subnet','log','uih','system-owner','voip','operations']"
assert workspace_tabs in index, 'workspace switcher must include all three Utility views'
assert 'history.pushState' not in generator and 'location.href' not in generator and 'window.open(' not in generator, 'Utility generator must not change browser URL or open new tabs'

# The same-page tools need a visible way back to the last core DHCP workspace.
assert index.count('onclick="returnFromUtilityWorkspace()"') >= 3, 'each Utility workspace must expose a back action'
assert "let lastCoreTab='dhcp'" in index, 'main workspace must remember the last core tab'

# Theme must propagate to all embedded Utility pages.
for needle in ['syncSystemOwnerFinderTheme(theme)', 'syncVoipFinderTheme(theme)', 'syncOperationsMessagesTheme(theme)']:
    assert needle in index, f'main theme must sync Utility iframe: {needle}'

assert 'id="btnSystemOwnerFinder"' not in index, 'old inline System Owner Finder button must stay removed from Generate Log traffic'
assert 'id="systemOwnerFinderPanel"' not in index, 'old inline System Owner Finder panel must stay removed from Generate Log traffic'

uih_pos = index.find('id="tab-uih"')
nav_end = index.find('</nav>', uih_pos)
dock_pos = index.find('id="utilityToolsDock"')
brand_pos = index.find('class="brand-block"', dock_pos)
assert 0 <= uih_pos < nav_end < dock_pos < brand_pos, 'Utility Dock must sit after the main navigation and before the DHCP brand block'
assert '.utility-tools-menu{position:fixed;' in index, 'Utility menu must escape topbar overflow using fixed positioning'
assert 'positionUtilityToolsMenu();' in index, 'Utility menu must anchor to the visible toggle when opened'

payload_paths = [Path(f'assets/system-owner-finder-payload-{i:02d}.txt') for i in range(1, 8)]
for payload_path in payload_paths:
    assert payload_path.exists(), f'missing compressed TOR Finder payload: {payload_path}'
    assert payload_path.name in loader, f'loader must fetch {payload_path.name}'

payload_b64 = ''.join(path.read_text(encoding='ascii').strip() for path in payload_paths)
finder = gzip.decompress(base64.b64decode(payload_b64)).decode('utf-8')
for needle in ['TOR SYSTEM FINDER', 'Analyze System', 'Import Excel', 'CONTACT ROUTING', 'const BUNDLED_TOR=', 'function findMatches(', 'async function parseTorXlsx(']:
    assert needle in finder, f'missing source TOR Finder behavior: {needle}'
assert '--accent:' in finder and '--accentRgb:' in finder, 'finder must expose parent-theme compatible accent variables'
assert 'body[data-theme="gold"]' in finder and 'body[data-theme="cyber"]' in finder, 'finder must support GOLD and CYBER theme envelopes'
assert "DecompressionStream('gzip')" in loader, 'loader must restore the bundled source locally in browser'
for needle in ['owner-split-copy', 'OWNER QUICK COPY', 'PREFIX', 'NAME', 'PHONE', 'EMAIL']:
    assert needle in loader, f'missing contact split/copy enhancement: {needle}'

# TOR System Finder Upgrade must remain layered onto the existing payload rather than replacing it.
assert loader.count('tor-system-finder-upgrade-v1:start') == 1, 'TOR upgrade start marker must appear once'
assert loader.count('tor-system-finder-upgrade-v1:end') == 1, 'TOR upgrade end marker must appear once'
assert 'window.__torSystemFinderGetRecords' in loader, 'TOR upgrade must expose the current runtime record bridge'
assert 'currentRawRecords' in loader, 'TOR upgrade bridge must follow current imported/bundled records'
for asset in ['tor-system-finder-core.js', 'tor-system-finder-upgrade.js', 'tor-system-finder-upgrade.css']:
    assert loader.count(asset) == 1, f'TOR upgrade asset must be injected once: {asset}'

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

# Operations Messages moved out of VOIP and into its own same-page Utility workspace.
assert 'id="operationsMessages"' not in voip_loader, 'VOIP page must not duplicate Operations Messages after they move to their own Utility view'
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
    "type==='dhcp-theme'",
    "type:'operations-ready'",
]
for needle in required_operations:
    assert needle in operations, f'missing same-page Operations Messages feature: {needle}'
for stale_time in ['20.49', '08.30', '20.59']:
    assert stale_time not in operations, f'operations timestamps must be generated at runtime, not hard-coded: {stale_time}'

print('same-page Utility + TOR System Finder Upgrade + themed Operations regression: OK')
