import { readFile, writeFile } from "node:fs/promises";

const targets = ["index.html", "public/index.html", "dist/index.html"];
const marker = "<!-- smart-mass-import-v1 -->";

const styles = `
<style id="smartMassImportStyles">
  .smart-import-launchers{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .smart-import-launch{
    position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:8px;
    min-height:38px;padding:9px 13px;border:1px solid rgba(250,190,62,.62);border-radius:11px;
    color:#fff5d6;background:linear-gradient(145deg,rgba(75,49,8,.72),rgba(10,13,20,.88));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 0 18px rgba(245,176,35,.08);
    font-size:.76rem;font-weight:850;cursor:pointer;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
  }
  .smart-import-launch:before{content:"";position:absolute;inset:-1px;background:linear-gradient(110deg,transparent,rgba(255,225,146,.18),transparent);transform:translateX(-120%);transition:transform .5s ease;pointer-events:none}
  .smart-import-launch:hover{transform:translateY(-2px);border-color:#ffd467;box-shadow:0 0 26px rgba(245,176,35,.16),inset 0 1px 0 rgba(255,255,255,.10)}
  .smart-import-launch:hover:before{transform:translateX(120%)}
  .smart-import-launch i{color:#ffd264}
  .smart-modal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:24px;overflow:auto}
  .smart-modal.is-open{display:flex}
  .smart-modal-backdrop{position:fixed;inset:0;background:radial-gradient(circle at 50% 30%,rgba(144,91,0,.18),transparent 34%),rgba(0,0,0,.78);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);animation:smartFade .25s ease both}
  .smart-modal-shell{position:relative;width:min(1180px,96vw);max-height:92vh;margin:auto;z-index:2;animation:smartPortalIn .58s cubic-bezier(.18,.86,.23,1.18) both;transform-style:preserve-3d}
  .smart-orbit{position:absolute;inset:-17px;border-radius:32px;pointer-events:none;overflow:hidden;filter:drop-shadow(0 0 24px rgba(255,193,58,.16))}
  .smart-orbit:before{content:"";position:absolute;left:50%;top:50%;width:150%;aspect-ratio:1;transform:translate(-50%,-50%);background:conic-gradient(from 0deg,transparent 0 38%,rgba(255,205,83,.8) 43%,transparent 50% 83%,rgba(145,94,4,.45) 90%,transparent 96%);animation:smartOrbit 9s linear infinite}
  .smart-modal-panel{position:relative;overflow:hidden;border:1px solid rgba(250,190,62,.46);border-radius:24px;background:linear-gradient(145deg,rgba(23,19,12,.98),rgba(4,10,20,.985) 58%,rgba(2,11,23,.99));box-shadow:0 36px 110px rgba(0,0,0,.62),0 0 55px rgba(243,176,36,.11),inset 0 1px 0 rgba(255,255,255,.07)}
  .smart-modal-panel:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(255,198,67,.72),transparent 28%,transparent 75%,rgba(255,198,67,.32)) top/100% 1px no-repeat,radial-gradient(circle at 10% 0%,rgba(255,183,40,.13),transparent 28%),linear-gradient(120deg,transparent 0 47%,rgba(255,255,255,.018) 50%,transparent 53%)}
  .smart-modal-head{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 22px;border-bottom:1px solid rgba(250,190,62,.18);background:rgba(7,10,15,.88);backdrop-filter:blur(20px)}
  .smart-title{display:flex;align-items:center;gap:13px}
  .smart-title-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:13px;border:1px solid rgba(255,198,67,.46);background:linear-gradient(145deg,rgba(96,60,2,.72),rgba(8,13,22,.9));color:#ffd363;box-shadow:0 0 20px rgba(255,194,51,.10)}
  .smart-title h3{margin:0;color:#fff9e8;font-size:1.14rem;font-weight:900}.smart-title p{margin:3px 0 0;color:#9aa5b5;font-size:.73rem}
  .smart-close{width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:#d6dbe4;cursor:pointer;transition:.2s}.smart-close:hover{border-color:rgba(255,198,67,.5);color:#ffd363;transform:rotate(8deg)}
  .smart-modal-body{padding:22px;overflow:auto;max-height:calc(92vh - 86px)}
  .smart-mode-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}
  .smart-mode-tab{padding:13px 14px;border-radius:12px;border:1px solid rgba(146,103,26,.35);background:rgba(1,8,18,.56);color:#9aa6b8;text-align:left;font-weight:800;cursor:pointer;transition:.2s}.smart-mode-tab strong{display:block;color:#e8edf5;font-size:.82rem}.smart-mode-tab span{display:block;margin-top:3px;font-size:.68rem;font-weight:550}.smart-mode-tab.active{border-color:rgba(255,199,71,.7);background:linear-gradient(145deg,rgba(94,58,3,.5),rgba(4,12,24,.72));box-shadow:0 0 20px rgba(255,190,44,.08)}.smart-mode-tab.active strong{color:#ffd66d}
  .smart-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:16px}.smart-card{position:relative;border:1px solid rgba(151,108,31,.34);border-radius:16px;background:rgba(1,8,17,.66);padding:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
  .smart-card-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px;color:#f3f6fb;font-size:.82rem;font-weight:850}.smart-card-title i{color:#ffc94e}
  .smart-inline-actions{display:flex;flex-wrap:wrap;gap:7px}.smart-mini-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border-radius:10px;border:1px solid rgba(250,190,62,.34);background:rgba(74,48,7,.34);color:#ffe3a0;font-size:.69rem;font-weight:800;cursor:pointer;transition:.2s}.smart-mini-btn:hover{border-color:#ffcf5a;transform:translateY(-1px)}
  .smart-field{display:flex;flex-direction:column;gap:6px}.smart-field label{color:#9ba7b9;font-size:.68rem;font-weight:750}.smart-field input,.smart-field textarea,.smart-field select{width:100%;border:1px solid rgba(102,119,144,.34)!important;border-radius:11px!important;background:rgba(0,8,19,.84)!important;color:#edf3fb!important;padding:10px 11px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important}.smart-field textarea{min-height:180px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;line-height:1.6}.smart-field input:focus,.smart-field textarea:focus,.smart-field select:focus{border-color:rgba(255,200,73,.85)!important;box-shadow:0 0 0 3px rgba(255,190,45,.10)!important;outline:none}
  .smart-default-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.smart-default-grid .wide{grid-column:1/-1}
  .smart-sequence-grid{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:10px}.smart-sequence-grid .wide{grid-column:1/-1}
  .smart-tip{margin-top:10px;padding:10px 11px;border-radius:10px;border:1px solid rgba(55,143,208,.24);background:rgba(2,46,79,.25);color:#a9c4db;font-size:.68rem;line-height:1.55}.smart-tip code{color:#ffe49d}
  .smart-preview{margin-top:16px;border:1px solid rgba(151,108,31,.34);border-radius:16px;overflow:hidden;background:rgba(0,7,16,.72)}
  .smart-preview-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border-bottom:1px solid rgba(151,108,31,.22)}
  .smart-summary{display:flex;flex-wrap:wrap;gap:8px}.smart-pill{padding:6px 9px;border-radius:999px;font-size:.66rem;font-weight:850;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#b9c4d4}.smart-pill.ok{border-color:rgba(46,213,149,.28);color:#54e7ad;background:rgba(6,88,60,.18)}.smart-pill.warn{border-color:rgba(255,184,42,.30);color:#ffd16b;background:rgba(105,61,0,.20)}.smart-pill.bad{border-color:rgba(255,87,87,.30);color:#ff9292;background:rgba(105,17,17,.22)}
  .smart-table-wrap{overflow:auto;max-height:330px}.smart-table{width:100%;border-collapse:collapse;min-width:940px}.smart-table th{position:sticky;top:0;z-index:2;background:#080d14;color:#aeb9c9;font-size:.64rem;text-align:left;padding:9px;border-bottom:1px solid rgba(255,255,255,.07)}.smart-table td{padding:7px 6px;border-bottom:1px solid rgba(255,255,255,.045);vertical-align:middle}.smart-table input{width:100%;min-width:110px;padding:8px 9px;border-radius:8px;border:1px solid rgba(94,110,132,.30);background:#020914;color:#e8eef8;font:600 .72rem ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.smart-table input.invalid{border-color:rgba(255,81,81,.75);box-shadow:0 0 0 2px rgba(255,70,70,.08)}.smart-row-status{white-space:nowrap;font-size:.64rem;font-weight:850}.smart-row-status.ok{color:#4ce5a5}.smart-row-status.bad{color:#ff8585}.smart-delete-row{width:30px;height:30px;border-radius:8px;border:1px solid rgba(255,83,83,.25);background:rgba(104,15,15,.18);color:#ff8585;cursor:pointer}
  .smart-footer{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-top:15px}.smart-status{min-height:20px;color:#9db0c6;font-size:.7rem}.smart-status.good{color:#52e4aa}.smart-status.error{color:#ff8f8f}.smart-primary{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1px solid #ffd368;border-radius:11px;background:linear-gradient(135deg,#ffd76b,#bc7d08);color:#171005;font-weight:950;cursor:pointer;box-shadow:0 8px 25px rgba(213,142,7,.18),inset 0 1px 0 rgba(255,255,255,.35);transition:.2s}.smart-primary:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(213,142,7,.24)}.smart-primary:disabled{filter:grayscale(.85);opacity:.42;cursor:not-allowed;transform:none;box-shadow:none}
  .smart-secondary{display:inline-flex;align-items:center;gap:8px;padding:10px 13px;border-radius:11px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:#c3ccda;font-size:.72rem;font-weight:800;cursor:pointer}.smart-secondary:hover{border-color:rgba(255,199,72,.38);color:#ffe09a}
  @keyframes smartOrbit{to{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes smartPortalIn{0%{opacity:0;transform:perspective(900px) scale(.72) rotateX(17deg) rotateZ(-2.2deg) translateY(42px)}62%{opacity:1;transform:perspective(900px) scale(1.015) rotateX(-1deg) rotateZ(.3deg) translateY(-3px)}100%{opacity:1;transform:perspective(900px) scale(1) rotateX(0) rotateZ(0) translateY(0)}}
  @keyframes smartFade{from{opacity:0}to{opacity:1}}
  @media(max-width:900px){.smart-grid{grid-template-columns:1fr}.smart-modal{padding:10px}.smart-modal-shell{width:98vw}.smart-modal-body{padding:14px}.smart-default-grid{grid-template-columns:1fr}.smart-sequence-grid{grid-template-columns:1fr}.smart-default-grid .wide,.smart-sequence-grid .wide{grid-column:auto}}
  @media(prefers-reduced-motion:reduce){.smart-orbit:before,.smart-modal-shell{animation:none!important}}
</style>`;

