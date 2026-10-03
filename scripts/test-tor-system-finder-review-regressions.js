'use strict';

const assert = require('assert');
const core = require('../tor-system-finder-core.js');

function testMultilineMonitorIsCapturedUntilIncidentMarkers() {
  const raw = `Monitor ระบบการจัดทำใบกำกับภาษี
โดยการประทับรับรองเวลา (Time Stamp)
ไม่สามารถเรียกใช้งานได้

URL: https://intrapp2.rd.go.th/signed_intra/login/login.php
hosted on 10.20.17.71 of Network connection failed. Unable to connect to the remote server
เวลา : Wednesday, September 30, 2026 10:05 PM`;
  const incident = core.parseIncident(raw);
  assert.equal(
    incident.monitor,
    'ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp) ไม่สามารถเรียกใช้งานได้'
  );
  assert.equal(
    incident.systemName,
    'ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp)'
  );
}

function testAmbiguousStandaloneContactsStayUnassignedInsteadOfBeingInventedForLastOwner() {
  const [record] = core.normalizeTorRecords([{
    id: 88,
    systemName: 'Ambiguous contacts',
    contactRaw: 'ศิรัณย์ ธรปติธนโรจน์, อดุลย์ พวกไธสง 0991239407, 0818677085 sirun.ta@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  assert.equal(owners.length, 3, 'standalone contact chunk must remain a separate unassigned contact card');
  assert.equal(owners[0].name, 'ศิรัณย์ ธรปติธนโรจน์');
  assert.deepEqual(owners[0].phones, []);
  assert.deepEqual(owners[0].emails, []);
  assert.equal(owners[1].name, 'อดุลย์ พวกไธสง');
  assert.deepEqual(owners[1].phones, ['0991239407']);
  assert.deepEqual(owners[1].emails, []);
  assert.equal(owners[2].name, '');
  assert.deepEqual(owners[2].phones, ['0818677085']);
  assert.deepEqual(owners[2].emails, ['sirun.ta@rd.go.th']);
}

const tests = [
  testMultilineMonitorIsCapturedUntilIncidentMarkers,
  testAmbiguousStandaloneContactsStayUnassignedInsteadOfBeingInventedForLastOwner,
];
for (const test of tests) test();
console.log(`TOR System Finder review regression tests: ${tests.length}/${tests.length} PASS`);
