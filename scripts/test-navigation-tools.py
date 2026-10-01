from pathlib import Path
import base64, gzip

index = Path('index.html').read_text(encoding='utf-8')

# Top navigation placement
assert 'id="tab-uih"' in index, 'Generate Log UIh tab must exist'
assert 'id="tab-system-owner"' in index, 'Find System Owner must be a top-level tab'
assert 'id="tab-voip"' in index, 'VOIP Finder must be a top-level tab'
uih = index.find('id="tab-uih"')
owner = index.find('id="tab-system-owner"')
voip = index.find('id="tab-voip"')
assert uih < owner < voip, 'tool tabs must be ordered UIh -> System Owner -> VOIP'

# System Owner must no longer live beside SCAN IP in Generate Log traffic
scan = index.find('id="btnScanIp"')
assert scan >= 0
assert 'FIND SYSTEM OWNER' not in index[scan:scan + 1300], 'System Owner button must be moved out of the traffic form'

# Dedicated themed views
for needle in [
    'id="view-system-owner"',
    'id="view-voip"',
    'src="system-owner-finder.html"',
    'src="voip-finder.html"',
    'function syncToolFramesTheme()',
]:
    assert needle in index, f'missing navigation tool integration: {needle}'

voip_path = Path('voip-finder.html')
assert voip_path.exists(), 'voip-finder.html must be shipped with the site'
voip_html = voip_path.read_text(encoding='utf-8')
for needle in ['VOIP Finder', 'dhcp-theme', 'document.body.dataset.theme', 'หัวข้อใหญ่', 'พื้นที่ / หน่วยงาน']:
    assert needle in voip_html, f'missing VOIP Finder behavior/theme support: {needle}'

# Finder contact parser must expose prefix-stripped names and independent copy chips.
payloads = [Path(f'assets/system-owner-finder-payload-{i:02d}.txt') for i in range(1, 8)]
finder = gzip.decompress(base64.b64decode(''.join(p.read_text(encoding='ascii').strip() for p in payloads))).decode('utf-8')
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
