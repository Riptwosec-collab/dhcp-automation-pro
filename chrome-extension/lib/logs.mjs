function clean(value) {
  return String(value ?? '').trim();
}

export function formatOpsLog(input = {}) {
  const summary = clean(input.summary);
  if (!summary) throw new Error('Summary is required');

  const stamp = [clean(input.date), clean(input.time)].filter(Boolean).join(' ');
  const location = [clean(input.site), clean(input.device)].filter(Boolean).join(' / ');
  const head = [stamp ? `[${stamp}]` : '', location].filter(Boolean).join(' ');
  const lines = [];
  if (head) lines.push(head);
  if (clean(input.ticket)) lines.push(`Ticket: ${clean(input.ticket)}`);
  if (clean(input.status)) lines.push(`Status: ${clean(input.status)}`);
  lines.push(`Issue: ${summary}`);
  if (clean(input.action)) lines.push(`Action: ${clean(input.action)}`);
  if (clean(input.owner)) lines.push(`Owner: ${clean(input.owner)}`);
  return lines.join('\n');
}
