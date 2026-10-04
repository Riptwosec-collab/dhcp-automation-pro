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
  assert.equal(owners[0].name, 'สมชาย ใจดี');
  assert.deepEqual(owners[0].phones, ['0811111111']);
  assert.deepEqual(owners[0].emails, ['somchai@rd.go.th']);
  assert.equal(owners[1].name, 'สุดา ดีมาก');
  assert.deepEqual(owners[1].phones, ['0822222222']);
  assert.deepEqual(owners[1].emails, ['suda@rd.go.th']);
}

function testSequentialContactChunksStayWithPrecedingOwner() {
  const [record] = core.normalizeTorRecords([{
    id: 8,
    systemName: 'Sequential',
    contactRaw: 'นายอริยวิทย์ แท่นจันทร์ 089-7121534, tcl.it@rd.go.th, 081-1111111',
  }]);
  const owners = core.resolveOwners(record);
  assert.equal(owners.length, 1, 'phone/email chunks after a named owner belong on that owner card until another name starts');
  assert.equal(owners[0].name, 'อริยวิทย์ แท่นจันทร์');
  assert.deepEqual(owners[0].phones, ['089-7121534', '081-1111111']);
  assert.deepEqual(owners[0].emails, ['tcl.it@rd.go.th']);
}

function testStripsCommonNameTitlesFromCopyName() {
  const [record] = core.normalizeTorRecords([{
    id: 9,
    systemName: 'Titles',
    contactRaw: 'ดร. สมชาย ใจดี 0811111111 somchai@rd.go.th, รศ.ดร. สุดา ดีมาก 0822222222 suda@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  assert.equal(owners.length, 2);
  assert.equal(owners[0].name, 'สมชาย ใจดี');
  assert.equal(owners[1].name, 'สุดา ดีมาก');
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

function testKeepsEveryContactWhileGroupingSequentialChunks() {
  const [record] = core.normalizeTorRecords([{
    id: 3,
    systemName: 'Sequential ambiguous',
    contactRaw: 'ศิรัณย์ ธรปติธนโรจน์, อดุลย์ พวกไธสง 0991239407, 0818677085 sirun.ta@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  assert.equal(owners.length, 2);
  assert.equal(owners[0].name, 'ศิรัณย์ ธรปติธนโรจน์');
  assert.equal(owners[1].name, 'อดุลย์ พวกไธสง');
  assert.deepEqual(owners[1].phones, ['0991239407', '0818677085']);
  assert.deepEqual(owners[1].emails, ['sirun.ta@rd.go.th']);
}

function testSplitsMultipleTitledOwnersWithoutCommaBoundaries() {
  const [record] = core.normalizeTorRecords([{
    id: 10,
    systemName: 'Real TOR pair',
    contactRaw: 'นางสาวพัชรา ผดุงญาติ นายภูริทัต สนธิพงศ์ 085-2206148 062-234-6591 phatchara.pa@rd.go.th matee.so@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  assert.equal(owners.length, 2, 'two titled people in one TOR cell must become two owner cards');
  assert.equal(owners[0].name, 'พัชรา ผดุงญาติ');
  assert.equal(owners[1].name, 'ภูริทัต สนธิพงศ์');
  assert.deepEqual(owners[0].phones, ['085-2206148']);
  assert.deepEqual(owners[1].phones, ['062-234-6591']);
  assert.deepEqual(owners[0].emails, ['phatchara.pa@rd.go.th']);
  assert.deepEqual(owners[1].emails, ['matee.so@rd.go.th']);
}

function testMapsParallelPhonesAndKeepsSharedGroupEmailSeparate() {
  const [record] = core.normalizeTorRecords([{
    id: 11,
    systemName: 'Real TOR trio',
    contactRaw: 'กลุ่มพัฒนาระบบงานภาษีมูลค่าเพิ่มและภาษีธุรกิจเฉพาะ น.ส.สมใจ เสมอเหมือน นายกีรติ ลาภหงษ์ทอง นายวิญญู โกยกุล 081-732-3108 092-252-1647 098-698-9804 vat.it@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  const named = owners.filter(item=>item.kind==='owner');
  const contacts = owners.filter(item=>item.kind==='unassigned');
  assert.deepEqual(named.map(item=>item.name), ['สมใจ เสมอเหมือน','กีรติ ลาภหงษ์ทอง','วิญญู โกยกุล']);
  assert.deepEqual(named.map(item=>item.phones), [['081-732-3108'],['092-252-1647'],['098-698-9804']]);
  assert.ok(contacts.some(item=>item.emails.includes('vat.it@rd.go.th')), 'shared group email must stay separately copyable instead of being assigned to the last person');
}

function testCapturesFourDigitContactNumbers() {
  const [record] = core.normalizeTorRecords([{
    id: 12,
    systemName: 'Extension only',
    contactRaw: 'กลุ่มตรวจสอบภาษี 8301, 8854',
  }]);
  const contacts = core.resolveOwners(record);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].kind, 'unassigned');
  assert.deepEqual(contacts[0].phones, ['8301','8854']);
}

function testFindsUntitledThaiNameAfterGroupLabel() {
  const [record] = core.normalizeTorRecords([{
    id: 13,
    systemName: 'Untitled name',
    contactRaw: 'กลุ่มพัฒนานวัตกรรมบริการ เด่นชัย สายสุพัฒน์ผล 0841114746 denchai.sa@rd.go.th, innovation.it@rd.go.th',
  }]);
  const owners = core.resolveOwners(record);
  const named = owners.find(item=>item.kind==='owner');
  assert.ok(named, 'Thai name without a title must still be found after a group label');
  assert.equal(named.name, 'เด่นชัย สายสุพัฒน์ผล');
  assert.deepEqual(named.phones, ['0841114746']);
  assert.deepEqual(named.emails, ['denchai.sa@rd.go.th','innovation.it@rd.go.th']);
}

const tests = [
  ['normalize-record', testNormalizesCanonicalTorRecord],
  ['parallel-owners', testReturnsEveryOwnerAndMapsParallelContacts],
  ['sequential-contacts', testSequentialContactChunksStayWithPrecedingOwner],
  ['strip-titles', testStripsCommonNameTitlesFromCopyName],
  ['dedupe-contacts', testDeduplicatesInsideOwnerButKeepsDistinctOwners],
  ['group-contact-chunks', testKeepsEveryContactWhileGroupingSequentialChunks],
  ['multi-owner-cell', testSplitsMultipleTitledOwnersWithoutCommaBoundaries],
  ['parallel-multi-owner', testMapsParallelPhonesAndKeepsSharedGroupEmailSeparate],
  ['four-digit-phones', testCapturesFourDigitContactNumbers],
  ['untitled-group-name', testFindsUntitledThaiNameAfterGroupLabel],
];
const requested=process.argv[2];
const selected=requested?tests.filter(([name])=>name===requested):tests;
assert.ok(selected.length,`unknown TOR owner test: ${requested}`);
for (const [,test] of selected) test();
console.log(`TOR System Finder owner/core tests: ${selected.length}/${selected.length} PASS${requested?` (${requested})`:''}`);
