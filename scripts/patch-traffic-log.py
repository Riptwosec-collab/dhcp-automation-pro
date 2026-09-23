from pathlib import Path
import base64
import re
import zlib

path = Path("index.html")
text = path.read_text(encoding="utf-8")
original = text
layout_marker = "traffic-log-layout-v3"

# Keep the widened traffic-log layout idempotent.
if layout_marker not in text:
    old_card = 'log-card w-full max-w-4xl glass-panel p-8 rounded-2xl accent-border mt-2'
    new_card = 'log-card w-full max-w-[1400px] glass-panel p-8 rounded-2xl accent-border mt-2'
    if old_card not in text:
        raise SystemExit("Log card width target not found")
    text = text.replace(old_card, new_card, 1)

    old_stack = '<div class="log-results-layout">\n                <div class="space-y-6">'
    new_stack = '<div class="log-results-layout">\n                <div class="log-result-stack">'
    if old_stack not in text:
        raise SystemExit("Log result stack target not found")
    text = text.replace(old_stack, new_stack, 1)

    old_css_pattern = re.compile(
        r'\n    /\* traffic-log-note-v2 \*/\n'
        r'    \.log-results-layout\{[^\n]*\}\n'
        r'    \.log-note-panel\{[^\n]*\}\n'
        r'    \.log-note-panel textarea\{[^\n]*\}\n'
        r'    #logRes3 textarea\{[^\n]*\}\n'
        r'    @media\(max-width:900px\)\{[^\n]*\}\n'
    )
    text, removed = old_css_pattern.subn("\n", text, count=1)
    if removed != 1:
        raise SystemExit("Previous traffic log layout CSS not found")

    css = '''
    /* traffic-log-layout-v3 */
    .log-results-layout{display:grid;grid-template-columns:minmax(0,1.85fr) minmax(360px,1fr);gap:24px;align-items:stretch}
    .log-result-stack{display:flex;flex-direction:column;gap:24px;min-width:0}
    .log-note-panel{position:static;display:flex;flex-direction:column;height:100%;min-height:0}
    .log-note-panel textarea{flex:1;min-height:0;height:auto;resize:none;line-height:1.65}
    #logRes3 textarea{min-height:132px;line-height:1.65}
    @media(max-width:900px){.log-results-layout{grid-template-columns:1fr}.log-note-panel{height:auto}.log-note-panel textarea{min-height:220px;height:220px;resize:vertical}}
'''
    if "</style>" not in text:
        raise SystemExit("Style closing tag not found")
    text = text.replace("</style>", css + "  </style>", 1)
else:
    print("Traffic log layout v3 already applied")

# FORMAT 3: keep the ISP parentheses together on the next line with the no-block note.
old_format3 = """มอนิเตอร์พบใช้ traffic เครือข่ายมากกว่า 80% เกิน 15 นาที
แก้ไขโดย : ตรวจสอบจาก Netflow พบการใช้งานสูงดังนี้ 
เวลา ${time} น.  ตรวจสอบพบต้นทาง IP : ${maskIpWide(src)} เรียกไปปลายทาง IP : ${maskIpWide(dst)} ( ${isp} )  
ไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ"""
new_format3 = """มอนิเตอร์พบใช้ traffic เครือข่ายมากกว่า 80% เกิน 15 นาที
แก้ไขโดย : ตรวจสอบจาก Netflow พบการใช้งานสูงดังนี้ 
เวลา ${time} น.  ตรวจสอบพบต้นทาง IP : ${maskIpWide(src)} เรียกไปปลายทาง IP : ${maskIpWide(dst)}
( ${isp} )   ไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ"""

if new_format3 in text:
    print("FORMAT 3 ISP line break already applied")
elif old_format3 in text:
    text = text.replace(old_format3, new_format3, 1)
else:
    raise SystemExit("FORMAT 3 text target not found")

# Generate Log UIh: embed the approved standalone NOC Message Builder with the
# dashboard GOLD/CYBER theme and a same-origin parent theme bridge.
UIH_HTML_ZLIB_B64 = "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"

uih_html = zlib.decompress(base64.b64decode(UIH_HTML_ZLIB_B64)).decode("utf-8")
uih_path = Path("uih.html")
if not uih_path.exists() or uih_path.read_text(encoding="utf-8") != uih_html:
    uih_path.write_text(uih_html, encoding="utf-8")
    print("Generated themed UIh page")
