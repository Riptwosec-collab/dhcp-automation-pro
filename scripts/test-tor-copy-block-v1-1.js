'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'tor-system-finder-core.js'));
const ui = fs.readFileSync(path.join(root, 'tor-system-finder-upgrade.js'), 'utf8');

const tablePaste = `Subject\nRequest Detail\n\nUrl: https://accnew.rd.go.th/Accnewpos/\nhosted on accnew.rd.go.th of Unexpected error occurred. HTTP 503. Temporarily unavailable. The remote server returned an error: (503) Server Unavailable.\nเวลา : Friday, October 2, 2026 12:25 AM`;
const cleanIncident = `Url: https://accnew.rd.go.th/Accnewpos/\nhosted on accnew.rd.go.th of Unexpected error occurred. HTTP 503. Temporarily unavailable. The remote server returned an error: (503) Server Unavailable.\nเวลา : Friday, October 2, 2026 12:25 AM`;

function testTablePasteDropsWrapperHeaders(){
  const incident = core.parseIncident(tablePaste);
  assert.equal(incident.url, 'https://accnew.rd.go.th/Accnewpos/');
  assert.equal(incident.host, 'accnew.rd.go.th');
  assert.equal(incident.incidentRaw, cleanIncident);
  assert.ok(!incident.incidentRaw.includes('Subject'));
  assert.ok(!incident.incidentRaw.includes('Request Detail'));
  const draft = core.buildMailDraft(incident, null);
  assert.ok(draft.includes(cleanIncident));
  assert.ok(!draft.includes('Subject'));
  assert.ok(!draft.includes('Request Detail'));
}

function testUrlStatusControlsResolutionCopy(){
  const incident = core.parseIncident(`Monitor ระบบงานบัญชีอิเล็กทรอนิกส์ AccNew Online ไม่สามารถเรียกใช้งานได้\n\n${cleanIncident}`);
  const normal = core.buildOperationalBlocks(incident, 'normal');
  const abnormal = core.buildOperationalBlocks(incident, 'abnormal');
  const url = 'https://accnew.rd.go.th/Accnewpos/';

  assert.equal(normal.urlStatus, `ตรวจสอบสามารถใช้งาน Url: ${url} ได้ปกติ`);
  assert.equal(abnormal.urlStatus, `ตรวจสอบไม่สามารถใช้งาน Url: ${url} ได้ปกติ`);
  assert.ok(normal.combinedResolution.includes(`แก้ไขโดย : ${normal.urlStatus}`));
  assert.ok(abnormal.combinedResolution.includes(`แก้ไขโดย : ${abnormal.urlStatus}`));
  assert.ok(!Object.prototype.hasOwnProperty.call(normal, 'ticketAction'), 'TICKET ACTION must be removed from v1.1 output');
}

function testUiUsesOneUrlDropdownAndFourCopyCards(){
  for(const needle of [
    'id="torUrlStatus"',
    'value="normal"',
    'value="abnormal"',
    'URL ปกติ',
    'URL ไม่ปกติ',
    "event.target.closest('#torUrlStatus')",
    "renderOperationalBlocks(currentIncident,event.target.value)",
    'URL STATUS',
    'MONITOR ORIGINAL',
    'MONITOR + RESOLUTION',
    'MAIL COMPLETION',
  ]) assert.ok(ui.includes(needle), `missing v1.1 UI contract: ${needle}`);

  for(const forbidden of ['TICKET ACTION','COPY TICKET ACTION']){
    assert.ok(!ui.includes(forbidden), `removed v1.1 UI must not contain: ${forbidden}`);
  }
}

const tests = [
  testTablePasteDropsWrapperHeaders,
  testUrlStatusControlsResolutionCopy,
  testUiUsesOneUrlDropdownAndFourCopyCards,
];
for(const test of tests) test();
console.log(`TOR Copy Block v1.1 tests: ${tests.length}/${tests.length} PASS`);
