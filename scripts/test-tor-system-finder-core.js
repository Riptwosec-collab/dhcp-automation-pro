'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const corePath = path.join(__dirname, '..', 'tor-system-finder-core.js');
assert.ok(fs.existsSync(corePath), 'tor-system-finder-core.js must exist');
const core = require(corePath);

const sample = `Monitor ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp) ไม่สามารถเรียกใช้งานได้

Url: https://intrapp2.rd.go.th/signed_intra/login/login.php
hosted on 10.20.17.71 of Network connection failed. Unable to connect to the remote server
เวลา : Wednesday, September 30, 2026 10:05 PM`;
const sampleMonitor = 'Monitor ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp) ไม่สามารถเรียกใช้งานได้';
const sampleIncidentBody = `Url: https://intrapp2.rd.go.th/signed_intra/login/login.php
hosted on 10.20.17.71 of Network connection failed. Unable to connect to the remote server
เวลา : Wednesday, September 30, 2026 10:05 PM`;

function testExtractsSampleIncidentFields() {
  const result = core.parseIncident(sample);
  assert.equal(result.url, 'https://intrapp2.rd.go.th/signed_intra/login/login.php');
  assert.equal(result.host, 'intrapp2.rd.go.th');
  assert.equal(result.domain, 'rd.go.th');
  assert.equal(result.ip, '10.20.17.71');
  assert.equal(result.error, 'Network connection failed. Unable to connect to the remote server');
  assert.equal(result.time, 'Wednesday, September 30, 2026 10:05 PM');
  assert.ok(result.monitor.includes('Time Stamp'));
  assert.equal(result.monitorRaw, sampleMonitor);
  assert.equal(result.incidentRaw, sampleIncidentBody);
  assert.ok(!result.systemName.startsWith('Monitor '));
  assert.ok(!result.systemName.includes('ไม่สามารถเรียกใช้งานได้'));
  assert.ok(result.systemName.includes('Time Stamp'));
}

function testAcceptsEscapedUrlAndUrlLabelVariants() {
  const escaped = `Monitor ระบบทดสอบ ไม่สามารถเรียกใช้งานได้\r\nURL: https\\://intrapp2.rd.go.th/signed_intra/login/login.php\r\nhosted on 10.20.17.71 of Network connection failed. Unable to connect to the remote server\r\nTime : Wednesday, September 30, 2026 10:05 PM`;
  const result = core.parseIncident(escaped);
  assert.equal(result.url, 'https://intrapp2.rd.go.th/signed_intra/login/login.php');
  assert.equal(result.host, 'intrapp2.rd.go.th');
  assert.equal(result.ip, '10.20.17.71');
}

function testNormalizesCrlfSpacesAndBlankLines() {
  const noisy = `  Monitor   ระบบการจัดทำใบกำกับภาษี   โดยการประทับรับรองเวลา (Time Stamp) ไม่สามารถเรียกใช้งานได้\r\n\r\n URL:   https://intrapp2.rd.go.th/signed_intra/login/login.php   \r\n hosted on   10.20.17.71   of   Network connection failed. Unable to connect to the remote server \r\n เวลา :   Wednesday, September 30, 2026 10:05 PM   `;
  const result = core.parseIncident(noisy);
  assert.equal(result.url, 'https://intrapp2.rd.go.th/signed_intra/login/login.php');
  assert.equal(result.host, 'intrapp2.rd.go.th');
  assert.equal(result.ip, '10.20.17.71');
  assert.equal(result.time, 'Wednesday, September 30, 2026 10:05 PM');
}

function testDerivesHostAndDomainFromUrl() {
  const result = core.parseIncident('Monitor ABC\nUrl: https://service.example.com/a/b');
  assert.equal(result.host, 'service.example.com');
  assert.equal(result.domain, 'example.com');
}

function testExtractsHostedOnIpAndError() {
  const result = core.parseIncident('Monitor ABC\nhosted on 10.20.17.71 of HTTP 503. Temporarily unavailable.');
  assert.equal(result.ip, '10.20.17.71');
  assert.equal(result.error, 'HTTP 503. Temporarily unavailable.');
}

