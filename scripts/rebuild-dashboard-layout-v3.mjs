import { readFile, writeFile } from "node:fs/promises";

const PLACEHOLDER = '<div class="glass-panel bg-gray-900 rounded-3xl p-8 text-center text-gray-400 border border-gray-800">กด Add Pool หรือใส่ข้อมูลใน Mass Pool Import เพื่อเริ่ม Generate</div>';

for (const directory of ["public", "dist"]) {
  const file = `${directory}/index.html`;
  let html = await readFile(file, "utf8");

  // Keep the pool column truly empty until a real .pool-card exists. The final
  // layout runtime uses that state to let Cisco Configuration Output span the
  // full content width instead of leaving a large blank column.
  html = html.replace(`c.innerHTML=html||'${PLACEHOLDER}'`, "c.innerHTML=html");

  if (html.includes("กด Add Pool หรือใส่ข้อมูลใน Mass Pool Import เพื่อเริ่ม Generate")) {
    throw new Error(`Pool placeholder cleanup failed for ${file}`);
  }

  await writeFile(file, html, "utf8");
}

console.log("Dashboard pre-layout cleanup completed without injecting a competing runtime.");
