const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const dataCode=fs.readFileSync('assets/tor-system-data-1.js','utf8');
const matcherCode=fs.readFileSync('assets/tor-system-matcher.js','utf8');
const finderHtml=fs.readFileSync('tor-system-finder.html','utf8');
const sandbox={window:{},URL,console};
vm.runInNewContext(dataCode,sandbox,{filename:'assets/tor-system-data-1.js'});
assert(sandbox.window.TOR_SYSTEM_DATA_JSON,'TOR system data JSON must be assembled');
const data=JSON.parse(sandbox.window.TOR_SYSTEM_DATA_JSON);
assert.strictEqual(data.primary.length,50,'approved bundled TOR primary source must keep 50 records');
assert.strictEqual(data.fallback.length,50,'approved bundled TOR fallback source must keep 50 records');
const wht=data.primary.find(row=>Number(row.id)===44);
assert(wht?.contactRaw.includes('ช่วงเวลาตี 3 ของทุกวัน'),'quoted WHT operational note from the supplied TOR source must be preserved');

vm.runInNewContext(matcherCode,sandbox,{filename:'assets/tor-system-matcher.js'});
const matcher=sandbox.TORSystemMatcher;
assert(matcher&&typeof matcher.findMatches==='function','TOR matcher API must be available');

const records=data.primary.map(matcher.prepareRecord);
const exact=matcher.findMatches('Url: https://fnet.rd.go.th/fnet/user/login.php',records);
assert.strictEqual(exact.mode,'match','exact TOR URL must produce one safe match');
assert.strictEqual(exact.best.score,100,'exact TOR URL must score 100');
assert(exact.best.record.systemName.includes('F-Net'),'exact TOR URL must resolve F-Net');

const duplicateIp=matcher.findMatches('103.51.65.20',records);
assert.strictEqual(duplicateIp.mode,'candidates','shared IP alone must not guess one system');
assert(duplicateIp.candidates.length>=3,'shared e-Filing IP must expose multiple candidates');

const named=matcher.findMatches('ระบบงานบริการฐานข้อมูลเลขประจำตัวแห่งชาติ (NID) ไม่สามารถใช้งานได้',records);
assert.strictEqual(named.mode,'match','exact system name must resolve the TOR owner');
assert(named.best.record.systemName.includes('(NID)'),'NID incident must resolve NID system');

const contact=matcher.extractContact('Test Owner 089-7121534 owner@example.com');
assert(contact.phones.length===1&&contact.emails[0]==='owner@example.com','contact extraction must keep phone/email routing');

const inlineScripts=[...finderHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
assert(inlineScripts.length>=1,'embedded finder must contain its browser runtime');
inlineScripts.forEach((code,index)=>new vm.Script(code,{filename:`tor-system-finder.inline-${index+1}.js`}));

console.log('system owner finder matcher + data + inline syntax: OK');
