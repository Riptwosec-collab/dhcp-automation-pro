const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('operations-messages.html', 'utf8');

assert(html.includes('operations-visual-refresh-v2'), 'missing Operations Visual Refresh v2 marker');

function cardByKey(key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<article class="ops-card">(?:(?!<\\/article>)[\\s\\S])*?onclick="copyOperationMessage\\('${escaped}',this\\)"(?:(?!<\\/article>)[\\s\\S])*?<\\/article>`);
  const match = html.match(re);
  assert(match, `missing card for ${key}`);
  return match[0];
}

const shutdown = cardByKey('shutdown-10');
const complete = cardByKey('ten-complete');
assert(!shutdown.includes('ops-stamp'), 'shutdown-10 card must not show date/time stamp');
assert(!shutdown.includes('data-op-date'), 'shutdown-10 card must not show date');
assert(!shutdown.includes('data-op-time'), 'shutdown-10 card must not show time');
assert(!complete.includes('ops-stamp'), 'ten-complete card must not show date/time stamp');
assert(!complete.includes('data-op-date'), 'ten-complete card must not show date');
assert(!complete.includes('data-op-time'), 'ten-complete card must not show time');

const deviceHang = cardByKey('device-hang');
const linkUp = cardByKey('link-up');
assert(deviceHang.includes('ops-stamp'), 'other cards should retain their date/time stamp');
assert(linkUp.includes('ops-stamp'), 'other cards should retain their date/time stamp');

assert(/\.ops-card-title\{[^}]*font-size:clamp\(16px,/.test(html), 'card titles must use a larger fluid font');
assert(/\.ops-desc\{[^}]*font-size:clamp\(13px,/.test(html), 'card body text must use a larger fluid font');
assert(/\.ops-copy\{[^}]*min-width:76px;min-height:40px/.test(html), 'COPY controls must be larger and easier to hit');
assert(/\.ops-card\{[^}]*padding:clamp\(16px,/.test(html), 'cards must have larger fluid padding');
assert(/\.ops-desc\{[^}]*white-space:normal/.test(html), 'card descriptions must wrap normally');
assert(!html.includes('text-overflow:ellipsis'), 'Operations cards must not ellipsize text');
assert(!html.includes('-webkit-line-clamp'), 'Operations cards must not line-clamp text');

console.log('Operations Visual Refresh v2 behavior verified');
