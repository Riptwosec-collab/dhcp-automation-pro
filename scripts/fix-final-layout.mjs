import { readFile, writeFile } from "node:fs/promises";

const MARKER = "Final Responsive Layout Cleanup";

const css = `
/* ${MARKER} */
html,body{max-width:100%!important;overflow-x:hidden!important}
.app-shell,.app-shell>*{min-width:0!important;max-width:100%!important}

/* Remove the oversized empty pool column entirely. */
#poolsContainer:empty{display:none!important}
#resultsGrid:has(#poolsContainer:empty){display:block!important}
#resultsGrid:has(#poolsContainer:empty) #configPanel{width:100%!important;max-width:100%!important}

/* Stable Network header and credit layout. */
body[data-theme="network"] #heroPanel,
body[data-theme="network"] .app-shell>div:first-of-type{min-width:0!important;overflow:visible!important}
body[data-theme="network"] .credit-wrap{display:block!important;width:100%!important;max-width:100%!important;margin-top:14px!important;overflow:visible!important}
body[data-theme="network"] .credit-glass{position:relative!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:64px!important;padding:12px 18px 12px 66px!important;border-radius:18px!important;overflow:hidden!important}
body[data-theme="network"] .credit-glass::before{content:"</>"!important;position:absolute!important;left:14px!important;top:50%!important;inset:auto!important;width:38px!important;height:38px!important;transform:translateY(-50%)!important;display:grid!important;place-items:center!important;border:1px solid rgba(83,231,255,.6)!important;border-radius:10px!important;color:#53E7FF!important;background:rgba(0,183,255,.08)!important;font:800 .82rem/1 ui-monospace,monospace!important;opacity:1!important;z-index:2!important}
body[data-theme="network"] .credit-glass .layer{display:none!important}
body[data-theme="network"] .credit-text{position:relative!important;z-index:2!important;display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important;color:#53E7FF!important;font-size:clamp(.76rem,1vw,.96rem)!important;line-height:1.35!important;font-weight:750!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;text-align:left!important}

/* Prevent all major panels and controls from overflowing. */
body[data-theme="network"] .glass-panel,
body[data-theme="network"] #configPanel,
body[data-theme="network"] #networkValidationRow,
body[data-theme="network"] #massImportPanel{min-width:0!important;max-width:100%!important}
body[data-theme="network"] #configPanel>.flex:first-child{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:16px!important}
body[data-theme="network"] #configPanel>.flex:first-child h2{flex:1 1 280px!important;min-width:0!important;overflow-wrap:anywhere!important}
body[data-theme="network"] #configPanel>.flex:first-child button{flex:0 0 auto!important;max-width:100%!important}
body[data-theme="network"] #configPanel>.p-4{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:14px 24px!important}
body[data-theme="network"] #configOutput{width:100%!important;max-width:100%!important;min-height:220px!important;overflow:auto!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
body[data-theme="network"] #networkValidationRow{grid-template-columns:minmax(0,.95fr) minmax(0,1.55fr)!important;align-items:stretch!important}
body[data-theme="network"] #networkValidationRow>*{min-width:0!important}
body[data-theme="network"] #dnsInput{width:100%!important;min-width:0!important;max-width:100%!important}

@media(max-width:1100px){
  body[data-theme="network"] #networkValidationRow{grid-template-columns:1fr!important}
}
@media(max-width:760px){
  body[data-theme="network"] #configPanel>.flex:first-child{align-items:stretch!important}
  body[data-theme="network"] #configPanel>.flex:first-child h2{flex-basis:100%!important}
  body[data-theme="network"] #configPanel>.flex:first-child button{width:100%!important;min-width:0!important}
  body[data-theme="network"] #networkValidationRow>.glass-panel:last-child{grid-template-columns:1fr!important;gap:12px!important}
}
@media(max-width:640px){
  body{padding:12px!important}
  body[data-theme="network"] .credit-glass{min-height:58px!important;padding:10px 12px 10px 56px!important;border-radius:15px!important}
  body[data-theme="network"] .credit-glass::before{left:10px!important;width:34px!important;height:34px!important}
  body[data-theme="network"] .credit-text{font-size:.74rem!important}
  body[data-theme="network"] #configPanel>.flex:first-child,
  body[data-theme="network"] #configPanel>.p-4{padding:14px!important}
  body[data-theme="network"] #configPanel>.p-4 label{width:100%!important}
}
`;

for (const dir of ["public", "dist"]) {
  const file = `${dir}/index.html`;
  let html = await readFile(file, "utf8");

  /* Do not render an empty placeholder card. The container remains available for real pools. */
  html = html.replace(
    /c\.innerHTML=html\|\|'<div class="glass-panel bg-gray-900 rounded-3xl p-8 text-center text-gray-400 border border-gray-800">กด Add Pool หรือใส่ข้อมูลใน Mass Pool Import เพื่อเริ่ม Generate<\/div>'/,
    "c.innerHTML=html"
  );

  if (!html.includes(MARKER)) {
    html = html.replace("</style>", `${css}\n</style>`);
  }

  if (!html.includes(MARKER)) throw new Error(`Final layout CSS injection failed in ${file}`);
  if (html.includes("กด Add Pool หรือใส่ข้อมูลใน Mass Pool Import เพื่อเริ่ม Generate</div>")) {
    throw new Error(`Empty pool placeholder still exists in ${file}`);
  }

  await writeFile(file, html, "utf8");
}

console.log("Final responsive layout cleanup applied and empty pool panel removed.");
