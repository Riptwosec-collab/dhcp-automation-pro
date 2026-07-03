import { readFile, writeFile } from "node:fs/promises";

const styles = `
    /* Grand dual-theme layout: gold Space mission control + cyan Network command center. */
    body[data-theme="space"]{
      --theme-rgb:239,185,67;
      --theme2-rgb:255,226,145;
      --theme-soft-rgb:255,210,104;
      --theme-panel:rgba(12,12,12,.93);
      --theme-panel-2:rgba(5,5,6,.96);
      --theme-line:rgba(232,178,64,.50);
      --theme-text:#fff8e7;
      --theme-muted:#bdb6a8;
      background:#030303!important;
    }
    body[data-theme="network"]{
      --theme-rgb:0,183,255;
      --theme2-rgb:78,224,255;
      --theme-soft-rgb:80,172,255;
      --theme-panel:rgba(3,18,40,.94);
      --theme-panel-2:rgba(1,8,24,.97);
      --theme-line:rgba(40,145,220,.52);
      --theme-text:#f1f8ff;
      --theme-muted:#9caec5;
      background:#010817!important;
    }
    body[data-theme="space"]:before{
      opacity:1!important;
      background:
        radial-gradient(circle at 9% 4%,rgba(239,185,67,.14),transparent 26%),
        radial-gradient(circle at 92% 8%,rgba(255,210,104,.08),transparent 24%),
        linear-gradient(180deg,rgba(4,4,4,.52),rgba(2,2,2,.91))!important;
    }
    body[data-theme="space"]:after{
      content:"";
      position:fixed;
      inset:0;
      z-index:2;
      pointer-events:none;
      background:
        radial-gradient(circle at var(--mx,50%) var(--my,28%),rgba(239,185,67,.13),transparent 25%),
        radial-gradient(circle,rgba(255,228,156,.22) 0 1px,transparent 1.4px);
      background-size:auto,52px 52px;
      -webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.94),transparent 92%);
      mask-image:linear-gradient(to bottom,rgba(0,0,0,.94),transparent 92%);
    }
    .spline-page-bg{
      display:block!important;
      pointer-events:auto!important;
      z-index:1!important;
    }
    .spline-page-bg spline-viewer{
      pointer-events:auto!important;
      transition:filter .5s ease,opacity .5s ease,transform .5s ease!important;
    }
    body[data-theme="space"] .spline-page-bg spline-viewer{
      opacity:.66!important;
      transform:scale(1.14)!important;
      filter:saturate(1.15) brightness(.39) contrast(1.22) sepia(.20)!important;
    }
    body[data-theme="space"] .spline-page-shade{
      background:
        linear-gradient(180deg,rgba(0,0,0,.48),rgba(0,0,0,.84)),
        radial-gradient(circle at 12% 9%,rgba(239,185,67,.17),transparent 32%),
        radial-gradient(circle at 88% 13%,rgba(255,219,126,.09),transparent 28%)!important;
    }
    body[data-theme="network"] .spline-page-shade{
      background:
        linear-gradient(180deg,rgba(1,8,22,.55),rgba(1,7,20,.87)),
        radial-gradient(circle at 12% 9%,rgba(0,183,255,.17),transparent 32%),
        radial-gradient(circle at 88% 13%,rgba(56,215,255,.09),transparent 28%)!important;
    }
    .app-shell{pointer-events:none}
    .app-shell>*{pointer-events:auto}
    body[data-theme="space"] .app-shell,
    body[data-theme="network"] .app-shell{
      width:min(1560px,calc(100vw - 30px))!important;
      max-width:none!important;
      display:grid!important;
      grid-template-columns:minmax(300px,360px) minmax(0,1fr)!important;
      grid-template-rows:auto auto auto auto auto!important;
      align-items:start!important;
      gap:11px 16px!important;
      padding:14px 0 24px!important;
    }
    body[data-theme="space"] .app-shell>*,
    body[data-theme="network"] .app-shell>*{
      min-width:0!important;
      margin-top:0!important;
    }
    body[data-theme="space"] #heroPanel,
    body[data-theme="network"] #heroPanel{
      grid-column:1!important;
      grid-row:1 / span 5!important;
      position:sticky!important;
      top:14px!important;
      align-self:start!important;
      width:100%!important;
      height:calc(100vh - 28px)!important;
      min-height:690px!important;
      max-height:960px!important;
      padding:26px!important;
      overflow:hidden!important;
      border-radius:24px!important;
      background:
        radial-gradient(circle at 82% 82%,rgba(var(--theme-rgb),.13),transparent 30%),
        linear-gradient(145deg,var(--theme-panel),var(--theme-panel-2))!important;
      border:1px solid var(--theme-line)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.08),
        inset 0 0 46px rgba(var(--theme-rgb),.045),
        0 0 0 1px rgba(var(--theme-rgb),.05),
        0 22px 72px rgba(0,0,0,.44),
        0 0 34px rgba(var(--theme-rgb),.16)!important;
      backdrop-filter:blur(28px) saturate(132%)!important;
      -webkit-backdrop-filter:blur(28px) saturate(132%)!important;
    }
    body[data-theme="space"] #heroPanel:before,
    body[data-theme="network"] #heroPanel:before{
      content:""!important;
      position:absolute!important;
      inset:auto -18% -18% -20%!important;
      width:115%!important;
      height:46%!important;
      border-radius:50%!important;
      pointer-events:none!important;
      background:
        radial-gradient(circle at 50% 0%,rgba(var(--theme2-rgb),.34),rgba(var(--theme-rgb),.12) 26%,transparent 64%)!important;
      border-top:1px solid rgba(var(--theme2-rgb),.52)!important;
      box-shadow:0 -10px 34px rgba(var(--theme-rgb),.20)!important;
      transform:none!important;
      animation:none!important;
      opacity:.78!important;
    }
    body[data-theme="space"] #heroPanel:after,
    body[data-theme="network"] #heroPanel:after{
      content:"";
      position:absolute;
      inset:0;
      border-radius:inherit;
      pointer-events:none;
      background:
        linear-gradient(90deg,rgba(var(--theme2-rgb),.95),transparent 52%,rgba(var(--theme-rgb),.72)) top/100% 2px no-repeat,
        linear-gradient(180deg,rgba(255,255,255,.025),transparent 24%);
      opacity:.90;
    }
    body[data-theme="space"] #heroPanel>.flex,
    body[data-theme="network"] #heroPanel>.flex{
      position:relative!important;
      z-index:2!important;
      height:100%!important;
      min-height:0!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;
      justify-content:space-between!important;
      gap:20px!important;
    }
    body[data-theme="space"] #heroPanel h1,
    body[data-theme="network"] #heroPanel h1{
      margin-top:20px!important;
      font-size:clamp(2.85rem,4vw,4.35rem)!important;
      line-height:.96!important;
      letter-spacing:-.045em!important;
      color:var(--theme-text)!important;
    }
    body[data-theme="space"] #heroPanel .brand-title em,
    body[data-theme="network"] #heroPanel .brand-title em{
      color:rgb(var(--theme2-rgb))!important;
      text-shadow:0 0 24px rgba(var(--theme-rgb),.44),0 0 44px rgba(var(--theme2-rgb),.18)!important;
    }
    body[data-theme="space"] #heroPanel .brand-emoji,
    body[data-theme="network"] #heroPanel .brand-emoji{
      color:rgb(var(--theme2-rgb))!important;
      font-size:.88rem!important;
      letter-spacing:.16em!important;
      text-transform:uppercase!important;
    }
    body[data-theme="space"] .network-hero-copy,
    body[data-theme="network"] .network-hero-copy{
      display:block!important;
      margin-top:17px!important;
      max-width:310px!important;
      color:var(--theme-muted)!important;
      font-size:.92rem!important;
      line-height:1.72!important;
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child,
    body[data-theme="network"] #heroPanel>.flex>div:last-child{width:100%!important;align-items:stretch!important}
    body[data-theme="space"] #heroPanel .theme-switcher,
    body[data-theme="network"] #heroPanel .theme-switcher{
      width:100%!important;
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:5px!important;
      padding:5px!important;
      border-radius:999px!important;
      background:rgba(0,0,0,.34)!important;
      border:1px solid rgba(var(--theme-rgb),.34)!important;
    }
    body[data-theme="space"] #heroPanel .theme-btn,
    body[data-theme="network"] #heroPanel .theme-btn{
      padding:.72rem .65rem!important;
      border-radius:999px!important;
      color:#d8d8dd!important;
      font-size:.82rem!important;
    }
    body[data-theme="space"] #heroPanel .theme-btn.active,
    body[data-theme="network"] #heroPanel .theme-btn.active{
      color:white!important;
      background:linear-gradient(135deg,rgba(var(--theme-rgb),.38),rgba(var(--theme2-rgb),.18))!important;
      box-shadow:0 0 0 1px rgba(var(--theme2-rgb),.32),0 8px 24px rgba(var(--theme-rgb),.20)!important;
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex,
    body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex{
      width:100%!important;
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:9px!important;
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex button,
    body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex button{
      min-height:44px!important;
      padding:10px 11px!important;
      border-radius:10px!important;
      border:1px solid rgba(var(--theme-rgb),.42)!important;
      background:linear-gradient(180deg,rgba(var(--theme-rgb),.12),rgba(0,0,0,.34))!important;
      color:var(--theme-text)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important;
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex button:first-child,
    body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex button:first-child{
      background:linear-gradient(180deg,rgba(var(--theme2-rgb),.95),rgba(var(--theme-rgb),.74))!important;
      color:#080808!important;
      border-color:rgba(var(--theme2-rgb),.92)!important;
      box-shadow:0 0 24px rgba(var(--theme-rgb),.34),inset 0 1px 0 rgba(255,255,255,.34)!important;
    }
    body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex button:first-child{color:white!important}
    body[data-theme="space"] .credit-glass,
    body[data-theme="network"] .credit-glass{
      width:100%!important;
      min-width:0!important;
      justify-content:flex-start!important;
      border-radius:10px!important;
      background:rgba(0,0,0,.26)!important;
      border-color:rgba(var(--theme-rgb),.20)!important;
    }
    body[data-theme="space"] #networkDashboard,
    body[data-theme="network"] #networkDashboard{
      grid-column:2!important;
      grid-row:1!important;
      min-height:0!important;
      padding:18px!important;
      border-radius:20px!important;
      background:linear-gradient(145deg,var(--theme-panel),var(--theme-panel-2))!important;
      border:1px solid var(--theme-line)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 18px 54px rgba(0,0,0,.34),0 0 26px rgba(var(--theme-rgb),.11)!important;
    }
    body[data-theme="space"] #networkDashboard:before,
    body[data-theme="network"] #networkDashboard:before{
      background:linear-gradient(90deg,rgba(var(--theme2-rgb),.92),transparent 52%,rgba(var(--theme-rgb),.66)) top/100% 2px no-repeat!important;
    }
    .network-section-title{margin:0 0 10px!important;color:var(--theme-text)!important;font-size:.78rem!important;letter-spacing:.08em!important}
    .network-stat-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}
    .network-stat-card{
      min-height:108px!important;
      padding:13px!important;
      border-radius:12px!important;
      border:1px solid rgba(var(--theme-rgb),.38)!important;
      background:linear-gradient(145deg,rgba(var(--theme-rgb),.10),rgba(0,0,0,.34))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 0 18px rgba(var(--theme-rgb),.06)!important;
    }
    .network-stat-icon{width:30px!important;height:30px!important;margin-bottom:10px!important;color:rgb(var(--theme2-rgb))!important;border-color:rgba(var(--theme-rgb),.36)!important;background:rgba(var(--theme-rgb),.10)!important}
    .network-stat-label{font-size:.74rem!important;color:#e8e5dd!important}
    .network-stat-value{font-size:1.45rem!important;margin-top:6px!important}
    .network-stat-note{font-size:.68rem!important;margin-top:6px!important;color:rgb(var(--theme2-rgb))!important}
    .network-block{margin-top:13px!important}
    .network-action-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important}
    .network-action{
      min-height:62px!important;
      padding:10px!important;
      border-radius:10px!important;
      border-color:rgba(var(--theme-rgb),.38)!important;
      background:rgba(0,0,0,.28)!important;
    }
    .network-action:hover{border-color:rgba(var(--theme2-rgb),.78)!important;box-shadow:0 0 20px rgba(var(--theme-rgb),.16)!important}
    .network-action i{color:rgb(var(--theme2-rgb))!important}
    .network-action strong{font-size:.74rem!important}
    .network-action span{font-size:.64rem!important;margin-top:4px!important}
    .network-status-strip{
      margin-top:13px!important;
      padding:10px 12px!important;
      border-color:rgba(var(--theme-rgb),.34)!important;
      background:rgba(0,0,0,.28)!important;
      color:var(--theme-muted)!important;
    }
    .network-status-strip .ok{color:rgb(var(--theme2-rgb))!important}
    .network-status-dot{background:rgb(var(--theme2-rgb))!important;box-shadow:0 0 12px rgba(var(--theme-rgb),.72)!important}
    body[data-theme="space"] #networkScopePanel,
    body[data-theme="network"] #networkScopePanel{
      grid-column:2!important;
      grid-row:2!important;
      gap:9px!important;
      padding:9px!important;
      border-radius:18px!important;
      border:1px solid rgba(var(--theme-rgb),.40)!important;
      background:linear-gradient(145deg,var(--theme-panel),var(--theme-panel-2))!important;
      box-shadow:0 0 22px rgba(var(--theme-rgb),.08)!important;
    }
    body[data-theme="space"] #networkScopePanel>.glass-panel,
    body[data-theme="network"] #networkScopePanel>.glass-panel{
      min-height:72px!important;
      padding:13px!important;
      border-radius:10px!important;
      border-color:rgba(var(--theme-rgb),.30)!important;
    }
    body[data-theme="space"] #searchInput,
    body[data-theme="network"] #searchInput{
      grid-column:2!important;
      grid-row:3!important;
      height:50px!important;
      padding:0 17px!important;
      border-radius:12px!important;
      border:1px solid rgba(var(--theme-rgb),.42)!important;
      background:rgba(0,0,0,.48)!important;
      color:var(--theme-text)!important;
      box-shadow:0 0 18px rgba(var(--theme-rgb),.07)!important;
    }
    body[data-theme="space"] #massImportPanel,
    body[data-theme="network"] #massImportPanel{
      grid-column:2!important;
      grid-row:4!important;
      padding:18px!important;
      border-radius:18px!important;
      background:linear-gradient(145deg,var(--theme-panel),var(--theme-panel-2))!important;
      border:1px solid rgba(var(--theme-rgb),.44)!important;
      box-shadow:0 0 24px rgba(var(--theme-rgb),.09)!important;
    }
    body[data-theme="space"] #massImportPanel h2,
    body[data-theme="network"] #massImportPanel h2{font-size:1.14rem!important;color:var(--theme-text)!important}
    body[data-theme="space"] #massImportPanel textarea,
    body[data-theme="network"] #massImportPanel textarea{
      min-height:128px!important;
      padding:12px!important;
      border-radius:9px!important;
      border-color:rgba(var(--theme-rgb),.40)!important;
      background:rgba(0,0,0,.50)!important;
      color:#e9e6de!important;
      line-height:1.55!important;
    }
    body[data-theme="space"] #massImportPanel select,
    body[data-theme="network"] #massImportPanel select,
    body[data-theme="space"] .pool-card input,
    body[data-theme="network"] .pool-card input{
      border-color:rgba(var(--theme-rgb),.40)!important;
      background:rgba(0,0,0,.46)!important;
    }
    body[data-theme="space"] #bulkGenerateBtn,
    body[data-theme="network"] #bulkGenerateBtn{
      border-radius:9px!important;
      background:linear-gradient(180deg,rgba(var(--theme2-rgb),.96),rgba(var(--theme-rgb),.72))!important;
      border:1px solid rgba(var(--theme2-rgb),.82)!important;
      color:#080808!important;
      box-shadow:0 0 22px rgba(var(--theme-rgb),.24)!important;
    }
    body[data-theme="network"] #bulkGenerateBtn{color:white!important}
    body[data-theme="space"] #resultsGrid,
    body[data-theme="network"] #resultsGrid{
      grid-column:2!important;
      grid-row:5!important;
      gap:12px!important;
      margin-top:0!important;
    }
    body[data-theme="space"] #resultsGrid .glass-panel,
    body[data-theme="network"] #resultsGrid .glass-panel,
    body[data-theme="space"] .pool-card,
    body[data-theme="network"] .pool-card{
      border-radius:16px!important;
      border-color:rgba(var(--theme-rgb),.40)!important;
      background:linear-gradient(145deg,var(--theme-panel),var(--theme-panel-2))!important;
      box-shadow:0 0 22px rgba(var(--theme-rgb),.08)!important;
    }
    body[data-theme="space"] #configPanel pre,
    body[data-theme="network"] #configPanel pre{background:rgba(0,0,0,.56)!important;color:#75ef9d!important;min-height:360px!important}
    body[data-theme="space"] button,
    body[data-theme="network"] button{transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease,filter .2s ease!important}
    body[data-theme="space"] button:hover,
    body[data-theme="network"] button:hover{transform:translateY(-1px)!important;filter:brightness(1.08)!important}
    @media(max-width:1180px){
      body[data-theme="space"] .app-shell,
      body[data-theme="network"] .app-shell{grid-template-columns:1fr!important;gap:11px!important}
      body[data-theme="space"] #heroPanel,
      body[data-theme="network"] #heroPanel{
        grid-column:1!important;
        grid-row:auto!important;
        position:relative!important;
        top:auto!important;
        height:auto!important;
        min-height:0!important;
        max-height:none!important;
      }
      body[data-theme="space"] #networkDashboard,
      body[data-theme="network"] #networkDashboard,
      body[data-theme="space"] #networkScopePanel,
      body[data-theme="network"] #networkScopePanel,
      body[data-theme="space"] #searchInput,
      body[data-theme="network"] #searchInput,
      body[data-theme="space"] #massImportPanel,
      body[data-theme="network"] #massImportPanel,
      body[data-theme="space"] #resultsGrid,
      body[data-theme="network"] #resultsGrid{grid-column:1!important;grid-row:auto!important}
    }
    @media(max-width:760px){
      body[data-theme="space"] .app-shell,
      body[data-theme="network"] .app-shell{width:calc(100vw - 18px)!important;padding-top:9px!important}
      .network-stat-grid,.network-action-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      body[data-theme="space"] #heroPanel,
      body[data-theme="network"] #heroPanel,
      body[data-theme="space"] #networkDashboard,
      body[data-theme="network"] #networkDashboard,
      body[data-theme="space"] #massImportPanel,
      body[data-theme="network"] #massImportPanel{padding:17px!important;border-radius:16px!important}
      body[data-theme="space"] #heroPanel h1,
      body[data-theme="network"] #heroPanel h1{font-size:2.65rem!important}
      body[data-theme="space"] #massImportPanel textarea,
      body[data-theme="network"] #massImportPanel textarea{min-height:112px!important}
      body[data-theme="space"] #resultsGrid,
      body[data-theme="network"] #resultsGrid{grid-template-columns:1fr!important}
    }
    @media(max-width:460px){
      body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex,
      body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex{grid-template-columns:1fr!important}
    }
`;

