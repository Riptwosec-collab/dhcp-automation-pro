import { readFile, writeFile } from "node:fs/promises";

const styles = `
    /* Compact usage guide inside the left mission-control panel. */
    .usage-guide{
      position:relative;
      z-index:3;
      width:100%;
      margin-top:12px;
      padding:12px;
      border:1px solid rgba(var(--theme-rgb),.34);
      border-radius:13px;
      background:
        linear-gradient(145deg,rgba(var(--theme-rgb),.075),rgba(0,0,0,.32)),
        rgba(0,0,0,.24);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.055),
        0 0 18px rgba(var(--theme-rgb),.07);
      overflow:hidden;
    }
    .usage-guide:before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      background:linear-gradient(90deg,rgba(var(--theme2-rgb),.70),transparent 54%,rgba(var(--theme-rgb),.38)) top/100% 1px no-repeat;
      opacity:.75;
    }
    .usage-guide-heading{
      position:relative;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:9px;
    }
    .usage-guide-title{
      display:flex;
      align-items:center;
      gap:8px;
      color:var(--theme-text);
      font-size:.78rem;
      font-weight:850;
      letter-spacing:.04em;
    }
    .usage-guide-title i{color:rgb(var(--theme2-rgb));filter:drop-shadow(0 0 8px rgba(var(--theme-rgb),.34))}
    .usage-guide-count{
      padding:3px 8px;
      border:1px solid rgba(var(--theme-rgb),.28);
      border-radius:999px;
      color:var(--theme-muted);
      font-size:.62rem;
      white-space:nowrap;
      background:rgba(0,0,0,.22);
    }
    .usage-guide-grid{
      position:relative;
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:7px;
    }
    .usage-guide-step{
      display:grid;
      grid-template-columns:25px minmax(0,1fr);
      align-items:center;
      gap:8px;
      min-height:52px;
      padding:8px;
      border:1px solid rgba(var(--theme-rgb),.24);
      border-radius:9px;
      background:rgba(0,0,0,.26);
    }
    .usage-step-number{
      width:25px;
      height:25px;
      display:grid;
      place-items:center;
      border-radius:8px;
      color:#050505;
      font-size:.70rem;
      font-weight:900;
      background:linear-gradient(145deg,rgb(var(--theme2-rgb)),rgb(var(--theme-rgb)));
      box-shadow:0 0 12px rgba(var(--theme-rgb),.22);
    }
    body[data-theme="network"] .usage-step-number{color:white}
    .usage-guide-step strong{
      display:block;
      color:var(--theme-text);
      font-size:.68rem;
      line-height:1.2;
    }
    .usage-guide-step small{
      display:block;
      margin-top:3px;
      color:var(--theme-muted);
      font-size:.57rem;
      line-height:1.25;
    }
    .usage-guide-tip{
      position:relative;
      display:flex;
      align-items:center;
      gap:7px;
      margin-top:8px;
      padding-top:8px;
      border-top:1px solid rgba(var(--theme-rgb),.20);
      color:var(--theme-muted);
      font-size:.59rem;
      line-height:1.35;
    }
    .usage-guide-tip i{color:rgb(var(--theme2-rgb))}
    @media(max-width:1180px){
      .usage-guide{max-width:560px}
    }
    @media(max-width:380px){
      .usage-guide-grid{grid-template-columns:1fr}
    }
`;

const markup = `
          <section id="usageGuide" class="usage-guide" aria-labelledby="usageGuideTitle">
            <div class="usage-guide-heading">
              <h2 id="usageGuideTitle" class="usage-guide-title"><i class="fas fa-book-open"></i> คู่มือการใช้งาน</h2>
              <span class="usage-guide-count">4 ขั้นตอน</span>
            </div>
            <div class="usage-guide-grid">
              <div class="usage-guide-step"><span class="usage-step-number">1</span><div><strong>เลือกวิธีเพิ่ม Pool</strong><small>Add Pool หรือ Mass Import</small></div></div>
              <div class="usage-guide-step"><span class="usage-step-number">2</span><div><strong>กรอกข้อมูลเครือข่าย</strong><small>MAC, IP, Gateway และ VLAN</small></div></div>
              <div class="usage-guide-step"><span class="usage-step-number">3</span><div><strong>ตรวจสอบและ Generate</strong><small>แก้ช่องแจ้งเตือนให้ถูกต้อง</small></div></div>
              <div class="usage-guide-step"><span class="usage-step-number">4</span><div><strong>นำ Config ไปใช้งาน</strong><small>Copy All หรือ Export CFG</small></div></div>
            </div>
            <div class="usage-guide-tip"><i class="fas fa-circle-check"></i><span>ตรวจให้สถานะเป็นสีเขียวก่อน Copy หรือ Export ทุกครั้ง</span></div>
          </section>`;

for (const directory of ["public", "dist"]) {
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");

  if (!html.includes("Compact usage guide inside the left mission-control panel")) {
    html = html.replace("  </style>", `${styles}  </style>`);
  }

  if (!html.includes('id="usageGuide"')) {
    html = html.replace(
      '<div id="themeDescription" class="credit-wrap"></div>',
      `<div id="themeDescription" class="credit-wrap"></div>${markup}`
    );
  }

  const required = [
    'id="usageGuide"',
    'คู่มือการใช้งาน',
    'เลือกวิธีเพิ่ม Pool',
    'นำ Config ไปใช้งาน',
    'Compact usage guide inside the left mission-control panel'
  ];
  const missing = required.filter((value) => !html.includes(value));
  if (missing.length) throw new Error(`Usage guide build failed in ${path}: ${missing.join(", ")}`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) throw new Error(`Duplicate ids in ${path}: ${[...new Set(duplicates)].join(", ")}`);

  await writeFile(path, html, "utf8");
}

console.log("Compact four-step usage guide added below the developer credit.");
