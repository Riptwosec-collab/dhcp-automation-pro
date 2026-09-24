(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LocalIPReputation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseIPv4(ip) {
    if (typeof ip !== 'string') return null;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return null;
    const nums = [];
    for (const part of parts) {
      if (!/^\d{1,3}$/.test(part)) return null;
      if (part.length > 1 && part.startsWith('0')) return null;
      const n = Number(part);
      if (!Number.isInteger(n) || n < 0 || n > 255) return null;
      nums.push(n);
    }
    return nums;
  }

  function classifyIpType(ip) {
    const p = parseIPv4(ip);
    if (!p) return { label: 'INVALID', local: true, unusual: true };
    const [a, b, c] = p;

    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return { label: 'PRIVATE / LOCAL', local: true, unusual: false };
    }
    if (a === 127 || a === 0) return { label: 'LOOPBACK / LOCAL', local: true, unusual: true };
    if (a === 169 && b === 254) return { label: 'LINK-LOCAL', local: true, unusual: true };
    if (a === 100 && b >= 64 && b <= 127) return { label: 'CGNAT', local: true, unusual: false };
    if (a >= 224) return { label: 'SPECIAL-USE', local: true, unusual: true };
    if (
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    ) {
      return { label: 'DOCUMENTATION', local: true, unusual: true };
    }
    return { label: 'PUBLIC', local: false, unusual: false };
  }

  const INFRA_KEYWORDS = [
    'cloud', 'hosting', 'hosted', 'datacenter', 'data center', 'vps', 'virtual server',
    'server', 'colo', 'colocation', 'cdn', 'edge network', 'compute', 'aws', 'amazon web',
    'azure', 'google cloud', 'digitalocean', 'linode', 'akamai', 'cloudflare', 'hetzner', 'ovh'
  ];
  const ISP_KEYWORDS = [
    'broadband', 'telecom', 'telecommunication', 'mobile', 'wireless', 'internet service',
    'internet provider', 'ais', 'advanced wireless', 'true internet', 'true online', 'dtac',
    '3bb', 'triple t', 'national telecom', 'tot', 'cat telecom'
  ];
  const DIRECT_RISK_GROUPS = [
    { name: 'VPN keyword', terms: ['vpn', 'virtual private network'] },
    { name: 'Proxy keyword', terms: ['proxy', 'web proxy'] },
    { name: 'Anonymous network keyword', terms: ['anonymous', 'anonymizer', 'anonymity'] },
    { name: 'TOR keyword', terms: ['tor ', 'tor-', 'tor exit', 'exit node'] },
  ];

  function includesAny(text, terms) {
    return terms.some((term) => text.includes(term));
  }

  function normalizeText(input) {
    return [input.provider, input.org, input.asn, input.domain, input.network]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function analyzeNetwork(input = {}) {
    const ip = String(input.ip || '').trim();
    const ipType = classifyIpType(ip);
    const text = normalizeText(input);
    const reasons = [];
    let score = 0;
    let networkType = 'ISP / ENTERPRISE';

    if (ipType.label === 'INVALID') {
      return {
        ip,
        ipType: ipType.label,
        networkType: 'UNKNOWN',
        score: 0,
        risk: { level: 'UNKNOWN', severity: 'idle' },
        reasons: ['รูปแบบ IPv4 ไม่ถูกต้อง'],
        externalThreat: externalUnknown(),
      };
    }

    if (ipType.local) {
      reasons.push(`IP Type: ${ipType.label}`);
      if (ipType.unusual) reasons.push('เป็นช่วง IP พิเศษ/ไม่ใช่ Public Internet ปกติ');
      return {
        ip,
        ipType: ipType.label,
        networkType: ipType.label === 'PRIVATE / LOCAL' ? 'LOCAL NETWORK' : 'SPECIAL / LOCAL',
        score: ipType.unusual ? 20 : 0,
        risk: { level: ipType.unusual ? 'CAUTION' : 'LOW RISK', severity: ipType.unusual ? 'caution' : 'low' },
        reasons,
        externalThreat: externalUnknown(),
      };
    }

    reasons.push('Public IPv4');
    score += 5;

    const infraDetected = includesAny(text, INFRA_KEYWORDS);
    if (infraDetected) {
      networkType = 'CLOUD / DATACENTER';
      score += 30;
      reasons.push('พบลักษณะ Cloud / Hosting / Datacenter จากชื่อเครือข่ายหรือผู้ให้บริการ');
    } else if (includesAny(text, ISP_KEYWORDS)) {
      networkType = 'ISP / ENTERPRISE';
      reasons.push('ลักษณะชื่อเครือข่ายเป็น ISP / Mobile / Enterprise');
    } else if (text) {
      networkType = 'PUBLIC NETWORK';
      reasons.push('เป็น Public network แต่ไม่พบ keyword ของ Hosting/VPN/Proxy');
    } else {
      networkType = 'UNKNOWN PUBLIC';
      score += 30;
      reasons.push('ข้อมูล Provider/ASN ไม่เพียงพอ จึงไม่จัดเป็น Low Risk');
    }

    let directSignals = 0;
    for (const group of DIRECT_RISK_GROUPS) {
      if (includesAny(text, group.terms)) {
        directSignals += 1;
        score += 20;
        reasons.push(`พบ ${group.name} ในชื่อ Provider/Organization`);
      }
    }

    if (directSignals >= 2) {
      score += 15;
      reasons.push('พบ keyword เสี่ยงหลายประเภทพร้อมกัน');
    }

    score = Math.min(100, score);
    const risk = score >= 70
      ? { level: 'HIGH RISK', severity: 'high' }
      : score >= 35
        ? { level: 'CAUTION', severity: 'caution' }
        : { level: 'LOW RISK', severity: 'low' };

    return {
      ip,
      ipType: ipType.label,
      networkType,
      score,
      risk,
      reasons,
      externalThreat: externalUnknown(),
    };
  }

  function externalUnknown() {
    return {
      abuser: 'UNKNOWN',
      tor: 'UNKNOWN',
      proxy: 'UNKNOWN',
      vpn: 'UNKNOWN',
      spamAttack: 'UNKNOWN',
      threatFeed: 'NOT VERIFIED',
    };
  }

  return { parseIPv4, classifyIpType, analyzeNetwork };
});
