from pathlib import Path

index = Path('index.html').read_text(encoding='utf-8')
finder_path = Path('system-owner-finder.html')

assert finder_path.exists(), 'system-owner-finder.html must be bundled with the app'
finder = finder_path.read_text(encoding='utf-8')

required_index = [
    'id="btnSystemOwnerFinder"',
    'FIND SYSTEM OWNER',
    'id="systemOwnerFinderPanel"',
    'id="systemOwnerFinderFrame"',
    'src="system-owner-finder.html"',
    'function toggleSystemOwnerFinder()',
    'function syncSystemOwnerFinderTheme()',
    "postMessage({type:'dhcp-theme'",
]
for needle in required_index:
    assert needle in index, f'missing Generate Log traffic integration: {needle}'

assert 'window.location.href' not in index[index.find('function toggleSystemOwnerFinder()'):index.find('function toggleSystemOwnerFinder()') + 2200], 'finder toggle must stay in-place and must not navigate away'

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
    "document.body.dataset.theme",
]
for needle in required_finder:
    assert needle in finder, f'missing source TOR Finder behavior/theme bridge: {needle}'

assert '--accent:' in finder and '--accentRgb:' in finder, 'finder must expose parent-theme compatible accent variables'
assert 'target="_blank"' in finder, 'existing endpoint links must remain independently openable'

print('system owner finder integration: OK')