const modal = `
<div id="smartImportModal" class="smart-modal" aria-hidden="true">
  <div class="smart-modal-backdrop" onclick="smartCloseImport()"></div>
  <div class="smart-modal-shell" role="dialog" aria-modal="true" aria-labelledby="smartImportTitle">
    <div class="smart-orbit"></div>
    <section class="smart-modal-panel">
      <header class="smart-modal-head">
        <div class="smart-title">
          <div class="smart-title-icon"><i class="fas fa-bolt"></i></div>
          <div><h3 id="smartImportTitle">Smart Mass Import</h3><p>วางข้อมูลครั้งเดียว • Auto Format • Sequence • Preview • Duplicate Guard</p></div>
        </div>
        <button class="smart-close" type="button" onclick="smartCloseImport()" aria-label="Close"><i class="fas fa-xmark"></i></button>
      </header>
      <div class="smart-modal-body">
        <div class="smart-mode-tabs">
          <button id="smartTabPaste" class="smart-mode-tab active" type="button" onclick="smartSetImportMode('paste')"><strong><i class="fas fa-paste"></i> Smart Paste / Clipboard</strong><span>วาง MAC + IP หรือ MAC + IP + Gateway + VLAN ได้พร้อมกัน</span></button>
          <button id="smartTabSequence" class="smart-mode-tab" type="button" onclick="smartSetImportMode('sequence')"><strong><i class="fas fa-arrow-down-1-9"></i> Auto IP Sequence</strong><span>วาง MAC หลายตัว แล้วสร้าง IP ต่อเนื่องจาก IP เริ่มต้น</span></button>
        </div>

        <div class="smart-grid">
          <div class="smart-card">
            <div id="smartPasteMode">
              <div class="smart-card-title"><span><i class="fas fa-wand-magic-sparkles"></i> Paste Data</span><div class="smart-inline-actions"><button class="smart-mini-btn" type="button" onclick="smartReadClipboard()"><i class="fas fa-clipboard"></i> Paste from Clipboard</button><button class="smart-mini-btn" type="button" onclick="smartParsePaste()"><i class="fas fa-magnifying-glass"></i> Parse & Preview</button></div></div>
              <div class="smart-field"><textarea id="smartPasteInput" spellcheck="false" oninput="smartQueueParse()" placeholder="788c778e1aa9  10.58.11.86\n78:8c:77:8e:1a:b0  10.58.11.87\n788c.778e.1ab1  10.58.11.88  10.58.11.224  2"></textarea></div>
              <div class="smart-tip">รองรับ Copy จาก Excel / Google Sheets และตัวคั่นแบบ <code>Tab</code>, Space, Comma หรือ Semicolon — MAC จะถูกแปลงเป็น Cisco format <code>xxxx.xxxx.xxxx</code> อัตโนมัติ</div>
            </div>
            <div id="smartSequenceMode" style="display:none">
              <div class="smart-card-title"><span><i class="fas fa-list-ol"></i> Sequence Builder</span><button class="smart-mini-btn" type="button" onclick="smartBuildSequence()"><i class="fas fa-bolt"></i> Build Sequence</button></div>
              <div class="smart-sequence-grid">
                <div class="smart-field wide"><label>MAC List — 1 ตัวต่อบรรทัด</label><textarea id="smartSequenceMacs" spellcheck="false" placeholder="788c778e1aa9\n78:8c:77:8e:1a:b0\n788c.778e.1ab1"></textarea></div>
                <div class="smart-field"><label>Start IP</label><input id="smartStartIp" value="10.58.11.86" inputmode="decimal"></div>
                <div class="smart-field"><label>Count</label><input id="smartSequenceCount" type="number" min="1" max="500" value="10"></div>
              </div>
              <div class="smart-tip">ตัวอย่าง Start IP <code>10.58.11.86</code> + Count <code>10</code> จะสร้าง <code>.86 → .95</code> โดยรองรับการทดข้าม octet อัตโนมัติ</div>
            </div>
          </div>

          <aside class="smart-card">
            <div class="smart-card-title"><span><i class="fas fa-sliders"></i> Defaults</span><span style="color:#7f8da1;font-size:.63rem">ใช้กับทุกแถวที่ไม่ได้ระบุค่า</span></div>
            <div class="smart-default-grid">
              <div class="smart-field wide"><label>Device Name</label><select id="smartDeviceName"><option value="CCTV">CCTV</option><option value="Computer">Computer</option><option value="Inspector">Inspector</option><option value="Printer">Printer</option><option value="Telepresence">Telepresence</option><option value="Data_Lake">Data_Lake</option><option value="IP_Phone">IP_Phone</option></select></div>
              <div class="smart-field wide"><label>Gateway</label><input id="smartGateway" value="10.36.2.1" inputmode="decimal"></div>
              <div class="smart-field"><label>VLAN</label><input id="smartVlan" value="2" inputmode="numeric"></div>
              <div class="smart-field"><label>Subnet</label><input id="smartSubnet" value="255.255.255.0" inputmode="decimal"></div>
              <div class="smart-field wide"><label>Interface</label><input id="smartInterface" value="PO1"></div>
            </div>
            <div class="smart-tip"><strong style="color:#ffd46a">Duplicate Guard:</strong> ตรวจ MAC/IP ซ้ำทั้งใน Preview และ Pool ที่มีอยู่แล้วก่อน Generate</div>
          </aside>
        </div>

        <section class="smart-preview">
          <div class="smart-preview-head"><div class="smart-card-title" style="margin:0"><span><i class="fas fa-table"></i> Preview Table</span></div><div id="smartSummary" class="smart-summary"><span class="smart-pill">0 rows</span></div></div>
          <div class="smart-table-wrap"><table class="smart-table"><thead><tr><th>#</th><th>MAC</th><th>IP</th><th>Gateway</th><th>VLAN</th><th>Subnet</th><th>Interface</th><th>Status</th><th></th></tr></thead><tbody id="smartPreviewBody"><tr><td colspan="9" style="padding:28px;text-align:center;color:#728095">วางข้อมูลหรือสร้าง IP Sequence เพื่อ Preview</td></tr></tbody></table></div>
        </section>

        <div class="smart-footer">
          <div id="smartImportStatus" class="smart-status">พร้อมรับข้อมูล</div>
          <div style="display:flex;flex-wrap:wrap;gap:9px"><button class="smart-secondary" type="button" onclick="smartClearPreview()"><i class="fas fa-rotate-left"></i> Clear Preview</button><button id="smartGenerateButton" class="smart-primary" type="button" onclick="smartGeneratePools()" disabled><i class="fas fa-bolt"></i> Generate & Add Pools</button></div>
        </div>
      </div>
    </section>
  </div>
</div>`;

