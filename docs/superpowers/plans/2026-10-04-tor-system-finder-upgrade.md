# TOR SYSTEM FINDER Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing TOR SYSTEM FINDER into one continuous owner-finder + incident-analysis workflow that extracts monitoring errors, matches TOR systems using deterministic evidence, requires explicit system selection, resolves every owner, and generates independent copy-ready operational and mail text.

**Architecture:** Keep `system-owner-finder.html` as the existing compressed-payload loader and add a versioned enhancement layer rather than replacing the current Finder. Put parsing/matching/text generation in a browser-and-Node-compatible pure JavaScript core, keep DOM/state/copy behavior in a focused UI module, and expose the canonical bundled TOR data to that UI through a deterministic bridge derived from the existing payload. Generate/inject the enhancement idempotently through repository scripts and verify it in the existing GitHub Actions generation path.

**Tech Stack:** Static HTML/CSS/JavaScript, Python 3 repository generators/tests, Node.js for deterministic JavaScript tests, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-04-tor-system-finder-upgrade-design.md`

## Global Constraints

- Keep TOR SYSTEM FINDER / FIND SYSTEM OWNER as one continuous page; do not add a fourth Utility menu item or separate Analyzer tab.
- Preserve the existing TOR/System Owner source as the single source of truth; do not create a second manually maintained owner database.
- Analysis starts only when the user presses `ANALYZE ERROR`; paste alone must not trigger analysis.
- Extract and normalize Monitor, System/Service name, URL, Host, Domain, IP, Error, and Time when present.
- Exact IP match is `MATCH 100%` by itself; if several records share that IP, show all of them.
- Without exact IP, score Exact Host `60` + System Name up to `40`, otherwise Domain `30` + System Name up to `70`.
- Display only candidates with `MATCH >= 80%`; never auto-select a candidate.
- Candidate evidence must show Incident and TOR values, contributions, and the total score.
- Owner resolution happens only after explicit `SELECT THIS SYSTEM` and returns every owner for the selected system.
- Phone and email values are individually copyable; never auto-populate `To:` and never send mail.
- Operational copy blocks and the Mail Draft must be fully visible, independent, and individually copyable.
- The Mail Draft footer is fixed: `ติดต่อเจ้าหน้าที่ RDNOC`, `เบอร์ 02-272-8891 - 3`, `Line ID: @RDNOC`, `ขอบคุณครับ/ขอบคุณค่ะ`.
- Preserve existing Finder search/import/result rendering, owner quick-copy, GOLD/CYBER theme sync, same-page Utility navigation, and responsive behavior.
- Enhancement/generator behavior must be idempotent across repeated GitHub Actions runs.
- No external AI/LLM or remote matching dependency.

## Review Focus

- A pasted incident containing escaped `https\://`, CRLF line endings, repeated spaces, and blank lines must still extract the same URL/host/IP fields as its clean equivalent; pin this in Task 1 parser tests.
- A generic `rd.go.th` domain match with a weak or unrelated system name must stay below 80% rather than appearing as a reliable candidate; pin this in Task 2 scoring tests.
- Changing the raw incident after selecting a system must invalidate the selection, owners, copy blocks, and mail draft until `ANALYZE ERROR` runs again; pin this in Task 4 UI-state tests.
- Multiple records sharing one exact IP must all remain selectable and must not collapse into one candidate; pin this in Task 2 matching tests and Task 4 rendering tests.
- Owner contacts containing duplicate phone/email strings across different owners must deduplicate values only within an owner, not merge distinct owner identities; pin this in Task 3 owner-adapter tests.

---

## File Structure

### Create

