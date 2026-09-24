from pathlib import Path
import re

path = Path("index.html")
text = path.read_text(encoding="utf-8")
marker_v1 = "/* traffic-ip-reputation-v1 */"
marker_v2 = "/* traffic-ip-reputation-v2 */"

css = r'''
    /* traffic-ip-reputation-v2 */
    .ip-rep-panel{position:relative;overflow:hidden;border:1px solid rgba(var(--accentRgb),.16);background:linear-gradient(135deg,rgba(var(--accentRgb),.055),rgba(255,255,255,.018));border-radius:14px;padding:14px 16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.025);transition:.25s ease}
    .ip-rep-panel[data-state="high"]{border-color:rgba(239,68,68,.55);box-shadow:0 0 24px rgba(239,68,68,.09),inset 0 0 24px rgba(239,68,68,.035)}
    .ip-rep-panel[data-state="caution"]{border-color:rgba(245,158,11,.52);box-shadow:0 0 22px rgba(245,158,11,.07),inset 0 0 20px rgba(245,158,11,.03)}
    .ip-rep-panel[data-state="low"]{border-color:rgba(34,197,94,.38);box-shadow:0 0 20px rgba(34,197,94,.055)}
    .ip-rep-panel[data-state="private"]{border-color:rgba(59,130,246,.38)}
    .ip-rep-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .ip-rep-title{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
    .ip-risk-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.04);font:800 10px/1 'JetBrains Mono',monospace;letter-spacing:.06em;color:var(--muted);white-space:nowrap}
    .ip-rep-panel[data-state="high"] .ip-risk-badge{color:#fecaca;border-color:rgba(239,68,68,.45);background:rgba(239,68,68,.10)}
    .ip-rep-panel[data-state="caution"] .ip-risk-badge{color:#fde68a;border-color:rgba(245,158,11,.42);background:rgba(245,158,11,.09)}
    .ip-rep-panel[data-state="low"] .ip-risk-badge{color:#bbf7d0;border-color:rgba(34,197,94,.34);background:rgba(34,197,94,.08)}
    .ip-rep-panel[data-state="private"] .ip-risk-badge{color:#bfdbfe;border-color:rgba(59,130,246,.34);background:rgba(59,130,246,.08)}
    .ip-rep-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .ip-rep-item{min-width:0;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.055);background:rgba(0,0,0,.16)}
    .ip-rep-item span{display:block;color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
    .ip-rep-item strong{display:block;color:#fff;font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ip-rep-reasons{margin-top:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.055);background:rgba(0,0,0,.14)}
    .ip-rep-reasons-title{font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
    .ip-rep-reasons ul{margin:0;padding-left:17px;color:#d1d5db;font-size:10px;line-height:1.55}
    .ip-rep-external-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px;color:var(--muted);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .ip-rep-external-title b{color:var(--warning);font-family:'JetBrains Mono',monospace}
    .ip-rep-flags{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
    .ip-flag{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);color:var(--muted);font-size:9px;font-weight:800}
    .ip-flag b{font-family:'JetBrains Mono',monospace;color:#d1d5db}
    .ip-rep-note{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.055);color:var(--muted);font-size:9px;line-height:1.4}
    .ip-rep-note span:last-child{font-weight:900;letter-spacing:.06em;color:rgba(var(--accentRgb),.72);white-space:nowrap}
    @media(max-width:900px){.ip-rep-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ip-rep-note{align-items:flex-start;flex-direction:column}.ip-rep-note span:last-child{white-space:normal}}
'''.strip()

if marker_v2 not in text:
    if marker_v1 in text:
        pattern = re.compile(r'\n?\s*/\* traffic-ip-reputation-v1 \*/.*?(?=\n\s*</style>)', re.S)
        text, count = pattern.subn("\n" + css, text, count=1)
        if count != 1:
            raise SystemExit("Existing traffic IP reputation CSS block not found")
    else:
        if "</style>" not in text:
            raise SystemExit("Style closing tag not found")
        text = text.replace("</style>", css + "\n  </style>", 1)

if '<script src="local-ip-reputation.js"></script>' not in text:
    if "</head>" not in text:
        raise SystemExit("Head closing tag not found")
    text = text.replace("</head>", '  <script src="local-ip-reputation.js"></script>\n</head>', 1)

