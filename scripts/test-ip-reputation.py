from pathlib import Path
import re

html = Path("index.html").read_text(encoding="utf-8")
module_path = Path("local-ip-reputation.js")
module = module_path.read_text(encoding="utf-8") if module_path.exists() else ""

checks = {
    "traffic reputation panel exists": 'id="ipReputationPanel"' in html,
    "local analysis badge exists": 'LOCAL ANALYSIS' in html,
    "risk badge exists": 'id="ipRiskBadge"' in html,
    "reputation starts collapsed": 'id="ipReputationPanel"' in html and 'is-collapsed' in html,
    "reputation toggle control exists": all(token in html for token in [
        'id="ipRepToggle"', 'aria-controls="ipReputationContent"', 'aria-expanded="false"'
    ]),
    "reputation collapsible content exists": 'id="ipReputationContent"' in html and 'class="ip-rep-content"' in html,
    "reputation toggle behavior exists": 'function setIPReputationExpanded(expanded)' in html and 'function toggleIPReputation()' in html,
    "collapsed panel CSS exists": '.ip-rep-panel.is-collapsed .ip-rep-content' in html,
    "scan automatically expands reputation": bool(re.search(r"async function fetchISPData\(\)\{[^\n]*setIPReputationExpanded\(true\)", html)),
    "IP type field exists": 'id="ipRepIpType"' in html,
    "provider and ASN fields exist": 'id="ipRepProvider"' in html and 'id="ipRepAsn"' in html,
    "network type field exists": 'id="ipRepNetworkType"' in html,
    "local score field exists": 'id="ipRepLocalScore"' in html,
    "analysis reasons exist": 'id="ipRepReasons"' in html,
    "external threat limitations exist": all(token in html for token in [
        'id="ipFlagAbuser"', 'id="ipFlagTor"', 'id="ipFlagProxy"',
        'id="ipFlagVpn"', 'id="ipFlagSpamAttack"', 'id="ipFlagThreatFeed"'
    ]),
    "external threat fields are explicitly unverified": 'NOT VERIFIED' in html and 'UNKNOWN' in html,
    "reputation is explicitly view only": 'VIEW ONLY · ไม่รวมใน COPY' in html,
    "local analyzer module is loaded": '<script src="local-ip-reputation.js"></script>' in html,
    "frontend uses local analyzer": 'LocalIPReputation.analyzeNetwork' in html,
    "frontend does not call threat API": '/api/ip-reputation' not in html,
    "local analyzer module exists": bool(module),
    "local analyzer exposes network analysis": 'analyzeNetwork' in module,
    "local analyzer exposes IP classification": 'classifyIpType' in module,
    "local analyzer distinguishes LOW CAUTION HIGH": all(token in module for token in ['LOW RISK', 'CAUTION', 'HIGH RISK']),
    "local analyzer marks external threat data unknown": 'NOT VERIFIED' in module and 'UNKNOWN' in module,
}

match = re.search(r"function generateLogs\(\)\{(?P<body>.*?)(?=\n  function |\n  async function |\n  const |\n  let |\n  window\.|\n</script>)", html, re.S)
if match:
    generate_body = match.group("body")
    checks["reputation never enters copied log output"] = "ipReputation" not in generate_body and "ipRisk" not in generate_body and "ipRep" not in generate_body
else:
    checks["generateLogs remains present"] = False

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Missing expected local IP reputation behavior: " + ", ".join(failed))

print("Local traffic IP reputation regression checks passed")