- `tor-system-finder-core.js` — pure incident parsing, normalization, system-name similarity, scoring, candidate filtering, owner contact normalization, and generated-text functions; usable from browser and Node tests.
- `tor-system-finder-upgrade.js` — browser UI/state/controller layer for the new Analyzer section; consumes `TorSystemFinderCore` and a canonical TOR data bridge.
- `tor-system-finder-upgrade.css` — visual layer for Analyzer input, extracted fields, candidates/evidence, owner cards, copy blocks, and Mail Draft.
- `scripts/add-tor-system-finder-upgrade.py` — idempotent generator/loader patcher that exposes canonical TOR data and injects the new CSS/JS into the existing Finder payload flow.
- `scripts/test-tor-system-finder-core.js` — deterministic Node tests for parser, matching, owner normalization, and generated text.
- `scripts/test-tor-system-finder-upgrade.py` — static/integration test for loader injection, single-source bridge, idempotency markers, required UI hooks, and regression constraints.

### Modify

- `system-owner-finder.html` — generated/materialized loader changes only; must still decompress and render the original payload.
- `.github/workflows/test-traffic-log-layout.yml` — run the new generator and verification tests in PR CI.
- `.github/workflows/resize-dhcp-fields.yml` — run the new generator/tests in the main-generation workflow and include new generated/static assets in the commit step where required.
- `scripts/test-system-owner-finder.py` — extend regression assertions so existing Finder/Utility/theme/quick-copy behavior is explicitly preserved after the upgrade.

### Do Not Replace

- `assets/system-owner-finder-payload-*.txt` — remain the canonical compressed Finder payload unless implementation discovers that an upstream payload regeneration is strictly necessary; the upgrade should normally patch around them rather than fork their data manually.
- `scripts/add-system-owner-finder.py` — continues to own same-page Utility placement; do not move Analyzer logic into the parent workspace generator.

---

### Task 1: Incident Parsing and Normalization Core

**Files:**
- Create: `tor-system-finder-core.js`
- Create: `scripts/test-tor-system-finder-core.js`

**Interfaces:**
- Produces: `TorSystemFinderCore.parseIncident(rawText: string) -> Incident`
- Produces: `TorSystemFinderCore.normalizeSystemName(text: string) -> string`
- Produces: `TorSystemFinderCore.systemNameSimilarity(a: string, b: string) -> number` where result is integer `0..100`
- `Incident` keys: `raw`, `monitor`, `systemName`, `url`, `host`, `domain`, `ip`, `error`, `time`

- [ ] **Step 1: Write failing parser tests**

Add tests named `extracts_sample_incident_fields`, `accepts_escaped_url_and_url_label_variants`, `normalizes_crlf_spaces_and_blank_lines`, `derives_host_and_domain_from_url`, `extracts_hosted_on_ip_and_error`, and `allows_missing_optional_fields`.

For the approved sample, assert exactly:

```js
assert.equal(result.url, 'https://intrapp2.rd.go.th/signed_intra/login/login.php');
assert.equal(result.host, 'intrapp2.rd.go.th');
assert.equal(result.domain, 'rd.go.th');
assert.equal(result.ip, '10.20.17.71');
assert.equal(result.error, 'Network connection failed. Unable to connect to the remote server');
assert.equal(result.time, 'Wednesday, September 30, 2026 10:05 PM');
```

Also assert `systemName` removes the leading `Monitor` label and incident-state suffix `ไม่สามารถเรียกใช้งานได้` while preserving meaningful `Time Stamp` and Thai service words.

- [ ] **Step 2: Run tests to verify RED**

Run: `node scripts/test-tor-system-finder-core.js`

Expected: FAIL because `tor-system-finder-core.js` and its exported functions do not exist yet.

- [ ] **Step 3: Implement the pure parser/normalizer API**

Implement a UMD-style export so Node receives `module.exports` and the browser receives `window.TorSystemFinderCore`. Keep parsing deterministic and dependency-free. `systemNameSimilarity()` must use normalized token overlap plus normalized string similarity in a deterministic formula, return an integer percentage, and treat Thai/English tokens case-insensitively for English without deleting Thai characters.

- [ ] **Step 4: Run parser tests to verify GREEN**

Run: `node scripts/test-tor-system-finder-core.js`

Expected: PASS for all Task 1 parser/normalization cases.

- [ ] **Step 5: Commit**

```bash
git add tor-system-finder-core.js scripts/test-tor-system-finder-core.js
git commit -m "feat: add TOR incident parsing core"
```

---

