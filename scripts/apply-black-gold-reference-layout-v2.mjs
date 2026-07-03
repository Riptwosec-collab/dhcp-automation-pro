import { readFile, writeFile } from "node:fs/promises";

const MARKER = "Black Gold Reference Layout V2";
const css = `
/* ${MARKER} */
body[data-theme="space"] .credit-glass{width:100%!important;min-height:78px!important;justify-content:flex-start!important;padding:18px 22px 18px 76px!important;border-radius:18px!important;border:1px solid rgba(255,216,115,.58)!important;background:linear-gradient(145deg,rgba(255,240,190,.08),transparent 34%),linear-gradient(145deg,rgba(28,21,8,.97),rgba(5,5,5,.97))!important;box-shadow:inset 0 1px 0 rgba(255,240,190,.18),0 0 0 3px rgba(239,185,67,.05),0 16px 38px rgba(0,0,0,.45),0 0 28px rgba(239,185,67,.16)!important}
body[data-theme="space"] .credit-glass:before{content:"</>"!important;position:absolute!important;left:18px!important;top:50%!important;inset:auto!important;width:42px!important;height:42px!important;transform:translateY(-50%)!important;display:grid!important;place-items:center!important;border:1px solid rgba(255,216,115,.55)!important;border-radius:10px!important;color:#FFD873!important;font:800 .95rem/1 ui-monospace,monospace!important;background:rgba(239,185,67,.08)!important;opacity:1!important;box-shadow:0 0 16px rgba(239,185,67,.14)!important}
body[data-theme="space"] .credit-text{color:#FFD873!important;font-size:1rem!important;font-weight:750!important;text-shadow:0 0 14px rgba(239,185,67,.2)!important}
body[data-theme="space"] #configPanel{grid-column:1/-1!important;min-height:0!important;border-radius:22px!important;border:1px solid rgba(239,185,67,.62)!important;background:linear-gradient(145deg,rgba(18,14,7,.98),rgba(3,4,7,.98))!important;box-shadow:inset 0 1px 0 rgba(255,240,190,.14),0 20px 65px rgba(0,0,0,.54),0 0 34px rgba(239,185,67,.12)!important;overflow:hidden!important}
body[data-theme="space"] #configPanel>.flex:first-child{min-height:112px;padding:26px 32px!important;border-color:rgba(239,185,67,.3)!important;background:linear-gradient(180deg,rgba(22,18,11,.96),rgba(8,8,8,.92))!important}
body[data-theme="space"] #configPanel>.flex:first-child h2{font-size:clamp(1.6rem,2.6vw,2.55rem)!important;color:#fffaf0!important}
body[data-theme="space"] #configPanel>.flex:first-child h2 i{display:inline-grid;place-items:center;width:54px;height:54px;margin-right:14px;color:#FFD873!important;border:1px solid rgba(239,185,67,.56);border-radius:12px;background:rgba(239,185,67,.08);box-shadow:0 0 20px rgba(239,185,67,.12)}
body[data-theme="space"] #configPanel>.flex:first-child button{min-width:220px;min-height:58px;border-radius:12px!important;border:1px solid #FFF0BE!important;color:#171006!important;font-size:1.12rem!important;font-weight:900!important;background:linear-gradient(135deg,#FFF0BE,#FFD873 42%,#EFB943 72%,#9f6812)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 0 0 3px rgba(239,185,67,.12),0 0 30px rgba(239,185,67,.28)!important}
body[data-theme="space"] #configPanel>.p-4{min-height:92px;padding:22px 32px!important;gap:34px!important;border-color:rgba(239,185,67,.28)!important;background:linear-gradient(180deg,rgba(12,11,9,.96),rgba(4,4,4,.96))!important}
body[data-theme="space"] #configPanel>.p-4 label{display:flex;align-items:center;gap:13px;font-size:1rem!important;color:#f9f4e8!important}
body[data-theme="space"] #configPanel>.p-4 input[type="checkbox"]{width:27px;height:27px;accent-color:#EFB943!important}
body[data-theme="space"] #configOutput{min-height:280px!important;padding:28px 32px!important;color:#8ff5ad!important;background:linear-gradient(180deg,rgba(2,5,4,.98),rgba(1,3,2,.98))!important}
body[data-theme="space"] #spaceValidationRow{display:grid!important;grid-template-columns:minmax(320px,.9fr) minmax(0,1.55fr)!important;gap:20px!important}
body[data-theme="space"] #spaceValidationRow>.glass-panel{min-height:230px;padding:28px!important;border-radius:22px!important;border:1px solid rgba(239,185,67,.56)!important;background:radial-gradient(circle at 15% 30%,rgba(239,185,67,.1),transparent 32%),linear-gradient(145deg,rgba(18,15,9,.98),rgba(5,5,5,.98))!important;box-shadow:inset 0 1px 0 rgba(255,240,190,.11),0 18px 55px rgba(0,0,0,.44),0 0 26px rgba(239,185,67,.09)!important}
body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child{display:flex;flex-direction:column;justify-content:center;padding-left:145px!important;position:relative}
body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child:before{content:"✓";position:absolute;left:38px;top:50%;width:84px;height:96px;transform:translateY(-50%);display:grid;place-items:center;color:#FFD873;font-size:2.5rem;font-weight:900;clip-path:polygon(50% 0,92% 19%,84% 76%,50% 100%,16% 76%,8% 19%);background:linear-gradient(145deg,rgba(255,216,115,.23),rgba(75,47,6,.28));filter:drop-shadow(0 0 16px rgba(239,185,67,.26))}
body[data-theme="space"] #spaceValidationRow h3{color:#FFD873!important;font-size:1.5rem!important}
body[data-theme="space"] #spaceValidationRow p{margin-top:14px!important;color:#e9e4d8!important;font-size:1rem!important;line-height:1.7}
body[data-theme="space"] #spaceValidationRow>.glass-panel:last-child{display:grid!important;grid-template-columns:180px minmax(0,1fr)!important;align-items:center!important;column-gap:24px!important}
body[data-theme="space"] #spaceValidationRow>.glass-panel:last-child>span{width:auto!important;color:#FFD873!important;font-size:1.3rem!important}
body[data-theme="space"] #dnsInput{min-height:78px;padding:20px 28px!important;border-radius:16px!important;border:1px solid rgba(239,185,67,.58)!important;color:#fffaf0!important;font-size:1.4rem!important;background:linear-gradient(180deg,rgba(34,30,22,.94),rgba(18,17,14,.96))!important;box-shadow:inset 0 1px 0 rgba(255,240,190,.08),0 0 22px rgba(239,185,67,.08)!important}
@media(max-width:900px){body[data-theme="space"] #spaceValidationRow{grid-template-columns:1fr!important}body[data-theme="space"] #configPanel>.flex:first-child button{min-width:0}}
@media(max-width:640px){body[data-theme="space"] #configPanel>.flex:first-child{padding:18px!important}body[data-theme="space"] #configPanel>.p-4{padding:16px!important;gap:18px!important}body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child{padding:112px 20px 24px!important;text-align:center}body[data-theme="space"] #spaceValidationRow>.glass-panel:first-child:before{left:50%;top:20px;transform:translateX(-50%)}body[data-theme="space"] #spaceValidationRow>.glass-panel:last-child{grid-template-columns:1fr!important;gap:14px!important}body[data-theme="space"] #dnsInput{font-size:1rem!important;min-height:58px}}
`;

