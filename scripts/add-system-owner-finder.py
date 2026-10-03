from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# Remove the legacy inline placement from Generate Log traffic.
text = re.sub(r'\s*<button id="btnSystemOwnerFinder"[^>]*>.*?</button>', '', text, count=1, flags=re.S)
text = re.sub(r'\s*<div id="systemOwnerFinderPanel".*?<iframe id="systemOwnerFinderFrame".*?</iframe>\s*</div>', '', text, count=1, flags=re.S)

# Normalize prior Utility Dock implementations and any direct topbar System Owner / VOIP tabs.
text = re.sub(r'\n\s*/\* utility-tools-dock-v\d+ \*/.*?(?=\n\s*</style>)', '', text, flags=re.S)
text = re.sub(r'\s*<div id="utilityToolsDock".*?(?=\n\s*<div class="brand-block")', '\n', text, count=1, flags=re.S)
for action_id in ('tab-system-owner', 'tab-voip'):
    text = re.sub(rf'\s*<(?:button|a)\b[^>]*id="{action_id}"[^>]*>.*?</(?:button|a)>', '', text, count=1, flags=re.S)
for name in ('positionUtilityToolsMenu', 'setUtilityToolsOpen', 'toggleUtilityTools', 'closeUtilityToolsOnOutside'):
    text = re.sub(rf'\n\s*function {name}\([^\n]*\n?', '\n', text, count=1)
text = re.sub(r"\n\s*document\.addEventListener\('pointerdown',closeUtilityToolsOnOutside,true\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*document\.addEventListener\('keydown',event=>\{if\(event\.key==='Escape'\)setUtilityToolsOpen\(false\)\}\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*window\.addEventListener\('resize'.*?\n?", '\n', text, count=1)
text = re.sub(r"\n\s*window\.addEventListener\('scroll'.*?\n?", '\n', text, count=1)

# Remove obsolete inline-panel helpers while preserving the active top-level theme bridge.
for name in ('currentSystemOwnerTheme', 'setSystemOwnerFinderOpen', 'toggleSystemOwnerFinder'):
    text = re.sub(rf'\n\s*function {name}\([^\n]*\n', '\n', text, count=1)
text = re.sub(r"\n\s*if\(typeof MutationObserver!=='undefined'\)\{new MutationObserver\(mutations=>\{if\(mutations\.some\(m=>m\.attributeName==='data-theme'\)\)syncSystemOwnerFinderTheme\(\)\}\)\.observe\(document\.body,\{attributes:true,attributeFilter:\['data-theme'\]\}\)\}\n?", '\n', text, count=1)
text = re.sub(r"\n\s*window\.addEventListener\('message',event=>\{if\(event\.origin!==location\.origin\)return;if\(event\.data\?\.type==='system-owner-ready'\)syncSystemOwnerFinderTheme\(\)\}\)\n?", '\n', text, count=1)