function testAllowsMissingOptionalFields() {
  const result = core.parseIncident('Monitor ระบบทดสอบ ไม่สามารถเรียกใช้งานได้');
  assert.equal(result.url, '');
  assert.equal(result.host, '');
  assert.equal(result.domain, '');
  assert.equal(result.ip, '');
  assert.equal(result.error, '');
  assert.equal(result.time, '');
  assert.equal(result.systemName, 'ระบบทดสอบ');
}

function record(id, systemName, {ips=[], hosts=[], domains=[], urls=[]}={}) {
  return {id, systemName, ips, hosts, domains, urls, owners:[], raw:{}};
}

function testExactIpIsOneHundredPercent() {
  const incident = core.parseIncident('Monitor Anything\nhosted on 10.20.17.71 of down');
  const candidate = core.scoreCandidate(incident, record('a', 'Different Name', {ips:['10.20.17.71']}));
  assert.equal(candidate.score, 100);
  assert.equal(candidate.matchMode, 'ip-exact');
  assert.ok(candidate.evidence.some(item=>item.field==='IP' && item.matched && item.contribution===100));
}

function testMultipleExactIpRecordsAreAllReturned() {
  const incident = core.parseIncident('Monitor Anything\nhosted on 10.20.17.71 of down');
  const records = [
    record('a','A',{ips:['10.20.17.71']}),
    record('b','B',{ips:['10.20.17.71']}),
    record('c','C',{hosts:['intrapp2.rd.go.th'],domains:['rd.go.th']}),
  ];
  assert.deepEqual(core.findCandidates(incident, records).map(x=>x.record.id), ['a','b']);
}

function testExactHostUsesSixtyPlusNameForty() {
  const incident = {ip:'',host:'intrapp2.rd.go.th',domain:'rd.go.th',systemName:'one two three four'};
  assert.equal(core.systemNameSimilarity(incident.systemName, 'one two three five'), 76);
  const candidate = core.scoreCandidate(incident, record('host','one two three five',{hosts:['intrapp2.rd.go.th'],domains:['rd.go.th']}));
  assert.equal(candidate.score, 90);
  assert.equal(candidate.matchMode, 'host-name');
  assert.ok(candidate.evidence.some(item=>item.field==='Host' && item.contribution===60));
  assert.ok(candidate.evidence.some(item=>item.field==='System Name' && item.contribution===30));
}

function testDomainUsesThirtyPlusNameSeventyAndKeepsExactlyEighty() {
  const incident = {ip:'',host:'other.rd.go.th',domain:'rd.go.th',systemName:'one two three four'};
  assert.equal(core.systemNameSimilarity(incident.systemName, 'one two three six'), 72);
  const candidate = core.scoreCandidate(incident, record('domain','one two three six',{hosts:['another.rd.go.th'],domains:['rd.go.th']}));
  assert.equal(candidate.score, 80);
  assert.equal(candidate.matchMode, 'domain-name');
  assert.deepEqual(core.findCandidates(incident,[candidate.record]).map(x=>x.score),[80]);
}

function testWeakGenericDomainCandidateIsExcluded() {
  const incident = {ip:'',host:'other.rd.go.th',domain:'rd.go.th',systemName:'tax timestamp service'};
  const weak = record('weak','unrelated payroll portal',{domains:['rd.go.th']});
  assert.deepEqual(core.findCandidates(incident,[weak]),[]);
}

function testCandidatesSortDescendingAndPreserveTies() {
  const incident = {ip:'',host:'svc.rd.go.th',domain:'rd.go.th',systemName:'one two three four'};
  const records = [
    record('domain80','one two three six',{domains:['rd.go.th']}),
    record('host90a','one two three five',{hosts:['svc.rd.go.th'],domains:['rd.go.th']}),
    record('host90b','one two three five',{hosts:['svc.rd.go.th'],domains:['rd.go.th']}),
  ];
  const candidates = core.findCandidates(incident,records);
  assert.deepEqual(candidates.map(x=>x.record.id),['host90a','host90b','domain80']);
  assert.deepEqual(candidates.map(x=>x.score),[90,90,80]);
}

