import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const html = await readFile("index.html", "utf8");
const required = [
  '<body data-theme="network">',
  'https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js',
  'https://prod.spline.design/JjxXgOnkzKI104Ve/scene.splinecode',
  'height: 600px',
  'height: 380px',
  'class="spline-loading"'
];

const missing = required.filter((snippet) => !html.includes(snippet));
if (missing.length) {
  throw new Error(`Build validation failed. Missing: ${missing.join(", ")}`);
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) {
  throw new Error(`Duplicate HTML ids: ${[...new Set(duplicateIds)].join(", ")}`);
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((script) => script.trim());
const syntaxFile = join(tmpdir(), `dhcp-inline-${process.pid}.js`);
await writeFile(syntaxFile, inlineScripts.join("\n"), "utf8");
const syntaxCheck = spawnSync(process.execPath, ["--check", syntaxFile], { encoding: "utf8" });
await rm(syntaxFile, { force: true });
if (syntaxCheck.status !== 0) {
  throw new Error(syntaxCheck.stderr || syntaxCheck.stdout || "Inline JavaScript syntax check failed");
}

for (const directory of ["dist", "public"]) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  await cp("index.html", `${directory}/index.html`);
}
console.log("Build passed: validated Spline hero, responsive heights, unique ids, inline JavaScript syntax, and generated dist/public outputs.");
