from pathlib import Path
import re

html = Path("index.html").read_text(encoding="utf-8")
api_path = Path("api/ip-reputation.js")
api = api_path.read_text(encoding="utf-8") if api_path.exists() else ""

checks = {
    "traffic reputation panel exists": 'id="ipReputationPanel"' in html,
    "risk badge exists": 'id="ipRiskBadge"' in html,
    "provider and ASN fields exist": 'id="ipRepProvider"' in html and 'id="ipRepAsn"' in html,
    "company and ASN abuse scores exist": 'id="ipRepCompanyScore"' in html and 'id="ipRepAsnScore"' in html,
    "threat flags exist": all(token in html for token in ['id="ipFlagAbuser"', 'id="ipFlagTor"', 'id="ipFlagProxy"', 'id="ipFlagVpn"', 'id="ipFlagDatacenter"']),
    "reputation is explicitly view only": 'VIEW ONLY · ไม่รวมใน COPY' in html,
    "frontend has reputation lookup": 'async function fetchIPReputation(ip)' in html and "fetch(`/api/ip-reputation?ip=${encodeURIComponent(ip)}`" in html,
    "private IPs are not sent to threat API": "setIPReputationPrivate(ip)" in html,
    "API endpoint exists": bool(api),
    "API key stays server side": "process.env.IPAPI_IS_KEY" in api and "api.ipapi.is" in api,
    "API validates IPv4": "isValidIPv4" in api,
    "API blocks private IPv4 lookups": "isPrivateIPv4" in api,
    "API returns normalized threat fields": all(token in api for token in ["is_abuser", "is_tor", "is_proxy", "is_vpn", "is_datacenter"]),
    "API exposes abuse scores": "companyAbuserScore" in api and "asnAbuserScore" in api,
    "risk classification exists": "HIGH RISK" in api and "CAUTION" in api and "LOW RISK" in api,
}

match = re.search(r"function generateLogs\(\)\{(?P<body>.*?)(?=\n  function |\n  async function |\n  const |\n  let |\n  window\.|\n</script>)", html, re.S)
if match:
    generate_body = match.group("body")
    checks["reputation never enters copied log output"] = "ipReputation" not in generate_body and "ipRisk" not in generate_body and "ipRep" not in generate_body
else:
    checks["generateLogs remains present"] = False

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Missing expected IP reputation behavior: " + ", ".join(failed))

print("Traffic IP reputation regression checks passed")
