from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

css_marker = '/* tools-nav-hub-v1 */'
css = r'''
    /* tools-nav-hub-v1 */
    .mission-tool-shell{width:100%;height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:linear-gradient(145deg,var(--panel),rgba(3,7,12,.94))!important}
    .mission-tool-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border-bottom:1px solid rgba(var(--accentRgb),.14);background:linear-gradient(90deg,rgba(var(--accentRgb),.075),transparent 62%)}
    .mission-tool-title{display:flex;align-items:center;gap:10px;min-width:0}.mission-tool-title i{color:var(--accent);filter:drop-shadow(0 0 7px rgba(var(--accentRgb),.32))}.mission-tool-title strong{display:block;color:#fff;font-size:12px;letter-spacing:.075em}.mission-tool-title span{display:block;margin-top:2px;color:var(--muted);font-size:9px}
    .mission-tool-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid rgba(var(--accentRgb),.22);border-radius:999px;background:rgba(var(--accentRgb),.07);color:var(--accent);font:800 9px/1 'JetBrains Mono',monospace;letter-spacing:.06em;white-space:nowrap}
    .mission-tool-frame{display:block;flex:1 1 auto;min-height:0;width:100%;height:100%;border:0;background:var(--bg2)}
    #view-system-owner,#view-voip{min-height:0}
    #tab-system-owner,#tab-voip{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:800;letter-spacing:.035em}
    @media(max-width:900px){.mission-tool-title span{display:none}.mission-tool-head{padding:9px 11px}.mission-tool-badge{display:none}}
'''.strip()
if css_marker not in text:
    if '</style>' not in text:
        raise SystemExit('Style closing tag not found')
    text = text.replace('</style>', css + '\n  </style>', 1)

text = re.sub(r'\s*<button id="btnSystemOwnerFinder"[^>]*>.*?</button>', '', text, count=1, flags=re.S)

panel_start = text.find('<div id="systemOwnerFinderPanel"')
if panel_start >= 0:
    generate_at = text.find('<button onclick="generateLogs()"', panel_start)
    if generate_at < 0:
        raise SystemExit('Generate Logs button not found after old System Owner panel')
    text = text[:panel_start] + text[generate_at:]

legacy_helpers = r'''
  function currentSystemOwnerTheme(){return document.body?.dataset?.theme==='cyber'?'cyber':'gold'}
  function syncSystemOwnerFinderTheme(){const frame=document.getElementById('systemOwnerFinderFrame');if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'dhcp-theme',theme:currentSystemOwnerTheme()},location.origin)}catch{}}
  function setSystemOwnerFinderOpen(open){const panel=document.getElementById('systemOwnerFinderPanel'),button=document.getElementById('btnSystemOwnerFinder');if(!panel)return;const show=Boolean(open);panel.hidden=!show;panel.dataset.open=show?'true':'false';if(button)button.setAttribute('aria-expanded',show?'true':'false');if(show){syncSystemOwnerFinderTheme();requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}))}}
  function toggleSystemOwnerFinder(){const panel=document.getElementById('systemOwnerFinderPanel');if(!panel)return;setSystemOwnerFinderOpen(panel.hidden)}
  if(typeof MutationObserver!=='undefined'){new MutationObserver(mutations=>{if(mutations.some(m=>m.attributeName==='data-theme'))syncSystemOwnerFinderTheme()}).observe(document.body,{attributes:true,attributeFilter:['data-theme']})}
  window.addEventListener('message',event=>{if(event.origin!==location.origin)return;if(event.data?.type==='system-owner-ready')syncSystemOwnerFinderTheme()})
'''.strip()
text = text.replace(legacy_helpers, '')

