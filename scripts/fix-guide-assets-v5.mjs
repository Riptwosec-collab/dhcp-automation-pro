import { mkdir, readFile, writeFile } from "node:fs/promises";

const NETWORK_BASE = "https://raw.githubusercontent.com/Riptwosec-collab/dhcp-automation-pro/111f3a8a76778a3e132549c5d5dfc56b45e60718/assets/guide-b64";
const MARKER = "Theme Guide Static Assets V6";

function validateWebp(buffer, name) {
  const valid = buffer.length > 32
    && buffer.subarray(0, 4).toString("ascii") === "RIFF"
    && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (!valid) throw new Error(`${name} is not a valid WebP file`);
}

function validatePng(buffer, name) {
  const valid = buffer.length > 32
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!valid) throw new Error(`${name} is not a valid PNG file`);
}

async function getText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "dhcp-automation-pro-build" }
  });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: ${response.status}`);
  return response.text();
}

async function loadAssets() {
  const [gold, part1, part2] = await Promise.all([
    readFile("assets/usage-guide-gold.png"),
    getText(`${NETWORK_BASE}/part01.txt`),
    getText(`${NETWORK_BASE}/part02.txt`)
  ]);

  const network = Buffer.from((part1 + part2).replace(/\s/g, ""), "base64");

  validatePng(gold, "Gold guide");
  validateWebp(network, "Network guide");
  return { gold, network };
}

const styles = `
/* ${MARKER} */
.guide-modal-dialog{width:min(1820px,98vw)!important;max-height:96vh!important;overflow:auto!important;padding:12px!important}
.guide-modal-body{min-height:0!important;height:auto!important;display:block!important;overflow:auto!important;background:#020202!important}
.guide-theme-image{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;background:#020202!important}
.guide-network-image,.guide-space-image{display:none!important}
body[data-theme="network"] .guide-network-image{display:block!important}
body[data-theme="space"] .guide-space-image{display:block!important}
@media(max-width:640px){.guide-modal{padding:6px!important}.guide-modal-dialog{width:100%!important;max-height:97vh!important;padding:6px!important}}
`;

const images = `<img class="guide-modal-image guide-theme-image guide-network-image" src="/assets/usage-guide-network.webp?v=5" alt="Mass Pool Import guide for Network theme" loading="eager" decoding="async"><img class="guide-modal-image guide-theme-image guide-space-image" src="/assets/usage-guide-gold.png?v=6" alt="Mass Pool Import guide for Space theme" loading="eager" decoding="async">`;

const { gold, network } = await loadAssets();

for (const directory of ["public", "dist"]) {
  await mkdir(`${directory}/assets`, { recursive: true });
  await writeFile(`${directory}/assets/usage-guide-gold.png`, gold);
  await writeFile(`${directory}/assets/usage-guide-network.webp`, network);

  const file = `${directory}/index.html`;
  let html = await readFile(file, "utf8");

  if (!html.includes(MARKER)) {
    html = html.replace("</style>", `${styles}\n</style>`);
  }

  html = html.replace(/<img(?=[^>]*class="guide-modal-image")[^>]*>/, images);

  for (const token of [MARKER, "usage-guide-network.webp?v=5", "usage-guide-gold.png?v=6", "guide-network-image", "guide-space-image"]) {
    if (!html.includes(token)) throw new Error(`Static guide injection failed in ${file}: ${token}`);
  }

  await writeFile(file, html, "utf8");
}

console.log("Static Network and Space guide images installed without JavaScript switching.");
