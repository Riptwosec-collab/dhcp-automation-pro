import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(
  fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8')
);

test('uses Manifest V3 and minimum permissions', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.ok(!JSON.stringify(manifest).includes('<all_urls>'));
});

test('declares popup, service worker, and keyboard command', () => {
  assert.equal(manifest.action.default_popup, 'popup.html');
  assert.equal(manifest.background.service_worker, 'background.js');
  assert.equal(manifest.commands['open-mission-control'].suggested_key.default, 'Ctrl+Shift+D');
  assert.equal(manifest.commands['open-mission-control'].suggested_key.mac, 'Command+Shift+D');
});
