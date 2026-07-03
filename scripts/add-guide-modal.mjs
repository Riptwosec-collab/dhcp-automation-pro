import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const styles = `
    /* Usage guide menu and responsive image modal. */
    .guide-menu-btn{
      min-height:44px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      padding:10px 14px!important;
      border:1px solid rgba(var(--theme-rgb),.48)!important;
      border-radius:10px!important;
      color:var(--theme-text)!important;
      background:linear-gradient(180deg,rgba(var(--theme-rgb),.18),rgba(0,0,0,.38))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 18px rgba(var(--theme-rgb),.09)!important;
      font-weight:800;
      cursor:pointer;
    }
    .guide-menu-btn i{color:rgb(var(--theme2-rgb))}
    .guide-modal{
      position:fixed;
      inset:0;
      z-index:9999;
      display:none;
      align-items:center;
      justify-content:center;
      padding:18px;
      background:rgba(0,0,0,.88);
      backdrop-filter:blur(16px);
      -webkit-backdrop-filter:blur(16px);
    }
    .guide-modal.is-open{display:flex}
    .guide-modal-dialog{
      position:relative;
      width:min(1500px,96vw);
      max-height:94vh;
      overflow:auto;
      padding:14px;
      border:1px solid rgba(var(--theme-rgb),.62);
      border-radius:18px;
      background:linear-gradient(145deg,rgba(8,8,9,.98),rgba(2,2,3,.99));
      box-shadow:0 0 42px rgba(var(--theme-rgb),.24),0 32px 90px rgba(0,0,0,.66);
    }
    .guide-modal-dialog:before{
      content:"";
      position:absolute;
      inset:0;
      border-radius:inherit;
      pointer-events:none;
      background:linear-gradient(90deg,rgba(var(--theme2-rgb),.95),transparent 52%,rgba(var(--theme-rgb),.72)) top/100% 2px no-repeat;
    }
    .guide-modal-head{
      position:sticky;
      top:0;
      z-index:3;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:12px;
      padding:10px 12px;
      border:1px solid rgba(var(--theme-rgb),.28);
      border-radius:11px;
      background:rgba(4,4,5,.94);
      color:var(--theme-text);
    }
    .guide-modal-title{display:flex;align-items:center;gap:9px;font-weight:900}
    .guide-modal-title i{color:rgb(var(--theme2-rgb))}
    .guide-modal-close{
      width:38px;
      height:38px;
      display:grid;
      place-items:center;
      border:1px solid rgba(var(--theme-rgb),.42);
      border-radius:10px;
      background:rgba(var(--theme-rgb),.11);
      color:white;
      cursor:pointer;
    }
    .guide-modal-image{
      display:block;
      width:100%;
      height:auto;
      border:1px solid rgba(var(--theme-rgb),.24);
      border-radius:12px;
      background:#020202;
    }
    body.guide-modal-open{overflow:hidden}
    @media(max-width:640px){
      .guide-modal{padding:8px}
      .guide-modal-dialog{width:100%;padding:8px;border-radius:13px}
      .guide-modal-head{padding:8px 10px}
      .guide-modal-title{font-size:.86rem}
    }
`;

const button = `<button id="guideMenuBtn" type="button" class="guide-menu-btn" onclick="openUsageGuide()"><i class="fas fa-book-open"></i> คู่มือ</button>`;

const modal = `
  <div id="usageGuideModal" class="guide-modal" role="dialog" aria-modal="true" aria-labelledby="usageGuideModalTitle" aria-hidden="true">
    <div class="guide-modal-dialog" role="document">
      <div class="guide-modal-head">
        <div id="usageGuideModalTitle" class="guide-modal-title"><i class="fas fa-book-open"></i><span>คู่มือการใช้งาน Mass Pool Import</span></div>
        <button type="button" class="guide-modal-close" onclick="closeUsageGuide()" aria-label="ปิดคู่มือ"><i class="fas fa-xmark"></i></button>
      </div>
      <img class="guide-modal-image" src="/assets/usage-guide.svg" alt="คู่มือการกรอกข้อมูล Mass Pool Import และ Configuration Output" loading="lazy" />
    </div>
  </div>
`;

const runtime = `
  <script>
    (() => {
      const modal = () => document.getElementById('usageGuideModal');
      window.openUsageGuide = () => {
        const element = modal();
        if (!element) return;
        element.classList.add('is-open');
        element.setAttribute('aria-hidden','false');
        document.body.classList.add('guide-modal-open');
        element.querySelector('.guide-modal-close')?.focus();
      };
      window.closeUsageGuide = () => {
        const element = modal();
        if (!element) return;
        element.classList.remove('is-open');
        element.setAttribute('aria-hidden','true');
        document.body.classList.remove('guide-modal-open');
        document.getElementById('guideMenuBtn')?.focus();
      };
      addEventListener('click',(event) => {
        const element = modal();
        if (element && event.target === element) closeUsageGuide();
      });
      addEventListener('keydown',(event) => {
        if (event.key === 'Escape' && modal()?.classList.contains('is-open')) closeUsageGuide();
      });
    })();
  </script>
`;

for (const directory of ["public", "dist"]) {
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");

  if (!html.includes("Usage guide menu and responsive image modal")) {
    html = html.replace("  </style>", `${styles}  </style>`);
  }

  if (!html.includes('id="guideMenuBtn"')) {
    const actionMarker = '<div class="flex flex-wrap gap-3">';
    const actionIndex = html.indexOf(actionMarker);
    if (actionIndex === -1) throw new Error(`Hero action group not found in ${path}`);
    const insertAt = actionIndex + actionMarker.length;
    html = `${html.slice(0, insertAt)}${button}${html.slice(insertAt)}`;
  }

  if (!html.includes('id="usageGuideModal"')) {
    html = html.replace("</body>", `${modal}${runtime}</body>`);
  }

  const required = [
    'id="guideMenuBtn"',
    'id="usageGuideModal"',
    '/assets/usage-guide.svg',
    'openUsageGuide',
    'closeUsageGuide'
  ];
  const missing = required.filter((value) => !html.includes(value));
  if (missing.length) throw new Error(`Guide modal build failed in ${path}: ${missing.join(", ")}`);

  await mkdir(`${directory}/assets`, { recursive: true });
  await copyFile("assets/usage-guide.svg", `${directory}/assets/usage-guide.svg`);
  await writeFile(path, html, "utf8");
}

console.log("Guide menu added with a responsive image modal and keyboard/backdrop close support.");
