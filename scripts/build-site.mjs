import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const source = await readFile("index.html", "utf8");

const splineScript = '  <script type="module" src="https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js"></script>\n';
const splineStyles = `
    /* Shared full-page Spline background. */
    .spline-page-bg{
      position:fixed;
      inset:0;
      z-index:1;
      overflow:hidden;
      pointer-events:none;
      background:#020617;
    }
    .spline-page-bg spline-viewer{
      display:block;
      width:100%;
      height:100%;
      min-width:100vw;
      min-height:100vh;
      transform:scale(1.08);
      transform-origin:center;
      filter:saturate(.9) brightness(.7) contrast(1.04);
      transition:filter .45s ease,opacity .45s ease,transform .45s ease;
    }
    .spline-page-shade{
      position:absolute;
      inset:0;
      pointer-events:none;
      background:
        linear-gradient(180deg,rgba(2,6,23,.34),rgba(2,6,23,.64)),
        radial-gradient(circle at 20% 14%,rgba(56,189,248,.18),transparent 34%),
        radial-gradient(circle at 82% 18%,rgba(139,92,246,.14),transparent 32%);
      transition:background .45s ease;
    }
    body[data-theme="network"] .spline-page-bg spline-viewer{
      opacity:.43;
      filter:saturate(.72) brightness(.38) contrast(1.12) hue-rotate(-10deg);
      transform:scale(1.12);
    }
    body[data-theme="network"] .spline-page-shade{
      background:
        linear-gradient(180deg,rgba(1,8,20,.72),rgba(1,13,29,.90)),
        radial-gradient(circle at 12% 8%,rgba(0,153,255,.18),transparent 34%),
        radial-gradient(circle at 86% 12%,rgba(0,229,255,.12),transparent 32%),
        linear-gradient(90deg,rgba(0,22,48,.28),transparent 45%,rgba(0,22,48,.20));
    }
    .space-bg{display:none!important}
    .app-shell{position:relative;z-index:10}
    body:before{opacity:.22}
`;

