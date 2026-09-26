# Current — Recipe Content Refresh V2 canonical source (2026-09-27)

**Status: `RECIPE_REFRESH_V2_CANONICAL_SOURCE_READY`. Remote systems:
`UNTOUCHED`.** Branch `codex/recipe-content-refresh-v2-canonical` starts from
`origin/main` `c81d6da2b3a9c051270b97953bfbb2c5aa34d057`; pushed implementation
checkpoint is `fc5e713e10e0b63c890ba31fc29d9678be896ed7`.

- [done] Audit ZIP hash
  `ebc18f06ee7fb4498f8cd2a7886f333a85b385f32af4407ae1b44b4ec3cc06fe`:
  500 recipes / 500 unique expected IDs, 4,938 steps, 6,766 ingredients, 15
  root schema variants, 1,102 source references, 289 numeric and 211 null
  nutrition profiles.
- [done] Normalize all 500 recipes to the strict canonical V2 schema under
  `data/recipe-refresh/v2`; preserve qualitative/process truth without making
  RuntimeRecipe quantities nullable or inventing measurements.
- [done] Reconcile 2,515 ingredient rows (505 existing, 1,642 new reviewed,
  368 aliases, 0 ambiguous/invalid); classify 166 process-only and 7
  mixed-process rows; project 3,770 rows and exclude 2,996 unsafe rows.
- [done] Re-audit nutrition: 353 candidates, 1 publishable, 288 blocked, 211
  truthful null. Salt beds, frying media, discarded/process liquids, and
  unresolved absorption are not counted as fully consumed.
- [done] Add deterministic `pnpm recipe:refresh:check`, strict parser,
  RuntimeRecipe projection, real catalog fingerprint, machine audit artifacts,
  targeted 11-test regression suite, ADR-032, and `AUDIT_REPORT.md`.
- [done] Pin canonical artifact SHA-256
  `fc7eefe6573ee9de1083728db1f34b058954fa60ff478f7c5e41dce9e4570dbe`
  and runtime fingerprint
  `6d0e3eb85696bb7c31bc54ac62783bc94432aaf008028eca79b17041f3eaed87`.
- [done] Final local gates: refresh/import checks, typecheck, lint,
  `git diff --check`, focused 11/11, and `pnpm check` PASS; full Vitest 204
  files / 4,591 tests. Sparse-checkout initially omitted tracked `public/`;
  restoring that tracked directory fixed the unrelated CSP/PWA asset failures.
- [pending] Open PR, require hosted exact-head CI and independent review. Do
  not merge, deploy, create 0040, mutate D1/R2, change recipe authority, or
  enable T20 in this task.

Next authorized release task: generate the Content Refresh V2 manifest and
`0040_recipe_content_refresh_v2.sql` from this canonical package, then certify
staging before any production rollout.

---

# Historical takeover receipt - 2026-09-23

**Status: `T19_V2_CODE_COMPLETE_PRODUCTION_BLOCKED`. Production: `UNTOUCHED`.**
Repository ID `1368281478` is `vn-tako4/Frigo-dev`. Application PR #53 merged
normally at `03005fcbc39ab3c964393d2091f726088a4be5d0`; exact-head PR CI
`35810551334` and exact-main CI `35810986000` both PASS (189 files / 4,367 tests).
Integration reviewed head is `dbf32547a07fbc767e044365866a2bdfc4264cd8`; the
original recovery branch remains immutable at `0a04209e512d19293ed56a19d3fd51eb29ffefcd`.

Rechecked after the external merge: main remains `03005fc` and preserves the
exact recovered checkpoint. PR #54 carries this documentation-only handoff;
the application must not be reconstructed or republished as another PR.
Production D1 certification is blocked: this workspace has no Cloudflare API
token and `pnpm wrangler whoami` reports unauthenticated. Earlier takeover
evidence recorded missing GitHub verification secrets. Current repository and
Environment secret/variable listings return HTTP 403, so their present contents
cannot be independently verified here; Worker-side presence remains unverified.
Automatic staging run `35811338820` failed BEFORE deployment on the missing
staging verification secret; its production job was skipped. No deployment,
migration, secret change, rollout or rollback was performed.

See `docs/ai/recipe-catalog/T19_V2_TAKEOVER_AUDIT.md` for evidence and operator
steps. Provision the release prerequisites, certify production read-only, then
use the reviewed rollout workflow and prove rollback. T19 is NOT complete;
T20 remains blocked. Earlier pending/publication-blocked claims below are
historical and superseded by this receipt.

---


**Current: T19_V2_APPLICATION_INTEGRATED_CI_PENDING.**

## T19 V2 — recipe authority cutover (integration 2026-09-22)

Repository ID `1368281478` resolves to `vn-tako3/Frigo-dev`; current main is
`a3b1564`. The immutable original branch is published at expected head
`0a04209`, and application checkpoint `558be74` is integrated onto
`feat/t19-recipe-authority-cutover-v2-integration` from current main. PR #52 is
merged historical safe-stop documentation.

- [done] Focused authority/planner/release/shopping/cooking/inventory suite: 13
  files / 356 tests PASS; full Vitest 188 files / 4,333 tests PASS; D1 release
  certification 23/23 plus the 500-recipe/tip-0037/integrity fixture PASS; lint,
  typecheck, migration smoke, 500-recipe import check and build PASS.
- [done] Final safety review: static planner identity excludes hidden D1-only
  families/ingredients/diagnostics; evidence requires Bearer auth; production
  transition preflight is monotonic and auto-restores the exact prior Worker on
  failed deployment proof.
- [done] Two review passes fixed: same-source authority drift, incomplete
  rollback proof, missing Cloudflare/D1 identity + catalog/integrity
  certification, fabricated canary readiness, unfenced D1 families, shadow
  promotion without D1 proof, backwards SHAs, cancellation bypassing rollback,
  unverified staging. Full Vitest 189 files / 4,364 PASS on the current tree.
- [blocked] Integration publication: push rejected — GitHub App credential
  lacks `workflows` permission. Branch commits `8205883` + `553791a` + docs
  are preserved locally with workspace-only bundle/patch artifacts. Owner
  push with a capable credential unblocks; then the application PR and
  exact-head hosted CI/review.
- [pending] Normal merge, exact-main certification, production identity/catalog
  checks, release-secret provisioning, staged rollout and rollback proof.
- [untouched] Production: no D1 query/migration, secret/config mutation, deploy,
  rollout or rollback. T20 is blocked until `T19_COMPLETE`.

