'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'tor-system-finder-core.js'));
const upgrade = require(path.join(root, 'tor-system-finder-upgrade.js'));
const ui = fs.readFileSync(path.join(root, 'tor-system-finder-upgrade.js'), 'utf8');

const tablePaste = `Subject\nRequest Detail\n\nUrl: https://accnew.rd.go.th/Accnewpos/\nhosted on accnew.rd.go.th of Unexpected error occurred. HTTP 503. Temporarily unavailable. The remote server returned an error: (503) Server Unavailable.\nเวลา : Friday, October 2, 2026 12:25 AM`;
const cleanIncident = `Url: https://accnew.rd.go.th/Accnewpos/\nhosted on accnew.rd.go.th of Unexpected error occurred. HTTP 503. Temporarily unavailable. The remote server returned an error: (503) Server Unavailable.\nเวลา : Friday, October 2, 2026 12:25 AM`;

function testTablePasteDropsWrapperHeaders(){
  assert.equal(typeof upgrade.cleanIncidentInput, 'function', 'v1.1 must expose pure incident wrapper cleanup');
  const cleaned = upgrade.cleanIncidentInput(tablePaste);
  assert.equal(cleaned, cleanIncident);
  const incident = core.parseIncident(cleaned);
  assert.equal(incident.url, 'https://accnew.rd.go.th/Accnewpos/');
  assert.equal(incident.host, 'accnew.rd.go.th');
  const draft = core.buildMailDraft(incident, null);
  assert.ok(draft.includes(cleanIncident));
  assert.ok(!draft.includes('Subject'));
  assert.ok(!draft.includes('Request Detail'));
}

function testUrlStatusDoesNotChangeResolutionCopy(){
  assert.equal(typeof upgrade.buildUrlStatusView, 'function', 'v1.1.1 must expose pure URL status selection');
  const incident = core.parseIncident(`Monitor ระบบงานบัญชีอิเล็กทรอนิกส์ AccNew Online ไม่สามารถเรียกใช้งานได้\n\n${cleanIncident}`);
  const blocks = core.buildOperationalBlocks(incident);
  const normal = upgrade.buildUrlStatusView(blocks, 'normal');
  const abnormal = upgrade.buildUrlStatusView(blocks, 'abnormal');
  const fixedResolution = `${blocks.monitorOriginal}\nแก้ไขโดย : ${blocks.urlNormal}`;

  assert.equal(normal.urlStatus, blocks.urlNormal);
  assert.equal(abnormal.urlStatus, blocks.urlAbnormal);
  assert.equal(normal.combinedResolution, fixedResolution);
  assert.equal(abnormal.combinedResolution, fixedResolution, 'URL status dropdown must not change MONITOR + RESOLUTION');
}

function testUiUsesOneUrlDropdownAndFourCopyCards(){
  for(const needle of [
    'id="torUrlStatus"',
    'value="normal"',
    'value="abnormal"',
    'URL ปกติ',
    'URL ไม่ปกติ',
    "event.target.closest('#torUrlStatus')",
    'URL STATUS',
    'MONITOR ORIGINAL',
    'MONITOR + RESOLUTION',
    'MAIL COMPLETION',
  ]) assert.ok(ui.includes(needle), `missing v1.1.1 UI contract: ${needle}`);

  for(const forbidden of ['TICKET ACTION','COPY TICKET ACTION']){
    assert.ok(!ui.includes(forbidden), `removed v1.1 UI must not contain: ${forbidden}`);
  }
}

const tests = [
  testTablePasteDropsWrapperHeaders,
  testUrlStatusDoesNotChangeResolutionCopy,
  testUiUsesOneUrlDropdownAndFourCopyCards,
];
for(const test of tests) test();
console.log(`TOR Copy Block v1.1.1 tests: ${tests.length}/${tests.length} PASS`);