const networkStyles = `
    /* Network dashboard theme inspired by the supplied control-panel reference. */
    #networkDashboard,.network-hero-copy{display:none}
    body[data-theme="network"]{
      --panel1:rgba(3,18,40,.94);
      --panel2:rgba(2,10,27,.92);
      --accent:0,174,255;
      --accent2:0,229,255;
      background:#010817;
    }
    body[data-theme="network"] .app-shell{
      width:min(1500px,calc(100vw - 38px));
      max-width:none!important;
      display:grid;
      grid-template-columns:minmax(310px,420px) minmax(0,1fr);
      gap:20px;
      padding:22px 0 44px;
    }
    body[data-theme="network"] .app-shell>*{min-width:0;margin-top:0!important}
    body[data-theme="network"] .glass-panel,
    body[data-theme="network"] .pool-card{
      background:
        linear-gradient(145deg,rgba(4,24,52,.96),rgba(2,11,29,.94))!important;
      border:1px solid rgba(43,143,218,.44)!important;
      border-radius:22px!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.07),
        inset 0 0 38px rgba(0,101,196,.035),
        0 0 0 1px rgba(0,151,255,.035),
        0 18px 55px rgba(0,0,0,.30),
        0 0 24px rgba(0,153,255,.08);
      backdrop-filter:blur(24px) saturate(125%);
      -webkit-backdrop-filter:blur(24px) saturate(125%);
    }
    body[data-theme="network"] .glass-panel:after,
    body[data-theme="network"] .pool-card:after{
      content:"";
      position:absolute;
      inset:0;
      border-radius:inherit;
      pointer-events:none;
      background:linear-gradient(90deg,rgba(0,183,255,.72),transparent 25%,transparent 76%,rgba(0,183,255,.38)) top/100% 1px no-repeat;
      opacity:.65;
    }
    body[data-theme="network"] #heroPanel{
      grid-column:1;
      min-height:560px;
      padding:28px!important;
      overflow:hidden;
      border-color:rgba(48,168,255,.62)!important;
      box-shadow:0 0 0 1px rgba(0,166,255,.10),0 0 28px rgba(0,153,255,.16),0 24px 70px rgba(0,0,0,.34)!important;
    }
    body[data-theme="network"] #heroPanel:after{
      background:
        linear-gradient(90deg,rgba(54,195,255,.9),transparent 52%,rgba(0,224,255,.56)) top/100% 2px no-repeat,
        linear-gradient(180deg,transparent 68%,rgba(0,151,255,.08));
    }
    body[data-theme="network"] #heroPanel>.flex{
      height:100%;
      min-height:504px;
      flex-direction:column;
      align-items:stretch;
      justify-content:space-between;
      gap:28px;
    }
    body[data-theme="network"] #heroPanel>.flex>div:first-child{max-width:100%}
    body[data-theme="network"] #heroPanel h1{
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:4px;
      margin-top:22px;
      font-size:clamp(2.7rem,4vw,4.25rem)!important;
      line-height:.98;
      letter-spacing:-.045em;
    }
    body[data-theme="network"] #heroPanel .brand-emoji{font-size:1.05rem;letter-spacing:0;opacity:.75}
    body[data-theme="network"] #heroPanel .brand-title{display:block}
    body[data-theme="network"] #heroPanel .brand-title em{
      display:block;
      margin-top:8px;
      font-style:normal;
      color:#32d8ff;
      text-shadow:0 0 24px rgba(0,204,255,.34);
    }
    body[data-theme="network"] .network-hero-copy{
      display:block;
      margin-top:18px;
      max-width:330px;
      color:#9fb0c8;
      font-size:.94rem;
      line-height:1.75;
    }
    body[data-theme="network"] #heroPanel>.flex>div:last-child{
      width:100%;
      align-items:stretch;
    }
    body[data-theme="network"] #heroPanel .theme-switcher{
      width:100%;
      display:grid;
      grid-template-columns:1fr 1fr;
      padding:5px;
      border-color:rgba(49,137,211,.36);
      background:rgba(1,10,25,.72);
    }
    body[data-theme="network"] #heroPanel .theme-btn{padding:.75rem .65rem;font-size:.82rem}
    body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
      width:100%;
    }
    body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex button{
      min-height:46px;
      padding:11px 12px!important;
      border:1px solid rgba(50,141,215,.45);
      background:linear-gradient(180deg,rgba(8,40,78,.94),rgba(3,20,43,.96))!important;
      color:#f5f9ff;
      border-radius:10px!important;
      font-size:.80rem;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
    }
    body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex button:first-child{
      background:linear-gradient(180deg,#10bdf6,#0676ec)!important;
      border-color:#36d9ff;
      box-shadow:0 0 22px rgba(0,174,255,.30),inset 0 1px 0 rgba(255,255,255,.26);
    }
    body[data-theme="network"] #themeDescription{margin-top:18px}
    body[data-theme="network"] .credit-glass{
      min-width:0;
      width:100%;
      justify-content:flex-start;
      padding:.7rem .95rem;
      border-radius:10px;
      background:rgba(0,13,29,.44);
      border-color:rgba(0,183,255,.18);
    }
    body[data-theme="network"] #networkDashboard{
      display:block;
      grid-column:2;
      min-height:560px;
      position:relative;
      overflow:hidden;
      padding:26px;
      border:1px solid rgba(43,143,218,.44);
      border-radius:22px;
      background:linear-gradient(145deg,rgba(4,24,52,.96),rgba(2,11,29,.94));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 18px 55px rgba(0,0,0,.30),0 0 24px rgba(0,153,255,.08);
    }
    body[data-theme="network"] #networkDashboard:before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      background:linear-gradient(90deg,rgba(54,195,255,.86),transparent 52%,rgba(0,224,255,.50)) top/100% 2px no-repeat;
    }
    .network-section-title{
      margin:0 0 14px;
      color:#e7eefb;
      font-size:.82rem;
      font-weight:800;
      letter-spacing:.035em;
      text-transform:uppercase;
    }
    .network-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
    .network-stat-card{
      min-height:140px;
      padding:18px;
      border:1px solid rgba(51,126,191,.40);
      border-radius:12px;
      background:linear-gradient(145deg,rgba(6,29,61,.78),rgba(2,14,34,.82));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
    }
    .network-stat-icon{
      width:34px;height:34px;display:grid;place-items:center;margin-bottom:16px;
      border-radius:9px;color:#17c8ff;border:1px solid rgba(0,174,255,.32);background:rgba(0,115,255,.08);
    }
    .network-stat-label{color:#e8eef9;font-size:.82rem;font-weight:700}
    .network-stat-value{margin-top:9px;color:white;font-size:1.65rem;font-weight:850;line-height:1}
    .network-stat-note{margin-top:8px;color:#49e38d;font-size:.75rem}
    .network-stat-card:nth-child(2) .network-stat-note{color:#32c9ff}
    .network-stat-card:nth-child(3) .network-stat-note{color:#bd68ff}
    .network-stat-card:nth-child(4) .network-stat-note{color:#aebbd0}
    .network-block{margin-top:22px}
    .network-action-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .network-action{
      min-height:76px;padding:12px;border:1px solid rgba(51,126,191,.42);border-radius:11px;
      background:rgba(2,16,38,.72);color:white;text-align:left;cursor:pointer;transition:.22s;
    }
    .network-action:hover{transform:translateY(-2px);border-color:rgba(36,192,255,.72);box-shadow:0 0 18px rgba(0,174,255,.12)}
    .network-action i{color:#16c8ff;margin-right:7px}
    .network-action strong{display:block;font-size:.78rem}
    .network-action span{display:block;margin-top:6px;color:#8495ad;font-size:.68rem;line-height:1.35}
    .network-config-summary{
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:18px;
      border:1px solid rgba(51,126,191,.40);border-radius:12px;background:rgba(2,15,35,.72);
    }
    .network-config-item{display:grid;grid-template-columns:28px 1fr;column-gap:9px;align-items:start;min-width:0}
    .network-config-item i{grid-row:1/3;color:#13c7ff;margin-top:2px}
    .network-config-item span{color:#91a2b9;font-size:.72rem;white-space:nowrap}
    .network-config-item strong{margin-top:4px;color:white;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .network-status-strip{
      margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:14px;
      padding:12px 14px;border:1px solid rgba(52,135,201,.32);border-radius:10px;background:rgba(1,13,30,.66);
      color:#92a6c1;font-size:.75rem;
    }
    .network-status-strip .ok{display:flex;align-items:center;gap:8px;color:#57e78e}
    .network-status-dot{width:8px;height:8px;border-radius:50%;background:#45ed88;box-shadow:0 0 12px rgba(69,237,136,.72)}
    body[data-theme="network"] #networkScopePanel,
    body[data-theme="network"] #searchInput,
    body[data-theme="network"] #massImportPanel,
    body[data-theme="network"] #resultsGrid{grid-column:1/-1}
    body[data-theme="network"] #networkScopePanel{
      padding:18px;
      border:1px solid rgba(43,143,218,.44);
      border-radius:20px;
      background:linear-gradient(145deg,rgba(4,24,52,.94),rgba(2,11,29,.92));
      box-shadow:0 0 22px rgba(0,153,255,.07);
    }
    body[data-theme="network"] #networkScopePanel>.glass-panel{border-radius:12px!important;min-height:90px}
    body[data-theme="network"] #searchInput{
      border:1px solid rgba(43,143,218,.44)!important;
      border-radius:12px!important;
      background:rgba(2,15,35,.88)!important;
      box-shadow:0 0 20px rgba(0,153,255,.06);
    }
    body[data-theme="network"] #massImportPanel{padding:26px!important}
    body[data-theme="network"] #massImportPanel h2{font-size:1.45rem;color:#f6f9ff}
    body[data-theme="network"] #massImportPanel textarea,
    body[data-theme="network"] #massImportPanel select,
    body[data-theme="network"] #massImportPanel input,
    body[data-theme="network"] .pool-card input{
      border-color:rgba(48,124,190,.42)!important;
      border-radius:10px!important;
      background:rgba(1,13,31,.84)!important;
      color:#dce8f7;
    }
    body[data-theme="network"] #massImportPanel textarea{min-height:190px;line-height:1.65}
    body[data-theme="network"] #bulkGenerateBtn{
      border-radius:9px!important;background:linear-gradient(180deg,#9b32e8,#6720bf)!important;
      border:1px solid rgba(200,111,255,.52);box-shadow:0 0 22px rgba(133,39,216,.18);
    }
    body[data-theme="network"] #resultsGrid{gap:18px}
    body[data-theme="network"] #poolsContainer>.glass-panel,
    body[data-theme="network"] #configPanel{min-height:420px}
    body[data-theme="network"] #configPanel pre{background:rgba(0,10,24,.78)!important;color:#4bf58a!important}
    body[data-theme="network"] .pool-card{position:relative;border-radius:16px!important}
    body[data-theme="network"] button{transition:transform .2s,border-color .2s,box-shadow .2s,background .2s}
    body[data-theme="network"] button:hover{transform:translateY(-1px)}
    @media(max-width:1120px){
      body[data-theme="network"] .app-shell{grid-template-columns:1fr}
      body[data-theme="network"] #heroPanel,
      body[data-theme="network"] #networkDashboard{grid-column:1}
      body[data-theme="network"] #heroPanel{min-height:auto}
      body[data-theme="network"] #heroPanel>.flex{min-height:0}
      .network-stat-grid,.network-action-grid,.network-config-summary{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:768px){
      .spline-page-bg spline-viewer{transform:scale(1.32)}
      .spline-page-shade{background:linear-gradient(180deg,rgba(2,6,23,.42),rgba(2,6,23,.76))}
      body[data-theme="network"] .app-shell{width:calc(100vw - 20px);padding-top:10px;gap:12px}
      body[data-theme="network"] #heroPanel,
      body[data-theme="network"] #networkDashboard,
      body[data-theme="network"] #massImportPanel{padding:20px!important;border-radius:16px!important}
      body[data-theme="network"] #heroPanel h1{font-size:2.65rem!important}
      .network-stat-grid,.network-action-grid,.network-config-summary{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .network-stat-card{min-height:124px;padding:14px}
      .network-stat-value{font-size:1.4rem}
      body[data-theme="network"] #massImportPanel textarea{min-height:140px}
    }
    @media(max-width:460px){
      body[data-theme="network"] #heroPanel>.flex>div:last-child>.flex{grid-template-columns:1fr}
      .network-config-summary{grid-template-columns:1fr}
      .network-action strong{font-size:.74rem}
    }
`;

