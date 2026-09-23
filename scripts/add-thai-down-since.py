from pathlib import Path

path = Path("uih.html")
if not path.exists():
    raise SystemExit("uih.html not found; run scripts/patch-traffic-log.py first")

text = path.read_text(encoding="utf-8")
marker = "/* thai-down-since-v1 */"

helper = r'''
    /* thai-down-since-v1 */
    function formatDownSince(value, language = 'th') {
      const source = String(value || '').trim();
      if (!source || language === 'en') return source;

      const match = source.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2})$/i);
      if (!match) return source;

      const thaiDays = {
        sunday: 'วันอาทิตย์', monday: 'วันจันทร์', tuesday: 'วันอังคาร',
        wednesday: 'วันพุธ', thursday: 'วันพฤหัสบดี', friday: 'วันศุกร์', saturday: 'วันเสาร์'
      };
      const monthIndex = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
      };
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];

      const day = parseInt(match[3], 10);
      const year = parseInt(match[4], 10);
      const hour = parseInt(match[5], 10);
      const minute = parseInt(match[6], 10);
      const month = monthIndex[match[2].toLowerCase()];
      if (month === undefined || hour > 23 || minute > 59) return source;

      const date = new Date(year, month, day, hour, minute);
      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
      ) return source;

      const thaiDay = thaiDays[match[1].toLowerCase()] || '';
      const buddhistYear = date.getFullYear() + 543;
      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      return `${thaiDay} ที่ ${day} ${thaiMonths[month]} พ.ศ. ${buddhistYear} เวลา ${hh}:${mm} น.`;
    }
'''.strip()

compose_old = "if (state.downSince) lines.push(`Down Since : ${state.downSince}`);"
compose_new = "if (state.downSince) lines.push(`Down Since : ${formatDownSince(state.downSince, language)}`);"
render_old = "setText('downValue', data.downSince);"
render_new = "setText('downValue', formatDownSince(data.downSince, currentLang));"

if marker not in text:
    target = "    function composeMessage(state) {"
    if target not in text:
        raise SystemExit("composeMessage target not found")
    text = text.replace(target, helper + "\n\n" + target, 1)
else:
    print("Thai Down Since formatter already present")

if compose_new not in text:
    if compose_old not in text:
        raise SystemExit("Down Since preview target not found")
    text = text.replace(compose_old, compose_new, 1)

if render_new not in text:
    if render_old not in text:
        raise SystemExit("Down Since parsed-value target not found")
    text = text.replace(render_old, render_new, 1)

path.write_text(text, encoding="utf-8")
print("Thai Down Since formatting applied")