owner_tab = '''<button onclick="switchTab('system-owner')" id="tab-system-owner" class="tab-btn h-full px-4 border-b-2 border-transparent whitespace-nowrap" style="color:var(--muted)"><i data-lucide="user-search" class="w-4 h-4 inline-block mr-2"></i>FIND SYSTEM OWNER</button>'''
voip_tab = '''<button onclick="switchTab('voip')" id="tab-voip" class="tab-btn h-full px-4 border-b-2 border-transparent whitespace-nowrap" style="color:var(--muted)"><i data-lucide="phone" class="w-4 h-4 inline-block mr-2"></i>VOIP Finder</button>'''
if 'id="tab-system-owner"' not in text:
    pattern = re.compile(r'(<button onclick="switchTab\(\'uih\'\)" id="tab-uih".*?</button>)', re.S)
    text, count = pattern.subn(r'\1' + owner_tab + voip_tab, text, count=1)
    if count != 1:
        raise SystemExit('Generate Log UIh tab target not found')

owner_view = r'''
          <section id="view-system-owner" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="mission-tool-shell glass-panel rounded-2xl accent-border">
              <div class="mission-tool-head">
                <div class="mission-tool-title"><i data-lucide="users-round" class="w-4 h-4"></i><div><strong>FIND SYSTEM OWNER</strong><span>Incident → TOR Mapping · Contact fields copy separately</span></div></div>
                <span class="mission-tool-badge">LOCAL · THEME SYNC</span>
              </div>
              <iframe id="systemOwnerFinderFrame" class="mission-tool-frame" src="system-owner-finder.html" title="System Owner Finder" loading="lazy" onload="syncSystemOwnerFinderTheme(document.body.dataset.theme || 'gold')"></iframe>
            </div>
          </section>'''.strip()
voip_view = r'''
          <section id="view-voip" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="mission-tool-shell glass-panel rounded-2xl accent-border">
              <div class="mission-tool-head">
                <div class="mission-tool-title"><i data-lucide="phone-call" class="w-4 h-4"></i><div><strong>VOIP FINDER</strong><span>หัวข้อใหญ่ → พื้นที่ / หน่วยงาน → หัวข้อ → VOIP</span></div></div>
                <span class="mission-tool-badge">1,090 RECORDS</span>
              </div>
              <iframe id="voipFinderFrame" class="mission-tool-frame" src="voip-finder.html" title="VOIP Finder" loading="lazy" onload="syncVoipFinderTheme(document.body.dataset.theme || 'gold')"></iframe>
            </div>
          </section>'''.strip()
if 'id="view-system-owner"' not in text:
    pattern = re.compile(r'(<section id="view-uih".*?</section>)', re.S)
    text, count = pattern.subn(r'\1\n\n          ' + owner_view + '\n\n          ' + voip_view, text, count=1)
    if count != 1:
        raise SystemExit('Generate Log UIh view target not found')

helper_marker = "function syncSystemOwnerFinderTheme(theme)"
if helper_marker not in text:
    sync_uih = "  function syncUIhTheme(theme){const frame=document.getElementById('uihFrame');if(frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'mission-theme',theme},window.location.origin)}"
    helpers = r'''
  function syncSystemOwnerFinderTheme(theme=document.body.dataset.theme||'gold'){const frame=document.getElementById('systemOwnerFinderFrame');if(frame?.contentWindow)frame.contentWindow.postMessage({type:'dhcp-theme',theme},window.location.origin)}
  function syncVoipFinderTheme(theme=document.body.dataset.theme||'gold'){const frame=document.getElementById('voipFinderFrame');if(frame?.contentWindow)frame.contentWindow.postMessage({type:'dhcp-theme',theme},window.location.origin)}
  window.addEventListener('message',event=>{if(event.origin!==window.location.origin)return;const data=event.data||{};if(data.type==='system-owner-ready')syncSystemOwnerFinderTheme();if(data.type==='voip-ready')syncVoipFinderTheme()});
'''.strip()
    if sync_uih not in text:
        raise SystemExit('UIh theme helper target not found')
    text = text.replace(sync_uih, sync_uih + '\n' + helpers, 1)

text = text.replace(
    "syncUIhTheme(theme);lucide.createIcons()",
    "syncUIhTheme(theme);syncSystemOwnerFinderTheme(theme);syncVoipFinderTheme(theme);lucide.createIcons()",
    1,
)
text = text.replace(
    "['dhcp','subnet','log','uih']",
    "['dhcp','subnet','log','uih','system-owner','voip']",
    1,
)

path.write_text(text, encoding='utf-8')
print('Top-level System Owner and VOIP Finder navigation integrated')
