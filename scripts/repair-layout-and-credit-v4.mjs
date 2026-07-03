import { readFile, writeFile } from "node:fs/promises";

const MARKER = "Final Dashboard Layout Guide Credit V5";

const css = `
/* ${MARKER} */
html,body{max-width:100%!important;overflow-x:hidden!important}
body.final-layout-v5{padding:24px!important}
body.final-layout-v5 *{box-sizing:border-box}
.final-layout-v5 #networkDashboard{display:block!important;min-height:0!important;padding:24px!important;border-radius:18px!important}
.final-layout-v5 .final-v5-shell{display:grid!important;grid-template-columns:minmax(260px,290px) minmax(0,1040px)!important;gap:24px!important;align-items:start!important;width:min(1378px,calc(100vw - 48px))!important;max-width:1378px!important;margin:0 auto!important}
.final-layout-v5 .final-v5-shell>*{min-width:0!important;max-width:100%!important}
.final-layout-v5 .final-v5-side{grid-column:1!important;position:sticky!important;top:18px!important;align-self:start!important;width:100%!important;max-height:calc(100vh - 36px)!important;overflow:auto!important;padding:24px!important;border-radius:18px!important}
.final-layout-v5 .final-v5-main{grid-column:2!important;display:grid!important;gap:22px!important;min-width:0!important;width:100%!important}
.final-layout-v5 .final-v5-top{display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(0,1.35fr)!important;gap:22px!important;align-items:stretch!important;width:100%!important}
.final-layout-v5 .final-v5-top>*{min-width:0!important;height:100%!important}
.final-layout-v5 .final-v5-results{display:grid!important;grid-template-columns:1fr!important;gap:22px!important;align-items:start!important;width:100%!important}
.final-layout-v5 .final-v5-results.no-pools{grid-template-columns:minmax(0,1fr)!important}
.final-layout-v5 .final-v5-results.no-pools #poolsContainer,.final-layout-v5 #poolsContainer:empty{display:none!important;min-height:0!important;padding:0!important;margin:0!important;border:0!important}
.final-layout-v5 .final-v5-results.no-pools #configPanel{grid-column:1!important;width:100%!important}

/* Developer credit rebuilt as a stable black/gold or blue command badge. */
.final-layout-v5 .final-v5-side .credit-wrap{display:block!important;width:100%!important;max-width:none!important;margin:24px 0 0!important;overflow:visible!important}
.final-layout-v5 .final-v5-side .credit-glass{position:relative!important;isolation:isolate!important;display:grid!important;grid-template-columns:52px 1px minmax(0,1fr)!important;align-items:center!important;gap:14px!important;width:100%!important;min-width:0!important;min-height:84px!important;padding:14px 18px!important;border:1px solid rgba(239,185,67,.64)!important;border-radius:20px!important;background:linear-gradient(120deg,rgba(239,185,67,.13),transparent 30%,rgba(255,255,255,.025) 52%,transparent 74%),linear-gradient(145deg,rgba(18,13,5,.98),rgba(3,3,3,.99))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 0 24px rgba(239,185,67,.08),0 0 0 4px rgba(239,185,67,.045),0 12px 30px rgba(0,0,0,.54),0 0 24px rgba(239,185,67,.22)!important;clip-path:polygon(0 17px,17px 0,calc(100% - 17px) 0,100% 17px,100% calc(100% - 17px),calc(100% - 17px) 100%,17px 100%,0 calc(100% - 17px))!important;overflow:hidden!important}
.final-layout-v5 .final-v5-side .credit-glass::before{content:""!important;position:absolute!important;inset:6px!important;border:1px solid rgba(239,185,67,.17)!important;border-radius:15px!important;clip-path:inherit!important;pointer-events:none!important;z-index:1!important}
.final-layout-v5 .final-v5-side .credit-glass::after{content:""!important;position:absolute!important;right:18px!important;top:10px!important;width:36px!important;height:5px!important;background:radial-gradient(circle,rgba(255,216,115,.96) 0 1.5px,transparent 2px) 0 0/9px 5px repeat-x!important;filter:drop-shadow(0 0 5px rgba(239,185,67,.72))!important;opacity:.88!important;z-index:2!important}
.final-layout-v5 .credit-icon{position:relative!important;z-index:3!important;width:52px!important;height:52px!important;display:grid!important;place-items:center!important;border:1px solid rgba(255,216,115,.76)!important;border-radius:14px!important;color:#FFD873!important;background:linear-gradient(145deg,rgba(239,185,67,.17),rgba(239,185,67,.045))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 0 18px rgba(239,185,67,.22)!important;font:900 .92rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;text-shadow:0 0 12px rgba(255,216,115,.68)!important}
.final-layout-v5 .credit-divider{position:relative!important;z-index:3!important;width:1px!important;height:48px!important;border-radius:2px!important;background:linear-gradient(180deg,transparent,rgba(255,216,115,.72),transparent)!important;box-shadow:0 0 9px rgba(239,185,67,.38)!important}
.final-layout-v5 .credit-text{position:relative!important;z-index:3!important;display:grid!important;gap:2px!important;min-width:0!important;margin:0!important;color:#FFD873!important;font-size:clamp(.82rem,1vw,.96rem)!important;line-height:1.25!important;font-weight:800!important;letter-spacing:.01em!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:left!important;text-shadow:0 0 12px rgba(239,185,67,.30)!important}
.final-layout-v5 .credit-text strong,.final-layout-v5 .credit-text span{display:block!important;min-width:0!important}
body[data-theme="network"].final-layout-v5 .final-v5-side .credit-glass{border-color:rgba(83,231,255,.62)!important;background:linear-gradient(120deg,rgba(0,183,255,.13),transparent 30%,rgba(255,255,255,.025) 52%,transparent 74%),linear-gradient(145deg,rgba(2,18,40,.98),rgba(1,7,18,.99))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 0 24px rgba(0,183,255,.08),0 0 0 4px rgba(0,183,255,.045),0 12px 30px rgba(0,0,0,.54),0 0 24px rgba(0,183,255,.22)!important}
body[data-theme="network"].final-layout-v5 .final-v5-side .credit-glass::before{border-color:rgba(83,231,255,.17)!important}
body[data-theme="network"].final-layout-v5 .final-v5-side .credit-glass::after{background:radial-gradient(circle,rgba(83,231,255,.96) 0 1.5px,transparent 2px) 0 0/9px 5px repeat-x!important;filter:drop-shadow(0 0 5px rgba(0,183,255,.72))!important}
body[data-theme="network"].final-layout-v5 .credit-icon{border-color:rgba(83,231,255,.76)!important;color:#53E7FF!important;background:linear-gradient(145deg,rgba(0,183,255,.17),rgba(0,183,255,.045))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 0 18px rgba(0,183,255,.22)!important;text-shadow:0 0 12px rgba(83,231,255,.68)!important}
body[data-theme="network"].final-layout-v5 .credit-divider{background:linear-gradient(180deg,transparent,rgba(83,231,255,.72),transparent)!important;box-shadow:0 0 9px rgba(0,183,255,.38)!important}
body[data-theme="network"].final-layout-v5 .credit-text{color:#53E7FF!important;text-shadow:0 0 12px rgba(0,183,255,.30)!important}

.final-layout-v5 .final-v5-side .theme-switcher{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;margin-top:24px!important;padding:6px!important;visibility:visible!important;opacity:1!important}
.final-layout-v5 .final-v5-side .theme-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;min-height:46px!important;padding:10px 12px!important;font-size:.84rem!important;white-space:nowrap!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
.final-layout-v5 .final-v5-side #guideMenuBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:50px!important;margin-top:16px!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
.final-layout-v5 .final-v5-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;width:100%!important;margin-top:18px!important}
.final-layout-v5 .final-v5-actions button{width:100%!important;min-width:0!important;min-height:48px!important;padding:11px 12px!important;font-size:.8rem!important;white-space:normal!important;border-radius:12px!important}
.final-layout-v5 .final-v5-actions button:last-child:nth-child(odd){grid-column:1/-1!important}

.final-layout-v5 #networkDashboard .network-stat-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}
.final-layout-v5 #networkDashboard .network-stat-card{min-height:116px!important;padding:18px!important;border-radius:14px!important}
.final-layout-v5 #networkDashboard .network-stat-icon{width:34px!important;height:34px!important;margin-bottom:12px!important}
.final-layout-v5 #networkDashboard .network-stat-value{font-size:1.58rem!important;margin-top:8px!important}
.final-layout-v5 #networkDashboard .network-stat-note{font-size:.76rem!important;margin-top:7px!important;line-height:1.4!important}
.final-layout-v5 #networkDashboard .network-action-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}
.final-layout-v5 #networkDashboard .network-action{min-height:72px!important;padding:14px!important;border-radius:12px!important}
.final-layout-v5 #networkDashboard .network-action span{font-size:.76rem!important;margin-top:7px!important;line-height:1.35!important}
.final-layout-v5 #networkDashboard .network-block{margin-top:20px!important}
.final-layout-v5 #networkDashboard .network-section-title{margin-bottom:12px!important}
.final-layout-v5 #networkDashboard .network-config-summary{display:none!important}
.final-layout-v5 #networkDashboard .network-status-strip{margin-top:18px!important;padding:13px 15px!important}

.final-layout-v5 .final-v5-validate,.final-layout-v5 .final-v5-dns{min-width:0!important;min-height:156px!important;padding:24px!important;border-radius:18px!important;overflow:hidden!important}
.final-layout-v5 .final-v5-validate{display:flex!important;flex-direction:column!important;justify-content:center!important}
.final-layout-v5 .final-v5-validate::before,.final-layout-v5 .final-v5-validate::after{content:none!important;display:none!important}
.final-layout-v5 .final-v5-validate h3{display:flex!important;align-items:center!important;gap:13px!important;min-width:0!important;margin:0!important;font-size:clamp(1.08rem,1.4vw,1.4rem)!important;line-height:1.24!important;overflow-wrap:anywhere!important}
.final-layout-v5 .final-v5-validate h3 i{flex:0 0 48px!important;width:48px!important;height:48px!important;display:grid!important;place-items:center!important;margin:0!important;border-radius:14px!important;font-size:1.3rem!important;background:rgba(var(--theme-rgb),.11)!important;border:1px solid rgba(var(--theme-rgb),.42)!important}
.final-layout-v5 .final-v5-validate p{margin:15px 0 0 61px!important;max-width:44ch!important;font-size:.94rem!important;line-height:1.62!important;overflow-wrap:anywhere!important}
.final-layout-v5 .final-v5-dns{display:grid!important;grid-template-columns:minmax(150px,190px) minmax(0,1fr)!important;align-items:center!important;gap:22px!important}
.final-layout-v5 .final-v5-dns>span{width:auto!important;min-width:0!important;font-size:clamp(.98rem,1.2vw,1.16rem)!important;font-weight:800!important;overflow-wrap:anywhere!important}
.final-layout-v5 .final-v5-dns #dnsInput{width:100%!important;min-width:0!important;min-height:66px!important;padding:16px 20px!important;border-radius:16px!important;font-size:clamp(.98rem,1.08vw,1.14rem)!important}
.final-layout-v5 #searchInput{display:block!important;width:100%!important;min-width:0!important;min-height:58px!important;padding:0 22px!important;border-radius:16px!important;font-size:.98rem!important}
.final-layout-v5 .final-v5-import{width:100%!important;min-width:0!important;padding:24px!important;border-radius:18px!important}
.final-layout-v5 .final-v5-import h2{font-size:clamp(1.26rem,1.45vw,1.58rem)!important;margin-bottom:18px!important}
.final-layout-v5 .final-v5-import .grid:has(textarea){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important}
.final-layout-v5 .final-v5-import textarea{width:100%!important;min-width:0!important;min-height:178px!important;padding:16px!important;border-radius:14px!important;font-size:.94rem!important;line-height:1.58!important;resize:vertical!important}
.final-layout-v5 .final-v5-import select{min-height:48px!important;border-radius:12px!important}
.final-layout-v5 .final-v5-import button{min-height:54px!important;border-radius:12px!important;margin-top:18px!important}
.final-layout-v5 #poolsContainer{min-width:0!important;display:flex!important;flex-direction:column!important;gap:20px!important}
.final-layout-v5 .pool-card{min-width:0!important;padding:24px!important;border-radius:18px!important}
.final-layout-v5 .pool-card input{width:100%!important;min-width:0!important;min-height:46px!important}
.final-layout-v5 #configPanel{min-width:0!important;width:100%!important;border-radius:18px!important;overflow:hidden!important}
.final-layout-v5 #configPanel>.flex:first-child{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:18px!important;min-height:88px!important;padding:22px 26px!important}
.final-layout-v5 #configPanel>.flex:first-child h2{display:flex!important;align-items:center!important;gap:12px!important;flex:1 1 300px!important;min-width:0!important;margin:0!important;font-size:clamp(1.24rem,1.8vw,1.78rem)!important;overflow-wrap:anywhere!important}
.final-layout-v5 #configPanel>.flex:first-child button{flex:0 0 auto!important;min-width:158px!important;min-height:50px!important;padding:0 22px!important;border-radius:12px!important}
.final-layout-v5 #configPanel>.p-4{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:14px 30px!important;min-height:68px!important;padding:16px 26px!important}
.final-layout-v5 #configPanel>.p-4 label{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important;font-size:.9rem!important}
.final-layout-v5 #configOutput{width:100%!important;min-width:0!important;min-height:320px!important;max-height:560px!important;padding:24px 26px!important;overflow:auto!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;font-size:.94rem!important;line-height:1.64!important}

body[data-theme="space"].final-layout-v5 .final-v5-validate h3,
body[data-theme="space"].final-layout-v5 .final-v5-dns>span,
body[data-theme="space"].final-layout-v5 .final-v5-import h2,
body[data-theme="space"].final-layout-v5 #networkDashboard .network-section-title{color:#FFD873!important;text-shadow:0 0 18px rgba(255,216,115,.32)!important}
body[data-theme="space"].final-layout-v5 #configPanel>.flex:first-child h2{color:#FFF7E4!important;text-shadow:0 0 16px rgba(255,216,115,.16)!important}
body[data-theme="space"].final-layout-v5 #configPanel>.flex:first-child h2 i,
body[data-theme="space"].final-layout-v5 .final-v5-validate h3 i,
body[data-theme="space"].final-layout-v5 .final-v5-dns>span i,
body[data-theme="space"].final-layout-v5 .final-v5-import h2 i{color:#FFD873!important;text-shadow:0 0 16px rgba(255,216,115,.48)!important}
body[data-theme="space"].final-layout-v5 #configPanel>.p-4 label{color:#FFF7E4!important;font-weight:700!important}
body[data-theme="space"].final-layout-v5 #configPanel input[type="checkbox"]{accent-color:#F5BD32!important}
body[data-theme="space"].final-layout-v5 #configPanel>.flex:first-child button{color:#160E02!important;border-color:rgba(255,216,115,.86)!important;background:linear-gradient(180deg,#FFE891,#D8A12F)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.46),0 0 22px rgba(239,185,67,.30)!important;font-weight:900!important}

body[data-theme="network"].final-layout-v5 .final-v5-validate h3,
body[data-theme="network"].final-layout-v5 .final-v5-dns>span,
body[data-theme="network"].final-layout-v5 .final-v5-import h2,
body[data-theme="network"].final-layout-v5 #networkDashboard .network-section-title{color:#53E7FF!important;text-shadow:0 0 18px rgba(83,231,255,.30)!important}
body[data-theme="network"].final-layout-v5 #configPanel>.flex:first-child h2{color:#F0FBFF!important;text-shadow:0 0 16px rgba(83,231,255,.14)!important}
body[data-theme="network"].final-layout-v5 #configPanel>.flex:first-child h2 i,
body[data-theme="network"].final-layout-v5 .final-v5-validate h3 i,
body[data-theme="network"].final-layout-v5 .final-v5-dns>span i,
body[data-theme="network"].final-layout-v5 .final-v5-import h2 i{color:#53E7FF!important;text-shadow:0 0 16px rgba(83,231,255,.45)!important}
body[data-theme="network"].final-layout-v5 #configPanel input[type="checkbox"]{accent-color:#15D5FF!important}

body.final-layout-v5 .final-v5-shell{grid-template-columns:minmax(260px,290px) minmax(0,1040px)!important;width:min(1378px,calc(100vw - 48px))!important;max-width:1378px!important;gap:24px!important}
body.final-layout-v5 .final-v5-side{width:100%!important;min-width:0!important;max-width:290px!important}
body.final-layout-v5 .final-v5-main{display:flex!important;flex-direction:column!important;gap:22px!important;width:100%!important;max-width:1040px!important}
body.final-layout-v5 .final-v5-main>*{flex:0 0 auto!important;grid-column:auto!important;grid-row:auto!important;width:100%!important;max-width:100%!important}
body.final-layout-v5 #networkDashboard{grid-column:1!important;grid-row:auto!important;width:100%!important;max-width:100%!important}
body.final-layout-v5 #searchInput,body.final-layout-v5 .final-v5-import,body.final-layout-v5 .final-v5-results,body.final-layout-v5 #configPanel{grid-column:1!important;width:100%!important}

.final-layout-v5 .guide-modal.is-open{display:flex!important}
.final-layout-v5 .guide-modal-dialog{width:min(1820px,98vw)!important;max-height:96vh!important;overflow:auto!important;padding:12px!important}
.final-layout-v5 .guide-theme-image{width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;background:#020202!important}
.final-layout-v5 .guide-network-image,.final-layout-v5 .guide-space-image,.final-layout-v5 .guide-image-error{display:none!important}
body[data-theme="network"].final-layout-v5 .guide-network-image,body[data-theme="space"].final-layout-v5 .guide-space-image,.final-layout-v5 .guide-fallback-visible{display:block!important}

@media(max-width:1280px){body.final-layout-v5 .final-v5-shell{grid-template-columns:minmax(250px,280px) minmax(0,1fr)!important;gap:20px!important;width:min(100%,calc(100vw - 36px))!important}body.final-layout-v5 .final-v5-main{max-width:none!important}.final-layout-v5 .final-v5-top{grid-template-columns:1fr!important}.final-layout-v5 #networkDashboard .network-stat-grid,.final-layout-v5 #networkDashboard .network-action-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:900px){body.final-layout-v5{padding:16px!important}body.final-layout-v5 .final-v5-shell{grid-template-columns:1fr!important;width:min(100%,calc(100vw - 32px))!important}body.final-layout-v5 .final-v5-side{grid-column:1!important;position:relative!important;top:auto!important;max-height:none!important;max-width:none!important}body.final-layout-v5 .final-v5-main{grid-column:1!important;max-width:none!important;width:100%!important}.final-layout-v5 .final-v5-top,.final-layout-v5 .final-v5-results{grid-template-columns:1fr!important}.final-layout-v5 .final-v5-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important}.final-layout-v5 .final-v5-actions button:last-child:nth-child(odd){grid-column:auto!important}.final-layout-v5 .final-v5-import .grid:has(textarea){grid-template-columns:1fr!important}}
@media(max-width:640px){body.final-layout-v5{padding:10px!important}body.final-layout-v5 .final-v5-shell,body.final-layout-v5 .final-v5-main{gap:16px!important;width:100%!important}.final-layout-v5 .final-v5-side{padding:18px!important}.final-layout-v5 .final-v5-side .credit-glass{grid-template-columns:46px 1px minmax(0,1fr)!important;gap:11px!important;min-height:74px!important;padding:11px 14px!important;border-radius:17px!important}.final-layout-v5 .credit-icon{width:46px!important;height:46px!important}.final-layout-v5 .credit-divider{height:42px!important}.final-layout-v5 .credit-text{font-size:.79rem!important}.final-layout-v5 #networkDashboard{padding:18px!important}.final-layout-v5 #networkDashboard .network-stat-grid,.final-layout-v5 #networkDashboard .network-action-grid{grid-template-columns:1fr!important}.final-layout-v5 .final-v5-actions{grid-template-columns:1fr!important}.final-layout-v5 .final-v5-validate,.final-layout-v5 .final-v5-dns{min-height:0!important;padding:20px!important}.final-layout-v5 .final-v5-validate p{margin-left:0!important;max-width:none!important}.final-layout-v5 .final-v5-dns{grid-template-columns:1fr!important;gap:12px!important}.final-layout-v5 .final-v5-import{padding:18px!important}.final-layout-v5 .final-v5-import textarea{min-height:160px!important}.final-layout-v5 #configPanel>.flex:first-child{align-items:stretch!important;padding:17px!important}.final-layout-v5 #configPanel>.flex:first-child h2{flex-basis:100%!important;font-size:1.2rem!important}.final-layout-v5 #configPanel>.flex:first-child button{width:100%!important;min-width:0!important}.final-layout-v5 #configPanel>.p-4{padding:15px 17px!important}.final-layout-v5 #configPanel>.p-4 label{width:100%!important}.final-layout-v5 #configOutput{min-height:230px!important;padding:17px!important;font-size:.84rem!important}.final-layout-v5 .guide-modal{padding:6px!important}.final-layout-v5 .guide-modal-dialog{width:100%!important;max-height:97vh!important;padding:6px!important}}
`;

