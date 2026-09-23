from pathlib import Path

path = Path("uih.html")
if not path.exists():
    raise SystemExit("uih.html not found; run UIh generation scripts first")

text = path.read_text(encoding="utf-8")
marker = "/* uih-down-since-language-v1 */"

style = r'''
    /* uih-down-since-language-v1 */
    .down-since-card { display: flex; flex-direction: column; gap: 6px; }
    .down-since-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .down-since-lang-switch {
      display: inline-flex; gap: 2px; padding: 2px; border-radius: 8px;
      border: 1px solid rgba(var(--accent-rgb),.16); background: var(--input); flex: 0 0 auto;
    }
    .down-lang-btn {
      border: 0; border-radius: 6px; padding: 3px 7px; cursor: pointer;
      background: transparent; color: var(--muted); font-size: 9px; font-weight: 850; line-height: 1.25;
    }
    .down-lang-btn.active {
      color: var(--text); background: rgba(var(--accent-rgb),.18);
      box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb),.24), 0 0 10px rgba(var(--accent-rgb),.08);
    }
    @media (max-height: 820px) and (min-width: 1121px) {
      .down-since-card { gap: 3px; }
      .down-since-head { gap: 6px; }
      .down-lang-btn { padding: 2px 5px; font-size: 8px; }
    }
'''.strip()

if marker not in text:
    if "</style>" not in text:
        raise SystemExit("UIh closing style tag not found")
    text = text.replace("</style>", style + "\n  </style>", 1)

old_card = '<div class="info-card full"><div class="label" data-i18n="downSinceLabel">Down Since</div><div class="value" id="downValue">-</div></div>'
new_card = '''<div class="info-card full down-since-card">
              <div class="down-since-head">
                <div class="label" id="downSinceLabelText">ดาวน์เมื่อ</div>
                <div class="down-since-lang-switch" role="group" aria-label="Down Since language">
                  <button type="button" class="down-lang-btn active" id="downSinceThBtn" aria-pressed="true">ไทย</button>
                  <button type="button" class="down-lang-btn" id="downSinceEnBtn" aria-pressed="false">ENG</button>
                </div>
              </div>
              <div class="value" id="downValue">-</div>
            </div>'''
if new_card not in text:
    if old_card not in text:
        raise SystemExit("Down Since parsed card target not found")
    text = text.replace(old_card, new_card, 1)

old_compose = '''      if (state.downSince) {
        const downSinceLabel = language === 'en' ? 'Down Since' : 'ดาวน์เมื่อ';
        lines.push(`${downSinceLabel} : ${formatDownSince(state.downSince, language)}`);
      }'''
new_compose = '''      if (state.downSince) {
        const downSinceLanguage = state.downSinceLanguage === 'en' ? 'en' : 'th';
        const downSinceLabel = downSinceLanguage === 'en' ? 'Down Since' : 'ดาวน์เมื่อ';
        lines.push(`${downSinceLabel} : ${formatDownSince(state.downSince, downSinceLanguage)}`);
      }'''
if new_compose not in text:
    if old_compose not in text:
        raise SystemExit("Down Since preview target not found")
    text = text.replace(old_compose, new_compose, 1)

lang_anchor = "    let currentLang = 'th';\n"
lang_replacement = "    let currentLang = 'th';\n    let downSinceLanguage = 'th';\n"
if lang_replacement not in text:
    if lang_anchor not in text:
        raise SystemExit("currentLang target not found")
    text = text.replace(lang_anchor, lang_replacement, 1)

state_anchor = "        rebootCount: $('rebootCount').value,\n        language: currentLang\n"
state_replacement = "        rebootCount: $('rebootCount').value,\n        downSinceLanguage: downSinceLanguage,\n        language: currentLang\n"
if state_replacement not in text:
    if state_anchor not in text:
        raise SystemExit("readState target not found")
    text = text.replace(state_anchor, state_replacement, 1)

old_render = "      setText('downValue', formatDownSince(data.downSince, currentLang));\n"
new_render = "      $('downSinceLabelText').textContent = downSinceLanguage === 'en' ? 'Down Since' : 'ดาวน์เมื่อ';\n      setText('downValue', formatDownSince(data.downSince, downSinceLanguage));\n      renderDownSinceLanguageButtons();\n"
if new_render not in text:
    if old_render not in text:
        raise SystemExit("renderParsed Down Since target not found")
    text = text.replace(old_render, new_render, 1)

function_anchor = "    function renderParsed() {\n"
functions = '''    function renderDownSinceLanguageButtons() {
      const isThai = downSinceLanguage !== 'en';
      $('downSinceThBtn').classList.toggle('active', isThai);
      $('downSinceEnBtn').classList.toggle('active', !isThai);
      $('downSinceThBtn').setAttribute('aria-pressed', String(isThai));
      $('downSinceEnBtn').setAttribute('aria-pressed', String(!isThai));
    }

    function setDownSinceLanguage(language) {
      downSinceLanguage = language === 'en' ? 'en' : 'th';
      renderDownSinceLanguageButtons();
      renderParsed();
      renderPreview();
    }

'''
if "function setDownSinceLanguage(language)" not in text:
    if function_anchor not in text:
        raise SystemExit("renderParsed function anchor not found")
    text = text.replace(function_anchor, functions + function_anchor, 1)

listener_anchor = "    $('langThBtn').addEventListener('click', () => setLanguage('th'));\n    $('langEnBtn').addEventListener('click', () => setLanguage('en'));\n\n    setLanguage('th');"
listener_replacement = "    $('langThBtn').addEventListener('click', () => setLanguage('th'));\n    $('langEnBtn').addEventListener('click', () => setLanguage('en'));\n    $('downSinceThBtn').addEventListener('click', () => setDownSinceLanguage('th'));\n    $('downSinceEnBtn').addEventListener('click', () => setDownSinceLanguage('en'));\n\n    setDownSinceLanguage('th');\n    setLanguage('th');"
if listener_replacement not in text:
    if listener_anchor not in text:
        raise SystemExit("language listener target not found")
    text = text.replace(listener_anchor, listener_replacement, 1)

path.write_text(text, encoding="utf-8")
print("Independent Down Since language toggle applied")
