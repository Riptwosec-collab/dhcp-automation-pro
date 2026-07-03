import { readFile, writeFile } from "node:fs/promises";

const MARKER = "Layout Runtime And Developer Credit V4";

const css = `
/* ${MARKER} */
html,body{max-width:100%!important;overflow-x:hidden!important}
body.layout-v4{padding:18px!important}
body.layout-v4 *{box-sizing:border-box}
.layout-v4 #networkDashboard{display:none!important}
.layout-v4 .layout-v4-shell{display:grid!important;grid-template-columns:minmax(300px,340px) minmax(0,1fr)!important;gap:18px!important;align-items:start!important;width:min(1560px,100%)!important;max-width:1560px!important;margin:0 auto!important}
.layout-v4 .layout-v4-shell>*{min-width:0!important;max-width:100%!important}
.layout-v4 .layout-v4-side{grid-column:1!important;position:sticky!important;top:18px!important;align-self:start!important;width:100%!important;max-height:calc(100vh - 36px)!important;overflow:auto!important;padding:24px!important;border-radius:26px!important}
.layout-v4 .layout-v4-main{grid-column:2!important;display:grid!important;gap:16px!important;min-width:0!important}
.layout-v4 .layout-v4-top{display:grid!important;grid-template-columns:minmax(300px,.88fr) minmax(0,1.55fr)!important;gap:16px!important;align-items:stretch!important}
.layout-v4 .layout-v4-top>*{min-width:0!important;height:100%!important}
.layout-v4 .layout-v4-results{display:grid!important;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important;gap:16px!important;align-items:start!important}
.layout-v4 .layout-v4-results.no-pools{grid-template-columns:1fr!important}
.layout-v4 .layout-v4-results.no-pools #poolsContainer,.layout-v4 #poolsContainer:empty{display:none!important}
.layout-v4 .layout-v4-results.no-pools #configPanel{grid-column:1!important;width:100%!important}

/* Developer badge — angular black/gold command-frame matching the supplied reference. */
.layout-v4 .layout-v4-side .credit-wrap{display:block!important;width:100%!important;max-width:none!important;margin:18px 0 0!important;overflow:visible!important}
.layout-v4 .layout-v4-side .credit-glass{--credit-a:var(--theme2-rgb);--credit-b:var(--theme-rgb);position:relative!important;isolation:isolate!important;display:grid!important;grid-template-columns:58px minmax(0,1fr)!important;align-items:center!important;gap:18px!important;width:100%!important;min-width:0!important;min-height:88px!important;padding:14px 22px 14px 18px!important;border:1px solid rgba(var(--credit-a),.62)!important;border-radius:22px!important;background:linear-gradient(120deg,rgba(var(--credit-a),.12),transparent 28%,rgba(255,255,255,.025) 50%,transparent 72%),linear-gradient(145deg,rgba(14,12,8,.98),rgba(3,3,3,.98))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.20),inset 0 0 24px rgba(var(--credit-b),.08),0 0 0 4px rgba(var(--credit-b),.055),0 12px 30px rgba(0,0,0,.52),0 0 24px rgba(var(--credit-b),.28)!important;clip-path:polygon(0 18px,18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px))!important;overflow:hidden!important}
.layout-v4 .layout-v4-side .credit-glass::before{content:"</>"!important;position:static!important;inset:auto!important;transform:none!important;width:54px!important;height:54px!important;display:grid!important;place-items:center!important;border:1px solid rgba(var(--credit-a),.78)!important;border-radius:15px!important;color:rgb(var(--credit-a))!important;background:linear-gradient(145deg,rgba(var(--credit-a),.16),rgba(var(--credit-b),.055))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.20),0 0 20px rgba(var(--credit-b),.30)!important;font:900 1rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;text-shadow:0 0 12px rgba(var(--credit-a),.72)!important;z-index:3!important}
.layout-v4 .layout-v4-side .credit-glass::after{content:""!important;position:absolute!important;inset:6px!important;border:1px solid rgba(var(--credit-a),.20)!important;border-radius:17px!important;clip-path:inherit!important;pointer-events:none!important;box-shadow:inset 0 0 20px rgba(var(--credit-b),.08)!important;z-index:1!important}
.layout-v4 .layout-v4-side .credit-glass .layer.one{display:block!important;position:absolute!important;left:82px!important;top:17px!important;bottom:17px!important;width:1px!important;border-radius:2px!important;background:linear-gradient(180deg,transparent,rgba(var(--credit-a),.72),transparent)!important;box-shadow:0 0 10px rgba(var(--credit-b),.48)!important;z-index:2!important}
.layout-v4 .layout-v4-side .credit-glass .layer.two{display:block!important;position:absolute!important;right:22px!important;top:12px!important;width:36px!important;height:5px!important;background:radial-gradient(circle,rgba(var(--credit-a),.96) 0 1.5px,transparent 2px) 0 0/9px 5px repeat-x!important;filter:drop-shadow(0 0 5px rgba(var(--credit-b),.75))!important;opacity:.9!important;z-index:2!important}
.layout-v4 .layout-v4-side .credit-text{position:relative!important;display:block!important;width:100%!important;min-width:0!important;margin:0!important;color:rgb(var(--credit-a))!important;font-size:clamp(.88rem,1.08vw,1rem)!important;line-height:1.35!important;font-weight:800!important;letter-spacing:.01em!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:left!important;text-shadow:0 0 14px rgba(var(--credit-b),.40)!important;z-index:3!important}
body[data-theme="network"].layout-v4 .layout-v4-side .credit-glass{background:linear-gradient(120deg,rgba(83,231,255,.11),transparent 28%,rgba(255,255,255,.025) 50%,transparent 72%),linear-gradient(145deg,rgba(2,18,40,.98),rgba(1,7,18,.98))!important}

.layout-v4 .layout-v4-side .theme-switcher{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;width:100%!important;margin-top:18px!important;padding:5px!important}
.layout-v4 .layout-v4-side .theme-btn{width:100%!important;min-width:0!important;min-height:42px!important;padding:8px 10px!important;font-size:.82rem!important;white-space:nowrap!important}
.layout-v4 .layout-v4-side #guideMenuBtn{width:100%!important;min-height:46px!important;margin-top:12px!important}
.layout-v4 .layout-v4-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;margin-top:14px!important}
.layout-v4 .layout-v4-actions button{width:100%!important;min-width:0!important;min-height:44px!important;padding:9px 10px!important;font-size:.78rem!important;white-space:normal!important}
.layout-v4 .layout-v4-actions button:last-child:nth-child(odd){grid-column:1/-1!important}

.layout-v4 .layout-v4-validate,.layout-v4 .layout-v4-dns{min-width:0!important;min-height:190px!important;padding:24px!important;border-radius:22px!important;overflow:hidden!important}
.layout-v4 .layout-v4-validate{display:flex!important;flex-direction:column!important;justify-content:center!important}
.layout-v4 .layout-v4-validate::before,.layout-v4 .layout-v4-validate::after{content:none!important;display:none!important}
.layout-v4 .layout-v4-validate h3{display:flex!important;align-items:center!important;gap:13px!important;min-width:0!important;margin:0!important;font-size:clamp(1.16rem,1.55vw,1.5rem)!important;line-height:1.24!important;overflow-wrap:anywhere!important}
.layout-v4 .layout-v4-validate h3 i{flex:0 0 50px!important;width:50px!important;height:50px!important;display:grid!important;place-items:center!important;margin:0!important;border-radius:14px!important;font-size:1.35rem!important;background:rgba(var(--theme-rgb),.11)!important;border:1px solid rgba(var(--theme-rgb),.42)!important}
.layout-v4 .layout-v4-validate p{margin:14px 0 0 63px!important;max-width:36ch!important;font-size:.93rem!important;line-height:1.65!important;overflow-wrap:anywhere!important}
.layout-v4 .layout-v4-dns{display:grid!important;grid-template-columns:minmax(145px,185px) minmax(0,1fr)!important;align-items:center!important;gap:20px!important}
.layout-v4 .layout-v4-dns>span{width:auto!important;min-width:0!important;font-size:clamp(1rem,1.25vw,1.22rem)!important;font-weight:800!important;overflow-wrap:anywhere!important}
.layout-v4 .layout-v4-dns #dnsInput{width:100%!important;min-width:0!important;min-height:66px!important;padding:15px 18px!important;border-radius:16px!important;font-size:clamp(.96rem,1.28vw,1.18rem)!important}
.layout-v4 #searchInput{width:100%!important;min-width:0!important;min-height:56px!important;padding:0 18px!important;border-radius:16px!important;font-size:.96rem!important}
.layout-v4 .layout-v4-import{padding:22px!important;border-radius:22px!important}
.layout-v4 .layout-v4-import h2{font-size:clamp(1.25rem,1.6vw,1.58rem)!important}
.layout-v4 .layout-v4-import .grid:has(textarea){display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}
.layout-v4 .layout-v4-import textarea{width:100%!important;min-width:0!important;min-height:210px!important;padding:14px!important;border-radius:15px!important;font-size:.92rem!important;line-height:1.55!important;resize:vertical!important}
.layout-v4 .layout-v4-import select{min-height:44px!important}
.layout-v4 .layout-v4-import button{min-height:48px!important}
.layout-v4 #poolsContainer{min-width:0!important;display:flex!important;flex-direction:column!important;gap:16px!important}
.layout-v4 .pool-card{min-width:0!important;padding:20px!important;border-radius:20px!important}
.layout-v4 .pool-card input{width:100%!important;min-width:0!important;min-height:46px!important}
.layout-v4 #configPanel{min-width:0!important;width:100%!important;border-radius:22px!important;overflow:hidden!important}
.layout-v4 #configPanel>.flex:first-child{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:14px!important;min-height:82px!important;padding:18px 22px!important}
.layout-v4 #configPanel>.flex:first-child h2{display:flex!important;align-items:center!important;gap:12px!important;flex:1 1 300px!important;min-width:0!important;margin:0!important;font-size:clamp(1.3rem,2vw,2rem)!important;overflow-wrap:anywhere!important}
.layout-v4 #configPanel>.flex:first-child button{flex:0 0 auto!important;min-width:150px!important;min-height:48px!important;padding:0 20px!important}
.layout-v4 #configPanel>.p-4{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:12px 24px!important;min-height:66px!important;padding:14px 22px!important}
.layout-v4 #configPanel>.p-4 label{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important;font-size:.92rem!important}
.layout-v4 #configOutput{width:100%!important;min-width:0!important;min-height:250px!important;max-height:520px!important;padding:20px 22px!important;overflow:auto!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;font-size:.92rem!important;line-height:1.6!important}

@media(max-width:1180px){.layout-v4 .layout-v4-shell{grid-template-columns:minmax(275px,300px) minmax(0,1fr)!important;gap:16px!important}.layout-v4 .layout-v4-top{grid-template-columns:minmax(270px,.9fr) minmax(0,1.4fr)!important}.layout-v4 .layout-v4-import .grid:has(textarea){grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:900px){body.layout-v4{padding:14px!important}.layout-v4 .layout-v4-shell{grid-template-columns:1fr!important}.layout-v4 .layout-v4-side{grid-column:1!important;position:relative!important;top:auto!important;max-height:none!important}.layout-v4 .layout-v4-main{grid-column:1!important}.layout-v4 .layout-v4-top,.layout-v4 .layout-v4-results{grid-template-columns:1fr!important}.layout-v4 .layout-v4-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important}.layout-v4 .layout-v4-actions button:last-child:nth-child(odd){grid-column:auto!important}}
@media(max-width:640px){body.layout-v4{padding:10px!important}.layout-v4 .layout-v4-shell,.layout-v4 .layout-v4-main{gap:12px!important}.layout-v4 .layout-v4-side{padding:18px!important}.layout-v4 .layout-v4-side .credit-glass{grid-template-columns:48px minmax(0,1fr)!important;gap:14px!important;min-height:76px!important;padding:11px 15px!important;border-radius:18px!important}.layout-v4 .layout-v4-side .credit-glass::before{width:46px!important;height:46px!important}.layout-v4 .layout-v4-side .credit-glass .layer.one{left:69px!important}.layout-v4 .layout-v4-side .credit-text{font-size:.80rem!important}.layout-v4 .layout-v4-actions{grid-template-columns:1fr!important}.layout-v4 .layout-v4-validate,.layout-v4 .layout-v4-dns{min-height:0!important;padding:20px!important}.layout-v4 .layout-v4-validate p{margin-left:0!important;max-width:none!important}.layout-v4 .layout-v4-dns{grid-template-columns:1fr!important;gap:12px!important}.layout-v4 .layout-v4-import{padding:18px!important}.layout-v4 .layout-v4-import .grid:has(textarea){grid-template-columns:1fr!important}.layout-v4 .layout-v4-import textarea{min-height:155px!important}.layout-v4 #configPanel>.flex:first-child{align-items:stretch!important;padding:16px!important}.layout-v4 #configPanel>.flex:first-child h2{flex-basis:100%!important;font-size:1.25rem!important}.layout-v4 #configPanel>.flex:first-child button{width:100%!important;min-width:0!important}.layout-v4 #configPanel>.p-4{padding:14px 16px!important}.layout-v4 #configPanel>.p-4 label{width:100%!important}.layout-v4 #configOutput{min-height:210px!important;padding:16px!important;font-size:.86rem!important}}
`;

