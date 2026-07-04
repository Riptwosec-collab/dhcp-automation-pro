import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const MARKER = "Subnet Calculator SPA V1";
const sourceScript = join("scripts", "subnet-calculator.js");
const guideAssets = [
  ["assets/subnet-guide-network.png", "assets/subnet-guide-network.png"],
  ["assets/subnet-guide-space.png", "assets/subnet-guide-space.png"],
];

const css = `
/* ${MARKER} */
.hidden{display:none!important}
.app-page-nav{position:sticky;top:16px;z-index:80;display:flex;gap:12px;width:min(1690px,calc(100vw - 48px));max-width:1690px;margin:0 auto 24px;padding:10px;border:1px solid rgba(var(--theme-rgb),.34);border-radius:999px;background:linear-gradient(145deg,rgba(4,8,16,.72),rgba(0,0,0,.38));box-shadow:0 18px 42px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(18px);overflow:auto}
.app-page-nav-link{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 22px;border:1px solid transparent;border-radius:999px;color:var(--theme-text,#fff);font-weight:900;text-decoration:none;white-space:nowrap;transition:.2s ease}
.app-page-nav-link:hover,.app-page-nav-link.active{border-color:rgba(var(--theme-rgb),.62);background:linear-gradient(135deg,rgba(var(--theme-rgb),.28),rgba(var(--theme2-rgb),.12));box-shadow:0 0 24px rgba(var(--theme-rgb),.20),inset 0 1px 0 rgba(255,255,255,.12)}
#subnetPage{width:min(1560px,calc(100vw - 48px));max-width:1560px;margin:0 auto 40px}
.subnet-wrap{display:grid;gap:22px;color:var(--theme-text,#fff)}
.subnet-card,.subnet-hero{border:1px solid rgba(var(--theme-rgb),.42)!important;border-radius:18px!important;background:linear-gradient(145deg,rgba(9,12,18,.86),rgba(0,0,0,.80))!important;box-shadow:0 24px 70px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.08),0 0 28px rgba(var(--theme-rgb),.11)!important;backdrop-filter:blur(18px)}
.subnet-hero{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:24px;align-items:center;padding:22px 28px!important;overflow:hidden;position:relative;min-height:166px}
.subnet-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 82% 20%,rgba(var(--theme-rgb),.22),transparent 28%),linear-gradient(90deg,rgba(var(--theme-rgb),.08),transparent 45%);pointer-events:none}
.subnet-hero>*{position:relative;z-index:1}
.subnet-kicker{display:flex;align-items:center;gap:10px;margin:0 0 10px;color:rgb(var(--theme2-rgb));font-weight:900;text-transform:uppercase;letter-spacing:.08em}
.subnet-hero h1{margin:0;font-size:clamp(2rem,2.9vw,3.4rem);line-height:1;font-weight:950;color:#fff;text-shadow:0 0 28px rgba(var(--theme-rgb),.28)}
.subnet-hero p{max-width:74ch;margin:14px 0 0;color:var(--theme-muted,#cbd5e1);font-size:1.02rem;line-height:1.7}
.subnet-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.subnet-badges span,.subnet-tabs button,.subnet-presets button{border:1px solid rgba(var(--theme-rgb),.36);border-radius:999px;background:rgba(var(--theme-rgb),.10);color:var(--theme-text,#fff);font-weight:800}
.subnet-badges span{padding:8px 12px}
.subnet-guide-menu{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}
.subnet-guide-menu button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:44px;padding:0 16px;border:1px solid rgba(var(--theme-rgb),.46);border-radius:999px;background:linear-gradient(145deg,rgba(var(--theme-rgb),.20),rgba(0,0,0,.28));color:var(--theme-text,#fff);font-weight:900;cursor:pointer;box-shadow:0 0 18px rgba(var(--theme-rgb),.10)}
.subnet-hero-icon{width:100px;height:100px;margin-left:auto;display:grid;place-items:center;border-radius:24px;border:1px solid rgba(var(--theme-rgb),.45);background:radial-gradient(circle,rgba(var(--theme-rgb),.26),rgba(0,0,0,.20));font-size:3rem;color:rgb(var(--theme2-rgb));filter:drop-shadow(0 0 26px rgba(var(--theme-rgb),.32))}
.subnet-tabs{display:flex;gap:12px;overflow:auto;padding:10px;border:1px solid rgba(var(--theme-rgb),.28);border-radius:18px;background:linear-gradient(145deg,rgba(4,8,16,.50),rgba(0,0,0,.30));backdrop-filter:blur(16px)}
.subnet-tabs button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:48px;min-width:190px;padding:0 18px;cursor:pointer}
.subnet-tabs button.active{background:linear-gradient(135deg,rgba(var(--theme-rgb),.38),rgba(var(--theme2-rgb),.18));box-shadow:0 0 22px rgba(var(--theme-rgb),.18)}
.subnet-layout{display:grid;grid-template-columns:minmax(420px,500px) minmax(0,1fr);gap:24px;align-items:start}
.subnet-lower{display:grid;grid-template-columns:minmax(380px,520px) minmax(0,1fr);gap:24px;align-items:start}
.subnet-card{padding:24px!important;min-width:0}
.subnet-inputs{align-self:start}
.subnet-card h2{display:flex;align-items:center;gap:10px;margin:0 0 18px;color:rgb(var(--theme2-rgb));font-size:1.25rem;font-weight:950}
.subnet-card label{display:grid;gap:9px;margin-bottom:16px;color:var(--theme-text,#fff);font-weight:850}
.subnet-card input,.subnet-card select{width:100%;min-height:48px;border:1px solid rgba(var(--theme-rgb),.38);border-radius:12px;background:rgba(0,6,14,.58);color:#fff;padding:0 14px;outline:none}
.subnet-card input:focus,.subnet-card select:focus{border-color:rgba(var(--theme2-rgb),.82);box-shadow:0 0 0 3px rgba(var(--theme-rgb),.16)}
.subnet-card input.is-invalid{border-color:#fb7185!important}
.subnet-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.subnet-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px}
.subnet-actions button,.subnet-result-item button,#splitTable button,#cidrRefTable button,#subnetHistory button{border:1px solid rgba(var(--theme-rgb),.44);border-radius:12px;background:linear-gradient(145deg,rgba(var(--theme-rgb),.18),rgba(0,0,0,.35));color:var(--theme-text,#fff);font-weight:900;cursor:pointer}
.subnet-actions button{min-height:44px;padding:0 15px}
.subnet-error{min-height:22px;margin:12px 0 0;color:#fb7185;font-weight:800}
.subnet-presets{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.subnet-presets button{min-height:38px;padding:0 12px}
.subnet-mini-result{border:1px solid rgba(var(--theme-rgb),.24);border-radius:14px;background:rgba(0,0,0,.22);padding:14px;line-height:1.7;color:var(--theme-muted,#cbd5e1)}
.subnet-results-head{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.subnet-results-head h2{margin:0}
.subnet-results-head span{border:1px solid rgba(var(--theme-rgb),.42);border-radius:999px;padding:8px 12px;color:rgb(var(--theme2-rgb));font-weight:900}
.subnet-result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.subnet-result-item{position:relative;display:grid;gap:6px;min-height:78px;padding:14px 44px 14px 14px;border:1px solid rgba(var(--theme-rgb),.24);border-radius:14px;background:rgba(0,8,18,.42)}
.subnet-result-item span{color:var(--theme-muted,#cbd5e1);font-size:.82rem;font-weight:800}
.subnet-result-item strong{color:#fff;font-size:.98rem;overflow-wrap:anywhere}
.subnet-result-item button{position:absolute;right:9px;top:9px;width:30px;height:30px}
.subnet-viz{display:grid;grid-template-columns:.7fr 1.6fr .7fr;gap:12px;margin-top:18px}
.subnet-viz div{border:1px solid rgba(var(--theme-rgb),.30);border-radius:14px;padding:14px;background:linear-gradient(145deg,rgba(var(--theme-rgb),.12),rgba(0,0,0,.28))}
.subnet-viz span{display:block;color:var(--theme-muted,#cbd5e1);font-size:.8rem;font-weight:800}
.subnet-viz strong{display:block;margin-top:8px;color:#fff;overflow-wrap:anywhere}
.subnet-search{margin-bottom:14px}
.subnet-table-wrap{max-width:100%;overflow:auto;border:1px solid rgba(var(--theme-rgb),.20);border-radius:14px}
.subnet-cidr-card .subnet-table-wrap{max-height:560px}
.subnet-table-wrap table{width:100%;border-collapse:collapse;min-width:680px}
.subnet-cidr-card .subnet-table-wrap table{min-width:0}
.subnet-table-wrap th,.subnet-table-wrap td{padding:12px 13px;border-bottom:1px solid rgba(var(--theme-rgb),.16);text-align:left;white-space:nowrap}
.subnet-table-wrap th{color:rgb(var(--theme2-rgb));font-size:.82rem;text-transform:uppercase}
.subnet-table-wrap td{color:#fff}
.subnet-cisco-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.subnet-code-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:8px}
.subnet-code-grid pre{min-height:180px;white-space:pre-wrap;overflow:auto;border:1px solid rgba(var(--theme-rgb),.22);border-radius:14px;background:rgba(0,0,0,.45);padding:16px;color:#d7fbd0}
.subnet-explain-card{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:22px;align-items:center}
.subnet-explain-card p{margin:0;color:var(--theme-muted,#cbd5e1);line-height:1.75}
.subnet-explain-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.subnet-explain-grid article{display:grid;gap:8px;min-height:128px;padding:16px;border:1px solid rgba(var(--theme-rgb),.24);border-radius:14px;background:rgba(0,8,18,.30)}
.subnet-explain-grid i{font-size:1.5rem;color:rgb(var(--theme2-rgb))}
.subnet-explain-grid strong{color:#fff}
.subnet-explain-grid span{color:var(--theme-muted,#cbd5e1);line-height:1.45}
.subnet-guide-modal{position:fixed;inset:0;z-index:9998;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.74);backdrop-filter:blur(8px)}
.subnet-guide-modal.is-open{display:flex}
.subnet-guide-dialog{width:min(1320px,96vw);max-height:94vh;overflow:hidden;border:1px solid rgba(var(--theme-rgb),.50);border-radius:20px;background:linear-gradient(145deg,rgba(5,8,14,.96),rgba(0,0,0,.94));box-shadow:0 30px 90px rgba(0,0,0,.62),0 0 44px rgba(var(--theme-rgb),.18)}
.subnet-guide-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid rgba(var(--theme-rgb),.24)}
.subnet-guide-head h2{margin:0;color:rgb(var(--theme2-rgb));font-size:1.18rem;font-weight:950}
.subnet-guide-head button{width:42px;height:42px;border:1px solid rgba(var(--theme-rgb),.42);border-radius:12px;background:rgba(var(--theme-rgb),.14);color:#fff;cursor:pointer}
.subnet-guide-body{max-height:calc(94vh - 76px);overflow:auto;background:#02050b}
.subnet-guide-image{display:none;width:100%;height:auto;object-fit:contain}
body[data-theme="network"] .subnet-guide-network,body[data-theme="space"] .subnet-guide-space{display:block}
#subnetHistory{display:grid;gap:10px}
#subnetHistory button{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:46px;padding:0 14px;text-align:left}
#subnetHistory span{color:var(--theme-muted,#cbd5e1);font-size:.82rem}
.subnet-needs-input{box-shadow:0 0 0 3px rgba(251,191,36,.20)!important;border-color:#fbbf24!important}
.subnet-toast{position:fixed;right:24px;bottom:24px;z-index:9999;max-width:min(420px,calc(100vw - 32px));padding:14px 18px;border:1px solid rgba(var(--theme-rgb),.55);border-radius:14px;background:rgba(0,0,0,.88);color:#fff;font-weight:900;box-shadow:0 18px 40px rgba(0,0,0,.42),0 0 24px rgba(var(--theme-rgb),.18);transform:translateY(16px);opacity:0;transition:.22s ease}
.subnet-toast.is-visible{transform:translateY(0);opacity:1}
.subnet-toast-error{border-color:#fb7185;color:#fecdd3}
body[data-theme="space"] .app-page-nav-link.active,body[data-theme="space"] .subnet-actions button:first-child{color:#0b0802;background:linear-gradient(135deg,#c8953b,#f4d47a)}
body[data-theme="network"] .app-page-nav-link.active,body[data-theme="network"] .subnet-actions button:first-child{color:white;background:linear-gradient(135deg,#0ea5e9,#22d3ee)}
body[data-theme="network"] .app-page-nav{background:linear-gradient(145deg,rgba(0,24,52,.24),rgba(0,6,16,.10));border-color:rgba(83,231,255,.34);box-shadow:0 18px 42px rgba(0,0,0,.18),0 0 28px rgba(0,183,255,.10);backdrop-filter:blur(6px)!important}
body[data-theme="network"] .subnet-tabs{background:linear-gradient(145deg,rgba(0,34,74,.20),rgba(0,8,22,.08));border-color:rgba(83,231,255,.30);box-shadow:0 16px 40px rgba(0,0,0,.16);backdrop-filter:blur(6px)!important}
body[data-theme="network"] .subnet-card,body[data-theme="network"] .subnet-hero{background:linear-gradient(145deg,rgba(0,22,48,.22),rgba(0,5,14,.10))!important;border-color:rgba(83,231,255,.36)!important;box-shadow:0 22px 64px rgba(0,0,0,.24),inset 0 1px 0 rgba(210,247,255,.12),0 0 30px rgba(0,183,255,.12)!important;backdrop-filter:blur(5px) saturate(1.08)!important}
body[data-theme="network"] .subnet-hero:before{background:radial-gradient(circle at 84% 15%,rgba(34,211,238,.16),transparent 30%),linear-gradient(90deg,rgba(14,165,233,.07),transparent 48%)}
body[data-theme="network"] .subnet-card input,body[data-theme="network"] .subnet-card select{background:rgba(0,10,24,.24);border-color:rgba(83,231,255,.34)}
body[data-theme="network"] .subnet-result-item,body[data-theme="network"] .subnet-mini-result,body[data-theme="network"] .subnet-code-grid pre,body[data-theme="network"] .subnet-table-wrap{background:rgba(0,6,16,.20);border-color:rgba(83,231,255,.22)}
body[data-theme="network"] .subnet-explain-grid article{background:rgba(0,6,16,.20);border-color:rgba(83,231,255,.22)}
body[data-theme="network"] .subnet-guide-dialog{background:linear-gradient(145deg,rgba(0,22,48,.92),rgba(0,5,14,.96));border-color:rgba(83,231,255,.50);box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 44px rgba(0,183,255,.22)}
body[data-theme="network"] .subnet-viz div{background:linear-gradient(145deg,rgba(0,183,255,.10),rgba(0,8,20,.16));border-color:rgba(83,231,255,.30)}
@media(min-width:1400px){.subnet-lower{grid-template-columns:minmax(0,560px) minmax(0,1fr)}}
@media(max-width:1260px){.subnet-layout,.subnet-lower,.subnet-explain-card{grid-template-columns:1fr}.subnet-inputs{position:relative;top:auto}.subnet-result-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.subnet-cisco-form{grid-template-columns:repeat(2,minmax(0,1fr))}.subnet-explain-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){body.final-layout-v5{padding:16px!important}.app-page-nav,#subnetPage{width:calc(100vw - 32px)}.app-page-nav{top:8px;margin-bottom:16px}.subnet-hero{grid-template-columns:1fr;padding:22px!important;min-height:0}.subnet-hero-icon{width:96px;height:96px;font-size:2.8rem;margin:0}.subnet-tabs{padding:8px}.subnet-tabs button{min-width:165px}.subnet-two,.subnet-result-grid,.subnet-viz,.subnet-code-grid,.subnet-cisco-form,.subnet-explain-grid{grid-template-columns:1fr}.subnet-card{padding:18px!important}.subnet-actions button,.subnet-guide-menu button{width:100%}.subnet-guide-modal{padding:8px}.subnet-guide-dialog{width:100%;max-height:96vh}}
@media(prefers-reduced-motion:reduce){.app-page-nav-link,.subnet-toast{transition:none!important}}
`;

for (const directory of ["public", "dist"]) {
  const htmlPath = join(directory, "index.html");
  let html = await readFile(htmlPath, "utf8");
  if (!html.includes(MARKER)) {
    html = html.replace("</style>", `${css}\n</style>`);
  }
  if (!html.includes('src="/scripts/subnet-calculator.js"')) {
    html = html.replace("</body>", `<script src="/scripts/subnet-calculator.js"></script>\n</body>`);
  }
  await writeFile(htmlPath, html, "utf8");
  const target = join(directory, "scripts", "subnet-calculator.js");
  await mkdir(dirname(target), { recursive: true });
  await copyFile(sourceScript, target);
  for (const [source, destination] of guideAssets) {
    const assetTarget = join(directory, destination);
    await mkdir(dirname(assetTarget), { recursive: true });
    await copyFile(source, assetTarget);
  }
}

console.log("Subnet Calculator SPA installed.");
