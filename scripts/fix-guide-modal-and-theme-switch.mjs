import { mkdir, readFile, writeFile } from "node:fs/promises";

const GUIDE_BLOB_SHA = "PLACEHOLDER_GUIDE_BLOB";
const GUIDE_API_URL = `https://api.github.com/repos/Riptwosec-collab/dhcp-automation-pro/git/blobs/${GUIDE_BLOB_SHA}`;

async function writeGuideAsset(directory) {
  const response = await fetch(GUIDE_API_URL, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "dhcp-automation-pro-build" }
  });
  if (!response.ok) throw new Error(`Unable to fetch guide asset: ${response.status}`);
  const payload = await response.json();
  if (!payload.content) throw new Error("Guide blob has no content");
  const binary = Buffer.from(payload.content.replace(/\s/g, ""), "base64");
  await mkdir(`${directory}/assets`, { recursive: true });
  await writeFile(`${directory}/assets/usage-guide-full.webp`, binary);
}

const styles = `
    /* Restore theme switch and use the full illustrated guide in the modal. */
    #heroPanel .theme-switcher{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      width:100%!important;
      visibility:visible!important;
      opacity:1!important;
      position:relative!important;
      z-index:12!important;
    }
    #heroPanel .theme-btn{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-height:42px!important;
      visibility:visible!important;
      opacity:1!important;
    }
    #heroPanel .guide-menu-btn{
      width:100%!important;
      margin-top:8px!important;
      position:relative!important;
      z-index:12!important;
    }
    #usageGuide{display:none!important}
    .guide-modal-dialog{width:min(1672px,97vw)!important;max-height:96vh!important;padding:10px!important}
    .guide-modal-image{width:100%!important;height:auto!important;object-fit:contain!important;max-height:none!important}
    @media(max-width:640px){
      .guide-modal-dialog{width:100%!important;max-height:97vh!important;padding:6px!important}
      .guide-modal-head{margin-bottom:7px!important}
    }
`;

const guideButton = `<button id="guideMenuBtn" type="button" class="guide-menu-btn" onclick="openUsageGuide()"><i class="fas fa-book-open"></i> คู่มือ</button>`;

for (const directory of ["public", "dist"]) {
  await writeGuideAsset(directory);
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");

  if (!html.includes("Restore theme switch and use the full illustrated guide")) {
    html = html.replace("  </style>", `${styles}  </style>`);
  }

  html = html.replace(/<button id="guideMenuBtn"[\s\S]*?<\/button>/, "");
  const switchMatch = html.match(/<div class="theme-switcher">[\s\S]*?<\/div>/);
  if (!switchMatch) throw new Error(`Theme switcher not found in ${path}`);
  if (!html.includes('id="guideMenuBtn"')) {
    html = html.replace(switchMatch[0], `${switchMatch[0]}${guideButton}`);
  }

  html = html.replaceAll('/assets/usage-guide.svg', '/assets/usage-guide-full.webp');

  const required = [
    'id="themeSpaceBtn"',
    'id="themeNetworkBtn"',
    'id="guideMenuBtn"',
    '/assets/usage-guide-full.webp',
    '#usageGuide{display:none!important}'
  ];
  const missing = required.filter((value) => !html.includes(value));
  if (missing.length) throw new Error(`Guide/theme fix failed in ${path}: ${missing.join(", ")}`);

  await writeFile(path, html, "utf8");
}

console.log("Full guide image installed and Space/Network theme switch restored.");
