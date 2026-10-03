'use strict';

const assert = require('assert');
const ui = require('../tor-system-finder-upgrade.js');

function testCreateStateStartsLocked() {
  const state = ui.createState();
  assert.equal(state.phase, 'idle');
  assert.equal(state.incident, null);
  assert.deepEqual(state.candidates, []);
  assert.equal(state.selectedRecord, null);
  assert.deepEqual(state.owners, []);
}

function testEditingRawTextInvalidatesPreviousAnalysisAndSelection() {
  const ready = {
    phase: 'ready',
    raw: 'old incident',
    incident: {url:'https://old.example/'},
    candidates: [{score:100}],
    selectedRecord: {id:1},
    owners: [{id:'owner-1'}],
  };
  const next = ui.invalidateState(ready, 'changed incident');
  assert.equal(next.phase, 'idle');
  assert.equal(next.raw, 'changed incident');
  assert.equal(next.incident, null);
  assert.deepEqual(next.candidates, []);
  assert.equal(next.selectedRecord, null);
  assert.deepEqual(next.owners, []);
}

function testCopyFunctionIsExportedForBrowserController() {
  assert.equal(typeof ui.copyTorValue, 'function');
}

const tests = [
  testCreateStateStartsLocked,
  testEditingRawTextInvalidatesPreviousAnalysisAndSelection,
  testCopyFunctionIsExportedForBrowserController,
];
for (const test of tests) test();
console.log(`TOR System Finder UI state tests: ${tests.length}/${tests.length} PASS`);
