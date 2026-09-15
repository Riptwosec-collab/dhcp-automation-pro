from pathlib import Path
import re

path = Path("index.html")
text = path.read_text(encoding="utf-8")
marker = "traffic-log-note-v2"

if marker in text:
    print("Traffic log v2 already applied")
    raise SystemExit(0)

# Remove the automatic -15 minute behavior from the visible Time field.
text = text.replace("Time (เวลา) - Auto (-15 Mins)", "Time (เวลา)", 1)
text = text.replace(
    '<input id="timeInput" value="00" placeholder="เช่น 10:25" class="cyber-input w-full rounded-xl px-5 py-3.5 font-mono" onblur="autoCalculateTime()">',
    '<input id="timeInput" value="00" placeholder="เช่น 08.50" class="cyber-input w-full rounded-xl px-5 py-3.5 font-mono">',
    1,
)
# Remove the now-unused calculation function so there is no hidden -15 minute logic left.
text = re.sub(r"\n  function autoCalculateTime\(\)\{[^\n]*\}", "", text, count=1)

# Replace the result area with results on the left and a free-form note field on the right.
start_token = '              <div class="space-y-6"><div id="logRes3"'
end_token = '\n            </div>\n          </section>'
start = text.find(start_token)
if start == -1:
    raise SystemExit("Log result area start not found")
end = text.find(end_token, start)
if end == -1:
    raise SystemExit("Log result area end not found")

new_results = '''              <div class="log-results-layout">
                <div class="space-y-6">
                  <div id="logRes3" class="glass-panel p-4 rounded-xl">
                    <div class="flex justify-between items-center mb-3"><label class="text-sm font-semibold accent-text">FORMAT 3: NetFlow Traffic &gt; 80%</label><button onclick="copyLogText('result3',this)" class="copy-mini text-xs font-bold">COPY</button></div>
                    <textarea id="result3" rows="5" class="cyber-input w-full rounded-lg px-4 py-3 font-mono text-sm resize-none" readonly></textarea>
                  </div>
                  <div id="logRes2" class="glass-panel p-4 rounded-xl">
                    <div class="flex justify-between items-center mb-3"><label class="text-sm font-semibold accent-text">FORMAT 2: Masked IP (xx)</label><button onclick="copyLogText('result2',this)" class="copy-mini text-xs font-bold">COPY</button></div>
                    <textarea id="result2" rows="3" class="cyber-input w-full rounded-lg px-4 py-3 font-mono text-sm resize-none" readonly></textarea>
                  </div>
                  <div id="logRes1" class="glass-panel p-4 rounded-xl">
                    <div class="flex justify-between items-center mb-3"><label class="text-sm font-semibold accent-text">FORMAT 1: Full IP</label><button onclick="copyLogText('result1',this)" class="copy-mini text-xs font-bold">COPY</button></div>
                    <textarea id="result1" rows="3" class="cyber-input w-full rounded-lg px-4 py-3 font-mono text-sm resize-none" readonly></textarea>
                  </div>
                </div>
                <div class="glass-panel p-4 rounded-xl log-note-panel">
                  <div class="flex justify-between items-center mb-3"><label class="text-sm font-semibold accent-text">NOTE / ข้อมูลเพิ่มเติม</label><button onclick="copyLogText('trafficNote',this)" class="copy-mini text-xs font-bold">COPY</button></div>
                  <textarea id="trafficNote" class="cyber-input w-full rounded-lg px-4 py-3 font-mono text-sm" placeholder="วางข้อมูลเพิ่มเติมตรงนี้..."></textarea>
                </div>
              </div>'''
text = text[:start] + new_results + text[end:]

# Replace only the generateLogs function, preserving all other app logic.
fn_start = text.find("  function generateLogs(){")
fn_end = text.find("\n  async function copyLogText", fn_start)
if fn_start == -1 or fn_end == -1:
    raise SystemExit("generateLogs function not found")
new_generate = '''  function generateLogs(){
    const time=document.getElementById('timeInput').value.trim()||'00';
    const src=document.getElementById('srcIp').value.trim()||'-';
    const dst=document.getElementById('dstIp').value.trim()||'-';
    const isp=document.getElementById('ispInput').value.trim()||'PRIVATE';
    document.getElementById('result3').value=`มอนิเตอร์พบใช้ traffic เครือข่ายมากกว่า 80% เกิน 15 นาที\nแก้ไขโดย : ตรวจสอบจาก Netflow พบการใช้งานสูงดังนี้  เวลา ${time} น. ตรวจสอบพบต้นทาง IP : ${maskIpWide(src)} เรียกไปปลายทาง IP : ${maskIpWide(dst)} ( ${isp} ) \nไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ`;
    document.getElementById('result2').value=`เวลา ${time} น. ตรวจสอบพบต้นทาง IP : ${maskIp(src)} เรียกไปปลายทาง IP : ${maskIp(dst)} ( ${isp} )\nไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ`;
    document.getElementById('result1').value=`เวลา ${time} น. ตรวจสอบพบต้นทาง IP : ${src} เรียกไปปลายทาง IP : ${dst} ( ${isp} )\nไม่ Block การใช้งานเนื่องจากตรวจสอบแล้วเป็นการใช้งานตามปกติ`;
    triggerFlash('logRes3');triggerFlash('logRes2');triggerFlash('logRes1');
  }'''
text = text[:fn_start] + new_generate + text[fn_end:]

css = '''
    /* traffic-log-note-v2 */
    .log-results-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.75fr);gap:18px;align-items:start}
    .log-note-panel{position:sticky;top:12px}
    .log-note-panel textarea{min-height:390px;resize:vertical;line-height:1.65}
    #logRes3 textarea{min-height:132px;line-height:1.65}
    @media(max-width:900px){.log-results-layout{grid-template-columns:1fr}.log-note-panel{position:static}.log-note-panel textarea{min-height:180px}}
'''
if "</style>" not in text:
    raise SystemExit("Style closing tag not found")
text = text.replace("</style>", css + "  </style>", 1)

path.write_text(text, encoding="utf-8")
print("Traffic log page upgraded successfully")
