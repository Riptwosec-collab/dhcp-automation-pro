'use strict';

function isValidIPv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

function isPrivateIPv4(ip) {
  if (!isValidIPv4(ip)) return false;
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function parseAbuserScore(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;
  const match = value.trim().match(/^([0-9]*\.?[0-9]+)/);
  const parsed = match ? Number(match[1]) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function classifyRisk(data = {}) {
  const companyScore = parseAbuserScore(data.company && data.company.abuser_score);
  const asnScore = parseAbuserScore(data.asn && data.asn.abuser_score);
  const maxScore = Math.max(companyScore, asnScore);

  if (data.is_abuser === true || maxScore >= 0.03) {
    return {
      level: 'HIGH RISK',
      severity: 'high',
      score: maxScore,
      reason: data.is_abuser === true ? 'IP appears in abuse/threat feeds' : 'Network abuse ratio is high',
    };
  }

  if (
    data.is_tor === true ||
    data.is_proxy === true ||
    data.is_vpn === true ||
    data.is_datacenter === true ||
    maxScore >= 0.0085
  ) {
    return {
      level: 'CAUTION',
      severity: 'caution',
      score: maxScore,
      reason: maxScore >= 0.0085
        ? 'Network abuse ratio is elevated'
        : 'Anonymizer or hosting signal detected',
    };
  }

  return {
    level: 'LOW RISK',
    severity: 'low',
    score: maxScore,
    reason: 'No strong abuse signal detected',
  };
}

function normalizeAsn(asn) {
  if (!asn || typeof asn !== 'object') return '';
  const number = asn.asn ? `AS${asn.asn}` : '';
  const org = asn.org || asn.descr || '';
  return [number, org].filter(Boolean).join(' · ');
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const raw = Array.isArray(req.query && req.query.ip) ? req.query.ip[0] : req.query && req.query.ip;
  const ip = String(raw || '').trim();

  if (!isValidIPv4(ip)) {
    return res.status(400).json({ error: 'INVALID_IPV4' });
  }

  if (isPrivateIPv4(ip)) {
    return res.status(200).json({
      ip,
      private: true,
      risk: { level: 'PRIVATE / LOCAL', severity: 'private', score: 0, reason: 'Local or non-public address' },
      flags: { is_abuser: false, is_tor: false, is_proxy: false, is_vpn: false, is_datacenter: false },
    });
  }

  const key = process.env.IPAPI_IS_KEY;
  if (!key) {
    return res.status(503).json({ error: 'THREAT_KEY_NOT_CONFIGURED' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const url = `https://api.ipapi.is?q=${encodeURIComponent(ip)}&key=${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'dhcp-automation-pro/1.0' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'THREAT_PROVIDER_ERROR', status: response.status });
    }

    const data = await response.json();
    const company = data.company && typeof data.company === 'object' ? data.company : {};
    const asn = data.asn && typeof data.asn === 'object' ? data.asn : {};
    const risk = classifyRisk(data);
    const provider = company.name || asn.org || asn.descr || (typeof data.company === 'string' ? data.company : '') || 'Unknown';

    return res.status(200).json({
      ip: data.ip || ip,
      private: false,
      provider,
      asn: normalizeAsn(asn) || (typeof data.asn === 'string' ? data.asn : ''),
      network: company.network || asn.route || '',
      companyAbuserScore: company.abuser_score || null,
      asnAbuserScore: asn.abuser_score || null,
      companyType: company.type || asn.type || null,
      risk,
      flags: {
        is_abuser: data.is_abuser === true,
        is_tor: data.is_tor === true,
        is_proxy: data.is_proxy === true,
        is_vpn: data.is_vpn === true,
        is_datacenter: data.is_datacenter === true,
      },
      source: 'ipapi.is',
    });
  } catch (error) {
    const code = error && error.name === 'AbortError' ? 'THREAT_PROVIDER_TIMEOUT' : 'THREAT_LOOKUP_FAILED';
    return res.status(502).json({ error: code });
  } finally {
    clearTimeout(timeout);
  }
}

handler._test = { classifyRisk, parseAbuserScore, isValidIPv4, isPrivateIPv4 };
module.exports = handler;
