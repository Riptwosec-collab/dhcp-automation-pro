import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, loadState, saveState } from '../lib/storage.mjs';

function fakeStorage(seed = {}) {
  const db = { ...seed };
  return {
    async get() { return { ...db }; },
    async set(value) { Object.assign(db, value); },
    snapshot() { return { ...db }; }
  };
}

test('fills missing values from defaults', async () => {
  const storage = fakeStorage({ theme: 'cyber' });
  const state = await loadState(storage);
  assert.equal(state.theme, 'cyber');
  assert.equal(state.lastModule, 'dhcp');
});

test('saves only allowed state keys', async () => {
  const storage = fakeStorage();
  await saveState({ theme: 'gold', lastModule: 'logs', password: 'secret' }, storage);
  assert.deepEqual(storage.snapshot(), { theme: 'gold', lastModule: 'logs' });
});
