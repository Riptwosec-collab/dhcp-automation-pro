from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

css_marker = '/* system-owner-finder-v1 */'
css = r'''
    /* system-owner-finder-v1 */
    .system-owner-finder-trigger{display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:0 11px;border-radius:9px;border:1px solid rgba(var(--accentRgb),.24);background:rgba(var(--accentRgb),.07);color:var(--accent);font:800 10px/1 'JetBrains Mono',monospace;letter-spacing:.055em;transition:.22s ease;white-space:nowrap}
    .system-owner-finder-trigger:hover{border-color:rgba(var(--accentRgb),.58);background:rgba(var(--accentRgb),.15);box-shadow:0 0 20px rgba(var(--accentRgb),.12);transform:translateY(-1px)}
    .system-owner-finder-trigger[aria-expanded='true']{background:rgba(var(--accentRgb),.18);border-color:var(--borderStrong);box-shadow:0 0 22px rgba(var(--accentRgb),.14)}
    .system-owner-finder-panel{position:relative;overflow:hidden;border:1px solid rgba(var(--accentRgb),.18);border-radius:16px;background:linear-gradient(145deg,var(--panel),rgba(3,7,12,.94));box-shadow:0 18px 46px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.035)}
    .system-owner-finder-panel[hidden]{display:none!important}
    .system-owner-finder-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border-bottom:1px solid rgba(var(--accentRgb),.12);background:linear-gradient(90deg,rgba(var(--accentRgb),.07),transparent 62%)}
    .system-owner-finder-title{display:flex;align-items:center;gap:9px;min-width:0}.system-owner-finder-title i{color:var(--accent);filter:drop-shadow(0 0 7px rgba(var(--accentRgb),.32))}.system-owner-finder-title strong{display:block;color:#fff;font-size:11px;letter-spacing:.085em}.system-owner-finder-title span{display:block;margin-top:2px;color:var(--muted);font-size:9px}
    .system-owner-finder-close{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border-radius:8px;border:1px solid var(--border);background:rgba(255,255,255,.035);color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.06em}.system-owner-finder-close:hover{color:var(--accent);border-color:rgba(var(--accentRgb),.38);background:rgba(var(--accentRgb),.08)}
    .system-owner-finder-frame{display:block;width:100%;height:min(72vh,760px);min-height:560px;border:0;background:#060a0f}
    @media(max-width:900px){.system-owner-finder-frame{height:70vh;min-height:520px}.system-owner-finder-head{align-items:flex-start}.system-owner-finder-title span{display:none}}
    @media(max-width:640px){.system-owner-finder-trigger{width:100%;justify-content:center}.system-owner-finder-frame{height:74vh;min-height:500px}}
'''.strip()

if css_marker not in text:
    if '</style>' not in text:
        raise SystemExit('Style closing tag not found')
    text = text.replace('</style>', css + '\n  </style>', 1)

button = r'''<button id="btnSystemOwnerFinder" type="button" onclick="toggleSystemOwnerFinder()" class="system-owner-finder-trigger" aria-expanded="false" aria-controls="systemOwnerFinderPanel"><i data-lucide="user-search" class="w-3.5 h-3.5"></i><span>FIND SYSTEM OWNER</span></button>'''
if 'id="btnSystemOwnerFinder"' not in text:
    scan_pattern = re.compile(r'(<button id="btnScanIp"[^>]*>.*?</button>)', re.S)
    text, count = scan_pattern.subn(r'\1\n' + button, text, count=1)
    if count != 1:
        raise SystemExit('SCAN IP button target not found')

panel = r'''
                <div id="systemOwnerFinderPanel" class="md:col-span-2 system-owner-finder-panel" hidden data-open="false">
                  <div class="system-owner-finder-head">
                    <div class="system-owner-finder-title"><i data-lucide="users-round" class="w-4 h-4"></i><div><strong>SYSTEM OWNER FINDER</strong><span>Incident → TOR Mapping & Contact Routing · runs locally in Browser</span></div></div>
                    <button type="button" class="system-owner-finder-close" onclick="toggleSystemOwnerFinder(false)"><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i><span>HIDE</span></button>
                  </div>
                  <iframe id="systemOwnerFinderFrame" class="system-owner-finder-frame" src="system-owner-finder.html" title="System Owner Finder" loading="lazy" onload="syncSystemOwnerFinderTheme()"></iframe>
                </div>'''.strip()

if 'id="systemOwnerFinderPanel"' not in text:
    marker = '<button onclick="generateLogs()"'
    if marker not in text:
        raise SystemExit('Generate Logs button target not found')
    text = text.replace(marker, panel + '\n              ' + marker, 1)

helpers = r'''
  function currentSystemOwnerTheme(){return document.body?.dataset?.theme==='cyber'?'cyber':'gold'}
  function syncSystemOwnerFinderTheme(){const frame=document.getElementById('systemOwnerFinderFrame');if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'dhcp-theme',theme:currentSystemOwnerTheme()},location.origin)}catch{}}
  function setSystemOwnerFinderOpen(open){const panel=document.getElementById('systemOwnerFinderPanel'),button=document.getElementById('btnSystemOwnerFinder');if(!panel)return;const show=Boolean(open);panel.hidden=!show;panel.dataset.open=show?'true':'false';if(button)button.setAttribute('aria-expanded',show?'true':'false');if(show){syncSystemOwnerFinderTheme();requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}))}}
  function toggleSystemOwnerFinder(force){const panel=document.getElementById('systemOwnerFinderPanel');if(!panel)return;setSystemOwnerFinderOpen(typeof force==='boolean'?force:panel.hidden)}
  if(typeof MutationObserver!=='undefined'){new MutationObserver(mutations=>{if(mutations.some(m=>m.attributeName==='data-theme'))syncSystemOwnerFinderTheme()}).observe(document.body,{attributes:true,attributeFilter:['data-theme']})}
  window.addEventListener('message',event=>{if(event.origin!==location.origin)return;if(event.data?.type==='system-owner-ready')syncSystemOwnerFinderTheme()})
'''.strip()

if 'function toggleSystemOwnerFinder()' not in text and 'function toggleSystemOwnerFinder(force)' not in text:
    target = re.search(r'\n\s*async function fetchISPData\(\)\{', text)
    if not target:
        raise SystemExit('fetchISPData helper target not found')
    text = text[:target.start()] + '\n' + helpers + text[target.start():]

path.write_text(text, encoding='utf-8')
print('System Owner Finder integrated into Generate Log traffic')
