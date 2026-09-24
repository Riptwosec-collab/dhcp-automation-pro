const assert = require('node:assert/strict');
const handler = require('../api/ip-reputation.js');

const { classifyRisk, parseAbuserScore, isValidIPv4, isPrivateIPv4 } = handler._test;

assert.equal(isValidIPv4('8.8.8.8'), true);
assert.equal(isValidIPv4('999.8.8.8'), false);
assert.equal(isPrivateIPv4('10.1.2.3'), true);
assert.equal(isPrivateIPv4('172.16.0.1'), true);
assert.equal(isPrivateIPv4('192.168.1.1'), true);
assert.equal(isPrivateIPv4('8.8.8.8'), false);

assert.equal(parseAbuserScore('0.4883 (Very High)'), 0.4883);
assert.equal(parseAbuserScore(null), 0);

assert.equal(classifyRisk({ is_abuser: true, company: {}, asn: {} }).level, 'HIGH RISK');
assert.equal(classifyRisk({ is_abuser: false, company: { abuser_score: '0.0400 (High)' }, asn: {} }).level, 'HIGH RISK');
assert.equal(classifyRisk({ is_abuser: false, is_vpn: true, company: {}, asn: {} }).level, 'CAUTION');
assert.equal(classifyRisk({ is_abuser: false, company: { abuser_score: '0.0010 (Low)' }, asn: {} }).level, 'LOW RISK');

console.log('IP reputation API behavior checks passed');
