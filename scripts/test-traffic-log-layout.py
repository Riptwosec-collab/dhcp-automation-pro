from pathlib import Path

html = Path("index.html").read_text(encoding="utf-8")

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
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Missing expected traffic log behavior: " + ", ".join(failed))

print("Traffic log regression checks passed")
