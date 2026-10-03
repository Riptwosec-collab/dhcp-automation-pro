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
pr_workflow_path = root / '.github' / 'workflows' / 'test-traffic-log-layout.yml'
main_workflow_path = root / '.github' / 'workflows' / 'resize-dhcp-fields.yml'

for required in [loader_path, generator_path, core_path, ui_path, css_path, pr_workflow_path, main_workflow_path]:
    assert required.exists(), f'missing required path: {required}'

loader = loader_path.read_text(encoding='utf-8')
generator = generator_path.read_text(encoding='utf-8')
ui = ui_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
pr_workflow = pr_workflow_path.read_text(encoding='utf-8')
main_workflow = main_workflow_path.read_text(encoding='utf-8')

payload_paths = [root / 'assets' / f'system-owner-finder-payload-{i:02d}.txt' for i in range(1, 8)]
for payload_path in payload_paths:
    assert payload_path.exists(), f'missing canonical payload {payload_path.name}'
    assert payload_path.name in loader, f'loader must still fetch canonical payload {payload_path.name}'

payload_b64 = ''.join(p.read_text(encoding='ascii').strip() for p in payload_paths)
finder = gzip.decompress(base64.b64decode(payload_b64)).decode('utf-8')

for needle in [
    'const BUNDLED_TOR=',
    'let currentRawRecords = BUNDLED_TOR.primary;',
    'async function parseTorXlsx(',
    'id="incidentInput"',
    'id="analyzeBtn"',
    '>Analyze System</button>',
    'function analyzeText(',
    "els.analyze.addEventListener('click', () => analyzeText())",
]:
    assert needle in finder, f'canonical Finder flow changed unexpectedly: {needle}'

assert 'tor-system-finder-upgrade-v1:start' in loader, 'upgrade version marker missing from generated loader'
assert loader.count('tor-system-finder-upgrade-v1:start') == 1, 'upgrade start marker must be injected exactly once'
assert loader.count('tor-system-finder-upgrade-v1:end') == 1, 'upgrade end marker must be injected exactly once'
assert 'window.__torSystemFinderGetRecords' in loader, 'runtime TOR record bridge missing'
assert 'window.__torSystemFinderLastMatch' in loader, 'original Finder match bridge missing'
assert 'window.__torSystemFinderGetLastMatch' in loader, 'last-match accessor missing'
assert 'currentRawRecords' in loader, 'bridge must expose the runtime currentRawRecords source'
assert 'BUNDLED_TOR.primary' not in generator, 'upgrade generator must not hard-code a second bundled TOR database'
assert "DecompressionStream('gzip')" in loader, 'existing compressed payload loader must remain intact'

for asset in ['tor-system-finder-core.js', 'tor-system-finder-upgrade.js', 'tor-system-finder-upgrade.css']:
    assert loader.count(asset) == 1, f'{asset} must be injected exactly once by the loader'

# v1 must enhance the original Finder output; it must not add a second analyzer/input/button.
for needle in [
    "document.getElementById('incidentInput')",
    "document.getElementById('analyzeBtn')",
    "document.getElementById('resultArea')",
    "document.getElementById('candidateArea')",
    "rootEl.id='torFinderEnhancements'",
    '__torSystemFinderGetLastMatch',
    'MutationObserver',
]:
    assert needle in ui, f'missing same-Finder integration contract: {needle}'
for forbidden in [
    'torIncidentAnalyzer',
    'torIncidentInput',
    'torAnalyzeError',
    'ANALYZE ERROR',
    'SELECT THIS SYSTEM',
    'Find TOR System + Find System Owner',
    'findCandidates(',
]:
    assert forbidden not in ui, f'v1 must not create a second analysis workflow: {forbidden}'

# Owner cards: one person per card, copy name without title, each phone/email independently.
for needle in ['COPY NAME', 'COPY PHONE', 'COPY EMAIL', 'tor-owner-grid', 'resolveOwners(']:
    assert needle in ui, f'missing owner-card behavior: {needle}'
assert '[owner?.prefix,owner?.name]' not in ui, 'display/copy name must not prepend the TOR title'

# Exactly the six requested operational copy blocks plus one mail draft.
for needle in [
    'MONITOR ORIGINAL',
    'URL NORMAL',
    'URL ABNORMAL',
    'MONITOR + RESOLUTION',
    'TICKET ACTION',
    'MAIL COMPLETION',
    'COPY MAIL',
    'buildOperationalBlocks(',
    'buildMailDraft(',
    'data-copy-value',
    'copyTorValue',
]:
    assert needle in ui, f'missing copy/mail behavior: {needle}'
assert 'To:' not in ui, 'Finder enhancement must not auto-create a mail recipient field'
assert 'sendMail' not in ui and 'mailto:' not in ui, 'Finder enhancement must not send mail'

assert 'text-overflow:ellipsis' not in css or '.tor-' not in css.split('text-overflow:ellipsis')[0][-80:], 'enhancement output must not truncate copy text'
assert '@media' in css, 'enhancement must include responsive layout rules'

workflow_needles = [
    'tor-system-finder-core.js',
    'tor-system-finder-upgrade.js',
    'tor-system-finder-upgrade.css',
    'scripts/add-tor-system-finder-upgrade.py',
    'scripts/test-tor-system-finder-core.js',
    'scripts/test-tor-system-finder-owner-core.js',
    'scripts/test-tor-system-finder-ui-state.js',
    'scripts/test-tor-system-finder-review-regressions.js',
    'scripts/test-tor-system-finder-upgrade.py',
]
for workflow_name, workflow in [('PR', pr_workflow), ('main generation', main_workflow)]:
    for needle in workflow_needles:
        assert needle in workflow, f'{workflow_name} workflow missing TOR upgrade path/step: {needle}'
    assert 'python scripts/add-tor-system-finder-upgrade.py' in workflow, f'{workflow_name} workflow must apply the TOR upgrade generator'

before = loader_path.read_bytes()
subprocess.run(['python', str(generator_path)], cwd=root, check=True)
after = loader_path.read_bytes()
assert before == after, 'TOR System Finder upgrade generator must be idempotent on repeated runs'

# Run behavioral contracts here too because this integration test executes before unrelated generators in PR CI.
for test_file in [
    'scripts/test-tor-system-finder-core.js',
    'scripts/test-tor-system-finder-owner-core.js',
    'scripts/test-tor-system-finder-ui-state.js',
    'scripts/test-tor-system-finder-review-regressions.js',
]:
    subprocess.run(['node', test_file], cwd=root, check=True)

print('TOR System Finder integrated Analyze System v1 contract: OK')
