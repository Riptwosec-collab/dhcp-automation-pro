from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# Remove legacy inline placement from Generate Log traffic.
text = re.sub(r'\s*<button id="btnSystemOwnerFinder"[^>]*>.*?</button>', '', text, count=1, flags=re.S)
text = re.sub(r'\s*<div id="systemOwnerFinderPanel".*?<iframe id="systemOwnerFinderFrame".*?</iframe>\s*</div>', '', text, count=1, flags=re.S)

# Remove any previous direct tabs, Utility Dock and legacy embedded finder views.
for action_id in ('tab-system-owner', 'tab-voip'):
    text = re.sub(rf'\s*<(?:button|a)\b[^>]*id="{action_id}"[^>]*>.*?</(?:button|a)>', '', text, count=1, flags=re.S)
text = re.sub(r'\s*<div id="utilityToolsDock".*?(?=\n\s*<div class="brand-block")', '\n', text, count=1, flags=re.S)
text = re.sub(r'\n\s*<section id="view-system-owner".*?</section>', '', text, count=1, flags=re.S)
text = re.sub(r'\n\s*<section id="view-voip".*?</section>', '', text, count=1, flags=re.S)

# Remove stale style layers before inserting the canonical standalone Utility Dock layer.
text = re.sub(r'\n\s*/\* topbar-owner-voip-v\d+ \*/.*?(?=\n\s*/\* utility-tools-dock-v\d+ \*/|\n\s*</style>)', '', text, flags=re.S)
text = re.sub(r'\n\s*/\* utility-tools-dock-v\d+ \*/.*?(?=\n\s*</style>)', '', text, flags=re.S)

# Remove old Utility Dock handlers so the script remains idempotent.
for name in ('positionUtilityToolsMenu', 'setUtilityToolsOpen', 'toggleUtilityTools', 'closeUtilityToolsOnOutside'):
    text = re.sub(rf'\n\s*function {name}\([^\n]*\n?', '\n', text, count=1)
text = re.sub(r"\n\s*document\.addEventListener\('pointerdown',closeUtilityToolsOnOutside,true\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*document\.addEventListener\('keydown',event=>\{if\(event\.key==='Escape'\)setUtilityToolsOpen\(false\)\}\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*window\.addEventListener\('resize',\(\)=>\{const dock=document\.getElementById\('utilityToolsDock'\).*?\}\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*window\.addEventListener\('scroll',\(\)=>\{const dock=document\.getElementById\('utilityToolsDock'\).*?\},true\)\n?", '\n', text, count=1)

# Finder pages are standalone now. Do not keep them in the main workspace switch list.
text = text.replace("['dhcp','subnet','log','uih','system-owner','voip'].forEach", "['dhcp','subnet','log','uih'].forEach")

utility_css = r'''
    /* utility-tools-dock-v3 */
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
if '</style>' not in text:
    raise SystemExit('Style closing tag not found')
text = text.replace('</style>', utility_css + '\n  </style>', 1)

dock_markup = r'''
        <div id="utilityToolsDock" class="utility-tools-dock" data-open="false">
          <button id="utilityToolsToggle" type="button" class="utility-tools-toggle" onclick="toggleUtilityTools(event)" aria-label="Utility tools" title="Utility tools" aria-expanded="false" aria-controls="utilityToolsMenu"><i data-lucide="sparkles"></i></button>
          <div id="utilityToolsMenu" class="utility-tools-menu" role="group" aria-label="Utility tools" hidden>
            <a href="system-owner-finder.html" target="_blank" rel="noopener noreferrer" onclick="setUtilityToolsOpen(false)" id="tab-system-owner" class="utility-tools-item" data-standalone-tool="system-owner" title="Open System Owner Finder in a new page"><i data-lucide="user-search"></i><span>FIND SYSTEM OWNER</span><span class="utility-tools-meta">OPEN ↗</span></a>
            <a href="voip-finder.html" target="_blank" rel="noopener noreferrer" onclick="setUtilityToolsOpen(false)" id="tab-voip" class="utility-tools-item" data-standalone-tool="voip" title="Open VOIP Finder in a new page"><i data-lucide="phone-call"></i><span>VOIP Finder</span><span class="utility-tools-meta">OPEN ↗</span></a>
          </div>
        </div>'''.rstrip()
nav_end = text.find('</nav>')
if nav_end < 0:
    raise SystemExit('Topbar navigation closing tag not found')
nav_end += len('</nav>')
text = text[:nav_end] + '\n' + dock_markup + text[nav_end:]

utility_js = r'''
  function positionUtilityToolsMenu(){const toggle=document.getElementById('utilityToolsToggle'),menu=document.getElementById('utilityToolsMenu');if(!toggle||!menu||menu.hidden)return;const r=toggle.getBoundingClientRect(),gap=8;if(window.innerWidth<=760){menu.style.left='10px';menu.style.right='10px';menu.style.top=`${Math.max(10,r.bottom+gap)}px`;menu.style.width='auto';return}menu.style.left='auto';menu.style.right=`${Math.max(10,window.innerWidth-r.right)}px`;menu.style.top=`${Math.max(10,r.bottom+gap)}px`;menu.style.width='max-content'}
  function setUtilityToolsOpen(open){const dock=document.getElementById('utilityToolsDock'),toggle=document.getElementById('utilityToolsToggle'),menu=document.getElementById('utilityToolsMenu');if(!dock||!toggle||!menu)return;const show=Boolean(open);dock.dataset.open=show?'true':'false';toggle.setAttribute('aria-expanded',show?'true':'false');menu.hidden=!show;if(show)requestAnimationFrame(()=>{positionUtilityToolsMenu();lucide.createIcons()})}
  function toggleUtilityTools(event){event?.preventDefault?.();event?.stopPropagation?.();const dock=document.getElementById('utilityToolsDock');setUtilityToolsOpen(dock?.dataset.open!=='true')}
  function closeUtilityToolsOnOutside(event){const dock=document.getElementById('utilityToolsDock');if(dock?.dataset.open==='true'&&!dock.contains(event.target))setUtilityToolsOpen(false)}
  document.addEventListener('pointerdown',closeUtilityToolsOnOutside,true)
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setUtilityToolsOpen(false)})
  window.addEventListener('resize',()=>{const dock=document.getElementById('utilityToolsDock');if(dock?.dataset.open==='true')positionUtilityToolsMenu()})
  window.addEventListener('scroll',()=>{const dock=document.getElementById('utilityToolsDock');if(dock?.dataset.open==='true')positionUtilityToolsMenu()},true)
'''.rstrip()
insert_target = re.search(r'\n\s*async function fetchISPData\(\)\{', text)
if not insert_target:
    raise SystemExit('fetchISPData helper target not found')
text = text[:insert_target.start()] + '\n' + utility_js + text[insert_target.start():]

path.write_text(text, encoding='utf-8')
print('System Owner and VOIP Finder are standalone Utility Dock pages; embedded workspace views removed')
