from pathlib import Path
import base64
import gzip
import subprocess

root = Path(__file__).resolve().parents[1]
loader_path = root / 'system-owner-finder.html'
generator_path = root / 'scripts' / 'add-tor-system-finder-upgrade.py'
core_path = root / 'tor-system-finder-core.js'

assert loader_path.exists(), 'system-owner-finder.html must exist'
assert core_path.exists(), 'tor-system-finder-core.js must exist'
assert generator_path.exists(), 'scripts/add-tor-system-finder-upgrade.py must exist'

loader = loader_path.read_text(encoding='utf-8')
generator = generator_path.read_text(encoding='utf-8')

payload_paths = [root / 'assets' / f'system-owner-finder-payload-{i:02d}.txt' for i in range(1, 8)]
for payload_path in payload_paths:
    assert payload_path.exists(), f'missing canonical payload {payload_path.name}'
    assert payload_path.name in loader, f'loader must still fetch canonical payload {payload_path.name}'

payload_b64 = ''.join(p.read_text(encoding='ascii').strip() for p in payload_paths)
finder = gzip.decompress(base64.b64decode(payload_b64)).decode('utf-8')

# The canonical source is runtime-mutable: imported Excel replaces currentRawRecords.
for needle in [
    'const BUNDLED_TOR=',
    'let currentRawRecords = BUNDLED_TOR.primary;',
    'currentRawRecords = saved.records;',
    'currentRawRecords = payload.records;',
    'currentRawRecords = BUNDLED_TOR.primary;',
    'async function parseTorXlsx(',
]:
    assert needle in finder, f'canonical Finder source contract changed: {needle}'

# The upgrade must bridge the current runtime record set, not copy a static owner DB.
assert 'tor-system-finder-upgrade-v1:start' in loader, 'upgrade version marker missing from generated loader'
assert loader.count('tor-system-finder-upgrade-v1:start') == 1, 'upgrade start marker must be injected exactly once'
assert loader.count('tor-system-finder-upgrade-v1:end') == 1, 'upgrade end marker must be injected exactly once'
assert 'window.__torSystemFinderGetRecords' in loader, 'runtime TOR record bridge missing'
assert 'currentRawRecords' in loader, 'bridge must expose the runtime currentRawRecords source'
assert 'BUNDLED_TOR.primary' not in generator, 'upgrade generator must not hard-code a second bundled TOR database'
assert 'contactRaw' not in generator or 'currentRawRecords' in generator, 'owner data must come from canonical runtime records'
assert "DecompressionStream('gzip')" in loader, 'existing compressed payload loader must remain intact'

# A second generator run must be byte-for-byte idempotent.
before = loader_path.read_bytes()
subprocess.run(['python', str(generator_path)], cwd=root, check=True)
after = loader_path.read_bytes()
assert before == after, 'TOR System Finder upgrade generator must be idempotent on repeated runs'

print('TOR System Finder canonical bridge/idempotency contract: OK')
