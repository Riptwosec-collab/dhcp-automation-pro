const assert = require('node:assert/strict');
const rep = require('../local-ip-reputation.js');

assert.equal(rep.classifyIpType('10.1.2.3').label, 'PRIVATE / LOCAL');
assert.equal(rep.classifyIpType('192.168.1.10').label, 'PRIVATE / LOCAL');
assert.equal(rep.classifyIpType('100.64.1.1').label, 'CGNAT');
assert.equal(rep.classifyIpType('169.254.1.1').label, 'LINK-LOCAL');
assert.equal(rep.classifyIpType('8.8.8.8').label, 'PUBLIC');

const residential = rep.analyzeNetwork({
  ip: '49.228.10.20',
  provider: 'Advanced Wireless Network Company Limited',
  org: 'AIS Mobile Network',
  asn: 'AS45430',
  country: 'Thailand',
});
assert.equal(residential.risk.level, 'LOW RISK');
assert.equal(residential.networkType, 'ISP / ENTERPRISE');
assert.ok(residential.score < 35);

const hosting = rep.analyzeNetwork({
  ip: '8.8.4.4',
  provider: 'Example Cloud Hosting',
  org: 'Example Datacenter VPS',
  asn: 'AS64500',
  country: 'Thailand',
});
assert.equal(hosting.risk.level, 'CAUTION');
assert.equal(hosting.networkType, 'CLOUD / DATACENTER');
assert.ok(hosting.score >= 35 && hosting.score < 70);

const unknownProvider = rep.analyzeNetwork({ ip: '9.9.9.9' });
assert.equal(unknownProvider.risk.level, 'CAUTION');
assert.equal(unknownProvider.networkType, 'UNKNOWN PUBLIC');
assert.ok(unknownProvider.score >= 35);

const suspicious = rep.analyzeNetwork({
  ip: '1.1.1.1',
  provider: 'Anonymous VPN Proxy Hosting',
  org: 'Tor VPN Proxy Datacenter',
  asn: 'AS64501',
});
assert.equal(suspicious.risk.level, 'HIGH RISK');
assert.ok(suspicious.score >= 70);
assert.ok(suspicious.reasons.length >= 2);

for (const value of Object.values(suspicious.externalThreat)) {
  assert.ok(value === 'UNKNOWN' || value === 'NOT VERIFIED');
}

console.log('Local IP reputation behavior checks passed');
