from pathlib import Path
import re

# Keep generated core behavior aligned with the review regressions. The generator
# owns materialization so PR CI and the main-generation workflow exercise the
# exact same runtime artifact.
core_path = Path('tor-system-finder-core.js')
core = core_path.read_text(encoding='utf-8')

old_monitor = r'''    const monitorLine=lines.find(line=>/^monitor\b/i.test(line))||'';
    const monitor=monitorLine.replace(/^monitor\s*[:\-]?\s*/i,'').replace(/\s+/g,' ').trim();'''
new_monitor = r'''    const monitorStart=lines.findIndex(line=>/^monitor\b/i.test(line));
    const monitorMarker=/^(?:url\s*:|hosted\s+on\b|(?:เวลา|time)\s*:)/i;
    const monitorLines=[];
    if(monitorStart>=0){
      for(let i=monitorStart;i<lines.length;i++){
        const line=lines[i];
        if(i>monitorStart&&monitorMarker.test(line))break;
        monitorLines.push(i===monitorStart?line.replace(/^monitor\s*[:\-]?\s*/i,''):line);
      }
    }
    const monitor=monitorLines.join(' ').replace(/\s+/g,' ').trim();'''
if old_monitor in core:
    core = core.replace(old_monitor, new_monitor, 1)
elif new_monitor not in core:
    raise SystemExit('TOR core monitor parser anchor not found')

old_named_owner = r'''        const owner={
          id:`${recordId??'record'}:owner:${owners.length+1}`,
          prefix:ownerName.prefix,
          name:ownerName.name,
          phones:[],
          emails:[],
          raw:chunk,
        };'''
new_named_owner = r'''        const owner={
          id:`${recordId??'record'}:owner:${owners.length+1}`,
          kind:'owner',
          prefix:ownerName.prefix,
          name:ownerName.name,
          phones:[],
          emails:[],
          raw:chunk,
        };'''
if old_named_owner in core:
    core = core.replace(old_named_owner, new_named_owner, 1)
elif new_named_owner not in core:
    raise SystemExit('TOR core named owner anchor not found')

old_contact_branch = r'''      }else if(phones.length||emails.length){
        if(owners.length){
          addContacts(owners[owners.length-1],phones,emails);
        }else{
          orphanPhones.push(...phones);
          orphanEmails.push(...emails);
        }
      }'''
new_contact_branch = r'''      }else if(phones.length||emails.length){
        owners.push({
          id:`${recordId??'record'}:contact:${owners.length+1}`,
          kind:'unassigned',
          prefix:'',
          name:'',
          phones:unique(phones),
          emails:unique(emails),
          raw:chunk,
        });
      }'''
if old_contact_branch in core:
    core = core.replace(old_contact_branch, new_contact_branch, 1)
elif new_contact_branch not in core:
    raise SystemExit('TOR core contact association anchor not found')

old_contact_fallback = r'''        owners.push({
          id:`${recordId??'record'}:contact:1`,
          prefix:'',
          name:'',
          phones,
          emails,
          raw,
        });'''
new_contact_fallback = r'''        owners.push({
          id:`${recordId??'record'}:contact:1`,
          kind:'unassigned',
          prefix:'',
          name:'',
          phones,
          emails,
          raw,
        });'''
if old_contact_fallback in core:
    core = core.replace(old_contact_fallback, new_contact_fallback, 1)
elif new_contact_fallback not in core:
    raise SystemExit('TOR core contact fallback anchor not found')

old_resolve_shape = r'''      id:owner.id||`${record?.id??'record'}:owner:${index+1}`,
      prefix:cleanSpaces(owner.prefix||''),
      name:cleanSpaces(owner.name||''),'''
new_resolve_shape = r'''      id:owner.id||`${record?.id??'record'}:owner:${index+1}`,
      kind:owner.kind||(cleanSpaces(owner.name||'')?'owner':'unassigned'),
      prefix:cleanSpaces(owner.prefix||''),
      name:cleanSpaces(owner.name||''),'''
if old_resolve_shape in core:
    core = core.replace(old_resolve_shape, new_resolve_shape, 1)
elif new_resolve_shape not in core:
    raise SystemExit('TOR core resolve owner shape anchor not found')

core_path.write_text(core, encoding='utf-8')

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
  // Runtime bridge for TOR SYSTEM FINDER Upgrade. The top Finder searches
  // currentRecords first and BUNDLED_TOR.fallback second. Expose that same
  // canonical searchable pool to the lower Analyzer so both halves of the
  // page operate as one system. Imported databases intentionally have no
  // bundled fallback, matching the existing Finder behavior.
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
print('TOR System Finder Upgrade v1 unified searchable bridge + analyzer assets applied')