panel = r'''
                <div id="ipReputationPanel" class="md:col-span-2 ip-rep-panel" data-state="idle">
                  <div class="ip-rep-head">
                    <div class="ip-rep-title"><i data-lucide="shield-check" class="w-4 h-4"></i><span>IP REPUTATION · LOCAL ANALYSIS</span></div>
                    <span id="ipRiskBadge" class="ip-risk-badge">NOT CHECKED</span>
                  </div>
                  <div class="ip-rep-grid">
                    <div class="ip-rep-item"><span>IP</span><strong id="ipRepIp">-</strong></div>
                    <div class="ip-rep-item"><span>IP Type</span><strong id="ipRepIpType">-</strong></div>
                    <div class="ip-rep-item"><span>Provider</span><strong id="ipRepProvider">-</strong></div>
                    <div class="ip-rep-item"><span>ASN</span><strong id="ipRepAsn">-</strong></div>
                    <div class="ip-rep-item"><span>Network Type</span><strong id="ipRepNetworkType">-</strong></div>
                    <div class="ip-rep-item"><span>Local Score</span><strong id="ipRepLocalScore">-</strong></div>
                  </div>
                  <div class="ip-rep-reasons"><div class="ip-rep-reasons-title">เหตุผลที่ใช้วิเคราะห์</div><ul id="ipRepReasons"><li>กด SCAN IP เพื่อเริ่มวิเคราะห์</li></ul></div>
                  <div class="ip-rep-external-title"><span>EXTERNAL THREAT DATA</span><b>NOT VERIFIED</b></div>
                  <div class="ip-rep-flags">
                    <span class="ip-flag">Abuser <b id="ipFlagAbuser">UNKNOWN</b></span>
                    <span class="ip-flag">TOR <b id="ipFlagTor">UNKNOWN</b></span>
                    <span class="ip-flag">Proxy <b id="ipFlagProxy">UNKNOWN</b></span>
                    <span class="ip-flag">VPN <b id="ipFlagVpn">UNKNOWN</b></span>
                    <span class="ip-flag">Spam/Attack <b id="ipFlagSpamAttack">UNKNOWN</b></span>
                    <span class="ip-flag">Threat Feed <b id="ipFlagThreatFeed">NOT VERIFIED</b></span>
                  </div>
                  <div class="ip-rep-note"><span id="ipRepMessage">วิเคราะห์จาก IP + ISP/ASN/Organization ที่เว็บดึงได้เท่านั้น</span><span>VIEW ONLY · ไม่รวมใน COPY</span></div>
                </div>'''.strip()

if 'id="ipReputationPanel"' in text:
    panel_pattern = re.compile(
        r'\n?<div id="ipReputationPanel".*?\n\s*</div>\n\s*</div>\n\s*<button onclick="generateLogs\(\)"',
        re.S,
    )
    replacement = "\n" + panel + '\n              </div>\n              <button onclick="generateLogs()"'
    text, count = panel_pattern.subn(replacement, text, count=1)
    if count != 1:
        raise SystemExit("Existing IP reputation panel target not found")
else:
    isp_pattern = re.compile(
        r'(<div class="md:col-span-2"><div class="flex flex-wrap justify-between items-center gap-2 mb-2"><label class="text-\[11px\] font-bold accent-text uppercase tracking-widest">Network / ISP \(ผู้ให้บริการ\)</label>.*?id="btnScanIp".*?>.*?SCAN IP</button></div></div>)',
        re.S,
    )
    text, count = isp_pattern.subn(r'\1\n' + panel, text, count=1)
    if count != 1:
        raise SystemExit("Network / ISP block target not found")

