const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('uih.html', 'utf8');
const start = html.indexOf("function formatDownSince(value, language = 'th')");
const end = html.indexOf('\n    function composeMessage', start);

if (start < 0 || end < 0) {
  throw new Error('formatDownSince function not found in uih.html');
}

const source = html.slice(start, end).trim();
const context = {};
vm.createContext(context);
vm.runInContext(`${source}\nthis.formatDownSince = formatDownSince;`, context);

const formatDownSince = context.formatDownSince;
const english = 'Friday, September 25, 2026 11:48';
const thai = 'วันศุกร์ ที่ 25 กันยายน พ.ศ. 2569 เวลา 11:48 น.';

const cases = [
  ['English source -> Thai', english, 'th', thai],
  ['English source -> English', english, 'en', english],
  ['Thai source -> English', thai, 'en', english],
  ['Thai source -> Thai', thai, 'th', thai],
];

for (const [name, input, language, expected] of cases) {
  const actual = formatDownSince(input, language);
  if (actual !== expected) {
    throw new Error(`${name} failed\nExpected: ${expected}\nActual:   ${actual}`);
  }
}

if (!html.includes("downSince: extractValue(raw, ['Down Since', 'ดาวน์เมื่อ', 'ล่มตั้งแต่'])")) {
  throw new Error('UIh parser must accept English and Thai Down Since labels');
}

if (!html.includes('id="downSinceThBtn"') || !html.includes('id="downSinceEnBtn"')) {
  throw new Error('Persistent TH/ENG Down Since controls are missing');
}

console.log('Bilingual Down Since behavior checks passed');
