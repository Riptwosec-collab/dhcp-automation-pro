# TOR SYSTEM FINDER Upgrade Design

## Goal

Upgrade the existing **TOR SYSTEM FINDER / FIND SYSTEM OWNER** into one continuous system that can accept a full monitoring-error message, extract incident data, match the incident against TOR systems, require the operator to select the intended system when multiple candidates exist, return every matching system owner, and generate copy-ready operational and mail text.

The upgrade must preserve the current owner-finder workflow and reuse the existing TOR/System Owner data as the single source of truth. It must not create a second manually maintained owner database.

## Current Integration Context

The main DHCP Automation Pro workspace already opens `system-owner-finder.html` inside the same-page Utility workspace under **FIND SYSTEM OWNER**.

`system-owner-finder.html` currently:

- loads the existing Finder payload from `assets/system-owner-finder-payload-*.txt`
- decompresses the payload in the browser
- writes the Finder document into the same iframe
- injects the existing owner quick-copy enhancement for prefix, name, phone, and email

The upgrade must extend this existing Finder experience rather than add a fourth Utility menu or a separate web application.

## Product Experience

Everything stays on one page and in one system. There are no separate tabs for `FIND OWNER` and `ERROR ANALYZER`.

The page flows vertically:

1. Existing TOR / System Owner Finder
2. Incident / Error Input
3. Extracted Incident Data
4. Candidate System Matching
5. User System Selection
6. Matched System Owners
7. Operational Copy Blocks
8. Mail Draft

The existing finder remains usable by itself. The incident workflow is an additional workflow below it.

## Incident Input

Add a large multiline input for the operator to paste the full monitoring/error message.

Example input:

```text
Monitor ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp) ไม่สามารถเรียกใช้งานได้

Url: https://intrapp2.rd.go.th/signed_intra/login/login.php
hosted on 10.20.17.71 of Network connection failed. Unable to connect to the remote server
เวลา : Wednesday, September 30, 2026 10:05 PM
```

The input is not analyzed immediately on paste.

A dedicated action button must be provided:

`ANALYZE ERROR`

Only after that button is pressed does the system parse, match, and display results.

## Auto Extraction

The analyzer extracts and normalizes the following fields when present:

- `Monitor`
- `System / Service name`
- `URL`
- `Host`
- `Domain`
- `IP`
- `Error`
- `Time`

Example result from the sample incident:

- Monitor: `ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา (Time Stamp) ไม่สามารถเรียกใช้งานได้`
- URL: `https://intrapp2.rd.go.th/signed_intra/login/login.php`
- Host: `intrapp2.rd.go.th`
- Domain: `rd.go.th`
- IP: `10.20.17.71`
- Error: `Network connection failed. Unable to connect to the remote server`
- Time: `Wednesday, September 30, 2026 10:05 PM`

The parser must tolerate common source formatting variations, including:

- `Url:` and `URL:`
- escaped URLs such as `https\://...`
- extra spaces and blank lines
- Thai or English time labels
- monitor text on one or multiple lines
- error text following `hosted on <IP> of ...`

The raw pasted text must remain visible so the operator can compare extraction against the original source.

Extracted values are used immediately for matching; no required intermediate edit form is introduced in this version.

## TOR Matching Rules

### Rule 1 — Exact IP

If the extracted incident IP exactly matches a TOR/System record IP, that candidate receives:

`MATCH 100%`

IP exact match is sufficient by itself for 100%.

If multiple systems share the exact same IP, every 100% candidate is shown. The software must not silently pick one.

### Rule 2 — Host + System Name

If no exact IP match exists, evaluate exact Host and normalized system-name similarity.

Score:

- exact Host: up to `60`
- System Name similarity: up to `40`

Total maximum: `100`

Example:

- Host exact = `60`
- System-name similarity = `75%`
- Name contribution = `30 / 40`
- Final match = `90%`

### Rule 3 — Domain + System Name

If there is no exact IP match and Host is not exact, evaluate Domain and normalized system-name similarity.

Score:

- Domain match: up to `30`
- System Name similarity: up to `70`

Total maximum: `100`

A shared broad domain alone must never produce a reliable candidate. The system name must contribute enough score to cross the display threshold.

### Candidate Threshold

Only candidates with:

`MATCH >= 80%`

are displayed.

Candidates below 80% are hidden from the selectable list.

If no candidate reaches 80%, show a clear state such as:

`NO RELIABLE TOR MATCH >= 80%`

The software must not guess or auto-select a low-confidence system.

## System Name Similarity

System-name comparison must be deterministic and explainable.

Before comparison, normalize both incident and TOR names by:

- trimming whitespace
- collapsing repeated whitespace
- case-folding English text
- removing non-semantic leading labels such as `Monitor`
- removing known incident-state suffixes such as `ไม่สามารถเรียกใช้งานได้` when calculating the service-name similarity
- preserving meaningful Thai and English technical words such as `Time Stamp`, `ใบกำกับภาษี`, system abbreviations, and product/service names

