'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');
const {execFileSync} = require('child_process');
const core = require('../tor-system-finder-core.js');

const root = path.resolve(__dirname, '..');
const operationsPath = path.join(root, 'operations-messages.html');
const operations = fs.readFileSync(operationsPath, 'utf8');
const ownerLoader = fs.readFileSync(path.join(root, 'system-owner-finder.html'), 'utf8');
const ownerUi = fs.readFileSync(path.join(root, 'tor-system-finder-upgrade.js'), 'utf8');
const ownerTheme = fs.readFileSync(path.join(root, 'tor-system-finder-upgrade.css'), 'utf8');
const voipLoader = fs.readFileSync(path.join(root, 'voip-finder.html'), 'utf8');

function loadFinderSource(){let payload='';for(let i=1;i<=7;i++)payload+=fs.readFileSync(path.join(root,'assets',`system-owner-finder-payload-${String(i).padStart(2,'0')}.txt`),'utf8').trim();return zlib.gunzipSync(Buffer.from(payload,'base64')).toString('utf8');}
function loadBundledTor(source){const marker='const BUNDLED_TOR=',start=source.indexOf(marker);assert.ok(start>=0,'must locate canonical BUNDLED_TOR');const objectStart=source.indexOf('{',start+marker.length);assert.ok(objectStart>=0,'must locate BUNDLED_TOR object');let depth=0,quote='',escape=false,end=-1;for(let i=objectStart;i<source.length;i++){const ch=source[i];if(quote){if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch===quote)quote='';continue;}if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end=i+1;break;}}assert.ok(end>objectStart,'must extract balanced BUNDLED_TOR object');return vm.runInNewContext(`(${source.slice(objectStart,end)})`,Object.create(null));}
function cardByKey(key){const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp(`<article class="ops-card">(?:(?!<\\/article>)[\\s\\S])*?copyOperationMessage\\('${escaped}',this\\)(?:(?!<\\/article>)[\\s\\S])*?<\\/article>`);const match=operations.match(re);assert.ok(match,`missing rendered operation card ${key}`);return match[0];}

function testOperationsSingleSource(){
  assert.ok(operations.includes("'power-check':{body:'ตรวจสอบ Switch และ Router พบ log reboot อุปกรณ์ คาดว่าไฟฟ้าดับ ปัจจุบันอุปกรณ์กลับมาใช้งานได้ปกติ',stamp}"),'power-check must use approved full wording plus visible stamp');
  assert.ok(operations.includes("'shutdown-10':{body:'รับทราบปิดระบบ 10 นาที (ตู้ Rack / เครื่องสำรองไฟ) และรอแจ้งเปิดระบบอีกครั้ง',stamp:''}"),'shutdown-10 must match visible text and omit timestamp');
  assert.ok(operations.includes("'ten-complete':{body:'ครบ 10 นาที สามารถเปิดอุปกรณ์ขึ้นมาแล้วแจ้งกลับได้เลย',stamp:''}"),'ten-complete must match visible text and omit timestamp');
  assert.ok(operations.includes("querySelector('.ops-desc')")&&operations.includes("querySelector('.ops-stamp')")&&operations.includes('navigator.clipboard.writeText(text)'),'COPY must read visible description + visible stamp from the selected card');
  assert.ok(operations.includes('function renderOperationMessages')&&operations.includes("querySelectorAll('[data-operation-key]')"),'card text must be rendered from the same operation message source');
  assert.ok(!cardByKey('shutdown-10').includes('ops-stamp'),'shutdown-10 visible card must have no timestamp');
  assert.ok(!cardByKey('ten-complete').includes('ops-stamp'),'ten-complete visible card must have no timestamp');
  assert.ok(cardByKey('power-check').includes('ops-stamp'),'power-check must visibly show the same timestamp copied with its message');
}

