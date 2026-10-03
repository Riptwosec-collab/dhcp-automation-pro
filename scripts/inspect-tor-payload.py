from pathlib import Path
import base64
import gzip
import re

payload_paths=[Path(f'assets/system-owner-finder-payload-{i:02d}.txt') for i in range(1,8)]
payload_b64=''.join(p.read_text(encoding='ascii').strip() for p in payload_paths)
finder=gzip.decompress(base64.b64decode(payload_b64)).decode('utf-8')

for marker in ['const BUNDLED_TOR=', 'function findMatches(', 'async function parseTorXlsx(', 'function analyzeSystem(', 'function renderResult(', 'let tor', 'let data', 'let rows']:
    pos=finder.find(marker)
    print(f'\n=== {marker} @ {pos} ===')
    if pos >= 0:
        print(finder[pos:pos+2800])

print('\n=== VARIABLE CANDIDATES ===')
for match in re.finditer(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=', finder):
    name=match.group(1)
    if any(token in name.lower() for token in ('tor','data','row','record','match','system','source')):
        print(name)