### Task 2: Deterministic TOR Candidate Matching and Evidence

**Files:**
- Modify: `tor-system-finder-core.js`
- Modify: `scripts/test-tor-system-finder-core.js`

**Interfaces:**
- Consumes: `Incident`, `normalizeSystemName()`, `systemNameSimilarity()` from Task 1
- Produces: `TorSystemFinderCore.scoreCandidate(incident: Incident, record: TorRecord) -> Candidate`
- Produces: `TorSystemFinderCore.findCandidates(incident: Incident, records: TorRecord[]) -> Candidate[]`
- `TorRecord` normalized keys: `id`, `systemName`, `ips[]`, `urls[]`, `hosts[]`, `domains[]`, `owners[]`, `raw`
- `Candidate` keys: `record`, `score`, `matchMode`, `evidence[]`; `evidence[]` entries contain `field`, `incidentValue`, `torValue`, `matched`, `contribution`, `note`

- [ ] **Step 1: Add failing candidate-scoring tests**

Cover:

```js
assert.equal(scoreCandidate(exactIpIncident, record).score, 100);
assert.deepEqual(findCandidates(exactIpIncident, records).map(x => x.record.id), ['a','b']);
assert.equal(hostCandidate.score, 90); // exact host 60 + 75% name => 30/40
assert.ok(domainCandidate.score >= 80);
assert.deepEqual(findCandidates(weakDomainIncident, records), []);
```

Also assert: candidates below 80 are absent; candidates at exactly 80 remain; exact-IP results do not auto-select; results sort by score descending but preserve all ties; evidence includes both Incident and TOR values and exact numeric contributions.

- [ ] **Step 2: Run matching tests to verify RED**

Run: `node scripts/test-tor-system-finder-core.js`

Expected: existing parser tests PASS; new scoring tests FAIL because matching functions are missing.

- [ ] **Step 3: Implement scoring rules exactly**

`findCandidates()` first checks for any exact IP matches. If one or more exist, return every exact-IP record at 100% and do not mix lower-confidence Host/Domain candidates into that result set. If no exact IP exists, evaluate exact Host + name (`60 + similarity*0.40`) or Domain + name (`30 + similarity*0.70`), round to integer, keep only `>=80`, and attach explainable evidence.

- [ ] **Step 4: Run matching tests to verify GREEN**

Run: `node scripts/test-tor-system-finder-core.js`

Expected: PASS for parsing and matching suites.

- [ ] **Step 5: Commit**

```bash
git add tor-system-finder-core.js scripts/test-tor-system-finder-core.js
git commit -m "feat: add explainable TOR candidate matching"
```

---

### Task 3: Canonical TOR Data Bridge and Owner Resolution

**Files:**
- Create: `scripts/add-tor-system-finder-upgrade.py`
- Create: `scripts/test-tor-system-finder-upgrade.py`
- Modify: `system-owner-finder.html`
- Modify: `tor-system-finder-core.js`
- Modify: `scripts/test-tor-system-finder-core.js`

**Interfaces:**
- Produces in Finder page: `window.__torSystemFinderGetRecords() -> TorRecord[]`
- Produces: `TorSystemFinderCore.normalizeTorRecords(sourceRecords: unknown[]) -> TorRecord[]`
- Produces: `TorSystemFinderCore.resolveOwners(record: TorRecord) -> Owner[]`
- `Owner` keys: `id`, `prefix`, `name`, `phones[]`, `emails[]`, `raw`

- [ ] **Step 1: Write failing bridge and owner tests**

In `scripts/test-tor-system-finder-upgrade.py`, assert the generator:

- reads the existing seven `assets/system-owner-finder-payload-*.txt` files rather than a hand-maintained owner list;
- preserves `DecompressionStream('gzip')` and the original payload list;
- injects one version marker such as `tor-system-finder-upgrade-v1`;
- exposes `window.__torSystemFinderGetRecords` from the canonical Finder data path;
- does not embed a second static owner database;
- is idempotent when executed twice.

