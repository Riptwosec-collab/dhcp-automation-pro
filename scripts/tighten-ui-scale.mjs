import { readFile, writeFile } from "node:fs/promises";

const targets = ["index.html", "public/index.html", "dist/index.html"];
const styleId = "tight-ui-scale-v3";
const oldStyleIds = ["tight-ui-scale-v2", "tight-ui-scale-v3"];

const styleBlock = `<style id="${styleId}">
  /* Final compact sizing override. Use selectors that beat Final Layout V5. */
  body.final-layout-v5 .final-v5-shell,
  body[data-theme="space"].final-layout-v5 .final-v5-shell,
  body[data-theme="network"].final-layout-v5 .final-v5-shell {
    width: min(1440px, calc(100vw - 96px)) !important;
    max-width: 1440px !important;
    grid-template-columns: minmax(240px, 280px) minmax(0, 1fr) !important;
    gap: 18px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  body.final-layout-v5 .final-v5-side,
  body[data-theme="space"].final-layout-v5 .final-v5-side,
  body[data-theme="network"].final-layout-v5 .final-v5-side {
    width: 100% !important;
    max-width: 280px !important;
    padding: 20px !important;
  }

  body.final-layout-v5 .final-v5-main {
    gap: 18px !important;
  }

  body.final-layout-v5 .final-v5-top,
  body.final-layout-v5 .final-v5-workbench,
  body.final-layout-v5 .final-v5-results {
    gap: 18px !important;
  }

  body.final-layout-v5 .final-v5-workbench {
    grid-template-columns: minmax(0, 1.18fr) minmax(390px, .82fr) !important;
  }

  body.final-layout-v5 #networkDashboard,
  body.final-layout-v5 .final-v5-import,
  body.final-layout-v5 .final-v5-validate,
  body.final-layout-v5 .final-v5-dns {
    padding: 18px !important;
  }

  body.final-layout-v5 .final-v5-import textarea {
    min-height: 210px !important;
  }

  /* Smart Import: focused modal instead of near-full-screen. */
  .smart-modal {
    padding: 16px !important;
  }
  .smart-modal-shell {
    width: min(920px, calc(100vw - 72px)) !important;
    max-width: 920px !important;
    max-height: 84vh !important;
  }
  .smart-modal-body {
    max-height: calc(84vh - 74px) !important;
    padding: 14px !important;
  }
  .smart-modal-head {
    padding: 13px 15px !important;
  }
  .smart-title-icon {
    width: 36px !important;
    height: 36px !important;
  }
  .smart-mode-tabs {
    margin-bottom: 11px !important;
    gap: 7px !important;
  }
  .smart-mode-tab {
    padding: 9px 10px !important;
  }
  .smart-grid {
    grid-template-columns: minmax(0, 1.2fr) minmax(250px, .8fr) !important;
    gap: 10px !important;
  }
  .smart-card {
    padding: 11px !important;
  }
  .smart-field textarea {
    min-height: 120px !important;
  }
  .smart-preview {
    margin-top: 10px !important;
  }
  .smart-table-wrap {
    max-height: 220px !important;
  }
  .smart-footer {
    margin-top: 9px !important;
  }

  @media (max-width: 1500px) {
    body.final-layout-v5 .final-v5-shell,
    body[data-theme="space"].final-layout-v5 .final-v5-shell,
    body[data-theme="network"].final-layout-v5 .final-v5-shell {
      width: min(1380px, calc(100vw - 64px)) !important;
      max-width: 1380px !important;
      grid-template-columns: minmax(230px, 270px) minmax(0, 1fr) !important;
      gap: 16px !important;
    }
    body.final-layout-v5 .final-v5-side {
      max-width: 270px !important;
    }
  }

  @media (max-width: 1280px) {
    body.final-layout-v5 .final-v5-shell,
    body[data-theme="space"].final-layout-v5 .final-v5-shell,
    body[data-theme="network"].final-layout-v5 .final-v5-shell {
      width: calc(100vw - 40px) !important;
      max-width: none !important;
      grid-template-columns: minmax(220px, 250px) minmax(0, 1fr) !important;
      gap: 14px !important;
    }
    body.final-layout-v5 .final-v5-side {
      max-width: 250px !important;
    }
    body.final-layout-v5 .final-v5-workbench {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 900px) {
    body.final-layout-v5 .final-v5-shell,
    body[data-theme="space"].final-layout-v5 .final-v5-shell,
    body[data-theme="network"].final-layout-v5 .final-v5-shell {
      width: calc(100vw - 28px) !important;
      max-width: none !important;
      grid-template-columns: 1fr !important;
    }
    body.final-layout-v5 .final-v5-side {
      max-width: none !important;
    }
    .smart-modal-shell {
      width: min(860px, calc(100vw - 28px)) !important;
      max-width: none !important;
    }
    .smart-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 640px) {
    body.final-layout-v5 .final-v5-shell,
    body[data-theme="space"].final-layout-v5 .final-v5-shell,
    body[data-theme="network"].final-layout-v5 .final-v5-shell {
      width: calc(100vw - 14px) !important;
    }
    .smart-modal {
      padding: 6px !important;
    }
    .smart-modal-shell {
      width: calc(100vw - 12px) !important;
      max-height: 94vh !important;
    }
    .smart-modal-body {
      max-height: calc(94vh - 68px) !important;
      padding: 10px !important;
    }
  }
</style>`;

function removeOldStyles(source) {
  let output = source;
  for (const id of oldStyleIds) {
    const pattern = new RegExp(`<style id=["']${id}["']>[\\s\\S]*?<\\/style>\\s*`, "ig");
    output = output.replace(pattern, "");
  }
  return output;
}

let updated = 0;

for (const filePath of targets) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }

  let output = removeOldStyles(source);
  if (!output.includes("</head>")) {
    throw new Error(`[tighten-ui-scale] Cannot find </head> in ${filePath}`);
  }
  output = output.replace("</head>", `  ${styleBlock}\n</head>`);

  if (output !== source) {
    await writeFile(filePath, output, "utf8");
    updated += 1;
    console.log(`[tighten-ui-scale] Updated ${filePath}`);
  }
}

if (!updated) {
  console.log("[tighten-ui-scale] No new changes required");
}
