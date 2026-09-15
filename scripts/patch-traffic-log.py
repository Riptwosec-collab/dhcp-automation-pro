from pathlib import Path
import re

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

# FORMAT 3: keep each operational statement on its own line exactly as approved.
old_format3 = """มอนิเตอร์พบใช้ traffic เครือข่ายมากกว่า 80% เกิน 15 นาที
แก้ไขโดย : ตรวจสอบจาก Netflow พบการใช้งานสูงดังนี้  เวลา ${time} น. ตรวจสอบพบต้นทาง IP : ${maskIpWide(src)} เรียกไปปลายทาง IP : ${maskIpWide(dst)} ( ${isp} ) 
ไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ"""
new_format3 = """มอนิเตอร์พบใช้ traffic เครือข่ายมากกว่า 80% เกิน 15 นาที
แก้ไขโดย : ตรวจสอบจาก Netflow พบการใช้งานสูงดังนี้ 
เวลา ${time} น.  ตรวจสอบพบต้นทาง IP : ${maskIpWide(src)} เรียกไปปลายทาง IP : ${maskIpWide(dst)} ( ${isp} )  
ไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ"""

if new_format3 in text:
    print("FORMAT 3 approved line breaks already applied")
elif old_format3 in text:
    text = text.replace(old_format3, new_format3, 1)
else:
    raise SystemExit("FORMAT 3 text target not found")

if text != original:
    path.write_text(text, encoding="utf-8")
    print("Traffic log page updated successfully")
else:
    print("No traffic log changes required")