In `scripts/test-tor-system-finder-core.js`, assert `resolveOwners()` returns all distinct owners, preserves multiple phone/email values, deduplicates repeated contact strings within one owner, and does not merge two distinct owners merely because they share a phone or email.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
python scripts/test-tor-system-finder-upgrade.py
node scripts/test-tor-system-finder-core.js
```

Expected: FAIL because the canonical bridge, generator markers, and owner functions do not exist.

- [ ] **Step 3: Implement the canonical data bridge**

In `scripts/add-tor-system-finder-upgrade.py`, patch the loader/decompressed Finder source idempotently so the runtime exposes the current canonical TOR dataset through `window.__torSystemFinderGetRecords()`. Reuse the Finder's existing bundled/imported data variable or getter; do not serialize a separate manually maintained owner list. The bridge must return raw current records, and `normalizeTorRecords()` converts them to the `TorRecord` interface consumed by Task 2.

- [ ] **Step 4: Implement owner normalization**

Add `normalizeTorRecords()` and `resolveOwners()` to `tor-system-finder-core.js`. Preserve owner identity and all available contact-routing fields; normalize blank values and repeated phone/email strings without inventing data.

- [ ] **Step 5: Materialize and verify GREEN**

Run:

```bash
python scripts/add-tor-system-finder-upgrade.py
python scripts/add-tor-system-finder-upgrade.py
python scripts/test-tor-system-finder-upgrade.py
node scripts/test-tor-system-finder-core.js
python scripts/test-system-owner-finder.py
```

Expected: all PASS; second generator run produces no duplicated markers/UI hooks; existing Finder regression test remains green.

- [ ] **Step 6: Commit**

```bash
git add scripts/add-tor-system-finder-upgrade.py scripts/test-tor-system-finder-upgrade.py system-owner-finder.html tor-system-finder-core.js scripts/test-tor-system-finder-core.js
git commit -m "feat: expose canonical TOR records for incident matching"
```

---

### Task 4: One-Page Analyzer UI, Candidate Selection, and State Invalidation

**Files:**
- Create: `tor-system-finder-upgrade.js`
- Create: `tor-system-finder-upgrade.css`
- Modify: `scripts/add-tor-system-finder-upgrade.py`
- Modify: `scripts/test-tor-system-finder-upgrade.py`
- Modify: `system-owner-finder.html`

**Interfaces:**
- Consumes: `window.TorSystemFinderCore`, `window.__torSystemFinderGetRecords()`
- Produces DOM root: `#torIncidentAnalyzer`
- Produces action: `#torAnalyzeError`
- Produces sections: `#torExtractedFields`, `#torCandidates`, `#torSelectedSystem`, `#torOwners`, `#torCopyBlocks`, `#torMailDraft`
- UI state values: `idle`, `analyzing`, `extracted`, `candidates`, `no-reliable-match`, `selected`, `ready`

- [ ] **Step 1: Add failing UI/static tests**

Assert the generated Finder includes exactly one Analyzer root, one `ANALYZE ERROR` button, the required section IDs, `SELECT THIS SYSTEM`, and script/style references exactly once after two generator runs. Assert no `input`/`paste` handler calls analysis automatically.

