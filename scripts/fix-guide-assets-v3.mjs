import { mkdir, readFile, writeFile } from "node:fs/promises";

const REPO = "Riptwosec-collab/dhcp-automation-pro";
const GOLD_SHA = "50657038597309555fd64f7a41daebe9f04c8a1a";
const NET_BASE = "https://raw.githubusercontent.com/Riptwosec-collab/dhcp-automation-pro/111f3a8a76778a3e132549c5d5dfc56b45e60718/assets/guide-b64";
const MARKER = "Theme Guide Runtime V3";

function validateWebp(buf, name) {
  if (buf.length < 32 || buf.subarray(0, 4).toString("ascii") !== "RIFF" || buf.subarray(8, 12).toString("ascii") !== "WEBP") {
    throw new Error(`${name} is not a valid WebP file`);
  }
}

async function getText(url) {
  const r = await fetch(url, { headers: { "User-Agent": "dhcp-automation-pro-build" } });
  if (!r.ok) throw new Error(`Fetch failed ${r.status}: ${url}`);
  return r.text();
}

async function getAssets() {
  const [goldRes, p1, p2] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO}/git/blobs/${GOLD_SHA}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "dhcp-automation-pro-build" }
    }),
    getText(`${NET_BASE}/part01.txt`),
    getText(`${NET_BASE}/part02.txt`)
  ]);
  if (!goldRes.ok) throw new Error(`Gold guide fetch failed: ${goldRes.status}`);
  const goldJson = await goldRes.json();
  const gold = Buffer.from((goldJson.content || "").replace(/\s/g, ""), "base64");
  const network = Buffer.from((p1 + p2).replace(/\s/g, ""), "base64");
  validateWebp(gold, "Gold guide");
  validateWebp(network, "Network guide");
  return { gold, network };
}

const css = `
/* ${MARKER} */
.guide-modal-dialog{width:min(1680px,97vw)!important;max-height:96vh!important;overflow:auto!important;padding:10px!important}
.guide-modal-body{min-height:0!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;background:#020202!important}
.guide-modal-image{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;background:#020202!important}
body[data-theme="network"] .guide-modal{background:rgba(0,4,12,.92)!important}
body[data-theme="network"] .guide-modal-dialog{border-color:rgba(0,183,255,.58)!important;background:linear-gradient(145deg,rgba(2,14,34,.98),rgba(1,5,14,.99))!important;box-shadow:0 0 48px rgba(0,183,255,.20),0 32px 90px rgba(0,0,0,.72)!important}
body[data-theme="network"] .guide-modal-head{border-color:rgba(0,183,255,.38)!important;background:linear-gradient(135deg,rgba(4,30,63,.96),rgba(1,8,22,.98))!important}
body[data-theme="network"] .guide-modal-title,body[data-theme="network"] .guide-modal-title i{color:#53E7FF!important}
body[data-theme="network"] .guide-modal-close{background:linear-gradient(135deg,#176BFF,#00B7FF)!important;color:#fff!important;border-color:rgba(83,231,255,.58)!important}
body[data-theme="space"] .guide-modal{background:rgba(0,0,0,.92)!important}
body[data-theme="space"] .guide-modal-dialog{border-color:rgba(239,185,67,.58)!important;background:linear-gradient(145deg,rgba(13,9,3,.98),rgba(2,2,2,.99))!important;box-shadow:0 0 48px rgba(239,185,67,.20),0 32px 90px rgba(0,0,0,.72)!important}
body[data-theme="space"] .guide-modal-head{border-color:rgba(239,185,67,.38)!important;background:linear-gradient(135deg,rgba(37,25,7,.96),rgba(8,6,2,.98))!important}
body[data-theme="space"] .guide-modal-title,body[data-theme="space"] .guide-modal-title i{color:#FFD873!important}
body[data-theme="space"] .guide-modal-close{background:linear-gradient(135deg,#EFB943,#9b6714)!important;color:#080603!important;border-color:rgba(255,216,115,.58)!important}
@media(max-width:640px){.guide-modal{padding:6px!important}.guide-modal-dialog{width:100%!important;max-height:97vh!important;padding:6px!important}}
`;

const js = `<script>(()=>{const M='${MARKER}';const sync=()=>{const i=document.querySelector('#usageGuideModal .guide-modal-image');if(!i)return;const s=document.body?.dataset?.theme==='space';const src=s?'/assets/usage-guide-gold.webp?v=3':'/assets/usage-guide-network.webp?v=3';if(i.getAttribute('src')!==src)i.setAttribute('src',src);i.id='usageGuideImage';i.alt=s?'คู่มือการกรอกข้อมูล Mass Pool Import ธีมดำทอง':'คู่มือการกรอกข้อมูล Mass Pool Import ธีม Network'};const start=()=>{sync();document.addEventListener('click',e=>{if(e.target.closest('#guideMenuBtn'))sync()},true);new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-theme']})};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start()})();<\/script>`;

const { gold, network } = await getAssets();
for (const dir of ["public", "dist"]) {
  await mkdir(`${dir}/assets`, { recursive: true });
  await writeFile(`${dir}/assets/usage-guide-gold.webp`, gold);
  await writeFile(`${dir}/assets/usage-guide-network.webp`, network);
  const file = `${dir}/index.html`;
  let html = await readFile(file, "utf8");
  if (!html.includes(MARKER)) html = html.replace("</style>", `${css}\n</style>`);
  html = html.replace(/<img(?=[^>]*class="guide-modal-image")[^>]*>/, '<img id="usageGuideImage" class="guide-modal-image" src="/assets/usage-guide-network.webp?v=3" alt="คู่มือการกรอกข้อมูล Mass Pool Import ธีม Network" loading="eager" decoding="async">');
  if (!html.includes(`const M='${MARKER}'`)) html = html.replace("</body>", `${js}\n</body>`);
  for (const token of [MARKER,"usage-guide-network.webp?v=3","usage-guide-gold.webp?v=3",'id="usageGuideImage"']) {
    if (!html.includes(token)) throw new Error(`Guide V3 injection failed in ${file}: ${token}`);
  }
  await writeFile(file, html, "utf8");
}
console.log("Valid Network and Space guide assets installed.");
