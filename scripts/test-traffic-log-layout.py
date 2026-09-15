from pathlib import Path

html = Path("index.html").read_text(encoding="utf-8")

checks = {
    "wider log card": 'log-card w-full max-w-[1400px]' in html,
    "wider two-column results": 'grid-template-columns:minmax(0,1.85fr) minmax(360px,1fr)' in html,
    "dedicated result stack": '<div class="log-result-stack">' in html,
    "note stretches full grid height": '.log-note-panel{position:static;display:flex;flex-direction:column;height:100%;min-height:0}' in html,
    "note textarea fills panel": '.log-note-panel textarea{flex:1;min-height:0;height:auto;resize:none;line-height:1.65}' in html,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Missing expected layout behavior: " + ", ".join(failed))

print("Traffic log layout regression checks passed")