Add a lightweight Node DOM-free state test or pure controller-state helper test proving that changing raw input after selection clears selected system/owners/generated outputs and returns the workflow to `idle` until the button is pressed again.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
python scripts/test-tor-system-finder-upgrade.py
node scripts/test-tor-system-finder-core.js
```

Expected: FAIL on missing Analyzer UI/controller hooks.

- [ ] **Step 3: Implement the continuous-page Analyzer UI**

Render the Analyzer below the existing Finder content, not in a tab or separate page. `ANALYZE ERROR` calls `parseIncident()`, normalizes canonical TOR records, calls `findCandidates()`, and renders extracted fields and only candidates >=80%. For `NO RELIABLE TOR MATCH >= 80%`, keep extracted fields visible and do not render owner/output sections.

- [ ] **Step 4: Implement candidate evidence and explicit selection**

Each candidate shows score, match mode, Incident vs TOR values, matched/not-matched state, contribution, and `SELECT THIS SYSTEM`. Multiple 100% candidates remain separate/selectable. Owner resolution and generated-output sections stay locked until selection.

- [ ] **Step 5: Implement state invalidation and responsive/theme behavior**

Any edit to the raw textarea after analysis invalidates previous candidates/selection/owners/outputs. Use CSS variables already exposed by the Finder for GOLD/CYBER compatibility; no separate theme system. All text areas/cards must wrap fully without ellipsis or line-clamp, and mobile layout must reduce to one column without horizontal overflow.

- [ ] **Step 6: Run integration tests to verify GREEN**

Run:

```bash
python scripts/add-tor-system-finder-upgrade.py
python scripts/test-tor-system-finder-upgrade.py
node scripts/test-tor-system-finder-core.js
python scripts/test-system-owner-finder.py
python scripts/test-responsive-fit.py
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add tor-system-finder-upgrade.js tor-system-finder-upgrade.css scripts/add-tor-system-finder-upgrade.py scripts/test-tor-system-finder-upgrade.py system-owner-finder.html
git commit -m "feat: add TOR incident analyzer workflow"
```

---

### Task 5: Owner Contact Copy Controls and Operational Text Generation

**Files:**
- Modify: `tor-system-finder-core.js`
- Modify: `tor-system-finder-upgrade.js`
- Modify: `tor-system-finder-upgrade.css`
- Modify: `scripts/test-tor-system-finder-core.js`
- Modify: `scripts/test-tor-system-finder-upgrade.py`

**Interfaces:**
- Consumes: selected `TorRecord`, `resolveOwners()`, parsed `Incident`
- Produces: `TorSystemFinderCore.buildOperationalBlocks(incident: Incident) -> OperationalBlocks`
- `OperationalBlocks` keys: `combinedResolution`, `urlNormal`, `urlAbnormal`, `ticketAction`, `mailCompletion`
- Browser copy action: `copyTorValue(text: string, button: HTMLElement) -> Promise<void>`

- [ ] **Step 1: Add failing output-template tests**

Assert exact generated values for the approved URL:

```text
ตรวจสอบสามารถใช้งาน Url: https://intrapp2.rd.go.th/signed_intra/login/login.php ได้ปกติ
```

```text
ตรวจสอบไม่สามารถใช้งาน Url: https://intrapp2.rd.go.th/signed_intra/login/login.php ได้ปกติ
```

Assert combined block begins with the extracted Monitor and contains:

```text
แก้ไขโดย : ตรวจสอบสามารถใช้งาน Url: https://intrapp2.rd.go.th/signed_intra/login/login.php ได้ปกติ
```

Also assert exact independent constants:

```text
กดตั๊กเพิ่มไม่ได้
```

```text
ดำเนินการส่ง Mail แจ้งผู้ดูแลระบบเรียบร้อยแล้ว
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node scripts/test-tor-system-finder-core.js`

Expected: FAIL because `buildOperationalBlocks()` does not exist.

- [ ] **Step 3: Implement operational text generation**

Implement `buildOperationalBlocks()` as a pure function. Preserve the full extracted URL path. Missing URL returns a visibly incomplete/disabled URL-dependent block state rather than fabricating a URL.

- [ ] **Step 4: Implement Owner cards and independent copy controls**

Render every owner from `resolveOwners()`. Each name, phone, and email value gets its own copy button; multiple phones/emails remain separate. Add optional `COPY ALL CONTACTS`, but no mail recipient field and no send action.

- [ ] **Step 5: Implement independent operational Copy Blocks**

Render all five blocks separately with full untruncated text and independent copy buttons. Clipboard failure keeps text selectable and displays failure feedback.

- [ ] **Step 6: Run tests to verify GREEN**

Run:

```bash
node scripts/test-tor-system-finder-core.js
python scripts/test-tor-system-finder-upgrade.py
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tor-system-finder-core.js tor-system-finder-upgrade.js tor-system-finder-upgrade.css scripts/test-tor-system-finder-core.js scripts/test-tor-system-finder-upgrade.py
git commit -m "feat: add owner and operations copy outputs"
```

---

### Task 6: Fixed Mail Draft Generator

**Files:**
- Modify: `tor-system-finder-core.js`
- Modify: `tor-system-finder-upgrade.js`
- Modify: `scripts/test-tor-system-finder-core.js`
- Modify: `scripts/test-tor-system-finder-upgrade.py`

**Interfaces:**
- Produces: `TorSystemFinderCore.buildMailDraft(incident: Incident, selectedRecord: TorRecord) -> string`

- [ ] **Step 1: Add failing Mail Draft tests**

Assert the result contains `เรียน ผู้ดูแลระบบ`, the exact Monitor text, full `Url: <url>`, extracted hosted/error content when present, and `เวลา : <time>`.

Assert the result ends with exactly:

```text
ติดต่อเจ้าหน้าที่ RDNOC
เบอร์ 02-272-8891 - 3
Line ID: @RDNOC
ขอบคุณครับ/ขอบคุณค่ะ
```

Assert it contains no `To:` field and no auto-inserted owner email address.

- [ ] **Step 2: Run test to verify RED**

Run: `node scripts/test-tor-system-finder-core.js`

Expected: FAIL because `buildMailDraft()` does not exist.

- [ ] **Step 3: Implement `buildMailDraft()`**

Use only incident/selected-system data plus the fixed footer. Do not synthesize missing incident facts. Keep owner contact values outside the Mail Draft.

- [ ] **Step 4: Render separate Mail Draft panel**

Display the complete draft in `#torMailDraft` with one `COPY MAIL` action. Do not expose send/To/CC controls.

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
node scripts/test-tor-system-finder-core.js
python scripts/test-tor-system-finder-upgrade.py
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tor-system-finder-core.js tor-system-finder-upgrade.js scripts/test-tor-system-finder-core.js scripts/test-tor-system-finder-upgrade.py
git commit -m "feat: add TOR owner mail draft"
```

---

### Task 7: Existing Finder Regression Coverage and Generator Idempotency

**Files:**
- Modify: `scripts/test-system-owner-finder.py`
- Modify: `scripts/test-tor-system-finder-upgrade.py`
- Modify: `scripts/add-tor-system-finder-upgrade.py`
- Modify: `system-owner-finder.html`

**Interfaces:**
- Consumes all previous tasks; produces no new product API.

- [ ] **Step 1: Add failing regression assertions**

Extend tests to prove the generated Finder still contains/executes the existing payload behavior indicators: `TOR SYSTEM FINDER`, `Analyze System`, `Import Excel`, `CONTACT ROUTING`, original payload references, current owner quick-copy enhancement, GOLD/CYBER theme markers, and same-page iframe integration.

Assert the new generator run twice leaves exactly one upgrade marker, one core script reference, one UI script reference, and one stylesheet reference.

- [ ] **Step 2: Run regression tests to verify RED where gaps exist**

Run:

```bash
python scripts/add-tor-system-finder-upgrade.py
python scripts/add-tor-system-finder-upgrade.py
python scripts/test-tor-system-finder-upgrade.py
python scripts/test-system-owner-finder.py
```

Expected: any duplicate/missing hook fails explicitly.

- [ ] **Step 3: Make the generator fully idempotent without rewriting unrelated payload behavior**

Use versioned start/end markers or exact loader reference replacement. Do not use broad regex that can consume neighboring script indentation/content.

- [ ] **Step 4: Run full local regression suite**

Run:

```bash
node scripts/test-tor-system-finder-core.js
python scripts/test-tor-system-finder-upgrade.py
python scripts/test-system-owner-finder.py
python scripts/test-responsive-fit.py
node scripts/test-business-hours.js
node scripts/test-operations-visual-refresh.js
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/test-system-owner-finder.py scripts/test-tor-system-finder-upgrade.py scripts/add-tor-system-finder-upgrade.py system-owner-finder.html
git commit -m "test: protect TOR Finder upgrade regressions"
```

---

### Task 8: CI / Generation Workflow Integration

**Files:**
- Modify: `.github/workflows/test-traffic-log-layout.yml`
- Modify: `.github/workflows/resize-dhcp-fields.yml`

**Interfaces:**
- Consumes: `scripts/add-tor-system-finder-upgrade.py`, `scripts/test-tor-system-finder-upgrade.py`, `scripts/test-tor-system-finder-core.js`

- [ ] **Step 1: Add failing workflow/static expectations**

In `scripts/test-tor-system-finder-upgrade.py`, assert both workflow files reference the new generator, core test, integration test, and new static JS/CSS paths in their path filters.

- [ ] **Step 2: Run integration test to verify RED**

Run: `python scripts/test-tor-system-finder-upgrade.py`

Expected: FAIL because workflows do not yet invoke the upgrade generator/tests.

- [ ] **Step 3: Update PR CI workflow**

In `test-traffic-log-layout.yml`, add path filters for the new core/UI/CSS/generator/tests, run `python scripts/add-tor-system-finder-upgrade.py` after the existing System Owner generator and before responsive verification, then run both new tests.

- [ ] **Step 4: Update main generation workflow**

In `resize-dhcp-fields.yml`, add the same paths, generation step, and tests. Ensure the generated commit step includes `system-owner-finder.html` plus the new static `tor-system-finder-core.js`, `tor-system-finder-upgrade.js`, and `tor-system-finder-upgrade.css` when changed. Change the generated commit message to describe the TOR SYSTEM FINDER upgrade rather than an unrelated Operations-only label.

- [ ] **Step 5: Run the full workflow-equivalent command set locally**

Run:

```bash
python scripts/add-system-owner-finder.py
python scripts/add-tor-system-finder-upgrade.py
python scripts/add-responsive-fit.py
python scripts/add-business-hours.py
python scripts/add-operations-visual-refresh.py
python scripts/test-traffic-log-layout.py
node scripts/test-downsince-bilingual.js
python scripts/test-ip-reputation.py
node scripts/test-local-ip-reputation.js
node scripts/test-ip-reputation-api.js
python scripts/test-system-owner-finder.py
node scripts/test-tor-system-finder-core.js
python scripts/test-tor-system-finder-upgrade.py
python scripts/test-responsive-fit.py
node scripts/test-business-hours.js
node scripts/test-operations-visual-refresh.js
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/test-traffic-log-layout.yml .github/workflows/resize-dhcp-fields.yml scripts/test-tor-system-finder-upgrade.py
git commit -m "ci: verify TOR System Finder upgrade"
```

---

### Task 9: Branch Verification and Production Readiness

**Files:**
- No new product files unless verification exposes a defect.

**Interfaces:**
- Consumes the complete branch.

- [ ] **Step 1: Run all upgrade and regression tests from a clean checkout/worktree**

Run the workflow-equivalent command set from Task 8 plus `git diff --check`.

Expected: all tests PASS and `git diff --check` reports no whitespace errors.

- [ ] **Step 2: Manually verify the approved sample workflow in browser**

Paste the approved Time Stamp incident, click `ANALYZE ERROR`, confirm extracted URL/IP/time/error, confirm exact-IP candidates are 100%, confirm multiple candidates remain selectable, select one, verify all owners, individually copy a phone and email, copy each operational block, and copy the Mail Draft.

- [ ] **Step 3: Manually verify no-reliable-match and edit-invalidation flows**

Use an unrelated low-confidence incident and confirm `NO RELIABLE TOR MATCH >= 80%`. Then analyze/select a valid incident, edit the raw input, and confirm selection/owners/outputs are invalidated until re-analysis.

- [ ] **Step 4: Manually verify existing Finder behavior and responsive/theme regression**

Check existing owner search, `Import Excel`, quick-copy, GOLD/CYBER switching from parent, same-page BACK behavior, mobile width, desktop width, and no horizontal clipping.

- [ ] **Step 5: Request whole-branch code review and address findings**

Use the repository's review workflow before merge. Any bug found here gets a failing regression test before its fix.

- [ ] **Step 6: Final verification commit only if review required changes**

```bash
git status --short
git log --oneline --decorate -10
```

Expected: working tree clean and task commits present in order.