const splineMarkup = `  <div class="spline-page-bg" aria-hidden="true">
    <spline-viewer url="https://prod.spline.design/JjxXgOnkzKI104Ve/scene.splinecode"></spline-viewer>
    <div class="spline-page-shade"></div>
  </div>\n`;

const networkDashboard = `    <section id="networkDashboard" aria-label="Network automation overview">
      <h2 class="network-section-title">Overview</h2>
      <div class="network-stat-grid">
        <article class="network-stat-card"><div class="network-stat-icon"><i class="fas fa-server"></i></div><div class="network-stat-label">Total Pools</div><div id="networkTotalPools" class="network-stat-value">0</div><div class="network-stat-note">Active workspace</div></article>
        <article class="network-stat-card"><div class="network-stat-icon"><i class="fas fa-circle-nodes"></i></div><div class="network-stat-label">IP Addresses</div><div id="networkIpAddresses" class="network-stat-value">0</div><div class="network-stat-note">Configured</div></article>
        <article class="network-stat-card"><div class="network-stat-icon"><i class="fas fa-chart-pie"></i></div><div class="network-stat-label">Utilization</div><div id="networkUtilization" class="network-stat-value">0%</div><div class="network-stat-note">Valid pools</div></article>
        <article class="network-stat-card"><div class="network-stat-icon"><i class="fas fa-clock-rotate-left"></i></div><div class="network-stat-label">Last Sync</div><div id="networkLastSync" class="network-stat-value">Now</div><div class="network-stat-note">Status: OK</div></article>
      </div>
      <div class="network-block">
        <h2 class="network-section-title">Quick Actions</h2>
        <div class="network-action-grid">
          <button class="network-action" onclick="networkAddPool()"><strong><i class="fas fa-square-plus"></i>Create New Pool</strong><span>Define host and scope</span></button>
          <button class="network-action" onclick="networkOpenImport()"><strong><i class="fas fa-file-import"></i>Import MAC Pool</strong><span>Open bulk import tools</span></button>
          <button class="network-action" onclick="networkExportConfig()"><strong><i class="fas fa-download"></i>Export Configuration</strong><span>Generate Cisco config</span></button>
          <button class="network-action" onclick="networkViewOutput()"><strong><i class="fas fa-terminal"></i>View Output</strong><span>Inspect generated commands</span></button>
        </div>
      </div>
      <div class="network-block">
        <h2 class="network-section-title">Configuration Summary</h2>
        <div class="network-config-summary">
          <div class="network-config-item"><i class="fas fa-database"></i><span>DNS Server</span><strong id="networkDnsSummary">10.20.100.2</strong></div>
          <div class="network-config-item"><i class="fas fa-diagram-project"></i><span>Subnet Mask</span><strong id="networkSubnetSummary">255.255.255.0</strong></div>
          <div class="network-config-item"><i class="fas fa-route"></i><span>Default Gateway</span><strong id="networkGatewaySummary">10.36.2.1</strong></div>
          <div class="network-config-item"><i class="fas fa-network-wired"></i><span>Interface</span><strong id="networkInterfaceSummary">PO1</strong></div>
        </div>
      </div>
      <div class="network-status-strip"><span class="ok"><span class="network-status-dot"></span>System ready · All services operational</span><span id="networkActivityText">Workspace initialized</span></div>
    </section>\n`;

