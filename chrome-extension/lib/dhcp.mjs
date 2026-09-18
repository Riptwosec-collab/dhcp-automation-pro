import { parseIPv4 } from './subnet.mjs';

function requireIPv4(value) {
  parseIPv4(value);
  return String(value).trim();
}

export function generateDhcpConfig(input = {}) {
  const poolName = String(input.poolName ?? '').trim();
  if (!poolName) throw new Error('Pool name is required');

  const network = requireIPv4(input.network);
  const mask = requireIPv4(input.mask);
  const defaultRouter = requireIPv4(input.defaultRouter);
  const dnsServers = Array.isArray(input.dnsServers)
    ? input.dnsServers.map(requireIPv4)
    : [];

  const exclusions = Array.isArray(input.excludedRanges) ? input.excludedRanges : [];
  const lines = [];

  for (const range of exclusions) {
    const start = requireIPv4(range.start);
    const end = range.end ? requireIPv4(range.end) : start;
    lines.push(start === end
      ? `ip dhcp excluded-address ${start}`
      : `ip dhcp excluded-address ${start} ${end}`);
  }

  if (lines.length) lines.push('!');
  lines.push(`ip dhcp pool ${poolName}`);
  lines.push(` network ${network} ${mask}`);
  lines.push(` default-router ${defaultRouter}`);
  if (dnsServers.length) lines.push(` dns-server ${dnsServers.join(' ')}`);

  const domainName = String(input.domainName ?? '').trim();
  if (domainName) lines.push(` domain-name ${domainName}`);

  const leaseDays = Number(input.leaseDays ?? 0);
  if (Number.isFinite(leaseDays) && leaseDays > 0) lines.push(` lease ${Math.floor(leaseDays)}`);
  lines.push('!');
  return lines.join('\n');
}
