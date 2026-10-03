from pathlib import Path
import re

path = Path('operations-messages.html')
text = path.read_text(encoding='utf-8')

# Replace only this visual layer so the generator stays idempotent.
text = re.sub(
    r'\n\s*/\* operations-visual-refresh-v2:start \*/.*?/\* operations-visual-refresh-v2:end \*/\s*',
    '\n',
    text,
    flags=re.S,
)

visual_css = r'''
    /* operations-visual-refresh-v2:start */
    body{background:
      radial-gradient(circle at 10% 0%,rgba(var(--accentRgb),.075),transparent 28%),
      radial-gradient(circle at 92% 8%,rgba(var(--alertRgb),.045),transparent 26%),
      var(--bg)}
    .ops-shell{max-width:1800px}
    .ops-topline{padding:clamp(8px,1vw,14px) clamp(2px,.5vw,8px) clamp(16px,1.4vw,22px);border-bottom-color:rgba(var(--accentRgb),.24)}
    .ops-title-wrap small{font-size:clamp(10px,.72vw,12px);line-height:1.4;letter-spacing:.16em;color:var(--accent2)}
    .ops-title-wrap h1{margin-top:7px;font-size:clamp(24px,2vw,34px);line-height:1.15;font-weight:950;letter-spacing:.015em;text-shadow:0 0 24px rgba(var(--accentRgb),.16)}
    .ops-live{gap:9px;padding:10px 14px;font-size:clamp(11px,.82vw,13px);border-color:rgba(var(--accentRgb),.38);background:rgba(var(--accentRgb),.10);box-shadow:0 0 22px rgba(var(--accentRgb),.07)}
    .ops-live::before{width:8px;height:8px}

    .ops-group{margin-top:clamp(16px,1.4vw,24px);border-radius:22px;border-color:rgba(var(--accentRgb),.34);background:linear-gradient(145deg,rgba(var(--accentRgb),.075),rgba(4,8,13,.97) 36%,rgba(2,5,10,.985));box-shadow:0 22px 58px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.045),0 0 34px rgba(var(--accentRgb),.045)}
    .ops-group.alerts{border-color:rgba(var(--alertRgb),.52);background:linear-gradient(145deg,rgba(var(--alertRgb),.11),rgba(9,7,12,.97) 38%,rgba(3,5,10,.985));box-shadow:0 22px 58px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.04),0 0 32px rgba(var(--alertRgb),.055)}
    .ops-group-head{padding:clamp(16px,1.5vw,24px);border-bottom-color:rgba(var(--accentRgb),.22);background:linear-gradient(90deg,rgba(var(--accentRgb),.13),rgba(var(--accentRgb),.035) 48%,transparent)}
    .ops-group.alerts .ops-group-head{border-bottom-color:rgba(var(--alertRgb),.30);background:linear-gradient(90deg,rgba(var(--alertRgb),.15),rgba(var(--alertRgb),.035) 48%,transparent)}
    .ops-group-title{gap:14px}.ops-icon{width:44px;height:44px;border-radius:13px;font-size:18px;border-color:rgba(var(--accentRgb),.48);background:rgba(var(--accentRgb),.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 20px rgba(var(--accentRgb),.08)}
    .ops-kicker{font-size:clamp(9px,.72vw,11px);letter-spacing:.18em}.ops-name{margin-top:5px;font-size:clamp(17px,1.2vw,21px);line-height:1.2}.ops-count{padding:7px 10px;font-size:clamp(10px,.72vw,12px)}

    .ops-grid,.ops-group.alerts .ops-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,500px),1fr));gap:clamp(12px,1.2vw,18px);padding:clamp(14px,1.4vw,22px)}
    .ops-card{min-width:0;padding:clamp(16px,1.4vw,22px);border-radius:17px;border-color:rgba(var(--accentRgb),.27);background:linear-gradient(145deg,rgba(var(--accentRgb),.075),rgba(4,8,13,.91) 54%,rgba(2,5,9,.96));box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 10px 30px rgba(0,0,0,.18)}
    .ops-group.alerts .ops-card{border-color:rgba(var(--alertRgb),.30);background:linear-gradient(145deg,rgba(var(--alertRgb),.075),rgba(7,7,12,.92) 52%,rgba(2,5,9,.96))}
    .ops-card:hover{transform:translateY(-2px);border-color:rgba(var(--accentRgb),.62);box-shadow:0 16px 36px rgba(0,0,0,.30),0 0 25px rgba(var(--accentRgb),.10),inset 0 1px 0 rgba(255,255,255,.045)}
    .ops-group.alerts .ops-card:hover{border-color:rgba(var(--alertRgb),.62);box-shadow:0 16px 36px rgba(0,0,0,.30),0 0 25px rgba(var(--alertRgb),.10),inset 0 1px 0 rgba(255,255,255,.045)}
    .ops-card-head{gap:14px;align-items:flex-start}.ops-card-title{min-width:0;font-size:clamp(16px,1.18vw,20px);line-height:1.35;font-weight:950;color:#fff;overflow:visible;overflow-wrap:anywhere;white-space:normal}
    .ops-card-title::before{width:4px;height:17px;margin-right:9px;vertical-align:-2px}
    .ops-desc{margin:clamp(11px,.9vw,15px) 0 clamp(12px,1vw,16px);font-size:clamp(13px,1vw,16px);line-height:1.7;color:#b9c1cd;white-space:normal;overflow:visible;overflow-wrap:anywhere;word-break:normal}
    body[data-theme="cyber"] .ops-desc{color:#b9cce6}
    .ops-stamp{gap:10px;font-size:clamp(11px,.82vw,13px);line-height:1.3}
    .ops-copy{min-width:76px;min-height:40px;padding:0 14px;border-radius:10px;border-color:rgba(var(--accentRgb),.48);background:linear-gradient(145deg,rgba(var(--accentRgb),.15),rgba(var(--accentRgb),.07));font-size:clamp(10px,.76vw,12px);line-height:1.25;letter-spacing:.035em;white-space:normal;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 0 16px rgba(var(--accentRgb),.06)}
    .ops-copy:hover{background:rgba(var(--accentRgb),.22);border-color:rgba(var(--accentRgb),.82);box-shadow:0 0 22px rgba(var(--accentRgb),.16)}
    .ops-group.alerts .ops-copy{border-color:rgba(var(--alertRgb),.46);background:linear-gradient(145deg,rgba(var(--alertRgb),.14),rgba(var(--alertRgb),.06));color:#fec1ca}

    @media(max-width:767px){.ops-group{border-radius:17px}.ops-group-head{padding:14px}.ops-icon{width:40px;height:40px}.ops-grid,.ops-group.alerts .ops-grid{padding:12px;gap:11px}.ops-card{padding:16px}.ops-copy{min-width:70px;min-height:40px;max-width:46%}}
    @media(max-width:430px){.ops-title-wrap h1{font-size:24px}.ops-group-head{padding:12px}.ops-name{font-size:17px}.ops-grid,.ops-group.alerts .ops-grid{padding:9px}.ops-card{padding:15px}.ops-card-title{font-size:16px}.ops-desc{font-size:13px;line-height:1.65}.ops-copy{padding:0 10px;font-size:10px}}
    @media(max-height:760px) and (min-width:768px){.ops-group{margin-top:12px}.ops-group-head{padding:13px 16px}.ops-grid,.ops-group.alerts .ops-grid{padding:12px;gap:11px}.ops-card{padding:16px}.ops-desc{margin:9px 0 11px}}
    /* operations-visual-refresh-v2:end */
'''.rstrip()

if '</style>' not in text:
    raise SystemExit('Operations style closing tag not found')
text = text.replace('</style>', visual_css + '\n  </style>', 1)


def remove_stamp_from_card(source: str, key: str) -> str:
    pattern = re.compile(
        r'(<article class="ops-card">(?:(?!</article>).)*?onclick="copyOperationMessage\(\''
        + re.escape(key)
        + r"\',this\)\"(?:(?!</article>).)*?)(</article>)",
        flags=re.S,
    )

    def repl(match):
        body = re.sub(r'<div class="ops-stamp">.*?</div>', '', match.group(1), count=1, flags=re.S)
        return body + match.group(2)

    updated, count = pattern.subn(repl, source, count=1)
    if count != 1:
        raise SystemExit(f'Operations card not found: {key}')
    return updated


# User requested visible date/time removal only for these two cards.
text = remove_stamp_from_card(text, 'shutdown-10')
text = remove_stamp_from_card(text, 'ten-complete')

path.write_text(text, encoding='utf-8')
print('Operations Visual Refresh v2 applied')