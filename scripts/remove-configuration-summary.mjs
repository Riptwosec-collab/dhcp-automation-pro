import { readFile, writeFile } from "node:fs/promises";

const summaryPattern = /\s*<div class="network-block">\s*<h2 class="network-section-title">Configuration Summary<\/h2>[\s\S]*?<\/div>\s*<\/div>(?=\s*<div class="network-status-strip">)/;

for (const directory of ["public", "dist"]) {
  const path = `${directory}/index.html`;
  const source = await readFile(path, "utf8");
  const html = source.replace(summaryPattern, "");

  if (html === source || html.includes("Configuration Summary")) {
    throw new Error(`Configuration Summary was not removed from ${path}`);
  }

  await writeFile(path, html, "utf8");
}

console.log("Configuration Summary removed from the Network dashboard.");