const script = `
<script id="smartMassImportScript">
(function(){
  var smartRows=[];
  var smartMode='paste';
  var smartParseTimer=null;

  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function normalizeMac(v){try{return formatMac(v)}catch(e){var c=String(v||'').replace(/[^a-fA-F0-9]/g,'').toLowerCase().replace(/^01/,'').slice(0,12);return c?(c.match(/.{1,4}/g)||[]).join('.'):''}}
  function validMac(v){try{return isValidMac(v)}catch(e){return String(v||'').replace(/[^a-fA-F0-9]/g,'').replace(/^01/i,'').length===12}}
  function validIp(v){try{return isValidIP(v)}catch(e){return /^(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)){3}$/.test(String(v||'').trim())}}
  function validVlan(v){try{return isValidVlan(v)}catch(e){var s=String(v||'').trim();return /^\\d+$/.test(s)&&Number(s)>=1&&Number(s)<=4094}}
  function cleanMac12(v){return String(v||'').replace(/[^a-fA-F0-9]/g,'').toLowerCase().replace(/^01/,'').slice(0,12)}
  function defaults(){
    var device=byId('smartDeviceName')?byId('smartDeviceName').value:'Computer';
    var gw=byId('smartGateway')?byId('smartGateway').value.trim():'10.36.2.1';
    var vlan=byId('smartVlan')?byId('smartVlan').value.trim():'2';
    var subnet=byId('smartSubnet')?byId('smartSubnet').value.trim():'255.255.255.0';
    var intf=byId('smartInterface')?byId('smartInterface').value.trim():'PO1';
    return {name:device,gateway:gw,vlan:vlan,subnet:subnet,interfaceName:intf};
  }
  function existingDefaults(){
    var last=(typeof pools!=='undefined'&&pools.length)?pools[pools.length-1]:null;
    var originalDevice=byId('bulkDeviceName')?byId('bulkDeviceName').value:'Computer';
    var originalGw=byId('bulkGateway')&&byId('bulkGateway').value.trim()?byId('bulkGateway').value.trim().split(/\\n/)[0].trim():'';
    var originalVlan=byId('bulkVlan')&&byId('bulkVlan').value.trim()?byId('bulkVlan').value.trim().split(/\\n/)[0].trim():'';
    return {name:originalDevice,gateway:originalGw||(last&&last.gateway)||'10.36.2.1',vlan:originalVlan||(last&&last.vlan)||'2',subnet:(last&&last.subnet)||'255.255.255.0',interfaceName:(last&&last.interfaceName)||'PO1'};
  }
  window.smartOpenImport=function(mode){
    var d=existingDefaults();
    byId('smartDeviceName').value=d.name;byId('smartGateway').value=d.gateway;byId('smartVlan').value=d.vlan;byId('smartSubnet').value=d.subnet;byId('smartInterface').value=d.interfaceName;
    smartSetImportMode(mode||'paste');
    var m=byId('smartImportModal');m.classList.add('is-open');m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
    setTimeout(function(){var f=smartMode==='sequence'?byId('smartSequenceMacs'):byId('smartPasteInput');if(f)f.focus()},380);
  };
  window.smartCloseImport=function(){var m=byId('smartImportModal');m.classList.remove('is-open');m.setAttribute('aria-hidden','true');document.body.style.overflow=''};
  window.smartSetImportMode=function(mode){smartMode=mode==='sequence'?'sequence':'paste';byId('smartPasteMode').style.display=smartMode==='paste'?'block':'none';byId('smartSequenceMode').style.display=smartMode==='sequence'?'block':'none';byId('smartTabPaste').classList.toggle('active',smartMode==='paste');byId('smartTabSequence').classList.toggle('active',smartMode==='sequence')};
  window.smartReadClipboard=async function(){
    var status=byId('smartImportStatus');
    try{if(!navigator.clipboard||!navigator.clipboard.readText)throw new Error('Clipboard API not available');var text=await navigator.clipboard.readText();byId('smartPasteInput').value=text;smartSetImportMode('paste');smartParsePaste();status.textContent='อ่าน Clipboard สำเร็จ และสร้าง Preview แล้ว';status.className='smart-status good'}
    catch(e){status.textContent='Browser ไม่อนุญาตอ่าน Clipboard อัตโนมัติ — กด Ctrl+V ในช่อง Paste ได้ทันที';status.className='smart-status error';byId('smartPasteInput').focus()}
  };
  window.smartQueueParse=function(){clearTimeout(smartParseTimer);smartParseTimer=setTimeout(function(){smartParsePaste()},260)};
  function makeRow(mac,ip,gw,vlan){var d=defaults();return {name:d.name,mac:normalizeMac(mac),ip:String(ip||'').trim(),gateway:String(gw||d.gateway).trim(),vlan:String(vlan||d.vlan).trim(),subnet:d.subnet,interfaceName:d.interfaceName}}
  window.smartParsePaste=function(){
    var raw=byId('smartPasteInput').value||'';var lines=raw.split(/\\r?\\n/).map(function(x){return x.trim()}).filter(Boolean);var rows=[];
    lines.forEach(function(line){
      if(/mac/i.test(line)&&/ip/i.test(line))return;
      var cols=line.split(/\\t+|\\s*,\\s*|\\s*;\\s*|\\s+/).map(function(x){return x.trim()}).filter(Boolean);
      if(cols.length<2)return;
      rows.push(makeRow(cols[0],cols[1],cols[2],cols[3]));
    });
    smartRows=rows;smartRenderPreview();var s=byId('smartImportStatus');s.textContent=rows.length?'Parse สำเร็จ '+rows.length+' รายการ — ตรวจ Preview ก่อน Generate':'ยังไม่พบข้อมูลรูปแบบ MAC + IP';s.className=rows.length?'smart-status good':'smart-status error';
  };
  function ipToInt(ip){if(!validIp(ip))return null;return ip.split('.').reduce(function(acc,n){return ((acc<<8)>>>0)+Number(n)},0)>>>0}
  function intToIp(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.')}
  window.smartBuildSequence=function(){
    var macs=(byId('smartSequenceMacs').value||'').split(/\\r?\\n|,|;/).map(function(x){return x.trim()}).filter(Boolean);var start=byId('smartStartIp').value.trim();var count=Math.max(1,Math.min(500,Number(byId('smartSequenceCount').value)||macs.length||1));var base=ipToInt(start);
    if(base===null){byId('smartImportStatus').textContent='Start IP ไม่ถูกต้อง';byId('smartImportStatus').className='smart-status error';return}
    smartRows=[];for(var i=0;i<count;i++){smartRows.push(makeRow(macs[i]||'',intToIp((base+i)>>>0)))}smartRenderPreview();byId('smartImportStatus').textContent='สร้าง IP Sequence '+count+' รายการแล้ว'+(macs.length<count?' — กรุณาเติม MAC ที่ยังว่าง':'');byId('smartImportStatus').className=macs.length<count?'smart-status':'smart-status good';
  };
  function duplicateState(){
    var macCount={};var ipCount={};var existingMac={};var existingIp={};
    smartRows.forEach(function(r){var m=cleanMac12(r.mac);var ip=String(r.ip||'').trim();if(m)macCount[m]=(macCount[m]||0)+1;if(ip)ipCount[ip]=(ipCount[ip]||0)+1});
    if(typeof pools!=='undefined')pools.forEach(function(p){var m=cleanMac12(p.mac);var ip=String(p.ip||'').trim();if(m)existingMac[m]=true;if(ip)existingIp[ip]=true});
    return smartRows.map(function(r){var m=cleanMac12(r.mac);var ip=String(r.ip||'').trim();var dupMac=!!(m&&(macCount[m]>1||existingMac[m]));var dupIp=!!(ip&&(ipCount[ip]>1||existingIp[ip]));return {dupMac:dupMac,dupIp:dupIp}});
  }
  function rowState(r,dup){var bad=[];if(!validMac(r.mac))bad.push('MAC');if(!validIp(r.ip))bad.push('IP');if(!validIp(r.gateway))bad.push('Gateway');if(!validVlan(r.vlan))bad.push('VLAN');if(dup.dupMac)bad.push('MAC ซ้ำ');if(dup.dupIp)bad.push('IP ซ้ำ');return bad}
  window.smartUpdateCell=function(index,field,value,input){if(!smartRows[index])return;smartRows[index][field]=value;if(field==='mac'&&input&&input.dataset.blurFormat==='1'){smartRows[index].mac=normalizeMac(value);input.value=smartRows[index].mac}smartRefreshStatusOnly()};
  window.smartFormatCell=function(index,field,input){if(!smartRows[index])return;if(field==='mac'){smartRows[index].mac=normalizeMac(input.value);input.value=smartRows[index].mac}smartRenderPreview()};
  window.smartDeleteRow=function(index){smartRows.splice(index,1);smartRenderPreview()};
  window.smartClearPreview=function(){smartRows=[];smartRenderPreview();byId('smartImportStatus').textContent='ล้าง Preview แล้ว — ข้อมูลในหน้ากรอกเดิมยังอยู่';byId('smartImportStatus').className='smart-status'};
  function smartRefreshStatusOnly(){
    var dup=duplicateState();var invalid=0;var duplicate=0;smartRows.forEach(function(r,i){var bad=rowState(r,dup[i]);if(bad.length)invalid++;if(dup[i].dupMac||dup[i].dupIp)duplicate++});
    var sum=byId('smartSummary');sum.innerHTML='<span class="smart-pill">'+smartRows.length+' rows</span><span class="smart-pill '+(invalid?'bad':'ok')+'">'+(invalid?invalid+' ต้องแก้':'Valid ทั้งหมด')+'</span><span class="smart-pill '+(duplicate?'warn':'ok')+'">'+(duplicate?duplicate+' ซ้ำ':'ไม่พบข้อมูลซ้ำ')+'</span>';byId('smartGenerateButton').disabled=!smartRows.length||invalid>0;
  }
  window.smartRenderPreview=function(){
    var body=byId('smartPreviewBody');if(!smartRows.length){body.innerHTML='<tr><td colspan="9" style="padding:28px;text-align:center;color:#728095">วางข้อมูลหรือสร้าง IP Sequence เพื่อ Preview</td></tr>';smartRefreshStatusOnly();return}
    var dup=duplicateState();var html='';smartRows.forEach(function(r,i){var bad=rowState(r,dup[i]);var macBad=bad.indexOf('MAC')>=0||bad.indexOf('MAC ซ้ำ')>=0;var ipBad=bad.indexOf('IP')>=0||bad.indexOf('IP ซ้ำ')>=0;var gwBad=bad.indexOf('Gateway')>=0;var vlanBad=bad.indexOf('VLAN')>=0;html+='<tr><td style="color:#7f8da0;font-size:.68rem">'+(i+1)+'</td><td><input class="'+(macBad?'invalid':'')+'" value="'+esc(r.mac)+'" oninput="smartUpdateCell('+i+',\'mac\',this.value,this)" onblur="smartFormatCell('+i+',\'mac\',this)"></td><td><input class="'+(ipBad?'invalid':'')+'" value="'+esc(r.ip)+'" oninput="smartUpdateCell('+i+',\'ip\',this.value,this)" onblur="smartRenderPreview()"></td><td><input class="'+(gwBad?'invalid':'')+'" value="'+esc(r.gateway)+'" oninput="smartUpdateCell('+i+',\'gateway\',this.value,this)" onblur="smartRenderPreview()"></td><td><input class="'+(vlanBad?'invalid':'')+'" value="'+esc(r.vlan)+'" oninput="smartUpdateCell('+i+',\'vlan\',this.value,this)" onblur="smartRenderPreview()"></td><td><input value="'+esc(r.subnet)+'" oninput="smartUpdateCell('+i+',\'subnet\',this.value,this)"></td><td><input value="'+esc(r.interfaceName)+'" oninput="smartUpdateCell('+i+',\'interfaceName\',this.value,this)"></td><td><span class="smart-row-status '+(bad.length?'bad':'ok')+'">'+(bad.length?esc(bad.join(', ')):'พร้อม')+'</span></td><td><button class="smart-delete-row" type="button" onclick="smartDeleteRow('+i+')"><i class="fas fa-trash"></i></button></td></tr>'});body.innerHTML=html;smartRefreshStatusOnly();
  };
  window.smartGeneratePools=function(){
    var dup=duplicateState();var invalid=smartRows.some(function(r,i){return rowState(r,dup[i]).length>0});if(!smartRows.length||invalid){byId('smartImportStatus').textContent='ยัง Generate ไม่ได้ — กรุณาแก้แถวสีแดงหรือข้อมูลซ้ำก่อน';byId('smartImportStatus').className='smart-status error';return}
    var now=Date.now();var d=defaults();var newRows=smartRows.map(function(r,i){return {id:now+i,name:d.name,mac:normalizeMac(r.mac),ip:String(r.ip).trim(),subnet:String(r.subnet||d.subnet).trim(),gateway:String(r.gateway||d.gateway).trim(),vlan:String(r.vlan||d.vlan).trim(),interfaceName:String(r.interfaceName||d.interfaceName).trim()}});
    pools=pools.concat(newRows);renderPools();updateConfig();if(typeof showMessage==='function')showMessage('Smart Import เพิ่ม '+newRows.length+' Pools สำเร็จ ✅');smartCloseImport();setTimeout(function(){var target=document.getElementById('poolsContainer');if(target)target.scrollIntoView({behavior:'smooth',block:'start'})},150);
  };
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&byId('smartImportModal')&&byId('smartImportModal').classList.contains('is-open'))smartCloseImport()});
})();
</script>`;

