from pathlib import Path
import base64
import gzip

index = Path('index.html').read_text(encoding='utf-8')
finder_path = Path('system-owner-finder.html')
assert finder_path.exists(), 'system-owner-finder.html must be bundled with the app'
loader = finder_path.read_text(encoding='utf-8')

required_index = [
    'id="tab-system-owner"',
    'FIND SYSTEM OWNER',
    'id="view-system-owner"',
    'id="systemOwnerFinderFrame"',
    'src="system-owner-finder.html"',
    'function syncToolFramesTheme(',
    "postMessage({type:'dhcp-theme',theme}",
]
for needle in required_index:
    assert needle in index, f'missing System Owner top-level integration: {needle}'

assert 'id="btnSystemOwnerFinder"' not in index, 'legacy traffic-form Finder trigger must be removed'
assert 'id="systemOwnerFinderPanel"' not in index, 'legacy traffic-form Finder panel must be removed'

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
assert 'contact-copy-v2:' in loader, 'loader must enhance contact fields with independent copy controls'

print('system owner finder integration: OK')
