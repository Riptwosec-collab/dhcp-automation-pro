import { mkdir, readFile, writeFile } from "node:fs/promises";

const REPO = "Riptwosec-collab/dhcp-automation-pro";
const GOLD_SHA = "50657038597309555fd64f7a41daebe9f04c8a1a";
const NETWORK_BASE = "https://raw.githubusercontent.com/Riptwosec-collab/dhcp-automation-pro/111f3a8a76778a3e132549c5d5dfc56b45e60718/assets/guide-b64";
const MARKER = "Theme Guide Static Assets V5";

function validateWebp(buffer, name) {
  const valid = buffer.length > 32
    && buffer.subarray(0, 4).toString("ascii") === "RIFF"
    && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (!valid) throw new Error(`${name} is not a valid WebP file`);
}

async function getText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "dhcp-automation-pro-build" }
  });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: ${response.status}`);
  return response.text();
}

async function loadAssets() {
  const [goldResponse, part1, part2] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO}/git/blobs/${GOLD_SHA}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "dhcp-automation-pro-build"
      }
    }),
    getText(`${NETWORK_BASE}/part01.txt`),
    getText(`${NETWORK_BASE}/part02.txt`)
  ]);

  if (!goldResponse.ok) {
    throw new Error(`Unable to fetch gold guide: ${goldResponse.status}`);
  }

  const goldPayload = await goldResponse.json();
  const gold = Buffer.from((goldPayload.content || "").replace(/\s/g, ""), "base64");
  const network = Buffer.from((part1 + part2).replace(/\s/g, ""), "base64");

  validateWebp(gold, "Gold guide");
  validateWebp(network, "Network guide");
  return { gold, network };
}

const styles = `
/* ${MARKER} */
.guide-modal-dialog{width:min(1680px,97vw)!important;max-height:96vh!important;overflow:auto!important;padding:10px!important}
.guide-modal-body{min-height:0!important;height:auto!important;display:block!important;overflow:auto!important;background:#020202!important}
.guide-theme-image{width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;background:#020202!important}
.guide-network-image,.guide-space-image{display:none!important}
body[data-theme="network"] .guide-network-image{display:block!important}
body[data-theme="space"] .guide-space-image{display:block!important}
@media(max-width:640px){.guide-modal{padding:6px!important}.guide-modal-dialog{width:100%!important;max-height:97vh!important;padding:6px!important}}
`;

const images = `<img class="guide-modal-image guide-theme-image guide-network-image" src="/assets/usage-guide-network.webp?v=5" alt="คู่มือการกรอกข้อมูล Mass Pool Import ธีม Network" loading="eager" decoding="async"><img class="guide-modal-image guide-theme-image guide-space-image" src="/assets/usage-guide-gold.webp?v=5" alt="คู่มือการกรอกข้อมูล Mass Pool Import ธีมดำทอง" loading="eager" decoding="async">`;

const { gold, network } = await loadAssets();

for (const directory of ["public", "dist"]) {
  await mkdir(`${directory}/assets`, { recursive: true });
  await writeFile(`${directory}/assets/usage-guide-gold.webp`, gold);
  await writeFile(`${directory}/assets/usage-guide-network.webp`, network);

  const file = `${directory}/index.html`;
  let html = await readFile(file, "utf8");

  if (!html.includes(MARKER)) {
    html = html.replace("</style>", `${styles}\n</style>`);
  }

  html = html.replace(/<img(?=[^>]*class="guide-modal-image")[^>]*>/, images);

  for (const token of [MARKER, "usage-guide-network.webp?v=5", "usage-guide-gold.webp?v=5", "guide-network-image", "guide-space-image"]) {
    if (!html.includes(token)) throw new Error(`Static guide injection failed in ${file}: ${token}`);
  }

  await writeFile(file, html, "utf8");
}

console.log("Static Network and Space guide images installed without JavaScript switching.");