The implementation plan may choose the exact deterministic token-similarity method, but it must produce a stable percentage and expose the evidence used for the score.

No external AI or remote LLM call is required for matching in this version.

## Candidate Evidence UI

Every displayed candidate must explain why it matched.

Example:

```text
Candidate
ระบบจัดทำใบกำกับภาษีและประทับรับรองเวลา

MATCH 91%

IP
Incident : 10.20.17.99
TOR      : 10.20.17.71
✕ NOT EXACT

Host
Incident : intrapp2.rd.go.th
TOR      : intrapp2.rd.go.th
✓ EXACT HOST +60

System Name
Incident : ระบบการจัดทำใบกำกับภาษี โดยการประทับรับรองเวลา
TOR      : ระบบจัดทำใบกำกับภาษีและประทับรับรองเวลา
✓ Similar 78% -> +31/40

TOTAL 91%
```

The evidence must show both sides of the comparison, not only a generic label such as `Domain ตรง + ชื่อระบบใกล้เคียง`.

Each candidate provides:

`SELECT THIS SYSTEM`

The user must explicitly choose one system before owner resolution and generated outputs are unlocked.

This explicit selection requirement also applies when there are multiple 100% candidates.

## Owner Resolution

After the user selects a system, retrieve **all owners associated with that selected system** from the existing TOR/System Owner source.

Do not select only the first owner.

For each owner, show every available contact field, including when present:

- Prefix / คำนำหน้า
- Name
- Phone
- Email
- other existing contact-routing information already held by the Finder

Each copyable value must have an independent copy action:

- `COPY NAME`
- `COPY PHONE`
- `COPY EMAIL`

If an owner has multiple phone numbers or email addresses, each value must be individually copyable.

Provide an optional `COPY ALL CONTACTS` convenience action, but never auto-fill or auto-send email recipients.

## Operational Copy Blocks

After system selection, generate separate copyable blocks from the extracted incident data.

Each block must be visible in full and copyable independently.

### Combined Monitor + Resolution Block

```text
Monitor <monitor text>
แก้ไขโดย : ตรวจสอบสามารถใช้งาน Url: <url> ได้ปกติ
```

### URL Normal Check

```text
ตรวจสอบสามารถใช้งาน Url: <url> ได้ปกติ
```

### URL Abnormal Check

```text
ตรวจสอบไม่สามารถใช้งาน Url: <url> ได้ปกติ
```

### Ticket Action Note

```text
กดตั๊กเพิ่มไม่ได้
```

### Mail Completion Note

```text
ดำเนินการส่ง Mail แจ้งผู้ดูแลระบบเรียบร้อยแล้ว
```

These are separate outputs. The user must be able to copy each one without copying the others.

The generated URL must come from the extracted incident and must preserve the meaningful full path, not only the domain.

## Mail Draft

Generate a separate mail-draft block based on the selected system and extracted incident data.

Expected structure:

```text
เรียน ผู้ดูแลระบบ

Monitor <monitor text>

Url: <url>
<error / hosted-on line as appropriate>
เวลา : <time>

ติดต่อเจ้าหน้าที่ RDNOC
เบอร์ 02-272-8891 - 3
Line ID: @RDNOC
ขอบคุณครับ/ขอบคุณค่ะ
```

The RDNOC footer is fixed text in this version.

The mail draft has its own `COPY MAIL` action.

Owner emails are displayed separately in the owner section. The system must **not** auto-populate a `To:` field and must not send mail.

## Existing Finder Behavior to Preserve

The upgrade must not regress the current Finder features, including:

- existing TOR/System Owner search
- existing result rendering
- existing owner contact output
- current prefix/name/phone/email quick-copy behavior
- theme synchronization from the parent DHCP Automation Pro workspace
- same-page Utility behavior
- responsive behavior on mobile, tablet, laptop, desktop, landscape, and ultrawide layouts

The upgrade must remain inside the existing `FIND SYSTEM OWNER` Utility workspace.

## Single Source of Truth Requirement

The existing TOR/System Owner records remain canonical.

The incident matcher must build or access a normalized search index from those existing records at runtime or through a deterministic generated index derived from the same source.

It is explicitly forbidden to introduce a second manually maintained list of system owners merely for incident matching.

If a generated index is used for performance, its generation must be deterministic and part of the repository workflow so it cannot silently drift from the Finder source data.

## Technical Direction

The recommended implementation keeps the current compressed Finder payload architecture and adds a versioned enhancement layer to the Finder document.

The enhancement should be responsible for:

- rendering the incident input and result sections inside the same Finder page
- parsing pasted incident text
- normalizing incident fields
- building/accessing a normalized TOR/System record index
- scoring candidate systems
- rendering match evidence
- handling explicit system selection
- resolving all owners for the selected system
- generating operational copy blocks
- generating the mail draft

