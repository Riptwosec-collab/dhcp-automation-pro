import { readFile, writeFile } from "node:fs/promises";

const MARKER = "UI Proportions V2";

const css = `
/* ${MARKER} */
:root{--ui-radius-xl:26px;--ui-radius-lg:20px;--ui-radius-md:16px;--ui-gap-xl:24px;--ui-gap-lg:18px;--ui-gap-md:14px}
html,body{max-width:100%!important;overflow-x:hidden!important}
body{letter-spacing:0!important}
.app-shell{max-width:1280px!important;margin-inline:auto!important}
.app-shell,.app-shell>*{min-width:0!important;max-width:100%!important}
.glass-panel,.pool-card,#configPanel,#massImportPanel,#networkValidationRow,#poolsContainer{min-width:0!important;max-width:100%!important}
.app-shell>.glass-panel:first-child{padding:28px!important;border-radius:30px!important}
.app-shell>.glass-panel:first-child .flex{align-items:flex-start!important;gap:24px!important}
#themeBadge{margin-bottom:14px!important}
h1{line-height:1.02!important;letter-spacing:-.03em!important}
.credit-wrap{display:block!important;width:100%!important;max-width:560px!important;margin-top:16px!important}
.credit-glass{position:relative!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:14px!important;width:100%!important;min-width:0!important;min-height:74px!important;padding:14px 18px 14px 76px!important;border-radius:22px!important;overflow:hidden!important}
.credit-glass:before{content:"</>"!important;position:absolute!important;left:16px!important;top:50%!important;transform:translateY(-50%)!important;width:42px!important;height:42px!important;display:grid!important;place-items:center!important;border-radius:12px!important;font:800 .9rem/1 ui-monospace,monospace!important;z-index:2!important}
.credit-glass .layer{display:none!important}
.credit-text{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important;font-size:clamp(.84rem,1vw,.98rem)!important;line-height:1.35!important;font-weight:750!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:left!important}
.theme-switcher{padding:.5rem!important}.theme-btn{min-height:44px!important;padding:.78rem 1rem!important;font-size:.92rem!important}
.app-shell>.glass-panel:first-child .flex.flex-col.items-end{gap:14px!important}.app-shell>.glass-panel:first-child .flex.flex-wrap.gap-3{gap:12px!important}
.app-shell>.glass-panel:first-child .flex.flex-wrap.gap-3 button{min-height:48px!important;padding:0 18px!important;border-radius:16px!important;font-weight:700!important}
#networkValidationRow,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4{display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(0,1.55fr)!important;gap:20px!important;align-items:stretch!important}
#networkValidationRow>*,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>*{min-width:0!important}
#networkValidationRow>.glass-panel:first-child,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:first-child{position:relative!important;display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:210px!important;padding:28px 26px 28px 124px!important;border-radius:26px!important;overflow:hidden!important}
#networkValidationRow>.glass-panel:first-child:before,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:first-child:before{content:"🛡"!important;position:absolute!important;left:30px!important;top:50%!important;transform:translateY(-50%)!important;font-size:3rem!important;opacity:.95!important;line-height:1!important}
#networkValidationRow>.glass-panel:first-child h3,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:first-child h3{font-size:clamp(1.25rem,1.9vw,1.8rem)!important;line-height:1.25!important;margin:0!important;letter-spacing:-.02em!important}
#networkValidationRow>.glass-panel:first-child p,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:first-child p{margin-top:12px!important;font-size:clamp(.92rem,1vw,1rem)!important;line-height:1.7!important;max-width:34ch!important}
#networkValidationRow>.glass-panel:last-child,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:last-child{display:grid!important;grid-template-columns:170px minmax(0,1fr)!important;align-items:center!important;gap:18px!important;min-height:210px!important;padding:28px!important;border-radius:26px!important}
#networkValidationRow>.glass-panel:last-child span,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:last-child span{font-size:clamp(1rem,1.3vw,1.25rem)!important;font-weight:800!important}
#dnsInput{width:100%!important;min-height:68px!important;padding:16px 18px!important;border-radius:18px!important;font-size:clamp(1rem,1.45vw,1.3rem)!important}
#searchInput{min-height:58px!important;border-radius:18px!important;font-size:1rem!important;padding:0 18px!important}
#massImportPanel,.app-shell>.glass-panel.bg-gray-900.rounded-3xl.p-6{padding:24px!important;border-radius:28px!important}
#massImportPanel h2,.app-shell>.glass-panel.bg-gray-900.rounded-3xl.p-6 h2{font-size:clamp(1.35rem,1.8vw,1.8rem)!important;line-height:1.2!important}
#bulkDeviceName{min-height:46px!important;border-radius:14px!important}
#bulkMac,#bulkIp,#bulkGateway,#bulkVlan{min-height:220px!important;border-radius:18px!important;padding:16px!important;line-height:1.55!important;font-size:.98rem!important}
#bulkGenerateBtn{min-height:54px!important;padding:0 22px!important;border-radius:16px!important;font-weight:800!important}
#resultsGrid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.08fr)!important;gap:24px!important;align-items:start!important}
#poolsContainer{display:flex!important;flex-direction:column!important;gap:18px!important}.pool-card{padding:22px!important;border-radius:26px!important}.pool-card .grid{gap:14px!important}.pool-card input{min-height:48px!important;border-radius:14px!important}
#configPanel{border-radius:28px!important;overflow:hidden!important}
#configPanel>.flex:first-child{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:16px!important;padding:22px 24px!important}
#configPanel>.flex:first-child h2{display:flex!important;align-items:center!important;gap:12px!important;flex:1 1 320px!important;min-width:0!important;font-size:clamp(1.45rem,2.2vw,2.5rem)!important;line-height:1.12!important}
#configPanel>.flex:first-child button{min-height:54px!important;padding:0 24px!important;border-radius:16px!important;font-size:1rem!important;font-weight:800!important}
#configPanel>.p-4{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:14px 28px!important;padding:18px 24px!important}
#configPanel>.p-4 label{display:flex!important;align-items:center!important;gap:10px!important;min-height:32px!important;font-size:.98rem!important}
#configOutput{min-height:420px!important;padding:22px 24px!important;font-size:.96rem!important;line-height:1.65!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
#message{padding:14px 18px!important}
#poolsContainer:empty{display:none!important}#resultsGrid:has(#poolsContainer:empty){grid-template-columns:1fr!important}
input,textarea,select,button{font-family:inherit!important}input,textarea,select{border-radius:14px!important}
@media(max-width:1100px){#networkValidationRow,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4,#resultsGrid{grid-template-columns:1fr!important}}
@media(max-width:760px){.app-shell>.glass-panel:first-child{padding:20px!important}.app-shell>.glass-panel:first-child .flex{gap:18px!important}.app-shell>.glass-panel:first-child .flex.flex-wrap.gap-3 button{width:100%!important}#networkValidationRow>.glass-panel:first-child,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:first-child{padding:118px 20px 22px!important;text-align:center!important}#networkValidationRow>.glass-panel:first-child:before,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:first-child:before{left:50%!important;top:20px!important;transform:translateX(-50%)!important}#networkValidationRow>.glass-panel:first-child p,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:first-child p{max-width:none!important}#networkValidationRow>.glass-panel:last-child,.app-shell>.grid.grid-cols-1.lg\\:grid-cols-3.gap-4>.glass-panel:last-child{grid-template-columns:1fr!important}#configPanel>.flex:first-child button{width:100%!important}}
@media(max-width:640px){body{padding:12px!important}h1{font-size:2rem!important}.credit-glass{min-height:62px!important;padding:10px 12px 10px 58px!important;border-radius:16px!important}.credit-glass:before{left:12px!important;width:34px!important;height:34px!important;font-size:.75rem!important}.credit-text{font-size:.74rem!important}#bulkMac,#bulkIp,#bulkGateway,#bulkVlan{min-height:170px!important}#configOutput{min-height:280px!important;padding:18px!important;font-size:.9rem!important}}
`;

for (const dir of ["public", "dist"]) {
  const file = `${dir}/index.html`;
  let html = await readFile(file, "utf8");
  html = html.replace(/c\.innerHTML=html\|\|'<div class="glass-panel bg-gray-900 rounded-3xl p-8 text-center text-gray-400 border border-gray-800">กด Add Pool หรือใส่ข้อมูลใน Mass Pool Import เพื่อเริ่ม Generate<\/div>'/, "c.innerHTML=html");
  if (!html.includes('id="resultsGrid"')) html = html.replace(/<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">/, '<div id="resultsGrid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">');
  if (!html.includes(MARKER)) html = html.replace("</style>", `${css}\n</style>`);
  await writeFile(file, html, "utf8");
}

console.log("UI proportions v2 applied.");
