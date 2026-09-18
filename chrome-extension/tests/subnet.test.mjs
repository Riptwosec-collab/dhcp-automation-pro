import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIPv4, intToIPv4, parseCIDR, calculateSubnet } from '../lib/subnet.mjs';

test('round-trips IPv4 addresses', () => {
  assert.equal(intToIPv4(parseIPv4('192.168.10.25')), '192.168.10.25');
});

test('rejects invalid IPv4 octets', () => {
  assert.throws(() => parseIPv4('10.0.0.999'), /Invalid IPv4/);
  assert.throws(() => parseIPv4('10.0.0'), /Invalid IPv4/);
});

test('parses CIDR and rejects invalid prefixes', () => {
  assert.deepEqual(parseCIDR('10.20.47.130/24'), { ip: '10.20.47.130', prefix: 24 });
  assert.throws(() => parseCIDR('10.20.47.130/33'), /Invalid CIDR/);
});

test('calculates a normal /24 subnet', () => {
  assert.deepEqual(calculateSubnet('10.20.47.130/24'), {
    ip: '10.20.47.130',
    prefix: 24,
    mask: '255.255.255.0',
    network: '10.20.47.0',
    broadcast: '10.20.47.255',
    firstHost: '10.20.47.1',
    lastHost: '10.20.47.254',
    totalAddresses: 256,
    usableHosts: 254
  });
});

test('handles /31 and /32 without inventing broadcast-style usable ranges', () => {
  assert.equal(calculateSubnet('192.0.2.10/31').usableHosts, 2);
  assert.equal(calculateSubnet('192.0.2.10/32').usableHosts, 1);
});