const runtime = `
  <script>
    (() => {
      const updatePointer = (event) => {
        document.body.style.setProperty('--mx', ((event.clientX / innerWidth) * 100).toFixed(2) + '%');
        document.body.style.setProperty('--my', ((event.clientY / innerHeight) * 100).toFixed(2) + '%');
      };
      const refreshThemeCopy = () => {
        const space = document.body.dataset.theme === 'space';
        const badge = document.getElementById('themeBadge');
        const eyebrow = document.querySelector('#heroPanel .brand-emoji');
        const title = document.querySelector('#heroPanel .brand-title');
        const copy = document.querySelector('#heroPanel .network-hero-copy');
        if (badge) badge.innerHTML = space
          ? '<i class="fas fa-star"></i> System: Connected · Space Mission'
          : '<i class="fas fa-network-wired"></i> Network Command Center · Online';
        if (eyebrow) eyebrow.textContent = space ? '✦ IP AUTOMATION SUITE' : '🌐 iPDHCP AUTO';
        if (title) title.innerHTML = space ? 'DHCP Mission <em>Control</em>' : 'DHCP Automation <em>PRO</em>';
        if (copy) copy.textContent = space
          ? 'Centralize, automate, and optimize DHCP and IP address management across your mission infrastructure.'
          : 'Effortlessly manage DHCP pools, automate MAC/IP assignments, and export Cisco-ready configurations from one control center.';
      };
      addEventListener('pointermove', updatePointer, { passive:true });
      addEventListener('load', refreshThemeCopy);
      new MutationObserver(refreshThemeCopy).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    })();
  </script>
`;

for (const directory of ["public", "dist"]) {
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");
  if (!html.includes("Grand dual-theme layout")) {
    html = html.replace("  </style>", `${styles}  </style>`);
  }
  if (!html.includes("IP AUTOMATION SUITE")) {
    html = html.replace("</body>", `${runtime}</body>`);
  }

  const required = [
    "Grand dual-theme layout",
    'grid-row:1 / span 5',
    'body[data-theme="space"] #massImportPanel',
    'body[data-theme="network"] #massImportPanel',
    'pointer-events:auto!important',
    'IP AUTOMATION SUITE'
  ];
  const missing = required.filter((value) => !html.includes(value));
  if (missing.length) throw new Error(`Grand theme build failed in ${path}: ${missing.join(", ")}`);

  await writeFile(path, html, "utf8");
}

console.log("Grand gold Space and cyan Network themes applied with interactive 3D backgrounds and compact five-section right column.");