const runtime = `<script data-layout-runtime-v4>
(() => {
  const text = (node) => (node?.textContent || "").replace(/\\s+/g, " ").trim();
  const panel = (node) => node?.closest?.(".glass-panel") || null;
  const heading = (selector, value) => [...document.querySelectorAll(selector)].find((node) => text(node).includes(value));

  function applyLayout() {
    const shell = document.querySelector(".app-shell");
    if (!shell || shell.dataset.layoutV4 === "1") return;

    const side = document.querySelector("#heroPanel") || shell.querySelector(":scope > .glass-panel");
    const validate = panel(heading("h2,h3", "Validate ก่อน Generate"));
    const dnsInput = document.querySelector("#dnsInput");
    const dns = panel(dnsInput);
    const search = document.querySelector("#searchInput");
    const importer = document.querySelector("#massImportPanel") || panel(heading("h2,h3", "Mass Pool Import"));
    const pools = document.querySelector("#poolsContainer");
    const config = document.querySelector("#configPanel") || panel(heading("h2,h3", "Cisco Configuration Output"));

    if (!side || !validate || !dns || !search || !importer || !config) return;

    document.querySelector("#networkDashboard")?.setAttribute("hidden", "");

    const oldValidationRow = validate.parentElement;
    const oldResultsGrid = config.parentElement;
    const main = document.createElement("div");
    const top = document.createElement("div");
    const results = document.createElement("div");

    main.className = "layout-v4-main";
    top.className = "layout-v4-top";
    results.className = "layout-v4-results";
    side.classList.add("layout-v4-side");
    validate.classList.add("layout-v4-validate");
    dns.classList.add("layout-v4-dns");
    importer.classList.add("layout-v4-import");

    top.append(validate, dns);
    main.append(top, search, importer, results);
    if (pools) results.append(pools);
    results.append(config);
    shell.append(main);

    if (oldValidationRow && oldValidationRow !== shell && oldValidationRow.children.length === 0) oldValidationRow.remove();
    if (oldResultsGrid && oldResultsGrid !== shell && oldResultsGrid.children.length === 0) oldResultsGrid.remove();

    const actionButtons = ["Add Pool", "Auto Fill", "Export CFG"]
      .map((label) => [...side.querySelectorAll("button")].find((button) => text(button).includes(label)))
      .filter(Boolean);
    if (actionButtons.length && actionButtons.every((button) => button.parentElement === actionButtons[0].parentElement)) {
      actionButtons[0].parentElement.classList.add("layout-v4-actions");
    }

    const syncResults = () => {
      const hasPools = Boolean(pools && [...pools.children].some((child) => text(child)));
      results.classList.toggle("no-pools", !hasPools);
    };
    syncResults();
    if (pools) new MutationObserver(syncResults).observe(pools, { childList: true, subtree: true });

    shell.classList.add("layout-v4-shell");
    shell.dataset.layoutV4 = "1";
    document.body.classList.add("layout-v4");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyLayout, { once: true });
  else applyLayout();
  requestAnimationFrame(applyLayout);
  setTimeout(applyLayout, 100);
})();
</script>`;