function patch(source, filePath) {
  if (source.includes(marker)) return { content: source, changed: false };
  if (!source.includes("Mass Pool Import")) throw new Error(`[smart-mass-import] Mass Pool Import heading not found in ${filePath}`);
  if (!source.includes("</head>") || !source.includes("</body>")) throw new Error(`[smart-mass-import] Invalid HTML target ${filePath}`);

  const deviceBlock = /(<div class="flex items-center gap-3"><span class="font-bold text-gray-300">Device Name:<\/span>)/;
  if (!deviceBlock.test(source)) throw new Error(`[smart-mass-import] Device Name block not found in ${filePath}`);

  let output = source.replace("</head>", `${styles}\n</head>`);
  output = output.replace(deviceBlock, `<div class="smart-import-launchers"><button type="button" class="smart-import-launch" onclick="smartOpenImport('paste')"><i class="fas fa-bolt"></i> Smart Paste</button><button type="button" class="smart-import-launch" onclick="smartOpenImport('sequence')"><i class="fas fa-arrow-down-1-9"></i> IP Sequence</button></div>$1`);
  output = output.replace("</body>", `${modal}\n${script}\n${marker}\n</body>`);
  return { content: output, changed: true };
}

let count = 0;
for (const filePath of targets) {
  let source;
  try { source = await readFile(filePath, "utf8"); }
  catch (error) { if (error?.code === "ENOENT") continue; throw error; }
  const result = patch(source, filePath);
  if (result.changed) {
    await writeFile(filePath, result.content, "utf8");
    count += 1;
    console.log(`[smart-mass-import] Patched ${filePath}`);
  }
}
if (!count) console.log("[smart-mass-import] No new changes required");
