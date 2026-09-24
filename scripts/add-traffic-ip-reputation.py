from pathlib import Path
import re

path = Path("index.html")
text = path.read_text(encoding="utf-8")
marker = "/* traffic-ip-reputation-v1 */"

css = r'''
    /* traffic-ip-reputation-v1 */
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
    .ip-rep-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
    .ip-rep-item{min-width:0;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.055);background:rgba(0,0,0,.16)}
    .ip-rep-item span{display:block;color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
    .ip-rep-item strong{display:block;color:#fff;font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ip-rep-flags{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
    .ip-flag{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);color:var(--muted);font-size:9px;font-weight:800}
    .ip-flag b{font-family:'JetBrains Mono',monospace;color:#d1d5db}
    .ip-flag.is-on{border-color:rgba(245,158,11,.30);background:rgba(245,158,11,.07);color:#fcd34d}
    .ip-flag.is-on b{color:#fde68a}
    .ip-flag.is-danger{border-color:rgba(239,68,68,.38);background:rgba(239,68,68,.08);color:#fca5a5}
    .ip-flag.is-danger b{color:#fecaca}
    .ip-rep-note{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.055);color:var(--muted);font-size:9px;line-height:1.4}
    .ip-rep-note span:last-child{font-weight:900;letter-spacing:.06em;color:rgba(var(--accentRgb),.72);white-space:nowrap}
    @media(max-width:900px){.ip-rep-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ip-rep-note{align-items:flex-start;flex-direction:column}.ip-rep-note span:last-child{white-space:normal}}
'''.strip()

if marker not in text:
    if "</style>" not in text:
        raise SystemExit("Style closing tag not found")
    text = text.replace("</style>", css + "\n  </style>", 1)

panel = r'''
                <div id="ipReputationPanel" class="md:col-span-2 ip-rep-panel" data-state="idle">
                  <div class="ip-rep-head">
                    <div class="ip-rep-title"><i data-lucide="shield-check" class="w-4 h-4"></i><span>IP REPUTATION</span></div>
                    <span id="ipRiskBadge" class="ip-risk-badge">NOT CHECKED</span>
                  </div>
                  <div class="ip-rep-grid">
                    <div class="ip-rep-item"><span>IP</span><strong id="ipRepIp">-</strong></div>
                    <div class="ip-rep-item"><span>Provider</span><strong id="ipRepProvider">-</strong></div>
                    <div class="ip-rep-item"><span>ASN</span><strong id="ipRepAsn">-</strong></div>
                    <div class="ip-rep-item"><span>Network Abuse</span><strong id="ipRepCompanyScore">-</strong></div>
                    <div class="ip-rep-item"><span>ASN Abuse</span><strong id="ipRepAsnScore">-</strong></div>
                  </div>
                  <div class="ip-rep-flags">
                    <span class="ip-flag" data-ip-flag="abuser">Abuser <b id="ipFlagAbuser">--</b></span>
                    <span class="ip-flag" data-ip-flag="tor">TOR <b id="ipFlagTor">--</b></span>
                    <span class="ip-flag" data-ip-flag="proxy">Proxy <b id="ipFlagProxy">--</b></span>
                    <span class="ip-flag" data-ip-flag="vpn">VPN <b id="ipFlagVpn">--</b></span>
                    <span class="ip-flag" data-ip-flag="datacenter">Datacenter <b id="ipFlagDatacenter">--</b></span>
                  </div>
                  <div class="ip-rep-note"><span id="ipRepMessage">กด SCAN IP เพื่อตรวจ Reputation</span><span>VIEW ONLY · ไม่รวมใน COPY</span></div>
                </div>'''.strip()

if 'id="ipReputationPanel"' not in text:
    isp_pattern = re.compile(
        r'(<div class="md:col-span-2"><div class="flex flex-wrap justify-between items-center gap-2 mb-2"><label class="text-\[11px\] font-bold accent-text uppercase tracking-widest">Network / ISP \(ผู้ให้บริการ\)</label>.*?id="btnScanIp".*?>.*?SCAN IP</button></div></div>)',
        re.S,
    )
    text, count = isp_pattern.subn(r'\1\n' + panel, text, count=1)
    if count != 1:
        raise SystemExit("Network / ISP block target not found")

