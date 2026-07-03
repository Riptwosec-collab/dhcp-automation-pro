import { readFile, writeFile } from "node:fs/promises";

const MARKER = "Black Gold Reference Layout";

const styles = `
    /* ${MARKER} */
    body[data-theme="space"] .app-shell{
      display:grid!important;
      grid-template-columns:minmax(310px,420px) minmax(0,1fr)!important;
      gap:20px!important;
    }
    body[data-theme="space"] #heroPanel{grid-column:1;grid-row:1/span 4}
    body[data-theme="space"] #networkDashboard{grid-column:2;grid-row:1}
    body[data-theme="space"] #networkScopePanel{grid-column:2;grid-row:2}
    body[data-theme="space"] #searchInput{grid-column:2;grid-row:3}
    body[data-theme="space"] #massImportPanel{grid-column:2;grid-row:4}
    body[data-theme="space"] #resultsGrid{display:contents!important}
    body[data-theme="space"] #configPanel{
      grid-column:1/-1!important;
      grid-row:5!important;
      min-height:0!important;
      border-radius:22px!important;
      border:1px solid rgba(239,185,67,.62)!important;
      background:
        linear-gradient(145deg,rgba(18,14,7,.98),rgba(3,4,7,.98))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,240,190,.14),
        inset 0 0 48px rgba(239,185,67,.035),
        0 0 0 1px rgba(255,216,115,.04),
        0 20px 65px rgba(0,0,0,.54),
        0 0 34px rgba(239,185,67,.12)!important;
      overflow:hidden!important;
      position:relative;
    }
    body[data-theme="space"] #configPanel:before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      background:
        linear-gradient(90deg,transparent,rgba(255,216,115,.95),transparent) top/100% 2px no-repeat,
        linear-gradient(90deg,rgba(239,185,67,.42),transparent 12%,transparent 88%,rgba(239,185,67,.42)) bottom/100% 1px no-repeat;
    }
    body[data-theme="space"] #configPanel>.flex:first-child{
      min-height:112px;
      padding:26px 32px!important;
      border-color:rgba(239,185,67,.30)!important;
      background:linear-gradient(180deg,rgba(22,18,11,.96),rgba(8,8,8,.92))!important;
    }
    body[data-theme="space"] #configPanel>.flex:first-child h2{
      font-size:clamp(1.6rem,2.6vw,2.55rem)!important;
      letter-spacing:-.02em;
      color:#fffaf0!important;
      text-shadow:0 0 22px rgba(255,216,115,.12);
    }
    body[data-theme="space"] #configPanel>.flex:first-child h2 i{
      display:inline-grid;
      place-items:center;
      width:54px;
      height:54px;
      margin-right:14px;
      color:#FFD873!important;
      border:1px solid rgba(239,185,67,.56);
      border-radius:12px;
      background:linear-gradient(145deg,rgba(239,185,67,.13),rgba(0,0,0,.18));
      box-shadow:0 0 20px rgba(239,185,67,.12),inset 0 1px 0 rgba(255,240,190,.12);
    }
    body[data-theme="space"] #configPanel>.flex:first-child button{
      min-width:220px;
      min-height:58px;
      border-radius:12px!important;
      border:1px solid #FFF0BE!important;
      color:#171006!important;
      font-size:1.12rem!important;
      font-weight:900!important;
      background:linear-gradient(135deg,#FFF0BE 0%,#FFD873 42%,#EFB943 72%,#9f6812 100%)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 0 0 3px rgba(239,185,67,.12),0 0 30px rgba(239,185,67,.28)!important;
    }
    body[data-theme="space"] #configPanel>.p-4{
      min-height:96px;
      padding:22px 32px!important;
      gap:34px!important;
      border-color:rgba(239,185,67,.28)!important;
      background:linear-gradient(180deg,rgba(12,11,9,.96),rgba(4,4,4,.96))!important;
    }
    body[data-theme="space"] #configPanel>.p-4 label{
      display:flex;
      align-items:center;
      gap:13px;
      font-size:1rem!important;
      color:#f9f4e8!important;
    }
    body[data-theme="space"] #configPanel>.p-4 input[type="checkbox"]{
      width:27px;height:27px;
      accent-color:#EFB943!important;
      filter:drop-shadow(0 0 7px rgba(239,185,67,.34));
    }
    body[data-theme="space"] #configOutput{
      min-height:280px!important;
      padding:28px 32px!important;
      color:#8ff5ad!important;
      background:
        linear-gradient(180deg,rgba(2,5,4,.98),rgba(1,3,2,.98))!important;
      border-top:1px solid rgba(239,185,67,.15);
      box-shadow:inset 0 0 40px rgba(72,255,126,.025)!important;
    }
    body[data-theme="space"] #poolsContainer{
      grid-column:1/-1!important;
      grid-row:7!important;
    }
    body[data-theme="space"] #spaceValidationRow{
      grid-column:1/-1!important;
      grid-row:6!important;
      display:grid!important;
      grid-template-columns:minmax(320px,.9fr) minmax(0,1.55fr)!important;
      gap:20px!important;
    }
    body[data-theme="space"] #spaceValidationRow>.glass-panel{
      min-height:250px;
      padding:28px!important;
      border-radius:22px!important;
      border:1px solid rgba(239,185,67,.56)!important;
      background:
        radial-gradient(circle at 15% 30%,rgba(239,185,67,.10),transparent 32%),
        linear-gradient(145deg,rgba(18,15,9,.98),rgba(5,5,5,.98))!important;
      box-shadow:inset 0 1px 0 rgba(255,240,190,.11),0 18px 55px rgba(0,0,0,.44),0 0 26px rgba(239,185,67,.09)!important;
    }
    body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child{
      display:flex;
      flex-direction:column;
      justify-content:center;
      padding-left:150px!important;
      position:relative;
    }
    body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child:before{
      content:"✓";
      position:absolute;
      left:38px;
      top:50%;
      width:86px;
      height:98px;
      transform:translateY(-50%);
      display:grid;
      place-items:center;
      color:#FFD873;
      font-size:2.6rem;
      font-weight:900;
      clip-path:polygon(50% 0,92% 19%,84% 76%,50% 100%,16% 76%,8% 19%);
      background:linear-gradient(145deg,rgba(255,216,115,.23),rgba(75,47,6,.28));
      border:1px solid rgba(255,216,115,.58);
      filter:drop-shadow(0 0 16px rgba(239,185,67,.26));
    }
    body[data-theme="space"] #spaceValidationRow h3{
      color:#FFD873!important;
      font-size:1.55rem!important;
      line-height:1.2;
      text-shadow:0 0 18px rgba(239,185,67,.18);
    }
    body[data-theme="space"] #spaceValidationRow p{
      margin-top:16px!important;
      color:#e9e4d8!important;
      font-size:1rem!important;
      line-height:1.75;
    }
    body[data-theme="space"] #spaceValidationRow>.glass-panel:last-child{
      display:grid!important;
      grid-template-columns:180px minmax(0,1fr)!important;
      align-items:center!important;
      column-gap:24px!important;
    }
    body[data-theme="space"] #spaceValidationRow>.glass-panel:last-child>span{
      width:auto!important;
      color:#FFD873!important;
      font-size:1.35rem!important;
    }
    body[data-theme="space"] #spaceValidationRow #dnsInput{
      min-height:82px;
      padding:20px 28px!important;
      border-radius:16px!important;
      border:1px solid rgba(239,185,67,.58)!important;
      color:#fffaf0!important;
      font-size:1.45rem!important;
      letter-spacing:.04em;
      background:linear-gradient(180deg,rgba(34,30,22,.94),rgba(18,17,14,.96))!important;
      box-shadow:inset 0 1px 0 rgba(255,240,190,.08),0 0 22px rgba(239,185,67,.08)!important;
    }
    body[data-theme="space"] .credit-wrap{width:100%!important;margin-top:18px!important}
    body[data-theme="space"] .credit-glass{
      min-width:0!important;
      width:100%!important;
      min-height:82px;
      justify-content:flex-start!important;
      padding:18px 24px 18px 76px!important;
      border-radius:18px!important;
      border:1px solid rgba(255,216,115,.54)!important;
      background:
        linear-gradient(145deg,rgba(255,240,190,.08),transparent 35%),
        linear-gradient(145deg,rgba(28,21,8,.96),rgba(5,5,5,.96))!important;
      box-shadow:inset 0 1px 0 rgba(255,240,190,.18),inset 0 0 30px rgba(239,185,67,.04),0 0 0 3px rgba(239,185,67,.05),0 16px 38px rgba(0,0,0,.45),0 0 26px rgba(239,185,67,.14)!important;
    }
    body[data-theme="space"] .credit-glass:before{
      content:"</>"!important;
      inset:auto!important;
      left:18px!important;
      top:50%!important;
      width:42px!important;
      height:42px!important;
      transform:translateY(-50%)!important;
      display:grid!important;
      place-items:center!important;
      border:1px solid rgba(255,216,115,.5)!important;
      border-radius:10px!important;
      color:#FFD873!important;
      font:800 .95rem/1 ui-monospace,monospace!important;
      background:rgba(239,185,67,.07)!important;
      opacity:1!important;
      box-shadow:0 0 16px rgba(239,185,67,.12)!important;
    }
    body[data-theme="space"] .credit-text{
      color:#FFD873!important;
      font-size:1rem!important;
      font-weight:700!important;
      text-shadow:0 0 14px rgba(239,185,67,.18)!important;
    }
    @media(max-width:1050px){
      body[data-theme="space"] .app-shell{display:block!important}
      body[data-theme="space"] #spaceValidationRow{display:grid!important;grid-template-columns:1fr!important;margin-top:20px}
      body[data-theme="space"] #configPanel{margin-top:20px}
    }
    @media(max-width:640px){
      body[data-theme="space"] #configPanel>.flex:first-child{padding:18px!important;gap:14px}
      body[data-theme="space"] #configPanel>.flex:first-child button{min-width:0;min-height:48px;font-size:.92rem!important}
      body[data-theme="space"] #configPanel>.p-4{padding:16px!important;gap:18px!important}
      body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child{padding:118px 20px 24px!important;text-align:center}
      body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child:before{left:50%;top:24px;transform:translateX(-50%)}
      body[data-theme="space"] #spaceValidationRow>.glass-panel:last-child{grid-template-columns:1fr!important;gap:14px!important}
      body[data-theme="space"] #spaceValidationRow #dnsInput{font-size:1rem!important;min-height:60px}
      body[data-theme="space"] .credit-glass{min-height:68px;padding-left:68px!important}
    }
`;

for (const directory of ["public", "dist"]) {
  const file = `${directory}/index.html`;
  let html = await readFile(file, "utf8");
  if (!html.includes(MARKER)) html = html.replace("</style>", `${styles}\n</style>`);
  html = html.replace(
    '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">',
    '<div id="spaceValidationRow" class="grid grid-cols-1 lg:grid-cols-3 gap-4">'
  );
  html = html.replace(
    '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div id="poolsContainer"',
    '<div id="resultsGrid" class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div id="poolsContainer"'
  );
  html = html.replace(
    '<div class="glass-panel bg-black/80 border border-gray-800 rounded-3xl overflow-hidden">',
    '<div id="configPanel" class="glass-panel bg-black/80 border border-gray-800 rounded-3xl overflow-hidden">'
  );
  for (const token of [MARKER,'id="spaceValidationRow"','id="resultsGrid"','id="configPanel"']) {
    if (!html.includes(token)) throw new Error(`Black-gold layout injection failed in ${file}: ${token}`);
  }
  await writeFile(file, html, "utf8");
}

console.log("Black-gold reference layout applied.");