function testEvidenceShowsIncidentTorAndContribution() {
  const incident = {ip:'',host:'intrapp2.rd.go.th',domain:'rd.go.th',systemName:'one two three four'};
  const candidate = core.scoreCandidate(incident,record('a','one two three five',{hosts:['intrapp2.rd.go.th']}));
  const hostEvidence=candidate.evidence.find(item=>item.field==='Host');
  assert.equal(hostEvidence.incidentValue,'intrapp2.rd.go.th');
  assert.equal(hostEvidence.torValue,'intrapp2.rd.go.th');
  assert.equal(hostEvidence.matched,true);
  assert.equal(hostEvidence.contribution,60);
}

function testBuildsSixIndependentOperationalCopyBlocks() {
  const incident=core.parseIncident(sample);
  const blocks=core.buildOperationalBlocks(incident);
  const url='https://intrapp2.rd.go.th/signed_intra/login/login.php';
  assert.equal(blocks.monitorOriginal,sampleMonitor);
  assert.equal(blocks.urlNormal,`ตรวจสอบสามารถใช้งาน Url: ${url} ได้ปกติ`);
  assert.equal(blocks.urlAbnormal,`ตรวจสอบไม่สามารถใช้งาน Url: ${url} ได้ปกติ`);
  assert.equal(blocks.combinedResolution,`${sampleMonitor}\nแก้ไขโดย : ตรวจสอบสามารถใช้งาน Url: ${url} ได้ปกติ`);
  assert.equal(blocks.ticketAction,'กดตั๊กเพิ่มไม่ได้');
  assert.equal(blocks.mailCompletion,'ดำเนินการส่ง Mail แจ้งผู้ดูแลระบบเรียบร้อยแล้ว');
}

function testBuildsFixedMailDraftUsingOriginalIncidentText() {
  const incident=core.parseIncident(sample);
  const draft=core.buildMailDraft(incident,{id:99,systemName:'ระบบ Time Stamp'});
  const expected=`เรียน ผู้ดูแลระบบ\n\n${sampleMonitor}\n\n${sampleIncidentBody}\n\nติดต่อเจ้าหน้าที่ RDNOC\nเบอร์ 02-272-8891 - 3\nLine ID: @RDNOC\nขอบคุณครับ/ขอบคุณค่ะ`;
  assert.equal(draft,expected);
  assert.ok(!/(^|\n)To\s*:/i.test(draft));
  assert.ok(!draft.includes('@rd.go.th'));
}

function testMailDraftDoesNotInventOrReformatIncidentLines() {
  const raw=`Monitor ระบบทดสอบ ไม่สามารถเรียกใช้งานได้\n\nUrl: https://example.rd.go.th/a\nhosted on 10.1.2.3 of Custom failure  --  keep spacing\nRef: CASE-42 / operator note`;
  const incident=core.parseIncident(raw);
  const draft=core.buildMailDraft(incident,null);
  assert.ok(draft.includes('hosted on 10.1.2.3 of Custom failure  --  keep spacing\nRef: CASE-42 / operator note'));
  assert.ok(!draft.includes('\nerror:'));
}

const tests = [
  testExtractsSampleIncidentFields,
  testAcceptsEscapedUrlAndUrlLabelVariants,
  testNormalizesCrlfSpacesAndBlankLines,
  testDerivesHostAndDomainFromUrl,
  testExtractsHostedOnIpAndError,
  testAllowsMissingOptionalFields,
  testExactIpIsOneHundredPercent,
  testMultipleExactIpRecordsAreAllReturned,
  testExactHostUsesSixtyPlusNameForty,
  testDomainUsesThirtyPlusNameSeventyAndKeepsExactlyEighty,
  testWeakGenericDomainCandidateIsExcluded,
  testCandidatesSortDescendingAndPreserveTies,
  testEvidenceShowsIncidentTorAndContribution,
  testBuildsSixIndependentOperationalCopyBlocks,
  testBuildsFixedMailDraftUsingOriginalIncidentText,
  testMailDraftDoesNotInventOrReformatIncidentLines,
];

for (const test of tests) test();
console.log(`TOR System Finder core tests: ${tests.length}/${tests.length} PASS`);
