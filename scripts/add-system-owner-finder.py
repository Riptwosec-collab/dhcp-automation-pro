from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# Remove legacy inline placement from Generate Log traffic.
text = re.sub(r'\s*<button id="btnSystemOwnerFinder"[^>]*>.*?</button>', '', text, count=1, flags=re.S)
text = re.sub(r'\s*<div id="systemOwnerFinderPanel".*?<iframe id="systemOwnerFinderFrame".*?</iframe>\s*</div>', '', text, count=1, flags=re.S)

# Remove previous Utility controls and workspace views so this generator is idempotent.
for action_id in ('tab-system-owner', 'tab-voip', 'tab-operations'):
    text = re.sub(rf'\s*<(?:button|a)\b[^>]*id="{action_id}"[^>]*>.*?</(?:button|a)>', '', text, count=1, flags=re.S)
text = re.sub(r'\s*<div id="utilityToolsDock".*?(?=\n\s*<div class="brand-block")', '\n', text, count=1, flags=re.S)
for view_id in ('view-system-owner', 'view-voip', 'view-operations'):
    text = re.sub(rf'\n\s*<section id="{view_id}".*?</section>', '', text, count=1, flags=re.S)

# Remove stale style layers before inserting the canonical same-page Utility layer.
text = re.sub(r'\n\s*/\* topbar-owner-voip-v\d+ \*/.*?(?=\n\s*/\* utility-tools-dock-v\d+ \*/|\n\s*/\* same-page-utility-v\d+ \*/|\n\s*</style>)', '', text, flags=re.S)
text = re.sub(r'\n\s*/\* utility-tools-dock-v\d+ \*/.*?(?=\n\s*/\* same-page-utility-v\d+ \*/|\n\s*</style>)', '', text, flags=re.S)
text = re.sub(r'\n\s*/\* same-page-utility-v\d+ \*/.*?(?=\n\s*</style>)', '', text, flags=re.S)

# Remove old Utility handlers before rebuilding them.
for name in ('positionUtilityToolsMenu', 'setUtilityToolsOpen', 'toggleUtilityTools', 'closeUtilityToolsOnOutside', 'openUtilityWorkspace', 'returnFromUtilityWorkspace', 'syncOperationsMessagesTheme'):
    text = re.sub(rf'\n\s*function {name}\([^\n]*\n?', '\n', text, count=1)
text = re.sub(r"\n\s*let lastCoreTab='[^']*';?\n?", '\n', text, count=1)
text = re.sub(r"\n\s*document\.addEventListener\('pointerdown',closeUtilityToolsOnOutside,true\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*document\.addEventListener\('keydown',event=>\{if\(event\.key==='Escape'\)setUtilityToolsOpen\(false\)\}\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*window\.addEventListener\('resize',\(\)=>\{const dock=document\.getElementById\('utilityToolsDock'\).*?\}\)\n?", '\n', text, count=1)
text = re.sub(r"\n\s*window\.addEventListener\('scroll',\(\)=>\{const dock=document\.getElementById\('utilityToolsDock'\).*?\},true\)\n?", '\n', text, count=1)

utility_css = r'''
    /* utility-tools-dock-v4 */
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
    .utility-tools-item:hover,.utility-tools-item.active{transform:translateY(-1px);border-color:rgba(var(--accentRgb),.52);background:rgba(var(--accentRgb),.11);color:#fff;box-shadow:0 0 18px rgba(var(--accentRgb),.08)}
    .utility-tools-meta{margin-left:auto;color:rgba(148,163,184,.62);font:700 8px/1 'JetBrains Mono',monospace;letter-spacing:.08em}
    @keyframes utilityDockIn{from{opacity:0;transform:translateY(-7px) scale(.985)}to{opacity:1;transform:none}}
    @media(max-width:760px){.utility-tools-dock{height:auto}.utility-tools-toggle{width:38px;height:38px}.utility-tools-menu{left:10px!important;right:10px!important;width:auto;min-width:0;transform-origin:top center}.utility-tools-item{min-height:48px;font-size:12px}}
    @media(prefers-reduced-motion:reduce){.utility-tools-toggle,.utility-tools-item{transition:none!important}.utility-tools-menu{animation:none!important}}

    /* same-page-utility-v1 */
    .utility-workspace-shell{width:100%;height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:0;background:rgba(0,0,0,.08)}
    .utility-workspace-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid rgba(var(--accentRgb),.14);background:linear-gradient(90deg,rgba(var(--accentRgb),.075),transparent 62%)}
    .utility-workspace-title{display:flex;align-items:center;gap:9px;min-width:0}.utility-workspace-title i{width:16px;height:16px;color:var(--accent);filter:drop-shadow(0 0 7px rgba(var(--accentRgb),.30))}.utility-workspace-title strong{display:block;color:#fff;font-size:11px;letter-spacing:.08em}.utility-workspace-title span{display:block;margin-top:2px;color:var(--muted);font-size:9px}
    .utility-workspace-back{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:9px;border:1px solid rgba(var(--accentRgb),.24);background:rgba(var(--accentRgb),.06);color:var(--accent);font:800 9px/1 'JetBrains Mono',monospace;letter-spacing:.06em;white-space:nowrap;transition:.18s ease}.utility-workspace-back:hover{border-color:rgba(var(--accentRgb),.55);background:rgba(var(--accentRgb),.13);box-shadow:0 0 16px rgba(var(--accentRgb),.10)}
    .utility-workspace-frame{display:block;width:100%;height:100%;min-height:0;flex:1 1 auto;border:0;background:#060a0f}
    @media(max-width:767px){#view-system-owner,#view-voip,#view-operations{min-height:820px}.utility-workspace-shell{height:820px;min-height:820px}.utility-workspace-title span{display:none}}
'''.strip()
if '</style>' not in text:
    raise SystemExit('Style closing tag not found')