helpers = r'''
  function setIPRepText(id,value){const el=document.getElementById(id);if(el)el.textContent=value||'-'}
  function setIPReputationState(state,badge,message){const panel=document.getElementById('ipReputationPanel');if(!panel)return;panel.dataset.state=state||'idle';setIPRepText('ipRiskBadge',badge||'NOT CHECKED');setIPRepText('ipRepMessage',message||'')}
  function setIPFlag(name,value){const map={abuser:'ipFlagAbuser',tor:'ipFlagTor',proxy:'ipFlagProxy',vpn:'ipFlagVpn',datacenter:'ipFlagDatacenter'},id=map[name],el=document.getElementById(id),pill=document.querySelector(`[data-ip-flag="${name}"]`);if(el)el.textContent=value===true?'YES':value===false?'NO':'--';if(pill){pill.classList.toggle('is-on',value===true&&name!=='abuser');pill.classList.toggle('is-danger',value===true&&name==='abuser')}}
  function resetIPReputation(){setIPReputationState('idle','NOT CHECKED','กด SCAN IP เพื่อตรวจ Reputation');['ipRepIp','ipRepProvider','ipRepAsn','ipRepCompanyScore','ipRepAsnScore'].forEach(id=>setIPRepText(id,'-'));['abuser','tor','proxy','vpn','datacenter'].forEach(name=>setIPFlag(name,null))}
  function setIPReputationLoading(ip){setIPReputationState('loading','CHECKING','กำลังตรวจ Threat Intelligence...');setIPRepText('ipRepIp',ip);['ipRepProvider','ipRepAsn','ipRepCompanyScore','ipRepAsnScore'].forEach(id=>setIPRepText(id,'...'));['abuser','tor','proxy','vpn','datacenter'].forEach(name=>setIPFlag(name,null))}
  function setIPReputationPrivate(ip){setIPReputationState('private','PRIVATE / LOCAL','IP ภายในองค์กร · ไม่ส่งออกไปตรวจภายนอก');setIPRepText('ipRepIp',ip);setIPRepText('ipRepProvider','PRIVATE');setIPRepText('ipRepAsn','-');setIPRepText('ipRepCompanyScore','-');setIPRepText('ipRepAsnScore','-');['abuser','tor','proxy','vpn','datacenter'].forEach(name=>setIPFlag(name,false))}
  function renderIPReputation(d){const severity=d?.risk?.severity||'idle';setIPReputationState(severity,d?.risk?.level||'UNKNOWN',d?.risk?.reason||'ไม่มีข้อมูล Reputation');setIPRepText('ipRepIp',d?.ip||'-');setIPRepText('ipRepProvider',d?.provider||'-');setIPRepText('ipRepAsn',d?.asn||'-');setIPRepText('ipRepCompanyScore',d?.companyAbuserScore||'-');setIPRepText('ipRepAsnScore',d?.asnAbuserScore||'-');const f=d?.flags||{};setIPFlag('abuser',f.is_abuser===true);setIPFlag('tor',f.is_tor===true);setIPFlag('proxy',f.is_proxy===true);setIPFlag('vpn',f.is_vpn===true);setIPFlag('datacenter',f.is_datacenter===true)}
  async function fetchIPReputation(ip){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),7500);let r;try{r=await fetch(`/api/ip-reputation?ip=${encodeURIComponent(ip)}`,{signal:c.signal,cache:'no-store'})}finally{clearTimeout(t)}let d={};try{d=await r.json()}catch{}if(r.ok){renderIPReputation(d);return}if(d.error==='THREAT_KEY_NOT_CONFIGURED'){setIPReputationState('idle','NOT CONFIGURED','Threat Intelligence ยังไม่ได้ตั้งค่า IPAPI_IS_KEY');return}setIPReputationState('idle','UNAVAILABLE','ตรวจ Reputation ไม่สำเร็จ · ISP lookup ยังใช้งานได้ตามปกติ')}catch{setIPReputationState('idle','UNAVAILABLE','Threat Intelligence ไม่ตอบสนอง · ไม่กระทบ Generate Log')}}
'''.strip()

if "async function fetchIPReputation(ip)" not in text:
    anchor = "  async function fetchISPData()"
    if anchor not in text:
        raise SystemExit("fetchISPData anchor not found")
    text = text.replace(anchor, helpers + "\n  async function fetchISPData()", 1)

new_fetch = r'''  async function fetchISPData(){const raw=document.getElementById('dstIp').value.trim(),btn=document.getElementById('btnScanIp');if(!raw){resetIPReputation();return}const ip=extractIPv4(raw);if(!ip){fetchedISP='IP ไม่ถูกต้อง';fetchedCountry='';renderISP();setIPReputationState('idle','INVALID IP','กรุณาตรวจ Destination IP');return}if(isPrivateIPv4(ip)){fetchedISP='PRIVATE';fetchedCountry='';renderISP();setIPReputationPrivate(ip);return}const old=btn.innerHTML;btn.innerHTML='<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>SCANNING';lucide.createIcons();document.getElementById('ispInput').value='SCANNING...';setIPReputationLoading(ip);const reputationPromise=fetchIPReputation(ip);try{const d=await fetchJson(`https://ipwho.is/${ip}`);if(!d.success)throw new Error('main api failed');fetchedISP=formatIspName(d.connection?.isp||d.connection?.org||'ไม่พบข้อมูล');fetchedCountry=d.country||''}catch{try{const d=await fetchJson(`https://ipapi.co/${ip}/json/`);if(d.error||!d.org)throw new Error('fallback api failed');fetchedISP=formatIspName(d.org);fetchedCountry=d.country_name||''}catch{fetchedISP='เชื่อมต่อล้มเหลว (Network Blocked)';fetchedCountry=''}}renderISP();await reputationPromise;btn.innerHTML=old;lucide.createIcons()}'''

fetch_pattern = re.compile(r"  async function fetchISPData\(\)\{.*?\}\n  function renderISP\(\)", re.S)
match = fetch_pattern.search(text)
if not match:
    raise SystemExit("fetchISPData function target not found")
current_fetch = match.group(0)
if "setIPReputationLoading(ip)" not in current_fetch:
    text = text[:match.start()] + new_fetch + "\n  function renderISP()" + text[match.end():]

path.write_text(text, encoding="utf-8")
print("Traffic IP reputation panel applied")
