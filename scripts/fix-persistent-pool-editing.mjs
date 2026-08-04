import { readFile, writeFile } from "node:fs/promises";

const targets = ["index.html", "public/index.html", "dist/index.html"];
const marker = "<!-- persistent-mass-import-and-pool-editing-v1 -->";

const oldUpdateField = "function updateField(id,field,value){pools=pools.map(p=>{if(p.id!==id)return p;if(field==='mac')return{...p,mac:formatMac(value)};if(field==='macRaw')return{...p,mac:value};return{...p,[field]:value}});renderPools();updateConfig()}";
const newUpdateField = "function updateField(id,field,value){pools=pools.map(p=>{if(p.id!==id)return p;if(field==='mac')return{...p,mac:formatMac(value)};if(field==='macRaw')return{...p,mac:value};return{...p,[field]:value}});updateConfig()}";
const clearBulkInputs = "['bulkMac','bulkIp','bulkGateway','bulkVlan'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='' });";
const clearBulkInputsCompact = "['bulkMac','bulkIp','bulkGateway','bulkVlan'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''})";

function patchHtml(source, filePath) {
  if (source.includes(marker)) {
    return { source, changed: false, alreadyPatched: true };
  }

  let output = source;
  const checks = {
    updateField: output.includes(oldUpdateField),
    bulkClear: output.includes(clearBulkInputs) || output.includes(clearBulkInputsCompact),
    poolInputs: /oninput="updateField\([^\"]+\)"/.test(output),
    macBlur: /onblur="updateField\(\$\{p\.id\},'mac',this\.value\)"/.test(output),
  };

  if (checks.updateField) {
    output = output.replace(oldUpdateField, newUpdateField);
  }

  output = output
    .replace(clearBulkInputs, "")
    .replace(clearBulkInputsCompact, "")
    .replace(
      /oninput="updateField\(([^\"]+)\)"(?!\s+onblur=)/g,
      'oninput="updateField($1)" onblur="renderPools()"',
    )
    .replace(
      /onblur="updateField\(\$\{p\.id\},'mac',this\.value\)"/g,
      'onblur="updateField(${p.id},\'mac\',this.value);renderPools()"',
    );

  const missing = Object.entries(checks)
    .filter(([, found]) => !found)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(
      `[fix-persistent-pool-editing] Cannot safely patch ${filePath}; missing patterns: ${missing.join(", ")}`,
    );
  }

  if (output === source) {
    throw new Error(`[fix-persistent-pool-editing] No changes were applied to ${filePath}`);
  }

  output = output.replace("</body>", `  ${marker}\n</body>`);
  return { source: output, changed: true, alreadyPatched: false };
}

let patchedCount = 0;

for (const filePath of targets) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }

  const result = patchHtml(source, filePath);
  if (result.changed) {
    await writeFile(filePath, result.source, "utf8");
    patchedCount += 1;
    console.log(`[fix-persistent-pool-editing] Patched ${filePath}`);
  } else if (result.alreadyPatched) {
    console.log(`[fix-persistent-pool-editing] Already patched ${filePath}`);
  }
}

if (!patchedCount) {
  console.log("[fix-persistent-pool-editing] No new changes required");
}
