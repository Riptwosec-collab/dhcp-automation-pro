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
  // TOR SYSTEM FINDER v1 enhancements use the original Finder as the only
  // matching engine. These bridges expose the live source records and the
  // exact record selected/rendered by the existing Analyze System flow.
  window.__torSystemFinderGetRecords=()=>{
    const fallbackRaw=currentMeta?.mode==='Bundled'&&Array.isArray(BUNDLED_TOR.fallback)?BUNDLED_TOR.fallback:[];
    const combined=[...currentRawRecords,...fallbackRaw];
    const seen=new Set();
    return combined.filter(record=>{
      const key=[record?.id,record?.systemName,record?.ip,record?.url,record?.contactRaw].map(value=>String(value??'')).join('|');
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    }).map(record=>({...record}));
  };
  window.__torSystemFinderLastMatch=null;
  window.__torSystemFinderGetLastMatch=()=>window.__torSystemFinderLastMatch;
`;
    const torUpgradeRuntimeAnchor="  loadImportedDb();\n  updateDbStatus();";
    if(!html.includes(torUpgradeRuntimeAnchor))throw new Error('TOR runtime data anchor not found');
    html=html.replace(torUpgradeRuntimeAnchor,torUpgradeBridge+torUpgradeRuntimeAnchor);

    const torMatchAnchor="  function renderMatch(scored, fallback = false) {\n    const r = scored.record;";
    if(!html.includes(torMatchAnchor))throw new Error('TOR renderMatch anchor not found');
    html=html.replace(torMatchAnchor,"  function renderMatch(scored, fallback = false) {\n    window.__torSystemFinderLastMatch={scored,fallback};\n    const r = scored.record;");

    const torCandidatesAnchor="  function renderCandidates(result) {\n    els.result.innerHTML =";
    if(!html.includes(torCandidatesAnchor))throw new Error('TOR renderCandidates anchor not found');
    html=html.replace(torCandidatesAnchor,"  function renderCandidates(result) {\n    window.__torSystemFinderLastMatch=null;\n    els.result.innerHTML =");

    const torNoneAnchor="  function renderNone() {\n    els.result.innerHTML =";
    if(!html.includes(torNoneAnchor))throw new Error('TOR renderNone anchor not found');
    html=html.replace(torNoneAnchor,"  function renderNone() {\n    window.__torSystemFinderLastMatch=null;\n    els.result.innerHTML =");

    const torUpgradeStyle='<link rel="stylesheet" href="tor-system-finder-upgrade.css">';
    const torUpgradeScripts='<script src="tor-system-finder-core.js"><\/script><script src="tor-system-finder-upgrade.js"><\/script>';
    if(!html.includes('</head>')||!html.includes('</body>'))throw new Error('TOR Finder document anchors not found');
    html=html.replace('</head>',torUpgradeStyle+'</head>').replace('</body>',torUpgradeScripts+'</body>');
    /* tor-system-finder-upgrade-v1:end */
'''

text = text.replace(anchor, anchor + block, 1)
path.write_text(text, encoding='utf-8')
print('TOR System Finder Upgrade v1 integrated with original Analyze System flow')