css_marker = '/* topbar-owner-voip-v2 */'
css = r'''
    /* topbar-owner-voip-v2 */
    #view-system-owner,#view-voip{min-height:0;overflow:hidden}
    .tool-frame-shell{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;overflow:hidden;padding:0;background:rgba(0,0,0,.08)}
    .tool-frame-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border-bottom:1px solid rgba(var(--accentRgb),.13);background:linear-gradient(90deg,rgba(var(--accentRgb),.075),transparent 62%)}
    .tool-frame-title{display:flex;align-items:center;gap:9px;min-width:0}.tool-frame-title i{color:var(--accent);filter:drop-shadow(0 0 7px rgba(var(--accentRgb),.3))}.tool-frame-title strong{display:block;color:#fff;font-size:11px;letter-spacing:.08em}.tool-frame-title span{display:block;margin-top:2px;color:var(--muted);font-size:9px}
    .tool-frame{display:block;width:100%;height:100%;min-height:650px;border:0;background:#060a0f;flex:1 1 auto}
    .owner-copy-dock{padding:12px 13px;border-bottom:1px solid rgba(var(--accentRgb),.13);background:rgba(var(--accentRgb),.028)}
    .owner-copy-row{display:grid;grid-template-columns:minmax(220px,1.45fr) repeat(4,minmax(112px,.6fr));gap:8px;align-items:stretch}
    .owner-contact-input{min-height:42px!important;height:42px!important;resize:none!important;padding:10px 12px!important;font:500 11px/1.45 'JetBrains Mono',monospace}
    .owner-copy-card{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:7px 9px;border:1px solid rgba(var(--accentRgb),.16);border-radius:9px;background:rgba(255,255,255,.025);cursor:pointer;transition:.2s;text-align:left}
    .owner-copy-card:hover{border-color:rgba(var(--accentRgb),.48);background:rgba(var(--accentRgb),.08);transform:translateY(-1px)}
    .owner-copy-card small{color:var(--muted);font:800 8px/1 'JetBrains Mono',monospace;letter-spacing:.08em;margin-bottom:5px}.owner-copy-card strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--accent);font-size:11px}
    .owner-copy-hint{margin-top:7px;color:var(--muted);font-size:9px;line-height:1.45}.owner-copy-hint b{color:var(--accent)}
    @media(max-width:1100px){.owner-copy-row{grid-template-columns:1fr 1fr 1fr}.owner-contact-input{grid-column:1/-1}.tool-frame{min-height:720px}}
    @media(max-width:700px){#view-system-owner,#view-voip{overflow:visible}.tool-frame-shell{height:auto;min-height:860px}.owner-copy-row{grid-template-columns:1fr 1fr}.owner-contact-input{grid-column:1/-1}.tool-frame{min-height:720px}.tool-frame-title span{display:none}}
'''.strip()
if css_marker not in text:
    if '</style>' not in text:
        raise SystemExit('Style closing tag not found')
    text = text.replace('</style>', css + '\n  </style>', 1)

utility_css = r'''
    /* utility-tools-dock-v2 */
    .utility-tools-dock{position:relative;z-index:70;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;height:100%}
    .utility-tools-toggle{position:relative;width:40px;height:40px;display:grid;place-items:center;padding:0;border-radius:12px;border:1px solid rgba(var(--accentRgb),.34);background:linear-gradient(145deg,rgba(var(--accentRgb),.12),rgba(2,6,12,.80));color:var(--accent);cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 8px 22px rgba(0,0,0,.28),0 0 18px rgba(var(--accentRgb),.10);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease,background .2s ease}
    .utility-tools-toggle::before{content:"";position:absolute;inset:5px;border:1px solid rgba(var(--accentRgb),.14);border-radius:8px;pointer-events:none}
    .utility-tools-toggle::after{content:"";position:absolute;left:9px;right:9px;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);box-shadow:0 0 11px var(--accent);opacity:.72;transition:.2s ease}
    .utility-tools-toggle:hover,.utility-tools-dock[data-open="true"] .utility-tools-toggle{transform:translateY(-1px);border-color:rgba(var(--accentRgb),.78);background:linear-gradient(145deg,rgba(var(--accentRgb),.20),rgba(2,7,14,.88));box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 10px 26px rgba(0,0,0,.34),0 0 26px rgba(var(--accentRgb),.20)}
    .utility-tools-dock[data-open="true"] .utility-tools-toggle::after{opacity:1;transform:scaleX(1.35)}
    .utility-tools-toggle i{width:17px;height:17px;filter:drop-shadow(0 0 7px rgba(var(--accentRgb),.42))}
    .utility-tools-menu{position:fixed;top:0;right:auto;left:auto;z-index:9999;width:max-content;min-width:330px;display:grid;gap:6px;padding:7px;border:1px solid rgba(var(--accentRgb),.28);border-radius:14px;background:linear-gradient(145deg,rgba(5,9,15,.985),rgba(8,13,22,.985));backdrop-filter:blur(20px) saturate(135%);-webkit-backdrop-filter:blur(20px) saturate(135%);box-shadow:0 24px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.045),0 0 30px rgba(var(--accentRgb),.10);transform-origin:top right;animation:utilityDockIn .16s ease-out}
    body[data-theme="cyber"] .utility-tools-menu{background:linear-gradient(145deg,rgba(4,14,29,.99),rgba(5,10,22,.99))}
    .utility-tools-menu[hidden]{display:none!important}
    .utility-tools-menu::before{content:"";position:absolute;right:12px;top:-1px;width:55px;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);box-shadow:0 0 12px rgba(var(--accentRgb),.5)}
    .utility-tools-item{width:100%;min-height:44px;display:flex;align-items:center;gap:10px;padding:0 12px;border:1px solid rgba(var(--accentRgb),.12);border-radius:10px;background:rgba(var(--accentRgb),.035);color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.02em;text-align:left;text-decoration:none;white-space:nowrap;cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease,color .16s ease,box-shadow .16s ease}
    .utility-tools-item i{width:16px;height:16px;flex:0 0 auto;color:var(--accent);filter:drop-shadow(0 0 6px rgba(var(--accentRgb),.28))}
    .utility-tools-item:hover{transform:translateY(-1px);border-color:rgba(var(--accentRgb),.52);background:rgba(var(--accentRgb),.11);color:#fff;box-shadow:0 0 18px rgba(var(--accentRgb),.08)}
    .utility-tools-meta{margin-left:auto;color:rgba(148,163,184,.62);font:700 8px/1 'JetBrains Mono',monospace;letter-spacing:.08em}
    @keyframes utilityDockIn{from{opacity:0;transform:translateY(-7px) scale(.985)}to{opacity:1;transform:none}}
    @media(max-width:760px){.utility-tools-dock{height:auto}.utility-tools-toggle{width:38px;height:38px}.utility-tools-menu{left:10px!important;right:10px!important;width:auto;min-width:0;transform-origin:top center}.utility-tools-item{min-height:48px;font-size:12px}}
    @media(prefers-reduced-motion:reduce){.utility-tools-toggle,.utility-tools-item{transition:none!important}.utility-tools-menu{animation:none!important}}
'''.strip()
if '/* utility-tools-dock-v2 */' not in text:
    text = text.replace('</style>', utility_css + '\n  </style>', 1)

