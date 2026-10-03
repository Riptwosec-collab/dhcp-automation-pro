'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');
const core = require('../tor-system-finder-core.js');

function testMultilineMonitorIsCapturedUntilIncidentMarkers() {
  const raw = `Monitor ระบบการจัดทำใบกำกับภาษี
โดยการประทับรับรองเวลา (Time Stamp)
ไม่สามารถเรียกใช้งานได้

URL: https://intrapp2.rd.go.th/signed_intra/login/login.php
hosted on 10.20.17.71 of Network connection failed. Unable to connect to the remote server
เวลา : Wednesday, September 30, 2026 10:05 PM`;
  const incident = core.parseIncident(raw);
  assert.equal(incident.monitor,'ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp) ไม่สามารถเรียกใช้งานได้');
  assert.equal(incident.systemName,'ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp)');
  assert.equal(incident.monitorRaw,'Monitor ระบบการจัดทำใบกำกับภาษี\nโดยการประทับรับรองเวลา (Time Stamp)\nไม่สามารถเรียกใช้งานได้');
}

function testSequentialStandaloneContactsGroupWithLastNamedOwner() {
  const [record] = core.normalizeTorRecords([{id:88,systemName:'Grouped contacts',contactRaw:'ศิรัณย์ ธรปติธนโรจน์, อดุลย์ พวกไธสง 0991239407, 0818677085 sirun.ta@rd.go.th'}]);
  const owners = core.resolveOwners(record);
  assert.equal(owners.length,2,'contact-only chunks after a named owner stay on that owner card');
  assert.equal(owners[0].name,'ศิรัณย์ ธรปติธนโรจน์');
  assert.equal(owners[0].kind,'owner');
  assert.deepEqual(owners[0].phones,[]);
  assert.deepEqual(owners[0].emails,[]);
  assert.equal(owners[1].name,'อดุลย์ พวกไธสง');
  assert.equal(owners[1].kind,'owner');
  assert.deepEqual(owners[1].phones,['0991239407','0818677085']);
  assert.deepEqual(owners[1].emails,['sirun.ta@rd.go.th']);
}

function extractBalancedObject(source,start){
  const open=source.indexOf('{',start);
  assert.ok(open>=0,'BUNDLED_TOR must begin with an object literal');
  let depth=0, quote='', escaped=false;
  for(let i=open;i<source.length;i++){
    const ch=source[i];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(ch==='\\'){escaped=true;continue;}
      if(ch===quote)quote='';
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(depth===0)return source.slice(open,i+1);
    }
  }
  throw new Error('unterminated BUNDLED_TOR object literal');
}

function loadBundledTor(){
  const root=path.resolve(__dirname,'..');
  let payload='';
  for(let i=1;i<=7;i++)payload+=fs.readFileSync(path.join(root,'assets',`system-owner-finder-payload-${String(i).padStart(2,'0')}.txt`),'utf8').trim();
  const source=zlib.gunzipSync(Buffer.from(payload,'base64')).toString('utf8');
  const start=source.indexOf('const BUNDLED_TOR=');
  assert.ok(start>=0,'must locate canonical BUNDLED_TOR declaration');
  const literal=extractBalancedObject(source,start);
  return vm.runInNewContext(`(${literal})`,Object.create(null));
}

function testCanonicalTorPayloadMapsIntoOwnerRecords(){
  const bundled=loadBundledTor();
  assert.ok(Array.isArray(bundled.primary)&&bundled.primary.length>0,'canonical primary TOR dataset must contain records');
  const normalized=core.normalizeTorRecords(bundled.primary);
  assert.equal(normalized.length,bundled.primary.length,'normalizer must preserve canonical record count');
  assert.ok(normalized.some(record=>record.systemName),'canonical records must yield searchable system names');
  assert.ok(normalized.some(record=>record.ips.length),'canonical records must yield at least one IP for exact matching');
  assert.ok(normalized.some(record=>record.urls.length||record.hosts.length),'canonical records must yield URL/Host evidence');
  assert.ok(normalized.some(record=>core.resolveOwners(record).some(owner=>owner.name||owner.phones.length||owner.emails.length)),'canonical records must yield owner/contact data');
}

const tests=[testMultilineMonitorIsCapturedUntilIncidentMarkers,testSequentialStandaloneContactsGroupWithLastNamedOwner,testCanonicalTorPayloadMapsIntoOwnerRecords];
for(const test of tests)test();
console.log(`TOR System Finder review regression tests: ${tests.length}/${tests.length} PASS`);
