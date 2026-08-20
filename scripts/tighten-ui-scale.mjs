// Deployment retry for production refresh.
import { readFile, writeFile } from "node:fs/promises";

const targets = ["index.html", "public/index.html", "dist/index.html"];
const styleId = "tight-ui-scale-v2";
const stylePattern = new RegExp(`<style id=["']${styleId}["']>[\\s\\S]*?<\\/style>`, "i");

const styleBlock = `<style id="${styleId}">
  /* Tighter desktop sizing: keep the app comfortably inside the viewport. */
  .app-shell {
    width: min(1480px, calc(100vw - 72px)) !important;
    max-width: 1480px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  /* Smart Import should feel like a focused tool window, not a full-screen page. */
  .smart-modal {
    padding: 18px !important;
  }
  .smart-modal-shell {
    width: min(980px, calc(100vw - 56px)) !important;
    max-width: 980px !important;
    max-height: 86vh !important;
  }
  .smart-modal-body {
    max-height: calc(86vh - 78px) !important;
    padding: 16px !important;
  }
  .smart-modal-head {
    padding: 15px 17px !important;
  }
  .smart-title-icon {
    width: 38px !important;
    height: 38px !important;
  }
  .smart-mode-tabs {
    margin-bottom: 13px !important;
    gap: 8px !important;
  }
  .smart-mode-tab {
    padding: 10px 11px !important;
  }
  .smart-grid {
    grid-template-columns: minmax(0, 1.28fr) minmax(270px, .72fr) !important;
    gap: 12px !important;
  }
  .smart-card {
    padding: 13px !important;
  }
  .smart-field textarea {
    min-height: 138px !important;
  }
  .smart-preview {
    margin-top: 12px !important;
  }
  .smart-table-wrap {
    max-height: 245px !important;
  }
  .smart-footer {
    margin-top: 11px !important;
  }

  @media (max-width: 1500px) {
    .app-shell {
      width: calc(100vw - 44px) !important;
      max-width: none !important;
    }
  }

  @media (max-width: 1100px) {
    .app-shell {
      width: calc(100vw - 28px) !important;
    }
    .smart-modal-shell {
      width: min(920px, calc(100vw - 28px)) !important;
      max-width: none !important;
    }
    .smart-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 640px) {
    .app-shell {
      width: calc(100vw - 14px) !important;
    }
    .smart-modal {
      padding: 7px !important;
    }
    .smart-modal-shell {
      width: calc(100vw - 14px) !important;
      max-height: 94vh !important;
    }
    .smart-modal-body {
      max-height: calc(94vh - 72px) !important;
      padding: 11px !important;
    }
  }
</style>`;

let updated = 0;

for (const filePath of targets) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }

  let output;
  if (stylePattern.test(source)) {
    output = source.replace(stylePattern, styleBlock);
  } else if (source.includes("</head>")) {
    output = source.replace("</head>", `  ${styleBlock}\n</head>`);
  } else {
    throw new Error(`[tighten-ui-scale] Cannot find </head> in ${filePath}`);
  }

  if (output !== source) {
    await writeFile(filePath, output, "utf8");
    updated += 1;
    console.log(`[tighten-ui-scale] Updated ${filePath}`);
  }
}

if (!updated) {
  console.log("[tighten-ui-scale] No new changes required");
}
