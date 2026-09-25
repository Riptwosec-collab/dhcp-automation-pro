from pathlib import Path
import re

path = Path("uih.html")
if not path.exists():
    raise SystemExit("uih.html not found; run scripts/patch-traffic-log.py first")

text = path.read_text(encoding="utf-8")
marker_v1 = "/* thai-down-since-v1 */"
marker_v2 = "/* thai-down-since-v2 */"

helper = r'''
    /* thai-down-since-v2 */
    function formatDownSince(value, language = 'th') {
      const source = String(value || '').trim();
      if (!source) return source;

      const englishDays = {
        sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
        thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday'
      };
      const thaiDays = {
        sunday: 'วันอาทิตย์', monday: 'วันจันทร์', tuesday: 'วันอังคาร',
        wednesday: 'วันพุธ', thursday: 'วันพฤหัสบดี', friday: 'วันศุกร์', saturday: 'วันเสาร์'
      };
      const thaiDayToEnglish = Object.fromEntries(
        Object.entries(thaiDays).map(([key, thai]) => [thai, englishDays[key]])
      );
      const englishMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = Object.fromEntries(englishMonths.map((month, index) => [month.toLowerCase(), index]));
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const thaiMonthIndex = Object.fromEntries(thaiMonths.map((month, index) => [month, index]));

      const match = source.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2})$/i);
      const thaiMatch = source.match(/^(วันอาทิตย์|วันจันทร์|วันอังคาร|วันพุธ|วันพฤหัสบดี|วันศุกร์|วันเสาร์)\s+ที่\s+(\d{1,2})\s+(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+พ\.ศ\.\s+(\d{4})\s+เวลา\s+(\d{1,2}):(\d{2})\s+น\.$/);
      if (!match && !thaiMatch) return source;

      let weekdayEnglish;
      let month;
      let day;
      let year;
      let hour;
      let minute;

      if (match) {
        weekdayEnglish = englishDays[match[1].toLowerCase()] || match[1];
        month = monthIndex[match[2].toLowerCase()];
        day = parseInt(match[3], 10);
        year = parseInt(match[4], 10);
        hour = parseInt(match[5], 10);
        minute = parseInt(match[6], 10);
      } else {
        weekdayEnglish = thaiDayToEnglish[thaiMatch[1]] || '';
        day = parseInt(thaiMatch[2], 10);
        month = thaiMonthIndex[thaiMatch[3]];
        year = parseInt(thaiMatch[4], 10) - 543;
        hour = parseInt(thaiMatch[5], 10);
        minute = parseInt(thaiMatch[6], 10);
      }

      if (!weekdayEnglish || month === undefined || year < 1 || hour > 23 || minute > 59) return source;

      const date = new Date(year, month, day, hour, minute);
      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
      ) return source;

      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      if (language === 'en') {
        return `${weekdayEnglish}, ${englishMonths[month]} ${day}, ${year} ${hh}:${mm}`;
      }

      const thaiDay = thaiDays[weekdayEnglish.toLowerCase()] || '';
      const buddhistYear = year + 543;
      return `${thaiDay} ที่ ${day} ${thaiMonths[month]} พ.ศ. ${buddhistYear} เวลา ${hh}:${mm} น.`;
    }
'''.strip()

if marker_v2 not in text:
    if marker_v1 in text:
        pattern = re.compile(r'\s*/\* thai-down-since-v1 \*/\s*function formatDownSince\(value, language = \'th\'\) \{.*?\n\s*\}\n(?=\n\s*function composeMessage)', re.S)
        text, count = pattern.subn("\n" + helper + "\n", text, count=1)
        if count != 1:
            raise SystemExit("Existing Thai Down Since formatter target not found")
    else:
        target = "    function composeMessage(state) {"
        if target not in text:
            raise SystemExit("composeMessage target not found")
        text = text.replace(target, helper + "\n\n" + target, 1)

parser_old = "downSince: extractValue(raw, ['Down Since'])"
parser_new = "downSince: extractValue(raw, ['Down Since', 'ดาวน์เมื่อ', 'ล่มตั้งแต่'])"
if parser_new not in text:
    if parser_old not in text:
        raise SystemExit("Down Since parser target not found")
    text = text.replace(parser_old, parser_new, 1)

compose_old = "if (state.downSince) lines.push(`Down Since : ${state.downSince}`);"
compose_new = "if (state.downSince) lines.push(`Down Since : ${formatDownSince(state.downSince, language)}`);"
if compose_old in text:
    text = text.replace(compose_old, compose_new, 1)

render_old = "setText('downValue', data.downSince);"
render_new = "setText('downValue', formatDownSince(data.downSince, currentLang));"
if render_old in text:
    text = text.replace(render_old, render_new, 1)

path.write_text(text, encoding="utf-8")
print("Bidirectional Thai/English Down Since formatting applied")
