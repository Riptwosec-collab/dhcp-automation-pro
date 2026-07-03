import { mkdir, readFile, writeFile } from "node:fs/promises";

const GUIDE_BLOB_SHA = "50657038597309555fd64f7a41daebe9f04c8a1a";
const GUIDE_API_URL = `https://api.github.com/repos/Riptwosec-collab/dhcp-automation-pro/git/blobs/${GUIDE_BLOB_SHA}`;

async function writeGuideAsset(directory) {
  const response = await fetch(GUIDE_API_URL, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "dhcp-automation-pro-build" }
  });
  if (!response.ok) throw new Error(`Unable to fetch gold guide asset: ${response.status}`);
  const payload = await response.json();
  if (!payload.content) throw new Error("Gold guide blob has no content");
  const binary = Buffer.from(payload.content.replace(/\s/g, ""), "base64");
  await mkdir(`${directory}/assets`, { recursive: true });
  await writeFile(`${directory}/assets/usage-guide-gold.webp`, binary);
}

const styles = `
    /* Full guide modal and restored Space / Network theme controls. */
    #heroPanel .theme-switcher{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;min-height:48px!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:20!important;overflow:visible!important}
    #heroPanel .theme-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;min-height:40px!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:relative!important;z-index:21!important}
    #heroPanel #guideMenuBtn{display:inline-flex!important;width:100%!important;margin-top:9px!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:20!important}
    #usageGuide{display:none!important}
    .guide-modal-dialog{width:min(1680px,97vw)!important;max-height:96vh!important;padding:10px!important}
    .guide-modal-image{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;image-rendering:auto!important;background:#020202!important}
    body[data-theme="network"] .guide-modal{background:rgba(0,4,12,.92)!important}
    body[data-theme="network"] .guide-modal-dialog{border-color:rgba(0,183,255,.58)!important;background:linear-gradient(145deg,rgba(2,14,34,.98),rgba(1,5,14,.99))!important;box-shadow:0 0 48px rgba(0,183,255,.20),0 32px 90px rgba(0,0,0,.72)!important}
    body[data-theme="network"] .guide-modal-head{border-color:rgba(0,183,255,.38)!important;background:linear-gradient(135deg,rgba(4,30,63,.96),rgba(1,8,22,.98))!important}
    body[data-theme="network"] .guide-modal-title,body[data-theme="network"] .guide-modal-title i{color:#53E7FF!important}
    body[data-theme="network"] .guide-modal-close{border-color:rgba(83,231,255,.58)!important;background:linear-gradient(135deg,#176BFF,#00B7FF)!important;color:#fff!important;box-shadow:0 0 18px rgba(0,183,255,.30)!important}
    body[data-theme="space"] .guide-modal{background:rgba(0,0,0,.92)!important}
    body[data-theme="space"] .guide-modal-dialog{border-color:rgba(239,185,67,.58)!important;background:linear-gradient(145deg,rgba(13,9,3,.98),rgba(2,2,2,.99))!important;box-shadow:0 0 48px rgba(239,185,67,.20),0 32px 90px rgba(0,0,0,.72)!important}
    body[data-theme="space"] .guide-modal-head{border-color:rgba(239,185,67,.38)!important;background:linear-gradient(135deg,rgba(37,25,7,.96),rgba(8,6,2,.98))!important}
    body[data-theme="space"] .guide-modal-title,body[data-theme="space"] .guide-modal-title i{color:#FFD873!important}
    body[data-theme="space"] .guide-modal-close{border-color:rgba(255,216,115,.58)!important;background:linear-gradient(135deg,#EFB943,#9b6714)!important;color:#080603!important;box-shadow:0 0 18px rgba(239,185,67,.30)!important}
    @media(max-width:640px){.guide-modal{padding:6px!important}.guide-modal-dialog{width:100%!important;max-height:97vh!important;padding:6px!important}.guide-modal-head{margin-bottom:7px!important}}
`;

const guideButton = `<button id="guideMenuBtn" type="button" class="guide-menu-btn" onclick="openUsageGuide()"><i class="fas fa-book-open"></i> คู่มือ</button>`;

for (const directory of ["public", "dist"]) {
  await writeGuideAsset(directory);
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");

  if (!html.includes("Full guide modal and restored Space / Network theme controls")) {
    html = html.replace("  </style>", `${styles}  </style>`);
  }

  html = html.replace(/<button id="guideMenuBtn"[\s\S]*?<\/button>/, "");
  const switchMatch = html.match(/<div class="theme-switcher">[\s\S]*?<\/div>/);
  if (!switchMatch) throw new Error(`Theme switcher not found in ${path}`);
  html = html.replace(switchMatch[0], `${switchMatch[0]}${guideButton}`);

  html = html.replace(
    /<img(?=[^>]*class="guide-modal-image")[^>]*>/,
    '<img id="usageGuideImage" class="guide-modal-image" src="/assets/usage-guide-network.webp?v=4" alt="คู่มือการกรอกข้อมูล Mass Pool Import ธีม Network" loading="eager" decoding="async">'
  );

  await writeFile(path, html, "utf8");
}

console.log("Guide controls and theme styling installed without a legacy image runtime.");