function testCanonicalAccNewParity(){
  const source=loadFinderSource(),bundled=loadBundledTor(source),primary=bundled.primary||[],fallback=bundled.fallback||[];
  const raw=[...primary,...fallback].find(record=>JSON.stringify(record).toLowerCase().includes('accnew'));assert.ok(raw,'canonical TOR payload must contain the AccNew record from the working top Finder');
  const [normalized]=core.normalizeTorRecords([raw]);
  const incident=core.parseIncident(`Monitor ระบบงานบัญชีอิเล็กทรอนิกส์ AccNew Online ไม่สามารถเรียกใช้งานได้\n\nUrl: https://accnew.rd.go.th/Accnewpos/\nhosted on accnew.rd.go.th of Unexpected error occurred. HTTP 503. Temporarily unavailable. The remote server returned an error: (503) Server Unavailable.\nเวลา : Friday, October 2, 2026 12:25 AM`);
  const candidates=core.findCandidates(incident,[normalized]);assert.ok(candidates.length>=1,'Analyzer must find the same AccNew system that the top TOR Finder finds');assert.ok(candidates[0].score>=80,'AccNew candidate must satisfy the approved >=80% threshold');
  assert.ok(ownerLoader.includes('BUNDLED_TOR.fallback'),'Analyzer bridge must include the same bundled fallback records searched by the top Finder');assert.ok(ownerLoader.includes('currentMeta')&&ownerLoader.includes("mode==='Bundled'"),'fallback records must only join the canonical pool in bundled mode');
}

function testWaitingPanelAndThemeContract(){const source=loadFinderSource();assert.ok(source.includes('WAITING FOR INCIDENT DATA'),'fixture must prove the legacy Finder still contains its idle panel before runtime upgrade');assert.ok(ownerUi.includes('function removeLegacyIncidentWaitingPanel'),'TOR runtime must remove the legacy WAITING FOR INCIDENT DATA panel');assert.ok(ownerUi.includes("includes('WAITING FOR INCIDENT DATA')"),'waiting-panel removal must target that legacy state specifically');assert.ok(ownerTheme.includes('unified-finder-theme-v1'),'TOR/System Owner interior must include the unified premium visual theme');assert.ok(voipLoader.includes('unified-finder-theme-v1'),'VOIP interior must include the unified premium visual theme');}

function testProductionWorkflowAndIdempotency(){
  const workflow=fs.readFileSync(path.join(root,'.github','workflows','resize-dhcp-fields.yml'),'utf8');
  assert.ok(workflow.includes('python scripts/add-unified-finder-operations-consistency.py'),'main-generation workflow must apply the unified consistency generator');
  assert.ok(workflow.includes('node scripts/test-unified-finder-operations-consistency.js'),'main-generation workflow must verify unified consistency before commit');
  const before=fs.readFileSync(operationsPath);
  execFileSync('python',[path.join(root,'scripts','add-unified-finder-operations-consistency.py')],{cwd:root,stdio:'pipe'});
  const after=fs.readFileSync(operationsPath);
  if(!before.equals(after)){
    const b=before.toString('utf8'),a=after.toString('utf8');let at=0;while(at<b.length&&at<a.length&&b[at]===a[at])at++;
    console.error('IDEMPOTENCY FIRST DIFF OFFSET:',at,'BEFORE_LEN:',b.length,'AFTER_LEN:',a.length);
    console.error('IDEMPOTENCY BEFORE:',JSON.stringify(b.slice(Math.max(0,at-180),at+420)));
    console.error('IDEMPOTENCY AFTER :',JSON.stringify(a.slice(Math.max(0,at-180),at+420)));
  }
  assert.ok(before.equals(after),'Unified consistency generator must be byte-for-byte idempotent');
}

const tests=[testCanonicalAccNewParity,testWaitingPanelAndThemeContract,testOperationsSingleSource,testProductionWorkflowAndIdempotency];for(const test of tests)test();console.log(`Unified Finder + Operations Consistency tests: ${tests.length}/${tests.length} PASS`);