# Add compact Utility Dock after the main nav. Finder tools open as secure standalone tabs.
dock_markup = r'''
        <div id="utilityToolsDock" class="utility-tools-dock" data-open="false">
          <button id="utilityToolsToggle" type="button" class="utility-tools-toggle" onclick="toggleUtilityTools(event)" aria-label="Utility tools" title="Utility tools" aria-expanded="false" aria-controls="utilityToolsMenu"><i data-lucide="sparkles"></i></button>
          <div id="utilityToolsMenu" class="utility-tools-menu" role="group" aria-label="Utility tools" hidden>
            <a href="system-owner-finder.html" target="_blank" rel="noopener noreferrer" onclick="setUtilityToolsOpen(false)" id="tab-system-owner" class="utility-tools-item" title="Open System Owner Finder in new tab"><i data-lucide="user-search"></i><span>FIND SYSTEM OWNER</span><span class="utility-tools-meta">OPEN ↗</span></a>
            <a href="voip-finder.html" target="_blank" rel="noopener noreferrer" onclick="setUtilityToolsOpen(false)" id="tab-voip" class="utility-tools-item" title="Open VOIP Finder in new tab"><i data-lucide="phone-call"></i><span>VOIP Finder</span><span class="utility-tools-meta">OPEN ↗</span></a>
          </div>
        </div>'''.rstrip()
nav_end = text.find('</nav>')
if nav_end < 0:
    raise SystemExit('Topbar navigation closing tag not found')
nav_end += len('</nav>')
text = text[:nav_end] + '\n' + dock_markup + text[nav_end:]

