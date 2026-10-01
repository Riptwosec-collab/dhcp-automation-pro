from pathlib import Path
import base64
import gzip
import json
import re

index = Path('index.html').read_text(encoding='utf-8')

# Top navigation placement.
for needle in ['id="tab-uih"', 'id="tab-system-owner"', 'id="tab-voip"']:
    assert needle in index, f'missing top-level navigation: {needle}'
uih = index.find('id="tab-uih"')
owner = index.find('id="tab-system-owner"')
voip = index.find('id="tab-voip"')
assert uih < owner < voip, 'tool tabs must be ordered UIh -> System Owner -> VOIP'

# System Owner must no longer live beside SCAN IP in Generate Log traffic.
scan = index.find('id="btnScanIp"')
assert scan >= 0
assert 'FIND SYSTEM OWNER' not in index[scan:scan + 1300], 'System Owner button must be moved out of the traffic form'
assert 'id="btnSystemOwnerFinder"' not in index, 'legacy in-form System Owner trigger must be removed'
assert 'id="systemOwnerFinderPanel"' not in index, 'legacy in-form System Owner panel must be removed'

# Dedicated themed views.
for needle in [
    'id="view-system-owner"',
    'id="view-voip"',
    'id="systemOwnerFinderFrame"',
    'id="voipFinderFrame"',
    'src="system-owner-finder.html"',
    'src="voip-finder.html"',
    'function syncToolFramesTheme(',
    "['dhcp','subnet','log','uih','system-owner','voip']",
    "postMessage({type:'dhcp-theme',theme}",
]:
    assert needle in index, f'missing navigation tool integration: {needle}'

# VOIP Finder is bundled locally and restores the user-derived hierarchy page.
voip_loader = Path('voip-finder.html').read_text(encoding='utf-8')
assert "DecompressionStream('gzip')" in voip_loader, 'VOIP Finder must restore its bundled page locally'
payload_match = re.search(r'const payload="([A-Za-z0-9+/=]+)";', voip_loader)
assert payload_match, 'VOIP Finder inline payload missing'
voip_html = gzip.decompress(base64.b64decode(payload_match.group(1))).decode('utf-8')
for needle in ['VOIP Finder', 'dhcp-theme', 'document.body.dataset.theme', 'หัวข้อใหญ่', 'พื้นที่ / หน่วยงาน', '1,090']:
    assert needle in voip_html, f'missing VOIP Finder behavior/theme/hierarchy: {needle}'
assert 'ไม่ระบุพื้นที่' not in voip_html, 'old inferred unknown-area label must not return'

# System Owner contact enhancement is applied to the bundled source at runtime.
loader = Path('system-owner-finder.html').read_text(encoding='utf-8')
assert 'contact-copy-v2:' in loader, 'contact-copy enhancement marker missing'
base_payload = ''.join(Path(f'assets/system-owner-finder-payload-{i:02d}.txt').read_text(encoding='ascii').strip() for i in range(1, 8))
finder = gzip.decompress(base64.b64decode(base_payload)).decode('utf-8')
patch_match = re.search(r'const contactPatches=(\[.*?\]);\s*let enhancedHtml', loader, re.S)
assert patch_match, 'contact enhancement patches missing'
patches = json.loads(patch_match.group(1))
for before64, after64 in patches:
    before = base64.b64decode(before64).decode('utf-8')
    after = base64.b64decode(after64).decode('utf-8')
    assert before in finder, 'contact patch target must exist in bundled Finder source'
    finder = finder.replace(before, after, 1)

for needle in [
    'function extractContactPeople(',
    "['นางสาว','น.ส.','นาย','นาง','คุณ']",
    'CONTACT NAME',
    'CONTACT PREFIX',
    'data-contact-copy="name"',
    'data-contact-copy="prefix"',
]:
    assert needle in finder, f'missing per-contact copy parsing: {needle}'

print('navigation tools + contact copy contract: OK')