Canonical handoff: `docs/ai/recipe-catalog/T19_V2_WIP_HANDOFF.md`.

- Exact repository/base/production: `1368281478`, `vn-tako1/Frigo-dev`,
  `66627ffea890dad1cec4e31674449775a940c660`.
- Isolated branch `feat/t18e-otp-email-delivery-recovery` is pushed; Google
  Sign-In files and behavior are untouched.
- `SEND_EMAIL` and the operator-authorized `RESEND_API_KEY` secret are present;
  the supplied key authenticates. The operator completed DNS correction and
  Resend reports the domain plus all three sending records as verified. Current
  Cloudflare sender authority and primary failure category remain UNKNOWN.
- Provider recovery is hardened and tested: Workers Email -> Resend -> fail
  closed, sanitized categories/logs, production invalidation on every delivery
  failure, and honest readiness semantics.
- Focused 165/165 and full Vitest 185 files / 4238 tests PASS; lint, typecheck,
  migration smoke and build PASS. No migration, workflow or production change.
- Review-only PR #50 is OPEN; hosted validate `35685553412` passed on
  publication head `eec404a` and the PR was `MERGEABLE` / `CLEAN`. Require
  fresh exact-head CI after the final docs receipt; do not merge or deploy.
- Next: operator verifies the fixed sender in Cloudflare Email Service,
  supplies an authorized inbox, and runs
  controlled staging then separately authorized production delivery checks.
  Evidence: `docs/ai/T18E_OTP_DELIVERY_RECOVERY.md`.

**Previous: T18D_READY_FOR_REVIEW.**

- T18D implementation freeze: `d3ef61c`, from exact base `07ace57241f8270b2458610979c709bb69b9a65a`.
- Four original findings and **seven** additional scoped P2s fixed;
  independent review open P0/P1/P2 = **0/0/0**; two P3 observations deferred.
- 27-screen human-style review: **14 PASS / 13 PASS_WITH_NOTE / 0 FAIL**.
- Focused browser: **14/14 PASS in 42.8s**, strict axe clean. Final repository
  logs pass: **185 files / 4226 tests in 333.25s**.
- Settled full matrix: **349 PASS / 5 intentional skips / 0 FAIL**, 354 cases
  in 23.3m; all **84 T18D cases PASS**, strict axe violations **0** across 162
  canonical checks. Duplicate breakpoint project instances alone skipped.
  `.hoplite/artifacts/t18d/final/matrix-settled.log` and
  `.hoplite/artifacts/t18d/final/matrix-settled/`. The prior matrix stopped
  near case 158 on pre-settle scan-review opacity/receipt enable sampling;
  parent added a 350ms wait after async CTA enable, with no axe/token changes.
