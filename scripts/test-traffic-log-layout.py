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
    "UIh has bilingual Down Since formatter": '/* thai-down-since-v2 */' in uih and 'function formatDownSince(value, language = \'th\')' in uih,
    "UIh formatter uses Buddhist Era": 'year + 543' in uih,
    "UIh formatter includes Thai weekday and month names": "'วันพุธ'" in uih and "'กันยายน'" in uih,
    "UIh formatter can parse Thai source": 'const thaiMatch = source.match' in uih and "thaiDayToEnglish" in uih,
    "UIh keeps original Down Since when date is not parseable": 'if (!match && !thaiMatch) return source;' in uih,
    "UIh parser accepts Thai Down Since labels": "downSince: extractValue(raw, ['Down Since', 'ดาวน์เมื่อ', 'ล่มตั้งแต่'])" in uih,
    "UIh fullscreen bilingual patch exists": '/* uih-fullscreen-bilingual-v1 */' in uih,
    "UIh fills dashboard width": '.shell { width: 100%; max-width: none;' in uih,
    "UIh desktop grid fills available width": 'grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);' in uih,
    "UIh Thai Down Since label says ดาวน์เมื่อ": "downSinceLabel: 'ดาวน์เมื่อ'" in uih,
    "UIh English Down Since label is preserved": "downSinceLabel: 'Down Since'" in uih,
    "UIh raw source keeps original English Down Since": 'Down Since : Wednesday, September 23, 2026 10:22' in uih,
    "UIh balanced layout patch exists": '/* uih-balanced-layout-v2 */' in uih,
    "UIh left source input grows into available space": '#rawInput { flex: 1 1 auto; min-height: 240px; height: auto; }' in uih,
    "UIh middle controls use structured rows": 'grid-template-rows: auto auto minmax(0,1fr);' in uih,
    "UIh middle sections are grouped as cards": '.grid > .panel:nth-child(2) .section,' in uih and 'background: rgba(var(--accent-rgb),.025);' in uih,
    "UIh preview panel stays flex-filled": '.grid > .panel:nth-child(3) .panel-body { display: flex; flex-direction: column; min-height: 0; }' in uih,
    "UIh short desktop source input still grows": '.grid > .panel:first-child #rawInput { flex: 1 1 auto; min-height: 180px; height: auto; }' in uih,
    "UIh has independent Down Since language controls": 'id="downSinceThBtn"' in uih and 'id="downSinceEnBtn"' in uih,
    "UIh stores independent Down Since language": "let downSinceLanguage = 'th';" in uih,
    "UIh can switch Down Since language independently": 'function setDownSinceLanguage(language)' in uih,
    "UIh parsed Down Since label follows its own language": "downSinceLanguage === 'en' ? 'Down Since' : 'ดาวน์เมื่อ'" in uih,
    "UIh parsed Down Since value follows its own language": "formatDownSince(data.downSince, downSinceLanguage)" in uih,
    "UIh preview state carries Down Since language": 'downSinceLanguage: downSinceLanguage' in uih,
    "UIh preview formats Down Since with independent language": 'formatDownSince(state.downSince, downSinceLanguage)' in uih,
    "UIh Down Since toggle rerenders parsed data and preview": 'setDownSinceLanguage' in uih and 'renderParsed();' in uih and 'renderPreview();' in uih,
    "UIh Down Since toggle styling exists": '/* uih-down-since-language-v1 */' in uih,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Missing expected traffic/UIh behavior: " + ", ".join(failed))

print("Traffic log and UIh integration regression checks passed")