for (const directory of ["public", "dist"]) {
  const file = `${directory}/index.html`;
  let html = await readFile(file, "utf8");

  const brokenStart = html.lastIndexOf('<script>(()=>{const t=n=>');
  if (brokenStart !== -1) {
    const brokenEnd = html.indexOf('<\\/script>', brokenStart);
    if (brokenEnd !== -1) html = html.slice(0, brokenStart) + html.slice(brokenEnd + '<\\/script>'.length);
  }

  html = html.replaceAll('\\n</body>', '\n</body>');
  html = html.replaceAll('id="networkValidationRow" id="networkScopePanel"', 'id="networkValidationRow"');
  html = html.replace(/<script data-layout-runtime-v4>[\s\S]*?<\/script>/g, "");

  if (!html.includes(MARKER)) html = html.replace("</style>", `${css}\n</style>`);
  html = html.replace("</body>", `${runtime}\n</body>`);

  if (!html.includes(MARKER) || !html.includes("data-layout-runtime-v4")) {
    throw new Error(`V4 layout injection failed for ${file}`);
  }
  if (html.includes('<\\/script>')) {
    throw new Error(`Malformed script closing tag remains in ${file}`);
  }

  await writeFile(file, html, "utf8");
}

console.log("Layout runtime repaired and developer badge rebuilt.");
