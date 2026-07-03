import { readFile, writeFile } from "node:fs/promises";

const styles = `
    /* Space theme uses the same dashboard structure as Network, with a cosmic palette. */
    body[data-theme="space"]{
      --panel1:rgba(18,16,55,.94);
      --panel2:rgba(5,8,30,.94);
      --accent:125,92,255;
      --accent2:56,189,248;
      background:#050619;
    }
    body[data-theme="space"] .spline-page-bg spline-viewer{
      opacity:.60;
      transform:scale(1.13);
      filter:saturate(1.08) brightness(.46) contrast(1.12) hue-rotate(8deg);
    }
    body[data-theme="space"] .spline-page-shade{
      background:
        linear-gradient(180deg,rgba(4,5,25,.58),rgba(5,4,27,.86)),
        radial-gradient(circle at 12% 8%,rgba(83,76,255,.25),transparent 34%),
        radial-gradient(circle at 87% 12%,rgba(177,74,255,.20),transparent 32%),
        radial-gradient(circle at 52% 86%,rgba(0,183,255,.12),transparent 38%);
    }
    body[data-theme="space"] .app-shell{
      width:min(1500px,calc(100vw - 38px));
      max-width:none!important;
      display:grid;
      grid-template-columns:minmax(310px,420px) minmax(0,1fr);
      gap:20px;
      padding:22px 0 44px;
    }
    body[data-theme="space"] .app-shell>*{min-width:0;margin-top:0!important}
    body[data-theme="space"] .glass-panel,
    body[data-theme="space"] .pool-card{
      background:linear-gradient(145deg,rgba(20,18,62,.95),rgba(6,8,31,.94))!important;
      border:1px solid rgba(125,92,255,.48)!important;
      border-radius:22px!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.08),
        inset 0 0 42px rgba(112,72,255,.05),
        0 0 0 1px rgba(139,92,246,.04),
        0 18px 55px rgba(0,0,0,.34),
        0 0 28px rgba(104,80,255,.10);
      backdrop-filter:blur(24px) saturate(130%);
      -webkit-backdrop-filter:blur(24px) saturate(130%);
    }
    body[data-theme="space"] .glass-panel:after,
    body[data-theme="space"] .pool-card:after{
      content:"";
      position:absolute;
      inset:0;
      border-radius:inherit;
      pointer-events:none;
      background:
        linear-gradient(90deg,rgba(121,99,255,.78),transparent 25%,transparent 74%,rgba(57,189,248,.48)) top/100% 1px no-repeat;
      opacity:.72;
    }
    body[data-theme="space"] #heroPanel{
      grid-column:1;
      min-height:560px;
      padding:28px!important;
      overflow:hidden;
      border-color:rgba(139,92,246,.66)!important;
      box-shadow:0 0 0 1px rgba(137,90,255,.12),0 0 32px rgba(108,78,255,.20),0 24px 70px rgba(0,0,0,.36)!important;
    }
    body[data-theme="space"] #heroPanel:after{
      background:
        linear-gradient(90deg,rgba(138,105,255,.95),transparent 50%,rgba(59,199,255,.62)) top/100% 2px no-repeat,
        radial-gradient(circle at 88% 82%,rgba(120,72,255,.17),transparent 32%),
        linear-gradient(180deg,transparent 66%,rgba(74,52,180,.10));
    }
    body[data-theme="space"] #heroPanel>.flex{
      height:100%;
      min-height:504px;
      flex-direction:column;
      align-items:stretch;
      justify-content:space-between;
      gap:28px;
    }
    body[data-theme="space"] #heroPanel>.flex>div:first-child{max-width:100%}
    body[data-theme="space"] #heroPanel h1{
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:4px;
      margin-top:22px;
      font-size:clamp(2.7rem,4vw,4.25rem)!important;
      line-height:.98;
      letter-spacing:-.045em;
    }
    body[data-theme="space"] #heroPanel .brand-emoji{
      font-size:1.02rem;
      letter-spacing:.055em;
      color:#c8c6ff;
      opacity:.92;
    }
    body[data-theme="space"] #heroPanel .brand-title{display:block}
    body[data-theme="space"] #heroPanel .brand-title em{
      display:block;
      margin-top:8px;
      font-style:normal;
      color:#a98cff;
      text-shadow:0 0 26px rgba(144,105,255,.46),0 0 42px rgba(56,189,248,.16);
    }
    body[data-theme="space"] .network-hero-copy{
      display:block;
      margin-top:18px;
      max-width:330px;
      color:#b0b4d6;
      font-size:.94rem;
      line-height:1.75;
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child{
      width:100%;
      align-items:stretch;
    }
    body[data-theme="space"] #heroPanel .theme-switcher{
      width:100%;
      display:grid;
      grid-template-columns:1fr 1fr;
      padding:5px;
      border-color:rgba(133,101,255,.42);
      background:rgba(5,5,25,.76);
    }
    body[data-theme="space"] #heroPanel .theme-btn{padding:.75rem .65rem;font-size:.82rem}
    body[data-theme="space"] #heroPanel .theme-btn.active{
      background:linear-gradient(135deg,rgba(112,83,255,.36),rgba(58,135,255,.18));
      box-shadow:0 0 0 1px rgba(162,132,255,.32),0 8px 26px rgba(80,53,197,.30);
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
      width:100%;
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex button{
      min-height:46px;
      padding:11px 12px!important;
      border:1px solid rgba(126,99,231,.52);
      background:linear-gradient(180deg,rgba(35,30,91,.95),rgba(13,13,48,.96))!important;
      color:#f8f7ff;
      border-radius:10px!important;
      font-size:.80rem;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.07);
    }
    body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex button:first-child{
      background:linear-gradient(180deg,#8a5bff,#5b38d6)!important;
      border-color:#b59cff;
      box-shadow:0 0 24px rgba(126,87,255,.38),inset 0 1px 0 rgba(255,255,255,.28);
    }
    body[data-theme="space"] #themeDescription{margin-top:18px}
    body[data-theme="space"] .credit-glass{
      min-width:0;
      width:100%;
      justify-content:flex-start;
      padding:.7rem .95rem;
      border-radius:10px;
      background:rgba(11,9,38,.52);
      border-color:rgba(150,117,255,.22);
    }
    body[data-theme="space"] #networkDashboard{
      display:block;
      grid-column:2;
      min-height:560px;
      position:relative;
      overflow:hidden;
      padding:26px;
      border:1px solid rgba(125,92,255,.48);
      border-radius:22px;
      background:linear-gradient(145deg,rgba(20,18,62,.95),rgba(6,8,31,.94));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 55px rgba(0,0,0,.34),0 0 28px rgba(104,80,255,.10);
    }
    body[data-theme="space"] #networkDashboard:before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      background:
        linear-gradient(90deg,rgba(140,106,255,.92),transparent 50%,rgba(58,198,255,.58)) top/100% 2px no-repeat,
        radial-gradient(circle at 92% 10%,rgba(117,80,255,.12),transparent 24%);
    }
    body[data-theme="space"] .network-section-title{color:#f0efff}
    body[data-theme="space"] .network-stat-card{
      border-color:rgba(126,99,231,.48);
      background:linear-gradient(145deg,rgba(34,28,92,.78),rgba(10,11,42,.84));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 0 18px rgba(91,65,206,.06);
    }
    body[data-theme="space"] .network-stat-icon{
      color:#b39aff;
      border-color:rgba(151,119,255,.38);
      background:rgba(103,72,255,.13);
      box-shadow:0 0 18px rgba(112,76,255,.10);
    }
    body[data-theme="space"] .network-stat-note{color:#70e7ff}
    body[data-theme="space"] .network-stat-card:nth-child(2) .network-stat-note{color:#b89cff}
    body[data-theme="space"] .network-stat-card:nth-child(3) .network-stat-note{color:#f18cff}
    body[data-theme="space"] .network-stat-card:nth-child(4) .network-stat-note{color:#aeb9e2}
    body[data-theme="space"] .network-action{
      border-color:rgba(126,99,231,.48);
      background:rgba(13,12,49,.78);
    }
    body[data-theme="space"] .network-action:hover{
      border-color:rgba(174,139,255,.78);
      box-shadow:0 0 20px rgba(112,76,255,.18);
    }
    body[data-theme="space"] .network-action i{color:#ad93ff}
    body[data-theme="space"] .network-status-strip{
      border-color:rgba(126,99,231,.40);
      background:rgba(10,9,38,.74);
      color:#aeb4d4;
    }
    body[data-theme="space"] .network-status-strip .ok{color:#8cf3d1}
    body[data-theme="space"] .network-status-dot{background:#82f5ca;box-shadow:0 0 13px rgba(130,245,202,.76)}
    body[data-theme="space"] #networkScopePanel,
    body[data-theme="space"] #searchInput,
    body[data-theme="space"] #massImportPanel,
    body[data-theme="space"] #resultsGrid{grid-column:1/-1}
    body[data-theme="space"] #networkScopePanel{
      padding:18px;
      border:1px solid rgba(125,92,255,.46);
      border-radius:20px;
      background:linear-gradient(145deg,rgba(20,18,62,.94),rgba(6,8,31,.92));
      box-shadow:0 0 24px rgba(103,75,255,.08);
    }
    body[data-theme="space"] #networkScopePanel>.glass-panel{border-radius:12px!important;min-height:90px}
    body[data-theme="space"] #searchInput{
      border:1px solid rgba(125,92,255,.48)!important;
      border-radius:12px!important;
      background:rgba(11,10,40,.88)!important;
      box-shadow:0 0 22px rgba(103,75,255,.08);
    }
    body[data-theme="space"] #massImportPanel{padding:26px!important}
    body[data-theme="space"] #massImportPanel h2{font-size:1.45rem;color:#faf9ff}
    body[data-theme="space"] #massImportPanel textarea,
    body[data-theme="space"] #massImportPanel select,
    body[data-theme="space"] #massImportPanel input,
    body[data-theme="space"] .pool-card input{
      border-color:rgba(126,99,231,.48)!important;
      border-radius:10px!important;
      background:rgba(9,9,36,.86)!important;
      color:#ebe9ff;
    }
    body[data-theme="space"] #massImportPanel textarea{min-height:190px;line-height:1.65}
    body[data-theme="space"] #bulkGenerateBtn{
      border-radius:9px!important;
      background:linear-gradient(180deg,#9b58ff,#6e35d7)!important;
      border:1px solid rgba(207,166,255,.60);
      box-shadow:0 0 24px rgba(137,72,230,.24);
    }
    body[data-theme="space"] #resultsGrid{gap:18px}
    body[data-theme="space"] #poolsContainer>.glass-panel,
    body[data-theme="space"] #configPanel{min-height:420px}
    body[data-theme="space"] #configPanel pre{background:rgba(7,7,29,.82)!important;color:#84f6bd!important}
    body[data-theme="space"] .pool-card{position:relative;border-radius:16px!important}
    body[data-theme="space"] button{transition:transform .2s,border-color .2s,box-shadow .2s,background .2s}
    body[data-theme="space"] button:hover{transform:translateY(-1px)}
    @media(max-width:1120px){
      body[data-theme="space"] .app-shell{grid-template-columns:1fr}
      body[data-theme="space"] #heroPanel,
      body[data-theme="space"] #networkDashboard{grid-column:1}
      body[data-theme="space"] #heroPanel{min-height:auto}
      body[data-theme="space"] #heroPanel>.flex{min-height:0}
    }
    @media(max-width:768px){
      body[data-theme="space"] .app-shell{width:calc(100vw - 20px);padding-top:10px;gap:12px}
      body[data-theme="space"] #heroPanel,
      body[data-theme="space"] #networkDashboard,
      body[data-theme="space"] #massImportPanel{padding:20px!important;border-radius:16px!important}
      body[data-theme="space"] #heroPanel h1{font-size:2.65rem!important}
      body[data-theme="space"] #massImportPanel textarea{min-height:140px}
    }
    @media(max-width:460px){
      body[data-theme="space"] #heroPanel>.flex>div:last-child>.flex{grid-template-columns:1fr}
    }
`;

