from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

ROOT = Path('chrome-extension')
DIST = Path('dist')
OUTPUT = DIST / 'dhcp-mission-control-extension.zip'
EXCLUDED_PARTS = {'tests', '__pycache__'}
FIXED_TIME = (2026, 9, 18, 0, 0, 0)

DIST.mkdir(exist_ok=True)
with ZipFile(OUTPUT, 'w', ZIP_DEFLATED) as zf:
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        info = ZipInfo(rel.as_posix(), date_time=FIXED_TIME)
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        zf.writestr(info, path.read_bytes())
print(OUTPUT)