else:
    print("Themed UIh page already current")

# Add the fourth tab beside Generate Log traffic.
if 'id="tab-uih"' not in text:
    traffic_tab = '<button onclick="switchTab(\'log\')" id="tab-log" class="tab-btn h-full px-4 border-b-2 border-transparent whitespace-nowrap" style="color:var(--muted)"><i data-lucide="file-terminal" class="w-4 h-4 inline-block mr-2"></i>Generate Log traffic</button>'
    uih_tab = '<button onclick="switchTab(\'uih\')" id="tab-uih" class="tab-btn h-full px-4 border-b-2 border-transparent whitespace-nowrap" style="color:var(--muted)"><i data-lucide="panel-top-open" class="w-4 h-4 inline-block mr-2"></i>Generate Log UIh</button>'
    if traffic_tab not in text:
        raise SystemExit("Generate Log traffic tab target not found")
    text = text.replace(traffic_tab, traffic_tab + uih_tab, 1)

# Add the iframe view after the existing traffic-log view.
if 'id="view-uih"' not in text:
    workspace_end = '          </section>\n        </div>\n      </main>'
    pos = text.rfind(workspace_end)
    if pos < 0:
        raise SystemExit("Workspace end target not found")
    insert_at = pos + len('          </section>\n')
    uih_view = '''\n          <section id="view-uih" class="view-panel hidden h-full min-h-0 flex-col animate-enter">\n            <div class="uih-frame-shell glass-panel rounded-2xl accent-border">\n              <iframe id="uihFrame" src="uih.html" title="Generate Log UIh" loading="eager" onload="syncUIhTheme(document.body.dataset.theme || 'gold')"></iframe>\n            </div>\n          </section>\n'''
    text = text[:insert_at] + uih_view + text[insert_at:]

# Style the embedded page to fill the dashboard workspace without adding another shell.
if '/* generate-log-uih-v1 */' not in text:
    uih_css = '''\n    /* generate-log-uih-v1 */\n    #view-uih{min-height:0;overflow:hidden}\n    .uih-frame-shell{width:100%;height:100%;min-height:0;overflow:hidden;padding:0;background:rgba(0,0,0,.08)}\n    #uihFrame{display:block;width:100%;height:100%;min-height:720px;border:0;background:transparent}\n    @media(max-width:900px){#view-uih{overflow:visible}.uih-frame-shell{height:auto;min-height:820px}.uih-frame-shell #uihFrame{min-height:820px}}\n'''
    if '</style>' not in text:
        raise SystemExit("Style closing tag not found for UIh")
    text = text.replace('</style>', uih_css + '  </style>', 1)

# Include UIh in the shared tab switcher.
if "['dhcp','subnet','log','uih']" not in text:
    if "['dhcp','subnet','log']" not in text:
        raise SystemExit("Tab switch list target not found")
    text = text.replace("['dhcp','subnet','log']", "['dhcp','subnet','log','uih']", 1)

# Bridge the parent GOLD/CYBER selector into the UIh iframe.
if 'function syncUIhTheme(theme)' not in text:
    set_theme_old = "function setTheme(theme){document.body.dataset.theme=theme;localStorage.setItem('missionTheme',theme);document.getElementById('themeGold').classList.toggle('active',theme==='gold');document.getElementById('themeCyber').classList.toggle('active',theme==='cyber');lucide.createIcons()}"
    set_theme_new = "function syncUIhTheme(theme){const frame=document.getElementById('uihFrame');if(frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'mission-theme',theme},window.location.origin)}\n  window.addEventListener('message',event=>{if(event.origin!==window.location.origin)return;const data=event.data||{};if(data.type==='uih-ready')syncUIhTheme(document.body.dataset.theme||'gold')});\n  function setTheme(theme){document.body.dataset.theme=theme;localStorage.setItem('missionTheme',theme);document.getElementById('themeGold').classList.toggle('active',theme==='gold');document.getElementById('themeCyber').classList.toggle('active',theme==='cyber');syncUIhTheme(theme);lucide.createIcons()}"
    if set_theme_old not in text:
        raise SystemExit("Theme function target not found")
    text = text.replace(set_theme_old, set_theme_new, 1)

if text != original:
    path.write_text(text, encoding="utf-8")
    print("Traffic log / UIh dashboard updated successfully")
else:
    print("No dashboard changes required")
