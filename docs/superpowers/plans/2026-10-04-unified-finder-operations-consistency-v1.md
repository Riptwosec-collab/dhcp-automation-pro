# Unified Finder + Operations Consistency v1 — Implementation Plan

## Goal
Unify displayed/copy text in Operations Messages, remove date/time from the two 10-minute copy blocks, make the power-reboot message match the approved wording, remove the legacy incident waiting panel, make TOR Analyzer resolve the same canonical records that the top TOR Finder can find, and visually align TOR/VOIP interiors with the main DHCP workspace.

## Constraints
- Preserve same-page Utility navigation and current production URLs.
- Preserve Business Hours logic for the no-contact card.
- Preserve the TOR threshold rule: IP exact = 100%; otherwise Host/Domain + System Name; only show >=80%; user selects explicitly.
- Reuse the canonical runtime TOR records; do not create a second owner database.
- Keep generators idempotent and wire all new regression checks into PR and main-generation workflows.

## Tasks
1. Add one failing regression suite covering Operations copy/display parity, exact approved power-check wording, no timestamps for shutdown/ten-complete copy, absence of the legacy WAITING FOR INCIDENT DATA panel, canonical AccNew record parity, and finder theme markers.
2. Diagnose the AccNew mismatch against the real compressed TOR payload and identify which canonical fields the top Finder searches that Analyzer normalization currently misses.
3. Implement Operations message rendering from a single message source and copy directly from the rendered card text.
4. Extend TOR canonical normalization/search parity so Analyzer candidates are based on the same record content as the top Finder, while retaining the approved >=80% scoring gate and explicit selection.
5. Remove/hide the legacy waiting panel from the decompressed Finder runtime without removing analyzer input/output sections.
6. Apply a shared premium dark/gold/cyan visual layer to TOR SYSTEM FINDER and VOIP Finder interiors, keeping theme sync and responsive behavior.
7. Add an idempotent production generator for the unified fixes, update both workflows, run full CI, review the PR diff, then merge/deploy only after verification.
