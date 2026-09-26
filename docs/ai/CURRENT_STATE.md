# Current state — Runtime Ingredient Model V2 review candidate

**2026-09-27: staging 0039 certification blocked before remote identity; offline
runtime-model work continues from certified main.** PR #11 merged as exact
`main` `8687ff9f3e8f6b6cbf466ee61968bb5f3469498c`; hosted CI run
`36269257668` succeeded with 204 files / 4,597 tests, lint, typecheck,
migration smoke and build. The reviewed staging-only workflow run
`36269963768` / job `108481914553` passed exact-main/config/CI checks but
failed on the first Cloudflare D1-list read with authentication error 10000.
Ledger, bookmark, remote DB identity, FK/quick and schema gates were never
reached; the migration apply step was SKIPPED. No remote database, media or R2
inspection was performed afterward. Production state remains unknown, not
certified by prior reports. Sanitized receipt:
`artifacts/runtime-ingredient-v2/staging-0039-attempt.json`.

Branch `codex/runtime-ingredient-model-v2` starts at that exact main;
implementation checkpoint `1c9a585cd39cfd9e3b2b8b8256dbd41ed9878110`.
ADR-033
and `RUNTIME_INGREDIENT_MODEL_V2.md` describe an offline V2 ingredient contract,
consumer map and explicit evidence queues. The canonical 500-file source is
unchanged; SHA remains
`da87da20475fa8d7ec92c716e899ee572339573258ae6d9cc7f3f8f554f2d695`.
The deterministic audit reconstructs 6,766 source rows, 3,770 current V1
projected rows, 2,996 exclusions and 2,860 excluded rows needing review. A
hostile pass additionally flags 169 already-projected culinary/package/other
unit rows for independent conversion review. This is an offline triage finding,
not a changed canonical fingerprint or runtime cutover. The 1,395 distinct
`ING_ENR_*` IDs present in recipe rows remain provisional; no promotion was
recorded. The V1 schema, static 71, current D1 reader, recipe authority and
T20 logic are unchanged. `recipe:refresh:release-check` remains intentionally
red with the original four blockers. No 0040, final release manifest, staging
apply, production mutation, deployment or T20 enablement occurred.

Local focused V2/refresh tests (3 files / 35 tests), source/import/audit checks,
typecheck, lint and final `pnpm check` passed: 206 files / 4,615 tests,
migration smoke and build. Hosted PR #12 CI run `36271741260` / validate job
`108486877920` succeeded on `e321122069c74b2d791cd13d3c7422ed7e02abbe`
with the same 206 files / 4,615 tests, lint, typecheck, migration smoke and
build. PR #12 is OPEN/MERGEABLE; this final docs receipt requires its own CI.
Next: repair only the staging Environment Cloudflare D1 credential,
re-dispatch the same reviewed workflow against current certified main, then
capture production/media read-only evidence with verified identity. Independently
review the conversion/ingredient/source/nutrition queues before any final
release projection. Do not merge PR #12 as a staging or production readiness
certificate.

# Current state — Ingredient icon pack v2 (2026-09-27)

