import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const subnet = require("./subnet-calculator.js");

function expectSubnet(ip, prefix, expected) {
  const result = subnet.calculateSubnet(ip, prefix);
  for (const [key, value] of Object.entries(expected)) {
    const actual = typeof result[key] === "bigint" ? Number(result[key]) : result[key];
    assert.equal(actual, value, `${ip}/${prefix} ${key}`);
  }
}

expectSubnet("192.168.1.10", 24, {
  networkAddress: "192.168.1.0",
  broadcastAddress: "192.168.1.255",
  firstUsableHost: "192.168.1.1",
  lastUsableHost: "192.168.1.254",
  usableHosts: 254,
});

expectSubnet("10.10.10.130", 26, {
  networkAddress: "10.10.10.128",
  broadcastAddress: "10.10.10.191",
  firstUsableHost: "10.10.10.129",
  lastUsableHost: "10.10.10.190",
  usableHosts: 62,
});

expectSubnet("172.16.5.20", 20, {
  networkAddress: "172.16.0.0",
  broadcastAddress: "172.16.15.255",
  firstUsableHost: "172.16.0.1",
  lastUsableHost: "172.16.15.254",
  usableHosts: 4094,
});

expectSubnet("192.168.1.0", 31, {
  totalAddresses: 2,
  usableHosts: 2,
  routeType: "Point-to-Point",
});

expectSubnet("192.168.1.50", 32, {
  totalAddresses: 1,
  usableHosts: 1,
  routeType: "Host Route",
  networkAddress: "192.168.1.50",
});

assert.equal(subnet.isValidIPv4("192.168.1.1"), true);
assert.equal(subnet.isValidIPv4("999.168.1.1"), false);
assert.throws(() => subnet.calculateSubnet("192.168.1.1", 33), /CIDR Prefix/);
assert.throws(() => subnet.maskToPrefix("255.0.255.0"), /Mask/);

for (const prefix of [0, 8, 16, 24, 30, 31, 32]) {
  const result = subnet.calculateSubnet("10.1.2.3", prefix);
  assert.equal(result.prefix, prefix);
  assert.equal(subnet.maskToPrefix(result.subnetMask), prefix);
}

const zero = subnet.calculateSubnet("203.0.113.5", 0);
assert.equal(zero.networkAddress, "0.0.0.0");
assert.equal(zero.broadcastAddress, "255.255.255.255");
assert.equal(zero.totalAddresses, 4294967296n);

const required = subnet.calculateRequiredPrefix(50);
assert.equal(required.prefix, 26);
assert.equal(required.subnetMask, "255.255.255.192");
assert.equal(required.totalAddresses, 64n);
assert.equal(required.usableHosts, 62n);
assert.equal(required.remainingCapacity, 12n);

const split = subnet.splitNetwork("192.168.10.0", 24, 26);
assert.equal(split.length, 4);
assert.deepEqual(split.map((row) => row.cidrNotation), [
  "192.168.10.0/26",
  "192.168.10.64/26",
  "192.168.10.128/26",
  "192.168.10.192/26",
]);

assert.equal(subnet.classifyIp("10.0.0.1").type, "Private");
assert.equal(subnet.classifyIp("127.0.0.1").type, "Loopback");
assert.equal(subnet.classifyIp("169.254.1.1").type, "Link-local/APIPA");
assert.equal(subnet.classifyIp("224.0.0.1").type, "Multicast");

console.log("Subnet calculator logic tests passed.");
