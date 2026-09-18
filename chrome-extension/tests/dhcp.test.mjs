import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDhcpConfig } from '../lib/dhcp.mjs';

test('generates stable Cisco IOS DHCP configuration', () => {
  const output = generateDhcpConfig({
    poolName: 'VLAN47-USERS',
    network: '10.20.47.0',
    mask: '255.255.255.0',
    defaultRouter: '10.20.47.1',
    dnsServers: ['10.20.1.10', '8.8.8.8'],
    domainName: 'corp.local',
    leaseDays: 7,
    excludedRanges: [{ start: '10.20.47.1', end: '10.20.47.20' }]
  });

  assert.equal(output, [
    'ip dhcp excluded-address 10.20.47.1 10.20.47.20',
    '!',
    'ip dhcp pool VLAN47-USERS',
    ' network 10.20.47.0 255.255.255.0',
    ' default-router 10.20.47.1',
    ' dns-server 10.20.1.10 8.8.8.8',
    ' domain-name corp.local',
    ' lease 7',
    '!'
  ].join('\n'));
});

test('rejects missing pool names and malformed addresses', () => {
  assert.throws(() => generateDhcpConfig({ poolName: '' }), /Pool name/);
  assert.throws(() => generateDhcpConfig({
    poolName: 'BAD', network: '10.0.0.999', mask: '255.255.255.0', defaultRouter: '10.0.0.1'
  }), /Invalid IPv4/);
});
