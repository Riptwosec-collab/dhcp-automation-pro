from pathlib import Path
import re

path = Path('system-owner-finder.html')
text = path.read_text(encoding='utf-8')

# Remove only our prior loader block so repeated runs are byte-for-byte idempotent.
text = re.sub(
    r'\n[ \t]*/\* tor-system-finder-upgrade-v1:start \*/.*?/\* tor-system-finder-upgrade-v1:end \*/[ \t]*\n?',
    '\n',
    text,
    count=1,
    flags=re.S,
)

anchor = "    let html=await new Response(stream).text();\n"
if anchor not in text:
    raise SystemExit('TOR Finder loader HTML anchor not found')

block = r'''    /* tor-system-finder-upgrade-v1:start */
    const torUpgradeBridge=`
  // Runtime bridge for TOR SYSTEM FINDER Upgrade. It deliberately closes over
  // currentRawRecords so bundled, restored-import and newly imported data all
  // remain the single canonical source used by the analyzer.
  window.__torSystemFinderGetRecords=()=>currentRawRecords.map(record=>({...record}));
`;
    const torUpgradeRuntimeAnchor="  loadImportedDb();\n  updateDbStatus();";
    if(!html.includes(torUpgradeRuntimeAnchor))throw new Error('TOR runtime data anchor not found');
    html=html.replace(torUpgradeRuntimeAnchor,torUpgradeBridge+torUpgradeRuntimeAnchor);
    const torUpgradeStyle='<link rel="stylesheet" href="tor-system-finder-upgrade.css">';
    const torUpgradeScripts='<script src="tor-system-finder-core.js"><\/script><script src="tor-system-finder-upgrade.js"><\/script>';
    if(!html.includes('</head>')||!html.includes('</body>'))throw new Error('TOR Finder document anchors not found');
    html=html.replace('</head>',torUpgradeStyle+'</head>').replace('</body>',torUpgradeScripts+'</body>');
    /* tor-system-finder-upgrade-v1:end */
'''

text = text.replace(anchor, anchor + block, 1)
path.write_text(text, encoding='utf-8')
print('TOR System Finder Upgrade v1 bridge + analyzer assets applied')