for (const dir of ["public", "dist"]) {
  const file = `${dir}/index.html`;
  let html = await readFile(file, "utf8");
  if (!html.includes(MARKER)) html = html.replace("</style>", `${css}\n</style>`);

  if (!html.includes('id="spaceValidationRow"')) {
    html = html.replace(/<div([^>]*class="[^"]*grid-cols-1[^"]*lg:grid-cols-3[^"]*"[^>]*)>(?=<div[^>]*><h3[^>]*>[^<]*<i[^>]*fa-shield-halved)/, '<div id="spaceValidationRow"$1>');
  }
  if (!html.includes('id="resultsGrid"')) {
    html = html.replace(/<div([^>]*class="[^"]*grid-cols-1[^"]*lg:grid-cols-2[^"]*gap-6[^"]*"[^>]*)>(?=<div id="poolsContainer")/, '<div id="resultsGrid"$1>');
  }
  if (!html.includes('id="configPanel"')) {
    html = html.replace(/<div([^>]*class="[^"]*glass-panel[^"]*bg-black\/80[^"]*"[^>]*)>(?=<div class="flex justify-between items-center p-5)/, '<div id="configPanel"$1>');
  }

  for (const token of [MARKER,'id="spaceValidationRow"','id="configPanel"']) {
    if (!html.includes(token)) throw new Error(`Black-gold V2 injection failed in ${file}: ${token}`);
  }
  await writeFile(file, html, "utf8");
}

console.log("Black-gold reference layout V2 applied.");
