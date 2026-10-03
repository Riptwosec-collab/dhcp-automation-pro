from pathlib import Path
import base64
import gzip
import subprocess

root = Path(__file__).resolve().parents[1]
loader_path = root / 'system-owner-finder.html'
generator_path = root / 'scripts' / 'add-tor-system-finder-upgrade.py'
core_path = root / 'tor-system-finder-core.js'
ui_path = root / 'tor-system-finder-upgrade.js'
css_path = root / 'tor-system-finder-upgrade.css'

assert loader_path.exists(), 'system-owner-finder.html must exist'
assert core_path.exists(), 'tor-system-finder-core.js must exist'
assert generator_path.exists(), 'scripts/add-tor-system-finder-upgrade.py must exist'
assert ui_path.exists(), 'tor-system-finder-upgrade.js must exist'
assert css_path.exists(), 'tor-system-finder-upgrade.css must exist'

loader = loader_path.read_text(encoding='utf-8')
generator = generator_path.read_text(encoding='utf-8')
ui = ui_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

payload_paths = [root / 'assets' / f'system-owner-finder-payload-{i:02d}.txt' for i in range(1, 8)]
for payload_path in payload_paths:
    assert payload_path.exists(), f'missing canonical payload {payload_path.name}'
    assert payload_path.name in loader, f'loader must still fetch canonical payload {payload_path.name}'

payload_b64 = ''.join(p.read_text(encoding='ascii').strip() for p in payload_paths)
finder = gzip.decompress(base64.b64decode(payload_b64)).decode('utf-8')

for needle in [
    'const BUNDLED_TOR=',
    'let currentRawRecords = BUNDLED_TOR.primary;',
    'currentRawRecords = saved.records;',
    'currentRawRecords = payload.records;',
    'currentRawRecords = BUNDLED_TOR.primary;',
    'async function parseTorXlsx(',
]:
    assert needle in finder, f'canonical Finder source contract changed: {needle}'

assert 'tor-system-finder-upgrade-v1:start' in loader, 'upgrade version marker missing from generated loader'
assert loader.count('tor-system-finder-upgrade-v1:start') == 1, 'upgrade start marker must be injected exactly once'
assert loader.count('tor-system-finder-upgrade-v1:end') == 1, 'upgrade end marker must be injected exactly once'
assert 'window.__torSystemFinderGetRecords' in loader, 'runtime TOR record bridge missing'
assert 'currentRawRecords' in loader, 'bridge must expose the runtime currentRawRecords source'
assert 'BUNDLED_TOR.primary' not in generator, 'upgrade generator must not hard-code a second bundled TOR database'
assert 'contactRaw' not in generator or 'currentRawRecords' in generator, 'owner data must come from canonical runtime records'
assert "DecompressionStream('gzip')" in loader, 'existing compressed payload loader must remain intact'

for asset in ['tor-system-finder-core.js', 'tor-system-finder-upgrade.js', 'tor-system-finder-upgrade.css']:
    assert loader.count(asset) == 1, f'{asset} must be injected exactly once by the loader'
assert "rootEl.id='torIncidentAnalyzer'" in ui or 'id="torIncidentAnalyzer"' in ui, 'analyzer root id must be created exactly in the existing Finder page'
for needle in [
    'id="torAnalyzeError"',
    'ANALYZE ERROR',
    'id="torExtractedFields"',
    'id="torCandidates"',
    'id="torSelectedSystem"',
    'id="torOwners"',
    'id="torCopyBlocks"',
    'id="torMailDraft"',
    'SELECT THIS SYSTEM',
    'NO RELIABLE TOR MATCH >= 80%',
]:
    assert needle in ui, f'missing analyzer UI contract: {needle}'

assert "addEventListener('click'" in ui and 'torAnalyzeError' in ui, 'analysis must be initiated by ANALYZE ERROR click'
assert "addEventListener('paste'" not in ui, 'paste must not trigger analysis automatically'
assert 'findCandidates(' in ui, 'analyzer must use deterministic core candidate matching'
assert '__torSystemFinderGetRecords' in ui, 'analyzer must use the canonical runtime record bridge'
assert 'resolveOwners(' in ui, 'selection must resolve owners from selected TOR record'

# Selected system must unlock individually copyable owner contacts + independent operation/mail blocks.
for needle in [
    'COPY NAME',
    'COPY PHONE',
    'COPY EMAIL',
    'COPY ALL CONTACTS',
    'COPY MAIL',
    'buildOperationalBlocks(',
    'buildMailDraft(',
    'data-copy-value',
    'copyTorValue',
]:
    assert needle in ui, f'missing selected-system copy/output behavior: {needle}'
assert 'To:' not in ui, 'Analyzer UI must not auto-create a mail To field'
assert 'sendMail' not in ui and 'mailto:' not in ui, 'Analyzer must not send mail'

assert 'text-overflow:ellipsis' not in css and '-webkit-line-clamp' not in css, 'analyzer output must never truncate copy text'
assert '@media' in css, 'analyzer must include responsive layout rules'

before = loader_path.read_bytes()
subprocess.run(['python', str(generator_path)], cwd=root, check=True)
after = loader_path.read_bytes()
assert before == after, 'TOR System Finder upgrade generator must be idempotent on repeated runs'

print('TOR System Finder bridge + analyzer + copy-output integration contract: OK')
