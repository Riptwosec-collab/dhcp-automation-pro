from pathlib import Path

path = Path("uih.html")
if not path.exists():
    raise SystemExit("uih.html not found; run scripts/patch-traffic-log.py first")

text = path.read_text(encoding="utf-8")
marker = "/* uih-fullscreen-bilingual-v1 */"

style = r'''
    /* uih-fullscreen-bilingual-v1 */
    .shell { width: 100%; max-width: none; }
    @media (min-width: 1121px) {
      .shell { width: 100%; max-width: none; margin: 0; padding: 8px 10px; }
      .grid { width: 100%; grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap: 10px; }
    }
'''.strip()

if marker not in text:
    if "</style>" not in text:
        raise SystemExit("UIh closing style tag not found")
    text = text.replace("</style>", style + "\n  </style>", 1)
else:
    print("Fullscreen UIh styles already applied")

old_label = '<div class="info-card full"><div class="label">Down Since</div><div class="value" id="downValue">-</div></div>'
new_label = '<div class="info-card full"><div class="label" data-i18n="downSinceLabel">Down Since</div><div class="value" id="downValue">-</div></div>'
if new_label not in text:
    if old_label not in text:
        raise SystemExit("Parsed Down Since label target not found")
    text = text.replace(old_label, new_label, 1)

th_old = "        agencyLabel: 'หน่วยงาน', provinceLabel: 'จังหวัด',"
th_new = "        agencyLabel: 'หน่วยงาน', provinceLabel: 'จังหวัด', downSinceLabel: 'ล่มตั้งแต่',"
if th_new not in text:
    if th_old not in text:
        raise SystemExit("Thai translation insertion target not found")
    text = text.replace(th_old, th_new, 1)

en_old = "        agencyLabel: 'Agency', provinceLabel: 'Province',"
en_new = "        agencyLabel: 'Agency', provinceLabel: 'Province', downSinceLabel: 'Down Since',"
if en_new not in text:
    if en_old not in text:
        raise SystemExit("English translation insertion target not found")
    text = text.replace(en_old, en_new, 1)

old_preview = "      if (state.downSince) lines.push(`Down Since : ${formatDownSince(state.downSince, language)}`);"
new_preview = """      if (state.downSince) {
        const downSinceLabel = language === 'en' ? 'Down Since' : 'ล่มตั้งแต่';
        lines.push(`${downSinceLabel} : ${formatDownSince(state.downSince, language)}`);
      }"""
if new_preview not in text:
    if old_preview not in text:
        raise SystemExit("Down Since preview label target not found")
    text = text.replace(old_preview, new_preview, 1)

path.write_text(text, encoding="utf-8")
print("Fullscreen bilingual UIh patch applied")