const networkScript = `  <script>
    (() => {
      const byId = (id) => document.getElementById(id);
      const setText = (id, value) => { const el = byId(id); if (el) el.textContent = value; };
      const scrollToId = (id) => byId(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const nowLabel = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      function refreshNetworkDashboard(activity = 'Workspace synchronized') {
        const list = typeof pools !== 'undefined' && Array.isArray(pools) ? pools : [];
        const valid = typeof getPoolStatus === 'function' ? list.filter((pool) => getPoolStatus(pool).isValid).length : 0;
        const configuredIps = list.filter((pool) => pool && pool.ip).length;
        const utilization = list.length ? Math.round((valid / list.length) * 100) : 0;
        const first = list[0] || {};
        const dns = byId('dnsInput')?.value?.trim() || '10.20.100.2 10.26.100.2';
        setText('networkTotalPools', String(list.length));
        setText('networkIpAddresses', String(configuredIps));
        setText('networkUtilization', utilization + '%');
        setText('networkLastSync', nowLabel());
        setText('networkDnsSummary', dns.split(/\\s+/)[0] || '10.20.100.2');
        setText('networkSubnetSummary', first.subnet || '255.255.255.0');
        setText('networkGatewaySummary', first.gateway || '10.36.2.1');
        setText('networkInterfaceSummary', first.interfaceName || 'PO1');
        setText('networkActivityText', activity);
      }

      window.networkAddPool = () => {
        if (typeof addPool === 'function') addPool();
        refreshNetworkDashboard('New pool added · ' + nowLabel());
        setTimeout(() => scrollToId('poolsContainer'), 80);
      };
      window.networkOpenImport = () => scrollToId('massImportPanel');
      window.networkExportConfig = () => {
        if (typeof exportCfg === 'function') exportCfg();
        refreshNetworkDashboard('Configuration export requested · ' + nowLabel());
      };
      window.networkViewOutput = () => scrollToId('configPanel');
      window.refreshNetworkDashboard = refreshNetworkDashboard;

      window.addEventListener('load', () => {
        refreshNetworkDashboard('Network console ready · ' + nowLabel());
        const container = byId('poolsContainer');
        if (container) new MutationObserver(() => refreshNetworkDashboard()).observe(container, { childList: true, subtree: true });
        byId('dnsInput')?.addEventListener('input', () => refreshNetworkDashboard('DNS settings updated · ' + nowLabel()));
        new MutationObserver(() => refreshNetworkDashboard('Theme changed · ' + nowLabel())).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
      });
    })();
  </script>\n`;