# Add full themed legacy views for both tools when absent; they remain available for backwards compatibility.
if 'id="view-system-owner"' not in text:
    views = r'''

          <section id="view-system-owner" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="tool-frame-shell glass-panel rounded-2xl accent-border">
              <div class="tool-frame-head">
                <div class="tool-frame-title"><i data-lucide="users-round" class="w-4 h-4"></i><div><strong>SYSTEM OWNER FINDER</strong><span>TOR mapping · contact routing · local browser processing</span></div></div>
              </div>
              <div class="owner-copy-dock">
                <div class="owner-copy-row">
                  <textarea id="ownerContactInput" class="cyber-input owner-contact-input" placeholder="วาง Contact Routing เพื่อแยกคำนำหน้า / ชื่อ / โทร / Email แล้ว Copy แยกได้" oninput="renderOwnerContactQuickCopy()"></textarea>
                  <button type="button" class="owner-copy-card" data-owner-copy="prefix" onclick="copyOwnerPart('prefix')"><small>PREFIX</small><strong id="ownerPrefixValue">-</strong></button>
                  <button type="button" class="owner-copy-card" data-owner-copy="name" onclick="copyOwnerPart('name')"><small>NAME</small><strong id="ownerNameValue">-</strong></button>
                  <button type="button" class="owner-copy-card" data-owner-copy="phone" onclick="copyOwnerPart('phone')"><small>PHONE</small><strong id="ownerPhoneValue">-</strong></button>
                  <button type="button" class="owner-copy-card" data-owner-copy="email" onclick="copyOwnerPart('email')"><small>EMAIL</small><strong id="ownerEmailValue">-</strong></button>
                </div>
                <div class="owner-copy-hint">แยกคำนำหน้า <b>นาย / นาง / นางสาว / คุณ / น.ส.</b> ออกจากชื่ออัตโนมัติ · กดแต่ละช่องเพื่อ Copy ค่าเฉพาะส่วนนั้น</div>
              </div>
              <iframe id="systemOwnerFinderFrame" class="tool-frame" src="system-owner-finder.html" title="System Owner Finder" loading="eager" onload="syncSystemOwnerFinderTheme(document.body.dataset.theme || 'gold')"></iframe>
            </div>
          </section>

          <section id="view-voip" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="tool-frame-shell glass-panel rounded-2xl accent-border">
              <div class="tool-frame-head">
                <div class="tool-frame-title"><i data-lucide="phone-call" class="w-4 h-4"></i><div><strong>VOIP FINDER</strong><span>หัวข้อใหญ่ · พื้นที่ / หน่วยงาน · หัวข้อ · VOIP</span></div></div>
              </div>
              <iframe id="voipFinderFrame" class="tool-frame" src="voip-finder.html" title="VOIP Finder" loading="lazy" onload="syncVoipFinderTheme(document.body.dataset.theme || 'gold')"></iframe>
            </div>
          </section>'''.rstrip()
    pattern = re.compile(r'(<section id="view-uih".*?</section>)', re.S)
    text, count = pattern.subn(r'\1' + views, text, count=1)
    if count != 1:
        raise SystemExit('Generate Log UIh view target not found')

helpers_marker = 'function parseOwnerContact('
if helpers_marker not in text:
    helpers = r'''
  function parseOwnerContact(raw){const original=String(raw||'').replace(/\s+/g,' ').trim();let text=original;const email=(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[''])[0];if(email)text=text.replace(email,' ').replace(/\s+/g,' ').trim();const phone=(text.match(/(?:\+?66[\s-]?)?(?:0\d{1,2}|\d{4})(?:[\s-]?\d){3,10}/)||[''])[0];if(phone)text=text.replace(phone,' ').replace(/\s+/g,' ').trim();const prefixMatch=text.match(/^(นางสาว|น\.ส\.|น\.ส|นาย|นาง|คุณ)\s*/);const prefix=prefixMatch?prefixMatch[1]:'';if(prefixMatch)text=text.slice(prefixMatch[0].length).trim();return{prefix,name:text,phone:phone.trim(),email}}
  function renderOwnerContactQuickCopy(){const parsed=parseOwnerContact(document.getElementById('ownerContactInput')?.value||'');[['Prefix','prefix'],['Name','name'],['Phone','phone'],['Email','email']].forEach(([label,key])=>{const el=document.getElementById(`owner${label}Value`);if(el)el.textContent=parsed[key]||'-'});return parsed}
  function copyOwnerPart(part){const parsed=renderOwnerContactQuickCopy(),value=parsed[part]||'';if(!value)return;copyString(value)}
  function syncSystemOwnerFinderTheme(theme=document.body.dataset.theme||'gold'){const frame=document.getElementById('systemOwnerFinderFrame');if(frame?.contentWindow)try{frame.contentWindow.postMessage({type:'dhcp-theme',theme},location.origin)}catch{}}
  function syncVoipFinderTheme(theme=document.body.dataset.theme||'gold'){const frame=document.getElementById('voipFinderFrame');if(frame?.contentWindow)try{frame.contentWindow.postMessage({type:'dhcp-theme',theme},location.origin)}catch{}}
  window.addEventListener('message',event=>{if(event.origin!==location.origin)return;const type=event.data?.type;if(type==='system-owner-ready')syncSystemOwnerFinderTheme();if(type==='voip-ready')syncVoipFinderTheme()})
'''.strip()
    target = re.search(r'\n\s*async function fetchISPData\(\)\{', text)
    if not target:
        raise SystemExit('fetchISPData helper target not found')
    text = text[:target.start()] + '\n' + helpers + text[target.start():]

