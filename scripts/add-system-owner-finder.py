from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# Remove legacy in-form trigger from Generate Log traffic.
text = re.sub(r'\s*<button id="btnSystemOwnerFinder"\b.*?</button>', '', text, count=1, flags=re.S)

legacy_panel = '''<div id="systemOwnerFinderPanel" class="md:col-span-2 system-owner-finder-panel" hidden data-open="false">
                  <div class="system-owner-finder-head">
                    <div class="system-owner-finder-title"><i data-lucide="users-round" class="w-4 h-4"></i><div><strong>SYSTEM OWNER FINDER</strong><span>Incident → TOR Mapping & Contact Routing · runs locally in Browser</span></div></div>
                    <button type="button" class="system-owner-finder-close" onclick="setSystemOwnerFinderOpen(false)"><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i><span>HIDE</span></button>
                  </div>
                  <iframe id="systemOwnerFinderFrame" class="system-owner-finder-frame" src="system-owner-finder.html" title="System Owner Finder" loading="lazy" onload="syncSystemOwnerFinderTheme()"></iframe>
                </div>'''
text = text.replace(legacy_panel, '')

css_marker = '/* mission-tools-navigation-v2 */'
css = r'''
    /* mission-tools-navigation-v2 */
    .tool-frame-shell{position:relative;overflow:hidden;display:flex;flex-direction:column;height:100%;min-height:0;background:linear-gradient(145deg,var(--panel),rgba(3,7,12,.94));border:1px solid rgba(var(--accentRgb),.18);box-shadow:0 20px 54px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.04)}
    .tool-frame-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border-bottom:1px solid rgba(var(--accentRgb),.14);background:linear-gradient(90deg,rgba(var(--accentRgb),.08),transparent 64%);flex:0 0 auto}
    .tool-frame-title{display:flex;align-items:center;gap:9px;min-width:0}.tool-frame-title i{color:var(--accent);filter:drop-shadow(0 0 8px rgba(var(--accentRgb),.38))}.tool-frame-title strong{display:block;color:#fff;font-size:11px;letter-spacing:.085em}.tool-frame-title span{display:block;margin-top:2px;color:var(--muted);font-size:9px}
    .tool-frame-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;border:1px solid rgba(var(--accentRgb),.22);background:rgba(var(--accentRgb),.075);color:var(--accent);font:800 9px/1 'JetBrains Mono',monospace;letter-spacing:.05em;white-space:nowrap}
    .tool-frame-iframe{display:block;width:100%;height:100%;min-height:0;flex:1 1 auto;border:0;background:#060a0f}
    @media(max-width:760px){.tool-frame-head{align-items:flex-start}.tool-frame-title span{display:none}.tool-frame-badge{font-size:8px}}
'''.strip()
if css_marker not in text:
    if '</style>' not in text:
        raise SystemExit('Style closing tag not found')
    text = text.replace('</style>', css + '\n  </style>', 1)

# Add top-level tools immediately after Generate Log UIh.
if 'id="tab-system-owner"' not in text:
    tab_pattern = re.compile(r'(<button onclick="switchTab\(\'uih\'\)" id="tab-uih".*?</button>)', re.S)
    tabs = r'''\1
          <button onclick="switchTab('system-owner')" id="tab-system-owner" class="tab-btn h-full px-4 border-b-2 border-transparent whitespace-nowrap" style="color:var(--muted)"><i data-lucide="user-search" class="w-4 h-4 inline-block mr-2"></i>FIND SYSTEM OWNER</button>
          <button onclick="switchTab('voip')" id="tab-voip" class="tab-btn h-full px-4 border-b-2 border-transparent whitespace-nowrap" style="color:var(--muted)"><i data-lucide="phone-call" class="w-4 h-4 inline-block mr-2"></i>VOIP Finder</button>'''
    text, count = tab_pattern.subn(tabs, text, count=1)
    if count != 1:
        raise SystemExit('Generate Log UIh nav target not found')

views = r'''

          <section id="view-system-owner" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="tool-frame-shell glass-panel rounded-2xl accent-border">
              <div class="tool-frame-head">
                <div class="tool-frame-title"><i data-lucide="users-round" class="w-4 h-4"></i><div><strong>SYSTEM OWNER FINDER</strong><span>Incident → TOR Mapping & Contact Routing · click each contact field to copy</span></div></div>
                <span class="tool-frame-badge">THEME SYNC</span>
              </div>
              <iframe id="systemOwnerFinderFrame" class="tool-frame-iframe" src="system-owner-finder.html" title="System Owner Finder" loading="eager" onload="syncToolFramesTheme()"></iframe>
            </div>
          </section>

          <section id="view-voip" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="tool-frame-shell glass-panel rounded-2xl accent-border">
              <div class="tool-frame-head">
                <div class="tool-frame-title"><i data-lucide="phone-call" class="w-4 h-4"></i><div><strong>VOIP FINDER</strong><span>หัวข้อใหญ่ → พื้นที่ / หน่วยงาน → หัวข้อ → VOIP</span></div></div>
                <span class="tool-frame-badge">1,090 RECORDS</span>
              </div>
              <iframe id="voipFinderFrame" class="tool-frame-iframe" src="voip-finder.html" title="VOIP Finder" loading="eager" onload="syncToolFramesTheme()"></iframe>
            </div>
          </section>'''.rstrip()

