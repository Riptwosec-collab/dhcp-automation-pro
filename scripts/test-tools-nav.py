from pathlib import Path
import gzip
import base64

INDEX = Path('index.html').read_text(encoding='utf-8')

assert 'id="tab-uih"' in INDEX
assert 'id="tab-system-owner"' in INDEX, 'System Owner top-level tab missing'
assert 'FIND SYSTEM OWNER' in INDEX
assert 'id="tab-voip"' in INDEX, 'VOIP Finder top-level tab missing'
assert 'VOIP Finder' in INDEX
assert 'id="view-system-owner"' in INDEX
assert 'id="view-voip"' in INDEX
assert 'src="system-owner-finder.html"' in INDEX
assert 'src="voip-finder.html"' in INDEX

log_start = INDEX.index('id="view-log"')
uih_start = INDEX.index('id="view-uih"')
log_block = INDEX[log_start:uih_start]
assert 'btnSystemOwnerFinder' not in log_block, 'Old System Owner button is still inside Generate Log traffic'
assert 'systemOwnerFinderPanel' not in log_block, 'Old embedded System Owner panel is still inside Generate Log traffic'

nav_start = INDEX.index('<nav')
nav_end = INDEX.index('</nav>', nav_start)
nav = INDEX[nav_start:nav_end]
assert nav.index('id="tab-uih"') < nav.index('id="tab-system-owner"') < nav.index('id="tab-voip"')

assert "syncSystemOwnerFinderTheme(theme)" in INDEX
assert "syncVoipFinderTheme(theme)" in INDEX
assert "['dhcp','subnet','log','uih','system-owner','voip']" in INDEX

parts = sorted(Path('assets').glob('system-owner-finder-payload-*.txt'))
assert parts, 'System Owner payload chunks missing'
payload = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
owner_html = gzip.decompress(base64.b64decode(payload)).decode('utf-8')
assert 'function extractContactNames' in owner_html, 'Contact name parser missing'
assert 'CONTACT NAME' in owner_html, 'Contact name copy section missing'
assert 'data-copy="${escapeHtml(x.name)}"' in owner_html, 'Names are not individually copyable'
assert 'นางสาว' in owner_html and 'นาย' in owner_html and 'คุณ' in owner_html, 'Thai prefixes are not handled'

VOIP = Path('voip-finder.html').read_text(encoding='utf-8')
assert 'VOIP Finder' in VOIP
assert 'dhcp-theme' in VOIP
assert 'voip-ready' in VOIP
assert 'หัวข้อใหญ่' in VOIP
assert 'พื้นที่ / หน่วยงาน' in VOIP

print('Tools navigation integration contract passed')