const runtime = `<script data-final-layout-v5>
(() => {
  const normalizedText = (node) => (node?.textContent || "").replace(/\\s+/g, " ").trim();
  const panelFor = (node) => node?.closest?.(".glass-panel") || null;
  const headingWith = (value) => [...document.querySelectorAll("h2,h3")].find((node) => normalizedText(node).includes(value));
  const creditHtml = () => '<div class="credit-glass"><span class="credit-icon" aria-hidden="true">&lt;/&gt;</span><span class="credit-divider" aria-hidden="true"></span><span class="credit-text"><strong>Developed by Aidsares</strong><span>Veangin</span></span></div>';
  let creditSyncing = false;
  let resultsObserver;

  function installCredit() {
    window.creditMarkup = creditHtml;
    const host = document.getElementById("themeDescription");
    if (!host || creditSyncing) return;
    if (host.querySelector(".credit-icon") && normalizedText(host).includes("Developed by Aidsares") && normalizedText(host).includes("Veangin")) return;
    creditSyncing = true;
    host.innerHTML = creditHtml();
    creditSyncing = false;
  }

  function installGuide(side) {
    const switcher = side?.querySelector(".theme-switcher");
    let button = document.getElementById("guideMenuBtn");
    if (!button && switcher) {
      button = document.createElement("button");
      button.id = "guideMenuBtn";
      button.type = "button";
      button.className = "guide-menu-btn";
      button.innerHTML = '<i class="fas fa-book-open"></i> คู่มือ';
    }
    if (button && switcher && button.previousElementSibling !== switcher) switcher.insertAdjacentElement("afterend", button);

    const modal = document.getElementById("usageGuideModal");
    if (!modal) return;
    const dialog = modal.querySelector(".guide-modal-dialog");
    const existing = dialog?.querySelector("img");
    let network = dialog?.querySelector(".guide-network-image");
    let space = dialog?.querySelector(".guide-space-image");

    if (existing && !network) {
      existing.classList.add("guide-theme-image", "guide-network-image");
      existing.src = "/assets/usage-guide-network.webp?v=5";
      network = existing;
    }
    if (dialog && network && !space) {
      space = network.cloneNode(false);
      space.classList.remove("guide-network-image");
      space.classList.add("guide-space-image");
      space.src = "/assets/usage-guide-gold.png?v=6";
      space.alt = "คู่มือการกรอกข้อมูล Mass Pool Import ธีมดำทอง";
      network.insertAdjacentElement("afterend", space);
    }

    for (const image of [network, space].filter(Boolean)) {
      if (image.dataset.fallbackBound === "1") continue;
      image.dataset.fallbackBound = "1";
      image.addEventListener("error", () => {
        image.classList.add("guide-image-error");
        const fallback = image === network ? space : network;
        if (fallback) fallback.classList.add("guide-fallback-visible");
      }, { once: true });
    }

    window.openUsageGuide = () => {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("guide-modal-open");
      modal.querySelector(".guide-modal-close")?.focus();
    };
    window.closeUsageGuide = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("guide-modal-open");
      document.getElementById("guideMenuBtn")?.focus();
    };
    if (button) button.onclick = window.openUsageGuide;
  }

  function applyLayout() {
    const shell = document.querySelector(".app-shell");
    if (!shell) return false;

    const side = document.querySelector("#heroPanel") || shell.querySelector(":scope > .glass-panel");
    const validate = panelFor(headingWith("Validate ก่อน Generate"));
    const dns = panelFor(document.getElementById("dnsInput"));
    const search = document.getElementById("searchInput");
    const importer = document.querySelector("#massImportPanel") || panelFor(headingWith("Mass Pool Import"));
    const dashboard = document.getElementById("networkDashboard");
    const pools = document.getElementById("poolsContainer");
    const config = document.querySelector("#configPanel") || panelFor(headingWith("Cisco Configuration Output"));

    if (!side || !validate || !dns || !search || !importer || !config) return false;

    if (!side.id) side.id = "heroPanel";
    if (!importer.id) importer.id = "massImportPanel";
    if (!config.id) config.id = "configPanel";

    document.body.classList.remove("l3", "layout-v4");
    document.body.classList.add("final-layout-v5");
    shell.classList.remove("l3-shell", "layout-v4-shell", "s-block");
    shell.classList.add("final-v5-shell");
    side.classList.remove("l3-side", "layout-v4-side");
    side.classList.add("final-v5-side");
    validate.classList.add("final-v5-validate");
    dns.classList.add("final-v5-dns");
    importer.classList.add("final-v5-import");
    search.classList.add("final-v5-search");

    const main = document.createElement("div");
    const top = document.createElement("div");
    const results = document.createElement("div");
    main.className = "final-v5-main";
    top.className = "final-v5-top";
    results.className = "final-v5-results";

    top.append(validate, dns);
    results.append(...(pools ? [pools] : []), config);
    main.append(...(dashboard ? [dashboard] : []), top, search, importer, results);
    shell.replaceChildren(side, main);

    main.style.display = "flex";
    main.style.flexDirection = "column";
    const syncInlineSizing = () => {
      if (window.innerWidth <= 900) {
        shell.style.gridTemplateColumns = "1fr";
        shell.style.width = "min(100%, calc(100vw - 32px))";
        main.style.maxWidth = "none";
      } else if (window.innerWidth <= 1280) {
        shell.style.gridTemplateColumns = "minmax(250px,280px) minmax(0,1fr)";
        shell.style.width = "min(100%, calc(100vw - 36px))";
        main.style.maxWidth = "none";
      } else {
        shell.style.gridTemplateColumns = "minmax(260px,290px) minmax(0,1040px)";
        shell.style.width = "min(1378px, calc(100vw - 48px))";
        main.style.maxWidth = "1040px";
      }
    };
    syncInlineSizing();
    if (shell.dataset.finalSizingBound !== "1") {
      shell.dataset.finalSizingBound = "1";
      addEventListener("resize", syncInlineSizing);
    }
    for (const node of [dashboard, top, search, importer, results, pools, config].filter(Boolean)) {
      node.style.gridColumn = "1 / -1";
      node.style.width = "100%";
      node.style.maxWidth = "100%";
      node.style.minWidth = "0";
    }

    const actionButtons = ["Add Pool", "Auto Fill", "Export CFG"]
      .map((label) => [...side.querySelectorAll("button")].find((button) => normalizedText(button).includes(label)))
      .filter(Boolean);
    if (actionButtons.length && actionButtons.every((button) => button.parentElement === actionButtons[0].parentElement)) {
      actionButtons[0].parentElement.classList.add("final-v5-actions");
    }

    const syncResults = () => {
      const hasRealPools = Boolean(pools?.querySelector(".pool-card"));
      results.classList.toggle("no-pools", !hasRealPools);
    };
    syncResults();
    resultsObserver?.disconnect();
    if (pools) {
      resultsObserver = new MutationObserver(syncResults);
      resultsObserver.observe(pools, { childList: true, subtree: true });
    }

    installCredit();
    installGuide(side);
    shell.dataset.finalLayoutV5 = "1";
    return true;
  }

  function boot() {
    let attempts = 0;
    const run = () => {
      attempts += 1;
      const done = applyLayout();
      if (!done && attempts < 30) setTimeout(run, 100);
    };
    run();

    const creditHost = document.getElementById("themeDescription");
    if (creditHost) new MutationObserver(installCredit).observe(creditHost, { childList: true, subtree: true, characterData: true });
    new MutationObserver(() => {
      installCredit();
      const side = document.querySelector(".final-v5-side");
      if (side) installGuide(side);
    }).observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  addEventListener("load", () => { applyLayout(); installCredit(); }, { once: true });
})();
</script>`;

for (const directory of ["public", "dist"]) {
  const file = `${directory}/index.html`;
  let html = await readFile(file, "utf8");

  html = html.replace(/<script data-layout-runtime-v4>[\s\S]*?<\/script>/g, "");
  html = html.replace(/<script data-final-layout-v5>[\s\S]*?<\/script>/g, "");
  if (!html.includes(MARKER)) html = html.replace("</style>", `${css}\n</style>`);
  html = html.replace("</body>", `${runtime}\n</body>`);

  for (const token of [MARKER, "data-final-layout-v5", "final-v5-shell", "Developed by Aidsares", "guide-space-image"]) {
    if (!html.includes(token)) throw new Error(`Final layout injection failed for ${file}: ${token}`);
  }

  await writeFile(file, html, "utf8");
}

console.log("Dashboard layout, guide modal, theme controls, and developer credit repaired for both themes.");
