const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const html = fs.readFileSync('operations-messages.html', 'utf8');

function firstDiffContext(a, b) {
  const max = Math.max(a.length, b.length);
  let index = 0;
  while (index < max && a[index] === b[index]) index += 1;
  const start = Math.max(0, index - 120);
  const end = index + 120;
  return {
    index,
    onceLength: a.length,
    twiceLength: b.length,
    once: JSON.stringify(a.slice(start, end)),
    twice: JSON.stringify(b.slice(start, end)),
  };
}

// Regression: the materialized Operations page already contains the unified
// operationParts runtime. Business Hours must still be safe to regenerate and
// must be byte-stable on a second run.
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'business-hours-v1-'));
try {
  const tempHtml = path.join(tempDir, 'operations-messages.html');
  fs.writeFileSync(tempHtml, html, 'utf8');
  const generator = path.resolve('scripts/add-business-hours.py');
  const runGenerator = () => childProcess.execFileSync('python', [generator], {
    cwd: tempDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let firstError = null;
  try {
    runGenerator();
  } catch (error) {
    firstError = String(error.stderr || error.message || error);
  }
  assert.strictEqual(firstError, null, `Business Hours generator must reapply to unified Operations runtime: ${firstError || ''}`);

  const once = fs.readFileSync(tempHtml, 'utf8');
  runGenerator();
  const twice = fs.readFileSync(tempHtml, 'utf8');
  if (twice !== once) console.error('BUSINESS_HOURS_IDEMPOTENCE_DIFF', firstDiffContext(once, twice));
  assert.strictEqual(twice, once, 'Business Hours generator must be idempotent after unified Operations generation');
} finally {
  fs.rmSync(tempDir, {recursive: true, force: true});
}

const startMarker = '/* business-hours-v1:start */';
const endMarker = '/* business-hours-v1:end */';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);
assert(start >= 0 && end > start, 'missing Business Hours v1 pure scheduling logic');

const code = html.slice(start + startMarker.length, end);
const context = { Date };
vm.createContext(context);
vm.runInContext(code, context);

assert.strictEqual(typeof context.getNoContactFollowUp, 'function', 'getNoContactFollowUp must exist');
assert.strictEqual(typeof context.formatNoContactFollowUp, 'function', 'formatNoContactFollowUp must exist');
assert.strictEqual(typeof context.noContactMessage, 'function', 'noContactMessage must exist');

function parts(d) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
}

const cases = [
  ['Monday before opening rolls to same Monday 08:30', new Date(2026, 9, 5, 7, 0), [2026, 10, 5, 8, 30]],
  ['Monday at opening remains current', new Date(2026, 9, 5, 8, 30), [2026, 10, 5, 8, 30]],
  ['Tuesday during business hours remains current', new Date(2026, 9, 6, 14, 5), [2026, 10, 6, 14, 5]],
  ['Tuesday at 18:00 rolls to Wednesday 08:30', new Date(2026, 9, 6, 18, 0), [2026, 10, 7, 8, 30]],
  ['Thursday after 18:00 rolls to Friday 08:30', new Date(2026, 9, 8, 22, 15), [2026, 10, 9, 8, 30]],
  ['Friday 17:59 remains current', new Date(2026, 9, 9, 17, 59), [2026, 10, 9, 17, 59]],
  ['Friday at 18:00 rolls across weekend to Monday 08:30', new Date(2026, 9, 9, 18, 0), [2026, 10, 12, 8, 30]],
  ['Saturday rolls to Monday 08:30', new Date(2026, 9, 10, 12, 0), [2026, 10, 12, 8, 30]],
  ['Sunday rolls to Monday 08:30', new Date(2026, 9, 11, 23, 0), [2026, 10, 12, 8, 30]],
];

for (const [name, input, expected] of cases) {
  assert.deepStrictEqual(parts(context.getNoContactFollowUp(input)), expected, name);
}

assert.strictEqual(
  context.formatNoContactFollowUp(new Date(2026, 9, 12, 8, 30)),
  'วันจันทร์ 12/10/2569 เวลา 08.30 น.',
  'deferred follow-up must be formatted with Thai weekday, Buddhist year, and HH.mm'
);

const fridayMessage = context.noContactMessage(new Date(2026, 9, 9, 18, 0));
assert(fridayMessage.includes('วันจันทร์ 12/10/2569 เวลา 08.30 น.'), 'Friday 18:00 copy text must point to Monday 08:30');
const tuesdayMessage = context.noContactMessage(new Date(2026, 9, 6, 18, 0));
assert(tuesdayMessage.includes('วันพุธ 07/10/2569 เวลา 08.30 น.'), 'weekday after 18:00 copy text must point to next day 08:30');

const cardMatch = html.match(/<article class="ops-card"><div class="ops-card-head"><div class="ops-card-title">ไม่สามารถติดต่อเจ้าหน้าที่ได้[\s\S]*?<\/article>/);
assert(cardMatch, 'no-contact Operations card must exist');
assert(!cardMatch[0].includes('data-op-date'), 'no-contact card must not show a date stamp');
assert(!cardMatch[0].includes('data-op-time'), 'no-contact card must not show a time stamp');
assert(!cardMatch[0].includes('ops-stamp'), 'no-contact card must not show the stamp row');

console.log('Business Hours v1 behavior + generator idempotence verified');