let html = source;

if (!html.includes("@splinetool/viewer@1.12.98")) {
  html = html.replace(
    '  <script src="https://cdn.tailwindcss.com"></script>\n',
    `  <script src="https://cdn.tailwindcss.com"></script>\n${splineScript}`
  );
}

html = html.replace("  </style>", `${splineStyles}${networkStyles}  </style>`);

if (!html.includes('class="spline-page-bg"')) {
  html = html.replace(
    '<body class="text-white min-h-screen p-6" data-theme="space">\n',
    `<body class="text-white min-h-screen p-6" data-theme="space">\n${splineMarkup}`
  );
}

html = html.replace(
  '    <div class="glass-panel rounded-3xl p-8 shadow-2xl">',
  '    <div id="heroPanel" class="glass-panel rounded-3xl p-8 shadow-2xl">'
);
html = html.replace(
  '<h1 class="text-4xl md:text-5xl font-black tracking-tight">🌐 DHCP Automation PRO</h1>',
  '<h1 class="text-4xl md:text-5xl font-black tracking-tight"><span class="brand-emoji">🌐 iPDHCP AUTO</span><span class="brand-title">DHCP Automation <em>PRO</em></span></h1><p class="network-hero-copy">Effortlessly manage DHCP pools, automate MAC/IP assignments, and export Cisco-ready configurations from one control center.</p>'
);
html = html.replace(
  '    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="glass-panel',
  '    <div id="networkScopePanel" class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="glass-panel'
);
html = html.replace(
  '    <div class="glass-panel bg-gray-900 rounded-3xl p-6"><div class="flex flex-wrap justify-between items-center mb-4 gap-4">',
  '    <div id="massImportPanel" class="glass-panel bg-gray-900 rounded-3xl p-6"><div class="flex flex-wrap justify-between items-center mb-4 gap-4">'
);
html = html.replace(
  '    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div id="poolsContainer"',
  '    <div id="resultsGrid" class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div id="poolsContainer"'
);
html = html.replace(
  '<div class="glass-panel bg-black/80 border border-gray-800 rounded-3xl overflow-hidden">',
  '<div id="configPanel" class="glass-panel bg-black/80 border border-gray-800 rounded-3xl overflow-hidden">'
);
html = html.replace(
  '    <div id="networkScopePanel"',
  `${networkDashboard}    <div id="networkScopePanel"`
);
html = html.replaceAll('Network 3D Interface • v3.3', 'Network Automation Console • v3.5');
html = html.replace('</body>', `${networkScript}</body>`);

const required = [
  "@splinetool/viewer@1.12.98",
  "JjxXgOnkzKI104Ve/scene.splinecode",
  'id="heroPanel"',
  'id="networkDashboard"',
  'id="massImportPanel"',
  'id="resultsGrid"',
  'id="configPanel"',
  "Network Automation Console",
  "refreshNetworkDashboard"
];
const missing = required.filter((value) => !html.includes(value));
if (missing.length) throw new Error(`Build failed, missing: ${missing.join(", ")}`);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) throw new Error(`Duplicate ids: ${[...new Set(duplicates)].join(", ")}`);

for (const directory of ["public", "dist"]) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, html, "utf8");
}

console.log("Build passed: Network theme replaced with the neon DHCP control-center dashboard.");
