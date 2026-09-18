import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const htmlFiles = ['popup.html', 'app.html'];
const forbidden = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'eval(',
  'javascript:'
];

test('extension HTML uses no remote scripts, styles, or inline handlers', () => {
  for (const name of htmlFiles) {
    if (!fs.existsSync(path.join(root, name))) continue;
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    for (const token of forbidden) assert.equal(html.includes(token), false, `${name} contains ${token}`);
    assert.equal(/\son[a-z]+\s*=/.test(html), false, `${name} contains inline event handler`);
    assert.equal(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), false, `${name} contains inline script`);
  }
});