**Latest (2026-09-27):** branch `feat/ingredient-icons-v2` rebased on `origin/main`
`c6ea259` (PR #12 merge). Replaces the `getIngredientImage` if-chain with a
data-driven rule table (`src/web/lib/ingredient-icon-rules.json`, 214 rules)
plus 39 new transparent PNGs under `public/frigo/ingredients/`
(15 vegetables, 16 pantry, 8 generic category icons). `frigo-assets.ts` gains
the 39 keys and a new `ingredients.generic` section. All 8 existing call
sites keep the 2-arg signature (new optional 3rd `category` param).

**Status: `ICON_V2_PR_OPEN`.** PR #13
(`feat/ingredient-icons-v2` → `main`) opened 2026-09-27, rebased on
`origin/main` `c6ea259` (PR #12 merge), pushed via Git Data API
(tree byte-identical to local). Hosted CI is the final full-suite gate;
monitoring runs. No merge, no deploy from this task.

Post-rebase local gates (2026-09-27): `pnpm typecheck` PASS, `pnpm lint`
PASS, focused icon test 7/7 PASS, `vitest run tests/unit` 119 files /
2,478 tests PASS (incl. 18 new PR #12 tests), `pnpm check:migrations`
PASS, `pnpm build` PASS.

Behavior vs the old if-chain (audited on the real 500-dish / 6,766-row data):
- Old: 43.3% of displays fell back to the tomato icon (salt, pepper, sugar…);
  18/48 existing PNGs were never referenced; mis-matches (cá lóc→salmon,
  dầu mè→cooking-oil, trái bơ→butter).
- New: specific icon or truthful category icon for ~99.8%; category fallback
  (spice/meat/seafood/vegetable/fruit/grain/dairy/other) instead of tomato;
  tomato survives only as a last resort when an asset key is missing.
- Specific-before-generic ordering fixes cá hồi→salmon vs cá→white-fish,
  dầu mè→sesame-oil vs dầu→cooking-oil, trái bơ→avocado vs bơ→butter.
- Unaccented phase (word-boundary regex) recovers "Dau an", "Muoi", "Nuoc loc"
  (no `oc`-in-`nuoc` collision), "Duong cat trang" (no `cat`→meat collision).
- 11 ambiguous normalized forms (bo, ca, dau, me, chao, cat…) never guess:
  phase 2 drops them, and phase 1 now also skips bare ambiguous keywords
  (`me`, `chao`) when the input itself has no diacritics — fixes the old
  `"Me"` → tamarind-fruit mis-resolution. Unaccented "Me"/"chao" now land on
  category-other; accented "mè"/"cháo"/"chao môn" still resolve precisely.
- Pre-PR semantic audit of grouped keywords: ngao→seafood, hương thảo→spice,
  kỷ tử/ô liu→fruit, kinh giới/rong biển→vegetable, pate/pancetta→meat,
  đá viên→water, mứt→fruit — each lands on its truthful category icon
  (no wrong *specific* icon assigned); kept as designed.

Tests: `tests/unit/ingredient-images.test.ts` covers exact-ID matching,
specific-over-generic ordering, unaccented recovery, ambiguous no-guess,
category fallback, 2-arg backward compatibility, and existence of every
referenced asset in `frigo-assets.ts` and on disk (incl. all 39 new PNGs).

Boundaries: no PayOS/payment/billing/checkout/webhook, auth or infra change;
no migration; no deploy; production D1/R2 untouched. Not merged — PR only
after local `pnpm check` completes.

Next: finish `pnpm check`, commit, open PR from `feat/ingredient-icons-v2`,
require hosted exact-head CI green and reviewer `vn-taphoanhatung` before any
merge. Do not enable anything or deploy from this task.

---

# Historical current state — Recipe Content Refresh V2 research canonicalization

**PR #11 remediation (2026-09-27): `RECIPE_REFRESH_V2_RESEARCH_CANONICALIZED`; production release blocked.**
Implementation checkpoint: `1f77902` on
`codex/recipe-content-refresh-v2-canonical` (PR #11). The final local
`pnpm check` passed with lint, typecheck, Vitest, migration smoke and build.
PR #11 is open and mergeable; hosted CI run `36268138066` passed on exact
documentation head `dea13cddb0c153d325baa593700545d801c9e851` with
204 files / 4,597 tests, migration smoke and build. The PR description now
records the release blockers and remote boundary.
This section supersedes the earlier source-ready wording below. The original
ZIP still yields 500 recipes, 4,938 steps and 6,766 ingredient lines. The
source manifest now records `canonicalSourceReady=true`,
`runtimeProjectionReady=false`, `productionReleaseReady=false`, four typed
blockers, and `finalRuntimeFingerprint=null`. The 3,770-row projection and
its `6d0e3eb85696bb7c31bc54ac62783bc94432aaf008028eca79b17041f3eaed87`
fingerprint are provisional. Of 2,996 excluded rows, 2,860 require reviewed
transformation. Generated ingredient concepts are provisional: 505 existing,
0 reviewed new, 1,642 provisional new, 368 alias reconciliation rows. Source
URLs are declared/structurally valid; content verification has no URL-specific
record in the package. Nutrition remains 1 publishable, 288 blocked and 211
truthful null. The source build/check and separate expected-failing release
gate are in `scripts/recipe-refresh-v2.mjs`; the new root hash and exact
verification checkpoint are recorded in `HANDOFF.md`. The
remediated source artifact SHA-256 is
`da87da20475fa8d7ec92c716e899ee572339573258ae6d9cc7f3f8f554f2d695`
(previously `fc7eefe6573ee9de1083728db1f34b058954fa60ff478f7c5e41dce9e4570dbe`). Next:
runtime/content reconciliation, reviewed ingredient authority, final release
projection/fingerprint, then generated 0040. No remote mutation, deploy, 0040,
or T20 enablement occurred.

## Historical pre-remediation receipt (superseded)

**Previously reported (2026-09-27): `RECIPE_REFRESH_V2_CANONICAL_SOURCE_READY`.** The
canonical repository is `tako-vn/Tako-san`; work started from exact
`origin/main` `c81d6da2b3a9c051270b97953bfbb2c5aa34d057` on branch
`codex/recipe-content-refresh-v2-canonical`. Implementation checkpoint
`fc5e713e10e0b63c890ba31fc29d9678be896ed7` is pushed. This certifies the
source/compiler package only: no migration 0040, D1/R2 mutation, deploy,
recipe-authority change, or T20 enablement occurred.

## Recipe Content Refresh V2 canonical package — 2026-09-27 UTC

The input ZIP SHA-256 is
`ebc18f06ee7fb4498f8cd2a7886f333a85b385f32af4407ae1b44b4ec3cc06fe`.
Independent audit found 500 recipes / 500 unique IDs, exactly the current
500-ID release set; 4,938 steps; 6,766 ingredient lines (not the reported
6,720); 15 root schema variants; 1,102 source references / 1,072 unique URLs;
and 289 numeric plus 211 null source nutrition profiles. The normalized
package has one strict schema, 6,743 quantified and 23 qualitative rows, 166
process-only plus 7 mixed-process rows, and 3,770 runtime-projected versus
2,996 intentionally excluded ingredient rows.

Canonical source is in `data/recipe-refresh/v2`; machine audit artifacts are
in `artifacts/recipe-refresh-v2`; the human receipt is `AUDIT_REPORT.md`.
Canonical artifact SHA-256 is
`fc7eefe6573ee9de1083728db1f34b058954fa60ff478f7c5e41dce9e4570dbe`;
the runtime fingerprint from the repository's real `fingerprintRecipes()` is
`6d0e3eb85696bb7c31bc54ac62783bc94432aaf008028eca79b17041f3eaed87`.
`pnpm recipe:refresh:check` validates the 500-ID set, strict schema, units,
ingredient IDs, quantities, step numbering, nutrition agreement, reviewed
exceptions, per-file hashes, root hash, and runtime fingerprint.

Nutrition was re-audited rather than copied: 353 calculation candidates, 1
publishable profile, 288 blocked profiles, and 211 truthful null profiles.
Blocked/null recipes expose no certified runtime macros. In particular,
`vn-hap-01` no longer publishes sodium from a 500 g salt bed and
`imp-6eaf6ed6d417c52c` no longer publishes energy from 1 L of frying oil.
Ingredient reconciliation contains 2,515 rows: 505 existing IDs, 1,642 new
reviewed `ING_ENR_*` mappings, 368 duplicate aliases, 0 ambiguous and 0
invalid. The static 71-recipe `ALL_RECIPES`, INSERT-only import compiler,
release `rel-bd00a4f53fcaeee4`, migrations through 0039, media readiness, and
current authority behavior remain unchanged.

Local release gates on the final documentation tree: focused refresh tests
11/11, `pnpm recipe:refresh:check`, `pnpm recipe:import:check`, `pnpm
typecheck`, `pnpm lint`, `git diff --check`, and `pnpm check` PASS; full
Vitest is 204 files / 4,591 tests. A first full run exposed that this managed
worktree's sparse-checkout omitted tracked `public/` assets; adding the
tracked directory to the sparse set restored the checkout, and its 24 CSP/PWA
brand tests plus the complete gate passed without repository changes.

Next: independent PR review and hosted exact-head CI. After merge, build the
Content Refresh V2 manifest and generated `0040_recipe_content_refresh_v2.sql`
from this pinned package, then certify staging before any production rollout.

`staging_mutation=NO` · `production_mutation=NO` · `deploy=NO` ·
`T20_enablement=NO`

---

# Historical current state — T20 release gate

**Latest (2026-09-26):** PR #9 merged into `main` at `cb22cfb` and exact-main
CI passed. Cloudflare login now works locally, and read-only D1 list/info
match the staging ID in `wrangler.staging.jsonc`; the operator packet's
Section 0 ID still disagrees. A staging-only migration workflow is in PR #10
for review; no staging schema mutation or T20 flag enablement was performed.
The next section is current; later entries are historical.

## T20 staging migration tooling preflight — 2026-09-26 UTC

Cloudflare staging login follow-up: `pnpm dlx wrangler@4.119.0 login --device
--browser=false --scopes account:read user:read d1:write` completed after owner
approval; this disposable CLI did not change repository dependencies. The
repository's Wrangler 3.114.17 `CI=true pnpm exec wrangler whoami` now reports
authenticated (its earlier zero exit had printed "You are not authenticated").
Read-only `CI=true pnpm exec wrangler d1 list --json` finds exactly one
`frigo-db-staging-v3`, with the ID from `wrangler.staging.jsonc`;
`CI=true pnpm exec wrangler d1 info frigo-db-staging-v3 --config
wrangler.staging.jsonc --json` independently matches both name and ID. The
operator packet's Phase B ID matches these; its Section 0 ID does not. Treat
the live list/info and reviewed config as identity evidence, not as permission
to use the conflicting packet ID. No ledger, schema, bookmark or row query was
run; no staging or production D1 mutation/deploy was performed. Next: PR #10
review and exact-head CI, then verify GitHub staging Environment identity and
run its read-only gates on merged exact-main before any 0039 apply. Do not
infer CI credential access from this local OAuth session.

`git fetch --all --prune` confirmed `origin/main` `cb22cfb` (merged PR #9).
Hosted exact-main CI `36240577660` / validate `108400172569` SUCCESS (202
files / 4,574 tests, lint, typecheck, migration smoke, build). Automatic deploy
`36240842196`: release/staging SUCCESS, production SKIPPED; staging remains
static-authority, T20 OFF by default, **not** T20 staging certified.
`git diff --check` and `pnpm check:migrations` PASS (`migration-smoke=ok`).
Wrangler 3.114.17 is installed but `CI=true pnpm exec wrangler whoami`
reported "You are not authenticated"; exact local
`CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` variables are absent. The
operator packet's initial staging D1 ID differs from its Phase B expected ID
(which matches `wrangler.staging.jsonc`). No remote D1 list/info/ledger,
Time Travel bookmark, schema or 500-recipe authority check was performed;
do not resolve this discrepancy by selecting a likely database. Staging D1
migration, D1-mode deploy and T20 E2E were **not** executed.

The follow-up adds a manual staging-only 0039 migration workflow, fail-closed
main-SHA/CI, D1 identity, ledger, bookmark and post-schema checks, plus contract
tests. `pnpm exec vitest run tests/unit/staging-d1-migration-check.test.mjs
tests/unit/production-certify-workflow.test.mjs
tests/integration/d1-schema-gate.test.ts` PASS (3 files / 63 tests);
`pnpm exec eslint scripts/staging-d1-migration-check.mjs
tests/unit/staging-d1-migration-check.test.mjs` PASS. Initial test attempts
failed for a test syntax typo and parsing JSONC with `JSON.parse`; both were
corrected and the full focused rerun passed. On implementation checkpoint
`9635ad6`, local `pnpm check` PASS (203 files / 4,580 tests, lint, typecheck,
migration smoke, build); hosted PR #10 `validate` run `36241921150` SUCCESS.
Independent review found two P2 test/certification gaps in the new workflow
(FK cascade assertions and preflight SQL allowlist); both were fixed on the
follow-up branch and the same 3 files / 63 tests plus targeted ESLint passed.
This later docs/review-fix head still needs its own hosted CI before PR #10
can be reviewed for merge.

Next: reviewer resolves staging D1 ID discrepancy against the real account,
reviews/merges the staging-only workflow PR through normal flow, then uses
staging Environment credentials to run its read-only gates before any ledger
apply. Require exact-main CI on the merged workflow commit. Only after 0039
certification may the release operator run D1-500/T20-OFF staging deploy,
baseline smoke, then staging V2-ON and E2E. Production remains untouched.

**Latest (2026-09-26):** PR #8 merged into `main` at `662a065` with exact-main
CI green; PR #9 is synced/retargeted to `main` at C8 `8814701`. Its docs head
`cffd959` passed exact-head hosted CI. The next section is the current checkpoint;
older entries below are historical.

## T20 PR #9 post-merge sync — 2026-09-26 UTC

PR #8 MERGED at `662a065` (hosted CI `36237334354`, `validate` SUCCESS).
Deploy run `36237637195`: release and staging SUCCESS, production SKIPPED.
This is a flag-OFF staging deployment, **not** T20 staging certification;
no staging D1 migration was performed here. PR #9 remains OPEN, now targeting
`main` after merging `origin/main` at C8 `8814701`; merge-base is `662a065`.
The post-sync diff consists solely of PR #9 hardening, related regressions
and documentation: no PR #8 duplicate runtime code, migration, deploy/CI
workflow, config, T19 authority or payment/auth change. `git diff --check
origin/main...HEAD` PASS. Post-sync focused `pnpm exec vitest run` of the five
T20 integration, two T19 authority integration and three T20 unit suites:
10 files / 112 tests PASS. `pnpm typecheck`, `pnpm lint` and post-sync
`pnpm check` PASS (202 files / 4,574 tests, migration smoke and build).
Hosted PR #9 CI on C8 head `8814701`, run `36238249061` / validate job
`108393884945`, SUCCESS (202 files / 4,574 tests, migration smoke and build).
Docs head `cffd959` passed exact-head hosted CI `36239282586` / validate job
`108396637996`: ESLint, typecheck, Vitest, local SQLite migration smoke and
web/Worker build all SUCCESS. On that same head, `pnpm exec vitest run
tests/integration/t20-meal-composition-stale-read.test.ts
tests/integration/t20-legacy-family-and-safety.test.ts` passed 2 files / 24 tests.
`git fetch origin main fix/t20-postmerge-ci-picker-cuisine--hardening` and
`git merge-base --is-ancestor origin/main HEAD` confirmed base ancestry and
remote head equality; PR #9 was OPEN, MERGEABLE/CLEAN, with zero unresolved
review threads. This documentation receipt is a further docs-only head; verify
its own exact-head hosted CI and live review/mergeability before maintainer merge.
No migration, deployment, flag enablement or production operation was performed
for this PR #9 sync. Keep both T20 flags OFF; do not merge PR #9 in this task.

## T20 PR #9 C5–C7 checkpoint — 2026-09-26 UTC

`origin/main` remains `bf57451` (CI `36221190222` FAILED). PR #8 is open at
`16c5aae`, MERGEABLE/CLEAN, zero unresolved review threads; hosted `validate`
run `36233377483` SUCCESS. PR #9 remains stacked on its branch, now at
`869f035`; its pull_request CI does not run until its base is `main`. No PR
was merged or closed by this agent.

The independent P1 inventory-prefix bypass is fixed in PR #9: C5 `ab83d35`
rechecks the edited slot from its first changed component, `5c6835e` checks
later meals affected by the same running T02 projection, and `6c68d8d`
includes V1 family variants through the shared T03 restriction evaluator while
avoiding unrelated quantity-only rechecks. The P2 slot error precedence is
fixed by C6 `092d67b` and `869f035`: nonexistent slot 404, existing slot with
stale revision 409, including slots created during a torn read. Deterministic
reviewed substitutions were injected **only in tests**; no claim is made that
production currently configures them. Rejected writes keep the composition
and revision unchanged; unaffected prefix, safe reorders, V1 family shopping,
T19 authority and the D1 write fence remain covered.

At C7 code head `869f035`, `pnpm check` PASS: typecheck, lint, 202 Vitest
files / 4,574 tests, `migration-smoke=ok`, build. Focused `pnpm exec vitest run`
for the five T20 integration files (stale-read, legacy-family-and-safety,
HTTP, flows, picker/shopping), two T19 integration files (authority-split,
planner-authority-persistence), and three T20 unit files (composer UI,
shopping, safety) PASS: 10 files / 112 tests. `git diff --check
origin/main...HEAD` PASS. The deliberately failing regressions before the
follow-up fixes and two superseded full runs interrupted after new findings
are not final validation. This is branch-local, not hosted/exact-main evidence.

Next: maintainer merges PR #8 through its normal PR flow, verifies exact-main
CI, then syncs/retargets PR #9 to `main` and requires exact-head hosted CI,
review clearance and mergeability before its merge and a new exact-main CI.
Staging identity/ledger remain unverified; no remote 0039 migration, staging
deploy, production migration/deploy or flag enablement was performed.

## T20 PR #8 CI fix — lock/regenerate race, 2026-09-26 UTC

Final merge-readiness pass (2026-09-26 UTC): `origin/main` remains `bf57451`
(`bf57451e4a1a047eeff7a0938b903d1a37b6f8c9`), whose CI `36221190222` failed in the T20 concurrency test.
PR #8 remains open at `5b0a6b9` (`5b0a6b995786b338999286023eb2e46de4bc45a7`), MERGEABLE/CLEAN, no
unresolved review threads; exact-head hosted `validate` run `36226026618`
passed lint, typecheck, full Vitest, migration smoke and build. A fresh
`pnpm exec vitest run` of the T20 flows, picker/shopping, HTTP and composer UI
suites passed (4 files / 37 tests); `git diff --check origin/main...HEAD`
passed. Its diff adds no migration, infrastructure, secret, deploy workflow or
flag change. PR #8 is ready for a normal intermediate merge by the maintainer,
not a T20 release: the existing flags remain OFF and PR #9 is stacked on #8
for revision semantics, Manual safety and picker response hardening. No remote
migration, deployment, enablement or production mutation was performed.
Next: merge #8 through the PR flow, check exact-main CI, then retarget and
certify #9 before T20 staging work.

---

PR #8 hosted `validate` run `36225377465` failed 1/4554:
`competing lock/regenerate` got `[200, 404]`. Regenerate won; the losing PATCH
targeted the unlocked legacy component, which the winning regenerate replaced.
Test-only fix (`754fb2e`): the race
now targets the locked rice component, which regenerate preserves by ID, so the
loser always reaches the revision fence (409 `PLAN_REVISION_CONFLICT`); final
state asserted for both winners. Executed: flows file 5/5 runs PASS (16 tests);
throwaway sequential regenerate-then-stale-PATCH check PASS (409, rice still
locked; not committed); `pnpm typecheck` PASS; eslint on the file PASS.

Follow-up finding (production code NOT changed, per scope): `MealCompositionService.load`
reads the plan row and `readPlanCompositions` in separate awaits. A stale
component edit can pass `assertRevision` on the old row, then read a newer
composition and fail with 404 `COMPONENT_NOT_FOUND` before the fenced write.
Writes remain revision-fenced (no data loss); only the error classification is
wrong. Next: reclassify to `PLAN_REVISION_CONFLICT` when the plan revision
moved (or read row + compositions in one batch), with a regression test.

---

# T20 post-merge CI fix + picker cuisine filter, 2026-09-26 UTC

Branch `fix/t20-postmerge-ci-picker-cuisine` from main `bf57451` (PR #7 merge).
- `87c8e64` (test-only): main CI run `36221190222` failed at
  `tests/integration/t20-meal-composition-flows.test.ts:177` because the
  add/remove race can legitimately be won by DELETE (empty composition) while
  the test assumed `components[0]`. The combined race is split into three
  independent cases; each asserts exactly one 200 + one typed 409
  (`PLAN_REVISION_CONFLICT`; auto-apply losing to a save may be the documented
  `PROPOSAL_STALE`) and a final state matching the winner. DELETE-wins refills
  at the current revision; lock/regenerate and save/auto-apply start from a
  deterministic sequential setup. No production logic changed.
- `65084fc`: T20 picker `cuisine` query (strict enum of existing `CuisineType`
  values), filtered server-side on stored recipe cuisine together with role/q/
  kind; simple foods have no cuisine and are excluded when the filter is set.
  UI: labelled cuisine select and filtered empty state with Clear filters.
  Candidate authority, hard restrictions, composer, shopping, T19 unchanged.

Executed: focused `vitest run` of t20-meal-composer-ui, t20-roles-picker-shopping,
t20-meal-composition-flows, t20-meal-composition-http: 4 files / 37 tests PASS;
flows file 6/6 repeated runs PASS; DELETE-first sequence verified with a
throwaway sequential test (not committed). `pnpm typecheck`, lint PASS.
`pnpm check` on `65084fc`: typecheck, lint PASS; vitest 4,552 PASS / 2 FAIL —
`tests/unit/d1-readonly-query.test.mjs` and
`tests/unit/production-certify-workflow.test.mjs` hit the 5 s default timeout in
this sandbox (both PASS with `--testTimeout=60000`, ~6.2 s each; unrelated to
T20). Because the script stops at tests, `pnpm check:migrations`
(`migration-smoke=ok`) and `pnpm build` (`✓ built in 10.45s`) were run
separately: PASS. `git diff --check origin/main...HEAD` PASS. The running-app
UI check was not performed (the T20 UI flag stays off here). Nothing merged,
deployed or migrated; production D1 not accessed; no T20 flags enabled.

Next: open a PR from this branch, confirm hosted `validate` is green (it should
no longer flake at the old line 177), then run a flag-enabled local visual check
of the picker cuisine select before any T20 release.

---

# T20 PR #7 — final merge-decision audit, 2026-09-26 UTC

PR #7 on `feat/t20-meal-composition-v2` was reviewed at `6882ba3` against
`main` `136cb6f`: hosted `validate` run `36217584128` SUCCESS, MERGEABLE/CLEAN,
no review comments and clean worktree. No implementation or release configuration
change was needed. `git diff --check origin/main...HEAD` PASS;
`pnpm exec vitest run tests/unit/composition-flags.test.mjs
tests/integration/d1-schema-gate.test.ts tests/unit/t20-composer-candidates.test.ts
tests/unit/t20-meal-composition.test.ts` PASS (4 files / 46 tests). Full
`pnpm check` on application head `0b465d5` previously PASS (201 files / 4,549
tests, migration smoke, build); the latest head is documentation-only and its
hosted full validation passed. Production D1 was not accessed or migrated.

Next: check CI on this documentation-only handoff head and obtain the user's
merge decision. Separately, the D1 operator must apply 0039 before deployment;
the release owner must opt in to the default-off paired Worker/UI flags only
after the target database is migrated. Neither is a merge blocker. No merge,
deploy, production mutation, T20 enablement or T19 authority change here.

---

# T20 PR #7 — final P2 budget remediation, 2026-09-26 UTC

**Status: `T20_PR7_READY_FOR_FINAL_REVIEW`; no merge or deployment.**
Review base: `main` at `136cb6f`; prior head `a337a2b` passed hosted `validate`
run `36216083854`. Application head `0b465d5` passed hosted `validate` run
`36216675722` (SUCCESS, MERGEABLE/CLEAN, no review comments). The
handoff head `d7aef32` passed hosted `validate` run `36217199489` (SUCCESS,
MERGEABLE/CLEAN, no review comments). No implementation changes remain. The
final audit found no new merge blockers; local `pnpm exec vitest run
tests/unit/composition-flags.test.mjs tests/integration/d1-schema-gate.test.ts
tests/unit/t20-composer-candidates.test.ts tests/unit/t20-meal-composition.test.ts`
passed (4 files / 46 tests), and `git diff --check origin/main...HEAD` passed.
This handoff note introduces no runtime, migration or workflow changes. The
operator still has to apply 0039 before target deployment; the release owner
should enable paired server/UI flags only after migration (default off).
Application checkpoints `e3aef74` (candidate pool) and `4f60157` (scoring limit) remain on
`feat/t20-meal-composition-v2` (PR #7). Final pass commit `0b465d5` removes a
stray blank line at EOF in `src/worker/services/meal-composition.ts` (the full
PR diff had failed `git diff --check origin/main...HEAD`); no runtime logic
changed. The full PR diff now passes that check.

- `prepareComposerCandidates`: T03-rank every role/authority-eligible recipe,
  reserve eligible simple foods inside the same 320 slots, fill per-role quotas
  with multi-role candidates counted once as a candidate, then backfill free
  slots in rank order. The *returned* recipe + simple-food pool never exceeds
  `COMPOSITION_BUDGET.maxCatalogCandidates` (320). No client cap input.
- `composeMeal`: score only after checking `maxScoringOperations`; cache each
  scored partial, stop before an extra operation, reuse the cached score for
  returned options. When exhausted, return already-scored compatible partials
  without touching locks. Default 2400; test overrides 1, 3 and 0.
- Focused `pnpm exec vitest run tests/unit/t20-meal-composition.test.ts
  tests/unit/t20-composer-candidates.test.ts tests/unit/t20-composition-safety.test.ts
  tests/unit/composition-flags.test.mjs tests/integration/t20-meal-composition-flows.test.ts
  tests/integration/t20-legacy-family-and-safety.test.ts`: **6 files / 68 tests
  PASS** before the additional zero-budget case; then
  `pnpm exec vitest run tests/unit/t20-meal-composition.test.ts`: **17 PASS**.
  `pnpm typecheck` and `git diff --check`: PASS. Full `pnpm check` **PASS**:
  typecheck, ESLint, Vitest 201 files / 4,549 tests, `migration-smoke=ok`,
  production asset build (`✓ built in 6.64s`). Remote D1 schema and Week
  parity checks skipped as configured for local verification; no production
  access or mutation. Independent narrow review found no new P0/P1/P2.
- Boundaries: no merge, no deploy, no production D1 migration or data mutation,
  no T20 flag enablement, no T19 recipe authority change. Migration 0039 remains
  unapplied by this task.

Final-pass execution on `0b465d5`: `pnpm typecheck` PASS;
`pnpm exec vitest run tests/unit/t20-composer-candidates.test.ts
tests/unit/t20-meal-composition.test.ts tests/integration/t20-meal-composition-http.test.ts`
PASS (3 files / 23 tests); `git diff --check origin/main...HEAD` PASS after the
EOF cleanup. `pnpm check` PASS: typecheck, lint, Vitest 201 files / 4,549 tests,
`migration-smoke=ok`, build (`✓ built in 6.72s`); remote D1 schema and Week
parity skipped locally. Independent final
code and release audits found no new P0/P1/P2 or merge blocker. Deployment
owner must apply 0039 to the target D1 before deployment; release owner must
enable the paired server/UI T20 flags only after migration (default off).

Next: verify CI on the exact PR head immediately before merging, then let the
user decide whether to merge. No release operation is authorized by this handoff.

---

# Tako-san T20 PR #7 review remediation (4 × P1 + candidate-cap P2) - 2026-09-26 UTC

**Status: `T20_REVIEW_P1_REMEDIATED` — local `pnpm check` PASS (200 files /
4,541 tests); PR #7 hosted `validate` run `36210020774` SUCCESS on head
`424be56` (MERGEABLE, CLEAN; this docs-only commit gets its own run). Production untouched: no
deploy, no D1 migration, T19 authority unchanged (d1/0/cutover=true, 500).**

`branch=feat/t20-meal-composition-v2` (PR #7), review base head `febeb1f`; implementation commit `2e4f878`.

Fixed (review findings on PR #7; the earlier "P1 = 0" claim was wrong):
- P1 Manual hard safety: T03 `evaluateHardRestrictions` extracted from
  `evaluateRankingEligibility` (behaviour unchanged) is the single definition.
  New `packages/recipes/src/composition/restrictions.ts` judges every component a
  Manual mutation adds (add/swap/replace, and Assisted/Auto apply) on the same
  T02 candidate (slot inventory, planner substitution policy, server evidence
  provider) that Auto ranks: dietary/allergen unknown, time unknown/over, hard
  nutrition unknown/conflict, forbidden (incl. used substitutes), never-recommend
  → 422 `HARD_CONSTRAINT_CONFLICT`. Simple foods use the same function in Auto,
  Manual and picker (Auto previously ignored time/nutrition for simple foods).
  No manual override model.
- P1 V1 family meals: composition routes (Manual/Assist/Auto) return 422
  `LEGACY_FAMILY_COMPOSITION_UNSUPPORTED` up front; the UI keeps V1 "Swap meal"
  and shows no composer for family slots. Family slots are now projected
  (`legacy_family`, exact T04 variant identity), so composed-plan shopping no
  longer drops their demand (it silently did before); an unresolvable variant is
  409 `COMPOSITION_REVALIDATION_REQUIRED`.
- P1 shopping substitution authority: `EvaluationScope` requires
  `substitutions/approvedSubstitutionIds/activeConstraints`, built by
  `evaluationScope(context)` from the same planning context as the planner and
  Auto. (The production context still supplies empty lists — no reviewed registry.)
- P1 flags: `deploy.yml` input `meal_composition_v2_enabled` (default false) →
  `release-check.mjs gate` normalizes once (manifest `mealCompositionV2Enabled`)
  → Build `VITE_MEAL_COMPOSITION_V2_ENABLED` + Worker `--var
  MEAL_COMPOSITION_V2_ENABLED` in staging and production; `scripts/composition-flags.mjs
  verify` fails unless server/UI/manifest/compiled value (`dist/composition-flags.json`,
  written by a Vite build plugin outside `dist/client`) agree. Wrangler configs
  default `"false"`. Production build moved to its own step after local gates.
  UI falls back to V1 controls when the composition API 404s (mismatch).
- P2 candidate bias: all role-matching recipes are generated and ranked; the 320
  cap applies after ranking with a per-role quota (no catalog-order truncation).
- Preview: `PREVIEW_MEAL_COMPOSITION_V2_SERVER=false` drills the UI-on/server-off
  mismatch in the isolated preview.

Checks executed (local, Node 24.19):
- `pnpm check` PASS: typecheck (app + worker), lint, Vitest **200 files / 4,541
  tests** (612.9 s), `migration-smoke=ok`, build.
- New suites: `tests/unit/t20-composition-safety.test.ts` (13),
  `tests/integration/t20-legacy-family-and-safety.test.ts` (5),
  `tests/unit/composition-flags.test.mjs` (17), +4 UI cases in
  `tests/unit/t20-meal-composer-ui.test.tsx`. Verified to fail on the old code:
  all 5 integration cases and the 2 UI family/mismatch cases.
- Browser (isolated preview, synthetic data, agent-browser, 390×844): flags on →
  composer shown, V1 swap hidden, Manual add of rice persisted; UI on/server off →
  compositions 404, V1 "Đổi món" shown, no composer. Family slot not browser-tested
  (static preview catalog has no families; covered by jsdom + HTTP tests).
- `deploy.yml` not executed on GitHub Actions (only parsed and unit-tested).

Remaining debt (not blocking): picker still lists recipes with
`constraintState: unknown` when safety is requested (server rejects on save);
role heuristics (staple 0 / dessert 0 in catalog); per-component servings.

Next: operator merge decision on PR #7 (not merged by the agent). After merge,
production Deploy fails closed until 0039 is applied through *Production D1
migration* (`expected_pre_tip=0038_auth_onboarding_completion.sql`,
`migration=0039_meal_composition_v2.sql`); staging D1 needs 0039 before its flag
is enabled. Automatic staging deploys ship the flag off. Then dispatch Deploy with
`meal_composition_v2_enabled=true` (see `DEPLOYMENT.md`).

---

# Tako-san T20 Meal Composition V2 - 2026-09-25 UTC

**Status: `T20_CODE_COMPLETE` — local gates PASS; PR #7 hosted CI `validate`
run `36197958265` SUCCESS on implementation head `0db541da8619fdf03f21bc4fb93d081fa335a0d5` (MERGEABLE,
CLEAN; this docs-only commit gets its own PR-head run). T19: `T19_COMPLETE_OPERATOR_ACCEPTED`. Production
untouched: recipe authority d1/0/cutover=true, 500 recipes; no T20 deploy; no
production D1 migration.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`
`starting_main=136cb6ff3d2921eac237c7b106b37ab5ee12a13f`
`branch=feat/t20-meal-composition-v2`

Implemented (ADR-031, `MEAL_COMPOSITION_V2.md`):
- T20A: additive migration `0039_meal_composition_v2.sql`
  (`generated_meal_plan_compositions`, `generated_meal_plan_components`,
  `recipe_role_assignments`; partial unique indexes for one dish per meal);
  domain model, closed role enum, deterministic role rules with provenance,
  nine bounded simple foods, flexible meal profiles, V1 read-time projection.
- T20B: server-authoritative Manual builder API (add/remove/swap/lock/role/
  reorder/replace) sharing the plan `revision` behind a batch fence; picker
  (summary DTOs, role/kind/text filters, stable offset cursor, ≤ 24/page).
- T20C/D: Assisted (complete / regenerate unlocked) and Auto (top ≤ 3) on one
  bounded, deterministic beam search; suggestions never write; apply recomputes
  and requires the same option ID; locks are domain-enforced.
- T20E: all components of all meals projected against one running T04
  inventory projection, then unchanged T05 aggregation (single subtraction).
- T20F: composed week cards, meal composer, picker bottom sheet/dialog,
  suggestion panels; vi/en; lock `aria-pressed`, one polite live region, focus
  restoration, Escape cancels without mutation.
- V1: unedited slots read as `main / legacy_v1`; V1 schemas unchanged; V1 swap
  on a composed slot is 409 `COMPOSITION_MANAGED_SLOT`; V1 regenerate keeps
  locked components; V1 shopping projects components. Flag off = pre-T20.
- Flags: `MEAL_COMPOSITION_V2_ENABLED` (server) and
  `VITE_MEAL_COMPOSITION_V2_ENABLED` (UI), both default off, independent of T19.
- Preview: `PREVIEW_MEAL_COMPOSITION_V2=true node scripts/security-preview.mjs`
  opts the isolated preview into V2 (default off keeps the T06B browser suite).

Role distribution on the 500-recipe D1 release (pinned test): main 362, side
87, soup 70, vegetable 37, simple_food 7, staple 0, dessert 0; unclassified 0,
invalid 0, duplicates 0, contradictions 0, review-required 0.

Checks executed (local, Node 24.19, sqlite3):
- `pnpm check` PASS: typecheck, lint, Vitest **197 files / 4,502 tests**
  (725.9 s), `migration-smoke=ok`, build. T20 suites: 6 files / 48 tests; T19
  authority suites (split 11, persistence 18, observability 19) PASS;
  d1-schema-gate 9 PASS.
- Earlier full run: 4,496/4,497 with one unrelated 5 s timeout in
  `production-certify-workflow.test.mjs` under parallel load; that file passed
  48/48 in isolation and in the final `pnpm check`.
- Browser (isolated preview, synthetic data, agent-browser): 375×812, 390×844,
  768×1024, 1280×900 — plan generation, V1 cards, composer, Auto options and
  accept, picker keyboard focus/Escape return, no horizontal overflow, no
  unnamed controls.

Not done / deferred: leftovers (T20B/T21), per-component servings, role review
tooling and AI-assisted offline role proposals, picker ingredient/cuisine
filters, whole-week Auto, price-aware scoring. `tests/fixtures/migration-sha256.json`
gets the 0039 hash only after the migration is applied (fixture policy).

Next: independent review of PR #7 (not merged by the agent); require exact-head
hosted `validate` on the final head.
Rollout (separately authorized): apply 0039 to staging then production D1 (the
schema gate fails closed on a 0038 ledger), then enable both flags. Do not change
T19 recipe authority.

---

# Historical T19 operator closure / T20 unlocked - 2026-09-25 UTC

**Status: `T19_COMPLETE_OPERATOR_ACCEPTED`. T20: `UNLOCKED`.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`
`main_baseline=136cb6ff3d2921eac237c7b106b37ab5ee12a13f` (PR #6 merge)

T19 closure was accepted by the operator based on the successful final D1
deployment, the rollback proof, the final restoration, exact-main CI, the
existing production read-only certification and runtime release evidence.
The evidence below is operator-reported for runs on the same main SHA; this
agent did not re-run or re-read those production runs in this task.

- Exact-main CI `36149295615` SUCCESS; current-main staging `36149849086`
  SUCCESS.
- Production sequence: shadow `36150427552`, canary-1 `36151130515`,
  canary-5 `36152198646`, canary-25 `36153116467`, first d1 `36153948951`
  (all SUCCESS).
- Rollback proof `36154980456` SUCCESS (d1 → shadow): PASS.
- Final restore: canary-1 `36167843671`, canary-5 `36176092421`, canary-25
  `36176824421`, final d1 `36183890785` (all SUCCESS): PASS.
- Final production authority: `mode=d1`, `percent=0`, `cutover=true`,
  `source=d1`, served recipes `500`, release `rel-bd00a4f53fcaeee4`,
  `fallback=null`, runtime fingerprint `f8cf8c7ff59df9fe29e246b9e3c9aad0fd155fa8df35bf671ac4d03fa2b5ab37`.

**The final post-rollout read-only recertification was waived by the
operator. No post-final-D1 certification run occurred; do not invent a PASS
receipt for it.**

T20 (Meal Composition V2) is unlocked and implemented on
`feat/t20-meal-composition-v2`; see the T20 section above this one once it is
recorded. T20 must not change production recipe authority (d1/0/true, 500).

---

# Historical T19 same-SHA promotion convergence fix - 2026-09-25 UTC

**Status: `TAKOSAN_D1_PROMOTION_CONVERGENCE_FIX_IN_REVIEW`. Production is at
`canary-25` on main `a3e1614` (`a3e161470e3757f9a211bd443f560cb139c8654f`); the d1 promotion
was rolled back automatically. T19 incomplete; T20 blocked.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

After PR #5 merged, the owner ran shadow bootstrap and promotions on
`a3e1614`: Deploy `36140227253` (shadow), `36141391948` (canary-1),
`36142331814` (canary-5) and `36143861402` (canary-25) all SUCCESS;
certification `36139684859` PASS on that SHA.

d1 promotion `36144837880` (transition `canary-25 → d1`, kind `promotion`):
deploy succeeded, then the proof step failed after ~4 s with `FAIL readiness:
recipe authority mode canary != approved d1`. `wait-for-deployed-release.mjs`
logged `attempt 1: readiness identifies release a3e16147` — it verified only
the commit, and the old and new Worker versions share that commit (only vars
differ), so it returned while the edge still answered from the canary-25
version. Restore then ran: its first check logged `Rollback authority
evidence differs at configuredMode` (the d1 version still answering), the
existing 180 s loop retried, and the receipt records `rollback.result =
restored`, exact previous version `8076dfe6-138f-4084-825e-7b4e6e46dad4`, new deployment
`398ee771-e6c4-447d-b01e-7ce62d22e4cc`. The restore step concluded SUCCESS (the report's
claim that the rollback proof failed is not supported by the run). The
earlier promotions all passed at `attempt 1` too, so the race was latent.

Fix (scripts only; workflow YAML unchanged):
- `verifyDeployedRelease` also requires the readiness `recipeAuthority`
  mode/percent/cutover to equal the manifest. A mismatch is retryable
  (`RELEASE_PROPAGATION_PENDING`) only when it is a valid state equal to the
  preflight-captured `previousRecipeAuthority` for the same commit (staging,
  without preflight evidence: any valid state, still bounded); invalid,
  contradictory or unexpected states and a missing summary fail at once.
- `wait-for-deployed-release.mjs` requires 3 consecutive matching readiness
  observations (old-version answers reset the count), within the existing
  90 s deadline.
- `release-check.mjs authority` polls via `waitForRecipeAuthorityEvidence`,
  retrying only evidence equal to the pre-deploy state on the same commit
  (90 s); fallback, other states or other commits fail immediately; with no
  preflight evidence (staging) behaviour stays single-attempt.
- The restore loop already tolerates this race and is unchanged.

Checks: run/job/step timings, bounded logs and receipt of `36144837880`;
logs of `36141391948`/`36142331814`/`36143861402`; focused Vitest
(`wait-for-deployed-release` + `release-check`) 198 PASS with new
regressions; full `pnpm check` PASS (lint, typecheck, 191 files / 4,453 tests, migration
smoke, build).

Next: review/merge. This moves main, so the same-SHA rule restarts the
rollout: new-main CI → staging → read-only certification → production
`shadow` on the new SHA with `confirm_recipe_catalog_rollback=true`
(`validateRecipeCatalogTransition` classifies canary-25 → shadow as a
rollback; the 25 % cohort returns to the static catalog until canary resumes)
→ canary 1 → 5 → 25 → d1 → rollback proof → final d1.

---

# Historical T19 legacy-Worker bootstrap fix - 2026-09-25 UTC

**Status: `TAKOSAN_PRODUCTION_BOOTSTRAP_FIX_IN_REVIEW`. Production Worker is
still pre-T19 `4677ebb` (`4677ebbabbb580b9045423350da719acaf8f5742`); no production deploy has
succeeded. T19 incomplete; T20 blocked.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

Owner production shadow bootstrap Deploy `36133649176` (main `8603808`)
failed at preflight: `RELEASE_VERIFY_TOKEN must be provisioned before
deployment`. Owner then provisioned the production GitHub Environment secret
and the `frigo` Worker secret (value not seen by the agent). Re-dispatch
`36134994434` passed local gates, CI recheck, Cloudflare identity, schema
0001–0038, runtime catalog 500 and release certification, then failed:
`Recipe authority preflight failed with HTTP 401`. Neither run reached
`Deploy to Cloudflare production`; receipts have no `deployed` field.

Cause: `4677ebb` has no `/health/recipe-authority` route (added in
`8205883`); its global auth middleware answers 401 before routing, while the
preflight only accepted 200 or 404 (bootstrap). The reviewer's proposed
match on `"code":"UNAUTHORIZED"` would still fail: that code is only returned
without a Bearer header. With the workflow's Bearer token the legacy Worker
returns `TOKEN_INVALID` (verified by read-only GETs: no header →
`UNAUTHORIZED`, dummy Bearer → `TOKEN_INVALID`; new staging Worker with
dummy Bearer → `RELEASE_VERIFY_UNAUTHORIZED`). The restore step had the same
gap: after rolling back to the legacy Worker it would retry 401 until timeout
and fail the rollback proof.

Fix (not body matching): new `release-check.mjs legacy-authority` accepts a
preflight 401 as `{unavailable:true,httpStatus:401,legacyWorkerCommit}` only
when the exact snapshotted Worker version (pinned D1 binding) carries a full
`GIT_COMMIT` that is an ancestor of the release and whose
`src/worker/routes/health.ts` lacks `/health/recipe-authority`; a
`RELEASE_VERIFY_UNAUTHORIZED` body always fails. It runs after
`rollback-target` and before `transition`, so the existing bootstrap rules
still apply (static/shadow only, explicit confirmation required). Restore
accepts 401 only when the previous evidence was that proven legacy Worker and
the body is not `RELEASE_VERIFY_UNAUTHORIZED`; exact previous version, new
deployment ID, binding and mutation receipt are still required.

Checks: bounded failed logs of both runs; `git show 4677ebb:` middleware and
health route; read-only production/staging GETs without real tokens;
classifier against real history (`4677ebb` accepted; `8205883` and main
rejected); `bash -n` of the modified workflow steps plus branch simulation;
focused Vitest 3 files / 228 PASS; `pnpm check` PASS (lint, typecheck,
191 files / 4,440 tests, migration smoke, build). The GitHub App push now
succeeds for workflow files.

Next: review/merge the PR; confirm exact-new-main CI and automatic staging
PASS; rerun Production Read-Only Certification on the new SHA; owner
re-dispatches production shadow bootstrap with the new full SHA as `ref` and
`hardened_sha` (other inputs unchanged). Then canary 1 → 5 → 25 → d1,
rollback proof, final restoration. No other main merges during rollout.

---

# Historical T19 production read-only certification PASS - 2026-09-25 UTC

**Status: `TAKOSAN_PRODUCTION_SHADOW_DISPATCH_REQUIRED`. New main `8603808`
(`860380887350d4ab93e4d5e66a0fa4e074397608`): exact-main CI PASS, staging PASS, production read-only
certification PASS. Production Worker is still the pre-T19 commit; no
production rollout has run. T19 incomplete; T20 blocked.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

- PR #4 (`t19-readonly-d1-query-proofs`, merged by `tako-vn1`, no reviews
  recorded) merged as main `860380887350d4ab93e4d5e66a0fa4e074397608`. For all six
  implementation files, `git diff 399ec9b origin/main` is empty; main differs
  from `399ec9b` only in docs (local handoff commits were not published).
  PR CI `36130608164` and exact-main push CI `36131217435` SUCCESS.
- Staging: automatic Deploy `36131763935` (`workflow_run`) release/staging
  SUCCESS, production SKIPPED. Receipt `release-staging-36131763935-1`: exact
  deployed SHA = main, `static/0/cutover=false`, source static, 71 served,
  release `rel-bd00a4f53fcaeee4`, fallback null, CI `36131217435`.
- Production Read-Only Certification `36132078167` SUCCESS (reviewer-gated).
  Receipt `production-certification-36132078167-1`: `certification.result=PASS`,
  `readOnly=true`; Cloudflare account authenticated, `frigo-db` ID
  `f975ec39-b2c8-4a2a-80e1-0366054599d3` info cross-check match; ledger 0038 (38 migrations);
  catalog and runtime catalog 500/500, batches 2/2, release complete, runtime
  fingerprint = expected, 0 hydration failures, media ready 0; foreign-key
  check `[]`, `quick_check=ok`; production baseline Worker `frigo` version
  `aada9b9d-93f9-4db5-97a6-d5c4741a67e7`, deployed SHA `4677ebbabbb580b9045423350da719acaf8f5742` (ancestor of new
  main), binding verified. `productionAuthority` is
  `UNKNOWN_RELEASE_SECRET_NOT_AVAILABLE` (cert job has no release token).
- Other runs on the new SHA: Deploy `36131617559` failed at the release gate
  (`Latest exact-SHA CI push run on main must be completed and successful`,
  CI still running); `36131966475` staging cancelled before any step; push
  run `36130289358` on an intermediate PR-branch commit was a workflow-file
  failure with no jobs. None reached production.
- No production D1 migration is needed: production ledger already equals the
  repository tip and the 500-recipe release is complete.
- Public `https://frigo.tungjpstore.net/api/v1/health/ready`: HTTP 200,
  production, commit `4677ebbabbb580b9045423350da719acaf8f5742`, no `recipeAuthority` summary (pre-T19
  Worker), so the protected authority endpoint is expected to be unavailable
  and the first stage is a **bootstrap**.
- Agent attempted `gh workflow run deploy.yml` for production `shadow`
  (ref/hardened = main, `confirm_production=true`, percent 0, bootstrap
  confirmation true) after re-verifying main and CI: HTTP 403 `Resource not
  accessible by integration`; no run created.

Next (owner dispatch, reviewer `vn-taphoanhatung` approves): Deploy on `main`
with `environment=production`, `ref` = full main SHA, `hardened_sha` = the
same full SHA used for certification, `confirm_production=true`,
`recipe_catalog_mode=shadow`, percent `0`, `confirm_recipe_catalog_rollback=true`
(required only for this bootstrap). Inspect receipt (deployed exact SHA,
shadow probe D1 ready/500/release fingerprint, users static, no fallback).
Then, one run each on the same SHA with the checkbox **off**: canary 1 → 5 →
25 → d1. Then live rollback proof (d1 → shadow with checkbox on), then final
restoration shadow → canary 1 → 5 → 25 → d1. Do **not** merge anything to
main during rollout: a new main SHA invalidates the same-SHA sequence. These
handoff docs therefore stay local until rollout ends. T20 blocked.

Checks: `git fetch`; commits/PR/run/job/artifact GETs; downloaded and
inspected receipts above (safe fields only); bounded failed log of
`36131617559`; `git merge-base --is-ancestor 4677ebbabbb580b9045423350da719acaf8f5742 origin/main` (yes);
public readiness GET; production shadow dispatch (403). No local tests rerun
(no code change in this step).

---

# Historical T19 exact patch handoff - 2026-09-25 UTC

**Status: `TAKOSAN_WORKFLOW_WRITE_PERMISSION_BLOCKED`. The exact implementation
commit `399ec9b` is ready to hand to an authorized maintainer as a standalone
patch; no branch or PR was published from this workspace. T19/T20 blocked;
production certification remains failed, no production mutation.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

Owner requested the patch so their reviewer can apply it from current main.
Verified `git format-patch -1 399ec9b --stdout` contains only six files:
the two reviewed workflows, `.hoplite/setup.sh`, the fixed read-only D1 query
runner and two unit-test files. Its parent is local documentation on top of
the unchanged `origin/main=f933f222df992768534283b38d32b358498563d2`, so `git diff main...399ec9b`
would include unrelated historical docs. The **single-commit** patch was
validated by `git diff --check 399ec9b^ 399ec9b` and `git apply --check -`
in a fresh archive of `origin/main` (both PASS). No secrets or unrelated
PayOS/auth/payment files were present. The user-facing reply includes the
entire standalone implementation diff; the recipient must apply it in a
review branch through their authorized GitHub path, with tests and normal
review. A patch handed off in chat is not published or certified.

Next: authorized maintainer applies the exact single-commit diff to current
main, opens PR for review, and verifies CI. After merge, require new-SHA
staging PASS and a new read-only production certification with required
reviewer. No D1 migration/rollout or T20 before those gates.

---

# Historical T19 workflow publication permission gate - 2026-09-25 UTC

**Status: `TAKOSAN_WORKFLOW_WRITE_PERMISSION_BLOCKED`. Production read-only
certification still FAIL; reviewed local repair PASS but **NOT PUBLISHED**.
T19 and T20 blocked; no production mutation by this work.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

Local branch `hoplite/stymphalos-a3bdf6c6` has implementation checkpoint
`399ec9b` and handoff checkpoint `17ab64c`. Full `pnpm check` PASS (191
files / 4,432 tests, lint, typecheck, migration smoke, build). After confirming
the active managed GitHub App credential matched repository ID `1385308553`,
`git push origin HEAD:hoplite/stymphalos-a3bdf6c6` was **remote rejected**:
`refusing to allow a GitHub App to create or update workflow
.github/workflows/deploy.yml without workflows permission`. No remote branch
or PR was created; main remains `f933f222df992768534283b38d32b358498563d2`. A read-only installation
metadata API probe returned 401 (`A JSON web token could not be decoded`),
not evidence of a new credential; the Git rejection is the permission proof.
No stripping of workflow edits, ad-hoc prod query, manual deploy or workaround
that bypasses access control was attempted. Pre-existing `.context/` is
untracked and untouched.

Next: an authorized GitHub App integration must gain **workflow-file write**
permission for this repository (through the provider's approved permission
path), or an authorized human maintainer must publish/review this exact tested
patch. Do not request or exchange tokens. After a successful review/merge,
require exact-new-main CI and staging before a **new** production read-only
certification run with reviewer approval; no migration or rollout yet. This
workspace cannot claim the repair is deployed or production is certified.

Executed for this gate: `credential_control status` (active, correct repo ID);
`git push origin HEAD:hoplite/stymphalos-a3bdf6c6` (rejected, no ref),
`git ls-remote origin refs/heads/hoplite/stymphalos-a3bdf6c6` (absent),
`gh pr list --state open` (empty), `gh api repos/tako-vn1/Tako-san/commits/main`
(`f933f222df992768534283b38d32b358498563d2`). Reported platform integration permission blocker; see
earlier section for full verification and run `36101940395` diagnosis.

---

# Historical T19 production read-only certification query repair - 2026-09-25 UTC

**Status: `T19_PRODUCTION_READ_ONLY_CERTIFICATION_BLOCKED`. Production
certification did not pass; no production mutation or rollout by this change.
T20 remains blocked. The previous staging PASS applies only to main
`f933f222df992768534283b38d32b358498563d2`, not to any future main commit.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

Owner-dispatched Production Read-Only Certification run `36101940395`
(attempt 1, `workflow_dispatch`, head `f933f222df992768534283b38d32b358498563d2`) completed FAILURE after
production Environment approval. `gate`, `Recheck exact main`, SQL generator/
guard and production identity/rollback baseline steps succeeded. In the
read-only schema/catalog step, `bash scripts/d1-schema-gate.sh remote` reported
PASS for the exact repository 0001–0038 migration ledger, security/Week and
recipe schema, and foreign keys. The immediately following
`pnpm wrangler d1 execute frigo-db --remote --yes --json --file
schema-gate.sql` returned exit 1; no bounded log error details were emitted.
The failure receipt artifact `production-certification-36101940395-1`
contains a production Worker baseline but **no** `certification.result=PASS`,
catalog, runtime, quick-check, final ledger or complete production readiness
proof. It cannot certify production or prove that D1 already contains the
500-recipe release. No new production credential, migration, deploy or write
was performed.

Root cause of the *workflow design* is independently confirmed in the pinned
Wrangler `3.114.17` code: remote `--file` calls D1 `/import`, which can block
the DB and returns an import summary instead of SELECT rows; remote
`--command` calls D1 `/query`. The exact reason this particular `/import`
call exited 1 was not exposed by the runner, so do not attribute that exit to
an unproven Wrangler-version bug, Cloudflare outage or permission defect.
Merely changing the schema command would still leave two unsafe `--file`
queries for catalog (2 statements) and runtime content (5 statements).

Reviewable repair: `scripts/d1-readonly-query.mjs` accepts only three fixed
generated proof names (`schema`, `catalog`, `runtime-catalog`), checks exact
statement counts and read-only SQL before any request, executes each SELECT
using Wrangler's remote `--command` query path, rejects incomplete/malformed
or unsuccessful JSON and writes an ordered receipt only after all queries
succeed. Production certification now calls it for all three proofs; the
existing production Deploy preflight also uses it for the runtime content
proof. Independent schema/ledger/catalog/fingerprint/integrity verifiers,
immutable exact-main/CI gates and Environment reviewer approval remain
unchanged. Workflow/runner source is fingerprint-pinned and covered by
positive and mutation-negative tests. Wrangler dependency was not upgraded.
Missing workspace sqlite3 CLI was repaired with `.hoplite/setup.sh` (idempotent
apt install plus frozen pnpm install), proven by `sandbox_control setup`.
Tracked `.hoplite/settings.json` was not changed or staged.

Checks: `gh api` run/jobs/artifact GET for `36101940395`; bounded
`gh run view 36101940395 --log-failed`; safe receipt inspection;
`git fetch origin --prune --quiet` and exact-main API (still
`f933f222df992768534283b38d32b358498563d2`); pinned Wrangler local source `--file`/`--command` call-path
inspection; `pnpm wrangler --version` (`3.114.17`); focused Vitest
(5 files / 260 tests PASS); `pnpm lint` PASS; `pnpm typecheck` PASS;
`git diff --check` PASS. Initial `pnpm check:migrations` failed only because
sqlite3 CLI was missing; setup installed it, then
`pnpm check:migrations` PASS (`migration-smoke=ok`). Full `pnpm check`
PASS: lint, typecheck, **191 test files / 4,432 tests**, migration smoke
and build (`ALL CHECKS PASSED SUCCESSFULLY`). Implementation checkpoint:
`399ec9b` (query runner/workflows/tests/setup); handoff docs follow in a
separate checkpoint. No live production query was run by the agent.

Next: review and merge the scoped workflow repair via PR, require green
exact-new-main CI and a fresh exact-SHA staging PASS after merge. Only then
dispatch the read-only production certification on the new main SHA with
approved hardening SHA and required production reviewer; examine the complete
PASS artifact and unchanged production baseline before any separately
authorized migration or rollout. A rerun of old workflow run `36101940395`
would still use the old SHA and cannot certify this repair. T20 remains blocked.

---

# Historical T19 current-main staging certification - 2026-09-25 UTC

**Status: `TAKOSAN_OWNER_TRANSFER_CONTROL_PLANE_MISMATCH` for production
read-only certification dispatch: GitHub App lacks Actions write. Current-main
staging: `PASS`; production certification: `NOT STARTED`; T19 and T20:
`BLOCKED`. No production mutation.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

After the owner updated the staging secret and retried Deploy
`36018964086`, attempt 2 was `SKIPPED` for all three jobs: release/staging/
production had no steps and no candidate artifact for that attempt. This did
not certify staging; the exact reason the historical workflow-run release
condition evaluated false on rerun is unproven. No workflow bypass or main
change was made. The owner then dispatched the **reviewed manual staging path**
as Deploy run `36092413084` attempt 1, event `workflow_dispatch`, on exact
main `f933f222df992768534283b38d32b358498563d2` (`f933f22`), actor `tako-vn1`.

Deploy `36092413084` completed SUCCESS: release SUCCESS, staging SUCCESS,
production SKIPPED. Every staging step completed SUCCESS, including Worker
secret-list preflight (previously Cloudflare code 10000), build, exact-main
CI recheck, staging deploy, exact-SHA receipt, post-deploy smoke and protected
recipe-authority proof. Inspected its attempt-scoped
`release-staging-36092413084-1` artifact: repository
`tako-vn1/Tako-san`, CI `36018278513`, exact deploy and main SHA
`f933f222df992768534283b38d32b358498563d2`, environment `staging`, configured mode `static`, canary `0`,
cutover `false`, actual/global source `static`, served count `71`, release ID
`rel-bd00a4f53fcaeee4`, fallback `null`. Its D1 readiness is `not_evaluated` in
static mode; the 500-recipe production D1 state is **not** certified by this.
Bounded hosted smoke log confirms readiness `ok`, database `ok`, environment
`staging`, authority proof PASS, no fallback and smoke PASS.

The GitHub commits API and refreshed `origin/main` still match that staged
release. The existing Production Read-Only Certification workflow is active,
manual/main-only, and gated by the `production` Environment, which still lists
required reviewer `vn-taphoanhatung`. Prepared its immutable full `ref` and
approved `hardened_sha` from the verified staging receipt (no synthetic SHAs).
`gh workflow run .github/workflows/production-certify.yml -R
tako-vn1/Tako-san --ref main -f ref=<receipt.sha> -f
hardened_sha=<receipt.hardenedSha> -f
confirm_read_only_certification=true` was refused before dispatch: HTTP 403
`Resource not accessible by integration`. No certification run exists and no
production D1/Worker/ledger/rollback facts have been verified. Do not call
staging PASS a production certification.

Next: owner uses the GitHub Actions UI to run **Production Read-Only
Certification** from `main`, entering the exact full `sha` and `hardenedSha`
from run `36092413084` artifact `release-staging-36092413084-1`
(`release-manifest.json`), with `confirm_read_only_certification=true`.
The Environment's required reviewer must approve that **read-only** job; never
bypass approval. Inspect the resulting PASS receipt (`readOnly=true`,
`productionMutations=[]`) and live account/Worker/D1/ledger/catalog/integrity
before any migration or rollout. If the UI cannot dispatch or the certificate
fails, hold and report the specific gate. T20 remains blocked.

Executed checks: `gh api` run/attempt/job/artifact GETs for `36018964086`
and `36092413084`; `gh run download 36092413084` for candidate and staging
receipt into temporary directories with explicit safe-field inspection;
`gh run view 36092413084 --log` filtered to smoke/authority markers;
`git fetch origin --prune --quiet`; exact-main GitHub commits API and CI
`36018278513`; production Environment reviewer and certification workflow
GETs; `gh workflow run production-certify.yml` (HTTP 403, no run).
No local tests were rerun because application/workflow code did not change.

---

# Historical T19 staging retry permission checkpoint - 2026-09-25 UTC

**Status: `TAKOSAN_OWNER_TRANSFER_CONTROL_PLANE_MISMATCH` (installation
cannot rerun GitHub Actions). Staging secret update reported by owner but not
independently readable. T19 and T20: `BLOCKED`. No production mutation.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

Owner reported securely creating and setting the staging Cloudflare API token
on 2026-09-25. GitHub Environment secret metadata is still inaccessible to
this installation (`gh secret list -R tako-vn1/Tako-san --env staging`: HTTP
403), so token type, scope, value and update time cannot be independently
verified here. The only safe test is the existing fail-closed staging workflow.
`git fetch origin --prune --quiet`, repository/commit API and CI run
`36018278513` confirm same canonical ID, main `f933f222df992768534283b38d32b358498563d2`, protected
`validate` SUCCESS. Latest Deploy `36018964086`, event `workflow_run`, SHA
`f933f222df992768534283b38d32b358498563d2`, had release SUCCESS, staging FAILURE on Cloudflare code 10000,
production SKIPPED. It remains `run_attempt=1`. The reviewed Deploy workflow
on `origin/main` matches the local file. A full-run retry (necessary to
regenerate the attempt-scoped release artifact) using
`gh run rerun 36018964086 -R tako-vn1/Tako-san` failed immediately:
`run 36018964086 cannot be rerun; Resource not accessible by integration`.
Re-read run metadata: attempt 1 still complete/failed. **No staging or
production deployment was initiated in this retry.** Local OAuth is scoped to
user/account read only; `pnpm wrangler secret list --config
wrangler.staging.jsonc --format json` also cannot read Worker metadata (`No
access to the specified resource`). No ad-hoc deployment was attempted.

Next authorized action: owner opens
`https://github.com/tako-vn1/Tako-san/actions/runs/36018964086` and selects
**Re-run jobs → Re-run all jobs** (not failed jobs only, to recreate the release
artifact). This original `workflow_run` event was triggered by successful
push/main CI and can only run staging; production's YAML gate requires a
separate manual production dispatch. After owner initiates the retry, read
run attempt/job/artifact and exact-SHA staging authority/smoke receipt before
any production certification. If the retry again fails, inspect the bounded
failed step and hold. Do not create a docs-only main commit as a substitute
for missing Actions write; do not start T20.

Checks this checkpoint: `git fetch origin --prune --quiet`;
`git diff origin/main -- .github/workflows/deploy.yml` (no diff);
`gh api repos/tako-vn1/Tako-san` (ID/default branch);
`gh api repos/tako-vn1/Tako-san/commits/main --jq .sha`;
`gh run view 36018278513`; `gh run list --workflow Deploy`;
`gh api repos/tako-vn1/Tako-san/actions/runs/36018964086` (attempt 1);
`gh secret list -R tako-vn1/Tako-san --env staging` (403);
`gh run rerun 36018964086 -R tako-vn1/Tako-san` (permission denied);
read-only Wrangler `whoami` and Worker secret-list probe (access denied).
Application code/workflows unchanged; no local app tests run.

---

# Historical T19 Cloudflare login checkpoint - 2026-09-25 UTC

**Status: `TAKOSAN_STAGING_CLOUDFLARE_TOKEN_REQUIRED`. T19: `BLOCKED`;
T20: `BLOCKED`. No staging credential was replaced or deployment dispatched;
production unchanged.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

Follow-up after owner authorized the agent to proceed (2026-09-25 UTC):
`credential_control rotate` minted a fresh authorized GitHub installation
credential for this repository, but `gh api
repos/tako-vn1/Tako-san/environments/staging/secrets` and the Actions policy
GET still return HTTP 403 (`Resource not accessible by integration`). Cloudflare
`pnpm dlx wrangler@4.119.0 whoami` still reports only `user:read`,
`account:read` and `offline_access`; no `CLOUDFLARE_API_TOKEN` is available in
the workspace and Wrangler offers no `API Tokens Write` OAuth scope. `gh api
repos/tako-vn1/Tako-san/commits/main --jq .sha` remains `f933f222df992768534283b38d32b358498563d2`; the
latest Deploy remains failed run `36018964086`. The owner's authorization does
not itself change service-issued permissions. No token creation, GitHub secret
write or workflow dispatch was attempted. Continue only after an approved
Cloudflare token-management credential **and** GitHub Environment Secrets write
permission are actually available through an authorized integration, or after
the owner securely creates the dedicated token and updates the staging secret
in the two providers' dashboards. Never request or paste credentials in chat.

The owner approved a fresh Cloudflare device login using transient Wrangler
`4.119.0`, without changing the repository-pinned Wrangler. The command
`pnpm dlx wrangler@4.119.0 login --device --browser=false --scopes user:read account:read`
succeeded. A sanitized `pnpm dlx wrangler@4.119.0 whoami` confirmed the account
ID matching the earlier deployment record (`ef250a88911fd24073cb73d1c07e0218`); the granted OAuth
scopes are `user:read`, `account:read` and `offline_access`. This is **not**
authorization to manage API tokens or Workers. Cloudflare's `POST /user/tokens`
requires `API Tokens Write`; Wrangler device OAuth does not offer that scope.
The login token must not be copied into a GitHub secret as a durable deployment
credential. No Worker secret metadata, staging D1 identity or deployment was
verified through this limited OAuth session. The managed GitHub App CLI can
access the canonical repository but is not a user CLI session; its inability to
return `gh api user` does **not** establish that the owner lacks a GitHub browser
login. Earlier `TAKOSAN_GITHUB_LOGIN_REQUIRED` wording below is historical and
was too strong as a claim about the owner's browser session.

Current `main` remained `f933f222df992768534283b38d32b358498563d2` (`f933f22`) by GitHub commits API.
Exact-main CI `36018278513` passed, but Deploy `36018964086` still failed
staging preflight with Cloudflare authentication code `10000`; no current-main
staging certification exists. Owner action needed: in the Cloudflare dashboard
create a **dedicated durable staging** API token limited to the deployment
account and Worker-scripts write access (which covers the secret-list read and
upload operations), then set **only** the GitHub `staging` Environment
`CLOUDFLARE_API_TOKEN` through a secure secret-management UI. Do not place the
value in chat, a terminal log, docs or repository files. The current installation
cannot read or edit GitHub Environment secrets. Verify the token's actual scope
and staging account/Worker/D1 identity before retrying the reviewed Deploy path;
do not touch the other staging secrets or production. T20 stays blocked.

Checks: `pnpm dlx wrangler@4.119.0 --version` (4.119.0), `login --help`
(`--device` available), `login --scopes-list` (no token-management scope), device
login and sanitized `whoami` PASS; `gh api repos/tako-vn1/Tako-san/commits/main
--jq .sha` returned `f933f222df992768534283b38d32b358498563d2`; `gh auth status` shows managed installation.
`git status --short --branch` showed only pre-existing untracked `.context/`.
`git diff --check` and assertions for all three current T19 document identities,
blockers and historical records passed. No application tests were rerun,
because code and workflows were not changed.

---

# Historical T19 owner-transfer takeover - 2026-09-24 UTC

**Status: `TAKOSAN_GITHUB_LOGIN_REQUIRED`; staging also requires a durable
Cloudflare API token. T19: `BLOCKED`. T20: `BLOCKED`. No production mutation was
performed in this takeover.**

`canonical_repository=tako-vn1/Tako-san`
`canonical_repository_id=1385308553`

The owner was transferred from `vn-tako4` to `tako-vn1`; the numeric repository
ID and Git history were preserved. `origin` already points to
`https://github.com/tako-vn1/Tako-san.git`; `git fetch origin --prune` and the
GitHub commits API agree that current `main` is `f933f222df992768534283b38d32b358498563d2` (`f933f22`),
also the local branch base. PRs #1-#3 remain merged in this repository, and the
CI run's repository and head-repository both identify ID `1385308553`.

The workspace's managed `gh` installation reports account `x-access-token`,
not a user session as `tako-vn1`; `gh api user --jq .login` returns HTTP 403
(`Resource not accessible by integration`). Do not log out or overwrite the
managed installation token. A human-approved `tako-vn1` user login in an
authorized CLI context is still needed to satisfy the requested account gate.
The current installation also gets HTTP 403 reading Actions policy, workflow
token permissions, full branch-protection settings, repository/environment
variable names, repository/environment secret names, and webhooks; app
installation lookup returns HTTP 401. Their post-transfer settings/secret names
are **unverified**, not presumed missing. The accessible branch endpoint says
`main` is protected and requires the GitHub Actions `validate` check (App ID
15368); visible repository rulesets and effective branch rules return `[]`.
Both Environments exist. Production still lists required reviewer
`vn-taphoanhatung`, whose repository permission API reports `write`; staging has
no reviewer gate. Re-audit inaccessible policy and secret inventory with owner
authorization before release.

Exact-main CI `36018278513` (`push/main`, SHA `f933f222df992768534283b38d32b358498563d2`) passed `validate`:
ESLint, typecheck, 190 test files / 4,415 tests, migration smoke and build.
Last successful staging receipt was Deploy `36009510442` at
`d6204d91b1849bf98df89c1c590e74395c494c89` (release/staging SUCCESS, production SKIPPED); that receipt
does **not** certify current main. Latest Deploy `36018964086` at
`f933f222df992768534283b38d32b358498563d2` has release SUCCESS, staging FAILURE, production SKIPPED.
Its failed step, `Require staging proof configuration before deployment`,
shows Wrangler's read-only `/workers/scripts/frigo-staging/secrets` request
rejected with Cloudflare authentication code `10000`. Build, exact-head recheck,
Cloudflare deployment and smoke were skipped. Do not claim that current main was
deployed. No Cloudflare credential or Wrangler OAuth session is available in
this workspace; no staging token was created or replaced, and no Cloudflare
account/Worker/D1 identity was remotely verified here. Pinned configuration
names `frigo-staging` / `frigo-db-staging-v3` and production `frigo` /
`frigo-db`; the current catalog manifest expects 500 recipes (71 static).

Read-only checks: `gh auth status`; `git remote -v`; `git fetch origin --prune`;
`gh api user --jq .login` (HTTP 403); `gh api repos/tako-vn1/Tako-san`;
`gh api repos/tako-vn1/Tako-san/commits/main --jq .sha`;
`gh api repos/tako-vn1/Tako-san/branches/main`; Environment, reviewer,
Actions policy, protection, rules, variable and secret-name GETs (limitations
above); `gh run view 36018278513` and `36018964086` including job steps and
failed logs; `gh run list --workflow Deploy`; `git status --short`; release
manifest and Wrangler config inspection. No local test/build was executed:
application and workflow code were not changed. `git diff --check` passed;
`python3` assertions passed for current identity, T20/blocker markers and
preserved historical references in all three current operational docs.

Next: establish the `tako-vn1` CLI identity through approved browser login;
with authorized Cloudflare access, issue a dedicated durable staging API token
with only reviewed workflow permissions, verify account/Worker/D1 identities,
and replace **only** the staging Environment `CLOUDFLARE_API_TOKEN`. Re-audit
inaccessible owner-transfer controls, then re-run the existing reviewed Deploy
path for exact current main and require staging PASS before requesting the
production read-only certification/Environment approval. Do not start T20.

---

# Historical pre-transfer T19 release-control snapshot - 2026-09-25

**Status: `TAKOSAN_STAGING_BLOCKED`. Exact-main CI: `GREEN`.
Production: `UNTOUCHED`.
T20: `BLOCKED`.**

The canonical repository is `vn-tako4/Tako-san` (ID `1385308553`). PR #1,
`ops(t19): add fail-closed production read-only certification`, merged normally
from `ops/t19-production-cert-pr-prep` into `main` at `2026-09-24T13:55:01Z`.
Its reviewed head was `0899c49a28906d09f1a51b8afe2c72e09c860f18`; the T19
application merge commit is `d6204d91b1849bf98df89c1c590e74395c494c89`, with
parents `a4b5d726` and `0899c49a`.

PR-head CI run `36007943241` passed `validate`. Real exact-main CI run
`36009002161` was created at `2026-09-24T13:55:05Z`, four seconds after the merge,
with event `push`, branch `main`, and exact SHA `d6204d91`; it passed lint,
typecheck, 190 files / 4,415 tests, migration smoke and build. The earlier
observation that this SHA had zero runs was a stale post-merge snapshot taken
before GitHub created the run, not a scheduler or control-plane defect. The merge
actor was the human account `vn-tako4`; the active CI workflow already existed on
pre-merge main, its `push` filter included `main`, no skip directive was present,
Actions was enabled with allowed actions `all`, and strict required context
`validate` remained bound to the GitHub Actions App.

Successful exact-main CI automatically triggered Deploy run `36009510442` through
the reviewed `workflow_run` path. The release and staging jobs succeeded and the
production job was skipped. Its machine receipt proves deployed SHA `d6204d91`,
environment `staging`, recipe mode `static`, canary `0`, cutover `false`, actual
and global source `static`, 71 served recipes and `fallbackReason=null`. No manual
Deploy dispatch was used.

Documentation recovery PR #2 merged at
`a86ed095ba77d1e3e1ba549ee5b28240d50ba731`. Exact-main CI run `36016668591`
was created two seconds after that merge and passed `validate`. Deploy run
`36017207468` was then created automatically through `workflow_run`; its release
job passed and production was skipped, but staging failed closed before build or
deployment. Wrangler's read-only Worker-secret lookup returned Cloudflare
`Authentication error [code: 10000]` for the stored GitHub staging
`CLOUDFLARE_API_TOKEN`. The three staging secret names are present, and the local
Wrangler OAuth session can refresh and list the existing Worker
`RELEASE_VERIFY_TOKEN`; therefore the stored GitHub access-token snapshot is no
longer valid. No `a86ed095` deployment occurred. Staging remains healthy on the
previous exact deployment `d6204d91`, with public readiness `ok`, database `ok`,
mode `static`, canary `0`, cutover `false` and null fallback.

The T19 production read-only certification workflow remains available but was not
dispatched. Production deploy, production D1 migration, production secret
mutation, production traffic change and rollback remain `NONE`. T20 remains
blocked. Existing dependency-audit findings, the Wrangler OAuth credential that
must be replaced with a dedicated durable least-privilege token, and `usehoplite`
queued suites with zero check runs remain separate residuals; none is the
protected `validate` context.

Next: provision a durable staging Cloudflare API token through authorized
Cloudflare controls, replace only the staging Environment
`CLOUDFLARE_API_TOKEN`, and re-run the reviewed automatic staging path against the
same exact-main lineage. Handle production prerequisites and Production Read-Only
Certification as a separate, explicitly authorized task. Do not start rollout or
T20 automatically.

---

# Historical T19 production read-only certification workflow - 2026-09-23

**Status: `T19_V2_PRODUCTION_CERT_WORKFLOW_PR_PENDING`. Production: `UNTOUCHED`.**
Repository `1368281478` resolves to `vn-tako4/Frigo-dev`; starting main is
`a4b5d7268537e88c3d2e31d418fc2e3691597b80`, with exact-main CI `35817133131`
PASS. Deploy `35817440484`, attempt 2, is SUCCESS: release/staging passed and
production was skipped. Its machine receipt proves exact-main staging in
static/0/cutover=false, static source, 71 served recipes, release
`rel-bd00a4f53fcaeee4`, null fallback. Staging D1 readiness is `not_evaluated`,
not production D1 certification. Earlier secret-blocker entries below are historical.

Added `.github/workflows/production-certify.yml`: manual dispatch on main only,
explicit read-only confirmation and approved hardening SHA, existing release
gate/exact-SHA CI, pinned checkout, production Environment approval, and read-only
GitHub permissions. It reuses the existing config/identity/schema/catalog/runtime/
integrity verifiers without changing application, migration or release tooling.
Only metadata reads, guarded SELECTs (including the existing schema CTE), and
`foreign_key_check`/`quick_check` are executed remotely. Worker/account/binding
proof captures a future rollback baseline without changing traffic. Final ledger,
Worker stability and current-main/CI rechecks precede the PASS receipt.

Only `release-manifest.json` is uploaded. Raw identity/binding/catalog data stay
in the Actions workspace; account identity is hashed in the receipt. Authority
remains `UNKNOWN_RELEASE_SECRET_NOT_AVAILABLE`: this path does not request the
verification secret and does not certify the production secret pair. A PASS is
read-only evidence, not rollout authorization. The existing Cloudflare credential
may have broader privileges; the safety guarantee is the reviewed command/SQL
surface and regression guard, not a new IAM restriction. SQL filtering is
conservative, not a general-purpose SQL parser. Certification shares Deploy's
production concurrency group; migration workflow remains unchanged. Operators
must not run that separate migration workflow during certification: the final
ledger check is point-in-time evidence, not a lock against subsequent mutations.

Verification executed: `pnpm install --frozen-lockfile`; `pnpm lint`;
`pnpm typecheck`; `node scripts/d1-migration-check.mjs config`; and
`pnpm exec vitest run tests/unit/production-certify-workflow.test.mjs
tests/unit/release-check.test.mjs tests/unit/d1-migration-check.test.mjs
tests/integration/d1-schema-gate.test.ts` (**236/236**, including 41 workflow
safety tests). `pnpm check:migrations` initially failed because sqlite3 was
absent; applying the existing `.hoplite/settings.json` sqlite setup repaired it.
Repeated migration smoke and `pnpm build` PASS; `git diff --check` and `bash -n`
on all eight workflow shell blocks PASS. The additional `pnpm test` full-suite
attempt exceeded the 600-second sandbox command budget (exit 124); it is not
claimed as a pass. Focused checks above were rerun on the final workflow. Hosted
PR-head CI remains required for the complete suite. No Cloudflare calls, deploy,
migration, secret change, rollback or other production mutation was performed.

Publication attempted from `hoplite/akanthos-df8cfb50` at local implementation
commit `aee4e2e`. `git push origin HEAD:hoplite/akanthos-df8cfb50` was rejected:
GitHub refuses a GitHub App creating/updating
`.github/workflows/production-certify.yml` without `workflows` permission.
The subsequent `gh pr create` failed because the remote head branch does not
exist. **No PR exists and no new hosted CI ran.** No alternate publication route
was attempted. Local work is retained; no default-branch change occurred.

Next: an operator must grant/approve Workflows write permission for the authorized
repository GitHub App installation, then retry this branch push and narrow PR.
Do not provide credentials in chat or bypass the App. Require exact-head hosted
CI and review; an authorized maintainer must merge. Then require new exact-main
CI and dispatch only Production Read-Only Certification
with that full SHA, the owner-approved hardening SHA and confirmation. Respect
production Environment review. Do not dispatch Deploy or Production D1 Migration.
Production rollout remains blocked until live certification and its separate
prerequisites pass. T19 is incomplete; T20 NOT STARTED.

---

# Release-secret provisioning receipt - 2026-09-23

**Status: `T19_V2_RELEASE_SECRET_PROVISIONING_BLOCKED`. Production: `UNTOUCHED`.**
Repository ID `1368281478` resolves to `vn-tako4/Frigo-dev`; `origin/main` is
`c0c8e82ac9bdb3167de4e5774c90cbd364b5ff92` (PR #54 merge), unchanged since exact-main CI
`35815588844` PASS. Current `.github/workflows/deploy.yml` requires, before any
staging deployment, GitHub effective secret `STAGING_RELEASE_VERIFY_TOKEN`
(>= 32 chars) plus staging Worker `frigo-staging` secret `RELEASE_VERIFY_TOKEN`;
production requires GitHub effective `RELEASE_VERIFY_TOKEN` plus the production
Worker `RELEASE_VERIFY_TOKEN`.

Automatic Deploy run `35815905652` (head `c0c8e82`): release job SUCCESS,
staging job FAILED at "Require staging proof configuration before deployment",
production skipped. Runtime evidence from that job (not a 403 inference): the
step env rendered `RELEASE_VERIFY_TOKEN` empty while `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` rendered masked, so GitHub effective
`STAGING_RELEASE_VERIFY_TOKEN` is MISSING and Cloudflare credentials are PRESENT
in the staging Environment. Staging Worker `RELEASE_VERIFY_TOKEN` is UNKNOWN
(preflight stopped before `wrangler secret list`; this workspace has no
Cloudflare credential). GitHub secret metadata reads return HTTP 403 and this
installation cannot write secrets, so neither half of the pair can be
provisioned here. Operator action: generate one >= 32-byte random value, set it
as GitHub staging `STAGING_RELEASE_VERIFY_TOKEN` and as `frigo-staging` Worker
`RELEASE_VERIFY_TOKEN` (never paste it in chat/PRs), then re-run the failed
staging job of run `35815905652` (or the automatic run on the then-current
main) through the reviewed workflow. Merging this docs receipt moves main, so
the exact-main SHA must be re-certified before that new SHA is released. No
deployment, migration, secret change, rollout or rollback was performed.

---


# Current takeover receipt - 2026-09-23

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


# Frigo / Takosan current authority — 2026-09-22

## T19 V2 — one recipe authority + 500-recipe D1 cutover (integration)

**Current: `T19_V2_APPLICATION_INTEGRATED_CI_PENDING`.** Stable repository ID
`1368281478` resolves to `vn-tako3/Frigo-dev`; canonical main/integration base
is `a3b1564`. The immutable original branch
`feat/t19-recipe-authority-cutover-v2` is published at `0a04209`, exactly the
expected safe-stop head, and application checkpoint `558be74` was cherry-picked
onto `feat/t19-recipe-authority-cutover-v2-integration` without replaying its
obsolete safe-stop documentation. PR #52 is merged historical documentation.

The integrated application makes Meal Planner use the same
`resolveRecipeAuthority` snapshot as Recipe API/Week/Shopping/Cooking,
authority-scopes catalog fingerprints, persists stored-plan authority identity,
reports typed `CATALOG_AUTHORITY_CHANGED` revalidation, accepts only reviewed
`static|shadow|canary{1,2,5,25}|d1` release states, and exposes protected
machine-verifiable authority evidence. Planner recipe content and steps come
from the authority snapshot in every mode; D1 supplies only fenced planner
enrichment under D1 authority. Current-tree verification: full Vitest **189
files / 4,364 tests PASS** (run A); the final rerun (run B) passed 4,363 with
one 5 s contention timeout in the unrelated T13 real-D1 file, which passed
22/22 in isolation; focused authority/planner/release/shopping/cooking/
inventory matrix 13 files / 356 PASS plus 23 snapshot/persistence tests after
the last cleanup; release-check 155, D1 certification 32 and Worker rollback 10
unit tests PASS; `pnpm lint`, both `pnpm typecheck` configs,
`pnpm check:migrations`, `pnpm recipe:import:check` (500 recipes,
`rel-bd00a4f53fcaeee4`), `pnpm build` and `git diff --check` PASS. The
Wrangler-shaped `release-certify` fixture proves tip
`0037_recipe_catalog_scale.sql` with 500 recipes, clean foreign keys and
`quick_check=ok`.

Final hardening (two independent review passes): stored plans detect
same-source authority fingerprint drift; static planning reads no D1 rows and
hidden D1-only recipes/ingredients/families cannot alter its identity; the
protected route requires a real `Bearer` scheme; canary and shadow release
probes exercise D1 truthfully, so `shadow → canary-1` needs proven D1
readiness and the release fingerprint. Production Deploy certifies the
committed `wrangler.jsonc` binding, Cloudflare account + `frigo-db` identity,
the migration ledger, catalog identity (exact ordered IDs, zero duplicate
IDs/slugs, `runtime_order`), `foreign_key_check` and `quick_check` read-only
before mutation; requires the release ref to equal current main, rejects
backwards SHAs and stale/skipped/reverse promotions, requires explicit
rollback/bootstrap intent, proves the previous and deployed Worker versions
bind the pinned D1, and on failure or cancellation restores the exact previous
version through the Cloudflare API with a complete evidence proof. Staging is
fail-closed on `STAGING_URL`, `STAGING_RELEASE_VERIFY_TOKEN` and the staging
Worker secret.

**Safe stop 2026-09-23.** The integration branch (application checkpoints
`8205883` + `553791a` plus the docs commit) is **publication-blocked**: the
repository's GitHub App credential cannot push workflow-changing commits
(`refusing to allow a GitHub App to create or update workflow
`.github/workflows/deploy.yml` without `workflows` permission`). Workflow
changes were not stripped and no partial branch was created. Workspace-only
recovery artifacts: `.artifacts/t19-current-safe-stop.bundle` (complete
history) and `.artifacts/t19-current-safe-stop.patch`, with SHA-256 values in
`.artifacts/t19-current-safe-stop.sha256`. The original
branch remains published and immutable at `0a04209`. Hosted application CI has
not run. Production is untouched: no D1 query/migration, secret/config change,
deploy, rollout or rollback. Next: publish with a workflows-capable credential,
open the application PR, obtain exact-head hosted CI/review, merge and certify
exact main before any production action. T20 remains blocked until
`T19_COMPLETE`.
Canonical handoff:
[T19_V2_WIP_HANDOFF.md](recipe-catalog/T19_V2_WIP_HANDOFF.md); architecture:
[T19_V2_RECIPE_AUTHORITY_CUTOVER.md](recipe-catalog/T19_V2_RECIPE_AUTHORITY_CUTOVER.md)
and ADR-030.

## Google Safari profile recovery + registration-only Turnstile

Production base `8dc9198918837cb15f4a7ddf4f9029875b015091` was reproduced with
WebKit: a blocked first load of `accounts.google.com/gsi/client` left the
normal profile controlled by the Takosan service worker, while a clean/private
profile rendered Google GIS. The failing profile emitted
`FetchEvent.respondWith received an error: Returned response is null`; removing
the service worker/cache recovered the button immediately. The candidate fix on
`codex/google-safari-turnstile` makes the PWA fetch handler return before every
cross-origin request, so Google GIS and Cloudflare Turnstile are owned directly
by the browser. Same-origin cache misses now reject instead of resolving an
invalid null response.

Turnstile remains mandatory and fail-closed for account registration, including
the production configuration gate. It is no longer rendered or submitted for
login, forgot-password, or OTP resend. Those routes retain the shared auth rate
limit; resend keeps its 60-second email/purpose cooldown, and register/login
resend now no-ops truthfully for missing or already verified accounts instead of
mailing arbitrary recipients.

Validation: focused auth/PWA/browser-security **124 tests PASS**; full Vitest
**185 files / 4242 tests PASS**; lint, typecheck, migration smoke, production
build, and `git diff --check` PASS. A production-origin WebKit smoke against the
built candidate, with an active service worker and the first GIS request
blocked, recovered after the built-in retry: Google button visible at 362x44,
warning cleared, zero Turnstile frames on login, one on registration. The
unchanged dependency audit reports two moderate React Router advisories fixed
only in React Router 7.18+. No migration, secret, DNS, PayOS/payment, D1, KV,
R2, or queue mutation is part of this change. Detailed evidence:
[GOOGLE_SAFARI_TURNSTILE_RECOVERY.md](GOOGLE_SAFARI_TURNSTILE_RECOVERY.md).

## T18E — `T18E_OTP_TEST_RECIPIENT_REQUIRED`

Repository ID `1368281478` resolves to `vn-tako1/Frigo-dev`; exact starting
main and production are `66627ffea890dad1cec4e31674449775a940c660`.
Branch `feat/t18e-otp-email-delivery-recovery` contains the provider router,
fail-closed auth, readiness semantics, and regression coverage. Production is
unchanged.

The production `SEND_EMAIL` binding is present, but current sender authority
and the exact failure category could not be read with the available Cloudflare
OAuth scopes. The operator-authorized production `RESEND_API_KEY` secret is now
present and authenticates successfully without its value being printed or
stored. The operator completed the DNS correction; Resend now reports
`tungjpstore.net`, DKIM, and both SPF-purpose records as verified. T18E does not
fabricate a primary root cause: current Workers Email sender authorization
remains UNKNOWN until an operator verifies the account or a sanitized
production event is captured.

Code now classifies and logs provider failures without recipient/OTP/body data,
falls through from Workers Email to Resend, distinguishes Resend quota/rate/
sender/recipient failures, invalidates production OTPs even after an unexpected
router exception, and reports readiness as `providerConfigured` separately from
`deliveryVerified=false`. Registration, resend recovery, reset
anti-enumeration, single use, expiry, cooldown, Turnstile, digest-only storage,
and production `devOtp` suppression remain intact. No Google file changed.

Focused auth/email coverage is **6 files / 165 tests PASS**; full Vitest is
**185 files / 4238 tests PASS**. Lint, typecheck, migration smoke and build pass.
The unchanged dependency audit baseline still reports 21 advisories / 6 high.
Review-only [PR #50](https://github.com/vn-tako1/Frigo-dev/pull/50) is OPEN;
publication head `eec404a` passed hosted validate run `35685553412` and was
`MERGEABLE` / `CLEAN`. Final docs publication requires its own exact-head CI.
No migration, workflow, merge, staging, production deploy, or real email was
performed. The only production mutation was the explicitly authorized
`RESEND_API_KEY` secret upload; the operator separately completed Resend DNS
verification. Next: confirm Cloudflare sender authorization, supply an
authorized test inbox, and complete staging then separately authorized
production delivery verification. Full evidence:
[T18E_OTP_DELIVERY_RECOVERY.md](T18E_OTP_DELIVERY_RECOVERY.md).

## T18D — `T18D_READY_FOR_REVIEW`

Stable repository ID `1368281478` verified as `vn-tako1/Frigo-dev`;
main/base `07ace57241f8270b2458610979c709bb69b9a65a`, CI #151 (`35584884792`) success,
Deploy #53 (`35585265322`) staging success / production skipped. Branch
`feat/t18d-a11y-human-style-hardening` was created from that exact base and
pushed; implementation freeze is `d3ef61c`. No business/server changes.

The four original human-style findings are fixed. Seven additional scoped P2
findings are also fixed; independent review open P0/P1/P2 = **0/0/0**. The
27-screen review is **14 PASS / 13 PASS_WITH_NOTE / 0 FAIL**. Two P3
observations remain deliberately deferred. Human-style semantic review,
keyboard interaction review, and accessibility-tree/ARIA review were performed;
VoiceOver and NVDA were not performed.

Final focused evidence is **14/14 PASS** in **42.8s**, with strict axe
violations **0**;
log: `.hoplite/artifacts/t18d/final/focused.log`. Final
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:migrations`, and
`pnpm build` logs all pass; Vitest is **185 files / 4226 tests** in **333.25s**:
`.hoplite/artifacts/t18d/final/{lint,typecheck,test,check-migrations,build}.log`.
Fresh style/contrast reruns pass: **39 allowlisted / 0 unjustified** and
**33/33**. Lint/typecheck also pass after the test-only settling correction.

The second full matrix was stopped at approximately case 158 after
`t17-a11y.e2e.ts` sampled scan-review entrance opacity and receipt enable-state
before settle; the error context is retained. The parent patched the test to
wait 350ms **after** async CTAs become enabled, matching the T18C settled-state
convention; no axe rule or design token changed. The settled matrix passed
**349 cases / 5 intentional skips / 0 failures** (354 total, 23.3m) with log
`.hoplite/artifacts/t18d/final/matrix-settled.log` and artifacts under
`.hoplite/artifacts/t18d/final/matrix-settled/`.

All **84 T18D cases PASS**; 162 canonical axe checks have **0 violations**.
The five skips are duplicate project instances of the breakpoint sweep,
which passes once in mobile-390. Axe contrast incomplete records are retained,
not silently treated as passes. Full breakdown/commands are in the T18D report.
[PR #49](https://github.com/vn-tako1/Frigo-dev/pull/49) is OPEN, review-only,
from this branch to unchanged `main`; publication checkpoint `fe1b5d4` matched
remote (6 ahead / 0 behind main, 0/0 vs upstream). Hosted `validate` initially
IN_PROGRESS in run `35677663372` at 01:57 UTC; no review threads then.
CI/review auto-fix enabled; auto-merge disabled. This receipt is doc-only.
Next: inspect settled CI/review feedback. Do not merge or deploy. Existing
`.hoplite/settings.json` modification remains preserved and excluded; T18D
changes are committed, but the overall worktree is therefore not clean.

## Previous T18C receipt (historical; PR #48 is now merged)

**Current: T18C_READY_FOR_REVIEW.** Local certification is complete on
application freeze `6f8f6f40bb2c47dacd33670ac7397b0528b469a8`. Repository ID
`1368281478` resolves to `vn-tako/Frigo-dev`; existing branch
`feat/t18c-final-redesign-certification` retains the correct upstream and
unchanged base `b8447e85f099b800a9a8ebc6c4c137adc9e45a32`.

- Approved ZIP checksum verified; **27/27 direct board/contract comparisons**,
  fresh at 360/390/430/768/1024/1440. Final dispositions: **2 PASS / 25
  PASS_WITH_DOCUMENTED_DIFFERENCE**; no blocked/failed screen or unresolved
  P0/P1/P2. Baseline and pre-fix evidence remain separate and unchanged.
- Browser manifest: **379 PASS / 11 intentional skips / 390 unique cases**,
  162 canonical + 449 regression screenshot files, zero strict axe violations
  and zero horizontal overflow. Three outer-command timeouts required five
  recovery passes; this was not one uninterrupted green runner exit.
- Serial final gates: `pnpm lint`, `pnpm typecheck`, `pnpm test` (**184 files /
  4222 PASS**, 554.62s), `pnpm check:migrations`, `pnpm build`,
  `node scripts/t17/style-residuals.mjs` (39/0),
  `node scripts/t17/contrast-audit.mjs` (33/33), `git diff --check`, and
  `git diff --check origin/main...HEAD` PASS. Completed 08:23:33 UTC.
- Failure history retained: genuine Home 200%-text P2 fixed at the freeze,
  12/12 focused rerun, interrupted resource-contended CLI-timeout attempt,
  and exact five-case outer-timeout recovery. No coverage or timeout weakened.
- Protected auth/payment/domain/backend/schema/workflow/production boundaries
  remain intact. VoiceOver and NVDA **NOT PERFORMED**; axe incomplete records
  remain visible. No live-provider transaction or remote migration.
- Evidence/report: `T18C_VISUAL_CERTIFICATION.md` and
  `.hoplite/artifacts/t18c/EVIDENCE.md`; published checkpoint `321824d`.
  [PR #48](https://github.com/vn-tako/Frigo-dev/pull/48) is OPEN against `main`,
  auto-merge disabled, CI/review auto-fix enabled. Hosted `validate` **SUCCESS**
  on `289d80a`, run `35578662531`, completed 2026-09-21 08:40:02 UTC.
  Final readiness audit: no unresolved review threads, `MERGEABLE` / `CLEAN`,
  no introduced migration/configuration follow-up. Style (39/0), contrast
  (33/33), worktree/base diff checks and unchanged-source boundary checks PASS.
  This receipt changes documentation only. Next: owner merge permission after
  the latest-head CI remains green; do not merge automatically.
  No merge, deploy or T18D. Preserve uncommitted
  `.hoplite/settings.json` and extracted reference files as workspace state.

## Historical continuation checkpoints (superseded by the result above)

### Text-zoom follow-up — final browser gate found one P2

The complete 390-case run ended **378 passed / 11 intentional skips / 1
failed**: Home overflowed 46px at 1024px with 200% text zoom. The fixed
breakpoint grid kept two narrow columns after rem-scaled sidebar/text growth.
Home now uses wrapping, rem-based flex regions, preserving the wider primary
region at normal sizes. The original zoom gate and an added explicit Home
stacking assertion pass at all six widths: **12/12**. No gate was weakened.
The previous final artifacts will remain separate as `pre-zoom/`; regenerate
all six projects against isolated per-run in-memory Preview servers and rerun
all repository gates before final certification/PR.

### Final repository gates — PASS (application freeze `b024b0d`)

Fresh unfiltered `pnpm test`: **184 files / 4222 tests PASS** (818.46s).
`pnpm lint`, `pnpm typecheck`, `pnpm check:migrations`, `pnpm build` and
`git diff --check` PASS. Style audit: **39 allowlisted / 0 unjustified**;
contrast: **33/33 PASS**, one informational border pair. The only post-freeze
maintenance is license trailing-whitespace normalization and its regeneration
script; all five font checksums remain unchanged. The final browser run and
fresh visual review remain in progress; no PR/merge/deploy yet.

### Keyboard closure / final-gate checkpoint

Strict T17 target-size follow-up: added existing `tap-target` bounds to new
native brand/title controls; no target assertion was relaxed. Focused
mobile-360 accessibility + gap + flag-off Week run: **14 passed / 1 intentional
boundary-project skip**. The failed full attempt is retained separately;
final clean gate/matrix regeneration restarts after this bounded correction.

Review follow-up: non-recipe legacy Week cards have no detail destination;
their new title buttons were removed rather than advertising a no-op. Existing
choose/change controls remain. Regression **2 red → 5/5 green**; flag-off
routed browser setup **1/1 PASS**. Independent re-review: no remaining P0/P1/P2.
The 384-case attempt and concurrent unit gate were intentionally interrupted
for this correction; a fresh **390-case** run (adds flag-off coverage) follows.

Inventory detail and recipe recommendations now expose native controls;
shopping exposes item-specific checkbox state; shell brand links are native.
Legacy Week card/setup controls retain their existing handlers and draft
contract with native, state-labelled buttons. Two focused pre-fix browser
failures became **12/12 PASS** across six widths. An added sibling-action test
initially failed because an API refetch reordered rows; fixing its locator to
the stable item ID passed (1/1). Router fixtures now mount real Links via
MemoryRouter instead of omitting the newly used export: **37/37 focused unit
tests PASS**, typecheck/targeted ESLint/diff-check PASS. No assertion was removed.
Final complete gates and the unfiltered **384-case** browser run are underway;
interrupted earlier runs are retained as non-final evidence.

### Source-led fix checkpoint

Direct comparison now covers all 27 identities using the approved boards and
their higher-priority written contracts. Localized fixes cover native recipe
links, discovery grid, 640px shell/fixed-action alignment, Landing/Home wide
composition, radio/group naming, Home empty-state heading, privacy sentence
layout, and payment status announcements without countdown chatter. No domain
authority changed. Targeted browser reruns: **43 passed / 5 intentional
project skips**, then **18 passed** (strict dialog axe, discovery/privacy),
then **1 passed** (639/640/767/1024 boundary). `pnpm typecheck` passed.
Exact logs are preserved in `.hoplite/artifacts/t18c/fix-verification.zip`.
Final all-suite certification and screenshot matrix remain pending.

## T18C — final redesign certification — SAFE PAUSE (2026-09-21)

- Exact start gate passed at `b8447e85f099b800a9a8ebc6c4c137adc9e45a32`,
  repository `1368281478` / `omin-jp/Frigo-dev`; clean tree, CI #145 green,
  Deploy #52 staging green and production skipped. No overlapping redesign PR.
- New branch: `feat/t18c-final-redesign-certification`. No merge/deployment.
- Approved Takosan OS boards/ZIP are unavailable: **DIRECT_BOARD_COMPARISON_PENDING**.
  Reconstructed requirements and older Frigo boards are not direct authority.
- Checkpoint A `ac4d90e` pushed with the 162-screenshot baseline archive.
  Baseline: route/overflow/nav 162/162; 15 moderate axe instances/viewport on
  11 identities. Evidence-led presentation fixes applied (landmarks, heading
  order, camera reduced-motion, VietQR dialog focus trap/return) with
  red/green targeted regressions; payment/OTP authority untouched.
- Style audit 39 allowlisted / 0 unjustified; contrast 33/33. Full Vitest
  183 files / 4217 PASS applies only to the `ac4d90e`-era tree, not the pause
  edits; final matrix/gate rerun is the next action.
- Next: rerun matrix + gates on the fixed tree, finalize
  [T18C certification](T18C_VISUAL_CERTIFICATION.md) and the resume plan in
  [T18C WIP handoff](T18C_WIP_HANDOFF.md). Historical results below remain
  unchanged and are not current T18C evidence.

## T18B — payment authority unification — `T18B_READY_FOR_REVIEW` (2026-09-21)

- Final review P1 fix starts at verified local/remote `0926222` on the same
  branch/PR. Issued monthly 49000/annual 499000 offers survive later catalog
  changes; current-price callbacks for those old orders are rejected. Structural
  validation, expiry/terminal-state rejection and replay/grant fences remain.
  Focused **151/151** (65 server payment), with explicit catalog-change and
  corrupted-row coverage; full `pnpm test` **183 files / 4217 PASS** and browser
  **48/48** across six widths. Lint/typecheck/migration smoke/build/diff checks
  PASS. Final commands, fixture/HMR recovery and publication boundary are in
  the report; earlier checkpoint counts below are historical.
- Repository `1368281478` / `omin-jp/Frigo-dev`; exact starting and currently
  verified main `13ff3f22082fc0601a81b90c96edded4741194ac`. Branch
  `feat/t18b-payment-authority`, review-only [PR #47](https://github.com/omin-jp/Frigo-dev/pull/47)
  OPEN, auto-fix CI/review subscription enabled, auto-merge disabled.
- One Worker price table retains **49000 monthly / 499000 annual / VND**.
  It supplies metadata and new offers only. After issuance the persisted intent
  is the immutable amount/plan/currency/order/expiry authority; signed PayOS
  instructions, callbacks and displayed QR must match that offer, not today's
  catalog. Only a valid persisted paid intent grants entitlement. No commercial
  price/discount decision was made.
- Signed callbacks bind order/amount/currency/plan/reference; transactional
  pending-only grants are idempotent and insert missing subscriptions. Provider
  errors fail closed. Legacy shared-secret grants are retired (410 for
  `grantCode`), normal old activation calls remain non-granting compatibility.
- Client checkout/status and fresh `/me` entitlement are identity/generation
  fenced; billing's expected-owner-header exemption is removed. Local cache,
  redirects and modal closure cannot establish Plus. All T18A code preceding
  the legacy Plus endpoint is byte-identical to base.
- Checkpoints A `2aba91a`, B `c00ea9f`, C `1cef30b`, semantic-error fix
  `1aabd32562edc2c5c37b3db9d7d19e1938896084` pushed. Focused 121/121;
  browser six-width 48/48 plus error-state rerun 4/4; implementation full Vitest **183 files /
  4185 tests PASS**; lint/typecheck/migration smoke/build PASS. First full run's
  single style-token failure was corrected in source, with brand/checkout 38/38
  and the complete rerun green. Security review: remaining P0/P1/P2/P3 = 0.
- Merge-readiness follow-up: exact-head CI `35554499704` passed at `2d6ff5a`,
  no review threads. Fixed deployed CSP blocking VietQR (exact image origin in
  both policies), retired the obsolete grant-secret warning, and removed one
  trailing blank line. New regression failed before the CSP fix, then passed:
  104 focused tests and 48/48 browser tests under the real image policy.
  Lint/typecheck/migration smoke/build/full-diff whitespace and built-header
  parity PASS; exact commands/failures are in the report. New-head CI is checked
  separately on the PR before readiness, not inferred from the prior run.
- No migration (38 existing), Inventory Truth, OCR/AI, recipe/planner/Week,
  Wrangler binding, infrastructure or workflow changes. Application-config
  adjustments are only the QR CSP and retired payment warning. No real payment, merge, remote D1 or
  deployment. Baseline main CI #140 and staging Deploy #51 passed; production
  job skipped. T18B is not deployed.
- Managed isolated Preview is ready after removing a hard-coded run-script port
  override; actual metadata and missing-provider checkout were exercised. UI
  provider evidence is synthetic, not live payment certification.
- Next: owner review/merge permission once final-head CI is green; no local blocker.
  Provider channel/secrets and live callback delivery need separately authorized
  operator verification before any release. Exact audit, contract, failures,
  evidence and boundaries: [T18B report](T18B_PAYMENT_AUTHORITY_REPORT.md).
  T17/T18A sections below are historical and unchanged.

## T18A — auth resend expiry contract — `T18A_READY_FOR_REVIEW` (2026-09-21)

- Repository ID `1368281478` currently resolves to `omin-jp/Frigo-dev` (supplied
  `omin-vn` path redirects). Exact main/base remains
  `51d0d3755d83b64185066228d98f44ab7bad5e3c`.
- Branch `feat/t18a-auth-resend-expiry-contract`; review-only PR
  [#46](https://github.com/omin-jp/Frigo-dev/pull/46), OPEN, auto-fix CI/review
  subscription enabled. No merge or deployment performed.
- Pushed checkpoints: server `88096cb7fbea8e3b95f5627ff5a46e8c3d34b462`, client
  `47c3a3391e086caf2760b61ee4e2bfacd331cacf`, security fixtures
  `53f9fefdc9d935bb736a37cdcd9f5b0d0479685e`.
- One unchanged ten-minute server TTL now controls stored OTP expiry and
  registration/resend response metadata. Client uses only returned metadata,
  clears old expiry on malformed/failure/offline outcomes, and preserves T17B
  route lifecycle, credential-free context and nullable delivery truth.
- Forgot-password request/resend returns identical generic lifetime policy
  for known/unknown accounts, never proof of issuance or delivery. Its distinct
  UI/reset semantics are unchanged. Security review found no actionable issue.
- Final local evidence: auth/security 300/300 (server 86/86, client 83/83 in
  focused subsets), full Vitest 180 files/4117 tests, T17/T18A browser matrix
  42/42; lint, typecheck, migration smoke and build PASS. Exact commands and
  hosted CI publication receipt are in the report. Initial browser launch lacked its
  locked Chromium; repaired and rerun green. Initial full run hit the 600s
  shell budget; final full run passed with two workers and no test exclusions.
- Billing/payment UI/behavior, migrations, other Worker files, Inventory Truth,
  OCR/AI, planner and production config have zero diff. T18B remains separate.
- Next: final-head hosted CI and human review only. No local blockers. Exact commands,
  failures, Worker line-by-line explanation and evidence are in
  [T18A_AUTH_RESEND_EXPIRY_REPORT.md](T18A_AUTH_RESEND_EXPIRY_REPORT.md).
  T17B records below remain historical and unmodified.

## Current T17B — contract reconciliation `T17B_COMPLETE`; release pending (2026-09-20)

Branch `feat/t17b-contract-reconciliation` was created from exact `main`
`858759f771baccb85f5ed6fd8e06df2fc0bbb112` in repository id `1368281478`,
`omin-vn/Frigo-dev`. Application HEAD is
`0f358f2f8c9da35c2167489ad6fd63eae8ea8c47`; certification checkpoint is
`00594eba755c6895f9edb9d3076282cf42919c44`. Documentation follows.

- Screens 04–06 are route-driven and history/refresh safe. Screen 06 is the
  planning-goal screen: a native `primary-goal` radio group with the existing
  client values `today`/`week`/`both` plus a review of the server-stored
  fields. `primaryGoal` is client-only (draft + auth state, never sent to
  `/preferences`); after confirmed completion `week` routes to `/week/setup`,
  otherwise `/`. Household size is not clamped: stored `6..20` shows as "5+"
  and round-trips unchanged unless the user explicitly picks a size (explicit
  "5+" writes canonical `5`).
  Screen 05 has exactly seven visible cuisine choices and nine visible
  restriction choices, both including canonical `other`. Stored values outside
  those visible chips, including `italian` and `vegetarian`, survive review and
  completion; spicy level remains independent. Authenticated onboarding updates
  local auth state only after server confirmation. The preserved offline-guest
  session path intentionally skips the server write and completes locally.
- `/auth/verify` context is credential-free, tab-scoped, identity-bound,
  strict-shape/expiry validated, and cleared on route, identity, cancel, and
  success transitions. Delivery is nullable, resend expiry is unknown when the
  API supplies none, failed replacement delivery clears stale claims, leaving
  the route resets loading, and only the server validates OTPs or creates
  sessions.
- The 27-screen registry now requires every declared content marker. Its clean
  reviewer-verified contracts passed 18/18 across six viewports, including
  onboarding direct URLs, refresh, history, native selection state, and no
  `primary-goal`. Older reconstructed-kit language is historical only.
- Post-review fix `56fc01b` reran: focused onboarding/auth 87/87, full Vitest
  180 files/4094, registry 18/18, full T17 216 pass/6 skips/0 failed, lint,
  typecheck, migration smoke, build, and `git diff --check` PASS.
- Certification-checkpoint validation: focused auth 102/102, final verify/onboarding 39/39, full
  Vitest 180 files/4087 tests, T13 60/60, clean six-width T17 216 pass/6
  intentional skips, automated accessibility 12/12 across six viewports, style
  residual 43/43 allowlisted/0 unjustified, and contrast 33/33. Lint,
  typecheck, migration smoke, and build passed.
- Clean evidence is under
  `.hoplite/artifacts/t17-playwright/final-00594eb-clean/`; validation is under
  `.hoplite/artifacts/t17b-validation-00594eb/`. The tested package
  `.hoplite/artifacts/t17b-final-visuals-00594eb.zip` contains 232 entries and
  180 PNGs, with a complete per-screenshot manifest; SHA-256 is
  `d6f6d4f032c0ac637ce5d1523ecc95b1411bc567538bca8d235a7131e6ad9d70`.
  The 390px OTP and all onboarding captures were visually inspected.
- Corrective documentation checks passed for whitespace, required markers,
  protected zero-diff boundaries, ZIP integrity, and all 180 JSON/TSV manifest
  records and hashes. An initial ad hoc validator used the wrong command-field
  name; the corrected `generatingCommand` check found no artifact defect.
- Managed Preview initially inherited an inferred `pnpm dev` run path and could
  not provide the isolated API; guest creation returned 500. The effective run
  path was restored to `node scripts/security-preview.mjs`, the tracked Preview
  settings were restored unchanged, and the final exact-head Preview was ready.
  Supported synthetic reset/login then verified screens 04–06 at 390x844: five
  household radios, 7 cuisine and 9 restriction checkboxes, independent review
  values, and Back/Forward preservation, with no page errors.
- Worker, protected payment, migration, production-infrastructure, and deployed
  production state are unchanged; T17B intentionally changes the documented
  frontend auth/onboarding behavior.
  `PRE-EXISTING PROTECTED AUTH-CONTRACT BLOCKER`: registration reports a
  10-minute OTP lifetime while resend supplies no fresh expiry.
  `PRE-EXISTING PROTECTED PAYMENT-AUTHORITY BLOCKER`: frontend/VietQR prices
  `599000`/`79000` differ from server payment-intent authority
  `499000`/`49000`. Their server/API and payment owners must resolve them in
  separately authorized work. No deployment occurred. Full evidence:
  `docs/ai/T17_UI_V2_REPORT.md`.
- Status is `T17B_COMPLETE`; T17 remains `T17_PARTIAL` only
  because direct board comparison and a human screen-reader walkthrough are
  external and unexecuted.

**Publication/readiness:** replacement PR #45 was opened against exact base
`858759f771baccb85f5ed6fd8e06df2fc0bbb112` from corrective documentation
checkpoint `f901b028af655b419cd96c3a8e29c358de34e636`. At publication head
`1cacd0b08ab788d355cef5ab09d950df038938f8`, hosted validate run `35532565549`
passed and GitHub reported `MERGEABLE / CLEAN`; reviews, review comments,
conversation comments, and unresolved human feedback were empty. The final
local pass reran focused auth/onboarding/session tests 74/74, changed-file
ESLint, typecheck, ZIP integrity/hash, protected-boundary checks, and
`git diff --check` successfully. PR #45 is ready for the authorized user's merge
decision when the documentation-only readiness checkpoint retains green/CLEAN
exact-head provider status. Direct board comparison and NVDA/VoiceOver remain
pending; neither has a named assignee or tracking issue in this repository.
Deploy only through the authorized operator path; production remains untouched.

## Previous T17 — continuation 6: contract gaps closed and certified, status `T17_PARTIAL` (2026-09-19)

Branch `feat/t17-takosan-ui-v2`, PR #44 (repository id `1368281478`, now
`tako-san1/Frigo-dev`). Final-HEAD evidence lives in
`docs/ai/T17_UI_V2_REPORT.md`; this section is the summary.

- **Screen 03 is a real route.** `/auth/verify` is registered with the same
  session guard as `/auth`; the OTP state is derived from the route over the
  unchanged auth state machine (Turnstile, verify/resend bodies, DEC-012,
  private-session capture untouched). A tab-scoped, code-free verification
  context (`features/auth/verify-context.ts`) makes refresh/back safe; a direct
  load with no context renders an honest "no verification pending" state with
  real exits. 14 regression tests (`auth-verify-route.test.tsx`).
- **27 registered screens certified mechanically** per width
  (`tests/e2e/t17-ui/t17-registry.e2e.ts` + `screen-registry.ts`): route
  resolves, visible proof, nav rule, no overflow — on real seeded truth
  (onboarding via UI, planner plan generated, T13 scan evidence).
- **Semantic-token migration finished.** 991 codemod replacements + manual
  dark-context sites; zero raw palette classes outside the protected payment
  UI (43 sites, explicitly allowlisted with reason);
  `scripts/t17/style-residuals.mjs` is enforced by `takosan-brand.test.tsx`.
  Two arbitrary hex values removed. Zero emerald / transition-all / animate-in.
- **WCAG-AA measured**: `scripts/t17/contrast-audit.mjs` 33/33 semantic pairs
  pass (kit `text-muted` darkened to `#6F6B64`; `warning-strong`/`danger-strong`
  added). axe-core over 25 surfaces + OTP flow: 0 serious/critical. Viewport
  zoom re-enabled (was `user-scalable=no`). One h1 per surface, 0 images
  without alt, all targets ≥ 44 px (measured). Shared `useModalFocus` +
  `BottomSheet` primitive give every sheet/dialog trap/Escape/focus-return.
- **Reduced motion certified** on auth, onboarding, sheet/dialog, cooking,
  planner and scan review (no running keyframes, no spatial transitions
  > 200 ms; decorative pulse/ping/bounce and `transition-tap` collapse under
  the media query).
- **Visual contract**: canonical loop now 25 surfaces incl. `scan-review`,
  `receipt-review`, `scan`, `notifications`, `household`, `otp-empty`; state
  matrix (loading/error/empty/offline/sheet/dialog/long Vietnamese/keyboard
  focus/mobile fixed action + keyboard viewport). Human review of the 1440/390
  captures fixed: canvas width cap, aligned fixed bars, Plus/cooking phone
  wrappers, cooking title truncation, UNKNOWN-expiry tone on Home, 44 px brand
  links, honest OTP subtitle.
- **Gates at final HEAD**: see the report's Verification table (lint, typecheck,
  vitest, migration smoke, build, T13 suite, six-width T17 matrix, residual
  greps, worker diff 0, payment boundary 0 lines from this continuation).
- **Remaining blockers for `T17_COMPLETE`**: (1) board comparison — the kit
  ZIP (boards + `screens/*.md` + `SCREEN_REGISTRY`) was not available in the
  sandbox, so captures were reviewed against in-repo contracts only; a holder
  of the ZIP must compare the preserved captures and diff
  `screen-registry.ts`; (2) an assistive-technology (screen reader)
  walkthrough — automated semantics are clean but the human pass is unexecuted.

## Previous T17 — continuation 4: full-diff review with 10 latent defects fixed (2026-09-19)

**Continuation 5 — release prep (same day).** Inspecting fresh screenshots
for the PR exposed a **P1**: Tailwind `semantic` colour keys were camelCase so
25 of 28 kebab-case `semantic-*` utilities used across the new UI compiled to
no CSS (empty sidebar CTA, missing text/action colours). Fixed in
`tailwind.config.js`; new unit guard fails on the old config. Gates after fix:
lint PASS, typecheck PASS, vitest **178/4047**, build PASS, T17 Playwright
390/768/1440 **51/51**. PR opened into `main` (see HANDOFF for number/CI).
Deployment remains operator-driven per `DEPLOYMENT.md`; no new migrations.

**Continuation 4b (same day) — second pass + first local T13 run.** Three more
defects fixed: `FoodPreferencesPage` no longer flips onboarding completion
client-side (uses `setOnboardingFromServer(auth.isOnboarded, draft)`); nav
indicator `layoutId` is per-nav so the hidden bottom bar/rail cannot hijack
the shared-layout animation; dev-OTP autofill is a real `<button>`. **T13
Playwright ran locally for the first time: 54/60 → 60/60** after (a) updating
the logout test's target from `/profile` to `/me` (T17 redirect) and (b)
fixing a *pre-existing* failure (confirmed on base `769d085`) where the
presentation test faked onboarding via `localStorage`, which migration 0038's
server-authoritative hydrate overwrites — the test now completes the real
onboarding flow. Full T17 matrix: 360 **16/16**; other five widths **82 pass /
2 by-design skips / 1 test-only `networkidle` stall**, fixed and re-verified
**12/12** at all six widths. Lint/typecheck PASS; harness consumers 27/27.
Worker/PayOS diff still zero. Status remains `T17_PARTIAL`.

A file-by-file review of the entire redesign diff (`769d085..HEAD`, 76 files)
found and fixed: two **tenancy** violations (new settings pages used unscoped
query keys; now `queryKeys.foodPreferences()`/`planningPreferences()` with
invalidate-after-write), two **honesty** gaps (offline planning save showed
success although the write was only queued — now an explicit pending-sync
state; offline planning read hung forever — now an honest unavailable state;
household badge claimed a server status — now session fact only), two
**IA/layout** regressions (TopBar never showed the settings gear on `/me` and
still navigated to legacy paths; `/scan/*` review workspaces were wrongly
immersive and ReceiptReview's CTA would collide with the restored nav), three
**accessibility** gaps in the new auth components and Switch primitive (label
association, OTP group/digit names, reveal-button name/state, autocomplete,
`aria-describedby`), a **motion** defect (Switch thumb `layout` on an absolute
child; now transform-driven and reduced-motion-governed) plus half-implemented
inventory row enter/exit, and the **fixed-action primitives** pinned under the
mobile nav. One test-only fix (screenshot spec `networkidle` stall). Gates
after fixes: lint PASS, typecheck PASS, full vitest **178/4046 PASS**,
migration smoke PASS, build PASS, focused UI/auth **65/65**, T17 Playwright
re-verified for the affected tests. Worker/PayOS diff still zero. Status
remains `T17_PARTIAL` (slate-palette migration, human screenshot review, T13
local run outstanding). Full table: `docs/ai/T17_UI_V2_REPORT.md`.

Third checkpoint on `feat/t17-takosan-ui-v2`: all 86 indiscriminate
`transition-all` utilities were replaced by a scoped `transition-tap` token
(enumerated properties; layout never transitions); the remaining per-screen
motion stories landed (cooking steps transition directionally via Slide,
inventory list animates add/remove keyed by stable server identity with
AnimatePresence/layout, scan crossfade verified reduced-motion-safe); the
state-class matrix gained bottom-sheet, honest offline-banner and 200% text
zoom tests. The zoom gate exposed real defects — rem-sized nav icons forced
flex min-content overflow, the Profile hub card and Home header refused to
truncate, RecipeCard/IngredientRow rows could not wrap, and the inventory
search input lacked `min-w-0` — all fixed and verified clean by probe at 390
and 360 (desktop and mobile emulation) and by the suite at all six widths.
Two test-code defects (case-sensitive offline regex; zoom measured before
layout settle) were fixed test-only and re-verified **12/12** at all widths.
Gates: lint PASS, typecheck PASS, full vitest **178 files / 4046 tests PASS**,
migration smoke PASS, build PASS; the full T17 matrix run passed everything
except those two test defects, which the targeted re-run proves green.
Remaining honest gaps for `T17_COMPLETE`: 856 `slate-*` neutral-palette sites
still on legacy pages (brand `takosan-*` aliases are kit-permitted), human
design review of the canonical screenshots, and a first local run of the T13
Playwright inventory suite. Worker/PayOS diff remains zero; `main` untouched.

## Previous T17 — continuation 3 (2026-09-19)

## Previous T17 — continuation 2 (2026-09-19)

Status `T17_PARTIAL` per the Takosan Redesign OS v2.0.0 kit. Branch
`feat/t17-takosan-ui-v2` from live main `769d08597563f816ef9c1dd9523fdafb687de3e2`
implements: the full semantic token layer (CSS `--semantic-*` + tailwind
`semantic-*`), the kit type/radius/elevation scales, `motion@13.4.0` with a
`MotionConfig reducedMotion="user"` provider and token-driven motion
primitives, a shared primitives module, a responsive AppShell V2 (mobile bottom
nav / tablet rail / desktop sidebar, immersive-only nav hiding, real-link
navigation with `aria-current`), the settings/account IA split with four new
dedicated pages over real server contracts (`/me/preferences`,
`/me/household`, `/settings/planning`, `/settings/notifications`,
`/settings/privacy`, `/settings/app`) plus redirects, planner canonicalization
with param-preserving Week redirects while the feature flag stays the rollout
authority, onboarding step routes, removal of the fabricated household
invite/join/member/QR flows in favor of honest unavailable states, removal of
phone-width emulation across 20+ shell pages, and brand cleanup to zero
user-visible Frigo/emerald presentation. PayOS/payment grants received zero
application change: `git diff 769d085 -- src/worker` is empty and the only
payment-file diff is 12/12 presentation-only lines in VietQRModal.

Verification executed after implementation: `pnpm lint` PASS, `pnpm typecheck`
PASS, `pnpm test` **178 files / 4046 tests PASS** (re-run after the
continuation), `pnpm check:migrations` PASS
(sqlite3 CLI installed into the session environment, as the repo setup script
does), `pnpm build` PASS, and the new isolated T17 Playwright suite
(`playwright.t17.config.ts`, `tests/e2e/t17-ui/`) passing at
mobile-390 / tablet-768 / desktop-1440. Baseline gates on main `769d085` passed
identically before edits. `main` untouched; no merge, deploy, D1, PayOS, or
production mutation. (The gaps listed when this paragraph was first written —
AuthPage decomposition, the 360/430/1024 matrix and canonical screenshots —
were closed by continuation 2 below; the current honest gap list lives at the
end of this section and in `docs/ai/T17_UI_V2_REPORT.md`.)

Continuation 2 (same day, same branch): the **AuthPage monolith was
decomposed** into `src/web/features/auth/*` (AuthShell/LoginMode/RegisterMode/
OtpMode/ForgotPasswordMode/GoogleAuthSection/AuthField) with the kit's
auth-state transition and byte-compatible security semantics — the four auth
suites pass **11/11**. All **no-op animation utilities** (`animate-in`,
`zoom-in-95`, `slide-in-from-*` — dead classes from an uninstalled plugin)
were retired across 15 files onto reduced-motion-safe utilities. The T17
visual suite now certifies **all six widths** (360/390/430/768/1024/1440) and
captured **17 canonical screenshots per certified width**; the 360 run exposed
and fixed a real `/shopping` horizontal overflow (`min-w-0` on the quick-add
controls). Final gates after continuation: lint PASS, typecheck PASS, full
vitest **178/4046 PASS**, migration smoke PASS, build PASS, T17 Playwright
**42/42 PASS** at certified widths (full matrix green). Remaining honest gaps:
per-screen `transition-all`/motion-primitive migration, semantic-token
migration of legacy-styled pages, partial state-class matrix, and human design
review of the screenshots. Worker/PayOS diff remains zero.

## Current T16 follow-up — PWA cache and Google recovery deployed (2026-09-19)

Production evidence showed `/auth` and `/sw.js` returning `CF-Cache-Status: HIT`,
while the deployed Service Worker still used the fixed `takosan-pwa-v2` cache.
The repository registered `/sw.js`, but `_headers` targeted the unused
`/service-worker.js` path. This allowed old HTML and the old worker to survive
releases and explains why affected devices kept the stale auth bundle. Google
GIS itself loaded and opened the real account popup in a clean Chromium profile;
the affected browser's unavailable state is therefore consistent with that
stale client/content-blocking boundary, not a credential-less fallback.

The deployed release injects the exact release SHA into `sw.js`, registers
the SHA-qualified worker with `updateViaCache: none`, checks for updates on load,
online and foreground, deletes only previous Takosan release caches, and
best-effort navigates already-open same-origin clients once when an older release
cache is replaced. The navigation starts only after cache cleanup and
`clients.claim()` because awaiting it inside activation can deadlock the new
document fetch. Network navigation refreshes the offline shell and cache writes remain
inside the fetch lifetime. `/auth` and `/sw.js` are `no-store`; hashed assets
explicitly remove the inherited header and remain one-year immutable. Google
GIS uses a numeric clamped button width and its retry script has explicit error
and referrer handling.

The protected deploy workflow builds with the immutable release SHA and, after
exact-SHA readiness convergence, verifies live `/auth`, `/sw.js`, a hashed asset,
and the SHA embedded in the worker. Local Wrangler reproduced the effective
headers exactly. A two-release Chromium exercise proved one document request on
clean install and exactly one best-effort document navigation on update, with the
old cache removed and the new controller/cache bound to the new SHA. Focused
tests passed **116/116**; full `pnpm test` passed **178 files / 4046 tests**;
lint, typecheck, migration smoke, production build, shell syntax and diff check
passed. The additional non-gate `pnpm audit --audit-level high` reported the
existing lockfile's 21 advisories (6 high) in development/deployment tooling
paths (`wrangler`/`miniflare` `undici`, `jsdom` `ws`, and direct build-time
`sharp`); this change does not modify dependencies or ship those packages in the
browser bundle, so remediation remains a separate dependency-upgrade task. No
migration, D1 write, PayOS/payment change, recipe-authority change or
production data mutation is included. PR #42 head
`54dd81b3ba260843ed39d625c8e0b7c2f4cef831` passed CI `35415335137` and merged
as main `6a016f185cae9c51ab5a1fc873a8a05a10a57edd`. Exact-main CI `35415536459`
and staging Deploy `35415763483` passed. Protected production Deploy
`35415843682` passed every gate and published Worker version
`2f228dc9-d97b-4eb1-8cff-9a0f2df3b51c`, preserving recipe authority
`shadow/0/false` and D1 ledger 38 / tip `0038_auth_onboarding_completion.sql`.

Independent production checks found readiness on the exact main SHA with
database/queue OK and only the existing `CONFIG_PLUS_GRANT_SECRET_MISSING`
warning. `/auth` serves the current bundle with `no-store` (Cloudflare Assets
may still label the edge response `HIT`), `/sw.js` is `MISS` plus `no-store`,
the worker embeds the exact main SHA, and hashed assets are one-year immutable.
A clean Chromium profile loaded real GIS, opened the `accounts.google.com`
account chooser, and obtained the exact-SHA Service Worker controller with only
the matching Takosan cache. A deployment cannot force a
closed, suspended, or browser-blocked legacy tab to execute; reload/reopen or
navigation is the guaranteed recovery boundary, while this release adds future
load/online/foreground update checks.

## Current T15C-D — 1% production Canary safe stop (2026-09-19)

Canonical repository ID `1368281478` resolves to `frigo-6/Frigo-dev`; PR #38 and
PR #39 are merged and canonical main is `347b536950cf54d25a2d6a880c3c2cb3d8c8f329`.
Exact-main CI `35409762462` and automatic staging Deploy `35409964105` passed;
staging used `static/0/false` and production was skipped. Fresh local baseline
passed seed/import, typecheck, lint, migration smoke through 0038, build, and
full Vitest **178 files / 4044 tests**. Public production remains Worker
`6c336889-680d-4cc3-b03b-1007849aa738` at `b41aa468...`, `shadow/0/false`,
database/queue/email healthy, and 71 deterministic user-facing recipes; only
the existing `CONFIG_PLUS_GRANT_SECRET_MISSING` warning remains.

No authorized operator-owned INCLUDE/EXCLUDE household pair was supplied and no
customer account was inspected or enumerated. Local Wrangler is unauthenticated,
so the fresh direct D1 drift/FK/quick-check/tail audit and Worker secret
provisioning were also unavailable. No secret, config, deploy, D1, migration,
R2, media, or authority mutation occurred. Classification:
`T15C_D_BLOCKED_AUTHORIZED_TEST_HOUSEHOLDS_UNAVAILABLE`. Production stays
`shadow / 0 / false`. Receipt:
`recipe-catalog/T15C_D_PRODUCTION_1PCT_CANARY_CERTIFICATION.md`.
Receipt PR #40 passed exact-head CI `35410893001`, merged as `763d7e904798dc513c60d4da5f876598570c12fb`, then passed exact-main CI `35411093064` and automatic staging Deploy `35411300235` on `static/0/false`; production was skipped and remained unchanged.

## Current T15C-C — authorized canary test cohort mechanism READY (dormant; production still shadow) — 2026-09-19

`RECIPE_CATALOG_TEST_COHORT_ENABLED` + `RECIPE_CATALOG_TEST_INCLUDE`/`EXCLUDE` (Worker secrets holding SHA-256 digests of `recipe-catalog-test-cohort:<householdId>`) give operator-owned test households a deterministic server-side include/exclude override for the D1 canary; precedence exclude > include > `isRecipeCanaryTenant`. Parsed and evaluated only when mode=`canary` (plus cutover, switch exactly `true`, authenticated tenant); in static/shadow/d1 the variables are inert, so emergency rollback is the single change canary→shadow/static with no secret cleanup (review P1). An active cohort must name ≥1 include AND ≥1 exclude household (`TEST_COHORT_PAIR_REQUIRED`, review P2). Malformed, duplicate, overlapping, oversized, half-applied, or one-sided canary configuration is fatal in production readiness (`CONFIG_RECIPE_CATALOG_TEST_COHORT`) and serves static loudly at request time. Diagnostics gain only a bounded `assignmentReason`. Normal FNV bucketing is byte-for-byte unchanged. No migration; `deploy.yml`/wrangler/release manifest untouched and guard-tested to stay that way. Classification `T15C_AUTHORIZED_TEST_COHORT_READY`; production remains `shadow / 0 / false`. Receipt: `recipe-catalog/T15C_AUTHORIZED_TEST_COHORT.md`.
## Current T15C — production Canary safe stop; authority still shadow (2026-09-18)

Fresh audit on canonical main `b41aa4682481447795350fc1a9eeb1e80887bd0e` passed every local gate (`pnpm test` 176 files / 4008 tests PASS). Public read-only production checks: readiness commit equals main, database ok, five `/api/v1/recipes` reads at 71 in deterministic order, legacy IDs 200, reviewed D1-only IDs 404; the latest production Deploy receipt (run 35404106102) records `recipeCatalogMode=shadow`, canary 0, cutover false on that exact SHA. No authorized operator-owned inside/outside 1% cohort and no Cloudflare credentials were available, so Canary was not dispatched and nothing in production changed. Classification `T15C_CANARY_BLOCKED_AUTHORIZED_COHORT_UNAVAILABLE`; receipt `recipe-catalog/T15C_PRODUCTION_CANARY_SAFE_STOP.md`.

## Current T16 follow-up — OTP sender fix and guest account gates ready for release (2026-09-19)

A production-bound Email Service diagnostic isolated the OTP failure to the
sender identity: Cloudflare rejected `no-reply@frigo.tungjpstore.net` with
`email sending not authorized for subdomain 'frigo.tungjpstore.net'`. The zone
apex `tungjpstore.net` is the domain currently onboarded for Email Service, and
the same remote binding accepted a harmless diagnostic from
`no-reply@tungjpstore.net` and returned a provider `messageId`. This proves the
request reached the email provider and removes D1, Turnstile and OTP generation
as the root cause for the observed registration failures. Actual inbox receipt
of a real OTP is still pending and must not be claimed yet.

Implementation commit `31006994849ee9f6d78ae6114f82d77d41efc784`
changes the transactional sender to the onboarded apex,
maps the provider's subdomain authorization message to the sanitized
`sender_not_verified` category, keeps resend available when the optional KV
cooldown store is unavailable, clears cooldown best-effort after failed sends,
and returns actionable `503 OTP_RESEND_UNAVAILABLE` for unexpected resend
failures. The OTP screen now waits for a fresh Turnstile token before resend and
recreates the widget after each consumed token.

Guest account boundaries are explicit. A guest may open `/auth`; `/plus`
replaces prices and payment UI with an account-required explanation and a link
to `/auth?mode=login&returnTo=%2Fplus`; the profile upgrade CTA points to the
same login flow. A successfully authenticated, already-onboarded account safely
returns to `/plus`. Authenticated users retain the existing Plus screen and no
PayOS, checkout, billing, webhook or settlement implementation changed.

Local verification is green: focused auth/email/account-gate suites passed **86
tests / 4 files**; full `pnpm test` passed **176 files / 4008 tests**; `pnpm
lint`, `pnpm typecheck`, `pnpm check:migrations` (`migration-smoke=ok`), `pnpm
build`, and `git diff --check` passed. Real-browser checks at 390x844 and
1440x1000 confirmed the guest pricing/payment UI is absent, profile and Plus
CTAs route to auth, `returnTo=%2Fplus` is retained, and the auth page remains
available to a guest session.

This candidate is not yet merged or deployed. Production remains on Worker
`e8164168-9566-475b-b0fa-7508368bf3e7` at main
`0cb5d2c08fa24479ecce6b4c4e5f73b31a920ff5`, D1 ledger 38 / tip 0038, and
recipe authority `shadow/0/false`. No migration or production data write is
required. Next action: commit, exact-head CI, normal merge, exact-main CI,
protected production deploy preserving `shadow/0/false`, then verify a real
registration/resend or forgot-password email arrives without exposing its OTP.

## Current T16 — auth funnel and CSP hotfix deployed; OTP receipt pending (2026-09-19)

PR #34 merged the auth-funnel implementation commit
`3633a2fa8a0827a6aa31a3c86da7fb680a6e0f2a` and documentation commit
`66e8073161cf418ffe4df2ed6cece75d56087af1` to canonical main
`d6c981b1a67001b807f03166109f661bc753728c`. Exact-head PR CI run
`35385363064` and exact-main CI run `35385844667` succeeded. T16 now has one
entry funnel: landing offers guest or account, auth sends returning onboarded
accounts to the app and new accounts to three preference-only onboarding steps,
and onboarding contains no duplicate login/Google/Apple chooser.

Production D1 migration run `35386276549` succeeded and applied only
`0038_auth_onboarding_completion.sql`. The ledger is 38 / tip
`0038_auth_onboarding_completion.sql`; FK, quick check, aggregate drift, recipe
media and catalog certification passed. The recoverable Time Travel bookmark is
`000000d3-00000000-000050ea-709daab542439d8e8fab731b65dab714`.

Production Deploy run `35386532369` succeeded after the required Environment
approval. Worker version `c0161a22-1987-42dd-99c4-0a5874d4fadb` serves exact
SHA `d6c981b1a67001b807f03166109f661bc753728c`; previous Worker
`c6fa2ce8-f35b-4485-ad38-09dbc19738d1` remains the rollback reference. Recipe
authority stayed `shadow`, canary stayed `0`, and cutover stayed `false`.
`SEND_EMAIL` and `GOOGLE_CLIENT_ID` are present; `/api/v1/config` exposes the
expected client ID. Readiness reports the exact SHA with database, queue and
email configured; the only degradation is the existing
`CONFIG_PLUS_GRANT_SECRET_MISSING`. `scripts/post-deploy-smoke.sh` passed.

OTP delivery now uses the structured Cloudflare Email Service binding with
Resend fallback and sanitized provider categories. Production registration and
resend return `OTP_DELIVERY_UNAVAILABLE` when no provider accepts the message,
and the undelivered challenge is invalidated. Google GIS and backend audience
verification now consume the same runtime `GOOGLE_CLIENT_ID` exposed by
`/config`; signed credentials remain mandatory.

Local release verification passed lint, typecheck, migration smoke, build, full
Vitest **174 files / 4002 tests**, recipe seed/import checks, local D1 schema gate
through 0038, and diff check. Production Playwright at 390x844 and 1440x900
verified no horizontal overflow, Google GIS rendering, and a Google click opening
`accounts.google.com` without an origin error. The live guest path completed
landing -> guest session -> reload-safe three-step onboarding -> preferences ->
app; `PATCH /api/v1/preferences` returned 200 and the
`__Host-frigo_session` cookie remained `HttpOnly`, `Secure`, `SameSite=Lax`.

The production console exposed CSP blocks for Google Fonts, Google GSI styles,
and Cloudflare Web Analytics. Hotfix implementation
`79dfca6483d90fcf33380acfe33f880c1e6ff7a5` adds only the required explicit
origins in `src/worker/config/csp.ts` and `public/_headers`, plus unit coverage;
no wildcard or script `unsafe-inline` was added. PR #35 head
`c14a3755d95ddae316d5e6636ef85f9784ac4a54` passed CI `35388666150` and merged
normally as main `0cb5d2c08fa24479ecce6b4c4e5f73b31a920ff5`; exact-main CI
`35388963509` passed.

Production hotfix Deploy `35389274233` passed the Environment gate, full local
gates, exact-head CI recheck, read-only D1 ledger/schema gate, Cloudflare deploy,
post-deploy smoke and exact-SHA convergence in one attempt. Worker version
`e8164168-9566-475b-b0fa-7508368bf3e7` serves exact SHA
`0cb5d2c08fa24479ecce6b4c4e5f73b31a920ff5`; previous Worker
`c0161a22-1987-42dd-99c4-0a5874d4fadb` is the immediate rollback reference.
The immutable manifest and live catalog confirm recipe authority remains
`shadow`, canary `0`, cutover `false`, and 71 user-facing recipes. D1 remains
ledger 38 / tip 0038; no migration was run for the CSP hotfix.

Independent production checks confirmed the exact SHA, expected Google client
ID, configured email service, database/queue OK, and only the pre-existing
`CONFIG_PLUS_GRANT_SECRET_MISSING` warning. The live CSP header contains the
explicit Google Fonts/GSI/Cloudflare Insights origins. Playwright at 390x844 and
1440x900 found no horizontal overflow, loaded fonts, rendered one Google iframe,
and captured no CSP console violation. The Insights script was allowed by CSP
but its host returned `ERR_CONNECTION_REFUSED` from the verification network.

Real OTP delivery remains unverified. `tungjpstore@gmail.com` already exists in
`auth_accounts`; both headless and headed automated Chrome displayed the real
Turnstile checkbox but could not produce a token, so no forgot-password request
was sent and no email receipt may be claimed. One legitimate production guest
test record was created and intentionally retained. No PayOS/payment, recipe
authority, Inventory Truth, or Week behavior changed.

## Current T15C-B — merged control plane; safe stop before production Canary (2026-09-18)

PR #32 was merged normally with the expected-head guard: certified head
`a7b3d23f2ad8b48203328116d0e35425390d2127` → main merge
`a6e81cd89b9e4c6b923cfc39947b01faf44ff5f3`. The PR head is an ancestor of main
with a zero-file tree delta. Exact-head PR CI `35344089103` was SUCCESS with zero
unresolved review threads; exact-main CI `35347246583` / job `105606601599` was
SUCCESS.

Automatic Deploy `35347579284` passed release and staging job `105607807690`,
skipped production job `105607809241`, and deployed staging SHA
`a6e81cd89b9e4c6b923cfc39947b01faf44ff5f3` on Worker
`12623f3b-ac64-4255-9fbf-c429b6225e1d`. Both release manifests certify
`static/0/false`; no automatic Canary leak occurred.

Read-only production recheck remains Shadow/static authority: Worker
`c6fa2ce8-f35b-4485-ad38-09dbc19738d1`, SHA
`88e8b54de121125866b2ff813e56e33277decf1c`, five catalog responses at 71,
legacy IDs 200, reviewed D1-only IDs 404. Production D1 `frigo-db` remains
ledger 37 / tip `0037_recipe_catalog_scale.sql`, 500 recipes, 500 runtime
fields, and 500 media rows pending / 0 ready. Read-only SELECTs reported
`changes=0`, `rows_written=0`; a fresh aggregate catalog certification passed at
500 recipes / 2 approved batches / release `rel-bd00a4f53fcaeee4`. No migration
or production D1 write occurred.

No authorized operator-owned inside-1% or outside-1% production test cohort was
available in repository/env/operator inputs, and no customer household IDs were
inspected. Production Canary was not dispatched and no Environment approval was
requested. Durable evidence: `recipe-catalog/T15C_B_AUTHORIZED_COHORT_SAFE_STOP.md`.
Classification: `T15C_B_AUTHORIZED_TEST_COHORT_UNAVAILABLE`; next action is to
obtain both authorized cohorts, then resume at exactly 1% through the protected
workflow. Full D1, media/R2, T14G, Inventory Truth/T09/T11, PayOS/auth remain
out of scope.

## Current T15C-A — bounded canary control-plane wiring in review (2026-09-18)

Certified base main is `6f589d0201499a3729d343e42ccb6d19fdff217a`, the normal
merge of PR #31 (`bb14ba3dcf594fdf4a71fa6bbd6e72fefa52e02e`). PR #29 was closed
without merge as superseded. Branch `codex/t15c-canary-control-plane` adds only
Deploy workflow policy, release-manifest validation/tests, and the T15C-A receipt
(`docs/ai/recipe-catalog/T15C_A_CANARY_CONTROL_PLANE.md`).

Canary wiring PR #32 remains open and mergeable; its final docs checkpoint has
passed exact-head CI and is awaiting independent review. It must not be merged
or used to dispatch production canary from this task.

The release matrix is `static/0/false`, `shadow/0/false`, or
`canary/{1,2,5}/true`; `d1`, `full`, `full_d1`, arbitrary percentages, and
100% canary fail closed. Automatic `workflow_run` deploys remain static/0/false.
Mode, percent, and derived cutover are recorded in the immutable release
manifest and passed to both Wrangler jobs from validated release outputs.

Local focused tests pass (121/121), full suite passes (173 files / 3995 tests),
and seed/import/lint/typecheck/migration/build/diff gates pass. No runtime
canary code, migrations, production D1, Worker, media/R2, Inventory Truth,
PayOS/auth, or T14G changed. Production canary remains unauthorized and
unactivated; stop after opening the new PR and exact-head hosted CI review.

## Current T15B-SHADOW — production Shadow certified; safe stop before canary (2026-09-18)

Production Shadow certification is complete on canonical main `88e8b54de121125866b2ff813e56e33277decf1c` in repository `1368281478` (`frigo-6/Frigo-dev`). PR #30 (`ad3e1d1656418aaf495b130443d6514926b8bdca`) merged with a zero-file tree delta; exact-main CI `35336548833` passed, automatic staging Deploy `35336830786` passed with STATIC71, and production Shadow Deploy `35337110268` passed release `105574386006` and production `105574426707` after the required Environment approval. Production now serves Worker `c6fa2ce8-f35b-4485-ad38-09dbc19738d1` at exact SHA `88e8b54de121125866b2ff813e56e33277decf1c`; bounded convergence passed in one attempt / 574 ms.

Independent anonymous production checks prove `configured=shadow`, `selected/actual source=static`, five repeated `/api/v1/recipes` responses at 71, legacy `vn-canh-01` and `gl-12` HTTP 200, and five reviewed D1-only IDs HTTP 404. Cloudflare tail records sanitized Shadow comparisons with D1 500/500 hydrated, release `rel-bd00a4f53fcaeee4`, readiness `ready`, zero drift/order/hydration errors, `shadow_errors=0`, and no authority leak. Existing D1 migration receipt `35329772751` remains the only migration evidence: tip 0037, ledger 37, 500 recipes/runtime fields, 2/2 approved batches, FK `[]`, quick check `ok`; no migration or additional D1 write occurred.

Durable receipt: `recipe-catalog/T15B_SHADOW_CERTIFICATION.md`. Rollback remains available through the approved Deploy workflow with `recipe_catalog_mode=static`; previous Worker `ab8ff038-2aaa-468b-a9de-8c5d94f14052` is retained. PR #29 remains open/conflicting and was not merged. Canary, full D1, cutover, media/R2, T14G, Inventory Truth/T09/T11, PayOS/auth changes remain out of scope. Classification: `T15B_SHADOW_COMPLETE`; stop before canary/full D1.

## Previous T15B-PRE checkpoint — STATIC certified; SHADOW wiring PR ready (superseded 2026-09-18)

Canonical main remained `0fe2cf071693208f6c642d8cbd994f5a79b5a2cf` in repository `1368281478` (`frigo-6/Frigo-dev`); PR #29 stayed open and unmerged. Existing production D1 receipt run `35329772751` is SUCCESS and independently records ledger 37/tip `0037_recipe_catalog_scale.sql`, 500 recipes/runtime fields, approved batches `2/2`, release `rel-bd00a4f53fcaeee4`, FK `[]`, `quick_check=ok`, and 500 pending/0 ready media rows. No migration was dispatched again.

Static production Deploy run `35333517052` passed release `105563003928`, required production Environment approval, production `105563057055`, full gates, read-only schema gate, smoke, and exact-SHA convergence (attempt 1, 587 ms). Worker version changed from `56979cb5-e1a8-4241-8a4c-2432d41cc439` to `ab8ff038-2aaa-468b-a9de-8c5d94f14052`, serving exact SHA `0fe2cf071693208f6c642d8cbd994f5a79b5a2cf`. Five repeated live checks returned healthy database/config, static source, and 71 recipes; legacy IDs remained available and sampled Batch B IDs were absent. Full evidence: `recipe-catalog/T15B_PRE_STATIC_RECEIPT.md`.

Authority audit found no approved existing Shadow switch. PR #30 from `codex/t15b-shadow-wiring` contains only minimal reviewed workflow plumbing and guardrails for a `static|shadow` input; canary/full-D1 are not expressible. Local focused tests are 99/99; full gates are lint, typecheck, 173 files/3976 tests, migration smoke, build, and diff-check PASS. Implementation head `97aff50d…` exact CI run `35335079345` is SUCCESS; the final documentation head must also pass exact-head CI. Classification: `T15B_PRE_SHADOW_WIRING_PR_READY`; stop for independent review. No Shadow activation, canary, full D1, media/R2, T14G, Inventory Truth, PayOS, auth, force-push, or history rewrite.

## Current T15A — pre-production rollout hardening COMPLETE (production untouched)

T14F merged to main `9be395d0…`. T15A schema-gate hardening merged via PR #26 → main `70cf7e0d…` (`scripts/d1-schema-gate.mjs` derives required migrations from `migrations/`; `d1-migration-check.mjs` pinned chain + `catalog` certification). T15A-R / T15A-R2 merged via PR #27 → main `0fe2cf07…` (exact-main CI SUCCESS; automatic staging deploy SUCCESS, exact-SHA convergence via the helper on attempt 1, production SKIPPED): `scripts/wait-for-deployed-release.mjs` (bounded exact-SHA polling; root cause of Deploy 35288137887's false negative); `verifyDeployedRelease` requires `readiness.commit` to be a canonical 40-hex SHA (malformed/missing fail closed; only a healthy, correct-environment body with a *different valid* SHA is `RELEASE_PROPAGATION_PENDING`); workflow wiring — `catalog` step in `production-d1-migrate.yml` (after `verify`, before the remote schema gate), shell-interpolated input removed, staging + production deploy proof via the helper, permissions unchanged — with unconditional guardrail tests. `recipe-catalog/t15a-r/workflows.patch` and `r2-wired-series.mbox` are consumed audit evidence. Production: D1 not migrated (historical last verified tip 0034 — re-query live before Phase B), Worker `4ed98514…`, static 71, no shadow/canary/media/T14G. Receipt + resume requirements: `recipe-catalog/T15A_WIP_HANDOFF.md`.

## Current T14F — T14F_DEVELOPMENT_COMPLETE (T14F-A/B/C certified; 500-recipe catalog dev-certified; production untouched)

T14F-A pilot certified (`b0150d0…`); T14F-B 399 scale recipes certified (`7d667523…`); **T14F-C certified and closed**: 0037 promoted byte-identical to the certified factory artifact (`68e52e6d…`), shipped manifest **500 recipes / 2 batches** (`rel-bd00a4f53fcaeee4`, `fa47d31f…`), fresh 0001→0037 / 0036→0037 / production-forward 0034→…→0037 replay PASS, D1 readiness READY 500, static/shadow/canary/full-D1 PASS (reader 5 statements, no N+1), user flows incl. Batch B recipes across six cuisines PASS, T09/T11 unchanged. Certificate: `recipe-catalog/T14F_C_500_CATALOG_CERTIFICATION.md`.

Closure (safe stop `44c0ad38…` resolved): `pnpm lint`, `pnpm build`, full `pnpm test` **171 files / 3913 tests**, typecheck, `check:migrations` through 0037, `recipe:seed:check`, `recipe:import:check` (500/2), `git diff --check` — all PASS. Hosted validate on `44c0ad38…` failed only in the five real-D1 suites: replaying 0001→0037 in one workerd overflows workerd 1.20250718's 1 MiB prepared-statement cache and segfaults (cloudflare/workerd#5977). Fixed forward-only in `8c6080aa…` (tests only — `tests/helpers/local-d1-worker.mjs` recycles workerd before the cache overflows; no migration/catalog/runtime change). A second blocker on the docs heads — vitest worker `onTaskUpdate` RPC timeout after all 3913 tests passed — is fixed forward-only by `tests/helpers/vitest-event-loop-yield.ts` (setupFiles yield per test; test config only). Exact final head + hosted exact-head validate SUCCESS are bound in the PR #25 final certification receipt. 0036 `04228788…` unchanged; legacy fingerprint `9ae153e64…`; `ALL_RECIPES` still 71.

Classification: `T14F_DEVELOPMENT_COMPLETE` · `T14F_REAL_CATALOG_500_COMPLETE` · `T14F_500_AUTHORITY_CERTIFIED` · `T14F_C_CLOSED` · `PRODUCTION_ROLLOUT_DEFERRED` · `MEDIA_POPULATION_DEFERRED` · `T14G_NOT_STARTED`. P0/P1/blocking-P2 = 0; P3 = 1 (unpaginated ~780 KB `/recipes` at 500 — T14G). **Production does not contain 500 recipes** (still at its own migration tip, static authority). PR #25 is **ready for review, unmerged**; merge, production rollout, media population and T14G each require separate authorization. `recipe-catalog/T14F_C_WIP_HANDOFF.md` is historical only.

### T14F-A — T14F_PILOT_CERTIFIED / T14F_SCALE_NOT_STARTED (certified earlier)

Repository ID 1368281478 = `frigo-4/Frigo-dev`; branch `hoplite/massalia-c2862d7c`;
main unchanged at `f0c229f2e2b134904a8c0e355479394cbf53c954`. PR #25 draft/open/unmerged,
auto-fix subscribed. Inspected inherited test-only `8079a37`; verification commit
`2ee6f5cc0e144e5c522ce91bd005ab61dc124ed5` adds explicit source/fallback/cache and cleanup assertions.
Reproduced original routing failures 5/7 at `585e718f…`: historical 71 fixture vs real 101
manifest correctly yields COUNT_DRIFT/static/no cache. The fix generates a file-local legacy
release via the real composer. No production readiness/runtime, pilot, manifest, or migration change.

Routing 8/8, growth 21/21, combined 29/29 twice, subsystem regressions 12 files / 383 tests PASS.
Independent non-isolated combined run also 29/29; review found no P0/P1/P2 blocker.
Executed `pnpm recipe:seed:check`, `pnpm recipe:import:check`, `pnpm typecheck`, `pnpm lint`,
`pnpm check:migrations`, `pnpm build`, `pnpm test`, `git diff --check`: **all PASS**;
full suite **171/171 files, 3911/3911 tests** (one added invalid-D1 regression).
Exact implementation CI **35223589293 / validate 105209475052 SUCCESS**.
Final documentation-head certification is bound by the [final receipt](https://github.com/frigo-4/Frigo-dev/pull/25#issuecomment-5714709031);
it is not a valid T14F-B base until that receipt records the exact final SHA and CI SUCCESS.

Pilot 30 + static 71 = release 101/1 batch; complete 101, order 0..100; reader 5 statements,
cache hit 0, no N+1. Fresh/staged replay, authority modes and imported HTTP flows PASS.
Next: **STOP.** T14F-B requires separate authorization and the receipt's final certified head.
No ingredient scale preflight, Batch B, 0037, 500 manifest, production/media/T14G action.
Exact commands/hashes: `recipe-catalog/T14F_NEXT_HANDOFF.md`; prior failures remain historical below.
Pre-existing `.hoplite/settings.json` delta remains untouched and uncommitted.

## Historical checkpoints (not current T14F status)

## T14F — WIP SAFE STOP on branch `feat/t14f-recipe-catalog-500`; pilot compiled + promoted; NOT certified; Batch B not started (2026-09-17)

Safe-stop checkpoint per `docs/ai/recipe-catalog/T14F_WIP_HANDOFF.md`. Pilot batch `t14f-pilot-30-v1`
(30 original `ai_generated` recipes, source namespace `frigo.t14f.original.v1`) compiled via T14E:
30/30 valid/reviewed/publishable, 0 duplicates, 0 unresolved ingredients; `0036_recipe_catalog_pilot.sql`
promoted byte-identical to the compiler artifact (sha256 `04228788…20ba9`); shipped manifest regenerated
to `rel-193ac2b16c64a260` = 101 recipes / 1 approved batch, legacy fingerprint unchanged. `ALL_RECIPES`
still 71; migrations 36 / tip 0036; 0001–0035 hash drift 0. Executed checks: typecheck, `check:migrations`,
seed check, import check, `git diff --check` all PASS; focused growth suites 20/21 — the
`production forward path 0034 → 0035 → growth` test fails when both growth suites run together and passes
alone (root cause not diagnosed; suspect test isolation). Full gates (lint, build, full `pnpm test`, bundle
accounting) NOT run; Batch B (399) NOT started; no PR; no production action. Do NOT mark pilot certified
or start Batch B before fixing that test failure.

## T14E — MERGED into main `f7a5540841db27be31cdab9e0c2010cd92bc3861`; main certified; production rollout DEFERRED (2026-09-17)

PR #23 (remediated head `ba1a45d4…`; original reviewed head `7b4edcc8…` remains an ancestor — forward-only remediation) merged by
normal merge commit; PR exact-head validate SUCCESS (run 35179141504 / check 105067327285); post-merge exact-head main validate
SUCCESS (run 35182568280 / job 105077715190); application tree PR head → main preserved (0 files). Fresh local certification on the
exact merge SHA: 169 files / 3889 tests, focused T14E 88, regression 435; seed/import/typecheck/lint/`migration-smoke=ok`/build/
diff-check green. Invariants on main: `ALL_RECIPES` = 71 rollback baseline; release `rel-1a047444a3632771` (71 / 0 batches,
fingerprint `9ae153e6…7c3f` == static == expected runtime); migrations 35 / tip 0035 / no 0036; nutrition evidence persisted via
`nutrition_profiles` + `recipe_nutrition` (real SQLite replay: hydrate OK, ranking reader sees profile, readiness READY);
`batchHash` commits to license/usageNote/evidence/duplicateReview (⇒ `releaseId`), runtime fingerprint provenance-independent;
`RELEASE_MANIFEST_INVALID` ≠ `D1_READ_FAILED`; growth readiness 71 READY, 71+6 synthetic READY with `ALL_RECIPES` still 71,
extra/missing/ID/order/legacy/imported/stub drift each NOT READY with its specific code. Inventory Truth, media architecture,
worker router, deploy workflows unchanged. Incidental staging Deploy 35182789974 SUCCESS (production job skipped — not a rollout).
Status `T14E_DEVELOPMENT_COMPLETE` · `T14E_MAIN_CERTIFIED` · `REAL_CATALOG_GROWTH_NOT_STARTED` · `PRODUCTION_ROLLOUT_DEFERRED` ·
`T14F_NOT_STARTED`. Not `T14E_PRODUCTION_COMPLETE`. **Production unchanged:** application `4ed98514…`, D1 tip 0034 (0035 pending),
recipe authority static, operator dispatch pending (`recipe-catalog/T14CD_PRODUCTION_ROLLOUT_HANDOFF.md`). Receipt:
`recipe-catalog/T14E_MERGE_RECEIPT.md`; T14F base/prerequisites/chunking evaluation: `recipe-catalog/T14E_NEXT_HANDOFF.md`.
`T14E_FINAL_CANONICAL_MAIN` = the merge SHA of the docs-closure PR carrying these files (recorded in its post-merge comment).

## T14E remediation — review P1/P2/P3 closed on the feature branch; PR #23 re-review pending (2026-09-17)

Forward commit on the T14E branch (old head `7b4edcc8…` kept). **P1 nutrition evidence** now survives end-to-end:
`NormalizedImportRecipe.nutritionEvidence` (macros + `evidence` + ADR-004 `sourceType`, default `imported`) → `normalized-recipes.json`
→ canonical batch projection → generated SQL persists one per-serving `nutrition_profiles` row `<recipe-id>_nutrition_v1`
(`source_reference` = evidence) linked via `recipe_nutrition` at version 1, alongside the legacy compatibility macros; compiler guard
`NUTRITION_EVIDENCE_LOST` + renderer invariant make macros-without-evidence impossible. **P2 immutable batch hash**:
`canonicalBatchProjection` (single function for compile/verify/composition/CLI) commits to schemaVersion, batchId, sourceType/
namespace/reference, license, usageNote and per recipe batchOrder/sourceKey/runtime/provenance/classifications/nutritionEvidence/
duplicateReview; license/usageNote/evidence/review-reason changes ⇒ new `batchHash` ⇒ new `releaseId` (runtime fingerprint unchanged);
row order/whitespace/key order irrelevant; mutated approved batch ⇒ `BATCH_COLLISION`; `verify` detects source metadata mutation.
**P3**: release-manifest load/parse failure is `status=error, code=RELEASE_MANIFEST_INVALID` (not `D1_READ_FAILED`). Current release
`rel-1a047444a3632771` (71/0, fingerprint `9ae153e6…`) unchanged. Scale with 50 % evidence-backed recipes: 500 ≈0.83 MB, 2,000 ≈3.3 MB,
5,000 ≈8.3 MB SQL. Gates: lint, typecheck, seed/import check, `migration-smoke=ok` (35, no 0036), build, **169 files / 3889 tests**.
Status `T14E_REMEDIATED` · `T14E_READY_FOR_RE_REVIEW` · `REAL_CATALOG_GROWTH_NOT_STARTED` · `PRODUCTION_ROLLOUT_DEFERRED`; PR #23 unmerged.

## T14E — Bulk Recipe Import Factory + Catalog Release Manifest — development complete on feature branch (2026-09-17)

Base `9ff571995bf5f2a4381c2dfc6de796e6554fd43c`. Adds `packages/recipes/src/import/` (v1 batch schema, JSON/JSONL parser,
`imp-<sha256(ns:record)>` identity, exact canonical ingredient resolution, closed unit/cuisine/region gates, bucketed duplicate
detection with explicit waivers, deterministic plain-INSERT SQL renderer incl. pending hero media, Catalog Release Manifest
composer), the committed 71-recipe manifest `import/catalog-release.current.json` (`rel-1a047444a3632771`, fingerprint ==
static), `scripts/recipe-import.mjs` (validate/compile/verify/check; output only beneath `.artifacts/recipe-import/`),
`pnpm recipe:import:check`. `assessD1Readiness` is now manifest-driven (ALL_RECIPES = 71 rollback baseline; D1 must equal
the reviewed release: count/IDs/order/legacy-baseline fingerprint/full fingerprint; new codes `RELEASE_MANIFEST_INVALID`,
`LEGACY_BASELINE_DRIFT`); current 71 readiness unchanged (same fingerprint, READY). Proven on real SQLite replay: 71+6 imported
⇒ READY while ALL_RECIPES stays 71; extra/missing/drift/reorder/stub ⇒ NOT READY. Scale: 500/2,000/5,000 synthetic compiles
deterministic (SQL ≈0.78/3.1/7.9 MB). **No 0036, no real recipe, no production/Cloudflare action, authority still static,
T14F not started.** Gates: lint, typecheck, seed check, import check, `migration-smoke=ok` (35), build, **168 files / 3878
tests**. ADR-027; design `recipe-catalog/T14E_BULK_RECIPE_IMPORT_FACTORY.md`; handoff `T14E_NEXT_HANDOFF.md`.
Status `T14E_DEVELOPMENT_COMPLETE` · `T14E_READY_FOR_REVIEW` · `REAL_CATALOG_GROWTH_NOT_STARTED` · `PRODUCTION_ROLLOUT_DEFERRED`
(PR unmerged; production still `4ed98514…` / D1 0034 / static — operator dispatch pending per `T14CD_PRODUCTION_ROLLOUT_HANDOFF.md`).

## T14C/T14D OPS — Production D1 Migration workflow merged (main `6910a7b4aee875f061454528daf6b4f0777e7f1a`); production still untouched, awaiting operator dispatch (2026-09-17)

PR #21 merged (normal merge; exact-head validate SUCCESS run 35168563076). Adds `.github/workflows/production-d1-migrate.yml`
(`workflow_dispatch` only; `environment: production`; exact-SHA + pinned-history + hosted-CI gate; Cloudflare/D1 identity
`frigo-db` / `f975ec39-…`; ledger apply-vs-certify classification; D1 Time Travel bookmark; counts-only baseline; plan must be
exactly one migration; post-apply ledger/FK/quick_check/drift/`recipe_media` seed + schema gate; sanitized receipt only) with
`scripts/d1-migration-check.mjs` (17 unit tests). Fixes `scripts/d1-schema-gate.sql` to 5 `UNION ALL` branches — hosted D1
caps compound SELECTs at 5, so the 6-branch T14C gate would have failed every production pre-deploy gate. Application tree
unchanged vs `ed34c6b9…`. **Production unchanged:** Worker `4ed98514…`, D1 tip 0034 (0035 pending), recipe authority static.
Staging auto-deploy 35168741683 serves `6910a7b4…` (exact-SHA receipt SUCCESS; media hero sources 59 legacy_external /
12 legacy_static / 0 canonical_r2). Blocker: Hoplite cannot dispatch `workflow_dispatch` workflows and the sandbox has no
GitHub/Cloudflare credential — an operator must run the two dispatches with the exact inputs in
`recipe-catalog/T14CD_PRODUCTION_ROLLOUT_HANDOFF.md`. `DEPLOY_SHA=6910a7b4…`, `hardened_sha=bb504cce…`. Status:
`OPS_WORKFLOW_MERGED` · `AWAITING_OPERATOR_WORKFLOW_DISPATCH`; not `T14C_PRODUCTION_COMPLETE`, not `T14D_PRODUCTION_RUNTIME_DEPLOYED`.

## T14D — MERGED into main `bb504cce7476927249b3c6e4d5bc634600a45883`; main certified; production rollout DEFERRED (2026-09-16)

PR #19 (head `f2831805…`) merged by normal merge commit; exact-head main CI validate=SUCCESS (run 35157739716 /
check 105001075798); fresh local certification 163 files / 3801 tests, focused 131. Status
`T14D_DEVELOPMENT_COMPLETE` · `T14D_MAIN_CERTIFIED` · `PRODUCTION_ROLLOUT_DEFERRED`. **Production unchanged:**
application `4ed98514…`, D1 tip 0034 (0035 pending), recipe authority static, no cutover fence set. Receipt:
`recipe-catalog/T14D_MERGE_RECEIPT.md`; next-phase state + OPS sequence: `recipe-catalog/T14D_NEXT_HANDOFF.md`.
`T14D_FINAL_CANONICAL_MAIN` = the merge SHA of the docs-closure PR carrying these files (recorded in its post-merge comment).

## T14D — Recipe Catalog Authority Cutover Architecture — development history (2026-09-16)

Base `d0856b48e043c72d1793002e7c6047a186ac890d`. Adds `packages/recipes/src/recipe-authority.ts`
(RecipeAuthoritySnapshot, StaticRecipeAuthority, D1RecipeAuthority reusing T14B-B hydration, SHA-256 catalog
fingerprint, strict readiness codes, FNV-1a canary bucketing) and `src/worker/services/recipe-authority.ts`
(modes `static|shadow|canary|d1`, `RECIPE_CATALOG_CUTOVER_ENABLED` fence, `RECIPE_CATALOG_D1_CANARY_PERCENT`,
30 s/5 min bounded cache with singleflight, canary/d1 fallbacks, PII-free events + counters). Every runtime recipe
reader (`/recipes`, `/recipes/:id`, `/recommendations`, cook start/complete, week create/regenerate/swap, shopping
attribution, planner defaults) now uses ONE authority snapshot per operation; unknown runtime readers = 0 (guarded).
**No migration (tip stays 0035, no 0036). Production untouched: application `4ed98514…`, D1 tip 0034, recipe mode
static; T14C 0035 rollout still pending; nothing deployed.** ADR-026; design `recipe-catalog/T14D_RECIPE_AUTHORITY_CUTOVER.md`.
Status: `T14D_DEVELOPMENT_COMPLETE` / `PRODUCTION_ROLLOUT_DEFERRED` pending review of the PR.

## T14C — MERGED into main `3a1e6be610085d7f9cfed8a53f43ef6ea006ed5c`; production rollout pending operator (2026-09-16)

PR #17 (head `7b37325f…`) merged by normal merge commit; exact-head main CI validate=SUCCESS
(run 35147336385 / check 104966628291); local certification 161 files / 3776 tests. Automatic staging deploy
run 35147682739 SUCCESS (staging D1/R2 only). **Production is unchanged:** D1 `frigo-db` ledger tip still
`0034_global_recipe_catalog_parity.sql` (not read — no Cloudflare credentials in this session), Worker still
`4ed98514…`. Status `T14C_PRODUCTION_MIGRATION_BLOCKED` (credentials), not `T14C_COMPLETE`. Runbook and
receipt: `recipe-catalog/T14C_MERGE_RECEIPT.md`. Recipe authority remains `ALL_RECIPES`; T14D/T14E not started.

## T14C — Recipe Media Layer — development history (`feat/t14c-recipe-media-layer`, 2026-09-16)

Base `8d3ebc444bbaa577893dd88a9d21f308a24f0cf5` (T14C_CANONICAL_BASE_MAIN). Adds migration
`0035_recipe_media_layer.sql` (rendered by `renderRecipeMediaLayerSql`; `recipe_media` with closed
role/status/source vocabularies, `UNIQUE(recipe_id, role, version)`, partial-unique current-ready index,
ready invariant, storage-key/MIME CHECKs, immutable-ready trigger, 71 truthful `pending` hero slots),
`packages/recipes/src/recipe-media.ts` (types, `buildRecipeMediaStorageKey`, `resolveRecipeMedia`
precedence canonical_r2 → legacy_static → legacy_external → missing), `packages/db/src/recipe-media.ts`
(`D1RecipeMediaCatalog` bulk IN-chunk reads — no N+1; stage/promote/reject write helpers),
`src/worker/routes/recipe-media.ts` (public read-only `GET|HEAD /api/v1/recipe-media/:id/:role/:version`,
D1-trusted key only, allow-listed MIME, immutable cache + ETag), additive `media.hero` on `/recipes`,
`/recipes/:id`, `/recommendations` attached AFTER filtering/ranking, and `src/web/lib/recipe-media.ts`
as the single frontend fallback point for all 7 image surfaces. 0034 is now pinned in the hash manifest.
Schema gate/migration smoke extended to 0035. ADR-025; design `recipe-catalog/T14C_RECIPE_MEDIA_LAYER.md`.
**Recipe authority remains `ALL_RECIPES`; no `d1` mode; production D1 stays at 0034; no production R2
write; no deployment; PR not merged (independent review required).** Media audit: 71 recipes, 45 unique
refs, 59 external (Unsplash, CSP-blocked), 12 same-origin (1 missing asset gl-11), 20 duplicate refs,
prompts 59/71. Status: see HANDOFF for the exact-head CI receipt.
**Independent-review remediation (same branch, forward commit):** `promoteRecipeMediaVersion` now takes the
R2 binding and verifies the object (exists, exact MIME, exact size, SHA-256 of actual bytes) before the
atomic D1 promotion; 0035 (still the only new migration, no 0036) now requires `content_length` for ready
and enforces the exact deterministic `storage_key` via `CASE mime_type`; `auditReadyRecipeMediaRecord`
reports `missing_content_length`. Production D1 remains 0034; nothing deployed; PR #17 not merged.

## T14B-B — COMPLETE: production D1 0034 applied, Worker deployed — 2026-09-16

Status `T14B_B_COMPLETE`. Production D1 `frigo-db` (`f975ec39-…`) ledger tip is now
`0034_global_recipe_catalog_parity.sql` (34 rows; applied after export backup SHA-256
`ab082dd4…343c`); certified 71/59/12 recipes, 385 ingredients, 341 steps, 71 runtime-field rows
(`runtime_order` 0..70 unique), 385 contiguous ingredient ordinals, `foreign_key_check=[]`,
`quick_check=ok`, remote schema gate PASS, zero drift in non-recipe aggregates.
GitHub environments `staging`/`production` now hold `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`
(production has a required-reviewer gate); Deploy staging run 35101845374 SUCCESS, production run
35102115354 SUCCESS (owner-approved). Production Worker version `56979cb5-e1a8-4241-8a4c-2432d41cc439`
serves `4ed98514f65ddd3b3d83007cd726fd7c2e2136e6`; readiness reports `commit=4ed98514…`, recipes 71/59/12 in
static order, auth config 200, CORS preflight 204. Pre-existing `CONFIG_PLUS_GRANT_SECRET_MISSING`
warning unchanged. Recipe authority remains static `ALL_RECIPES` (`RECIPE_CATALOG_MODE` unset; no `d1` mode).
Evidence: `recipe-catalog/T14B_B_FINAL_COMPLETION.md`. T14C: `READY_TO_START`, not started —
`recipe-catalog/T14C_HANDOFF.md`; `T14C_CANONICAL_BASE_MAIN` = the merge SHA of this docs PR (recorded in
its post-merge comment). The section below ("blocked by existing OPS secret") is historical.

## T14B-B — MERGED to canonical main 2026-09-16; production rollout blocked by existing OPS secret

Canonical main is now `c7455160bfc8d279d38bc7ca4c0751542012a3c5` (merge of PR #14 head `004e5a32…`
onto `c1c1c14a…`; normal merge commit; exact-head main `validate` SUCCESS run 35072991882; fresh
main gates green, 157 files / 3704 tests). Production D1 `frigo-db` has **not** yet received 0034 and
the production Worker still runs the pre-T14B-B lineage: the automatic Deploy (run 35073197948)
failed at the staging step because `CLOUDFLARE_API_TOKEN` is not configured in the GitHub `staging`
environment (`T14B_B_PRODUCTION_DEPLOY_BLOCKED_BY_EXISTING_OPS_SECRET`), and this session had no
Cloudflare credentials to apply the migration. Status `T14B_B_ROLLOUT_BLOCKED`; T14C not started.
Receipt: `recipe-catalog/T14B_B_MERGE_RECEIPT.md`.

## T14B-B — D1 catalog parity, runtime view & shadow foundation — 2026-09-16 (merged; details)

Branch from exact canonical main `c1c1c14a2a7dccc883f1030d0dee7043754fb4a9` (repository
`vn-clo/Frigo-dev`, ID `1368281478`, protected). Migration
`0034_global_recipe_catalog_parity.sql` (SHA-256 `23f35645…ada4d`, re-rendered in place during
review remediation — unmerged, no 0035) seeds the 12 static-only global recipes `gl-01..gl-12`
under their stable IDs/slugs and adds `recipe_runtime_fields` (canonical `runtime_order` 0..70
UNIQUE; `category` = typed **open** non-empty string; `region` = **closed** vocabulary
`bac|trung|nam|toan_quoc`; legacy nutrition compatibility macros) plus
`recipe_runtime_ingredient_order` (explicit 0-based ingredient ordinal, `UNIQUE(recipe_id,
position)`, 385 rows). Fresh local replay: `recipes=71`, `recipe_ingredients=385`,
`recipe_steps=341`, `recipe_runtime_fields=71`, `recipe_runtime_ingredient_order=385`,
`recipe_classifications=0`, `recipe_nutrition=0`; drift `staticOnly=[] d1Only=[]
orderDrift=0` and every core/requirement/unit/step/tag/media dimension `[]`; nutrition
`legacy_compatibility`; classification `typed_runtime_field`. Migrations `0001–0033` are
hash-identical to a fixed manifest pinned from `c1c1c14a…`.

Catalog order is behaviourally significant and persisted: `StaticRuntimeRecipeCatalog`
preserves `ALL_RECIPES` order, `D1RuntimeRecipeCatalog` reproduces it independently from
`runtime_order`, and behavioural parity (recommendation, tie-sensitive ranking, planner
generate/regenerate/tie, >5-alternative swap + executed swap, shadow health) is proved on the
**actual** D1 catalog output with no test-side reordering and reversed-catalog negative controls.

`hydrateRuntimeRecipes` (fail-closed) + `StaticRuntimeRecipeCatalog`/`D1RuntimeRecipeCatalog` +
`compareRuntimeCatalogs` give a D1 runtime view that is `toStrictEqual` to all 71 static
recipes; recommendation, planner generate/regenerate/swap and cooking (`gl-03`, `vn-canh-01`)
are proved identical on the hydrated view. **User-visible authority remains `ALL_RECIPES`.**
`RECIPE_CATALOG_MODE` = `static` (default) | `shadow` (off-response comparison, at most one per
isolate per `RECIPE_CATALOG_SHADOW_INTERVAL_MS`, PII-free diagnostic); no `d1` mode exists;
production config rejects non-static.
`SNAPSHOT_POLICY=IMMUTABLE_PAYLOAD_AUTHORITATIVE`; media `DEFERRED_TO_T14C`; cuisine taxonomy
deferred; Inventory Truth, Qwen, PayOS untouched; no production D1/deploy. Details and
evidence: `recipe-catalog/T14B_B_D1_PARITY_SHADOW.md`, ADR-024. PR #14 open against `main`;
exact-head hosted `validate` recorded there.

## Current T14 integration refresh — 2026-09-15 UTC

Canonical repository: `vn-clo/Frigo-dev` (ID `1368281478`). Verified main before
this docs-only receipt: `a165474a623a8130c9a9ed4f1df096b3ac3b3ae9`; not the historical T14 audit base
`345cecf`. PR #9 merged as `911db7fdddcd60ea1e3f3c17b4aed3f4b922bda5`;
PR #10 is its docs-only rollout receipt. Recorded production Worker version
`20bc1f35-6ffe-4085-ba79-d54a0b53da71` serves the custom domain at 100%.
Auth GIS popup, OCR pending UX and SPA/API COOP fixes are preserved. The old
`e6b9195` production baseline below is historical, not current release authority.

T14A audit knowledge is reconciled in
`recipe-catalog/T14A_PRODUCTION_RECIPE_TRUTH_AUDIT.md`; recipe architecture and
migrations were unchanged by PR #9/#10. Fresh frozen install, lint, typecheck,
test (151 files / 3633 tests), migration smoke, build and diff check passed;
all 33 migration hashes match. T14A merged through PR #11 after exact-head
`e916d292d391ba999bcdd96bfdfec98e6b598678` passed hosted run `35034318031`.
Accepted T14B-A source PR #8 is now **merged through PR #12** as `a165474a`.
Exact integration head `3e3937419b560f1ebf0aa7f5e29a3131508b7d94` passed hosted
run `35035112092` and all fresh local gates (154 files / 3676 tests). Its 15
functional paths are unchanged from the accepted source; recipe ADR-023 preserves
Auth ADR-022. All PR #9 files, 33 migration hashes and inventory authority match.
**T14B-B NOT STARTED**. Authority remains static `ALL_RECIPES` (71 = 59 VN +
12 global); D1 remains shadow, media is deferred to T14C, no 0034 is created.

Post-T14B-A main CI `35035415271` passed. Deploy `35035612637` has release success,
staging failure from missing `CLOUDFLARE_API_TOKEN`, production skipped. This is
an OPS/RELEASE blocker, not T14. PR #4 remains open; **CLOSE_ARCHIVE** is the
recommended disposition, not merge. No deployment or production mutation here.
The RuntimeRecipe contract, completeness/FK-stub classifier, read-only D1 content
projection, drift audit and hardened seed renderer remain non-authoritative.
Fresh local replay: D1 complete 59, static-only `gl-01..gl-12`, d1-only/incomplete/
rejected empty, supported-field drift zero, nutrition `unsupported_by_catalog_model`.
Both integration prerequisites are complete (**READY_FOR_T14B_B**); no new task
is started. The receipt PR's post-merge comment records exact final main and
`T14B_B_BASE_MAIN` after this docs-only receipt, which cannot embed its own merge SHA.
Exact checks, status and next action: `recipe-catalog/T14_INTEGRATION_REFRESH.md`.

# Historical checkpoints — superseded as current-state and next-action authority

The original receipts below are retained, including their then-current SHAs,
test totals and “not started” statements. Use the refresh above for current truth.

## Auth/OCR production hardening checkpoint — 2026-09-16

Branch `codex/auth-ocr-production-fix` contains a focused production fix for
the auth/OCR issues observed on the live Takosan screen. The credential-less
`Đăng nhập nhanh với Google` fallback was removed; Google Identity Services now
waits for the async SDK, initializes once, and exposes an honest retry state if
the provider script is unavailable. The backend's strict Google credential and
audience checks were not changed.

Scan, fridge review and receipt review now share `ScanProcessingState`, showing
received/queued/analyzing/validating/review stages, elapsed time and a clear
promise that results appear only after server processing completes. Existing
`pending`/`processing`/`ready`/`confirmed`/`failed` contracts and polling remain
unchanged.

Verification on this branch: focused auth/OCR `54/54`; full Vitest `3632/3632`
across 151 files; `pnpm lint`, `pnpm typecheck`, `pnpm check:migrations`,
`pnpm build`, and `git diff --check` passed. No production deployment, remote
migration, secret/configuration change, PayOS change or production resource
mutation was performed. Next action: browser smoke on the exact branch/PR,
then hosted CI and maintainer review before any release.

## Production rollout receipt — 2026-09-15

The previously blocked rolling-schema release was completed with explicit
operator authorization. Production D1 `frigo-db` now reports the complete
`0001`-`0033` ledger; `pnpm schema:check:remote` passed, including inventory
authority, scan evidence retention/completeness and foreign-key checks. The
pre-migration SQL export is `/tmp/frigo-prod-pre0032-20260916.sql` with SHA-256
`378c023b15c159d140162e6eb74bbf2ad584e7b699c72384379119defe6dec6a`.

Compatibility Worker `64ee9ed1d986a5e521598a36656e9c2f59d682ee` was deployed
first, then canonical Worker `e6b91956484589c088e6d04a9835b3e59a2eb786` was
deployed to the production custom domain. Readiness now reports the exact
canonical SHA with `database=ok`, `queue=ok`, `ai=configured`,
`config.ok=true`; the only issue is the pre-existing warning
`CONFIG_PLUS_GRANT_SECRET_MISSING`. Public health, recipes, manifest/Takosan
branding and unauthenticated mutation boundaries returned expected responses.

Remote SQL API ad-hoc `PRAGMA` queries returned Cloudflare `SQLITE_AUTH`; the
repository-owned remote schema gate is the accepted read-only evidence. No
production KV/R2/queue data was mutated, and no PayOS, DNS, secret rotation or
T14 work occurred. PR #4 (`release/pre0032-schema-compat`) remains open with
no hosted checks; it must be reviewed/merged before the compatibility code is
considered part of canonical `main`.

## Canonical repository consolidation

**CANONICAL REPOSITORY CONSOLIDATION COMPLETE.** The canonical repository is
`vn-dlo/Frigo-dev` (ID `1368281478`), and `main` is
`a5cfb14cfd5840be23eb16b26a3689f5e2d6e805`. PR #2 merged reviewed head
`7ede92c73a41da24500746fd0eded892689d8558` using a history-preserving merge
commit; its tree matches the reviewed head exactly. The immutable application
freeze remains `5f6853d0ed11415871dca0fd31d4981d60518310`; `e34ed167` is
historical and superseded.

Exact PR CI run `34972891435` and post-merge main CI run `34973522150` passed.
Branch protection requires strict `validate`, blocks force-push and deletion,
enforces admins, and retains the maintainer-authorized approval count of zero.
The rollback pointer preserves old main `d1b06732` at
`archive/pre-canonical-consolidation`.

## Maintainer review acceptance

`EXTERNAL_TECHNICAL_REVIEW=APPROVED` for final reviewed head
`7ede92c73a41da24500746fd0eded892689d8558`, with P0=0, P1=0 and P2=0. The
maintainer explicitly accepts that review as sufficient for this repository
consolidation and may waive only the GitHub-native collaborator approval
requirement. CI, PR, force-push and branch-deletion protections remain active.

## Production deployment status

**ROLLOUT COMPLETE WITH FOLLOW-UP.** Production is serving canonical
`e6b91956484589c088e6d04a9835b3e59a2eb786` and D1 is at migration `0033`.
The compatibility sequencing concern was handled by deploying `64ee9ed1`
before the bridge migration. The remaining follow-up is review/merge of PR #4;
do not down-migrate or bypass branch protection. PayOS, DNS, secret rotation,
production KV/R2/queue data and T14 remain untouched.

# Historical production integration evidence — 2026-09-15

## Historical merger-plan audit — superseded as current authority

**NOT READY TO MERGE OR DEPLOY.** A fresh two-repository/branch/migration audit
is recorded in `docs/integration/CANONICAL_REPOSITORY_CONSOLIDATION_PLAN.md`;
the separate production rollout risks remain in
`docs/integration/SAFE_PRODUCTION_MERGER_PLAN.md`. Production
`main` already contains adapted frontend upgrade lineage `d270cd4`/`57c88c5`
and platform hardening lineage `3f33d11`; historical tips `fafe1cc`, `2052932`
and `089c406` are not independent cherry-picks. The confirmed migration
collision remains production `0023_scan_request_fingerprint.sql` versus dev
`0023_inventory_truth_foundation.sql`, resolved by immutable production
`0001`-`0023` plus byte-copied T08-T13 `0024`-`0033`.

Qwen task-runtime source `da41686` is 15 commits ahead of and not contained in
production `main`; it remains a required merge source. The fetched history's
additional `0024`-`0032` filename variants are the current integration branch's
`+1` aliases of the same certified dev blobs, not extra migrations.

New release blocker: canonical `0032_scan_evidence_retention.sql` enforces
`review_state`/`is_confirmed` coupling, while the current production Worker
writes only `is_confirmed`. The integrated Worker also assumes the new columns
exist. A schema-capability compatibility release and rolling-upgrade rehearsal
must precede any remote bridge migration. That compatibility release must be
merged/deployed independently, followed by separate Qwen/runtime, T08-T13
bridge, and Takosan brand-only trains; each begins at the prior deployed head.
Current `f26003b` is not production-deployable as-is; canonical repository
promotion still requires the exact lineage, docs-only and hosted-CI gates.
Repository access remains production
`ADMIN` and Frigo-dev `WRITE`. Promotion branch `canonical/5f6853d-promotion`
was published at `f48e830ed9cdde2214ad5b4dbd58b8bc30c06106`, archive pointer
`archive/pre-canonical-consolidation` preserves `d1b06732`, and PR #1 was
closed. PR #2 later completed the canonical merge; no production deploy or
remote database/resource mutation occurred.

Fresh planning-audit checks: repository/API metadata, heads/merge-base/ancestry,
source diff inventories, all-ref migration variants, bridge blob equality,
production/integrated scan SQL inspection, and two real SQLite ordering probes.
Both probes exited `1` with the expected trigger/missing-column failures.
Promotion validation then passed: frozen install, lint, typecheck, migration
smoke, build, `git diff --check`, full Vitest `3630/3630` (149 files), local D1
`92/92` (5 files), and browser `60/60` serial at 360/390/430. Hosted PR checks
have not started/reported yet; branch protection API remains 404.

## Historical remediation state — superseded by the merger-plan audit above

**INDEPENDENT-REVIEW BLOCKERS FIXED AND COMMITTED.** The working branch remains
`integration/t13-takosan-qwen`; remediation candidate is `5f6853d` on base HEAD
`231d1e7`.
The reviewed candidate `e34ed16777166407acf67b2c76d733d89c7d64ca` is
superseded and must not be merged as-is.

Protected payment UI is restored byte-identically to production base
`05423f2`; brand assertions exclude those protected surfaces. The Qwen scan
regression now exercises real router/runtime/provider composition and mocks only
synthetic DashScope HTTP before queue persistence and T13 confirmation.
Missing/0/.11/.9 confidence remains exact evidence; low confidence is retained
for review, while generic labels are rejected. Runtime escalation preserves a
concrete prior error when the next role is disabled. Certified T13 DEC-012 auth
deferral is intentionally retained and documented as an auth difference from
production.

Exact fresh checks: focused `41/41`; broader affected matrix initially `300/302`
because two brand assertions included payment, then brand `16/16`; full Vitest
`3630/3630` in 149 files; `pnpm lint`, `pnpm typecheck`,
`pnpm check:migrations`, `pnpm build`, `git diff --check` PASS; browser `60/60`
at 360/390/430 PASS. No remote or production mutation occurred. Next action:
final review of immutable SHA `5f6853d`.
Two intermediate typecheck attempts exposed an over-generic then invalid
`fetch` spy annotation; `MockInstance<typeof globalThis.fetch>` fixed it and the
final typecheck plus focused `57/57` rerun passed.

Access preflight: `Tungjpstore` has production `ADMIN` and Frigo-dev `WRITE`;
repository IDs/default heads remain verified, with no branch protection or
rulesets reported. Local `origin` points to `Tungjpstore/yaji`, so it is not a
safe implicit publication target for this integration branch.

**HISTORICAL PRE-REVIEW CERTIFICATION — SUPERSEDED BY REMEDIATION ABOVE.** Branch `integration/t13-takosan-qwen` starts at verified
production `PRODUCTION_BASE=05423f2ad675006a4c7913e696f1979b3fcaae59` in
`Tungjpstore/Frigo` (ID `1360256196`). Normal common ancestor with certified
development is `d1b06732f8a80db4e77986df31ff28d9f04641fa`.
`INTEGRATION_APPLICATION_CANDIDATE=e34ed16777166407acf67b2c76d733d89c7d64ca`.

The candidate combines governed Qwen source `da41686b`, certified T13 freeze
`32ddbb4` / review `9c3c3d3`, and hardened Takosan source `ff63edf`. Production
`0023_scan_request_fingerprint.sql` is byte-identical; ten certified T13
migrations are byte-copied at `0024`-`0033`. Pre-existing production migration
changes `0`; bridge mismatches `0`; 33 unique contiguous migrations. The real
queue path preserves missing/0/.11/.9 evidence, provenance and fingerprint into
T13 confirmation; replay creates no duplicate T09 effects. T09/T11 remain the
mutation/read authorities; unknown writers/readers `0/0`.

Historical candidate gates: frozen install, lint, typecheck, migration smoke, build, diff check
PASS; full Vitest `3628/3628` in 149 files; real local workerd/D1 `92/92` in five
files; browser last and serial `60/60` at 360/390/430. P3-1 and P3-2 remain
unchanged. **NO HOSTED GITHUB CI STATUS FOR INTEGRATION_APPLICATION_CANDIDATE**.
No deploy, main merge, remote D1/R2/KV/queue mutation, PayOS backend change,
secret/DNS change, or T14. Full packet: `docs/integration/`.

# Takosan brand branch (independent descendant) — 2026-09-14

## Brand branch state — NOT part of the T13 certification

Out-of-band user-facing rebrand Frigo → Takosan on `hoplite/megara-hyblaia-6b723eb2`,
created from exactly `TAKOSAN_BRAND_BASE=897102b6816c22af2e6a49f29662690e3e3206e0`
(T13R published continuation). **TAKOSAN_BRAND_APPLICATION_CHECKPOINT=
`e37ee2808a50a7195dc90a2e7bb01be639aa186b`** (published via broker). The T13
freeze `32ddbb4…`, docs head `42e0037…`, continuation `897102b…` and main
`d1b06732…` are unchanged; Review #2 still targets exact `32ddbb4`.

Scope: brand assets (`public/takosan/`), `TAKOSAN_BRAND` contract, Takosan tokens
with `--frigo-*` aliases, Nunito, index.html / manifest / sw (`takosan-pwa-v2`),
Landing, Onboarding, Auth, chrome, empty/success states, visible copy. No diff in
`src/worker/`, `packages/db/`, `migrations/`, deps, or technical identifiers.
Checks at `e37ee28`: diff-check, typecheck, scoped lint, build PASS; Vitest
**3480/139**; browser **60/60**; brand QA 360/390/430 0 broken assets, 0 overflow.
Details: [docs/brand/TAKOSAN_MIGRATION.md](../brand/TAKOSAN_MIGRATION.md).

# Frigo current state — T13R certified, ready for independent review #2

## Current authoritative state — T13R certified freeze, 2026-09-14

**T13 REMEDIATION CERTIFIED — READY FOR INDEPENDENT FINAL REVIEW #2.** Repository
`vn-blo/Frigo-dev` (provider owner renamed from `vn-co3`), ID **1368281478**.
Branch `hoplite/delos-f0bb1d04` (this thread's broker-authorized branch; it
descends from `origin/hoplite/medma-164548ce` = `83248df…`, the T13R-B safe-stop
docs head). **T13R_APPLICATION_FREEZE=`32ddbb4f2bb636fdcf201e9ca99c4689d3655477`**,
published and fetch-verified. Protected main `d1b06732…` unchanged. Rejected
freeze `7b7bb69…` remains **DO NOT RELEASE**.

The freeze differs from the T13R-B candidate `7e68e3b` only by two certification
test/fixture commits (`bd2f5f3` fixture collision fix, `32ddbb4` new P2-B browser
reopen spec); `git diff 7e68e3b 32ddbb4 -- src packages migrations wrangler.jsonc
package.json pnpm-lock.yaml playwright.config.ts` is EMPTY. All T13R-A (P1-1..P1-4,
P2-A, P2-B) and T13R-B (P2-1, P2-4, P2-5, P2-6) fixes plus the IngredientRow
`/fridge` crash fix are re-verified at the freeze; original blockers P0/P1/blocking
P2 = **0/0/0**; original AC1–AC14 **all PASS**; roadmap R3/R4/R5/R6/R7/R8/R11 and
U1/U4/U6/U7/U8/U12/U13/U14 **DONE**.

Exact gates, pre-freeze and clean detached at `32ddbb4`: lint/typecheck/build PASS;
full Vitest **3471/138** (both); focused T13R-A **45/5**, T13R-B **171/7**, T08
130/2, T09 1259/17, T10 98/6, T11 39/2, T12 22/3, T13 320/12; real local D1
**92/5**; browser **60/60** (20 cases × 360/390/430, serial, last) both pre-freeze
and detached; `pnpm check:migrations` ok; fresh 32-migration real local D1 apply +
schema gate + FK 0; legacy populated 0030→0031→0032 replay on real local D1 (0
fabricated rows, pre-existing columns identical, schema gate PASS); **32**
migrations, 0031 `c580d30b…` and 0032 `48f26f7c…` unchanged, 0033 absent; writer/
reader UNKNOWN **0/0** (src/packages statement sets identical to `fc0f9c5` and
`7b7bb69`); `git diff --check` PASS; detached `git status --porcelain` EMPTY.
Retained failure: first full browser run on the `7e68e3b` tree was 3 failed/51
passed (fixture collision, fixed by `bd2f5f3`). **NO HOSTED GITHUB CI STATUS FOR
T13R_APPLICATION_FREEZE.** Record: [T13R_FINAL_CERTIFICATION.md](inventory-truth/t13/T13R_FINAL_CERTIFICATION.md).

**T13R_DOCS_HEAD=`42e0037f92104fd5dc3c89c633d91f67fa892724`** is remote on
`hoplite/delos-f0bb1d04` (local == remote verified; freeze→docs application-path
diff EMPTY). `hoplite/medma-164548ce` remains at `83248df…` (broker base-branch
restriction; pure fast-forward ancestor). Only next step: **INDEPENDENT T13 FINAL
REVIEW #2**. No merge/deploy/remote D1/PayOS/T14/repository reconciliation.
`.hoplite/settings.json` overlay uncommitted.

## Historical — T13R-A application checkpoint, 2026-09-13 (superseded)

**T13R-A COMPLETE — READY FOR T13R-B. NOT a final T13 freeze.** Repository
`vn-co3/Frigo-dev` (renamed from `vn-co2`), ID **1368281478**. Branch
`hoplite/oropos-eb2d4886--t13r-a-data-integrity-ownership`;
**T13R_A_APPLICATION_CHECKPOINT=`fc0f9c56c53ae7b17f2d1fb4770a6bc231ebc027`**.
Protected main `d1b06732…` unchanged. Rejected freeze `7b7bb69…` remains
**DO NOT RELEASE** and is the comparison baseline.

All six T13R-A findings are **FIXED** with permanent red→green regressions:
P1-1 async raw evidence (`scan-queue.ts`), P2-A complete raw mapping evidence and
P2-B reviewed-expiry round-trip (additive migration **0032**, sync+async writers,
DTO, both review pages), P1-2 canonical identity preserved under free-form rename
(`inventory.ts` PATCH), P1-3 lot-bound edit drafts (`IngredientDetailPage` keyed by
route + owner check), P1-4 receipt review requires `next.id === receiptScanId`
(`ReceiptReviewPage`). Migrations: **32**; 0001–0031 byte-identical; 0032 additive,
no backfill. Authority audit: inventory writer and T11 reader sets identical to the
freeze; UNKNOWN writers 0, UNKNOWN readers 0; no evidence column is stock authority.

Gates at checkpoint: lint/typecheck/build PASS; **3423/137** full Vitest;
**45/5** focused T13R-A; **92/5** real local D1 (workerd); **42/42** browser
(14 cases × 360/390/430); migration smoke with populated 0031→0032 upgrade; fresh
32-migration local D1 apply; legacy 0031→0032 populated upgrade on real local D1
(0 fabricated rows, FK 0); schema gate PASS. Details, commands and per-finding
tests: [T13R_A_REMEDIATION.md](inventory-truth/t13/T13R_A_REMEDIATION.md).

T13R-B blockers remain OPEN (Cloudflare fridge confidence fabrication, inventory
conflict/refetch UX, Home estimated-expiry qualifier, NULL opened-state truth).
No merge/deploy/remote D1/PayOS/T14/repository reconciliation. `.hoplite/settings.json`
overlay remains uncommitted by rule.

## Historical — T13R-A safe stop, 2026-09-13T15:50:34Z (superseded)

**T13R-A SAFELY CHECKPOINTED BEFORE IMPLEMENTATION.** Repository
`vn-co2/Frigo-dev`, ID **1368281478**. Independent audit `b9735b4` (docs-only,
FAIL verdict) is now remote on `hoplite/oropos-eb2d4886` with verified local/remote
equality; protected main and all rejected-freeze lineage are unchanged. Remediation
branch `hoplite/oropos-eb2d4886--t13r-a-data-integrity-ownership` starts at the
audit commit with an **empty non-doc delta** against the rejected freeze.

No remediation code exists yet: all six target findings (P1-1..P1-4, P2-A, P2-B)
are **NOT STARTED**; `NO_NEW_T13R_A_CODE_COMMIT=true`. Migrations remain 31 with
0031 untouched and no 0032. Cheap checks executed: `git diff --check` PASS; no
TypeScript/source file changed, so typecheck and scoped lint were correctly not
run. The pre-existing `.hoplite/settings.json` overlay stays uncommitted by rule.
Per-finding state, exact commands and resume point:
[T13R_A_REMEDIATION.md](inventory-truth/t13/T13R_A_REMEDIATION.md). Do not claim
T13 complete; next task is T13R-A implementation, then T13R-B blockers.

## Current authoritative state — independent T13 final review, 2026-09-13

**T13 INDEPENDENT FINAL REVIEW — FAIL.** The exact application freeze
`7b7bb695ee597a46cf4022a2c534e2fea374be5d` is not accepted for leaving T13.
Repository ID **1368281478** is verified; the provider now calls the same repo
`vn-co2/Frigo-dev`. Protected main and certified docs head remain unchanged.
Freeze → `4fcbc96b5a5d4b3cea2c2ad0bdb5682b1866891a` has an empty non-doc diff.

Fresh exact-freeze checks PASS: lint/typecheck/build, **3372/132** full,
**194/10** focused, **92/5** real local D1, **36/36** browser at 360/390/430,
migration smoke, all **31** fresh local migrations, legacy upgrade/replay,
local schema and diff checks. Detached status remains empty. Hosted checks and
legacy status contexts for the exact freeze are both absent.

Those gates miss confirmed blockers: **P0 0, P1 4, blocking P2 6**. Async queue
processing omits raw evidence and mishandles absent confidence; U7 can clear
canonical identity and submit a draft to another lot; receipt review accepts a
mismatched scan ID. Additional defects affect confidence, retained review fields,
confirmed expiry, conflict recovery, estimated-date labels and opening-state truth.
Independent local/browser counterexamples are retained; no application fix ran.

See [the independent report](release/T13_INDEPENDENT_FINAL_REVIEW.md) for exact
findings, original AC1–AC14, roadmap closure, commands, failed/inconclusive probes,
and evidence. Earlier COMPLETE/all-PASS statements below are historical and
superseded, not current approval. Next: a new T13 remediation branch for confirmed
blockers, then a new freeze and independent review. No merge/deploy/remote D1/
PayOS/T14/repository reconciliation. This review changed documentation only.

## Current authoritative state — T13 detached certification, 2026-09-13

**T13 COMPLETE — STOP for INDEPENDENT T13 FINAL REVIEW.** Repository
`vn-ca1/Frigo-dev`, ID **1368281478**. Protected main remains
`d1b06732f8a80db4e77986df31ff28d9f04641fa`.
Continuation: `hoplite/mende-26679a14--browser-harness-final-cert`, started at
`3262eaff86333da142ada1135e5a20c58ea640eb` with application WIP fd32aa8.
Browser-proven U7 metadata correction was committed separately as
`47b10e25d6853a9bc4f9dfcf2e83bc01ba330bf2`.
**T13B_APPLICATION_FREEZE=7b7bb695ee597a46cf4022a2c534e2fea374be5d** was
published, fetched and matched; subsequent changes are documentation only.

The repository-owned Playwright harness removes the Managed Preview dependency:
`pnpm test:browser` owns `node scripts/security-preview.mjs`, with synthetic
in-memory SQLite, blocked external application traffic and no remote bindings.
Pre-freeze and clean-detached browser **36/36** at 360/390/430; full baseline and
detached full suite both **3372/132 files**. Detached focused: T08 **130/2**,
T09 **1259/17**, T10 **98/6**, T11 **39/2**, T12 **22/3**, T13/T13B **271/12**;
current hardening/privacy/operator gate **194/10** (26 hardening, 26 actual CLI).
Fresh real local workerd/D1 **92/5**. Lint/typecheck/build/migration smoke/fresh
local D1 replay/legacy replay/schema/diff PASS; detached status **EMPTY**.
Writer/reader UNKNOWN **0/0**, **31 migrations**, 0031 unchanged/no 0032.
Original AC1–AC14 PASS; R3/R4/R5/R6/R7/R8/R11 and
U1/U4/U6/U7/U8/U12/U13/U14 DONE. P0/P1/blocking P2/unresolved scoped P3: 0.

Failure retained: concurrent detached browser initially passed 35/36 because the
full suite's existing source-writing generator triggered Vite reload during H.
The entire unchanged browser suite then passed 36/36 serially. Run source-writing
checks before browser certification, never alongside it in the same worktree.
HTML report credential leakage was fixed before freeze by removing that reporter
and adding actual lifecycle sanitization coverage. No freeze file changed afterward.
**NO HOSTED GITHUB CI STATUS FOR T13B_APPLICATION_FREEZE**; local gates are not hosted CI.

Exact commands, evidence, resolved failures and next action:
[T13B_FINAL_HARDENING.md](inventory-truth/t13/T13B_FINAL_HARDENING.md).
No main merge/deploy/remote D1/PayOS/T14/repository reconciliation.
All earlier current-state sections below are historical checkpoints, superseded here.

## Current authoritative state — fresh-session Preview safe-stop, 2026-09-13

**T13 NOT COMPLETE — BROWSER VERIFICATION BLOCKED.** Fresh-session public metadata
confirmed `vn-ca1/Frigo-dev`, ID **1368281478**. Trusted refs remain guarded main
`d1b06732f8a80db4e77986df31ff28d9f04641fa` and continuation
`hoplite/kos-9d39545d--t13b-b-final-certification` at
`a9b5904aeba0fc7e4d649165770a4e86701312a2`; fresh branch `hoplite/mende-26679a14` started at the
same SHA with an empty status/diff. The required ancestry
`2334a6f -> c37a9b8 -> f845d04 -> fd32aa8 -> a9b5904` and the empty non-doc delta
from `fd32aa8` to `a9b5904` were reverified.

The effective isolated run is `node scripts/security-preview.mjs`; no settings,
scripts, application code, tests, or final T13 documents changed. Three schema-valid
managed-Preview attempts (`preview`, 120 seconds, promotion `preview:3000`) failed
before harness startup with: `Preview port must be a currently discovered HTTP
listener owned by the managed preview run`. Port 3000 is the harness default, but
no managed harness listener existed; `sandbox_ports` showed only browser processes.
No ad-hoc server or unsupported workaround was used.

Flows A–I and widths 360/390/430 are **NOT RUN**; real viewport-emulation capability
was not tested. No current focused/full/type/lint/build/D1/migration-replay/schema/authority
audit ran. Historical 176/9 and 26 hardening/adoption results remain historical only;
`CURRENT_FULL_TEST_COUNT` and `CURRENT_FULL_FILE_COUNT` are not established. No defect,
freeze, final docs head, merge, deploy, remote D1, PayOS, or T14 work is claimed.
Migration integrity passed: 31 tracked migrations, unchanged 0031, no 0032; replay is
not certified. `git diff --check` passed. The platform fault was reported and recorded.
Next: repair the supported managed Preview interface, then resume the mandatory WIP
browser flows before baseline, acceptance closure, freeze, and independent review.

## Current authoritative state — confirmed-review UX WIP, 2026-09-13 12:40 UTC

**T13 NOT COMPLETE — BROWSER VERIFICATION BLOCKED.** New continuation branch
`hoplite/kos-9d39545d--t13b-b-final-certification` starts exactly at f845d04; prior
WIP branch and guarded main are unchanged. Repository ID 1368281478 and canonical
`vn-ca1/Frigo-dev`/historical redirect were freshly verified.
Published application WIP: `fd32aa8deaee7df454245591015780c59f909352` (not freeze).
Confirmed scans now show completed/read-only wording, hide manual addition and
replace the confirm CTA with `Xem tủ lạnh`; terminal remount/privacy guards remain.
PASS: **176 tests/9 files**, including **26 hardening** and **26 actual operator**
tests; typecheck, scoped lint, diff check. All 31 migrations unchanged/no 0032.
One fresh managed Preview attempt reproduced the mandatory-promotion platform
error; no existing isolated server was available. Reported again; stopped before
freeze per owner instruction. No browser/full-suite baseline/final certification
was fabricated. Required next baseline is the actual current runtime count, **not**
historical 3177/124. See the latest `inventory-truth/t13/T13B_B_WIP_HANDOFF.md`
section for exact checks and resume gates. No settings commit/merge/deploy/remote D1/PayOS.

## Current authoritative state — T13B-B hardening WIP, 2026-09-13

**T13 NOT COMPLETE — browser/final certification blocked.** Current repository is
`vn-ca1/Frigo-dev`, ID **1368281478**; historical `Tungjpstore/Frigo-dev` redirects to
that same ID. All guarded SHAs/ancestry passed; continuation starts exactly at
`2334a6f41cf68d42ae1eba7a30440b8fe324eb31`, never main.
Branch: `hoplite/kos-9d39545d--t13b-b-final-hardening`.
Published application-bearing **WIP**, not freeze:
`c37a9b8d7afc66507052bbc8f1e8a24fdc896e8d` (fetched remote equality verified).
Route/store ownership, private-session async fencing, fridge domain-error recovery,
and confirmed-review status retention are fixed with **23 new regressions**.
Final focused **173/173 (9 files)**; T13B-A backend **1122/1122 (17 files)**;
typecheck, scoped lint, operator syntax and diff check PASS. Migration count 31,
0031 unchanged/no 0032; current-source writer/reader UNKNOWN 0/0.
Managed Preview is blocked by its mandatory promotion schema; no browser/final
detached/full-suite/D1/schema/build certification or application freeze is claimed.
Full evidence, corrected intermediate check failures, transfer/docs-lineage proof
and exact next action: [T13B_B_WIP_HANDOFF.md](inventory-truth/t13/T13B_B_WIP_HANDOFF.md).
Main remains `d1b06732f8a80db4e77986df31ff28d9f04641fa`; no merge/deploy/remote D1/PayOS.

## Current authoritative state — T13B-B quota-safe WIP, 2026-09-13

Implementation stopped on the owner's instruction. The focused Part B preflight
completed **109/109 tests in 6 files**; full/frozen verification and final acceptance
are not complete. Initial 404/fetch failures were followed by successful broker
publication/fetch equality for WIP `a8cefd13505bc6b45dd11f45a6323539deb60f93`;
main was reverified unchanged. Fresh public numeric metadata still returns 404.
Actual branch base is `c31567ec7dfa8f95808c20c834b327cbb3425f9c`, not the
safe-stop expected documentation base `69b0dc676fcb4136861a8ca0c66994259eba5116`.
Read [T13B_B_WIP_HANDOFF.md](inventory-truth/t13/T13B_B_WIP_HANDOFF.md) for changed
files, executed checks, pending review, migration status and exact resumption steps.
No further implementation, main merge, deployment or remote D1 work is authorized.

## Current authoritative state — T13B-A backend checkpoint, 2026-09-13

**T13B-A COMPLETE — READY FOR T13B-B.** This is backend-only continuation,
not final T13 certification. The older T13 completion claim below is historical.
Repository ID **1364064929**, current owner/name **vn-2l/frigo-dev**; branch
`hoplite/megara-hyblaia-888f1514`, exact base `3458c6cb971f5d96fce8eda3abc3d708437ce713`.
Main remains `d1b06732f8a80db4e77986df31ff28d9f04641fa`; no merge/rebase/deploy.

**T13B_A_CHECKPOINT=c31567ec7dfa8f95808c20c834b327cbb3425f9c** was committed,
published without force, fetched and verified equal to the remote branch.
Documentation follows separately; this is not a final application freeze.

Adopted receipts create one new T09 RECEIPT lot per accepted line, preserving old
manual/receipt lots and separate purchase facts, storage and expiry. Fridge SCAN
retains grouped CORRECT addition. Raw/confirmed correction evidence is validated
command intent in the existing receipt fingerprint and event metadata fingerprint;
`correctionOf()` is used in production. T10 rawName uses retained OCR, not the
reviewed name; absent raw stays null with a real subject identity. Concurrent and
post-commit response-loss attempts recover through scoped confirmed-status replay,
without repeating stock writes. Review/observation/command/status atomicity remains.

Executed: focused backend **1,122/1,122 (17 files)**; real local D1 **92/92
(5 files; 11 new)**; `pnpm typecheck`; scoped ESLint on all six changed code/test
files; `git diff --check`, scope/ancestry/migration checks — PASS. Four new regressions
fail on the exact pre-fix base as expected. Full commands, initial failures and fixes:
`inventory-truth/t13/T13B_A_HANDOFF.md`. In particular, the initial D1 race failure
(91/92) was fixed rather than weakening its both-success/exactly-once assertions.

Migration count **31**; 0001–0031 unchanged, no 0032. Focused writer UNKNOWN **0**,
canonical reader UNKNOWN **0**; T09/T11 authority unchanged. No frontend, protected
payment/auth, Week, setup or infrastructure change.

**NOT RUN — DEFERRED TO T13B-B FINAL VERIFICATION:** full application suite,
full lint/build, dedicated migration smoke/schema/upgrade gates, browser/mobile
checks, receipt/scan UX and adoption path, final T13 matrix/certification.
Next: continue from the published documentation HEAD with this exact application
checkpoint, following `T13B_A_HANDOFF.md` and DEC-016; do not start from main.

## Current authoritative state — T13 Receipt/Vision Truth & Inventory UX V2, 2026-09-13

**Verdict: T13 IMPLEMENTED AND VERIFIED on branch `hoplite/lindos-0368e413`; NOT merged to
main.** Repository ID 1364064929 (`vn-2i/frigo-dev`); `origin/main` still `d1b0673` (NOT
advanced). Base commit `578f705` (ROADMAP_AUDIT_HEAD). `T13_APPLICATION_FREEZE` =
`ad342703fb31a2b97d2798f1161fb83d4d0ed090`.

Scope closed: receipt/vision provenance truth (RECEIPT vs SCAN from server-side `scan_type`
only), purchase facts (real merchant/date/price or absent), truthful expiry kind
(KNOWN/ESTIMATED/UNKNOWN in distinct columns), raw-vs-confirmed OCR evidence retention,
T10 observation integration inside the existing atomic batch, additive read/decision routes,
and the Inventory UX V2 surfaces (lot detail + provenance, edit/MOVE, receipt review with
real confidence/price/date and per-line rejection, reconciliation page).

Migration `0031_scan_evidence_retention.sql` is additive only (adds `ocr_raw_name`,
`ocr_quantity`, `ocr_unit`, `ocr_confidence`, `review_state` to `scan_items` with
insert/update triggers coupling `review_state` and `is_confirmed`). Migrations 0001-0030
untouched. Fresh 0001→0031 replay and legacy-upgrade replay both PASS.

Authority unchanged: **exactly one inventory writer (T09)**. T13 adds exactly one new write
statement — a guarded INSERT into `inventory_observations` that rides the existing atomic
batch and writes evidence, not stock. Zero new writes to `inventory_lots`, `inventory_items`
or `inventory_events`; zero new `inventory_items` readers. Writer/reader audits UNKNOWN = 0.

Executed checks (clean detached worktree @ `ad34270`, `pnpm install --frozen-lockfile`):
full suite **3,177/3,177 across 124 files**; real D1 **81/81**; lint, typecheck, build,
`check:migrations` (`migration-smoke=ok`), `schema:check:local`, `git diff --check` all PASS;
`git status --porcelain` empty. Baseline before T13 was 3,092/120 and 70 real-D1.

Browser verification against the isolated preview (`scripts/security-preview.mjs`, in-memory
SQLite, `AI_MOCK_MODE`, external fetch disabled) found **7 defects that a fully green test
suite had not caught**, including a lot-id collision that made every line of one receipt
share a single lot id, and two identifier-bound errors that made every real receipt
observation permanently undecidable. All seven are fixed with permanent regression tests.

Main NOT merged; nothing deployed; remote D1 NOT touched; PayOS untouched;
`MEAL_PLANNER_ENABLED` and cutover flags unchanged.

## Current authoritative state — Roadmap reconciliation / gap audit of RC 64c5501, 2026-09-12

**Verdict: T13 REQUIRED** (receipt: `docs/ai/release/INVENTORY_TRUTH_ROADMAP_RECONCILIATION.md`;
scope definition only: `docs/ai/release/T13_PROPOSED_SCOPE.md`). Repository ID 1364064929
(now `vn-2g/frigo-dev`); `origin/main` still `d1b0673` (NOT advanced). Audit branch
`hoplite/delphoi-499ad774` (requested logical name `hoplite/inventory-truth-roadmap-reconciliation`)
created at exact re-certification docs HEAD `1cae11e`; application tree = certified RC
`64c5501` (docs-only delta verified). Roadmap mismatch **CONFIRMED**: pre-implementation
sources `MASTER_CONTEXT.md@43718c2` and `tasks/T08-…@b5577ea` define T11 = "receipt/vision
truth and inventory UX V2"; implemented T11 = read authority (assigned to T12 by the T09
packet); T11 continuation handed the scope to T12; T12 never addressed it; no DEC/ADR
supersedes it. Matrix: Receipt/Vision R1–R12 = DONE 5 / PARTIAL 2 / MISSING 5; UX V2
U1–U17 = DONE 4 / PARTIAL 9 / MISSING 4; SUPERSEDED/OUT_OF_SCOPE 0. Release safety of
`64c5501` unchanged: P0/P1/P2 = 0; P3 notes — inferred shelf-life/day-chip expiry written
as `expiryKind:'KNOWN'` (DEC-003 conflict), Cloudflare provider fabricates defaults,
`FINAL_WRITER_MAP` scan row overstates changed-payload conflict, pre-existing outbox
head-of-line block on permanent 409. Actual receipt pipeline = pre-T08 legacy scan
draft → user confirm → T09 adapter with `sourceType:'SCAN'` (no `RECEIPT` lots, no
observation integration, price/date dropped, no reconciliation/lot/provenance UX,
`POST /inventory/adopt` has no product caller). Executed checks (clean worktree @ `64c5501`):
targeted vitest 55/55 (5 files) + a temporary uncommitted probe (4/4, deleted). Main NOT
merged; nothing deployed; remote D1 NOT touched; PayOS untouched; no application change.

## Current authoritative state — Independent final re-certification of RC 64c5501, 2026-09-12

**Verdict: RELEASE CANDIDATE `64c5501ab0110658718b3752bd84e537f0854e12` TECHNICALLY
CERTIFIED** (docs HEAD reviewed `bc1532e`; receipt
`docs/ai/release/INVENTORY_TRUTH_RECERTIFICATION.md`). Repository ID 1364064929
(`vn-2f/frigo-dev`); `origin/main` still `d1b0673` (RC 57 ahead / 0 behind). Lineage
16/16 ancestors, no rewrite; remediation delta exactly the six D3/D1 files; D3 code,
tests (A–L incl. route boundary), negative control (3/6 fail on pre-fix AuthPage) and
browser reproduction re-verified; D1 blob `3818a00` byte-identical to main; D2
SAFE_DEFERRED with `MEAL_PLANNER_AUTHORITY_CUTOVER`; fresh reader/writer audits
UNKNOWN = 0 (sets identical to `d156001`); no second ledger; task survival by tree
comparison PASS. Clean detached checkout @ `64c5501`: install frozen (lockfile unchanged);
full **3,092/3,092 across 120 files**; D3 32/32; real D1 70/70; T09 654 · T10 98 ·
T11 39 · T12 22; lint/typecheck/build/migrations(30)/schema gate/diff-check PASS;
status empty; fresh real-D1 0001→0030 replay and legacy-upgrade replay PASS. P0/P1/P2:
none (two P3/informational notes). **Main NOT merged** — next is the separate ROADMAP
RECONCILIATION / GAP AUDIT; nothing deployed; remote D1 NOT touched; PayOS untouched.

## Current authoritative state — Final RC targeted remediation (D3/D1/D2), 2026-09-12

**NEW_APPLICATION_FREEZE `64c5501ab0110658718b3752bd84e537f0854e12`** on
`hoplite/akraiphia-akraiphnion-a03445c7--inventory-truth-final-remediation` (published; requested name `hoplite/inventory-truth-final-remediation`; base `32b6ec1` → `5cb4caa` → `d156001`;
main `d1b0673` unchanged, 57 ahead / 0 behind). D3 P1 closed: client-only fix —
`ApiError.code`, `isInventoryTransferDeferred`, AuthPage deferral notice + explicit
“Tiếp tục không chuyển dữ liệu khách” that retries the same OTP without
`migrateFromHouseholdId`; guest session/outbox untouched until success; DEC-012
server unchanged (DEC-015 addendum). D1 P2 closed: `.hoplite/settings.json`
restored from main (blob `3818a00`, raw `48507643…`; overlay never committed).
D2 P2 documented: planner snapshot reader = `SAFE_DEFERRED` in the T11/T12 maps
with `MEAL_PLANNER_AUTHORITY_CUTOVER` as the removal condition; flag stays off.
Clean detached checkout of `64c5501`: install frozen (lockfile unchanged); full
**3,092/3,092 across 120 files**; D3 32/32; real D1 70/70; T09 654 · T10 98 ·
T11 39 · T12 22; lint/typecheck/build/migration smoke (30)/schema gate/diff-check
PASS; status empty. Browser reproduction of the guest→register flow PASS (no
dead-end, no raw JSON, session switches only after the retry). Receipt:
`docs/ai/release/INVENTORY_TRUTH_REMEDIATION.md`. Main NOT merged; nothing
deployed; remote D1 NOT touched; PayOS untouched.

## Current authoritative state — Final Release Integration Review (T08→T12), 2026-09-12

**Verdict: RELEASE CANDIDATE NOT READY** (docs: `docs/ai/release/INVENTORY_TRUTH_RELEASE_CERTIFICATION.md`,
`INVENTORY_TRUTH_ANCESTRY.md`, `INVENTORY_TRUTH_CHANGE_MANIFEST.md`). Reviewed from
exact docs HEAD `5cb4caa0d5b3c86b00954d77cd40b16027c21df1`; application RC
`d15600186c3e73faba011eb690ac6cd70e8d3d2d`; repository ID 1364064929
(`vn-2f/frigo-dev`; `vb-2f` now redirects). `origin/main` is still `d1b0673`
(RC 54 ahead / 0 behind). Lineage 11/11 ancestors; no later task overwrote an
earlier task; UNKNOWN production readers/writers = 0 after classification; no
second stock ledger. Clean detached checkout of `d156001`: `pnpm install
--frozen-lockfile` (Node v24.19.0, pnpm 10.26.0, lockfile unchanged); full
**3,085/3,085 across 119 files (199.68 s)**; T09 654/654 (1,432 across all 22
T09-lineage suites); T10 98/98; T11 39/39; T12 22/22; real local D1 **70/70**;
lint/typecheck/build PASS; `migration-smoke=ok`; `pnpm schema:check:local` PASS;
`git diff --check` clean; `git status --porcelain` empty. Fresh 0001→0030 replay
on sqlite3 and on real workerd/D1 (30 applied; 200 schema objects identical);
legacy-upgrade simulation (0001–0022 + legacy rows → 0023–0030) on real D1: no
data loss, no automatic cutover, non-adopted writes still legal, FK clean.
Defects: **D3 P1** — web guests cannot finish email registration on the RC
(`AuthPage` always sends `migrateFromHouseholdId` for `hh_guest_*` sessions →
`409 INVENTORY_TRANSFER_DEFERRED` with no retry-without-transfer UI; reproduced by
curl and in the browser on the isolated preview); **D1 P2** — tracked
`.hoplite/settings.json` deleted from the RC tree by `4553b8a`; **D2 P2** —
flag-gated `/meal-planning` reader of `inventory_items` missing from the authority
maps (classified SAFE_DEFERRED). No P0. Main NOT merged; nothing deployed; remote
D1 NOT touched; PayOS untouched; no application code changed by this review.

## Current authoritative state — T12 closed-loop runtime verification, 2026-09-12

**New T12 application freeze: `d15600186c3e73faba011eb690ac6cd70e8d3d2d`** — `fix(t12): complete
closed-loop runtime verification` — published/fetched (direct publication, no
PR tooling), local == remote == clean-checkout SHA; `22f675d` superseded.
Closed the independent-review gaps: P1 real workerd/D1 closed-loop suite (8
cases; real D1 62 → 70), P2 route-level proof through the real Hono handlers
(`POST /week/plans/:id/shopping/complete`, `POST /recipes/:id/cook/complete`,
`GET /inventory`; 5 tests, stale KV injected), P2 reconciliation-vs-manual race
now requires the explicit `STALE_SNAPSHOT` loser (no `PERSISTENCE_FAILED`).
Route fix surfaced by the proof: adopted cook replays its durable receipt before
re-planning (response-loss retry → replay, not INSUFFICIENT_INVENTORY). Gates:
full 3,085/3,085 across 119 files; T09 654; T10 98; T11 39; T12 22; real D1
70/70; lint/typecheck/build/30-migration smoke/schema/diff PASS — repeated from
the clean detached exact-SHA checkout with empty status. UNKNOWN readers/writers
= 0. No migration. Main NOT merged; production NOT deployed; remote D1 NOT
touched; PayOS untouched; Final Release Integration Review NOT started.

## Historical T12 state — first freeze 22f675d (superseded)

**T12 application freeze: `22f675d1cca76d05c93ebb2ed40bbaea11a72238`** — `feat(t12): close the inventory truth
loop` — the final Inventory Truth release-train task. The loop
evidence → observation → reconciliation → T09 command authority →
inventory_lots → T11 read authority → consumers is closed and proven by a
permanent 9-test closed-loop suite (E2E reconciliation exactly-once, DISMISS
inert, recipe/planner/shopping/cook/notification loops, single-winner races,
drift matrix). Display aliases tightened: tampered projection rows drop to
canonical presentation. FINAL_AUTHORITY_MAP/FINAL_WRITER_MAP: UNKNOWN
production readers/writers = 0. Gates: full 3,072/3,072 across 117 files; real
D1 62/62; all static/30-migration/schema gates PASS. No migration; no new
writers. Main NOT merged; production NOT deployed; remote D1 NOT touched;
PayOS untouched; **release train T08–T12 COMPLETE**.

## Historical T12 baseline state — T11 hardening (superseded by T12)

**New T11 application freeze: `c15c9a81fc4367b3506a7e2693798ebe1424b0a9`** — `fix(t11): complete read
authority runtime hardening` — published/fetched (direct commit publication,
no PR tooling), local == remote == clean-checkout SHA; `657201f` superseded.
Closed: real workerd/D1 proof of T11 (11 cases; real D1 51 → 62), adopted-but-
empty regression on integration + real D1 + HTTP (native mode, `[]`, no legacy/
KV/auto-adoption), READ vs MOVE/DISCARD/FEFO barrier coverage (matrix now
CORRECT/MOVE/USE/DISCARD/FEFO/T10), `activeCount` = filtered summary, explicit
kg↔g / l↔ml display-alias compatibility with canonical authority intact, and
fail-closed freshness (`computeReadFreshness`, invalid dates → CORRUPT_LOT_ROW).
Gates: full 3,063/3,063 across 116 files; T09 654/654; T10 98/98; T11 39/39;
real D1 62/62; lint/typecheck/build/30-migration smoke/local schema/diff PASS —
repeated from the clean detached exact-SHA checkout with empty status. Readers/
writers UNKNOWN = 0. No migration. Main NOT merged. Production NOT deployed.
Remote D1 NOT touched. T12 NOT STARTED. **T11 COMPLETE — READY FOR INDEPENDENT
REVIEW.**

## Historical T11 state — first freeze 657201f (superseded)

Branch `hoplite/himera-6d3eda84-t10-observation-reconciliation-t11-inventory-read-authority`
(start_branch successor; base = train merge `30ce4ea` containing exactly the
required T10 docs HEAD `c71692a`). **T11 application freeze: `657201f3a12f18dd96cc96adeac0dd1d3b75e6f4`**
published as **PR #3** (base `hoplite/kydonia-2785bb72` — the release train,
NOT main); corrective `4553b8a` removed the platform auto-committed
workspace overlay (`c7e2296`; overlay preserved byte-for-byte uncommitted).
The T09/T10 truth layer is now the canonical READ authority: adopted
households read `inventory_lots` + validated mapping evidence through
`packages/db/src/inventory-read-authority.ts`; `inventory_items` never decides
truth; no dual-truth fallback; corruption fails closed; reads never write.
Read consumer audit: production UNKNOWN=0 (`docs/ai/inventory-truth/t11/
READ_CONSUMER_MAP.md`). Gates: full 3,041/3,041 across 115 files; real D1
51/51; lint/typecheck/build/30-migration smoke/local schema/diff PASS —
repeated from a clean detached exact-SHA checkout with empty status. No
migration. Main NOT merged. Production NOT deployed. Remote D1 NOT touched.
T12 NOT STARTED. **T11 COMPLETE — READY FOR INDEPENDENT REVIEW.**

## Historical T10 state — observation claim fence (superseded by T11)

Branch `hoplite/himera-6d3eda84-t10-observation-reconciliation`. **New T10 application
freeze: `7393edcd4fb9cc8bb4df2a06628fb5dc57f8607b`** — `fix(t10): atomically fence competing reconciliation
decisions` — published/fetched, local == remote == clean-checkout SHA; `4c414fa` is
superseded (historical ancestor). Reproduced P1: two decision keys racing one OPEN
observation relied on a trigger side effect — the final guarded observation UPDATE with zero
rows is a silent D1 success, losers surfaced raw SQLite errors, and with the 0030 receipt
trigger absent both decisions committed. Fix: an in-batch `changes()` claim guard (T09
write-guard technique) makes a lost OPEN/vN → RECONCILED/vN+1 claim abort the whole atomic
batch (T09 commands, events, projection, receipt, observation all roll back); losers get
`OBSERVATION_VERSION_CONFLICT`; a committed same-key twin replays (response-loss preserved),
altered twin → `IDEMPOTENCY_CONFLICT`. 13 regressions (13 fail pre-fix) + 2 real-D1 proofs
incl. a controlled race under workerd. Gates: full 3,024/3,024 across 114 files; T10
focused 98/98; T09 focused 323/323; real local D1 51/51; lint/typecheck/build/30-migration
smoke/local schema/diff PASS — repeated from the clean detached exact-SHA checkout. No
migration. Main NOT merged. Production NOT deployed. Remote D1 NOT touched. T11 NOT STARTED.
Verdict: **T10 PASS — READY FOR INDEPENDENT REVIEW.**

## Historical T10 state — composition fix 4c414fa (superseded by 7393edc)

Branch `hoplite/himera-6d3eda84-t10-observation-reconciliation`.
**New T10 application freeze: `4c414fa7eb33329ee12936c0899644af67e48f07`** — `fix(t10): compose multi-field
reconciliation commands atomically` — published/fetched, local == remote ==
clean-checkout SHA; the previous freeze `6c28858` is superseded (historical ancestor).
Reproduced P1: the planner collected per-dimension proposals independently, so one
lot could receive 2–3 CORRECT proposals (quantity/expiry/openedAt) plus a MOVE, mixed
claims took an expiry-only verdict, and split CORRECTs shared the `<decisionKey>#CORRECT`
client key (idempotency/CAS hazard). Fix: `composeProposals` merges all compatible
CORRECT changes into exactly one CORRECT plus at most one MOVE bound to the matched
lot/version (contradictions → CONFLICT `PROPOSAL_COMPOSITION_CONFLICT`); the decision
boundary independently enforces max one CORRECT / one MOVE / same lot+version / type
consistency and fails closed; CORRECT+MOVE composes through T09 `useCurrentLotVersion`
atomically. 19 permanent regressions (16 fail pre-fix). Gates: full 3,009/3,009 across
113 files; T10 focused 78/78; real local D1 49/49; lint/typecheck/build/30-migration
smoke/local schema/diff PASS — repeated from the clean detached exact-SHA checkout.
No migration; 0023–0030 untouched. Main NOT merged. Production NOT deployed. Remote D1
NOT touched. **T10 COMPLETE — READY FOR INDEPENDENT REVIEW.** T11/T12 NOT STARTED.

## Historical T10 state — initial freeze 6c28858 (superseded by 4c414fa)

Repository `vb-2f/frigo-dev` (repository ID 1364064929; task lineage `vn-2e/frigo-dev`).
Branch `hoplite/himera-6d3eda84-t10-observation-reconciliation`, the platform-verified
successor created from the configured train base after PR #1 merged the frozen T09
branch internally (train merge `668920fa462524e65a79d31a7b0844720baf38e0`; main
`d1b06732f8a80db4e77986df31ff28d9f04641fa` is untouched and NOT merged).
**T10 application freeze: `6c28858acd0627d2d602998107c2e260c5e4f0d5`** —
`feat(t10): add inventory observation reconciliation authority` — published/fetched
with local == remote == clean-checkout equality. T10 adds the observation/evidence/
reconciliation layer above T09 authority without any second stock writer: additive
`0030` observation/decision persistence (evidence never mutates inventory), a pure
deterministic planner (MATCH / NO_ACTION / STALE / AMBIGUOUS / CONFLICT /
PROPOSE_CORRECTION / PROPOSE_MOVE / PROPOSE_EXPIRY_UPDATE / UNSUPPORTED) with exact
milli quantities, name-matching refusal, contextual-unit refusal and confirmed-expiry
precedence, and a decision authority that composes existing T09 CORRECT/MOVE commands
in one atomic batch with receipt-backed response-loss replay and IDEMPOTENCY_CONFLICT
on altered semantics. Baseline before edits: 2,926/108 full, 44 real D1, all static
gates PASS. At the freeze: 2,990 full/112 files; T10 focused 1,097/19 files; real
local-D1 49/49; lint/typecheck/build/30-migration smoke/local schema gate (requires
0030)/diff PASS — all repeated from the clean detached exact-remote-SHA checkout with
empty status. No HTTP routes added (T09 precedent; T11 owns UX surfaces).
**T10 COMPLETE — READY FOR INDEPENDENT REVIEW.** T11 and T12 are NOT STARTED.
Exact evidence: `inventory-truth/t10/VERIFICATION.md`, `inventory-truth/t10/TEST_MATRIX.md`.

## Historical T09 state — FEFO v2 backfill compatibility (superseded as current; freeze remains a verified ancestor)

Repository `vn-2e/frigo-dev` (live origin `vb-2f/frigo-dev`, same lineage), branch
`hoplite/himera-6d3eda84`, the platform-verified successor checked out at the exact
previous docs HEAD `8552fe5337245f2ac8349933c02946bf7d9dcc8f` (`hoplite/kydonia-2785bb72` tip unchanged there).
**New final T09 application freeze: `bf391c5fdcdd9e9c2f2257db515815e082cb4381`** — `fix(t09): support backfilled
mappings in fefo authority` — published/fetched with local/remote equality PASS.
The last remaining P1 is fixed: FEFO v2 now serves legitimate adopted/backfilled
synthetic lot mappings. Equal-ID authority was replaced, not bypassed: additive
`0029_inventory_fefo_backfill_compatibility.sql` recreates only the two v2 FEFO
triggers so a lot acts under its legacy projection identity only when LEGACY_BACKFILL
provenance, source identity and the immutable adoption receipt prove the mapping with
a preserved version offset; prestate parity accepts the exact kg/l display aliases;
poststate guards stay strict and native equal-ID lots pass unchanged. P1 reproduced
first (13/13 new tests fail DRIFT_DETECTED on the pre-fix tree, zero mutation).
Fresh PASS: 1,237 focused/15 files (59.52s); 2,926 full/108 (118.20s); 44 real
local-D1; lint/typecheck/build/29-migration smoke/local schema/diff. Clean detached
exact-remote-SHA checkout repeated every gate: 2,926/108 (119.10s), 44 D1, empty
git status. NO GITHUB CI STATUS for the branch. No route invokes v2 FEFO; the adopted
cook path already uses synthetic-compatible v1 commands. Verdict: **READY FOR FINAL
MAIN MERGE REVIEW** (main not merged by this agent). Exact evidence:
`inventory-truth/t09/FINAL_PATCH_VERIFICATION.md`.

## Historical backfill compatibility state — superseded by bf391c5

Repository `vn-2e/frigo-dev`, branch `hoplite/kydonia-2785bb72`.
Final backfill compatibility application freeze: **`df73bc035c2938b6fd082c57f6bca89a82d8e443`**.
The inherited backfilled PATCH P1 is reproduced and fixed without migrations:
synthetic lot IDs are authenticated by the immutable mapping and exact household
adoption witness. Projection CAS, event IDs, replay and composition retain both identities.
Fresh PASS: 619 focused/nine files; 2,910 full/107; 42 isolated real local-D1;
all lint/typecheck/build/migration/local-schema/diff gates. Exact fetched SHA also
passed frozen install, full 2,910/107, all gates and 42 D1 tests in a clean worktree.
**NOT READY FOR MAIN**: the bounded shared-caller check found v2 FEFO still rejects
synthetic mappings in unchanged 0027 SQL. Its fail-closed boundary is preserved;
further compatibility needs separately authorized schema work, not a guard bypass.
Exact evidence and next action: `inventory-truth/t09/FINAL_PATCH_VERIFICATION.md`.

## Historical PATCH parity checkpoint — superseded by df73bc0

Repository `vn-2e/frigo-dev`, branch `hoplite/kydonia-2785bb72`.
New final application freeze: `e796f695bdb4228853992cdedc4e3cecf3437adb` (published/fetched equality).
External final review's storage replay and category parity defects were reproduced
and fixed. Complete normalized request presence/value is retained in native receipts;
CORRECT/MOVE/category commit atomically; historical response replay no longer reads
today's stock. Native commands without PATCH metadata are unchanged.
Fresh gates: 515 focused / six files, 2,865 full / 106 files, 40 isolated local-D1,
lint/typecheck/build/28-migration smoke/local schema/diff PASS.
Recommendation: **NOT READY FOR MAIN**. An inherited P1 remains: PATCH of an
adopted backfilled legacy lot rejects its legitimate distinct mapping with
`500 DRIFT_DETECTED`. No adoption/migration fix was attempted in this narrow task.
Exact clean-source evidence, historical SHAs and next action:
`inventory-truth/t09/FINAL_PATCH_VERIFICATION.md`.

## Historical evidence — all prior freeze/readiness claims below are superseded

## T09 F/G/H complete — 2026-09-11

Independent review follow-up `27427383d61930ea1b67ccbc1d69bb1cc069f931` is published on the same branch. It restores exact adopted PATCH response-loss replay before legacy version preflight, rejects altered key reuse, and retains normal CAS for a distinct key. Fresh full verification: 2,838 tests / 105 files PASS (165.25s), lint/typecheck/build and 28-migration smoke PASS.

T09F = COMPLETE, T09G = COMPLETE, T09H = COMPLETE (freeze + evidence). Application
freeze SHA: `9bf9ac0fe7b5e0d39615f39ae5cc30f84569af2f`, published/fetched on **hoplite/kydonia-2785bb72** with exact
local/remote equality; branch base `hoplite/kos-2a686759` is the platform read-only
configured base at `aa44d2a2f80ea33fd4b328aba906660c0129051e` and refused publication, so the verified successor
continues that exact lineage (same pattern as the prior transfer). A–E unchanged.
Full gates at this checkpoint: **2,837 tests / 105 files PASS** (155s), including the new 19-test adoption suite, 9-test G concurrency matrix and rewritten 14-test writer-fence suite; 38 isolated real local-D1 tests PASS; lint PASS; typecheck PASS; build PASS; 28-migration smoke PASS; local D1 schema gate PASS (0028 required).
Adoption: atomic receipt-backed `executeInventoryAdoption` (migration 0028), empty-household
activation evidence, executor-owned snapshot/authority validation, projection-compatibility
preflight. Every inventory writer now serves adopted households through the lot authority
(manual create/edit/discard, scan confirm, shopping import, cook) and fails closed with
`INVENTORY_AUTHORITY_REQUIRED` when mappings are incomplete; DEC-012 remains SAFE-DEFERRED.
G matrix: USE/USE, USE/DISCARD, USE/CORRECT, DISCARD/DISCARD, MOVE/MOVE, OPEN/OPEN,
FEFO/FEFO, receipt replay, duplicate event identity, household isolation, cross-tenant
identities, adoption races and stale-legacy-post-activation all pass with property sweeps.
Not authorized/started: main merge, deployment, remote D1, PayOS, T10. Independent
review readiness: READY FOR EXTERNAL ASTRA REVIEW (reviewer decides next steps).

## Historical continuation record — 2026-09-11 (superseded)

Latest verified/published application: `aa43e069edbff7843e9eb7532ff386b27be96a17`.
Same task, A–E COMPLETE; F IN_PROGRESS; G/H NOT_STARTED. F now has pure adoption
preparation, in-transaction legacy writer refusal for mapped households, scan/
shopping stock-revision fences, shopping claim/lease/response-loss recovery, and
server-scan confirmation recovery without duplicate manual additions. DEC-012 is
unchanged. No adoption activation or functional mapped-household adapters yet.
Fresh gates: **1,347 focused / 19 files**, **2,808 full / 103 files**, 38 actual
isolated local-D1 tests within those gates, lint/typecheck/27-migration smoke/build
and diff/protected-path checks PASS. Two scoped independent-review P2 findings
were fixed/retested; no remaining P1/P2 in this partial increment. Full F still
requires retained scan-intent validation, atomic adoption and all writer adapters.
Next: additive v3 atomic adoption authority, then functional adapters, G and H.
Detailed evidence/failures: `inventory-truth/t09/VERIFICATION.md`.

Canonical repository: **vn-2d/frigo-dev**. Writable successor:
**hoplite/kos-2a686759**, directly from verified interrupted F
`66858c5296b38715e4bfca77fca5eefe5adadf5a` on read-only prior continuation
`hoplite/orchemenos-e002591e`. Transfer/ancestry PASS; baseline 2,685 tests / 99
files, typecheck/lint/27-migration smoke/build PASS. At takeover: 18 ahead / 0
behind unchanged origin/main. Exact authority/evidence: `inventory-truth/t09/CONTINUATION.md`.
Earlier repository references are historical provenance only.

The following pre-transfer chronology is historical. Continuation was based on frozen T09D remote
811f7e8463303e010199741d66f88ab8a817212d. Successor documentation checkpoint
8bf32ed4e41ed3341215c6376e0c13ef13043616 was published/fetched before E code.
A–E complete; E published as `9bd1e6bc000cd2e94121469babb1a5eb63a5047f`.
Fetch/equality/ancestry PASS. F is in progress; G–H pending.
E adds deterministic 1–32-effect atomic FEFO, version-2 receipts/events and additive
0027; v1 authority and migrations 0023–0026 remain intact. No adoption, live writer,
HTTP or UI cutover. Latest post-fence gates: 1,172 focused / 11 files (35 actual
local D1 tests), 2,659 full / 98 files, lint/typecheck/build and migration smoke
PASS. Scoped independent E review has no remaining P1/P2 findings. Earlier
1,170 focused / 2,657 full results predate the ordered-receipt fence.
F first safety change implemented: DEC-012 guest transfers explicitly reject
before OTP/account/session or data mutation. Guest/auth/outbox focused 143 PASS;
full 2,685 / 99 files and lint/typecheck/build/27-migration smoke PASS. General
adoption and manual/scan/shopping/cook adapters remain next per
`inventory-truth/t09/F_ADOPTION_PLAN.md`. Full F completion is not claimed.
Exact chronology, limits and corrected failures: `inventory-truth/t09/VERIFICATION.md`.
See `inventory-truth/t09/CONTINUATION.md` for exact branch authority, checks,
publication restriction and preserved pre-existing settings overlay. All protected
surfaces untouched; no application freeze or independent-review readiness.

## Historical T09D checkpoint — 2026-09-10

Program: Inventory Truth Layer. Canonical repository: vn-2b/frigo-dev (user
confirmed). Branch: hoplite/euhesperides-d77023a5. Exact T08 base:
8f8788c1a0c9e486657751ef3875a5baa5334dec. Main anchor: d1b06732f8a80db4e77986df31ff28d9f04641fa.
Publication-first and A/B checkpoints published/fetched. T09C now implements
internal native command persistence with membership, CAS/revision fence, immutable
receipt/event and exact legacy projection; additive 0024 and actual local D1
rollback/executor tests. No HTTP exposure, historical adoption or old writer cutover.
Mixed legacy households fail closed with ADOPTION_REQUIRED. Full/native gates and
corrected findings are recorded in inventory-truth/t09/VERIFICATION.md.
Published C checkpoint 13133b3: 507 focused, 1,994 full / 93 files PASS;
lint/typecheck/build, 24-migration/local schema PASS; remote-source worktree 507 PASS.
T09D now validates retained receipt/event evidence, binds new events to declared
effects and actual written stock (additive 0025/0026), and rejects paired evidence
corruption. Final D gates: 1,031 focused / 2,518 full tests (95 files), lint,
typecheck, build, 26-migration replay/local schema PASS. D code checkpoint
b036b257a8ad775dd6f1a445dcfdcce38a6babf1 published/fetched with exact equality;
separate fetched-source worktree: 1,031 tests and typecheck PASS, clean tree.
Next: E FEFO and F legacy adoption/writer integration.
T09 remains IN_PROGRESS; no application freeze or independent-review readiness.
No main, legacy Frigo, production/staging, remote D1 or PayOS changes; no T10.
The release/T08 sections below are historical evidence, not current work authority.

## T08 COMPLETE — authorized publication (2026-09-10)

Repository `vn-2c/Frigo`. The user explicitly approved publication on
`hoplite/xanthos-7d942897` instead of the blocked original feature name (DEC-006).
That branch is now the canonical cross-account handoff; publish and fetch confirmed
`fb00f46d4633c9659e812be9f86119533973a8bd`, followed by this docs-only completion
receipt. Last code: `dd2ecc6f7066250dfdc5214a3d6c356e1479b61e`.
Base/final fetched main: `d1b06732f8a80db4e77986df31ff28d9f04641fa`, unchanged.

Implemented additive 0023 storage/lot schema, strict quantity/money/expiry/source
contracts, guarded insert-only legacy backfill, compatibility projection/parity.
No legacy API/read/write path cutover. Fresh final-session **130 focused tests**,
**1,617 full tests / 89 files**, lint/typecheck/build, 23-migration replay/local
schema and diff checks PASS. Prior sandbox-local D1 apply passed 23/23. Early
failures and publication denial are resolved and preserved in the evidence log.
No source/test/schema change since dd2ecc6; later commits are documentation-only.

Next action: next account checks out `origin/hoplite/xanthos-7d942897`, reads the
handoff and final report, and waits for a separately authorized T09 task. No T09
implementation, main integration or deployment is implied by T08 completion.

Read `inventory-truth/MASTER_CONTEXT.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`,
`DECISIONS.md`, `VERIFICATION.md`, `SESSION_LOG.md` and
`inventory-truth/T08_VERIFICATION.md` and `tasks/T08-inventory-truth-foundation.md`
for exact evidence, final Git anchors, limitations and T09 prerequisites.
Main, production/staging, remote D1, PayOS and release operations untouched.

## Preserved T01–T07 release snapshot (not T08 deployment evidence)

## Production integration candidate (2026-09-15)

- Active branch: `integration/t13-takosan-qwen`, created from current production
  `main` at `05423f2ad675006a4c7913e696f1979b3fcaae59`.
- Production repository identity: `Tungjpstore/Frigo`, ID `1360256196`.
- Development source identity: `vn-dlo/Frigo-dev`, ID `1368281478`.
- Common ancestor with Takosan application `ff63edfb...`:
  `d1b06732f8a80db4e77986df31ff28d9f04641fa`.
- Integration analysis and migration bridge mapping are in `docs/integration/`.
- Status: analysis checkpoint in progress; no candidate designation, merge,
  deployment, remote migration, production resource mutation, PayOS change, or
  T14 work has occurred.

> This checkpoint retains the historical production receipt and separately tracks
> the unreleased OCR recovery candidate dated 2026-09-12.

## Release status

- T01-T07: COMPLETE.
- T01: **COMPLETE**
- T02: **COMPLETE**
- T03: **COMPLETE**
- T04: **COMPLETE**
- T05: **COMPLETE**
- T06A: **COMPLETE**
- T06B: **COMPLETE**
- T07: **COMPLETE**
- Release Integration: **COMPLETE**
- Release Publication: **COMPLETE**
- Main Integration: **COMPLETE**
- Main CI: **PASS**
- Production reconciliation: **COMPLETE - SCHEMA AND WORKER CUTOVER VERIFIED** (2026-09-10).
- OCR production recovery: **COMPLETE - DEPLOYED AND VERIFIED** (2026-09-13).

## Authoritative source

- GitHub source of truth: main.
- Deployed application SHA: `bdb0dda0b1123c4fd940058091e3cb285d5e8eb8`.
- Commits after the deployed application are documentation-only receipt merges;
  verify the current `main` head from GitHub when preparing a later release.
- Current `github-frigo/main` observed 2026-09-12: `db2377fd9f63d1be38ce3882c6d8173e0bf9e497`.
- GitHub API redirects `vn-2c/Frigo` to canonical public repository
  `Tungjpstore/Frigo`; the configured `github-frigo` remote remains the alias.
- OCR recovery branch: `codex/ocr-production-recovery`, based at `d8ca112a5ac5eb215f36a3f89b4218e2fc691371`;
  candidate implementation is committed at `ec87aec` and deployed through
  merge commit `bdb0dda0b1123c4fd940058091e3cb285d5e8eb8`.
- The 2026-09-13 PR #17 merge added the OCR recovery implementation to `main`;
  production now reports the merge SHA and Worker version recorded below.
- PRODUCTION_APPLICATION_BASE_SHA:
  `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
- PRE_CLEANUP_MAIN_HEAD: `41d2de6bc76331322cc63e8038432b0b02f60da1`.
- APPLICATION INTEGRATION: complete in main at `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
- Verified application SHA: `0b20061e7dc7405df68b18a18da4166e09494ecd`.
- Verified release head: `0420807968538f61b669569d064c404f67032174`.
- Main head before this correction: `41d2de6bc76331322cc63e8038432b0b02f60da1`.
- The main merge tree is source-equivalent to the verified release head.
- Changes after the historical application base now include the merged OCR
  recovery implementation and its additive migration; the production receipt
  is anchored to `bdb0dda0…`.

## Verification snapshot

| Gate | Result |
| --- | --- |
| Full suite | 1,487 tests / 87 files PASS |
| Focused T02-T07 | 819 tests / 40 files PASS |
| Clean D1 | 22 / 22 migrations PASS |
| Upgrade sanity | 0020 -> 0022 PASS |
| Existing data | 776 rows / 58 tables preserved |
| Browser | 264 assertions / 36 phases PASS |
| Payment-adjacent | 82 tests / 7 files PASS |
| Main CI | 34396319671 SUCCESS |
| Previous final-head CI | 34405307196 SUCCESS |

These are the preserved release gates; the post-cutover local gates and remote
schema/Week checks are recorded in the receipt below.

## Deployment and production boundary

- Previous release deploy workflow `34396457582`: **SUCCESS**.
- Previous docs-cleanup deploy workflow `34405457796`: **SUCCESS**.
- Release packaging completed.
- Staging was not provisioned; no staging deployment occurred.
- Production DB migration: **COMPLETE** - D1 `frigo-db` ledger contains exactly `0001` through `0023`; `0023` was applied additively on 2026-09-13 after the retained backup.
- Production deployment: **COMPLETE** - Worker deployed with Wrangler OAuth from candidate SHA `bdb0dda0b1123c4fd940058091e3cb285d5e8eb8`.
- Production reconciliation: **COMPLETE** - post-cutover source, schema, health and traffic checks passed.
- Active deployment: Cloudflare version `df7225c9-6f20-4206-9f16-573de6a69c43`, 100% traffic, deployed 2026-09-13T01:01:24Z.
- OCR recovery: **DEPLOYED AND VERIFIED**. Remote D1 `0023` is applied and gated;
  Qwen secret and non-PII smoke passed; readiness reports commit `bdb0dda0…`.
- Planner rollout: NOT STARTED.
- Production secret `QWEN_API_KEY` was added from the operator clipboard; its
  value is never stored in the repository or logs. Existing secret names include
  `JWT_SECRET`,
  `OTP_HASH_SECRET`, `TURNSTILE_SECRET_KEY`, `QWEN_API_KEY` and optional
  `GROQ_API_KEY`. The Qwen key value is not written to the repository or logs.

## Production cutover receipt (2026-09-10)

Verified against `https://frigo.tungjpstore.net` after the cutover:

- Worker readiness: HTTP 200, `status=degraded`, `environment=production`, and
  full `commit=d1b06732f8a80db4e77986df31ff28d9f04641fa`; database/queue/AI/email
  are `ok`/`configured`, rate limiting is `kv-best-effort`, and the only issue is
  the non-blocking warning `CONFIG_PLUS_GRANT_SECRET_MISSING`.
- Liveness and landing smoke: `GET /` and `GET /api/v1/health` returned HTTP 200;
  readiness smoke passed with database `ok` and no fatal configuration issue.
- Exact remote schema gate: PASS; migration ledger is exactly 22 entries
  (`0001`-`0022`), foreign-key violations are `0`, and the Week strict
  reconciliation is 2/2 plans with 0 orphan rows and 0 mismatches.
- Key preserved row counts: users 28, households 28, inventory items 13,
  recipes 59, meal plans 2, scan queue jobs 15, sessions 2, auth OTPs 0.
- CORS verification: the exact trusted origin receives its own ACAO header;
  path-bearing, localhost and arbitrary origins receive no ACAO header.
- Backup retained at `.artifacts/frigo-db-pre-main-d1b0673-20260910T205627Z.sql`,
  mode 600, 521095 bytes, SHA-256
  `000c9cb88d6045afb19cca6ce3e1caa308b20ffa214dbb2cddfca0cb78d722eb`.
- Deployment used a clean detached checkout at the approved main SHA and
  `GIT_COMMIT` injection only; no planner flag, PayOS/payment path or secret
  value was changed.

## OCR production-recovery candidate (2026-09-12)

The candidate addresses provider/model recovery and scan failure handling without
changing the production receipt above:

- Candidate schema now includes additive migration `0023_scan_request_fingerprint.sql`;
  local replay and schema checks cover `0001`-`0023`. Production D1 migration
  `0023` was applied after backup `.artifacts/frigo-db-pre-ocr-20260913T005253Z.sql`
  (SHA-256 `bc62e5844c6a838a3b1b98d29dffa39c9d6cf6e1d570617e843c9e3e820bb088`).

- Qwen `qwen3.7-flash` is the primary provider for vision, receipt OCR, chat and
  recipe ranking through the DashScope international OpenAI-compatible endpoint
  (`QWEN_BASE_URL`, `QWEN_MODEL`); structured requests disable thinking. Groq is
  retained only as an explicit legacy fallback (`GROQ_FALLBACK_ENABLED=true`),
  and is disabled in the candidate vars.
- Native Cloudflare vision remains opt-in through
  `CLOUDFLARE_VISION_FALLBACK=false`. DeepSeek remains the optional text/ranking
  fallback when `DEEPSEEK_FALLBACK_ENABLED=true`, and Z.ai/GLM the optional
  vision/text extension path when `GLM_FALLBACK_ENABLED=true`; a GLM-5.3 Flash
  upgrade is future work and is not claimed as active.
- Vision and receipt responses pass Zod validation plus a deterministic quality
  gate: generic/placeholder labels and confidence below `0.6` are removed;
  no usable rows return `AI_SCAN_NO_USABLE_ITEMS` instead of a fabricated draft.
- Typed provider errors classify permanent `MODEL_NOT_FOUND`, auth/permission,
  license, schema/invalid-response and quality failures separately from retryable
  `REQUEST_TIMEOUT`, `NETWORK_ERROR`, `RATE_LIMITED` and `UPSTREAM_ERROR` errors;
  queue retries remain bounded by the existing attempt/DLQ contract.
- Scan status responses expose bounded error codes and retry metadata; OCR output
  remains untrusted draft data requiring review and confirmation.
- Focused local checks on 2026-09-13: Qwen provider ESLint PASS;
  provider/recovery, queue, quota, scan-route and UI tests PASS. The complete
  candidate `pnpm check` gate is green: 1,579 tests / 93 files PASS, lint,
  typecheck, migration replay through `0023` and production build all PASS.
- Live provider access is **VERIFIED**: non-PII chat smoke returned HTTP 200 from
  DashScope with model `qwen3.7-flash` and response `OK`. Production readiness
  returned HTTP 200 with `ai=configured`, database/queue `ok`, and only the
  existing non-blocking `CONFIG_PLUS_GRANT_SECRET_MISSING` warning.

## Verification commands

- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm check:migrations`: PASS (`migration-smoke=ok`).
- `pnpm build`: PASS.
- `pnpm test`: 1,427/1,487 passed; 60 failures are confined to the two known
  shell/jsdom UI suites (`localStorage`/`container` unavailable). Hosted exact-SHA
  CI run `34413458369` remains the authoritative 1,487/87 PASS gate.
- `pnpm schema:check:remote`: PASS; `pnpm week:reconcile:remote -- --strict --json`: PASS.
- `pnpm audit --prod`: 2 moderate `react-router` advisories via
  `react-router-dom` (patched upstream at 7.18.0; major upgrade not included in
  this cutover). Full dependency audit reports 21 findings, with the remainder
  confined to development/tooling paths (`wrangler`/`miniflare`/`jsdom`).
- Read-only lineage checks: `git ls-remote --heads github-frigo main` returned
  `db2377fd9f63d1be38ce3882c6d8173e0bf9e497`; `git rev-list --left-right --count
  HEAD...github-frigo/main` returned `0 2`; no remote fetch or mutation was run.
- `git diff --check`: PASS for this documentation checkpoint.
- OCR candidate local lint/typecheck/test/build/migration checks: **PASS** on
  2026-09-13. Hosted PR #17 CI run `34728606704` also passed (1,579 tests / 93
  files). Live non-PII Qwen smoke, migration `0023`, deployment and readiness
  evidence are verified; only the non-blocking Plus Grant warning remains.
- Wrangler OAuth is authenticated as `tungbipdz@gmail.com` (account
  `ef250a88911fd24073cb73d1c07e0218`).

## PR #8 metadata

PR #8 METADATA:

Authoritative GitHub state: `MERGED`, `isDraft=false`,
`mergedAt=2026-09-09T19:38:59Z`, `closedAt=2026-09-09T19:38:59Z`,
`mergeCommit=23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`, base `main`, head
`hoplite/kirrha-5f4057f0` at `0420807968538f61b669569d064c404f67032174`.

Application integration and PR metadata are separate facts: application
integration is complete in main at `23ef51d`; PR #8 was already merged and was
not reopened, re-merged or modified.

## Kirrha archival state

Kirrha is two commits ahead of current main and differs in four `docs/ai/` files
only. There are no application differences on that historical branch that are
absent from main. Do not merge or revert kirrha.

## Protected areas

PayOS/payment code untouched.

No real payment performed.

## Next task

Next task: MONITOR OCR QUALITY/LATENCY AND SCHEDULE REACT ROUTER UPGRADE

Keep the deployed Worker and planner flags at their safe defaults while the OCR
candidate is validated. Run the focused provider/queue/UI tests, all required
local gates and an authorized live-provider smoke against the exact candidate SHA;
then obtain hosted CI, readiness and canary evidence before any production deploy.
No remote migration or production secret change has been performed for this
candidate. Migration `0023_scan_request_fingerprint.sql` is required before a
guarded deploy; do not touch PayOS/payment or use a down-migration. Until a new
readiness receipt exists, the production receipt remains the direct Wrangler
deployment above; rollback is code-only to a schema-compatible SHA.

The deployed receipt is anchored to main SHA
`d1b06732f8a80db4e77986df31ff28d9f04641fa`; the pre-cleanup main head is
`41d2de6bc76331322cc63e8038432b0b02f60da1`.

## OCR image payload optimization (2026-09-13)

- Local candidate `src/web/lib/private-image.ts` now decodes gallery images in
  memory, caps the longest side at 2,000 px, and emits JPEG quality `0.82` only
  when the derivative is smaller; small images are never upscaled.
- The original `File` is not modified or persisted. Private-session fencing and
  cancellation cover the async bitmap/canvas path; unsupported browsers fall
  back to the existing `FileReader` data URL flow.
- The attached 1,086x1,448 receipt measured 2,116,353 bytes as PNG. A local
  JPEG quality-0.82 conversion measured 382,334 bytes (81.9% reduction) without
  changing pixel dimensions. Provider OCR recall has not yet been re-run on the
  browser-generated derivative.
- Regression coverage: `tests/unit/scan-privacy.test.tsx` now has 11 passing
  tests, including resize, no-upscale and cancellation cases.
- Status: **COMMITTED LOCALLY / NOT DEPLOYED** at `ba3d872eea2d677e38f94adb8355f493c4c45852`.
  Next action is device/browser OCR smoke with the attached receipt, then open
  the release review for promotion.

## Qwen runtime governance candidate (2026-09-13)

- Working branch: `feat/qwen-ai-runtime-cost-router`.
- Base SHA: `05423f2ad675006a4c7913e696f1979b3fcaae59` (`github-frigo/main`).
  Canonical `main` is unchanged; no production deployment is authorized.
- Application checkpoint: `21c442d` (`feat(ai): add governed qwen task runtime`).
  Documentation remains a separate local checkpoint after this implementation.
- Added `QwenTaskRuntime`, model-role governance, versioned prompt registry,
  centralized pricing, bounded budgets/escalation, structured validation and
  isolate-safe usage telemetry. Production Worker composition now explicitly
  builds this path with `AI_QWEN_ONLY=true` and the role aliases in
  `wrangler.jsonc`.
- Scan HTTP, scan queue and meal explanation constructors share the same
  server-side AI config helper. Legacy non-Qwen adapters remain only for
  compatibility when Qwen-only mode is not selected; they are not constructed
  by the production path.
- Inventory boundary is intentionally limited to this repository: the final
  T08-T12 Inventory Truth AI-to-observation-to-reconciliation certification is
  pending later unification with `frigo-dev`; no code or migrations were
  imported from that lineage.
- Offline golden fixtures and `pnpm ai:eval -- --dry-run` were added. No live
  Alibaba request is made by tests or CI. Optional shadow traffic is disabled
  by default and now reserves its call/token budget before launching.
- Final local verification: `pnpm check` PASS with 1,606 tests / 95 files,
  lint, typecheck, migration replay and production build all PASS. The check
  intentionally skipped remote D1 schema and Week parity because no release
  flag was supplied. `pnpm ai:eval -- --dry-run` and `git diff --check` PASS.
- Focused recertification command covered Qwen runtime/provider, router,
  configuration, explanation, image privacy and scan queue paths: **119 tests /
  8 files PASS**. No concrete runtime defect was found during the final review;
  readiness already probes the additive scan columns from migration `0023`.
- `pnpm audit --prod` remains a known non-blocking follow-up: two moderate
  `react-router` advisories are fixed upstream at `>=7.18.0`; this task did not
  change dependencies.
- Candidate publication is complete: `feat/qwen-ai-runtime-cost-router` was
  pushed normally to `github-frigo`, and `git ls-remote` verified the remote
  SHA against the local candidate. Canonical `main` remains unchanged at
  `05423f2`; no merge, remote migration or deployment occurred. Next action is
  code review or a separately authorized Qwen benchmark.

## Qwen pre-unification hardening (2026-09-13)

- Application implementation/publication SHA: `f8468eaa7d7fed3cbcf5ac7e780eca07ad3d71e4`.
- Final pre-documentation branch head (including the scheduler-failure
  regression test) is `a145ef5`; the docs checkpoint is a subsequent commit.
- The normal push was verified against `github-frigo/feat/qwen-ai-runtime-cost-router`
  at that SHA; this documentation checkpoint is a subsequent local commit.
- OCR capability metadata is centralized in `packages/ai/src/model-governance.ts`.
  `qwen-vl-ocr` is treated as a rolling alias (`pinned=false`), omits both
  provider `response_format` and `enable_thinking`, and continues application
  JSON parsing, normalization, Zod validation and quality gates. Supported
  Qwen multimodal models retain provider JSON mode.
- Singapore low-context estimates are now versioned as
  `estimate-2026-09-sg-low-context` for the fast/multimodal/OCR/reasoning tiers;
  judge remains an explicitly documented planning estimate. Cost telemetry is
  still estimated and reconstructable from model, token counts, cache counts and
  pricing version.
- Vision payloads are rejected before provider inference using decoded base64/data
  URL byte estimates. Defaults are 5 MiB for `AI_MAX_IMAGE_BYTES` and
  `AI_MAX_OCR_IMAGE_BYTES`, bounded to 64 KiB-20 MiB; remote URLs remain unknown
  at this layer and rely on upstream storage/upload limits.
- Shadow canary remains `AI_SHADOW_CANARY_PERCENT=0` by default. When enabled,
  it reserves call/token budget and is scheduled only through the optional
  `backgroundExecutor` (`ExecutionContext.waitUntil` in HTTP routes); queue and
  other hosts without an executor skip shadow safely. Scheduler invocation
  failures are isolated so the primary response remains successful.
- Focused regression command: **134 tests / 8 files PASS**. Full `pnpm check`:
  **1,623 tests / 95 files PASS**, lint/typecheck/migration replay/build PASS.
  `pnpm ai:eval -- --dry-run` and `git diff --check` PASS. `pnpm audit --prod`
  remains FAIL with the two pre-existing moderate React Router advisories
  (patched upstream at `>=7.18.0`); no dependency upgrade was made.
- No live Qwen benchmark, production deploy, remote migration, secret change,
  merge, or PayOS/payment change was performed. T08-T12 Inventory Truth work
  remains pending U01/U02 and is not imported here.
- Branch publication target remains `feat/qwen-ai-runtime-cost-router`; verify
  the final commit SHA with `git ls-remote` after the normal push. Next action:
  code review, then a separately authorized benchmark/release decision.
Record the new post-merge main SHA in the final operator receipt; the
pre-cleanup main head is `41d2de6bc76331322cc63e8038432b0b02f60da1`.

## SAFE STOP — T13R-B — 2026-09-13T21:35Z

Branch `hoplite/medma-164548ce`, WIP `7e68e3b` (P2-1 `4d587eb` below it).
T13R-B truthful presentation + conflict remediation code/tests complete and
green on executed checks (typecheck, t13r-b-presentation 12/12, full
Playwright 51 passed); certification and freeze not started. Details:
`docs/ai/inventory-truth/t13/T13R_B_REMEDIATION.md`.
## Canonical promotion CLI checkpoint (2026-09-15)

- GitHub CLI identity: `Tungjpstore`; target `vn-dlo/Frigo-dev` (repository ID
  `1368281478`) is reachable with push access, but the account has no admin or
  maintain permission.
- PR #1 remains open from `canonical/5f6853d-promotion`. The promotion head was
  advanced by one empty commit, `ae1689c1f5525262da3478137b402692e4e4ed45`,
  solely to retrigger pull-request validation; its tree is unchanged.
- Exact hosted CI is still absent: no workflow run, check run, or status exists
  for the promotion head. Manual dispatch was rejected by GitHub with HTTP 422:
  `Actions has been disabled for this user`.
- No merge, deployment, remote migration, production KV/R2/D1 mutation, or
  payment/PayOS change was performed. Promotion remains blocked pending hosted
  CI and maintainer/admin authorization.
- Repository-owner authentication is now active in `gh` as `vn-dlo`, with
  admin/maintain access. `main` protection was enabled: PR required, one
  approving review, `validate` status required, force-push and deletion blocked.
- Promotion head is now `6ec7ff08ef258ef2ca95fb5d24b581b939ef1c92` after a
  second empty, tree-neutral CI trigger commit. Hosted CI still has no run.
- A clean owner-visible PR #2 is now at
  `8eb6d2b8d54e5e2fd08c0a11acd9f57a1e068b24`; exact hosted CI run
  `34968012294` passed validate, lint, typecheck, Vitest, migration smoke, and
  build. The PR remains blocked only by the required independent approval.

## Google GIS popup blank-page fix (2026-09-16)

- Root cause isolated from the production `/auth` response and Safari symptom:
  Hono `secureHeaders` was emitting `Cross-Origin-Opener-Policy: same-origin`,
  which breaks the opener relationship Google Identity Services needs for its
  popup credential handshake.
- The Worker now disables Hono's fixed COOP value and applies a path-aware
  policy after routing: SPA documents use `same-origin-allow-popups`, while
  `/api/*` responses retain `same-origin` isolation. `public/_headers` matches
  the SPA policy for static hosting.
- Regression coverage in `tests/integration/worker-cors.test.mjs` proves both
  headers and prevents weakening API isolation. Focused auth/COOP tests pass
  (`17/17`); lint, typecheck and `git diff --check` also pass.
- Published through PR #9 after exact-head hosted CI passed. Worker version
  `20bc1f35-6ffe-4085-ba79-d54a0b53da71` now serves 100% of the custom domain.
  Post-deploy smoke passed; `/auth` returns `same-origin-allow-popups`, API
  responses retain `same-origin`, and readiness reports database/queue/AI/email
  healthy with only the pre-existing `CONFIG_PLUS_GRANT_SECRET_MISSING`
  warning. No migration, secret, PayOS, DNS, KV, R2 or queue mutation occurred.
## T18C continuation — approved source recovered (2026-09-21)

Resumed `2e770f8e93bdda63dc3534093dc313d99fab229d` on the existing
`feat/t18c-final-redesign-certification` branch. Repository ID `1368281478`
now resolves to owner-authorized `vn-tako/Frigo-dev`; main remains `b8447e85`.
Upstream corrected to the matching origin branch. Pre-existing
`.hoplite/settings.json` is preserved and excluded from task commits.

`PORT=5173 pnpm exec playwright test -c playwright.t18c.config.ts
tests/e2e/t17-ui/t18c-matrix.e2e.ts`: **6 passed**, 162 screenshots,
162 strict axe audits with **zero violations**, zero overflow. This fresh
pause-tree result does not yet certify the upcoming source-led fixes.
The original ZIP is now available; see `T18C_SOURCE_PROVENANCE.md`.
Direct comparison is underway; desktop composition/breakpoint and keyboard
findings are being classified. Status: **T18C_PARTIAL**. Full T17 regression
and final gates remain pending. VoiceOver/NVDA NOT PERFORMED. No merge,
deployment, remote migration, or T18D work.

---

# T20 hardening — branch-local code freeze, 2026-09-26 UTC

**Not `T20_PRODUCTION_READY`.** `origin/main` is still PR #7 merge `bf57451`
(`bf57451e4a1a047eeff7a0938b903d1a37b6f8c9`); its last CI `36221190222` failed on the T20 add/remove race
test. PR #8 remains open at reviewed head `5b0a6b9` (`5b0a6b995786b338999286023eb2e46de4bc45a7`),
MERGEABLE/CLEAN, no unresolved threads, hosted `validate` `36226026618`
SUCCESS. Agents cannot merge PRs in this workspace. `pnpm check` on the exact
PR #8 head passed locally (201 files / 4,554 tests, migration smoke, build),
but **main has not gained that fix or an exact-main green CI run**.

The follow-up branch `fix/t20-postmerge-ci-picker-cuisine--hardening` / PR #9 is
stacked on PR #8. Checkpoints pushed: C2 `762015f` (revision recheck after the
torn plan/composition read and before Auto/Assisted apply option lookup; six
deterministic integration tests); C3 `bc92346` (invalidate picker results on
filter change), `c555443` (four-way filter/pagination assertions); additional
P2 fix `fb4416e` (Manual safety now uses T02 inventory before each added
component, including consumption by earlier components in the slot). No known
unfixed T20 P0/P1/P2 from this audit. Ownership, D1 revision fence, recipe
authority, V1/family shopping and composer budgets were not weakened.

At `fb4416e`, `pnpm check` PASS: typecheck, lint, 202 Vitest files / 4,562
tests, `migration-smoke=ok`, build. Focused T19/T20 authority, 500 catalog,
D1-only detail/cooking/shopping, and authority-change suites: 6 files / 80
tests PASS. The isolated T20-enabled preview was checked at 390×844, 768×1024,
1280×800 (Vietnamese/Korean/Japanese, combined filters, empty/clear, 20→40
load-more, keyboard focus/Escape, no horizontal overflow); production flags
remain off. PR #9 has no hosted checks while its base is PR #8's branch: CI
only triggers for pull requests targeting `main`/`master`.

Staging configuration exists, but local staging Cloudflare credentials are
absent and the GitHub App cannot read staging secret names (403). Target D1
identity, ledger and rollback bookmark have **not** been verified; 0039 has
not been remotely applied, and neither staging nor production was deployed.
Next: maintainer merges PR #8 normally, confirms exact-main CI, retargets
PR #9 to main, certifies its exact-head CI/review and merges normally. Then
verify staging identity/ledger with authorized credentials before a reviewed
migration and paired flag-off/flag-on deploy sequence. Do not touch production.