Pure parsing, normalization, scoring, and text-generation functions should be separable from DOM code so they can be tested deterministically.

The current payload-loading mechanism must remain functional. Any enhancement injection/generator must be idempotent so repeated GitHub Actions runs do not duplicate UI, CSS, or scripts.

## State Model

The incident workflow has the following UI states:

1. `idle` — waiting for pasted error
2. `analyzing` — processing after `ANALYZE ERROR`
3. `extracted` — parsed values visible
4. `candidates` — one or more >=80% systems visible
5. `no-reliable-match` — no candidate >=80%
6. `selected` — user chose a system
7. `ready` — owners, copy blocks, and mail draft are available

Changing the raw incident text after an analysis must invalidate the previous candidate selection and generated outputs until `ANALYZE ERROR` is pressed again.

## Failure Handling

- Empty input: do not analyze; show a clear input-required message.
- URL missing: continue extracting other fields and explain that URL-dependent copy blocks cannot be generated fully.
- IP missing: skip exact-IP rule and evaluate Host/Domain + System Name.
- Host missing but URL exists: derive Host from URL.
- No exact IP and no candidate >=80%: show `NO RELIABLE TOR MATCH >= 80%`.
- Multiple 100% IP candidates: show all and require user selection.
- No owners on selected system: show the selected system and an explicit `NO OWNER CONTACT FOUND` state; do not fabricate contact data.
- Clipboard failure: leave the text selectable and show copy failure feedback.

## Visual Direction

Keep the existing TOR SYSTEM FINDER visual identity and current DHCP Automation Pro dark cyber styling.

The new sections should use clear hierarchy rather than a separate visual application:

- large incident input panel
- compact extracted-field cards
- high-visibility match percentage
- green/success treatment for exact evidence
- amber treatment for fuzzy evidence
- red treatment for missing/failed evidence
- owner cards with obvious individual copy controls
- full-width copy text areas with no ellipsis or line-clamp
- clear selected-system state

The page must remain readable at all supported viewport sizes.

## Testing Strategy

Use test-driven development for implementation.

Required automated coverage includes:

### Parsing

- sample Thai/English monitor incident
- escaped `https\://` URL
- `Url:` / `URL:` variants
- IP extraction from `hosted on <IP>`
- time extraction
- missing optional fields

### Matching

- exact IP => 100%
- multiple exact-IP records => all returned
- exact Host + name similarity scoring
- Domain + name similarity scoring
- <80% candidates excluded
- >=80% candidates included
- no automatic candidate selection
- deterministic evidence output

### Owner Resolution

- all owners for selected system returned
- multiple phones/emails preserved
- duplicate contacts normalized without losing distinct owners
- no-owner state

### Generated Text

- URL Normal Check exact template
- URL Abnormal Check exact template
- combined Monitor + Resolution template
- ticket-action note
- mail-completion note
- mail draft fixed RDNOC footer
- no automatic `To:` insertion

### Integration / Regression

- existing Finder search still works
- existing quick-copy still works
- new analyzer appears once after repeated generator runs
- parent theme sync still works
- same-page Utility navigation still works
- responsive layout remains usable

## Deployment / Workflow Requirements

The repository workflow must verify the upgrade before generated page changes are committed or deployed.

The implementation should add a dedicated verification test for the TOR SYSTEM FINDER upgrade and include it in the existing GitHub Actions path that verifies Finder/UI generation.

Production deployment remains through the existing Vercel project and canonical URL.

## Non-Goals for This Version

- sending email directly
- automatically filling `To:` recipients
- auto-selecting fuzzy candidates
- using candidates below 80%
- remote AI/LLM matching
- editing TOR owner records from the analyzer
- creating a new Utility menu item
- splitting Finder and Analyzer into separate tabs
- creating a separate owner database

## Acceptance Criteria

The upgrade is complete when all of the following are true:

1. `FIND SYSTEM OWNER` remains one continuous page.
2. Existing Finder search remains functional.
3. User can paste a complete error and press `ANALYZE ERROR`.
4. Monitor, URL, Host, Domain, IP, Error, and Time are extracted when present.
5. Exact IP gives 100%.
6. Without exact IP, Host/Domain + System Name rules are used exactly as specified.
7. Only candidates >=80% are displayed.
8. Candidate evidence visibly compares incident values with TOR values and explains the score.
9. User must select one candidate before owner/output generation.
10. Multiple 100% candidates are all presented for selection.
11. Every owner for the selected system is shown.
12. Each owner phone and email can be copied individually.
13. Operational text blocks can each be copied independently.
14. Mail Draft is generated separately with the fixed RDNOC footer.
15. No email is automatically sent and no `To:` field is automatically populated.
16. Existing theme, quick-copy, responsive, and same-page Utility behavior remains intact.
17. Automated tests cover parsing, matching, owner resolution, generated text, idempotency, and regression paths.
