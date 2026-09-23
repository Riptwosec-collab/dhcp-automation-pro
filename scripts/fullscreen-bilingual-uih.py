from pathlib import Path
import re

path = Path("uih.html")
if not path.exists():
    raise SystemExit("uih.html not found; run scripts/patch-traffic-log.py first")

text = path.read_text(encoding="utf-8")
marker = "/* uih-fullscreen-bilingual-v1 */"

style = r'''
    /* uih-fullscreen-bilingual-v1 */
    .shell { width: 100%; max-width: none; }

    /* uih-balanced-layout-v2 */
    @media (min-width: 1121px) {
      .shell { width: 100%; max-width: none; margin: 0; padding: 10px 14px; }
      .grid { width: 100%; grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap: 14px; align-items: stretch; }
      .panel-head { padding: 11px 13px 9px; }
      .panel-body { padding: 11px 13px; }

      .grid > .panel:first-child .panel-body { display: flex; flex-direction: column; min-height: 0; }
      #rawInput { flex: 1 1 auto; min-height: 240px; height: auto; }
      .grid > .panel:first-child .parsed { flex: 0 0 auto; }

      .grid > .panel:nth-child(2) .panel-body { display: grid; grid-template-rows: auto auto minmax(0,1fr); gap: 10px; align-content: stretch; overflow: hidden; }
      .grid > .panel:nth-child(2) .section,
      .grid > .panel:nth-child(2) .section + .section {
        margin: 0;
        padding: 10px 12px;
        border: 1px solid rgba(var(--accent-rgb),.14);
        border-radius: 12px;
        background: rgba(var(--accent-rgb),.025);
      }
      .grid > .panel:nth-child(2) .section:last-child { min-height: 0; }

      .grid > .panel:nth-child(3) .panel-body { display: flex; flex-direction: column; min-height: 0; }
      .grid > .panel:nth-child(3) .preview { flex: 1 1 auto; min-height: 0; height: auto; }
    }

    @media (max-height: 820px) and (min-width: 1121px) {
      .shell { padding: 7px 10px; }
      .grid { gap: 10px; }
      .grid > .panel:first-child #rawInput { flex: 1 1 auto; min-height: 180px; height: auto; }
      .grid > .panel:nth-child(2) .panel-body { gap: 7px; }
      .grid > .panel:nth-child(2) .section,
      .grid > .panel:nth-child(2) .section + .section { padding: 7px 9px; }
    }
'''.strip()

if "</style>" not in text:
    raise SystemExit("UIh closing style tag not found")

if marker in text:
    style_pattern = re.compile(r"\s*/\* uih-fullscreen-bilingual-v1 \*/[\s\S]*?(?=\s*</style>)")
    text, replaced = style_pattern.subn("\n" + style + "\n", text, count=1)
    if replaced != 1:
        raise SystemExit("Could not refresh fullscreen UIh styles")
else:
    text = text.replace("</style>", style + "\n  </style>", 1)

old_label = '<div class="info-card full"><div class="label">Down Since</div><div class="value" id="downValue">-</div></div>'
new_label = '<div class="info-card full"><div class="label" data-i18n="downSinceLabel">Down Since</div><div class="value" id="downValue">-</div></div>'
if new_label not in text:
    if old_label not in text:
        raise SystemExit("Parsed Down Since label target not found")
    text = text.replace(old_label, new_label, 1)

if "downSinceLabel: 'ล่มตั้งแต่'" in text:
    text = text.replace("downSinceLabel: 'ล่มตั้งแต่'", "downSinceLabel: 'ดาวน์เมื่อ'", 1)
elif "downSinceLabel: 'ดาวน์เมื่อ'" not in text:
    th_old = "        agencyLabel: 'หน่วยงาน', provinceLabel: 'จังหวัด',"
    th_new = "        agencyLabel: 'หน่วยงาน', provinceLabel: 'จังหวัด', downSinceLabel: 'ดาวน์เมื่อ',"
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
old_localized_preview = "        const downSinceLabel = language === 'en' ? 'Down Since' : 'ล่มตั้งแต่';"
new_localized_preview = "        const downSinceLabel = language === 'en' ? 'Down Since' : 'ดาวน์เมื่อ';"
new_preview = """      if (state.downSince) {
        const downSinceLabel = language === 'en' ? 'Down Since' : 'ดาวน์เมื่อ';
        lines.push(`${downSinceLabel} : ${formatDownSince(state.downSince, language)}`);
      }"""

if old_localized_preview in text:
    text = text.replace(old_localized_preview, new_localized_preview, 1)
elif new_localized_preview not in text:
    if old_preview not in text:
        raise SystemExit("Down Since preview label target not found")
    text = text.replace(old_preview, new_preview, 1)

path.write_text(text, encoding="utf-8")
print("Balanced bilingual UIh patch applied")
