from pathlib import Path
import base64
import gzip
import re

payload_paths=[Path(f'assets/system-owner-finder-payload-{i:02d}.txt') for i in range(1,8)]
payload_b64=''.join(p.read_text(encoding='ascii').strip() for p in payload_paths)
finder=gzip.decompress(base64.b64decode(payload_b64)).decode('utf-8')

for marker in [
    'let currentRawRecords',
    'let currentRecords',
    'const fallbackRecords',
    'currentRawRecords =',
    'currentRecords =',
    'parseTorXlsx(file',
    'parseTorXlsx(',
    'BUNDLED_TOR.primary',
    'Import Excel',
]:
    print(f'\n=== ALL {marker} ===')
    start=0
    while True:
        pos=finder.find(marker,start)
        if pos < 0: break
        lo=max(0,pos-900); hi=min(len(finder),pos+2600)
        print(f'--- @ {pos} ---')
        print(finder[lo:hi])
        start=pos+len(marker)

print('\n=== ASSIGNMENTS ===')
for match in re.finditer(r'\b(currentRawRecords|currentRecords|fallbackRecords)\b.{0,140}', finder):
    print(match.group(0).replace('\n',' '))