text = text.replace('</style>', utility_css + '\n  </style>', 1)

dock_markup = r'''
        <div id="utilityToolsDock" class="utility-tools-dock" data-open="false">
          <button id="utilityToolsToggle" type="button" class="utility-tools-toggle" onclick="toggleUtilityTools(event)" aria-label="Utility tools" title="Utility tools" aria-expanded="false" aria-controls="utilityToolsMenu"><i data-lucide="sparkles"></i></button>
          <div id="utilityToolsMenu" class="utility-tools-menu" role="group" aria-label="Utility tools" hidden>
            <button type="button" onclick="openUtilityWorkspace('system-owner')" id="tab-system-owner" class="utility-tools-item" title="Open System Owner Finder in this workspace"><i data-lucide="user-search"></i><span>FIND SYSTEM OWNER</span><span class="utility-tools-meta">OPEN ›</span></button>
            <button type="button" onclick="openUtilityWorkspace('voip')" id="tab-voip" class="utility-tools-item" title="Open VOIP Finder in this workspace"><i data-lucide="phone-call"></i><span>VOIP Finder</span><span class="utility-tools-meta">OPEN ›</span></button>
            <button type="button" onclick="openUtilityWorkspace('operations')" id="tab-operations" class="utility-tools-item" title="Open Operations Messages in this workspace"><i data-lucide="list-checks"></i><span>Operations Messages</span><span class="utility-tools-meta">OPEN ›</span></button>
          </div>
        </div>'''.rstrip()
nav_end = text.find('</nav>')
if nav_end < 0:
    raise SystemExit('Topbar navigation closing tag not found')
nav_end += len('</nav>')
text = text[:nav_end] + '\n' + dock_markup + text[nav_end:]

views = r'''

          <section id="view-system-owner" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="utility-workspace-shell glass-panel rounded-2xl accent-border">
              <div class="utility-workspace-head"><div class="utility-workspace-title"><i data-lucide="user-search"></i><div><strong>FIND SYSTEM OWNER</strong><span>TOR mapping · contact routing</span></div></div><button type="button" class="utility-workspace-back" onclick="returnFromUtilityWorkspace()"><i data-lucide="arrow-left"></i>BACK</button></div>
              <iframe id="systemOwnerFinderFrame" class="utility-workspace-frame" src="system-owner-finder.html" title="System Owner Finder" loading="eager" onload="syncSystemOwnerFinderTheme(document.body.dataset.theme || 'gold')"></iframe>
            </div>
          </section>

          <section id="view-voip" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="utility-workspace-shell glass-panel rounded-2xl accent-border">
              <div class="utility-workspace-head"><div class="utility-workspace-title"><i data-lucide="phone-call"></i><div><strong>VOIP FINDER</strong><span>พื้นที่ · หน่วยงาน · VOIP lookup</span></div></div><button type="button" class="utility-workspace-back" onclick="returnFromUtilityWorkspace()"><i data-lucide="arrow-left"></i>BACK</button></div>
              <iframe id="voipFinderFrame" class="utility-workspace-frame" src="voip-finder.html" title="VOIP Finder" loading="eager" onload="syncVoipFinderTheme(document.body.dataset.theme || 'gold')"></iframe>
            </div>
          </section>

          <section id="view-operations" class="view-panel hidden h-full min-h-0 flex-col animate-enter">
            <div class="utility-workspace-shell glass-panel rounded-2xl accent-border">
              <div class="utility-workspace-head"><div class="utility-workspace-title"><i data-lucide="list-checks"></i><div><strong>OPERATIONS MESSAGES</strong><span>Alerts · incidents · standard operations · live time</span></div></div><button type="button" class="utility-workspace-back" onclick="returnFromUtilityWorkspace()"><i data-lucide="arrow-left"></i>BACK</button></div>
              <iframe id="operationsMessagesFrame" class="utility-workspace-frame" src="operations-messages.html" title="Operations Messages" loading="eager" onload="syncOperationsMessagesTheme(document.body.dataset.theme || 'gold')"></iframe>
            </div>
          </section>'''.rstrip()
