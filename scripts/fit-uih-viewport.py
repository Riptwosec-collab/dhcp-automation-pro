from pathlib import Path
import re

path = Path("uih.html")
if not path.exists():
    raise SystemExit("uih.html not found; run scripts/patch-traffic-log.py first")

text = path.read_text(encoding="utf-8")
start = "/* uih-fit-viewport-v1 */"
end = "/* /uih-fit-viewport-v1 */"

css = r'''
    /* uih-fit-viewport-v1 */
    html, body { width: 100%; height: 100%; min-height: 0; overflow: hidden; }
    body { min-height: 0; }
    .shell { height: 100vh; max-height: 100vh; width: min(1500px, 100%); margin: 0 auto; padding: 14px 18px; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { flex: 0 0 auto; margin-bottom: 12px; gap: 14px; }
    .logo { width: 40px; height: 40px; border-radius: 12px; }
    h1 { font-size: clamp(20px, 1.65vw, 26px); }
    .subtitle { margin-top: 2px; font-size: 11px; }
    .grid { flex: 1; min-height: 0; height: auto; gap: 14px; align-items: stretch; }
    .panel { min-height: 0; display: flex; flex-direction: column; }
    .panel-head { flex: 0 0 auto; padding: 12px 14px 10px; }
    .panel-title { font-size: 14px; }
    .panel-desc { font-size: 10px; margin-top: 2px; }
    .panel-body { min-height: 0; overflow: hidden; display: flex; flex-direction: column; padding: 14px; }
    #rawInput { flex: 1; min-height: 0; height: auto; resize: none; }
    .preview { flex: 1; min-height: 0; height: auto; overflow: auto; padding: 14px; font-size: 13px; line-height: 1.55; }
    .btn-row { margin-top: 8px; gap: 7px; }
    .btn { padding: 8px 11px; font-size: 12px; }
    .parsed { margin-top: 10px; gap: 8px; }
    .info-card { padding: 8px 10px; }
    .section + .section { margin-top: 12px; padding-top: 10px; }
    .section-title { margin-bottom: 6px; }
    .control { padding: 7px 0; }
    .subcontrol { margin-top: 5px; padding: 7px 10px; }
    .hint { margin-top: 8px; padding: 8px 10px; }
    .footer-note { display: none; }

    @media (max-height: 820px) and (min-width: 1121px) {
      .shell { padding: 8px 12px; }
      .topbar { margin-bottom: 7px; gap: 10px; }
      .logo { width: 34px; height: 34px; border-radius: 10px; }
      h1 { font-size: 21px; }
      .subtitle { display: none; }
      .status-pill { padding: 5px 9px; font-size: 10px; }
      .lang-switch { padding: 3px; }
      .lang-btn { padding: 5px 8px; font-size: 10px; }
      .grid { gap: 10px; }
      .panel-head { padding: 8px 11px 7px; }
      .panel-title { font-size: 13px; }
      .panel-desc { font-size: 10px; margin-top: 1px; }
      .panel-body { padding: 9px 11px; }
      #rawInput { flex: 0 1 205px; height: 205px; padding: 10px; line-height: 1.45; font-size: 12px; }
      .preview { padding: 11px; line-height: 1.45; font-size: 12px; }
      .btn-row { margin-top: 6px; gap: 6px; }
      .btn { padding: 6px 9px; font-size: 11px; }
      .parsed { margin-top: 7px; gap: 6px; }
      .info-card { padding: 6px 8px; }
      .label { font-size: 9px; }
      .value { margin-top: 2px; font-size: 12px; }
      .section + .section { margin-top: 6px; padding-top: 6px; }
      .section-title { margin-bottom: 3px; font-size: 10px; }
      .control { padding: 4px 0; gap: 7px; }
      .control-name { font-size: 12px; }
      .control-note { display: none; }
      .id-tag { margin-top: 2px; padding: 3px 5px; font-size: 10px; }
      .circuit-toggle { min-width: 68px; padding: 5px 7px; font-size: 11px; }
      .switch { width: 38px; height: 21px; }
      .slider::before { width: 15px; height: 15px; left: 3px; top: 2px; }
      .switch input:checked + .slider::before { transform: translateX(16px); }
      select, input[type="number"] { padding: 5px 7px; font-size: 11px; }
      .port-pair select { min-width: 78px; }
      .subcontrol { margin: 4px 0 0 45px; padding: 5px 7px; }
      .counter button { width: 26px; height: 26px; }
      .counter input { width: 50px; padding: 4px; }
      .hint { display: none; }
    }
    /* /uih-fit-viewport-v1 */
'''

pattern = re.compile(
    re.escape(start) + r"[\s\S]*?" + re.escape(end),
    re.MULTILINE,
)

if pattern.search(text):
    text = pattern.sub(css.strip(), text, count=1)
elif "</style>" in text:
    text = text.replace("</style>", css + "  </style>", 1)
else:
    raise SystemExit("Cannot add UIh viewport-fit CSS: </style> not found")

path.write_text(text, encoding="utf-8")
print("UIh viewport-fit layout applied")