const runtime = `
  <script>
    (() => {
      const setSpaceCopy = () => {
        const isSpace = document.body.dataset.theme === 'space';
        const brandEyebrow = document.querySelector('#heroPanel .brand-emoji');
        const brandTitle = document.querySelector('#heroPanel .brand-title');
        const heroCopy = document.querySelector('#heroPanel .network-hero-copy');
        const statusLead = document.querySelector('#networkDashboard .network-status-strip .ok');
        const notes = document.querySelectorAll('#networkDashboard .network-stat-note');

        if (brandEyebrow) brandEyebrow.textContent = isSpace ? '✦ ORBITAL DHCP AUTO' : '🌐 iPDHCP AUTO';
        if (brandTitle) brandTitle.innerHTML = isSpace ? 'DHCP Mission <em>CONTROL</em>' : 'DHCP Automation <em>PRO</em>';
        if (heroCopy) heroCopy.textContent = isSpace
          ? 'Manage DHCP pools from an orbital mission console with cosmic telemetry, automated validation, and Cisco-ready exports.'
          : 'Effortlessly manage DHCP pools, automate MAC/IP assignments, and export Cisco-ready configurations from one control center.';
        if (statusLead) statusLead.innerHTML = isSpace
          ? '<span class="network-status-dot"></span>Orbital systems online · Mission control ready'
          : '<span class="network-status-dot"></span>System ready · All services operational';

        const spaceNotes = ['Active mission','Mapped orbits','Systems ready','Status: Online'];
        const networkNotes = ['Active workspace','Configured','Valid pools','Status: OK'];
        notes.forEach((note,index) => { note.textContent = (isSpace ? spaceNotes : networkNotes)[index] || note.textContent; });
      };

      window.addEventListener('load', setSpaceCopy);
      new MutationObserver(setSpaceCopy).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    })();
  </script>
`;

for (const directory of ["public", "dist"]) {
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");

  if (!html.includes("Space theme uses the same dashboard structure as Network")) {
    html = html.replace("  </style>", `${styles}  </style>`);
  }
  if (!html.includes("ORBITAL DHCP AUTO")) {
    html = html.replace("</body>", `${runtime}</body>`);
  }

  const required = [
    'body[data-theme="space"] #networkDashboard',
    'body[data-theme="space"] .app-shell',
    'ORBITAL DHCP AUTO',
    'DHCP Mission <em>CONTROL</em>'
  ];
  const missing = required.filter((value) => !html.includes(value));
  if (missing.length) throw new Error(`Space dashboard build failed in ${path}: ${missing.join(", ")}`);

  await writeFile(path, html, "utf8");
}

console.log("Space theme upgraded to the same dashboard layout with a cosmic visual system.");
