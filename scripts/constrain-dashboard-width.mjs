import { readFile, writeFile } from "node:fs/promises";

const targets = ["index.html", "public/index.html", "dist/index.html"];
const styleId = "app-shell-readable-width-v1";
const stylePattern = new RegExp(`<style id=["']${styleId}["']>[\\s\\S]*?<\\/style>`, "i");
const styleBlock = `<style id="${styleId}">
  /* Keep the dashboard centered at a comfortable desktop width. */
  .app-shell {
    width: min(1630px, calc(100vw - 48px)) !important;
    max-width: 1630px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  @media (max-width: 1200px) {
    .app-shell {
      width: calc(100vw - 28px) !important;
      max-width: none !important;
    }
  }

  @media (max-width: 640px) {
    .app-shell {
      width: calc(100vw - 16px) !important;
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
    throw new Error(`[constrain-dashboard-width] Cannot find </head> in ${filePath}`);
  }

  if (output !== source) {
    await writeFile(filePath, output, "utf8");
    updated += 1;
    console.log(`[constrain-dashboard-width] Updated ${filePath}`);
  }
}

if (!updated) {
  console.log("[constrain-dashboard-width] No new changes required");
}