- Fresh style **39/0**, contrast **33/33**, lint/typecheck/diff checks PASS.
- Review-only [PR #49](https://github.com/vn-tako1/Frigo-dev/pull/49) OPEN;
  publication checkpoint `fe1b5d4` pushed; auto-fix enabled, auto-merge disabled.
- Next: hosted CI/review settlement. Initial `validate` IN_PROGRESS in run
  `35677663372` at 01:57 UTC; no unresolved threads then.
  No merge/deploy. VoiceOver/NVDA NOT PERFORMED.

## Historical T18C receipt

**Previous: T18C_READY_FOR_REVIEW**, application freeze `6f8f6f4`.

- [done] 27/27 source-backed direct comparisons at all six widths: **2 PASS /
  25 PASS_WITH_DOCUMENTED_DIFFERENCE**, zero unresolved P0/P1/P2.
- [done] Browser **379 PASS / 11 intentional skips / 390 unique cases**;
  162 canonical + 449 regression screenshot files, zero strict axe/overflow.
  Five outer-timeout cases recovered; prior failures retained, not hidden.
- [done] Final lint/typecheck/full Vitest (**184 files / 4222 tests**), migration
  smoke/build, style (**39/0**), contrast (**33/33**) and diff checks PASS on
  the final implementation. Protected business/backend boundaries unchanged.
- [done] Review-only [PR #48](https://github.com/vn-tako/Frigo-dev/pull/48)
  opened; CI/review auto-fix enabled, auto-merge disabled.
- [done] Hosted `validate` SUCCESS on `289d80a` (run `35578662531`); final
  readiness audit clear, no unresolved threads or new migration/configuration
  action. Style/contrast/diff rechecks PASS; no application changes.
- [pending] Owner merge permission after latest documentation-head CI stays
  green. Human VoiceOver/NVDA not performed; auto-merge disabled.
  No merge, deployment or T18D.

Exact commands, failure ledger, evidence and next action:
[certification](docs/ai/T18C_VISUAL_CERTIFICATION.md),
[handoff](docs/ai/HANDOFF.md),
[evidence index](.hoplite/artifacts/t18c/EVIDENCE.md).

## Historical continuation checkpoints (superseded)

Final combined browser run: **378 passed / 11 intentional skips / 1 failed**.
Home 1024px/200%-text overflow was a real P2; rem-based wrapping replaces the
fixed two-column breakpoint. Original zoom gate plus explicit stacking check:
**12/12 focused PASS**. Complete post-correction browser/repository reruns next;
the failed run stays separate as `pre-zoom/`. No readiness/PR claim yet.

**Repository gates PASS on application freeze `b024b0d`: 184 files / 4222
tests**, lint/typecheck/migrations/build/diff, style 39/0 and contrast 33/33.
Final browser matrix and post-fix visual review are running; review-only PR next.

Explicit native target bounds passed the unchanged strict accessibility gate
and focused keyboard/Week flow: 14 PASS / 1 intentional project skip.

Review correction: removed no-op non-recipe Week title actions; unit red/green
and flag-off route test pass. Independent re-review is clear. Fresh full gates
and 390 browser cases replace the intentionally interrupted 384-case attempt.

Keyboard closure checkpoint: native row/shell/Week actions and shopping
checked-state semantics verified by 37 focused unit tests and 12+1 browser
passes. Full gates and the unfiltered 384-case browser run are underway;
failure history remains in the handoff. No merge/deploy/T18D.

All 27 identities have now been compared directly. Localized source-led fixes
passed targeted browser gates (43 + 18 + 1 passes; five intentional project
skips) and typecheck. Full final certification is next; see the current
[handoff](docs/ai/HANDOFF.md) for diagnostic failures and preserved evidence.

## T18C — final redesign certification — SAFE PAUSE (2026-09-21)

**STATUS: `T18C_PAUSED_SAFE`** — implementation halted by owner instruction.
- Branch `feat/t18c-final-redesign-certification` from exact base
  `b8447e85f099b800a9a8ebc6c4c137adc9e45a32`; checkpoint A `ac4d90e` pushed
  (162-screenshot baseline). Approved OS boards unavailable:
  **DIRECT_BOARD_COMPARISON_PENDING**; 0/27 board comparisons.
- Evidence-led semantic fixes applied; final rerun pending. Resume:
  [T18C_WIP_HANDOFF.md](docs/ai/T18C_WIP_HANDOFF.md). No merge or deployment.

## T18B — payment authority unification — `T18B_READY_FOR_REVIEW` (2026-09-21)

- Final review P1 fixed from expected `0926222` on the same branch/PR: price
  table → new offers only; issued intent → immutable per-order authority;
  signed callback → persisted-order match; entitlement → valid persisted paid
  intent only. Operational 49000/499000 prices and all checkout fences retained.
  Focused **151/151** (65 server payment), full **183 files / 4217 PASS**, browser
  **48/48**, lint/typecheck/migration smoke/build/diff checks PASS. Exact commands,
  failures/recovery and new-head CI boundary are in the report. No migration,
  auth, inventory, OCR/planner or workflow change in this final fix.
- Repository `1368281478` / `omin-jp/Frigo-dev`; exact base/main
  `13ff3f22082fc0601a81b90c96edded4741194ac`; branch
  `feat/t18b-payment-authority`; review-only PR #47 OPEN, auto-fix enabled and
  auto-merge disabled. No merge/deploy performed.
- Server-owned prices retained: monthly 49000 / annual 499000 VND; plan-only
  checkout, signed provider/QR contract, owned status and once-per-intent grants.
  Legacy secret grants retired; fresh same-owner `/me` confirms Plus.
- Pushed checkpoints `2aba91a`, `c00ea9f`, `1cef30b`, `1aabd32`; focused tests
  121/121, browser 48/48 plus error-state rerun 4/4, lint/typecheck/migration smoke/
  build PASS. First full run's single style failure was corrected in source;
  regression 38/38 and complete rerun **183 files / 4185 tests PASS**.
- Independent review: remaining P0/P1/P2/P3 all 0. Migrations 38/0 changes;
  T18A OTP, Inventory Truth, OCR/AI, recipe/planner/Week and Cloudflare infrastructure
  unchanged. No real payment. Live provider setup requires separate authorization.
- Readiness follow-up: CI `35554499704` passed at `2d6ff5a`; no review threads.
  Corrected deployed image CSP for VietQR and removed the obsolete payment-secret
  warning, without changing Wrangler bindings/workflows. Regression red/green,
  focused 104/104, browser 48/48 with production image policy, lint/typecheck/
  migration smoke/build/header parity/full-diff check PASS. New-head CI is
  verified separately on the PR before readiness; see the report for exact commands.
- Next: owner review/merge permission once final-head CI is green; no local blocker.
  [Exact authority maps, contract, commands and failures](docs/ai/T18B_PAYMENT_AUTHORITY_REPORT.md).

## T18A — auth resend expiry contract — `T18A_READY_FOR_REVIEW` (2026-09-21)

- Repository ID `1368281478` now resolves to `omin-jp/Frigo-dev`; base/main
  `51d0d3755d83b64185066228d98f44ab7bad5e3c` unchanged. New branch
  `feat/t18a-auth-resend-expiry-contract`, review-only PR #46 OPEN; auto-fix
  CI/review subscription enabled. Not merged or deployed.
- Pushed server `88096cb7fbea8e3b95f5627ff5a46e8c3d34b462`, client
  `47c3a3391e086caf2760b61ee4e2bfacd331cacf`, security-fixture
  `53f9fefdc9d935bb736a37cdcd9f5b0d0479685e` checkpoints.
- Resend now returns storage-authoritative `expiresInMinutes`; client no
  longer guesses. Reset policy remains generic; malformed/delivery/offline
  failures remain honest; security/T17B lifecycle invariants preserved.
- Final auth/security 300/300, full Vitest 180 files/4117 tests and six-viewport
  browser auth 42/42 PASS; lint/typecheck/migration smoke/build/diff checks PASS.
  Chromium dependency repaired; initial full-suite timeout recovered with a
  passing extended full run (two workers, no filters).
- Payment/billing/production/migration behavior unchanged. Next: final-head
  hosted CI and human review, never merge/deploy from this task. No local blockers.
  Exact commands, failures, SHA receipts and Worker diff explanation:
  [T18A report](docs/ai/T18A_AUTH_RESEND_EXPIRY_REPORT.md).

## Current — T17B contract reconciliation `T17B_COMPLETE` (2026-09-20)

- Branch `feat/t17b-contract-reconciliation`, exact base `858759f`, application
  HEAD `0f358f2`, certification checkpoint `00594eb`. Corrective checkpoints
  `8b0f050`, `9a94afb`, and `0f358f2` preserve all server-owned preference and
  verification state; `00594eb` measures registry layout after finite motion.
- Route-driven onboarding 04–06 exposes exactly seven cuisine and nine
  restriction choices (both include canonical `other`) while round-tripping
  authoritative values outside those chips, including `italian` and
  `vegetarian`. Authenticated completion waits for server confirmation; the
  preserved offline-guest path intentionally commits locally. Verification
  exit resets loading; server OTP/session authority and independent spicy-level
  truth remain intact.
- The current 27-screen registry uses reviewer-verified contracts. Focused auth
  is 102/102, verify/onboarding is 39/39, full Vitest is 180 files/4087, T13 is
  60/60, automated accessibility is 12/12 across six viewports, and the clean
  T17 matrix is 216 pass/6 intentional skips.
- Post-review fix `56fc01b`: screen 06 is a native `today`/`week`/`both` goal
  group (client-only, never sent to `/preferences`; `week` → `/week/setup`) and
  stored household size `6..20` round-trips unchanged. Reran: focused 87/87,
  Vitest 180 files/4094, registry 18/18, full T17 216/6/0, lint/typecheck/
  migrations/build/diff-check PASS.
- Residuals are 43/43 protected-payment allowlisted with 0 unjustified;
  contrast is 33/33. Worker/payment/migration diffs are zero.
- Visual source: `.hoplite/artifacts/t17-playwright/final-00594eb-clean/`;
  validated package: `.hoplite/artifacts/t17b-final-visuals-00594eb.zip`
  (232 entries, 180 PNGs; SHA-256 `d6f6d4f032c0ac637ce5d1523ecc95b1411bc567538bca8d235a7131e6ad9d70`).
- Corrective documentation checks pass: whitespace, required markers,
  protected-boundary zero diffs, ZIP integrity, and all 180 JSON/TSV screenshot
  records and hashes. The first ad hoc validator expected the wrong command
  field; the corrected `generatingCommand` check found no artifact defect.
- Managed Preview was recovered from an inferred `pnpm dev` path that lacked the
  isolated API to `node scripts/security-preview.mjs`; tracked settings were
  restored unchanged. Exact remote checkpoint `f901b02` passed supported
  synthetic reset/login and screens 04–06 at 390x844 with no page errors.
- Replacement PR #45 opened against exact main `858759f` from `f901b02`; its
  auto-fix CI/review loop is enabled and PR #44 remains untouched. At publication
  head `1cacd0b`, hosted validate run `35532565549` passed, GitHub reported
  `MERGEABLE / CLEAN`, and reviews, review comments, conversation comments, and
  unresolved human feedback were empty. The final merge-readiness pass reran
  focused auth/onboarding/session tests 74/74, changed-file ESLint, typecheck,
  artifact integrity, protected-boundary checks, and whitespace checks.
- No T17B merge or staging/production deploy occurred. Once the
  documentation-only readiness checkpoint retains green/CLEAN exact-head
  provider status, the authorized user may decide whether to merge PR #45.
  Direct board comparison
  and NVDA/VoiceOver remain pending with no named assignee or tracking issue;
  `HUMAN_SCREEN_READER = NOT_EXECUTED`.
- `PRE-EXISTING PROTECTED AUTH-CONTRACT BLOCKER`: registration reports a
  10-minute lifetime, but resend returns no fresh expiry metadata. A server/API
  owner must resolve that separately; the client honestly records unknown.
- `PRE-EXISTING PROTECTED PAYMENT-AUTHORITY BLOCKER`: frontend/QR prices remain
  `599000`/`79000`, while payment-intent authority remains `499000`/`49000`;
  the VietQR amount comes from a frontend prop instead of the server intent.
  This requires a separate owner-authorized payment follow-up; T17B made no fix.

## Previous T17 — Takosan UI V2 certification pass, `T17_PARTIAL` (2026-09-19)

- [done] `/auth/verify` real route over the existing OTP state machine; tab-scoped code-free context; honest empty state; 14 regression tests.
- [done] 27 registered screens certified per width (`t17-registry.e2e.ts`).
- [done] Semantic-token migration: 991 sites; residual audit 43/43 allowlisted (payment UI only), 0 unjustified; zero emerald/transition-all/animate-in; arbitrary hex removed.
- [done] WCAG-AA: contrast 33/33 measured; axe 0 serious/critical on 25 surfaces; zoom re-enabled; h1/alt/44px/dialog semantics/OTP announcements verified.
- [done] Reduced-motion certification on auth, onboarding, sheet/dialog, cooking, planner, scan review.
- [done] Canonical `scan-review` + 8 more surfaces captured; state matrix evidenced; visual review fixes applied.
- [done] Gates at final HEAD recorded in `docs/ai/T17_UI_V2_REPORT.md` (lint, typecheck, vitest, migration smoke, build, T13 suite, six-width T17 matrix, greps, worker diff 0).
- [limit] Kit ZIP absent in sandbox: boards/`screens/*.md`/`SCREEN_REGISTRY` comparison outstanding; registry reconstructed in `tests/e2e/t17-ui/screen-registry.ts` with per-row source tags.
- [next] Holder of the ZIP: compare preserved captures against the three boards, diff `screen-registry.ts` vs `SCREEN_REGISTRY`; run a screen-reader walkthrough; then flip to `T17_COMPLETE`.
- [safety] `main` untouched; no merge; no deploy; production untouched; PayOS/worker zero-change.

## Current T16 — PWA cache and Google recovery deployed (2026-09-19)

- [done] Root cause: live `/auth` + `/sw.js` cache hits, wrong `_headers` worker path, fixed `takosan-pwa-v2` cache; clean Chromium proves real Google GIS works.
- [done] Release-SHA worker/cache, best-effort stale-client navigation after claim, correct no-store/immutable headers, Google numeric width + retry recovery, and exact-SHA deploy smoke implemented.
- [done] Independent review remediated; local Wrangler effective headers and two-release Chromium update PASS.
- [done] Full gates: **178 files / 4046 tests**, lint, typecheck, migration smoke, build, shell syntax, diff check.
- [limit] Reload/reopen/navigation is the reliable recovery boundary for legacy tabs that are closed, suspended, or blocked from running Service Worker code.
- [done] PR #42 / exact-head CI `35415335137`; merge main `6a016f1...`; exact-main CI `35415536459`; staging `35415763483`.
- [done] Production Deploy `35415843682`, Worker `2f228dc9-d97b-4eb1-8cff-9a0f2df3b51c`, D1 38/0038, recipe `shadow/0/false`.
- [done] Live exact-SHA readiness, no-store shell/worker, immutable assets, Google popup and exact-SHA Service Worker/cache verified.
- [next] Capture one manual real-inbox OTP receipt without exposing the code.

## Current T15C-D — production 1% Canary certification — safe stop (2026-09-19)

- [done] Canonical repo/main verified: `1368281478`, `frigo-6/Frigo-dev`, `347b536950cf54d25a2d6a880c3c2cb3d8c8f329`; PR #38/#39 merged.
- [done] Exact-main CI `35409762462` and staging Deploy `35409964105` passed; staging `static/0/false`, production skipped.
- [done] Full local baseline passed: seed/import, typecheck, lint, migration smoke through 0038, build, **178 files / 4044 tests**, diff check.
- [done] Production read-only public audit remains `shadow/0/false`, Worker `6c336889-680d-4cc3-b03b-1007849aa738`, 71 deterministic recipes, D1-only samples hidden.
- [blocked] No authorized operator-owned INCLUDE/EXCLUDE household pair was supplied; local Wrangler is unauthenticated. No customer enumeration and no production mutation.
- [status] `T15C_D_BLOCKED_AUTHORIZED_TEST_HOUSEHOLDS_UNAVAILABLE`; receipt `docs/ai/recipe-catalog/T15C_D_PRODUCTION_1PCT_CANARY_CERTIFICATION.md`.
- [done] PR #40 merged receipt commit `16958c6...` as `763d7e9...`; exact-main CI `35411093064` and staging Deploy `35411300235` passed (`static/0/false`, production skipped).
- [next] Privately provide both operator-owned household IDs and authenticated Cloudflare operator access; re-run direct D1 certification, provision only hashed cohort secrets, certify 1%, then rollback to `shadow/0/false`. Stop before 2%, 5%, full D1, media, or T14G.

## Current T15C-C — authorized canary test cohort mechanism (dormant) — 2026-09-19

- [done] `packages/recipes/src/recipe-canary-cohort.ts` + `src/worker/services/recipe-authority.ts`: server-side override for operator-owned test households — `RECIPE_CATALOG_TEST_COHORT_ENABLED` / `RECIPE_CATALOG_TEST_INCLUDE` / `RECIPE_CATALOG_TEST_EXCLUDE` (Worker secrets; SHA-256 digests of `recipe-catalog-test-cohort:<householdId>`, never raw IDs). Precedence exclude > include > deterministic FNV bucket; disabled by default; canary+cutover only; zero effect in static/shadow/d1 or without a tenant; every malformed/half-applied shape fails closed in canary mode (`CONFIG_RECIPE_CATALOG_TEST_COHORT` fatal; static + loud diagnostic at request time). **R1 remediation:** cohort variables are inert in static/shadow/d1 (rollback = single mode change, no secret cleanup — P1 resolved) and an active cohort requires BOTH an include and an exclude household (`TEST_COHORT_PAIR_REQUIRED` — P2 resolved). Request input cannot reach it. `fnv1a32`/`recipeCanaryBucket`/thresholds unchanged.
- [done] Tests: 25 unit + 4 HTTP (request-control attempts, guest, static/shadow) + workflow/wrangler/manifest guardrail; no migration, no workflow change.
- [status] `T15C_AUTHORIZED_TEST_COHORT_READY` — NOT `T15C_CANARY_COMPLETE`. Production still `shadow / 0 / false`; no deploy/config/D1/R2 change. Receipt: `docs/ai/recipe-catalog/T15C_AUTHORIZED_TEST_COHORT.md`. Previous safe stops (T15C-B, `T15C_PRODUCTION_CANARY_SAFE_STOP.md`) remain valid history.
- [next] Operator supplies the two authorized households → digests as production secrets → T15C-B 1% canary through the protected workflow (separate authorization).
## Current T15C — production Canary safe stop (authorized cohort unavailable) — 2026-09-18

- [done] Fresh audit on canonical main `b41aa4682481447795350fc1a9eeb1e80887bd0e` (resolved by repository ID 1368281478): seed/import/typecheck/lint/check:migrations(0038)/build PASS; full `pnpm test` 176 files / 4008 tests PASS.
- [done] Read-only public production audit: readiness commit == main `b41aa468…`, database ok, 5/5 catalog reads = 71 deterministic, legacy IDs 200, D1-only IDs 404. Latest production Deploy receipt 35404106102 = `shadow / 0 / false` on that exact SHA (helper convergence 2 attempts).
- [stop] No operator-owned inside-1%/outside-1% production test cohort and no Cloudflare credentials in this environment; no customer IDs inspected; no dispatch/approval/D1/R2/config change. Classification `T15C_CANARY_BLOCKED_AUTHORIZED_COHORT_UNAVAILABLE`. Receipt: `docs/ai/recipe-catalog/T15C_PRODUCTION_CANARY_SAFE_STOP.md`.
- [next] Operator provides both authorized cohorts + read-only CF credentials + Environment reviewer; resume at exactly 1% via the protected `deploy.yml`; no widening beyond the 1→2→5 ladder, no `d1`, no media/R2, no T14G.

## Current T15B-SHADOW — production Shadow certified; stop before canary — 2026-09-18

- [done] PR #30 merged as `88e8b54de121125866b2ff813e56e33277decf1c`; exact-main CI `35336548833` and automatic staging Deploy `35336830786` succeeded. Staging stayed STATIC71 on Worker `580acb76-a006-4c0a-b991-618ebde07e88`.
- [done] Production Shadow Deploy `35337110268` succeeded after the required Environment approval: Worker `c6fa2ce8-f35b-4485-ad38-09dbc19738d1`, exact SHA, convergence 1 attempt / 574 ms.
- [done] Independent live checks: 5/5 catalog reads returned 71, legacy IDs returned 200, five D1-only IDs returned 404; Shadow tail showed D1 500/500 hydrated, release READY, zero drift/errors, no authority leak.
- [done] D1 stayed tip 0037 / ledger 37 / release `rel-bd00a4f53fcaeee4`; no migration or other D1 write. Receipt: `docs/ai/recipe-catalog/T15B_SHADOW_CERTIFICATION.md`.
- [stop] `T15B_SHADOW_COMPLETE`; no canary, full D1, cutover, media/R2, T14G, Inventory Truth/T09/T11, PayOS/auth, or stale PR #29 merge.

## Previous T15B-PRE checkpoint — STATIC certified; SHADOW wiring PR ready — superseded 2026-09-18

- [done] Canonical repository `1368281478` / `frigo-6/Frigo-dev`, main `0fe2cf071693208f6c642d8cbd994f5a79b5a2cf`; PR #29 remained open and unmerged.
- [done] Immutable production D1 receipt `35329772751`: tip 0037, 500 recipes, release `rel-bd00a4f53fcaeee4`, schema gate PASS, FK `[]`, quick check `ok`, 500 pending media rows / 0 ready.
- [done] Static Deploy `35333517052` approved and SUCCESS: Worker `ab8ff038-2aaa-468b-a9de-8c5d94f14052`, exact SHA convergence PASS, five repeated live checks served 71 static recipes.
- [done] Rollback evidence: previous Worker `56979cb5-e1a8-4241-8a4c-2432d41cc439`; rollback mode `RECIPE_CATALOG_MODE=static`.
- [ready for review] PR #30 (`codex/t15b-shadow-wiring`) adds only validated `static|shadow` workflow plumbing and tests; implementation head `97aff50d…` exact CI `35335079345` SUCCESS. Final docs head must also have exact-head CI SUCCESS. Do not merge or activate in this task.
- [not started] Shadow activation/certification, canary, full D1, media/R2, T14G; Inventory Truth/T09/T11 unchanged.

## Current T15A — pre-production rollout hardening COMPLETE (production rollout not started) — 2026-09-18

- [done] PR #26 merged (`70cf7e0d…`): schema gate derived from `migrations/`, pinned migration chain, `catalog` certification command.
- [done, PR #27 / T15A-R2, pushed] `wait-for-deployed-release.mjs` bounded exact-SHA convergence helper; `readiness.commit` must be a canonical 40-hex SHA (malformed/missing → fail closed, only a different *valid* SHA retries; regression tests A–J).
- [done, PR #27 merged → main `0fe2cf07…`] Workflow wiring (`catalog` step in `production-d1-migrate.yml` after `verify`/before the schema gate, input interpolation removed, staging+production deploy proof via the helper) and unconditional guardrail tests are committed on the PR branch (`366dbd1`, `776422f`; identical to `t15a-r/workflows.patch` / `r2-wired-series.mbox`, retained as audit evidence). Focused 123/0 skipped; hosted exact-head CI SUCCESS. Merged by maintainer (merge commit); exact-main push CI 35329100767 SUCCESS; automatic Deploy 35329500028: release+staging SUCCESS, staging exact-SHA convergence via the helper (attempt 1, 547 ms), production SKIPPED. Classification `T15A_PRE_PRODUCTION_HARDENING_COMPLETE`.
- [next] T15A Phase B (live production re-query → migrate 0035–0037 via `production-d1-migrate.yml` → static deploy → shadow) only with credentials + operator approval; historical last verified production tip = 0034 (must be re-queried live first). No canary/d1/media/T14G. P3_FUTURE_MEDIA_GATE_COMPATIBILITY: `catalog` requires `media_ready=0`; revisit before any migration after media population.
- [next] T15A Phase B (live production re-query → migrate 0035–0037 via workflow → static deploy → shadow) only with credentials + operator approval; historical last verified production tip = 0034 (must be re-queried live first). No canary/d1/media/T14G. P3_FUTURE_MEDIA_GATE_COMPATIBILITY: `catalog` requires `media_ready=0`; revisit before any migration after media population.

## Historical T14F — T14F_DEVELOPMENT_COMPLETE (T14F-A/B/C certified; production untouched) — 2026-09-17

- T14F-C completed and committed (on top of authorized base `7d667523…`): 0037 promoted byte-identical (`68e52e6d…`), shipped manifest regenerated to 500/2 batches (`rel-bd00a4f53fcaeee4`, `fa47d31f…`), replay (fresh 0001→0037, 0036→0037, 0034→…→0037) PASS, D1 readiness READY 500, static/shadow/canary/full-D1 PASS, user flows incl. Batch B cuisines PASS. Development certificate: `docs/ai/recipe-catalog/T14F_C_500_CATALOG_CERTIFICATION.md`.
- **T14F-C CLOSED**: safe stop `44c0ad38…` resolved. Full closure gates PASS — lint, build, full `pnpm test` **171 files / 3913 tests**, typecheck, migration smoke through 0037, seed/import checks (500/2), diff check. One real blocker fixed forward-only in `8c6080aa…` (tests only): the five real-D1 suites overflowed workerd 1.20250718's 1 MiB statement cache when replaying 0001→0037 in one process (cloudflare/workerd#5977); `tests/helpers/local-d1-worker.mjs` recycles workerd before that. No migration/catalog/runtime change. Second blocker (docs heads): hosted Vitest passed 171/3913 but exited 1 on a vitest-worker `onTaskUpdate` RPC timeout — fixed forward-only via `tests/helpers/vitest-event-loop-yield.ts` (setupFiles; test config only).
- Final head + hosted exact-head validate SUCCESS bound in the PR #25 final certification receipt. Classification: `T14F_DEVELOPMENT_COMPLETE` · `T14F_REAL_CATALOG_500_COMPLETE` · `T14F_500_AUTHORITY_CERTIFIED` · `PRODUCTION_ROLLOUT_DEFERRED` · `MEDIA_POPULATION_DEFERRED` · `T14G_NOT_STARTED`; P3 = 1 (~780 KB unpaginated `/recipes`, T14G).
- PR #25 **ready for review, unmerged**. Production does **not** contain 500 recipes. Merge, production rollout, media population and T14G each need separate authorization.

## Historical T14F — T14F_B_SCALE_BATCH_CERTIFIED — 2026-09-17

- T14F-A pilot certified (`b0150d0…`). T14F-B scale batch completed: **399/399 records** (`t14f-scale-399-v1`) validated publishable, 0 hard duplicates, 0 unresolved ingredients; QA `ok` 0 findings; double compile byte-identical; candidate-500 composition proven (500 unique, order verified).
- Shipped release was 101 (`rel-193ac2b16c64a260`) at the time; approved-batches/current manifest unchanged then; 0036 SHA-256 unchanged; 0037 not yet created; no production action.
- Full gates PASS (171 files / 3911 tests, 2026-09-17). Certified head in PR #25 receipt / `T14F_B_SCALE_BATCH_CERTIFICATION.md`.
- Next: T14F-C only with separate authorization (0037 + 500 manifest). PR #25 stays draft/unmerged.

- Repository ID 1368281478; unchanged main; forward-only `hoplite/massalia-c2862d7c`;
  PR #25 draft/unmerged. Inherited routing fix `8079a37`, verification commit `2ee6f5cc…`.
- Original 5/7 failure independently reproduced: strict 71/101 COUNT_DRIFT is correct.
  Generated test-local 71 release now proves real D1/canary, null fallback, `[5]`/`[]` cache,
  invalid-drift rejection and cleanup; no runtime, pilot, manifest or migration change.
- Routing 8/8, growth 21/21, combined 29/29 twice, non-isolated 29/29, subsystem 383/383 PASS.
  Executed seed/import/typecheck/lint/migration smoke/build/test/diff: all PASS;
  full suite **171 files / 3911 tests**. Exact implementation CI **35223589293 / 105209475052 SUCCESS**.
- Final documentation SHA + hosted CI SUCCESS are bound in the [certification receipt](https://github.com/frigo-4/Frigo-dev/pull/25#issuecomment-5714709031).
  That final certified SHA, not the implementation commit, is the only valid future T14F-B base.
- Pilot 30 + legacy 71 = 101, complete 101/order 0..100, five statements/no N+1;
  replay, authority modes, imported HTTP flows and Inventory Truth regressions PASS.
- **STOP.** Await separately authorized T14F-B. No ingredient scale preflight, Batch B, 0037,
  500 manifest, production/media/T14G action or merge. Overall T14F is not complete.
- Exact commands/hashes: `docs/ai/recipe-catalog/T14F_NEXT_HANDOFF.md`. Local-only settings preserved.

## Historical T14F — WIP SAFE STOP — 2026-09-17 (superseded by takeover above)

- Pilot batch `t14f-pilot-30-v1`: 30 original recipes authored + reviewed + compiled via T14E (30/30
  publishable, 0 duplicates, 0 unresolved ingredients); `0036_recipe_catalog_pilot.sql` promoted
  byte-identical; manifest `rel-193ac2b16c64a260` 101 recipes / 1 batch; `ALL_RECIPES` still 71.
- Checks: typecheck, `check:migrations`, seed check, import check, diff check PASS; focused growth
  suites 20/21 — `production forward path 0034 → 0035 → growth` fails when both growth suites run
  together, passes alone (root cause unknown). Lint/build/full tests/bundle NOT run. Batch B not started.
- Full state and exact next steps: `docs/ai/recipe-catalog/T14F_WIP_HANDOFF.md`.

## T14E — BULK RECIPE IMPORT FACTORY — 2026-09-17 (MERGED main f7a55408…; main certified; NOT deployed; T14F not started)

- PR #23 merged (normal merge, remediated head `ba1a45d4…`); main CI green; 169/3889; app tree preserved. Release still
  `rel-1a047444a3632771` 71/0; 35 migrations / no 0036; no real recipes. Production still `4ed98514…` / 0034 / static.
  Receipt `docs/ai/recipe-catalog/T14E_MERGE_RECEIPT.md`; T14F only from `T14E_FINAL_CANONICAL_MAIN` per `T14E_NEXT_HANDOFF.md`.

## T14E — REMEDIATION — 2026-09-17 (review P1/P2/P3 closed; PR #23 ready for re-review, unmerged)

- Nutrition evidence preserved end-to-end (ADR-004 `nutrition_profiles` persistence), immutable batch hash covers all reviewed
  metadata, manifest failure telemetry corrected. No 0036, no real recipes, no production action.

## T14E — BULK RECIPE IMPORT FACTORY — 2026-09-17 (development complete on feature branch; PR unmerged)

- Import factory (`packages/recipes/src/import/`), CLI, 71-recipe Catalog Release Manifest, manifest-driven D1 readiness
  (ALL_RECIPES stays the 71 rollback baseline). No 0036, no real recipes, no production action, T14F not started.
  Docs: `docs/ai/recipe-catalog/T14E_BULK_RECIPE_IMPORT_FACTORY.md`, ADR-027, `T14E_NEXT_HANDOFF.md`.

## T14C/T14D OPS — PRODUCTION D1 MIGRATION WORKFLOW — 2026-09-17 (MERGED main 6910a7b4…; awaiting operator dispatch)

- PR #21 merged; main CI green; app tree unchanged. Production still `4ed98514…` / 0034 / static. Operator dispatch inputs in
  `docs/ai/recipe-catalog/T14CD_PRODUCTION_ROLLOUT_HANDOFF.md`. Schema gate fixed to D1's 5-term compound-SELECT limit.

## T14D — RECIPE AUTHORITY CUTOVER — 2026-09-16 (MERGED main bb504cce…; main certified; NOT deployed)

- PR #19 merged; main CI green; 163/3801. Production still `4ed98514…` / 0034 / static — OPS sequence in
  `docs/ai/recipe-catalog/T14D_NEXT_HANDOFF.md`.

## T14D — RECIPE AUTHORITY CUTOVER — 2026-09-16 (development receipt)

- Authority router static|shadow|canary|d1 (fenced), verified D1 snapshot, deterministic canary, config-only rollback;
  no migration. Production still static / 0034. Docs: `docs/ai/recipe-catalog/T14D_RECIPE_AUTHORITY_CUTOVER.md`, ADR-026.

## T14C — RECIPE MEDIA LAYER — 2026-09-16 (MERGED main 3a1e6be6…; production 0035/deploy pending operator)

- PR #17 merged; main CI green; staging auto-deploy green. Production D1 still 0034, Worker still 4ed98514… —
  operator runbook: `docs/ai/recipe-catalog/T14C_MERGE_RECEIPT.md`.

## T14C — RECIPE MEDIA LAYER — 2026-09-16 (development receipt)

- 0035 `recipe_media` + catalog/resolver/route/frontend fallback; 0034 pinned; gates green locally.
- Review remediation: promotion verifies the R2 object (MIME/size/SHA-256) before ready; SQL enforces exact storage key.
- Production still 0034; media population and T14D/T14E deferred. Docs: `docs/ai/recipe-catalog/T14C_RECIPE_MEDIA_LAYER.md`.

## T14B-B — COMPLETE 2026-09-16 (D1 0034 in production; Worker `56979cb5-…` = main `4ed98514…`)

- Ledger 33→34 after backup; catalog certified; schema gate PASS; Deploy 35101845374 (staging) and
  35102115354 (production) SUCCESS; smoke green. Details: `docs/ai/recipe-catalog/T14B_B_FINAL_COMPLETION.md`.
- T14C ready to start (`docs/ai/recipe-catalog/T14C_HANDOFF.md`, branch `feat/t14c-recipe-media-layer`).

## T14B-B — MERGED TO MAIN 2026-09-16; PRODUCTION ROLLOUT BLOCKED (OPS SECRET) — historical

- PR #14 merged as `c7455160`; main CI green; fresh main gates green (157 files / 3704 tests).
- Blocked on OPS: production D1 0034 apply + Cloudflare deploy secrets (`CLOUDFLARE_API_TOKEN` missing
  in GitHub staging env; Deploy run 35073197948 failed there). Production app unchanged.
- T14C not started. Receipt: `docs/ai/recipe-catalog/T14B_B_MERGE_RECEIPT.md`.

## T14B-B — MERGED TO MAIN 2026-09-16; PRODUCTION ROLLOUT BLOCKED (OPS SECRET)

## T14B-B — D1 CATALOG PARITY & SHADOW FOUNDATION — 2026-09-16 (merged; details)

- Migration `0034_global_recipe_catalog_parity.sql`: 12 global recipes persisted, D1 = 71
  complete, `recipe_runtime_fields` (persisted `runtime_order`, typed open `category`, closed
  `region`, legacy nutrition) + `recipe_runtime_ingredient_order` added; `0001–0033` unchanged
  (fixed hash manifest).
- D1 → `RuntimeRecipe` hydration is lossless and order-preserving for all 71; recommendation,
  tie-sensitive ranking, planner (incl. tie fixture), >5-alternative swap and cooking parity
  proved on the actual D1 catalog output. **`ALL_RECIPES` remains production authority**; shadow
  mode is opt-in and production-rejected. Media → T14C; cutover → T14D; bulk import → T14E.
- Gates: lint, typecheck, build, `migration-smoke=ok`, seed check, full Vitest (totals in
  `docs/ai/recipe-catalog/T14B_B_REMEDIATION_HANDOFF.md` §10); PR #14 not merged.
- Details: `docs/ai/recipe-catalog/T14B_B_D1_PARITY_SHADOW.md`, ADR-024.

## Auth/OCR production hardening — 2026-09-16

- [done] Remove the credential-less Google production fallback.
- [done] Harden async GIS initialization and retry/unavailable UX.
- [done] Add staged OCR pending UI to upload and review screens.
- [done] Focused `54/54`, full Vitest `3632/3632`, lint, typecheck,
  migration smoke, build and diff check pass.
- [next] Browser smoke, hosted CI and maintainer review; no deployment yet.

## 2026-09-16 auth popup follow-up

- [done] Fix COOP precedence that broke Google GIS popup opener handshake.
- [done] Preserve strict `same-origin` on API responses.
- [done] Add SPA/API regression test; focused `17/17`, lint and typecheck pass.
- [done] Publish PR #9 and deploy Worker version
  `20bc1f35-6ffe-4085-ba79-d54a0b53da71`.
- [done] Production smoke, readiness and live SPA/API COOP checks pass; no
  migration or production data resource was mutated.

## CURRENT — T14 integration refresh, 2026-09-15 UTC

- `vn-clo/Frigo-dev` (ID `1368281478`), verified main before this docs-only receipt
  `a165474a623a8130c9a9ed4f1df096b3ac3b3ae9`; final tip is in its PR post-merge comment.
- PR #9 Auth/OCR production lineage `911db7f`; Worker version
  `20bc1f35-6ffe-4085-ba79-d54a0b53da71`; PR #10 rollout receipt preserved.
- T14A merged via PR #11 after exact-head CI `35034318031` passed. Accepted
  T14B-A merged via PR #12 after exact-head CI `35035112092` and all fresh local
  gates passed (154 files / 3676 tests). T14B-B NOT STARTED; prerequisites ready.
  Static authority 71/59/12,
  migrations 0001–0033 unchanged; media deferred to T14C.
- Main CI passed; Deploy staging missing-token blocker is separate OPS work.
- PR #4: CLOSE_ARCHIVE recommended, not merged or deleted.
- Exact evidence and next action: `docs/ai/recipe-catalog/T14_INTEGRATION_REFRESH.md`.

# Historical boards — superseded by the current refresh above

## CANONICAL REPOSITORY CONSOLIDATION COMPLETE — 2026-09-15

- `vn-dlo/Frigo-dev` (ID `1368281478`) is now the canonical long-term
  repository. PR #2 merged reviewed head `7ede92c` into `main` as merge commit
  `a5cfb14cfd5840be23eb16b26a3689f5e2d6e805`.
- Merge tree equals the reviewed tree; application freeze `5f6853d`, production
  `05423f2`, Qwen `da41686`, T13 `32ddbb4`, and Takosan `ff63edf` remain
  ancestors of canonical main.
- PR CI `34972891435` and post-merge CI `34973522150` passed. Strict `validate`,
  force-push/deletion blocks, and admin enforcement remain active.
- No staging or production deployment occurred. Production migration/D1/KV/R2/
  queue/PayOS/DNS/T14 work remains blocked and out of scope.

## T13R CERTIFIED — 2026-09-14

- **T13 REMEDIATION CERTIFIED — READY FOR INDEPENDENT FINAL REVIEW #2.**
  `T13R_APPLICATION_FREEZE=32ddbb4f2bb636fdcf201e9ca99c4689d3655477` on
  `hoplite/delos-f0bb1d04` (repo ID 1368281478; main `d1b06732…` unchanged).
- Pre-freeze and clean-detached gates: full Vitest 3471/138, focused T13R-A 45/5,
  T13R-B 171/7, real local D1 92/5, browser 60/60 (360/390/430), 32 migrations
  (0031/0032 unchanged, 0033 absent), fresh + legacy real D1 replay, schema gate,
  writer/reader UNKNOWN 0/0, diff-check, detached porcelain EMPTY. No hosted CI for
  the exact freeze. P0/P1/blocking P2 = 0/0/0; AC1–AC14 PASS; roadmap rows DONE.
- Next and only step: INDEPENDENT T13 FINAL REVIEW #2. See
  `docs/ai/inventory-truth/t13/T13R_FINAL_CERTIFICATION.md`.

## SAFE STOP — T13R-B — 2026-09-13T21:35Z

- P2-1 FIXED (commit `4d587eb`), P2-4/P2-5/P2-6 FIXED in WIP `7e68e3b`
  (unit + integration + 12/12 t13r-b-presentation browser cases GREEN at
  360/390/430; full Playwright suite 51 passed; typecheck PASS).
- Certification (full Vitest, build, migrations, D1, authority audit,
  freeze) NOT started. Next: resume certification per
  `docs/ai/inventory-truth/t13/T13R_B_REMEDIATION.md`.
## Production rollout receipt — 2026-09-15

- Production D1 `frigo-db`: migrations `0001`-`0033`, remote schema gate PASS.
- Deployed compatibility SHA `64ee9ed1`; deployed canonical SHA
  `e6b91956484589c088e6d04a9835b3e59a2eb786`.
- Readiness exact-SHA PASS; DB/queue/AI/config healthy, PLUS-grant warning only.
- Full Vitest `3630/3630`, lint/typecheck/build and frozen install PASS.
- Follow-up blocked on hosted CI/review for open PR #4; no protection bypass.
## T18C continuation checkpoint — 2026-09-21

**T18C_PARTIAL** — resumed existing branch at `2e770f8`, exact base `b8447e85`,
repository `1368281478` / `vn-tako/Frigo-dev`; upstream corrected. Fresh
pause-tree matrix **6 passed / 162 screenshots / 162 axe audits / zero
violations and overflow**. Approved source ZIP is now available and direct
comparison is underway: [provenance](docs/ai/T18C_SOURCE_PROVENANCE.md).
Final source-led fixes, regressions, full gates and PR remain pending.
Original baseline and workspace settings preserved; no merge/deploy/T18D.
