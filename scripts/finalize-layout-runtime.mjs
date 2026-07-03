import { readFile, writeFile } from "node:fs/promises";

for (const directory of ["public", "dist"]) {
  const file = `${directory}/index.html`;
  let html = await readFile(file, "utf8");

  html = html.replaceAll("<\\/script>", "</script>");
  html = html.replaceAll(
    'id="networkValidationRow" id="networkScopePanel"',
    'id="networkValidationRow"'
  );

  if (!html.includes('sh.dataset.l3="1"')) {
    throw new Error(`Layout V3 runtime missing from ${file}`);
  }
  if (html.includes("<\\/script>")) {
    throw new Error(`Malformed script closing tag remains in ${file}`);
  }

  await writeFile(file, html, "utf8");
}

console.log("Final layout runtime activated and duplicate IDs removed.");
