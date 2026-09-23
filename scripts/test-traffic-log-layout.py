from pathlib import Path

html = Path("index.html").read_text(encoding="utf-8")
uih_path = Path("uih.html")
uih = uih_path.read_text(encoding="utf-8") if uih_path.exists() else ""

format3_expected = """มอนิเตอร์พบใช้ traffic เครือข่ายมากกว่า 80% เกิน 15 นาที
แก้ไขโดย : ตรวจสอบจาก Netflow พบการใช้งานสูงดังนี้ 
เวลา ${time} น.  ตรวจสอบพบต้นทาง IP : ${maskIpWide(src)} เรียกไปปลายทาง IP : ${maskIpWide(dst)}
( ${isp} )   ไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ"""

checks = {
    "wider log card": 'log-card w-full max-w-[1400px]' in html,
    "wider two-column results": 'grid-template-columns:minmax(0,1.85fr) minmax(360px,1fr)' in html,
    "dedicated result stack": '<div class="log-result-stack">' in html,
    "note stretches full grid height": '.log-note-panel{position:static;display:flex;flex-direction:column;height:100%;min-height:0}' in html,
    "note textarea fills panel": '.log-note-panel textarea{flex:1;min-height:0;height:auto;resize:none;line-height:1.65}' in html,
    "format 3 moves ISP parentheses to next line with no split": format3_expected in html,
    "UIh tab sits beside traffic log": 'id="tab-uih"' in html and "switchTab('uih')" in html and 'Generate Log UIh' in html,
    "UIh view is embedded": 'id="view-uih"' in html and 'id="uihFrame"' in html and 'src="uih.html"' in html,
    "tab switcher includes UIh": "['dhcp','subnet','log','uih']" in html,
    "main theme syncs to UIh": 'syncUIhTheme(theme)' in html and "type:'mission-theme'" in html,
    "UIh standalone page exists": bool(uih),
    "UIh supports gold and cyber themes": 'body[data-theme="gold"]' in uih and 'body[data-theme="cyber"]' in uih and '--accent-rgb:' in uih,
    "UIh listens for parent theme": "type === 'mission-theme'" in uih or "type==='mission-theme'" in uih,
    "UIh keeps source parser": 'function parseRawData(raw)' in uih and 'function composeMessage(state)' in uih,
    "UIh keeps TH EN controls": 'id="langThBtn"' in uih and 'id="langEnBtn"' in uih,
    "UIh keeps circuit controls": 'id="includeMain"' in uih and 'id="includeBackup"' in uih,
    "UIh keeps independent port controls": 'id="portFront"' in uih and 'id="portBack"' in uih,
    "UIh keeps power and reboot controls": 'id="includePower"' in uih and 'id="includeReboot"' in uih,
    "UIh keeps generated preview": 'id="rawInput"' in uih and 'id="preview"' in uih and 'id="copyBtn"' in uih,
    "UIh fit-to-viewport styles exist": '/* uih-fit-viewport-v1 */' in uih,
    "UIh document disables internal page scroll": 'html, body { width: 100%; height: 100%; min-height: 0; overflow: hidden; }' in uih,
    "UIh shell is viewport-height flex layout": '.shell { height: 100vh; max-height: 100vh;' in uih and 'display: flex; flex-direction: column; overflow: hidden;' in uih,
    "UIh grid consumes remaining height": '.grid { flex: 1; min-height: 0; height: auto;' in uih,
    "UIh panels can shrink": '.panel { min-height: 0; display: flex; flex-direction: column; }' in uih,
    "UIh raw input no longer forces tall page": '#rawInput { flex: 1; min-height: 0; height: auto; resize: none; }' in uih,
    "UIh preview fills available height": '.preview { flex: 1; min-height: 0; height: auto;' in uih,
    "UIh compacts on short desktop viewports": '@media (max-height: 820px) and (min-width: 1121px)' in uih,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Missing expected traffic/UIh behavior: " + ", ".join(failed))

print("Traffic log and UIh integration regression checks passed")
