import { readFile, writeFile } from "node:fs/promises";

const MARKER = "Blue Network Reference Layout";

const css = `
/* ${MARKER} */
body[data-theme="network"] *,body[data-theme="network"] *::before,body[data-theme="network"] *::after{box-sizing:border-box}
body[data-theme="network"] .app-shell,body[data-theme="network"] .app-shell>*{min-width:0}
body[data-theme="network"] .glass-panel,body[data-theme="network"] .credit-wrap,body[data-theme="network"] #configPanel,body[data-theme="network"] #networkValidationRow{max-width:100%}

body[data-theme="network"] .credit-wrap{width:100%!important;margin-top:18px!important;overflow:visible!important}
body[data-theme="network"] .credit-glass{position:relative!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-width:0!important;min-height:78px!important;padding:16px 20px 16px 72px!important;border-radius:20px!important;border:1px solid rgba(0,183,255,.55)!important;background:linear-gradient(145deg,rgba(255,255,255,.04),transparent 34%),linear-gradient(145deg,rgba(2,18,44,.96),rgba(1,8,20,.96))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.18),inset 0 0 30px rgba(0,183,255,.04),0 0 0 3px rgba(0,183,255,.05),0 16px 38px rgba(0,0,0,.42),0 0 28px rgba(0,183,255,.16)!important;overflow:hidden!important}
body[data-theme="network"] .credit-glass::before{content:"</>"!important;position:absolute!important;left:16px!important;top:50%!important;inset:auto!important;width:42px!important;height:42px!important;transform:translateY(-50%)!important;display:grid!important;place-items:center!important;border:1px solid rgba(83,231,255,.62)!important;border-radius:12px!important;color:#53E7FF!important;font:800 .9rem/1 ui-monospace,monospace!important;background:rgba(0,183,255,.08)!important;opacity:1!important;box-shadow:0 0 18px rgba(0,183,255,.18)!important;z-index:1}
body[data-theme="network"] .credit-text{display:block!important;min-width:0!important;max-width:100%!important;color:#53E7FF!important;font-size:clamp(.78rem,1.05vw,.98rem)!important;line-height:1.35!important;font-weight:750!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;text-align:left!important;text-shadow:0 0 16px rgba(0,183,255,.24)!important}

body[data-theme="network"] #configPanel{grid-column:1/-1!important;min-width:0!important;min-height:0!important;border-radius:22px!important;border:1px solid rgba(0,183,255,.55)!important;background:linear-gradient(145deg,rgba(2,16,38,.98),rgba(1,8,20,.98))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.12),inset 0 0 40px rgba(0,183,255,.03),0 20px 65px rgba(0,0,0,.52),0 0 32px rgba(0,183,255,.12)!important;overflow:hidden!important;position:relative}
body[data-theme="network"] #configPanel::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(83,231,255,.95),transparent) top/100% 2px no-repeat,linear-gradient(90deg,rgba(0,183,255,.36),transparent 12%,transparent 88%,rgba(0,183,255,.36)) bottom/100% 1px no-repeat}
body[data-theme="network"] #configPanel>.flex:first-child{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:18px!important;min-height:104px;padding:22px 26px!important;border-color:rgba(0,183,255,.26)!important;background:linear-gradient(180deg,rgba(3,19,45,.96),rgba(2,10,24,.92))!important}
body[data-theme="network"] #configPanel>.flex:first-child h2{display:flex!important;align-items:center!important;min-width:0!important;flex:1 1 320px!important;font-size:clamp(1.35rem,2.4vw,2.25rem)!important;line-height:1.15!important;color:#f4fbff!important;letter-spacing:-.02em;overflow-wrap:anywhere}
body[data-theme="network"] #configPanel>.flex:first-child h2 i{flex:0 0 50px!important;display:inline-grid;place-items:center;width:50px;height:50px;margin-right:14px;color:#53E7FF!important;border:1px solid rgba(0,183,255,.54);border-radius:12px;background:rgba(0,183,255,.08);box-shadow:0 0 20px rgba(0,183,255,.12)}
body[data-theme="network"] #configPanel>.flex:first-child button{flex:0 0 auto!important;min-width:180px;min-height:54px;padding:0 24px!important;border-radius:12px!important;border:1px solid #53E7FF!important;color:#04111d!important;font-size:1rem!important;font-weight:900!important;background:linear-gradient(135deg,#bdf6ff 0%,#53E7FF 38%,#00B7FF 72%,#176BFF 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 0 0 3px rgba(0,183,255,.12),0 0 30px rgba(0,183,255,.28)!important}
body[data-theme="network"] #configPanel>.p-4{display:flex!important;align-items:center!important;flex-wrap:wrap!important;min-height:84px;padding:18px 26px!important;gap:18px 28px!important;border-color:rgba(0,183,255,.24)!important;background:linear-gradient(180deg,rgba(2,12,28,.96),rgba(1,7,18,.96))!important}
body[data-theme="network"] #configPanel>.p-4 label{display:flex!important;align-items:center!important;min-width:0!important;gap:11px;font-size:clamp(.88rem,1.1vw,1rem)!important;line-height:1.35!important;color:#eefaff!important;white-space:normal!important}
body[data-theme="network"] #configPanel>.p-4 input[type="checkbox"]{flex:0 0 24px;width:24px;height:24px;accent-color:#00B7FF!important;filter:drop-shadow(0 0 8px rgba(0,183,255,.32))}
body[data-theme="network"] #configOutput{min-height:240px!important;max-width:100%!important;padding:24px 26px!important;overflow:auto!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;color:#8ef7c1!important;background:linear-gradient(180deg,rgba(1,7,12,.98),rgba(1,4,8,.98))!important;border-top:1px solid rgba(0,183,255,.12);box-shadow:inset 0 0 40px rgba(0,183,255,.02)!important}

body[data-theme="network"] #networkValidationRow{display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(0,1.55fr)!important;gap:20px!important;align-items:stretch!important}
body[data-theme="network"] #networkValidationRow>.glass-panel{min-width:0!important;min-height:210px;padding:24px!important;border-radius:22px!important;border:1px solid rgba(0,183,255,.52)!important;background:radial-gradient(circle at 15% 30%,rgba(0,183,255,.08),transparent 32%),linear-gradient(145deg,rgba(3,18,42,.98),rgba(1,8,20,.98))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.09),0 18px 55px rgba(0,0,0,.42),0 0 26px rgba(0,183,255,.09)!important;overflow:hidden!important}
body[data-theme="network"] #networkValidationRow>.glass-panel:first-child{display:flex!important;flex-direction:column!important;justify-content:center!important;padding-left:126px!important;position:relative!important}
body[data-theme="network"] #networkValidationRow>.glass-panel:first-child::before{content:"✓";position:absolute;left:28px;top:50%;width:76px;height:88px;transform:translateY(-50%);display:grid;place-items:center;color:#53E7FF;font-size:2.2rem;font-weight:900;clip-path:polygon(50% 0,92% 19%,84% 76%,50% 100%,16% 76%,8% 19%);background:linear-gradient(145deg,rgba(83,231,255,.20),rgba(23,107,255,.18));filter:drop-shadow(0 0 18px rgba(0,183,255,.24))}
body[data-theme="network"] #networkValidationRow h3{min-width:0!important;color:#53E7FF!important;font-size:clamp(1.15rem,1.8vw,1.5rem)!important;line-height:1.2!important;overflow-wrap:anywhere}
body[data-theme="network"] #networkValidationRow p{min-width:0!important;margin-top:12px!important;color:#deedf8!important;font-size:clamp(.88rem,1vw,1rem)!important;line-height:1.65!important;overflow-wrap:anywhere}
body[data-theme="network"] #networkValidationRow>.glass-panel:last-child{display:grid!important;grid-template-columns:minmax(130px,180px) minmax(0,1fr)!important;align-items:center!important;column-gap:20px!important}
body[data-theme="network"] #networkValidationRow>.glass-panel:last-child>span{width:auto!important;min-width:0!important;color:#32d8ff!important;font-size:clamp(1rem,1.5vw,1.28rem)!important;overflow-wrap:anywhere}
body[data-theme="network"] #dnsInput{width:100%!important;min-width:0!important;min-height:68px;padding:16px 20px!important;border-radius:16px!important;border:1px solid rgba(0,183,255,.55)!important;color:#f4fbff!important;font-size:clamp(.95rem,1.6vw,1.3rem)!important;letter-spacing:.02em!important;background:linear-gradient(180deg,rgba(4,20,42,.94),rgba(2,11,26,.96))!important;box-shadow:inset 0 1px 0 rgba(170,230,255,.08),0 0 22px rgba(0,183,255,.08)!important}

@media(max-width:1100px){body[data-theme="network"] #networkValidationRow{grid-template-columns:1fr!important}body[data-theme="network"] #networkValidationRow>.glass-panel:last-child{grid-template-columns:160px minmax(0,1fr)!important}}
@media(max-width:760px){body[data-theme="network"] #configPanel>.flex:first-child{align-items:stretch!important}body[data-theme="network"] #configPanel>.flex:first-child h2{flex-basis:100%!important}body[data-theme="network"] #configPanel>.flex:first-child button{width:100%!important;min-width:0!important}body[data-theme="network"] #networkValidationRow>.glass-panel:last-child{grid-template-columns:1fr!important;gap:12px!important}}
@media(max-width:640px){body[data-theme="network"] .credit-glass{min-height:68px!important;padding:13px 14px 13px 62px!important;border-radius:16px!important}body[data-theme="network"] .credit-glass::before{left:12px!important;width:38px!important;height:38px!important}body[data-theme="network"] .credit-text{font-size:.78rem!important}body[data-theme="network"] #configPanel>.flex:first-child{padding:16px!important}body[data-theme="network"] #configPanel>.flex:first-child h2 i{flex-basis:42px!important;width:42px;height:42px;margin-right:10px}body[data-theme="network"] #configPanel>.p-4{padding:14px 16px!important;gap:14px!important}body[data-theme="network"] #configPanel>.p-4 label{width:100%!important}body[data-theme="network"] #configOutput{min-height:200px!important;padding:18px 16px!important}body[data-theme="network"] #networkValidationRow>.glass-panel{padding:20px!important;min-height:0!important}body[data-theme="network"] #networkValidationRow>.glass-panel:first-child{padding:106px 20px 22px!important;text-align:center}body[data-theme="network"] #networkValidationRow>.glass-panel:first-child::before{left:50%;top:18px;transform:translateX(-50%)}body[data-theme="network"] #dnsInput{min-height:56px!important;font-size:.95rem!important}}
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
