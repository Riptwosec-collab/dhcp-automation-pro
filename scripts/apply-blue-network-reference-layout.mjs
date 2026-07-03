import { readFile, writeFile } from "node:fs/promises";

const MARKER = "Blue Network Reference Layout";

const css = `
/* ${MARKER} */
body[data-theme="network"] .credit-wrap{width:100%!important;margin-top:18px!important}
body[data-theme="network"] .credit-glass{min-width:0!important;width:100%!important;min-height:82px!important;justify-content:flex-start!important;padding:18px 24px 18px 78px!important;border-radius:22px!important;border:1px solid rgba(0,183,255,.55)!important;background:linear-gradient(145deg,rgba(255,255,255,.04),transparent 34%),linear-gradient(145deg,rgba(2,18,44,.96),rgba(1,8,20,.96))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.18),inset 0 0 30px rgba(0,183,255,.04),0 0 0 3px rgba(0,183,255,.05),0 16px 38px rgba(0,0,0,.42),0 0 28px rgba(0,183,255,.16)!important}
body[data-theme="network"] .credit-glass:before{content:"</>"!important;position:absolute!important;left:18px!important;top:50%!important;inset:auto!important;width:42px!important;height:42px!important;transform:translateY(-50%)!important;display:grid!important;place-items:center!important;border:1px solid rgba(83,231,255,.62)!important;border-radius:12px!important;color:#53E7FF!important;font:800 .95rem/1 ui-monospace,monospace!important;background:rgba(0,183,255,.08)!important;opacity:1!important;box-shadow:0 0 18px rgba(0,183,255,.18)!important}
body[data-theme="network"] .credit-text{color:#53E7FF!important;font-size:1rem!important;font-weight:750!important;text-shadow:0 0 16px rgba(0,183,255,.24)!important}
body[data-theme="network"] #configPanel{grid-column:1/-1!important;min-height:0!important;border-radius:22px!important;border:1px solid rgba(0,183,255,.55)!important;background:linear-gradient(145deg,rgba(2,16,38,.98),rgba(1,8,20,.98))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.12),inset 0 0 40px rgba(0,183,255,.03),0 20px 65px rgba(0,0,0,.52),0 0 32px rgba(0,183,255,.12)!important;overflow:hidden!important;position:relative}
body[data-theme="network"] #configPanel:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(83,231,255,.95),transparent) top/100% 2px no-repeat,linear-gradient(90deg,rgba(0,183,255,.36),transparent 12%,transparent 88%,rgba(0,183,255,.36)) bottom/100% 1px no-repeat}
body[data-theme="network"] #configPanel>.flex:first-child{min-height:112px;padding:26px 32px!important;border-color:rgba(0,183,255,.26)!important;background:linear-gradient(180deg,rgba(3,19,45,.96),rgba(2,10,24,.92))!important}
body[data-theme="network"] #configPanel>.flex:first-child h2{font-size:clamp(1.6rem,2.6vw,2.55rem)!important;color:#f4fbff!important;letter-spacing:-.02em}
body[data-theme="network"] #configPanel>.flex:first-child h2 i{display:inline-grid;place-items:center;width:54px;height:54px;margin-right:14px;color:#53E7FF!important;border:1px solid rgba(0,183,255,.54);border-radius:12px;background:rgba(0,183,255,.08);box-shadow:0 0 20px rgba(0,183,255,.12)}
body[data-theme="network"] #configPanel>.flex:first-child button{min-width:220px;min-height:58px;border-radius:12px!important;border:1px solid #53E7FF!important;color:#04111d!important;font-size:1.12rem!important;font-weight:900!important;background:linear-gradient(135deg,#bdf6ff 0%,#53E7FF 38%,#00B7FF 72%,#176BFF 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 0 0 3px rgba(0,183,255,.12),0 0 30px rgba(0,183,255,.28)!important}
body[data-theme="network"] #configPanel>.p-4{min-height:92px;padding:22px 32px!important;gap:34px!important;border-color:rgba(0,183,255,.24)!important;background:linear-gradient(180deg,rgba(2,12,28,.96),rgba(1,7,18,.96))!important}
body[data-theme="network"] #configPanel>.p-4 label{display:flex;align-items:center;gap:13px;font-size:1rem!important;color:#eefaff!important}
body[data-theme="network"] #configPanel>.p-4 input[type="checkbox"]{width:27px;height:27px;accent-color:#00B7FF!important;filter:drop-shadow(0 0 8px rgba(0,183,255,.32))}
body[data-theme="network"] #configOutput{min-height:280px!important;padding:28px 32px!important;color:#8ef7c1!important;background:linear-gradient(180deg,rgba(1,7,12,.98),rgba(1,4,8,.98))!important;border-top:1px solid rgba(0,183,255,.12);box-shadow:inset 0 0 40px rgba(0,183,255,.02)!important}
body[data-theme="network"] #networkValidationRow{display:grid!important;grid-template-columns:minmax(320px,.95fr) minmax(0,1.55fr)!important;gap:20px!important}
body[data-theme="network"] #networkValidationRow>.glass-panel{min-height:230px;padding:28px!important;border-radius:22px!important;border:1px solid rgba(0,183,255,.52)!important;background:radial-gradient(circle at 15% 30%,rgba(0,183,255,.08),transparent 32%),linear-gradient(145deg,rgba(3,18,42,.98),rgba(1,8,20,.98))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.09),0 18px 55px rgba(0,0,0,.42),0 0 26px rgba(0,183,255,.09)!important}
body[data-theme="network"] #networkValidationRow>.glass-panel:first-child{display:flex;flex-direction:column;justify-content:center;padding-left:145px!important;position:relative}
body[data-theme="network"] #networkValidationRow>.glass-panel:first-child:before{content:"✓";position:absolute;left:38px;top:50%;width:84px;height:96px;transform:translateY(-50%);display:grid;place-items:center;color:#53E7FF;font-size:2.5rem;font-weight:900;clip-path:polygon(50% 0,92% 19%,84% 76%,50% 100%,16% 76%,8% 19%);background:linear-gradient(145deg,rgba(83,231,255,.20),rgba(23,107,255,.18));filter:drop-shadow(0 0 18px rgba(0,183,255,.24))}
body[data-theme="network"] #networkValidationRow h3{color:#53E7FF!important;font-size:1.5rem!important}
body[data-theme="network"] #networkValidationRow p{margin-top:14px!important;color:#deedf8!important;font-size:1rem!important;line-height:1.7}
body[data-theme="network"] #networkValidationRow>.glass-panel:last-child{display:grid!important;grid-template-columns:180px minmax(0,1fr)!important;align-items:center!important;column-gap:24px!important}
body[data-theme="network"] #networkValidationRow>.glass-panel:last-child>span{width:auto!important;color:#32d8ff!important;font-size:1.3rem!important}
body[data-theme="network"] #dnsInput{min-height:78px;padding:20px 28px!important;border-radius:16px!important;border:1px solid rgba(0,183,255,.55)!important;color:#f4fbff!important;font-size:1.4rem!important;background:linear-gradient(180deg,rgba(4,20,42,.94),rgba(2,11,26,.96))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.08),0 0 22px rgba(0,183,255,.08)!important}
@media(max-width:900px){body[data-theme="network"] #networkValidationRow{grid-template-columns:1fr!important}body[data-theme="network"] #configPanel>.flex:first-child button{min-width:0}}
@media(max-width:640px){body[data-theme="network"] #configPanel>.flex:first-child{padding:18px!important}body[data-theme="network"] #configPanel>.p-4{padding:16px!important;gap:18px!important}body[data-theme="network"] #networkValidationRow>.glass-panel:first-child{padding:112px 20px 24px!important;text-align:center}body[data-theme="network"] #networkValidationRow>.glass-panel:first-child:before{left:50%;top:20px;transform:translateX(-50%)}body[data-theme="network"] #networkValidationRow>.glass-panel:last-child{grid-template-columns:1fr!important;gap:14px!important}body[data-theme="network"] #dnsInput{font-size:1rem!important;min-height:58px}}
`;

for (const dir of ["public", "dist"]) {
  const file = `${dir}/index.html`;
  let html = await readFile(file, "utf8");

  if (!html.includes(MARKER)) {
    html = html.replace("</style>", `${css}\n</style>`);
  }

  if (!html.includes('id="networkValidationRow"')) {
    html = html.replace(
      /<div([^>]*class="[^"]*grid-cols-1[^"]*lg:grid-cols-3[^"]*"[^>]*)>(?=<div[^>]*><h3[^>]*>[\s\S]*?Validate ก่อน Generate)/,
      '<div id="networkValidationRow"$1>'
    );
  }

  if (!html.includes('id="configPanel"')) {
    html = html.replace(
      /<div([^>]*class="[^"]*glass-panel[^"]*bg-black\/80[^"]*"[^>]*)>(?=<div class="flex justify-between items-center p-5)/,
      '<div id="configPanel"$1>'
    );
  }

  for (const token of [MARKER, 'id="networkValidationRow"', 'id="configPanel"']) {
    if (!html.includes(token)) {
      throw new Error(`Blue network layout injection failed in ${file}: ${token}`);
    }
  }

  await writeFile(file, html, "utf8");
}

console.log("Blue network reference layout applied.");
