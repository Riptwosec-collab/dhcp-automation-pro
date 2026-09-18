import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
const background = fs.readFileSync(new URL('background.js', root), 'utf8');
const productionUrl = 'https://dhcp-automation-pro.vercel.app/#dhcp';

test('toolbar click opens the exact production Mission Control UI instead of a clone popup', () => {
  assert.equal(manifest.action.default_popup, undefined);
  assert.match(background, /chrome\.action\.onClicked\.addListener/);
  assert.ok(background.includes(productionUrl));
});

test('keyboard shortcut opens the same production Mission Control UI', () => {
  assert.match(background, /open-mission-control/);
  assert.ok(background.includes(productionUrl));
});
