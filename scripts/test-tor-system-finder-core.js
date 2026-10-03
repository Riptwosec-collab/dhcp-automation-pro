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

function testExtractsSampleIncidentFields() {
  const result = core.parseIncident(sample);
  assert.equal(result.url, 'https://intrapp2.rd.go.th/signed_intra/login/login.php');
  assert.equal(result.host, 'intrapp2.rd.go.th');
  assert.equal(result.domain, 'rd.go.th');
  assert.equal(result.ip, '10.20.17.71');
  assert.equal(result.error, 'Network connection failed. Unable to connect to the remote server');
  assert.equal(result.time, 'Wednesday, September 30, 2026 10:05 PM');
  assert.ok(result.monitor.includes('Time Stamp'));
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

const tests = [
  testExtractsSampleIncidentFields,
  testAcceptsEscapedUrlAndUrlLabelVariants,
  testNormalizesCrlfSpacesAndBlankLines,
  testDerivesHostAndDomainFromUrl,
  testExtractsHostedOnIpAndError,
  testAllowsMissingOptionalFields,
];

for (const test of tests) test();
console.log(`TOR System Finder core parser tests: ${tests.length}/${tests.length} PASS`);