if 'id="view-system-owner"' not in text:
    pattern = re.compile(r'(<section id="view-uih"\b.*?</section>)', re.S)
    text, count = pattern.subn(r'\1' + views, text, count=1)
    if count != 1:
        raise SystemExit('Generate Log UIh view target not found')

legacy_helpers = '''function currentSystemOwnerTheme(){return document.body?.dataset?.theme==='cyber'?'cyber':'gold'}
  function syncSystemOwnerFinderTheme(){const frame=document.getElementById('systemOwnerFinderFrame');if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'dhcp-theme',theme:currentSystemOwnerTheme()},location.origin)}catch{}}
  function setSystemOwnerFinderOpen(open){const panel=document.getElementById('systemOwnerFinderPanel'),button=document.getElementById('btnSystemOwnerFinder');if(!panel)return;const show=Boolean(open);panel.hidden=!show;panel.dataset.open=show?'true':'false';if(button)button.setAttribute('aria-expanded',show?'true':'false');if(show){syncSystemOwnerFinderTheme();requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}))}}
  function toggleSystemOwnerFinder(){const panel=document.getElementById('systemOwnerFinderPanel');if(!panel)return;setSystemOwnerFinderOpen(panel.hidden)}
  if(typeof MutationObserver!=='undefined'){new MutationObserver(mutations=>{if(mutations.some(m=>m.attributeName==='data-theme'))syncSystemOwnerFinderTheme()}).observe(document.body,{attributes:true,attributeFilter:['data-theme']})}
  window.addEventListener('message',event=>{if(event.origin!==location.origin)return;if(event.data?.type==='system-owner-ready')syncSystemOwnerFinderTheme()})'''
text = text.replace(legacy_helpers, '')

sync_helper = '''function syncToolFramesTheme(theme=document.body.dataset.theme||'gold'){for(const id of ['systemOwnerFinderFrame','voipFinderFrame']){const frame=document.getElementById(id);if(!frame?.contentWindow)continue;try{frame.contentWindow.postMessage({type:'dhcp-theme',theme},window.location.origin)}catch{}}}'''
if 'function syncToolFramesTheme()' not in text and 'function syncToolFramesTheme(theme=' not in text:
    marker = "function syncUIhTheme(theme){const frame=document.getElementById('uihFrame');if(frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'mission-theme',theme},window.location.origin)}"
    if marker not in text:
        raise SystemExit('UIh theme helper target not found')
    text = text.replace(marker, marker + '\n  ' + sync_helper, 1)

ready_listener = "window.addEventListener('message',event=>{if(event.origin!==window.location.origin)return;const data=event.data||{};if(data.type==='mission-tools-ready'||data.type==='system-owner-ready'||data.type==='voip-ready')syncToolFramesTheme(document.body.dataset.theme||'gold')});"
if "data.type==='voip-ready'" not in text:
    marker = "window.addEventListener('message',event=>{if(event.origin!==window.location.origin)return;const data=event.data||{};if(data.type==='uih-ready')syncUIhTheme(document.body.dataset.theme||'gold')});"
    if marker not in text:
        raise SystemExit('UIh ready listener target not found')
    text = text.replace(marker, marker + '\n  ' + ready_listener, 1)

old_theme = "function setTheme(theme){document.body.dataset.theme=theme;localStorage.setItem('missionTheme',theme);document.getElementById('themeGold').classList.toggle('active',theme==='gold');document.getElementById('themeCyber').classList.toggle('active',theme==='cyber');syncUIhTheme(theme);lucide.createIcons()}"
new_theme = "function setTheme(theme){document.body.dataset.theme=theme;localStorage.setItem('missionTheme',theme);document.getElementById('themeGold').classList.toggle('active',theme==='gold');document.getElementById('themeCyber').classList.toggle('active',theme==='cyber');syncUIhTheme(theme);syncToolFramesTheme(theme);lucide.createIcons()}"
if old_theme in text:
    text = text.replace(old_theme, new_theme, 1)
elif new_theme not in text:
    raise SystemExit('Theme setter target not found')

old_tabs = "['dhcp','subnet','log','uih']"
new_tabs = "['dhcp','subnet','log','uih','system-owner','voip']"
if old_tabs in text:
    text = text.replace(old_tabs, new_tabs, 1)
elif new_tabs not in text:
    raise SystemExit('switchTab list target not found')

path.write_text(text, encoding='utf-8')
print('System Owner and VOIP Finder moved to top navigation')
