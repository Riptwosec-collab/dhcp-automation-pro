'use strict';

const assert = require('assert');
const core = require('../tor-system-finder-core.js');

function testNormalizesCanonicalTorRecord() {
  const [record] = core.normalizeTorRecords([{
    id: 42,
    systemName: 'ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp)',
    ip: '10.20.17.71',
    url: 'https://intrapp2.rd.go.th/signed_intra/login/login.php',
    contactRaw: 'นายสมชาย ใจดี 0811111111 somchai@rd.go.th',
  }]);
  assert.equal(record.id, 42);
  assert.equal(record.systemName, 'ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp)');
  assert.deepEqual(record.ips, ['10.20.17.71']);
  assert.deepEqual(record.urls, ['https://intrapp2.rd.go.th/signed_intra/login/login.php']);
  assert.deepEqual(record.hosts, ['intrapp2.rd.go.th']);
  assert.deepEqual(record.domains, ['rd.go.th']);
  assert.equal(record.raw.contactRaw, 'นายสมชาย ใจดี 0811111111 somchai@rd.go.th');
}

function testReturnsEveryOwnerAndMapsParallelContacts() {
  const [record] = core.normalizeTorRecords([{
    id: 7,
    systemName: 'Example',
    ip: '10.0.0.7',
    url: 'https://example.rd.go.th/',
    contactRaw: 'นายสมชาย ใจดี 0811111111 somchai@rd.go.th, นางสาวสุดา ดีมาก 0822222222 suda@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  assert.equal(owners.length, 2);
  assert.equal(owners[0].prefix, 'นาย');
  assert.equal(owners[0].name, 'สมชาย ใจดี');
  assert.deepEqual(owners[0].phones, ['0811111111']);
  assert.deepEqual(owners[0].emails, ['somchai@rd.go.th']);
  assert.equal(owners[1].prefix, 'นางสาว');
  assert.equal(owners[1].name, 'สุดา ดีมาก');
  assert.deepEqual(owners[1].phones, ['0822222222']);
  assert.deepEqual(owners[1].emails, ['suda@rd.go.th']);
}

function testDeduplicatesInsideOwnerButKeepsDistinctOwners() {
  const [single] = core.normalizeTorRecords([{
    id: 1,
    systemName: 'Single',
    contactRaw: 'นายหนึ่ง ทดสอบ 0811111111 0811111111 one@rd.go.th one@rd.go.th',
  }]);
  const one = core.resolveOwners(single);
  assert.equal(one.length, 1);
  assert.deepEqual(one[0].phones, ['0811111111']);
  assert.deepEqual(one[0].emails, ['one@rd.go.th']);

  const [shared] = core.normalizeTorRecords([{
    id: 2,
    systemName: 'Shared',
    contactRaw: 'นายหนึ่ง ทดสอบ 0811111111 one@rd.go.th, นายสอง ทดสอบ 0811111111 one@rd.go.th',
  }]);
  const two = core.resolveOwners(shared);
  assert.equal(two.length, 2, 'owners sharing a contact must remain distinct identities');
  assert.equal(two[0].name, 'หนึ่ง ทดสอบ');
  assert.equal(two[1].name, 'สอง ทดสอบ');
  assert.deepEqual(two[0].phones, ['0811111111']);
  assert.deepEqual(two[1].phones, ['0811111111']);
}

function testKeepsAmbiguousContactsWithoutInventingAssociation() {
  const [record] = core.normalizeTorRecords([{
    id: 3,
    systemName: 'Ambiguous',
    contactRaw: 'ศิรัณย์ ธรปติธนโรจน์, อดุลย์ พวกไธสง 0991239407, 0818677085 sirun.ta@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  assert.ok(owners.some(owner => owner.name === 'ศิรัณย์ ธรปติธนโรจน์'));
  assert.ok(owners.some(owner => owner.name === 'อดุลย์ พวกไธสง'));
  const allPhones = owners.flatMap(owner => owner.phones);
  const allEmails = owners.flatMap(owner => owner.emails);
  assert.ok(allPhones.includes('0991239407'));
  assert.ok(allPhones.includes('0818677085'));
  assert.ok(allEmails.includes('sirun.ta@rd.go.th'));
}

const tests = [
  testNormalizesCanonicalTorRecord,
  testReturnsEveryOwnerAndMapsParallelContacts,
  testDeduplicatesInsideOwnerButKeepsDistinctOwners,
  testKeepsAmbiguousContactsWithoutInventingAssociation,
];
for (const test of tests) test();
console.log(`TOR System Finder owner/core tests: ${tests.length}/${tests.length} PASS`);
