from pathlib import Path
import re

path = Path("index.html")
text = path.read_text(encoding="utf-8")
original = text
marker = "/* system-owner-finder-v1 */"

css = r'''
    /* system-owner-finder-v1 */
    .system-owner-trigger{min-width:176px;white-space:nowrap}
    .system-owner-finder{position:relative;overflow:hidden;margin:0 0 20px;border:1px solid rgba(var(--accentRgb),.18);border-radius:15px;background:linear-gradient(135deg,rgba(var(--accentRgb),.06),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 12px 34px rgba(0,0,0,.18);transition:border-color .25s ease,box-shadow .25s ease}
    .system-owner-finder.is-open{border-color:rgba(var(--accentRgb),.38);box-shadow:0 0 28px rgba(var(--accentRgb),.08),inset 0 1px 0 rgba(255,255,255,.035)}
    .system-owner-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px}
    .system-owner-title{display:flex;align-items:center;gap:9px;min-width:0}.system-owner-title i{color:var(--accent);filter:drop-shadow(0 0 7px rgba(var(--accentRgb),.36))}.system-owner-title strong{display:block;color:var(--accent2);font-size:11px;font-weight:900;letter-spacing:.09em}.system-owner-title span{display:block;margin-top:2px;color:var(--muted);font-size:9px}
    .system-owner-hide{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 9px;border-radius:999px;border:1px solid rgba(var(--accentRgb),.25);background:rgba(var(--accentRgb),.07);color:var(--accent);font:800 9px/1 'JetBrains Mono',monospace;letter-spacing:.05em;transition:.2s}.system-owner-hide:hover{border-color:rgba(var(--accentRgb),.55);background:rgba(var(--accentRgb),.13);box-shadow:0 0 16px rgba(var(--accentRgb),.10)}
    .system-owner-body{display:grid;grid-template-rows:0fr;opacity:0;transform:translateY(-5px);transition:grid-template-rows .4s cubic-bezier(.2,.8,.2,1),opacity .25s ease,transform .4s cubic-bezier(.2,.8,.2,1)}.system-owner-finder.is-open .system-owner-body{grid-template-rows:1fr;opacity:1;transform:none}.system-owner-body-inner{min-height:0;overflow:hidden}.system-owner-frame-wrap{margin:0 12px 12px;border:1px solid rgba(var(--accentRgb),.15);border-radius:13px;overflow:hidden;background:var(--bg2);box-shadow:inset 0 0 30px rgba(var(--accentRgb),.025)}
    #systemOwnerFinderFrame{display:block;width:100%;height:min(72vh,760px);min-height:560px;border:0;background:var(--bg)}
    @media(max-width:900px){.system-owner-trigger{min-width:150px}.system-owner-head{align-items:flex-start}.system-owner-title span{max-width:46vw}.system-owner-frame-wrap{margin:0 8px 8px}#systemOwnerFinderFrame{height:72vh;min-height:520px}}
    @media(max-width:640px){.system-owner-trigger{width:100%;min-width:0}.system-owner-title span{max-width:60vw}#systemOwnerFinderFrame{height:76vh;min-height:480px}}
    @media(prefers-reduced-motion:reduce){.system-owner-body,.system-owner-finder,.system-owner-hide{transition-duration:.001ms!important}}
'''.strip()

if marker not in text:
    if "</style>" not in text:
        raise SystemExit("Style closing tag not found")
    text = text.replace("</style>", css + "\n  </style>", 1)

button = '<button id="btnSystemOwnerFinder" type="button" onclick="toggleSystemOwnerFinder()" class="btn-glow system-owner-trigger px-5 rounded-xl font-bold flex items-center justify-center gap-2" aria-expanded="false" aria-controls="systemOwnerFinderPanel"><i data-lucide="user-search" class="w-4 h-4"></i>FIND SYSTEM OWNER</button>'
if 'id="btnSystemOwnerFinder"' not in text:
    scan_pattern = re.compile(r'(<button id="btnScanIp"\s+onclick="fetchISPData\(\)".*?</button>)', re.S)
    text, count = scan_pattern.subn(r'\1' + button, text, count=1)
    if count != 1:
        raise SystemExit("SCAN IP button target not found")

panel = r'''
              <section id="systemOwnerFinderPanel" class="system-owner-finder" aria-label="System Owner Finder">
                <div class="system-owner-head">
                  <div class="system-owner-title"><i data-lucide="users-round" class="w-4 h-4"></i><div><strong>SYSTEM OWNER FINDER</strong><span>TOR mapping · Contact routing · Local browser analysis</span></div></div>
                  <button type="button" class="system-owner-hide" onclick="toggleSystemOwnerFinder(false)" title="ซ่อน System Owner Finder"><span>HIDE</span><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i></button>
                </div>
                <div id="systemOwnerFinderBody" class="system-owner-body" aria-hidden="true">
                  <div class="system-owner-body-inner">
                    <div class="system-owner-frame-wrap"><iframe id="systemOwnerFinderFrame" src="tor-system-finder.html" title="TOR System Owner Finder" loading="lazy"></iframe></div>
                  </div>
                </div>
              </section>'''.strip()

if 'id="systemOwnerFinderPanel"' not in text:
    target = '              <button onclick="generateLogs()"'
    if target not in text:
        raise SystemExit("Generate Logs button target not found")
    text = text.replace(target, panel + "\n" + target, 1)

helpers = r'''
<script id="systemOwnerFinderBridge">
  function currentSystemOwnerTheme(){return document.body?.dataset?.theme==='cyber'?'cyber':'gold'}
  function syncSystemOwnerFinderTheme(){const frame=document.getElementById('systemOwnerFinderFrame');if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'system-owner-theme',theme:currentSystemOwnerTheme()},location.origin)}catch{}}
  function setSystemOwnerFinderOpen(open){const panel=document.getElementById('systemOwnerFinderPanel'),body=document.getElementById('systemOwnerFinderBody'),btn=document.getElementById('btnSystemOwnerFinder');if(!panel)return;const next=Boolean(open);panel.classList.toggle('is-open',next);if(body)body.setAttribute('aria-hidden',next?'false':'true');if(btn)btn.setAttribute('aria-expanded',next?'true':'false');if(next){syncSystemOwnerFinderTheme();requestAnimationFrame(()=>{try{panel.scrollIntoView({behavior:'smooth',block:'nearest'})}catch{}})}}
  function toggleSystemOwnerFinder(force){const panel=document.getElementById('systemOwnerFinderPanel');if(!panel)return;setSystemOwnerFinderOpen(typeof force==='boolean'?force:!panel.classList.contains('is-open'))}
  (function initSystemOwnerFinderBridge(){const frame=document.getElementById('systemOwnerFinderFrame');if(frame)frame.addEventListener('load',syncSystemOwnerFinderTheme);if(document.body&&typeof MutationObserver!=='undefined'){new MutationObserver(records=>{if(records.some(r=>r.attributeName==='data-theme'))syncSystemOwnerFinderTheme()}).observe(document.body,{attributes:true,attributeFilter:['data-theme']})}syncSystemOwnerFinderTheme()})();
</script>
'''.strip()

if 'id="systemOwnerFinderBridge"' not in text:
    if "</body>" not in text:
        raise SystemExit("Body closing tag not found")
    text = text.replace("</body>", helpers + "\n</body>", 1)

if text != original:
    path.write_text(text, encoding="utf-8")
    print("Added System Owner Finder to Generate Log traffic")
else:
    print("System Owner Finder already applied")
