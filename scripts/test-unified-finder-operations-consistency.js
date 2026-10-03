'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');
const core = require('../tor-system-finder-core.js');

const root = path.resolve(__dirname, '..');
const operations = fs.readFileSync(path.join(root, 'operations-messages.html'), 'utf8');
const ownerLoader = fs.readFileSync(path.join(root, 'system-owner-finder.html'), 'utf8');
const voipLoader = fs.readFileSync(path.join(root, 'voip-finder.html'), 'utf8');

function loadFinderSource(){
  let payload='';
  for(let i=1;i<=7;i++){
    payload += fs.readFileSync(path.join(root,'assets',`system-owner-finder-payload-${String(i).padStart(2,'0')}.txt`),'utf8').trim();
  }
  return zlib.gunzipSync(Buffer.from(payload,'base64')).toString('utf8');
}

function loadBundledTor(source){
  const marker='const BUNDLED_TOR=';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'must locate canonical BUNDLED_TOR');
  const objectStart=source.indexOf('{',start+marker.length);
  assert.ok(objectStart>=0,'must locate BUNDLED_TOR object');
  let depth=0,quote='',escape=false,end=-1;
  for(let i=objectStart;i<source.length;i++){
    const ch=source[i];
    if(quote){
      if(escape){escape=false;continue;}
      if(ch==='\\'){escape=true;continue;}
      if(ch===quote)quote='';
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'&&--depth===0){end=i+1;break;}
  }
  assert.ok(end>objectStart,'must extract balanced BUNDLED_TOR object');
  return vm.runInNewContext(`(${source.slice(objectStart,end)})`,Object.create(null));
}

function testOperationsSingleSource(){
  assert.ok(operations.includes("'power-check':'ตรวจสอบ Switch และ Router พบ log reboot อุปกรณ์ คาดว่าไฟฟ้าดับ ปัจจุบันอุปกรณ์กลับมาใช้งานได้ปกติ '+stamp"), 'power-check must use approved full wording');
  assert.ok(operations.includes("'shutdown-10':'รับทราบปิดระบบ 10 นาที (ตู้ Rack / เครื่องสำรองไฟ) และรอแจ้งเปิดระบบอีกครั้ง'"), 'shutdown-10 copy must match visible text and omit timestamp');
  assert.ok(operations.includes("'ten-complete':'ครบ 10 นาที สามารถเปิดอุปกรณ์ขึ้นมาแล้วแจ้งกลับได้เลย'"), 'ten-complete copy must match visible text and omit timestamp');
  assert.ok(operations.includes("querySelector('.ops-desc')") && operations.includes('navigator.clipboard.writeText(text)'), 'COPY must read the rendered card message so visible text equals copied text');
  assert.ok(operations.includes('renderOperationMessages'), 'card text must be rendered from the single operationText source');
  assert.ok(!operations.includes('<div class="ops-stamp">'), 'separate card timestamp rows must be removed so the visible message is exactly the copied message');
}

function testCanonicalAccNewParity(){
  const source=loadFinderSource();
  const bundled=loadBundledTor(source);
  const all=[...(bundled.primary||[]),...(bundled.secondary||[])];
  const raw=all.find(record=>JSON.stringify(record).toLowerCase().includes('accnew'));
  assert.ok(raw,'canonical TOR payload must contain the AccNew record from the working top Finder');
  const [normalized]=core.normalizeTorRecords([raw]);
  const incident=core.parseIncident(`Monitor ระบบงานบัญชีอิเล็กทรอนิกส์ AccNew Online ไม่สามารถเรียกใช้งานได้\n\nUrl: https://accnew.rd.go.th/Accnewpos/\nhosted on accnew.rd.go.th of Unexpected error occurred. HTTP 503. Temporarily unavailable. The remote server returned an error: (503) Server Unavailable.\nเวลา : Friday, October 2, 2026 12:25 AM`);
  const candidates=core.findCandidates(incident,[normalized]);
  if(!candidates.length){
    console.error('ACCNEW RAW RECORD:', JSON.stringify(raw));
    console.error('ACCNEW NORMALIZED:', JSON.stringify(normalized));
    console.error('ACCNEW INCIDENT:', JSON.stringify(incident));
  }
  assert.ok(candidates.length>=1,'Analyzer must find the same AccNew system that the top TOR Finder finds');
  assert.ok(candidates[0].score>=80,'AccNew candidate must satisfy the approved >=80% threshold');
}

function testWaitingPanelAndThemeContract(){
  const source=loadFinderSource();
  const waitingIndex=source.indexOf('WAITING FOR INCIDENT DATA');
  if(waitingIndex>=0)console.error('WAITING PANEL CONTEXT:', source.slice(Math.max(0,waitingIndex-700),waitingIndex+900));
  assert.ok(ownerLoader.includes('removeLegacyIncidentWaitingPanel'), 'TOR runtime must remove the legacy WAITING FOR INCIDENT DATA panel');
  assert.ok(ownerLoader.includes('unified-finder-theme-v1'), 'TOR/System Owner loader must include unified finder visual theme');
  assert.ok(voipLoader.includes('unified-finder-theme-v1'), 'VOIP loader must include unified finder visual theme');
}

const tests=[testCanonicalAccNewParity,testWaitingPanelAndThemeContract,testOperationsSingleSource];
for(const test of tests)test();
console.log(`Unified Finder + Operations Consistency tests: ${tests.length}/${tests.length} PASS`);
