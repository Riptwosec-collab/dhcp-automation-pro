import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOpsLog } from '../lib/logs.mjs';

test('formats a compact deterministic NOC log', () => {
  assert.equal(formatOpsLog({
    date: '2026-09-18',
    time: '17:30',
    site: 'HQ',
    device: 'SW-CORE-01',
    ticket: 'INC-240918-01',
    status: 'Monitoring',
    summary: 'DHCP pool utilization high',
    action: 'Checked bindings and free addresses',
    owner: 'NOC'
  }), [
    '[2026-09-18 17:30] HQ / SW-CORE-01',
    'Ticket: INC-240918-01',
    'Status: Monitoring',
    'Issue: DHCP pool utilization high',
    'Action: Checked bindings and free addresses',
    'Owner: NOC'
  ].join('\n'));
});

test('omits optional empty fields but requires summary', () => {
  assert.equal(formatOpsLog({ date: '2026-09-18', time: '17:30', summary: 'Checked DHCP service' }),
    '[2026-09-18 17:30]\nIssue: Checked DHCP service');
  assert.throws(() => formatOpsLog({}), /Summary is required/);
});
