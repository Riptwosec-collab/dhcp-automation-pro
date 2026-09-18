export function parseIPv4(input) {
  const parts = String(input).trim().split('.');
  if (parts.length !== 4) throw new Error('Invalid IPv4 address');
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) throw new Error('Invalid IPv4 address');
    const octet = Number(part);
    if (octet < 0 || octet > 255) throw new Error('Invalid IPv4 address');
    value = ((value << 8) | octet) >>> 0;
  }
  return value >>> 0;
}

export function intToIPv4(value) {
  const v = Number(value) >>> 0;
  return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

export function parseCIDR(input) {
  const match = String(input).trim().match(/^(.+)\/(\d{1,2})$/);
  if (!match) throw new Error('Invalid CIDR');
  const normalizedIp = String(match[1]).trim();
  parseIPv4(normalizedIp);
  const prefix = Number(match[2]);
  if (prefix < 0 || prefix > 32) throw new Error('Invalid CIDR');
  return { ip: normalizedIp, prefix };
}

export function calculateSubnet(input) {
  const { ip, prefix } = parseCIDR(input);
  const ipInt = parseIPv4(ip);
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);
  const usableHosts = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.max(totalAddresses - 2, 0);
  const firstHostInt = prefix >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastHostInt = prefix === 32 ? networkInt : prefix === 31 ? broadcastInt : (broadcastInt - 1) >>> 0;
  return {
    ip,
    prefix,
    mask: intToIPv4(maskInt),
    network: intToIPv4(networkInt),
    broadcast: intToIPv4(broadcastInt),
    firstHost: intToIPv4(firstHostInt),
    lastHost: intToIPv4(lastHostInt),
    totalAddresses,
    usableHosts
  };
}