utility_helpers = r'''
  function positionUtilityToolsMenu(){const toggle=document.getElementById('utilityToolsToggle'),menu=document.getElementById('utilityToolsMenu');if(!toggle||!menu||menu.hidden)return;const r=toggle.getBoundingClientRect(),gap=8;if(window.innerWidth<=760){menu.style.left='10px';menu.style.right='10px';menu.style.top=`${Math.max(10,r.bottom+gap)}px`;menu.style.width='auto';return}menu.style.left='auto';menu.style.right=`${Math.max(10,window.innerWidth-r.right)}px`;menu.style.top=`${Math.max(10,r.bottom+gap)}px`;menu.style.width='max-content'}
  function setUtilityToolsOpen(open){const dock=document.getElementById('utilityToolsDock'),toggle=document.getElementById('utilityToolsToggle'),menu=document.getElementById('utilityToolsMenu');if(!dock||!toggle||!menu)return;const show=Boolean(open);dock.dataset.open=show?'true':'false';toggle.setAttribute('aria-expanded',show?'true':'false');menu.hidden=!show;if(show)requestAnimationFrame(()=>{positionUtilityToolsMenu();lucide.createIcons()})}
  function toggleUtilityTools(event){event?.preventDefault?.();event?.stopPropagation?.();const dock=document.getElementById('utilityToolsDock');setUtilityToolsOpen(dock?.dataset.open!=='true')}
  function closeUtilityToolsOnOutside(event){const dock=document.getElementById('utilityToolsDock');if(dock?.dataset.open==='true'&&!dock.contains(event.target))setUtilityToolsOpen(false)}
  document.addEventListener('pointerdown',closeUtilityToolsOnOutside,true)
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setUtilityToolsOpen(false)})
  window.addEventListener('resize',()=>{const dock=document.getElementById('utilityToolsDock');if(dock?.dataset.open==='true')positionUtilityToolsMenu()})
  window.addEventListener('scroll',()=>{const dock=document.getElementById('utilityToolsDock');if(dock?.dataset.open==='true')positionUtilityToolsMenu()},true)
'''.strip()
if 'function positionUtilityToolsMenu(' not in text:
    target = re.search(r'\n\s*async function fetchISPData\(\)\{', text)
    if not target:
        raise SystemExit('Utility helper insertion target not found')
    text = text[:target.start()] + '\n' + utility_helpers + text[target.start():]

# Theme changes must be forwarded to both embedded tools.
old_theme = 'syncUIhTheme(theme);lucide.createIcons()'
new_theme = 'syncUIhTheme(theme);syncSystemOwnerFinderTheme(theme);syncVoipFinderTheme(theme);lucide.createIcons()'
if new_theme not in text:
    if old_theme not in text:
        raise SystemExit('setTheme sync target not found')
    text = text.replace(old_theme, new_theme, 1)

old_tabs = "['dhcp','subnet','log','uih'].forEach"
new_tabs = "['dhcp','subnet','log','uih','system-owner','voip'].forEach"
if new_tabs not in text:
    if old_tabs not in text:
        raise SystemExit('switchTab target list not found')
    text = text.replace(old_tabs, new_tabs, 1)

path.write_text(text, encoding='utf-8')
print('System Owner and VOIP Finder are hidden in the fixed Utility Dock and open in standalone tabs')