workspace_end = text.find('\n        </div>\n      </main>')
if workspace_end < 0:
    raise SystemExit('Workspace closing marker not found')
text = text[:workspace_end] + views + text[workspace_end:]

# Replace the core-only switcher with a null-safe switcher that supports Utility menu buttons.
text = re.sub(
    r"\n\s*function switchTab\(tab\)\{[^\n]*\}",
    "\n  let lastCoreTab='dhcp';\n  function switchTab(tab){const tabs=['dhcp','subnet','log','uih','system-owner','voip','operations'];const core=['dhcp','subnet','log','uih'];tabs.forEach(t=>{const view=document.getElementById(`view-${t}`),btn=document.getElementById(`tab-${t}`);if(view){view.classList.add('hidden');view.classList.remove('flex','animate-enter')}if(btn){btn.classList.remove('active','accent-text');btn.style.borderColor='transparent';btn.style.color='var(--muted)'}});const v=document.getElementById(`view-${tab}`),b=document.getElementById(`tab-${tab}`);if(!v)return;if(core.includes(tab))lastCoreTab=tab;v.classList.remove('hidden');v.classList.add('flex','animate-enter');if(b){b.classList.add('active','accent-text');b.style.borderColor='var(--accent)';b.style.color='var(--accent)'}}",
    text,
    count=1,
)

# Sync Operations theme alongside existing UIh/System Owner/VOIP bridges.
text = text.replace('syncVoipFinderTheme(theme);syncOperationsMessagesTheme(theme);lucide.createIcons()', 'syncVoipFinderTheme(theme);lucide.createIcons()')
text = text.replace('syncVoipFinderTheme(theme);lucide.createIcons()', 'syncVoipFinderTheme(theme);syncOperationsMessagesTheme(theme);lucide.createIcons()')
text = text.replace("if(type==='voip-ready')syncVoipFinderTheme();if(type==='operations-ready')syncOperationsMessagesTheme()", "if(type==='voip-ready')syncVoipFinderTheme()")
text = text.replace("if(type==='voip-ready')syncVoipFinderTheme()", "if(type==='voip-ready')syncVoipFinderTheme();if(type==='operations-ready')syncOperationsMessagesTheme()")

utility_js = r'''
  function syncOperationsMessagesTheme(theme=document.body.dataset.theme||'gold'){const frame=document.getElementById('operationsMessagesFrame');if(frame?.contentWindow)try{frame.contentWindow.postMessage({type:'dhcp-theme',theme},location.origin)}catch{}}
  function positionUtilityToolsMenu(){const toggle=document.getElementById('utilityToolsToggle'),menu=document.getElementById('utilityToolsMenu');if(!toggle||!menu||menu.hidden)return;const r=toggle.getBoundingClientRect(),gap=8;if(window.innerWidth<=760){menu.style.left='10px';menu.style.right='10px';menu.style.top=`${Math.max(10,r.bottom+gap)}px`;menu.style.width='auto';return}menu.style.left='auto';menu.style.right=`${Math.max(10,window.innerWidth-r.right)}px`;menu.style.top=`${Math.max(10,r.bottom+gap)}px`;menu.style.width='max-content'}
  function setUtilityToolsOpen(open){const dock=document.getElementById('utilityToolsDock'),toggle=document.getElementById('utilityToolsToggle'),menu=document.getElementById('utilityToolsMenu');if(!dock||!toggle||!menu)return;const show=Boolean(open);dock.dataset.open=show?'true':'false';toggle.setAttribute('aria-expanded',show?'true':'false');menu.hidden=!show;if(show)requestAnimationFrame(()=>{positionUtilityToolsMenu();lucide.createIcons()})}
  function toggleUtilityTools(event){event?.preventDefault?.();event?.stopPropagation?.();const dock=document.getElementById('utilityToolsDock');setUtilityToolsOpen(dock?.dataset.open!=='true')}
  function openUtilityWorkspace(tab){setUtilityToolsOpen(false);switchTab(tab);const theme=document.body.dataset.theme||'gold';if(tab==='system-owner')syncSystemOwnerFinderTheme(theme);if(tab==='voip')syncVoipFinderTheme(theme);if(tab==='operations')syncOperationsMessagesTheme(theme)}
  function returnFromUtilityWorkspace(){switchTab(lastCoreTab||'dhcp')}
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
print('Same-page Utility v1 generated for System Owner, VOIP and Operations Messages')