helpers = r'''
  function setIPRepText(id,value){const el=document.getElementById(id);if(el)el.textContent=value??'-'}
  function setIPReputationState(state,badge,message){const panel=document.getElementById('ipReputationPanel');if(!panel)return;panel.dataset.state=state||'idle';setIPRepText('ipRiskBadge',badge||'NOT CHECKED');setIPRepText('ipRepMessage',message||'')}
  function setIPRepReasons(reasons){const ul=document.getElementById('ipRepReasons');if(!ul)return;const safe=(Array.isArray(reasons)&&reasons.length?reasons:['ยังไม่มีข้อมูลสำหรับวิเคราะห์']);ul.innerHTML='';safe.forEach(reason=>{const li=document.createElement('li');li.textContent=reason;ul.appendChild(li)})}
  function setExternalThreatUnknown(external={}){setIPRepText('ipFlagAbuser',external.abuser||'UNKNOWN');setIPRepText('ipFlagTor',external.tor||'UNKNOWN');setIPRepText('ipFlagProxy',external.proxy||'UNKNOWN');setIPRepText('ipFlagVpn',external.vpn||'UNKNOWN');setIPRepText('ipFlagSpamAttack',external.spamAttack||'UNKNOWN');setIPRepText('ipFlagThreatFeed',external.threatFeed||'NOT VERIFIED')}
  function resetIPReputation(){setIPReputationState('idle','NOT CHECKED','วิเคราะห์จาก IP + ISP/ASN/Organization ที่เว็บดึงได้เท่านั้น');['ipRepIp','ipRepIpType','ipRepProvider','ipRepAsn','ipRepNetworkType','ipRepLocalScore'].forEach(id=>setIPRepText(id,'-'));setIPRepReasons(['กด SCAN IP เพื่อเริ่มวิเคราะห์']);setExternalThreatUnknown()}
  function setIPReputationLoading(ip){setIPReputationState('idle','ANALYZING','กำลังวิเคราะห์ข้อมูลภายในเว็บ...');setIPRepText('ipRepIp',ip);['ipRepIpType','ipRepProvider','ipRepAsn','ipRepNetworkType','ipRepLocalScore'].forEach(id=>setIPRepText(id,'...'));setIPRepReasons(['กำลังตรวจประเภท IP และลักษณะ Provider/ASN']);setExternalThreatUnknown()}
  function renderLocalIPReputation(input){if(!window.LocalIPReputation){setIPReputationState('idle','UNAVAILABLE','Local analyzer โหลดไม่สำเร็จ');return}const result=window.LocalIPReputation.analyzeNetwork(input||{}),state=result.risk?.severity==='high'?'high':result.risk?.severity==='caution'?'caution':result.ipType&&result.ipType!=='PUBLIC'&&result.ipType!=='INVALID'?'private':'low';setIPReputationState(state,result.risk?.level||'UNKNOWN','LOCAL HEURISTIC · ไม่ใช่ Threat Feed');setIPRepText('ipRepIp',result.ip||input?.ip||'-');setIPRepText('ipRepIpType',result.ipType||'-');setIPRepText('ipRepProvider',input?.provider||input?.org||'-');setIPRepText('ipRepAsn',input?.asn||'-');setIPRepText('ipRepNetworkType',result.networkType||'-');setIPRepText('ipRepLocalScore',`${Number(result.score||0)} / 100`);setIPRepReasons(result.reasons);setExternalThreatUnknown(result.externalThreat)}
'''.strip()

helper_pattern = re.compile(r'\n\s*function setIPRepText\(.*?(?=\n\s*async function fetchISPData\(\))', re.S)
if helper_pattern.search(text):
    text = helper_pattern.sub("\n" + helpers, text, count=1)
else:
    anchor = "  async function fetchISPData()"
    if anchor not in text:
        raise SystemExit("fetchISPData anchor not found")
    text = text.replace(anchor, helpers + "\n  async function fetchISPData()", 1)

new_fetch = r'''  async function fetchISPData(){const raw=document.getElementById('dstIp').value.trim(),btn=document.getElementById('btnScanIp');if(!raw){resetIPReputation();return}const ip=extractIPv4(raw);if(!ip){fetchedISP='IP ไม่ถูกต้อง';fetchedCountry='';renderISP();renderLocalIPReputation({ip:raw});return}const localType=window.LocalIPReputation?.classifyIpType(ip);if(localType?.local||isPrivateIPv4(ip)){fetchedISP=localType?.label||'PRIVATE';fetchedCountry='';renderISP();renderLocalIPReputation({ip,provider:fetchedISP,org:fetchedISP});return}const old=btn.innerHTML;btn.innerHTML='<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>SCANNING';lucide.createIcons();document.getElementById('ispInput').value='SCANNING...';setIPReputationLoading(ip);let analysisInput={ip,provider:'',org:'',asn:'',domain:'',country:''};try{const d=await fetchJson(`https://ipwho.is/${ip}`);if(!d.success)throw new Error('main api failed');const c=d.connection||{},provider=c.isp||c.org||'ไม่พบข้อมูล';fetchedISP=formatIspName(provider);fetchedCountry=d.country||'';analysisInput={ip,provider,org:c.org||'',asn:c.asn?`AS${String(c.asn).replace(/^AS/i,'')}`:'',domain:c.domain||'',country:d.country||''}}catch{try{const d=await fetchJson(`https://ipapi.co/${ip}/json/`);if(d.error||!d.org)throw new Error('fallback api failed');fetchedISP=formatIspName(d.org);fetchedCountry=d.country_name||'';analysisInput={ip,provider:d.org||'',org:d.org||'',asn:d.asn||'',domain:'',country:d.country_name||''}}catch{fetchedISP='เชื่อมต่อล้มเหลว (Network Blocked)';fetchedCountry='';analysisInput={ip}}}renderISP();renderLocalIPReputation(analysisInput);btn.innerHTML=old;lucide.createIcons()}'''

fetch_pattern = re.compile(r"  async function fetchISPData\(\)\{.*?\}\n  function renderISP\(\)", re.S)
match = fetch_pattern.search(text)
if not match:
    raise SystemExit("fetchISPData function target not found")
text = text[:match.start()] + new_fetch + "\n  function renderISP()" + text[match.end():]

path.write_text(text, encoding="utf-8")
print("Local traffic IP reputation analysis applied")
