# Architecture Decisions

## ADR-033 — Runtime Ingredient Model V2 is an evidence-gated projection, not a V1 replacement

**Status:** Proposed 2026-09-27 for review. No live cutover, D1 migration, 0040,
final release manifest, production mutation or T20 enablement is authorized.

**Context:** ADR-032 preserves 6,766 canonical research ingredient rows, but the
closed V1 `RuntimeRecipeIngredient.requiredQuantity` projects only 3,770. That
single V1 value is currently read as display, shopping/planner demand, cooking
deduction and sometimes incorrectly as edible/nutrition amount. The 2,860
release-required exclusions cannot be repaired with universal tablespoon,
teaspoon, produce-weight or process-absorption defaults.

**Options:** Expanding `StandardUnit`/nullable V1 quantities would immediately
affect T02–T05, Week, cooking and T20. Mutating the canonical ZIP would lose
source truth. A separate pure, versioned projection can make each semantic
quantity and unresolved state explicit without changing live contracts.

**Decision:** Add `RuntimeIngredientV2` as an offline projection candidate with
separate display, shopping, process and consumed channels. Source adaptation
never certifies edible yield. Shopping measurements are admitted automatically
only for directly evidenced physical units; process scaling and qualitative or
culinary measurements remain unresolved. A guarded V1 shopping projection
throws on provisional authority, missing purchase quantity or unreviewed
non-shopping exclusion. Exact physical conversions remain in the existing
domain unit policy; no culinary conversion is inferred. Reviewed ingredient
authority is a separate explicit decision: a new master row needs a reviewed
concept with basis/reference, and an alias must target an existing ID.

**Consequences:** The static 71 and present D1 hydration/fingerprint remain
unchanged. The new audit pins the source SHA and classifies every current row;
the release gate remains red. V2 is not yet a serving API, planner cutover or
D1 schema: resolving the evidence queues, authorizing the V2 runtime/content
wire model, and proving consumer compatibility are required before 0040.


## ADR-032 — Recipe Content Refresh V2 uses a richer canonical source and a separate deterministic runtime projection

**Status:** Accepted 2026-09-27 for the canonical-source branch. No migration,
remote D1/R2 mutation, recipe-authority change, deployment or T20 enablement is
authorized by this decision.

**Context:** The externally researched 500-recipe ZIP is not a runtime import
batch. It contains 15 root shapes, qualitative and process ingredients,
unsupported culinary units, 289 nominal nutrition profiles with process-media
errors, and research provenance that must not be flattened into
`RuntimeRecipeIngredient`. The existing T14E compiler is intentionally
INSERT-only, the closed runtime unit vocabulary is still required by planner,
inventory, shopping and cooking, and `ALL_RECIPES` remains the 71-recipe
rollback baseline under ADR-027/030.

**Decision:**

1. `data/recipe-refresh/v2` is the canonical research source for this content
   generation. Every recipe uses one strict schema and preserves identity,
   research sources, normalized steps, source-rich ingredient quantity evidence,
   usage/nutrition roles, nutrition certification, legacy media compatibility
   and audit metadata. Source truth may be richer than runtime truth.
2. Ingredient roles include consumed, process-only, mixed-process, optional,
   garnish and qualitative. Nutrition separately distinguishes consumed,
   excluded process, unresolved absorption and excluded optional rows. Unknown
   edible quantity or absorption remains explicit; no made-up gram/ml/count
   value is introduced to satisfy runtime contracts.
3. Ingredient identity uses the existing exact catalog resolver first, then a
   deterministic provisional name key for `ING_ENR_*` IDs. Nutrition/FDC URLs are
   evidence only and never identity authority. This prevents proxy reuse from
   merging foods such as miso with soy sauce, galangal with ginger, or bell
   pepper with generic chili. Reconciliation remains machine-readable.
4. Nutrition is recomputed from evidenced edible gram equivalents. Explicitly
   non-consumed process rows are excluded; frying, extraction, marinades and
   mixed use with unknown transfer/absorption block certification. Only a
   complete seven-nutrient profile with no material blocker publishes as
   `<recipe-id>_nutrition_v2`; blocked/null profiles expose null certified
   nutrients and retain a separate non-publishable candidate for audit.
5. `scripts/recipe-refresh-v2.mjs` is a no-network deterministic build/check
   boundary. It writes the canonical package, audit artifacts and exact
   `RuntimeRecipe` projection, hashes ordered canonical files, and computes
   runtime identity only through the project's `fingerprintRecipes()`.
   `pnpm recipe:refresh:check` fails on catalog/schema/exception/hash/projection
   drift. Mutable URL spot checks are evidence outside the canonical hash.
   The runtime fingerprint is explicitly provisional. `pnpm recipe:refresh:release-check`
   fails with typed blockers until a separately reviewed production projection
   and final fingerprint exist.
6. Runtime projection does not make quantities nullable. It admits only
   canonical IDs with positive `StandardUnit` quantities, excludes non-shopping
   water and estimated process quantities, and omits uncertified nutrition.
   Rich process/qualitative metadata remains source-only until a separately
   reviewed runtime contract can carry it without breaking planner/inventory/
   shopping/cooking/T20 behavior.
7. The T14E import compiler and current release manifest remain unchanged.
   Content Refresh V2 is a separate future convergence path. Before generating
   `0040_recipe_content_refresh_v2.sql`, reconcile runtime/content loss, promote
   ingredient authority with evidence, verify sources, certify nutrition, and
   generate a complete final projection. The migration must preserve recipe IDs,
   verify exact old/new states, inspect child FKs and fail closed on unknown state.

**PR #11 remediation:** The original canonical package conflated source validity
with release readiness. The source manifest now records four typed blockers,
`productionReleaseReady=false`, `finalRuntimeFingerprint=null`, and a separate
provisional projection fingerprint. All 500 source files retain URL references
but distinguish structural validity from content verification. Generated
`ING_ENR_*` identities are provisional until an explicit review record exists;
the ingredient-authority assertion rejects provisional IDs. Per-recipe exclusion
reasons and an aggregate coverage report make runtime loss auditable. This adds
no D1 schema or runtime quantity contract change.

**Consequences:** The canonical package can be reviewed and reproduced without
production reads, network calls or AI. A refresh release may update the D1 500
while preserving the static 71 rollback baseline. Nutrition coverage may shrink
rather than publish false precision. Media remains ADR-025 metadata/R2 work and
is not marked ready by this source. Staging certification and any 0040 rollout
are separate release tasks.

## ADR-031 — Meal Composition V2: one composition per slot, additive storage, shared revision, single-subtraction projection (T20)

**Status:** Accepted 2026-09-25 for T20 implementation. Gated off by default; no
production migration or deployment. Details: `MEAL_COMPOSITION_V2.md`.

**Context:** The Meal Planner (ADR-017/030) persists one T04-selected recipe per
slot inside versioned JSON. T20 needs meals of several ordered, lockable
components (recipes and simple foods), Manual/Assisted/Auto building, and correct
shopping — without a second recipe authority, without rewriting stored V1 plans,
and without breaking V1 clients whose schemas are `.strict()`.

**Decision:**
1. Additive migration 0039: `generated_meal_plan_compositions` (slot-level
   MealComposition, FK to the existing plan) and `generated_meal_plan_components`
   (ordered components; `recipe_id` XOR `simple_food_id`; one dish per meal via
   partial unique indexes; no FK to `recipes`). `recipe_role_assignments` stores
   non-rule role provenance with SQL-enforced confidence/review invariants.
2. Read-time V1 compatibility: a slot without a composition row is the
   one-component projection `main / legacy_v1`. The first V2 mutation
   materialises it; rows are then canonical for that slot. `result_json` is never
   rewritten. V1 endpoint schemas are unchanged; V2 uses new sub-routes.
3. One optimistic-concurrency authority: V2 writes bump
   `generated_meal_plans.revision` in the same D1 batch behind a fence insert that
   aborts the batch on a stale revision. V1 swap on a composed slot is a typed
   409; V1 regenerate preserves locked components and follows the new anchor for
   unlocked ones atomically; V1 shopping projects every component.
4. T19 authority is consumed, never re-derived: components, picker items and
   Auto candidates must be in the request's `RecipeAuthoritySnapshot`; role rows
   are read only for `d1` authority and fenced to its universe; authority change
   is the existing `CATALOG_AUTHORITY_CHANGED` revalidation.
5. Shopping: all components of all meals are evaluated by T02 against one running
   T04 projection (exact consumption witness), then T05 aggregates unchanged —
   inventory is subtracted once; no parallel shortage arithmetic.
6. Roles are deterministic rules (versioned) plus persisted reviewed/imported/AI
   rows; no runtime AI; human review outranks inference; AI rows below 0.8
   confidence are never effective.
7. Assisted/Auto share one bounded beam search (explicit anchor, per-role, beam,
   partial and scoring budgets; hard compatibility pruning; decomposed score;
   deterministic with a bounded `variant`). Suggestions never write; apply
   recomputes and requires the same option ID. Locked components are immutable
   to generation (domain-enforced and re-verified).
8. Flags `MEAL_COMPOSITION_V2_ENABLED` (server) / `VITE_MEAL_COMPOSITION_V2_ENABLED`
   (UI), independent of T19 flags. Flag off = exact pre-T20 behaviour.

**Consequences:** Deploying T20 code requires applying 0039 first (the D1
schema gate fails closed on a 0038 ledger). Composed slots describe themselves
through components; the V1 generation record remains for audit/rollback.
Leftovers, per-component servings, curated role review tooling and whole-week
Auto are deferred.

**Amendment 2026-09-26 (PR #7 review P1 remediation):**
- One hard-restriction definition: T03 `evaluateHardRestrictions` (extracted from
  `evaluateRankingEligibility`, behaviour unchanged) judges Auto/Assisted (via
  ranking) and every component a Manual mutation adds (via
  `composition/restrictions.ts`, same T02 candidate and evidence). No manual
  override model exists.
- V1 family-variant meals stay V1-edited (swap) and are refused by composition
  routes; they are projected as `legacy_family` so composed shopping keeps them.
- Composition shopping requires the planner's substitution policy
  (`evaluationScope(context)`); it cannot be constructed without one.
- Flags ship through `deploy.yml` from one normalized release output with a
  post-build guard; defaults are false everywhere.

## ADR-030 — One recipe authority for the Meal Planner, stored-plan authority identity, reviewed full-D1 release state and protected release evidence (T19 V2)

**Status:** Accepted 2026-09-22. The immutable original branch is published at
`0a04209`; application checkpoint `558be74` is integrated from current main on
`feat/t19-recipe-authority-cutover-v2-integration`. Hosted application CI is
pending; production remains untouched.

**Context:** ADR-026 made the Recipe API/Week/Shopping/Cooking read one
`RecipeAuthoritySnapshot`, but the Meal Planner still loaded the raw D1 catalog
via `loadMealPlanningSnapshot()`. With the 500-recipe ledger applied and
production configured `static`/`shadow`, the planner could plan, suggest and
swap recipes the Recipe API did not list and cooking could not resolve; planner
catalog fingerprints also hashed the whole D1 catalog, so invisible D1-only
edits staled static plans. The release path (`release-check.mjs` + Deploy
workflow) explicitly rejected `d1`, and public readiness could not certify
recipe authority.

**Decision:**
1. `loadMealPlanningSnapshot(db, scope, time, authoritySnapshot)` now takes the
   request's effective authority snapshot; `projectPlannerCatalogOnAuthority`
   (`packages/db/src/planner-catalog-authority.ts`) takes recipe definitions and
   steps from that snapshot in every mode — `d1` adds D1 planner enrichment
   (families of visible recipes, classifications, provenance, nutrition,
   diagnostics) fenced to the visible universe and degrades to the
   authority-only projection if the enrichment read fails; `static` (also
   shadow / canary-outside) reads no D1 planner rows. The planner universe is
   exactly the authority's recipe set; alternatives/swap/regenerate never expose
   an invisible recipe (invisible swaps are `REPLACEMENT_NOT_FOUND`; invisible
   locks are dropped on regenerate, never substituted in place).
2. `MealPlanningServiceOptions.recipeAuthority(scope)` is required and installed
   by route composition from deployment config + deterministic household canary;
   request input never reaches it.
3. Stored plans persist `source_json.data.authority {source, fingerprint,
   recipeCount}` (envelope version stays 1; pre-T19 rows without it still
   decode). An authority-source change is a typed revalidation: freshness reason
   `catalog_authority_changed`, `CATALOG_AUTHORITY_CHANGED` (409) on swap and
   shopping, regenerate as the only recovery path. Authority change means a
   different source, fingerprint or recipe count (same-source release drift is
   typed too). Historical plan data is never mutated.
4. Planner catalog fingerprints hash only authority-visible recipes, steps and
   nutrition rows: a D1-only edit cannot stale a static plan; a D1-visible edit
   correctly stales a D1 plan.
5. Reviewed release states become `static`/`shadow`/`canary`/`d1` with canary
   percent ∈ {1,2,5,25} (new 25 staging step) and percent 0 required elsewhere;
   `RECIPE_CATALOG_CUTOVER_ENABLED` is derived (true iff `canary|d1`), never an
   input. `d1` means every household is served the verified D1 release; runtime
   fallback semantics (verified D1 or static with diagnostics) are unchanged.
6. Observability: `/health/ready` gains a sanitized `recipeAuthority` summary
   (mode/cutover/percent/global source/fallback/release ID/expected count). A
   protected `GET /api/v1/health/recipe-authority` (bearer `RELEASE_VERIFY_TOKEN`
   Worker secret, constant-time compare, 404 when unset) returns machine-readable
   evidence that `release-check.mjs authority` verifies against the approved
   manifest — deployed SHA, mode/percent/cutover, D1 readiness, served count and
   release fingerprint, no fallback. No PII, no secrets, no household data; no
   customer account is required for release certification. Canary probes
   resolve in-cohort and shadow probes resolve through a probe-local D1
   configuration, so `shadow` proves D1 readiness before any canary while users
   keep receiving static.
7. Non-terminating aggregate shopping demand (e.g. two 2-serving meals of a
   3-serving recipe) is reported `unresolved`
   (`UNRESOLVED_PURCHASE_QUANTITY`, unknown budget) instead of throwing at the
   T05 exact-quantity boundary; rounding remains forbidden.

**Consequences:** T14D/T14F authority tests keep passing with the planner added
to the parity set; T19 cross-flow, fingerprint, persistence, observability and
release-state tests pin the behavior. Stored pre-T19 plans revalidate through
the catalog fingerprint until regenerated. Production rollout is operator-driven
through the reviewed Deploy workflow (shadow → canary 1/5/25 → d1), each gate
machine-verified: the release ref must equal current main, the deployed commit
may never move backwards, promotions require healthy evidence from the current
stage, downgrades/bootstraps require explicit confirmation, Cloudflare/D1
identity and catalog identity/integrity are certified read-only before every
mutation, and a failed or cancelled deployment restores the exact previous
Worker version through the Cloudflare API with a complete proof. Serving
rollback is redeploying `mode=shadow`/`static`.

## ADR-027 — Reviewed Bulk Recipe Imports and Catalog Release Manifests (T14E)

**Status:** Accepted 2026-09-17; remediated 2026-09-17 after independent review (nutrition evidence persistence, complete
immutable batch hash, manifest-failure telemetry). Factory + manifest architecture open for re-review; no real catalog
growth; production remains `4ed98514…` / D1 0034 / `static`.

**Context:** T14D certifies D1 authority only when the hydrated catalog equals `ALL_RECIPES` exactly. That is correct for
71 recipes but makes intentional growth (500 → 5,000+ recipes, T14F) impossible: either `ALL_RECIPES` would have to grow
into a multi-megabyte static bundle, or readiness would have to be weakened to "D1 has some recipes". Neither is acceptable.
Bulk import also needs a safe, deterministic path from an authorized dataset to reviewable SQL without touching
`migrations/`, the static source, D1 or R2, and without inventing ingredient IDs.

**Decision:**
1. **`ALL_RECIPES` stays the immutable legacy/static rollback baseline (71).** It is never the scale strategy. Emergency
   fallback (`RECIPE_CATALOG_MODE=static`, or a D1 fallback) deliberately serves only the 71-recipe baseline; diagnostics
   must show reduced coverage rather than pretend the expanded release is served.
2. **A versioned Catalog Release Manifest** (`packages/recipes/src/import/catalog-release.current.json`, schema v1:
   `releaseId`, `legacyBaselineCount/Fingerprint`, `expectedRecipeCount`, `orderedRecipeIds`,
   `expectedRuntimeFingerprint`, `approvedImportBatches[{batchId, batchHash, recipeCount, releaseBaseCount, …}]`) is the
   reviewed expectation of the COMPLETE D1 catalog. It is composed deterministically (`composeCatalogRelease(legacy,
   approvedBatches)`), ships with the application, is verified by `pnpm recipe:import:check` + tests, and is never loaded
   from a request, header, D1 row, KV or URL. Today it describes exactly the 71-recipe baseline with zero batches, so
   current D1 readiness is unchanged (same fingerprint, same READY result).
3. **Growth-ready readiness** (`assessD1Readiness(baseline, hydration, release)`): manifest must describe this build's
   static baseline (`RELEASE_MANIFEST_INVALID`), zero hydration failures (`CATALOG_DIAGNOSTICS`), count == manifest
   (`COUNT_DRIFT`), ordered IDs == manifest (`ID_DRIFT` / `ORDER_DRIFT`), the legacy prefix byte-equal to `ALL_RECIPES`
   (`LEGACY_BASELINE_DRIFT`, protects the rollback baseline even inside an expanded release), and the full release
   fingerprint (`FINGERPRINT_DRIFT`). Unmanifested D1 growth is never READY.
4. **Import batches are immutable and reviewed.** Each batch carries `schemaVersion`, `batchId`, provenance
   (`sourceType ∈ curated|imported|ai_generated`, `sourceNamespace`, non-empty `sourceReference`, optional `license` /
   `usageNote`), and records with stable `sourceRecordId`, explicit `batchOrder` (0..N-1; physical row order is never
   authority), reviewer-supplied romanized `slug`, `verificationState` and optional `duplicateReview`. Only `reviewed`
   records are publishable. `batchHash = SHA-256(canonicalBatchProjection)` — one function for compile, verify, release
   composition and CLI — commits to schema version, batch identity, full source provenance (license, usage note) and, per
   recipe, batch order, source key, runtime content, provenance, classifications, nutrition evidence and the duplicate-review
   decision; it ignores row order, whitespace, key order, paths, timestamps and diagnostics. Any reviewed-meaning change ⇒
   new `batchHash` ⇒ new `releaseId`; a mutated approved batch fails composition (`BATCH_COLLISION`). The runtime
   fingerprint commits only to runtime recipe semantics, so provenance-only changes alter `releaseId` but not
   `expectedRuntimeFingerprint`. `ApprovedImportBatch` stays compact because the hash commits to everything and the batch's
   `normalized-recipes.json` artifact preserves it for audit.
5. **Deterministic identity:** `imp-` + 16 hex of SHA-256(`sourceNamespace:sourceRecordId`); compatible with the T14C
   media identity rule and outside the `vn-*`/`gl-*` namespaces. Any collision (ID, slug, source, content fingerprint,
   legacy, within batch, across batches) fails closed; IDs are never renumbered.
6. **Ingredient Truth boundary:** exact canonical-ID or exact normalized name/alias match against `CANONICAL_INGREDIENTS`
   only. No substring matching, no invented IDs, no automatic merge of look-alikes; ambiguity and misses are reported
   (bounded candidates) and make the record non-publishable. Units are the closed `StandardUnitSchema`; cuisine/region are
   the closed runtime vocabularies; category stays typed-open; `imageUrl` must be an audited same-origin path (default
   placeholder), never an external URL. **Nutrition is evidence-only and the evidence is never dropped:** macros require an
   `evidence` reference (+ optional ADR-004 `sourceType`, default `imported`); the evidence travels on
   `NormalizedImportRecipe.nutritionEvidence`, in `normalized-recipes.json`, in the batch hash, and is persisted by the
   generated SQL as a per-serving `nutrition_profiles` row (`<recipe-id>_nutrition_v1`, `source_reference` = evidence)
   linked via `recipe_nutrition` at version 1 — reusing the existing ADR-004/ADR-009 model, not a parallel one. The macros
   also fill `recipe_runtime_fields.legacy_*` for the runtime contract. A compiler guard (`NUTRITION_EVIDENCE_LOST`) and a
   renderer invariant make "macros without evidence" impossible in publishable output.
7. **The compiler emits artifacts, never migrations.** Output goes only beneath `.artifacts/recipe-import/` (segment-aware
   containment + symlink defense). `migration.sql` is plain `INSERT` (no `ON CONFLICT DO UPDATE`), data-only, with
   `runtime_order = releaseBaseCount + batchOrder`, explicit ingredient positions, classifications and truthful PENDING
   hero media slots (prerequisite 0035). Promotion into `0036+` and into the committed manifest is a human-reviewed T14F step.
8. **Duplicate detection is bucketed** (hash maps keyed by source, ID, slug, content fingerprint, normalized title per
   cuisine, ingredient signature): O(N + M), never N×M. Semantic candidates require an explicit
   `duplicateReview { decision: "distinct", reason }`; hard duplicates cannot be waived.

9. **Telemetry:** `D1RecipeAuthority.load()` reports a release-manifest load/parse failure as
   `status=error, code=RELEASE_MANIFEST_INVALID` — never as `D1_READ_FAILED`, which is reserved for the content read.

**Consequences:** T14F can grow D1 by promoting reviewed batches and regenerating the manifest without touching
`ALL_RECIPES`, the D1 reader (still 5 statements), the hydrator or the authority router. Readiness reason codes gain
`RELEASE_MANIFEST_INVALID` and `LEGACY_BASELINE_DRIFT` (a field change inside a legacy recipe is now reported as the latter
instead of `FINGERPRINT_DRIFT`). Generated SQL for 5,000 synthetic recipes is ≈7.9 MB, so T14F must plan deterministic
chunking across consecutive migrations with the manifest certifying only the complete release. Cuisine expansion beyond the
six runtime values is an explicit T14F taxonomy decision, not an import-time coercion.

## ADR-026 — Recipe Catalog Authority Routing, Verified D1 Authority, Deterministic Canary and Config-only Rollback (T14D)

**Status:** Accepted 2026-09-16 (architecture merged for review; production remains `static`; no deployment)

**Context:** After T14B-B the D1 recipe catalog is proven parity-equivalent to `ALL_RECIPES` (71 recipes, semantic
`runtime_order`, ingredient ordinals) but only as a shadow oracle; every runtime consumer (`/recipes`, detail,
recommendations, cooking, Week planner/swap, shopping attribution) imported `ALL_RECIPES` directly and the planner had a
hidden `= ALL_RECIPES` default. A future cutover therefore had no single switch, no readiness gate, no canary and no
observable fallback. T14C's production rollout (0035) is still pending and must not be a prerequisite for designing this.

**Decision:**
1. **One authority snapshot per operation.** `RecipeAuthoritySnapshot` (`packages/recipes/src/recipe-authority.ts`:
   `source`, `fingerprint`, `loadedAt`, `size`, `list()`, `findById()`, `findByIdOrSlug()`, id/slug indexes) is resolved
   once per request by `resolveRecipeAuthority(env, { tenantKey })` (`src/worker/services/recipe-authority.ts`) and
   passed to every recipe read in that operation. No route or domain function reads `ALL_RECIPES` directly any more;
   `generateWeeklyMealPlan`/`getSwapAlternatives` require the caller's recipe list. A static guard test keeps
   *unknown runtime readers = 0* (allowlist: static definitions, seed/migration renderers, shadow oracle, browser
   offline fallbacks).
2. **Static remains the rollback oracle and production default.** `StaticRecipeAuthority` serves `ALL_RECIPES` in exact
   order; `RECIPE_CATALOG_MODE` unset/`static` never touches D1 for content. Rollback from any mode is
   `RECIPE_CATALOG_MODE=static` — read routing only, no migration, no data change, no revert.
3. **D1 becomes a selectable authority only when verified.** `D1RecipeAuthority` reuses the T14B-B reader
   (`readRecipeContent`, one five-statement batch) and hydrator (`hydrateRuntimeRecipes`); a snapshot is produced only
   when `assessD1Readiness` passes: zero hydration diagnostics, same count, same IDs, same order, same fields ⇒ same
   fingerprint. Reason codes: `CATALOG_DIAGNOSTICS | COUNT_DRIFT | ID_DRIFT | ORDER_DRIFT | FINGERPRINT_DRIFT |
   D1_READ_FAILED`. T14D is a cutover of authority, not of content: `D1 == ALL_RECIPES` is the contract until a later
   explicit divergence policy (T14E).
4. **Parity fingerprint.** `fingerprintRecipes` = SHA-256 over the canonical, key-sorted projection of the ordered
   `RuntimeRecipe` contract (`RUNTIME_RECIPE_FIELDS`, incl. the legacy `imageUrl` string); stray keys are rejected, and
   `recipe_media`/R2/timestamps are never included — media (ADR-025) is independent and never influences authority.
5. **Modes are a closed set with a fence.** `static | shadow | canary | d1`; typos are `INVALID_MODE`, never coerced.
   `canary`/`d1` require `RECIPE_CATALOG_CUTOVER_ENABLED=true`; `shadow` (T14B-B compare, unchanged) does not.
   Production validation makes invalid/unfenced configuration fatal (`CONFIG_RECIPE_CATALOG_MODE`) and fenced D1
   authority a visible warning (`CONFIG_RECIPE_CATALOG_D1_AUTHORITY`); at request time invalid config serves static with
   an error-level `recipe_catalog_config_invalid` event rather than a 500. Mode is never user-controlled.
6. **Deterministic canary.** `bucket = FNV-1a32("recipe-catalog-canary:" + householdId) % 10000 < percent × 100`
   (`RECIPE_CATALOG_D1_CANARY_PERCENT`, integer 0..100, default 0). Stable per household, monotonic in percent, no
   randomness, no server-side assignment state; diagnostics record the decision, not the id.
7. **Bounded cache and explicit failure policy.** One verified D1 snapshot per isolate, 30 s TTL, singleflight refresh,
   ≤5 min stale grace when a refresh fails (`recipe_catalog_d1_stale_served`). Canary: any non-verified state ⇒ static +
   `recipe_catalog_canary_fallback` (warn). Full d1: emergency static fallback + `recipe_catalog_d1_fallback` (error) —
   availability over purity, never silent. `selectedSource`/`actualSource` always tell the truth.
8. **No migration, no writes, no admin API.** Authority selection is deployment configuration; `recipes*` tables are
   read-only at runtime; `wrangler.jsonc` is unchanged (production stays static until a separate OPS rollout).

**Rationale:** a single typed boundary turns cutover into a config rollout and rollback into a config revert; the
readiness gate makes "D1 is authoritative" mean "D1 is provably the same catalog" rather than "rows exist"; a
deterministic tenant canary gives a real user-visible experiment with a per-household stable experience and a safe
fallback; explicit `actualSource` observability prevents a silent static-while-claiming-D1 state.

**Consequences:** production behaviour is byte-identical today (static). The OPS sequence becomes: apply 0035 →
deploy (static) → `shadow` → fenced `canary` at a small percent → widen → `d1`, each step human-controlled and
reversible by `RECIPE_CATALOG_MODE=static`. Intentional catalog growth beyond `ALL_RECIPES` (T14E) will need a new
readiness policy because the current gate requires exact parity.

## ADR-025 — Recipe Media Authority, Immutable Versioning and R2 Serving (T14C)

**Status:** Accepted 2026-09-16 (T14C media layer infrastructure; no recipe-authority change, no production rollout)

**Context:** After T14B-B, `recipes.image_url` and `Recipe.imageUrl` are `LEGACY_MEDIA_COMPATIBILITY_ONLY`:
59 Vietnamese recipes point at `images.unsplash.com` (blocked by the production CSP `img-src`, only 45
unique references for 71 recipes, 20 duplicates), 12 global recipes point at `/frigo/recipes/global/*`
(one target, `carbonara.webp`, does not exist; several share a file). `scripts/generate-recipe-images.ts`
is a 59-entry Vietnamese prompt manifest with no global coverage and nothing generated. The R2
`IMAGES` binding (`frigo-images` / `frigo-images-staging`) exists but serves only private scan images
under `users/<userId>/scans/…`.

**Decision:**
1. **Media metadata in D1, bytes in R2, never bytes in D1.** Migration `0035_recipe_media_layer.sql`
   (rendered by the pure `renderRecipeMediaLayerSql`, checked by `pnpm recipe:seed:check`) creates
   `recipe_media(id, recipe_id → recipes ON DELETE CASCADE, role, version, status, source_type,
   storage_key, mime_type, width, height, content_length, content_hash, source_reference,
   generator_provider, generator_model, prompt_hash, created_at, updated_at)`. Roles are the closed
   set `hero | thumbnail`; statuses `pending | ready | rejected | superseded`; provenance
   `legacy_static | legacy_external | generated | uploaded | derived | NULL`.
2. **`ready` means "the canonical R2 object is serveable"** — never "a prompt/filename/legacy URL
   exists". SQL enforces: `version >= 1`; `UNIQUE(recipe_id, role, version)`; a partial unique index
   `idx_recipe_media_current_ready (recipe_id, role) WHERE status='ready'` so two current-ready versions
   are impossible; a ready row must carry `storage_key`, allow-listed `mime_type` (`image/webp|avif|jpeg|png`),
   `width/height > 0`, `content_length >= 0` and a 64-hex SHA-256 `content_hash`. The seed writes 71
   truthful `pending` hero slots with no source.
   **Verified promotion (independent-review remediation, 2026-09-16):** `status='ready'` is set only by
   `promoteRecipeMediaVersion(db, images, …)`, which first verifies the actual R2 object at the D1-derived
   key — it exists, `httpMetadata.contentType` equals `mime_type` (absent MIME fails), `size` equals
   `content_length`, and the SHA-256 of the real bytes (one bounded `arrayBuffer()` read, ≤ 16 MiB)
   equals `content_hash`. Typed failures (`OBJECT_MISSING`, `OBJECT_MIME_MISMATCH`, `OBJECT_SIZE_MISMATCH`,
   `OBJECT_HASH_MISMATCH`, `OBJECT_TOO_LARGE`, `OBJECT_READ_FAILED`, `METADATA_INCOMPLETE`) leave the target
   pending and the current ready row untouched. The verification proof is module-private; there is no
   `markReady` bypass. Hashing happens once at promotion, never per public GET.
3. **Deterministic, validated storage keys:** `recipes/<recipe-id>/<role>/v<version>.<ext>` via
   `buildRecipeMediaStorageKey`. SQL enforces the **exact** same derivation
   (`storage_key = 'recipes/' || recipe_id || '/' || role || '/v' || version || CASE mime_type … END`), plus
   rejection of `..`, `\`, leading `/`, `?`, `#`; a key such as `recipes/gl-01/hero/v2.foo.webp` is invalid in
   SQL and in the application alike (`isTrustedRecipeMediaStorageKey`), so no SQL-valid/app-invalid state exists.
4. **Immutable versions.** `trg_recipe_media_ready_immutable_update` forbids changing byte-identity
   columns of a ready row; replacement is a new version (`stageRecipeMediaVersion` →
   `promoteRecipeMediaVersion`, which verifies the object and then supersedes the old ready row and readies
   the new one in one D1 batch whose two statements share the verified-target predicate). Ready storage keys
   must never be overwritten with different bytes in R2: new bytes ⇒ new version ⇒ new key. Versioned URLs
   therefore carry `Cache-Control: public, max-age=31536000, immutable` and `ETag: "<content_hash>"`, which is
   trustworthy because the hash was verified against actual bytes at promotion; unversioned/legacy URLs never
   get immutable semantics.
5. **Same-origin serving only:** `GET|HEAD /api/v1/recipe-media/:recipeId/:role/:version` (public
   read-only, mounted beside `/health`) validates each segment against closed shapes, refuses encoded
   traversal in the raw path, reads trusted metadata from D1, requires `ready` + complete metadata,
   fetches the D1-derived key from `IMAGES`, and rejects object MIME/size disagreement (415/409). No
   request input is ever passed to `IMAGES.get`; there is no generic proxy, no bucket listing, no
   public write route, and no CSP change (`public/_headers` unchanged).
6. **Media is presentation, not content authority.** `RecipeMediaResolver` (`resolveRecipeMedia`) is
   pure with fixed precedence: current ready canonical R2 → audited same-origin legacy static →
   legacy external `imageUrl` → missing. `GET /recipes`, `/recipes/:id` and `/recommendations` attach an
   additive `media.hero {url, source, version, width, height}` **after** `ALL_RECIPES` filtering and
   `rankRecipes` ranking, in one bounded bulk D1 read (`IN (...)` chunks of 90, batched — never N+1).
   `Recipe.imageUrl` is kept. A D1 media failure degrades to legacy presentation with one bounded
   diagnostic; it never changes recipe ids/order/scores or returns 500. Planner, swap, cooking, Week
   snapshots (`IMMUTABLE_PAYLOAD_AUTHORITATIVE`) and Inventory Truth are untouched.
7. **Frontend has one fallback point,** `src/web/lib/recipe-media.ts` (`resolveRecipeImage` +
   `recipeImageErrorHandler`): canonical hero → legacy `imageUrl` → placeholder, applied to every
   recipe image surface; private scan images (`private-image.ts`) remain a separate trust domain.
8. **Generate/import once, serve many.** Population (generation/import, validation, hashing, upload,
   promotion) is a separate offline/admin workflow; nothing generates or fetches media during user
   requests. The prompt manifest stays a pure typed module and is validated against canonical IDs.

**Rationale:** D1 keeps per-version truth queryable and indexable at 5,000+ recipes (`(recipe_id,
role, status)`, partial ready index, `content_hash` for dedupe) while R2 holds bytes cheaply;
same-origin serving fixes the CSP problem without broadening `img-src` to third parties; deterministic
keys plus trust checks make the route incapable of acting as a bucket browser; immutable versions make
aggressive caching safe; keeping `imageUrl` and a fail-safe resolver means the layer can ship before a
single image is populated.

**Consequences:** Production rollout is `0034 → backup → 0035 → deploy → populate separately`; until
population, every recipe still renders its legacy image (12 static, 59 external — the external ones
remain CSP-blocked exactly as today). `PRAGMA integrity_check` cannot run on hosted D1 (SQLITE_AUTH);
`quick_check` + FK check + the extended schema gate stand in. T14D (authority cutover) and T14E (bulk
import) remain unstarted; 0034 is now pinned in `tests/fixtures/migration-sha256.json`.

## ADR-024 — Typed runtime fields, fail-closed D1 hydration and static-default shadow mode (T14B-B)

**Status:** Accepted 2026-09-16 (T14B-B parity/shadow foundation; no authority change)

**Context:** T14B-A proved D1 held 59 complete recipes while runtime served 71, and that the
foundation `RecipeDefinition` omits `category`, `region`, `imageUrl`, `nutrition`, `steps`,
`tags`. 0006 smuggled category/region into `recipes.tags` as `cat:`/`region:` markers.

**Decision:**
1. Migration `0034_global_recipe_catalog_parity.sql` (rendered by the pure
   `renderGlobalRecipeParitySql`, checked by `pnpm recipe:seed:check`) seeds exactly the 12
   static-only global recipes under their stable static IDs/slugs with `ON CONFLICT DO UPDATE`
   so an existing cooking/shopping FK anchor is upgraded in place, never duplicated or
   re-identified. Provenance stays at the schema defaults `legacy/unverified/1`.
2. `recipe_runtime_fields` is the typed, queryable, indexed home for runtime-only fields:
   `category` (typed **open** field: any non-empty string, CHECK `length(trim(category)) > 0`),
   `region` (**closed** vocabulary: CHECK `IN ('bac','trung','nam','toan_quoc')`), the canonical
   `runtime_order` (0-based position in `ALL_RECIPES`, UNIQUE, NOT NULL) and `legacy_*` nutrition
   macros. The macros are a **legacy compatibility projection**, not `nutrition_profiles` evidence
   (ADR-004/ADR-009 remain the authoritative model). `recipes.image_url` stays
   `LEGACY_MEDIA_COMPATIBILITY_ONLY` (media authority deferred to T14C). Category/region are never
   hidden in JSON or in `recipe_classifications`.
3. Catalog order is **behaviourally significant** (`rankRecipes` ties, the weekly planner's stable
   score sort and `getSwapAlternatives`' first-five candidate subset all resolve by input order),
   so it is persisted, not inferred: `StaticRuntimeRecipeCatalog` preserves `ALL_RECIPES` source
   order verbatim (never sorts), and `D1RuntimeRecipeCatalog` emits recipes by persisted
   `runtime_order` — it never reorders itself by consulting the static list. Ingredient order uses
   an explicit ordinal representation, `recipe_runtime_ingredient_order(recipe_ingredient_id PK,
   recipe_id, position)` with `UNIQUE(recipe_id, position)`, 0-based; lexical row IDs
   (`_ing_1, _ing_10, _ing_2…`) are never an ordering source.
4. `hydrateRuntimeRecipes` reconstructs `RuntimeRecipe` from one five-statement read-only batch
   and fails closed per row (FK stub, foundation-invalid, missing steps/media/fields, marker
   conflict, unknown region/cuisine, duplicate IDs/step numbers, missing/invalid/duplicate
   `runtime_order`, missing/invalid/duplicate ingredient `position`); it never defaults or
   fabricates. `StaticRuntimeRecipeCatalog` and `D1RuntimeRecipeCatalog` share one interface.
5. `RECIPE_CATALOG_MODE` is `static` (default) or `shadow`; there is no `d1` value. Shadow runs
   an off-response D1 comparison at most once per isolate per
   `RECIPE_CATALOG_SHADOW_INTERVAL_MS` (default 60 s, clamped 1 s–24 h) and emits one PII-free
   diagnostic. Healthy requires `staticOnly = d1Only = drift = orderDrift = hydrationFailures = 0`;
   any non-zero count (including order drift) logs at `warn`. D1 failure is a recorded
   `shadow_error`. Production configuration rejects any non-static value.
6. Historical Week slot snapshots (full recipe payloads) remain authoritative for historical
   plans; D1 never re-interprets them (`SNAPSHOT_POLICY=IMMUTABLE_PAYLOAD_AUTHORITATIVE`).

**Rationale:** Parity must be measurable before any cutover. Typed columns keep category/region
queryable at 5,000+ recipes without a second taxonomy; the compatibility nutrition table avoids
inventing provenance; fail-closed hydration prevents invalid persisted state from looking like a
recipe; a static-only production mode keeps user-visible behaviour byte-identical.

**Consequences:** Drift report reaches 71/71 with `nutrition.representation=legacy_compatibility`,
classification `typed_runtime_field` and `orderDriftCount = 0`. Recommendation, planner
(generate/regenerate/swap, including tie-sensitive and >5-alternative swap fixtures) and cooking
paths are proved equivalent on the **actual** `D1RuntimeRecipeCatalog.listRuntimeRecipes()`
output — with no test-side reordering — but stay wired to `ALL_RECIPES` (static remains the
production authority). Offline
reads remain bundle-resident; a cutover (T14D) must provide an offline source. Cuisine taxonomy
stays deferred (`LONG_TAIL_CUISINE_TAXONOMY_DEFERRED`) before T14E.

## ADR-023 — Runtime recipe contract, catalog completeness and immutable seeds (T14B-A)

**Status:** Accepted 2026-09-15 (T14B-A safety foundation; no runtime change).
Imported unchanged from source PR #8's ADR-022, renumbered during canonical
reconciliation because PR #9 already owns ADR-022 for Auth/OCR. That production
decision is preserved; this is a numbering change, not a design change.

**Decision:**
1. The foundation `RecipeDefinition` is NOT by itself the production runtime recipe
   DTO. The complete runtime shape is formalized as `RuntimeRecipe`
   (`packages/recipes/src/runtime-recipe.ts`), structurally identical to the legacy
   `Recipe`; `RUNTIME_ONLY_FIELDS` (`category`, `region`, `imageUrl`, `nutrition`,
   `steps`, `tags`) names exactly what the foundation contract omits.
2. Any future D1-backed reader must reproduce `RuntimeRecipe` losslessly for every
   current recipe; lossy adaptation is allowed only into the foundation catalog for
   validation/planning.
3. A D1 `recipes` row is not automatically a catalog entry. `classifyCatalogEntry`
   yields `complete` / `incomplete` (with `fkStub`) / `rejected`; the 7-column
   cooking/shopping FK anchor shape is always `incomplete`+`fkStub` and is excluded
   from catalog reads and never auto-repaired.
4. Runtime recipe authority remains static `ALL_RECIPES` throughout T14B-A/B; D1 is
   shadow data audited by `auditCatalogDrift`.
5. Applied migrations are immutable. Normal tests (`pnpm test`, `pnpm check`) may
   never write tracked source or `migrations/`; seed regeneration is an explicit,
   maintenance-only command that refuses to write inside `migrations/`.
6. Recipe media is a separate concern deferred to T14C; `image_url` is not a
   completeness criterion and the runtime contract keeps `imageUrl: string`.

**Rationale:** T14A proved the static catalog is production truth, the foundation
model drops runtime-visible fields, FK stubs already exist in D1, and a test rewrote
an applied migration. Making these boundaries explicit and test-enforced first makes
the later data-parity migration (T14B-B) deterministic and reversible.

**Consequences:** No route, planner, cooking, inventory, AI or CSP behavior changes.
Current drift stays truthfully visible (12 global recipes static-only, nutrition
unrepresented in D1). Contract widening fails `RuntimeRecipeSchema.strict()` tests.

## ADR-020 — Recoverable OCR provider selection and quality-gated queue failures

**Status:** Accepted 2026-09-12 for the OCR production-recovery candidate; this
record is not a production deployment receipt.

**Context:** The deployed application lineage is anchored to `d1b06732`, while
the current recovery worktree must handle provider model retirement, malformed or
placeholder vision output, and queue retries that cannot repair a permanent
configuration or data-quality failure. OCR remains an untrusted draft source and
must not become an authority for inventory quantities, prices or safety claims.

**Decision:** The recovery candidate keeps `AIRouter` as the single provider
boundary and makes Qwen `qwen3.7-flash` the first provider for vision, receipt
OCR, chat and ranking through the DashScope international OpenAI-compatible
endpoint (`QWEN_BASE_URL`, `QWEN_MODEL`). Structured requests disable thinking
to bound OCR latency. Groq remains a legacy compatible fallback only when
`GROQ_FALLBACK_ENABLED=true`; native Cloudflare vision is added only when
`CLOUDFLARE_VISION_FALLBACK=true`. DeepSeek remains the optional text/ranking
fallback only when `DEEPSEEK_FALLBACK_ENABLED=true`, and Z.ai/GLM the optional
vision/text extension path only when `GLM_FALLBACK_ENABLED=true`. The deployed
SHA is not changed by this record. Production mock fallback remains disabled.

Every fridge or receipt result is parsed through the existing Zod contracts and a
quality gate that removes generic/placeholder labels and confidence below `0.6`;
an empty usable set returns `AI_SCAN_NO_USABLE_ITEMS`. Providers expose typed
errors with retry intent. `MODEL_NOT_FOUND`, `AUTHENTICATION_FAILED`,
`PERMISSION_DENIED`, `LICENSE_REQUIRED`, `SCHEMA_VALIDATION`, `INVALID_RESPONSE`
and `AI_SCAN_NO_USABLE_ITEMS` are permanent. `REQUEST_TIMEOUT`, `NETWORK_ERROR`,
`RATE_LIMITED` and `UPSTREAM_ERROR` may retry within the existing queue attempt
limit and dead-letter flow. Public scan responses expose bounded, actionable
failure codes without provider credentials or raw image data.

**Consequences:** This is a code/config recovery with one additive D1 migration
(`0023_scan_request_fingerprint.sql`) and no data backfill, inventory/auth/Week/
PayOS change or automatic production deployment. The migration must be applied
and schema-gated before deploying code that reads the new scan identity columns.
The existing queue lease, idempotency, tenant fencing and rollback rules remain
authoritative. Candidate model access, provider licensing, exact-SHA CI, canary
health and readiness must be verified before release. OCR output still requires
human review/confirmation and does not create trusted retail offers.

The initial 20-25 second timeout was insufficient for full-page receipt OCR: a
production-sized Vietnamese receipt took about 51 seconds in a non-PII Qwen
smoke. The candidate therefore uses a 60 second Qwen request timeout and a 75
second Worker/queue guard, while retaining the existing 10 minute queue lease.

**Alternatives considered:** Retrying every provider error, silently falling back
to mock fixtures in production, or treating any syntactically valid OCR line as
usable. Rejected because retries cannot fix permanent provider/configuration
failures and fabricated or low-quality rows could enter a household draft.

## ADR-019 — T07 planner-wide best-effort account compute budget

**Status:** Accepted 2026-09-09 after authenticated fan-out reproduction.

**Decision:** Add one planner-only `planner-compute:<authenticated-user>` bucket
at 10 requests per 60 seconds for generation, regeneration, swaps, shopping and
on-demand explanations, alongside existing per-path controls. Keep read/feedback,
auth and payment policies unchanged. Reuse the installed limiter rather than
introducing a quota/reservation platform.

**Evidence and consequences:** Alternating two plan IDs previously admitted an
eleventh compute request; regressions now reject it before T04. KV read/put remains
non-atomic and eventually consistent, with same-key write throttling and explicit
isolate-local fallback. Neither fail-closed nor the account key promises an exact
global quota. Keep hard per-request search bounds and staged rollout; require a
separate recovery-safe atomic design only if measured abuse demands it. Exact
tests, guarantees and Cloudflare references are in `T07_H2_ABUSE.md`.

## ADR-018 — T06B opt-in presentation and minimal plan discovery

**Status:** Accepted 2026-09-09 for the authorized T06B task.

**Decision:** Reuse React Router, TanStack Query, owner-fenced cookie transport,
existing cards/buttons/dialogs and Frigo colors. `VITE_MEAL_PLANNER_ENABLED=true`
enables `/planner`; the independent server flag remains authoritative. Legacy Week
is retained. The browser sends scheduling/action intent, never engine contexts,
shortages or prices. Queries are owner-scoped, mutations are explicitly triggered,
revision-fenced and not retried automatically. Swap/regenerate replace the entire
plan response and discard previous shopping results. Past plans remain historical;
creating a new future plan is explicit rather than silently editing past meals.

T06A lacks cross-device discovery and a named swap-choice source. Add only a
creator/household-scoped current-plan lookup and a bounded read-only recipe-title/ID
catalog projection. Choices are not eligibility claims: the unchanged swap service
checks restrictions and replans. No new persistence or engine algorithm is needed.

Optional on-demand AI may reorder/select only server-grounded reason IDs. It returns
no factual prose, tools or commands. Schema/subset validation, a bounded timeout,
feature disable and deterministic fallback keep structured facts separate and safe.
Frontend vi/en text templates display the same reasons without any AI dependency.
Exact money is formatted through BigInt/Intl parts; authoritative arithmetic stays
on the server. Shopping checkboxes are ephemeral reminders, not purchases.

**Consequences:** No frontend plan-content persistence or UUID entry needed for
restoration. No full history/candidate-eligibility API, private recipe authoring,
generated recipes, payment or production cutover. Preview fixtures use isolated
in-memory D1 and real test sessions; they never install a production auth bypass.
T07 owns deferred aggregate quotas and final security/performance review.

## ADR-017 — T06A trusted backend and minimal current-plan persistence

**Status:** Accepted 2026-09-09. Supersedes ADR-016's combined delivery scope;
its frontend/AI presentation portions are deferred to T06B.

**Decision:** An opt-in Hono application boundary accepts scheduling/action intent
only. Existing cookie/CSRF/tenancy/rate-limit infrastructure remains authoritative.
One D1 batch preloads catalog, household inventory, typed T03 preferences/history,
nutrition and instructions; only server composition creates opaque T02–T05 contexts.
No request/AI plan, price, shortage, substitution review or safety assertion is accepted.
Missing reviewed safety/retail sources stay missing; no legacy benchmark promotion.

Keep final generated plans private to the authorized creating member because T03
personalization is private. Legacy Week storage is incompatible and remains intact.
Add minimal current-plan/annotation tables (0022), membership composite FKs, scoped
creation retry keys and atomic optimistic revision updates. Persist versioned,
validated final DTO plus a narrow T05 input projection, never search state, opaque
handles, ranking context or reviewer evidence. This changes only T05's accepted
input projection/codec, not arithmetic or optimizer policy. Exact money and quantity
strings cross the API boundary, with known/unknown and proof metadata preserved.

Swaps establish server-validated locks and replay the entire plan from current
inventory, rather than patching one slot. If the bounded search cannot produce a
complete valid replacement, leave the current revision unchanged. Regeneration may
return valid partial/incomplete results. SHA-256 source comparisons expose practical
staleness, not reservations. Shopping is generated on demand from plan ID/revision
and refuses stale source/time; no stale shopping cache or purchase command exists.

**Consequences:** No revision-history platform or distributed command ledger. Exact
creation retries avoid repeated planning after a completed write, but simultaneous
first requests may both compute before one durable result wins. Existing rate
limits are per account/path and best-effort under KV degradation; aggregate quotas
remain T07. Cooked annotations do not fabricate actual cooked history or consume
stock. T06B consumes only `meal-planning-api.ts`, `meal-shopping-api.ts` and
`API_INTEGRATION.md`; new endpoints do not replace legacy Week, settings or cooking.
No PayOS, authentication redesign, production deployment or AI work is authorized.

## ADR-016 — Authenticated generated-plan integration and bounded AI presentation

**Status:** Accepted for T06 implementation, 2026-09-09

**Decision:** Extend the existing Hono/session/CSRF/tenant boundary and React
application through an explicit `/planner` route; legacy Week remains unchanged.
The application service loads D1 catalog, household inventory and scoped T03
preferences/history before invoking T04 and T05. Client requests express intent,
never authoritative inventory, shortages, prices, reviews or domain contexts.
Missing retail offers remain missing; legacy benchmarks/OCR are not trusted quotes.
Absent whole-dish safety reviews cannot satisfy hard safety constraints.

Persist final generated-plan revisions separately from incompatible legacy Week
rows. Plans are private to their creating member within the authorized household
because T03 personal preferences/history are private. Revision writes use optimistic
concurrency and idempotency; reads reauthorize and expose source staleness. Swap and
explicit regeneration replay sequential planning, never patch downstream stock
arithmetic. Marked-cooked annotations do not consume stock or fabricate actual
`cooked_meals` history. No inventory acceptance or legacy cutover is introduced.

Versioned allowlisted DTOs expose exact decimal quantity strings and minor-unit
money strings, preserving uncertainty and best-known versus proven conclusions.
AI is independently disabled by default and requested on demand only. It may choose
among grounded presentation templates, not generate authoritative factual prose.
Its bounded schema, provider timeout and deterministic fallback are independent of
planning. No long-tail recipe publication or private recipe authoring is introduced.

**Consequences:** An additive revision/annotation migration is justified by durable
API identities, not a second optimizer. No search frontier is persisted. Existing
rate-limit infrastructure supplies abuse control, not a globally atomic paid quota.
Full source revalidation is required before any future acceptance/cooking adapter.
The T05 option cap remains ID-order-sensitive; T07 should audit selection quality
without changing the best-known/proof distinction. No payments, deployment or
unrelated authentication/infrastructure changes are authorized.

## ADR-015 — Trusted, generated-only economic evaluation of the fixed T04 plan

**Status:** Accepted 2026-09-09 (T05)

**Decision:** T04 per-slot deficits are the sole purchase-demand authority; no second
stock deduction or hidden replanning loop. Reuse exact T02 Quantity arithmetic.
Legacy VND benchmark/package tables lack a trustworthy offer-price relationship,
so accept a validated opaque server-owned, household-scoped price/package snapshot
without a new retail persistence platform. Currency is explicit; safe-integer minor
unit inputs, BigInt monetary arithmetic and decimal-string outputs prevent rounding
and overflow. Stale/estimated/foreign/unpriced observations remain qualified unknowns.

Use bounded iterative per-ingredient package enumeration plus additive aggregation.
Cost-first is the default; an explicit dimensionless cost-premium policy may reduce
surplus without absurd spending. Hard budgets constrain those upgrades; soft targets
only diagnose. Expose best-known versus exhaustive minima, and derive infeasibility
only from proven lower bounds that account for unknown-price alternatives. Keep
T04, shopping and budget feasibility/search completeness separate.

Surplus is not certain waste. Report existing remainder and new purchase surplus
separately using only dated expiry evidence; unknown risk remains unknown. No
global optimal-waste/allocation claim. See `SHOPPING_OPTIMIZER.md` for full proof,
limits, exact money fields, trust/temporal semantics and T06 output.

**Consequences:** No schema migration, live pricing, FX, route/UI cutover, real
inventory mutation, actual purchase or payment. Existing Week/standalone shopping
stays unchanged. This task's explicit no-replanning directive supersedes the older
T05 packet's proposed feedback loop; future orchestration must explicitly invoke
T04. Trusted catalog providers must authorize/review offers; a callback wrapper
does not turn client price/product/safety claims into authority.

Entries identify the task in which they were accepted. Supersede an ADR explicitly; do not silently rewrite
the agreed architecture. Later tasks must record migration and compatibility impact.

## ADR-001 — Extend existing identities and runtime boundaries

**Status:** Accepted 2026-09-08

**Context:** D1 and static catalogs already model ingredients/recipes. Inventory
and Week have household isolation, command fencing and compatibility migrations.
Replacing these for a new greenfield planner would duplicate or break live behavior.

**Decision:** Extend existing tables/IDs additively. Keep Ingredient, Inventory Item,
Retail Product, Recipe/line, Family, Nutrition, Preferences, Plan and Shopping as
separate concepts. Keep static normalization/`ALL_RECIPES` readers and all current
routes unchanged in T01. New catalog helpers are explicit library calls, not APIs.

**Consequences:** T01 data is not automatically visible in old screens. T02 needs
an explicit audited catalog adapter and import/drift policy; no hidden dual source
switch. Household commands, Week dual-write and old DTOs stay compatible. Leaf
foundation imports avoid expanding the existing domain/recipe barrel cycle.

**Alternatives considered:** New ingredient/recipe replacement tables; wholesale
ORM migration; immediate D1 runtime cutover. Rejected as unnecessary risk/scope.

## ADR-002 — Multilingual exact alias keys, explicit ambiguity

**Status:** Accepted 2026-09-08

**Context:** Existing aliases are loose strings; runtime uses first substring
matches. SQL cannot reliably perform full Unicode normalization on historical data.

**Decision:** Preserve raw aliases, add canonicalized language and nullable
normalized key. App uses NFKC/whitespace/lowercase, preserving accents. Unique
non-NULL `(language, normalized_alias)`; look up exact locale plus `und` and fail
closed as ambiguous if more than one ingredient matches. Atomic authoring also
indexes localized/default names. Preserve old NULL keys for reviewed promotion.

**Consequences:** Locale collisions are rejected; cross-locale/und ambiguity is
represented, not resolved by insertion order. Japanese works without a special
schema; retail quantity stripping/fuzzy NLP/automatic locale fallback wait. New
SQL writers must follow application normalization. No destructive alias backfill.

**Alternatives considered:** Global unlocalized alias uniqueness, accent folding,
SQL `lower()` backfill, first-match fuzzy resolution. Rejected for false matches.

## ADR-003 — Physical dimensions versus contextual retail quantities

**Status:** Accepted 2026-09-08

**Context:** Strict conversion already exists alongside a legacy numeric fallback.
Retail packages and count units lack universal mass/density.

**Decision:** Preserve `StandardUnit` and strict helpers. Add mirrored unit reference
data/typed dimensions: mass g/kg, volume ml/l, piece count, contextual pack/bunch/
slice. Only exact physical factors are universal; contextual identity is not proof
that two differently sized packages can be pooled.

The SQL catalog constrains codes/dimensions/bases/factors to this supported set;
adding a unit requires a matching typed change and migration, not an arbitrary row.

**Consequences:** No arbitrary onion/egg/package-to-gram conversion. Product-specific
content/estimates and rounding policy belong to T05. Tests detect SQL/type drift.
No change to legacy inventory conversions or guarded cooking commands.

**Hardening clarification:** `areUnitsCompatible`/`convertUnitStrict` accept
same-unit quantity identity, not proof of physical equivalence. `pack -> pack`
and `slice -> slice` count the same defined package/slice context; `piece -> piece`
counts the same canonical item. Neither proves mass, volume, or equivalence across
different product sizes. `UNIT_DEFINITIONS.dimension` distinguishes those cases.

**Alternatives considered:** Convert all units to grams; introduce a generic
conversion graph now. Rejected as unsafe or speculative.

## ADR-004 — Explicit nutrition basis, provenance and unknown safety state

**Status:** Accepted 2026-09-08

**Context:** Runtime recipes have optional unproven macro totals; no ingredient
nutrition schema or structured allergen evidence exists.

**Decision:** Store nullable nutrient observations in independent basis-aware
profiles (kcal/g/mg), linked to ingredients or recipe versions. Distinguish
authoritative/imported/calculated/estimated with a reference. Separate ingredient
allergen/dietary assertions from unknown/reviewed state and recipe classifications.

**Consequences:** NULL is not zero; absence of tags is not safe. Existing macros
are not promoted or reinterpreted. Later code chooses trusted applicable profiles
and current recipe version; authoritative labeling alone is not verification.
No complete nutrition database, nutrient calculator or allergy guarantee in T01.
ADR-009 clarifies and enforces that only the current recipe version is stored.
Missing dietary assertions also remain unknown; no meat tag is not evidence of
vegetarian suitability. Imported/AI classifications are not an allergy authority.

**Alternatives considered:** Unqualified totals on recipes, JSON nutrition blob,
implicitly safe empty tags. Rejected for arithmetic/safety ambiguity.

## ADR-005 — Families as bounded relational slots and options

**Status:** Accepted 2026-09-08

**Context:** Structured recipe lines exist, but modeling every fried-rice variation
as a separate dish scales poorly and obscures canonical identity.

**Decision:** Families define base servings and min/max selection slots; options
carry canonical ingredient, quantity and unit. Recipes optionally reference a
family. Core recipe quantities/servings remain existing relational fields; add
provenance/version/review fields and descriptive classifications.

**Consequences:** FK/unique/check constraints plus full-object validation protect
authoring. Families require an atomic complete write; SQL alone cannot enforce
aggregate option counts. T02 owns bounded generation and coherent instructions;
options are not arbitrary safe substitutions. Current global source metadata does
not create private user recipe ownership/publication authority.

**Hardening clarification:** Finite slots do not bound computational work. T02
must enforce `MAX_VARIANT_CANDIDATES_PER_FAMILY` (initial default 64) and
`MAX_VARIANT_SEARCH_STATES_PER_FAMILY` (initial default 1024) while exploring, not
after constructing the Cartesian product. Reaching either budget must return
deterministic truncation metadata, not a false claim of exhaustive infeasibility.
These are T02 requirements, not a generator or runtime policy implemented in T01.

**Alternatives considered:** Unstructured JSON templates, EAV rule engine, storing
all variations. Rejected for weak referential integrity or premature complexity.

## ADR-006 — Lot condition evidence without inventory rewrite

**Status:** Accepted 2026-09-08

**Context:** Inventory has storage/expiry but no date kind/source or opening evidence.
Rewriting inventory commands would threaten event/revision/idempotency guarantees.

**Decision:** Add nullable opening timestamp and unknown-default expiry kind/source
to existing lots; separate sourced ingredient/storage/package-state shelf-life
guidelines. Do not backfill guesses or expose side-channel writes in T01.

Non-unknown expiry evidence requires a date in both the combined validated input
and future-write SQL triggers. Removing that date must reset its evidence atomically.

**Consequences:** Existing HTTP projections remain unchanged. A future validated
condition endpoint must share the inventory command transaction/version. Guidelines
are advisory, not lot expiry; unknown opening does not imply sealed. Timezone and
expiry-priority logic wait for T03/T04.

**Alternatives considered:** Recompute every expiry from ingredient defaults or
infer source from `data_source`. Rejected as potentially unsafe historical rewriting.

## ADR-007 — Deterministic core and repository-owned delivery protocol

**Status:** Accepted 2026-09-08

**Context:** Future agents cannot rely on this task's conversation; current AI and
planner overlap later work, but neither is a complete safe optimizer.

**Decision:** Persist specification, ADRs, current reality, task graph and fixed
handoff in `docs/ai`; root AGENTS points there. Deterministic code/DB enforce stock,
constraints, allergies, expiry and budgets. AI only proposes/explains validated
data after the deterministic core is stable. Deliver T01–T07 incrementally.

**Consequences:** All seven task packets describe explicit incremental improvements,
not a replacement platform. Update state/board/handoff after every task and report
exact checks/failures. Older security reports remain linked historical references.

**Alternatives considered:** Chat-only handoff, prompt-only/LLM planning, a single
large implementation task. Rejected for recoverability and correctness risk.

## ADR-008 — Strict canonical ingredient identity, separate from catalog IDs

**Status:** Accepted 2026-09-08 (T01 hardening)

**Context:** All 45 seeded D1 ingredient IDs, all 45 static ingredient IDs, and
385 static recipe ingredient references (43 distinct IDs) use uppercase ASCII
snake case. The general `CatalogIdSchema` and case-sensitive SQL primary key
previously allowed a separate `chicken_breast` beside `CHICKEN_BREAST`.

**Decision:** Canonical ingredient IDs must match `^[A-Z][A-Z0-9_]*$`, be at most
100 characters, and contain no surrounding whitespace or implicit coercion.
Use a dedicated `CanonicalIngredientIdSchema` for catalog authoring, alias target
IDs, storage guidelines, recipe lines and family options. Recipe/family/profile
IDs, slugs and locale keys retain their existing distinct contracts. SQL guards
reject invalid ingredient INSERTs and ID UPDATEs, including NULL and embedded NUL.

**Consequences:** Importers must explicitly map external IDs to existing canonical
identities; do not uppercase unknown IDs or derive them from translations. No
existing legitimate seed/catalog ID changes. Published/applied 0019 is immutable;
append 0020. Its preflight stops on invalid existing IDs without renaming, merging
or deleting rows. The catalog owner must review any failing data before retrying.

**Alternatives considered:** Case-insensitive uniqueness with case-flexible IDs;
automatic uppercasing/backfill. Rejected because every current legitimate ID
already follows one strict convention and coercion would hide import mistakes.

## ADR-009 — Nutrition links belong only to the current recipe version

**Status:** Accepted 2026-09-08 (T01 hardening; clarifies ADR-004)

**Context:** T01 has one row per recipe, not historical recipe-version identities.
The positive `recipe_nutrition.recipe_version` check alone allowed impossible or
stale links, despite readers being instructed to select the current version.

**Decision:** Every nutrition link must equal its parent recipe's current version.
0020 guards link INSERT/UPDATE and blocks parent version changes (including
replacement INSERTs) while dependent nutrition links remain. To revise a recipe,
explicitly unlink its nutrition, update the recipe/version, then link newly
validated profiles in one D1 batch. Failure rolls the entire batch back. Profiles
are retained; nothing is implicitly relabeled or recomputed.

**Consequences:** No historical recipe version support is implied. Preflight
rejects existing mismatches for owner review rather than dropping evidence or
guessing a version. Deleting a recipe still intentionally cascades its links;
linked profiles themselves remain protected from deletion by foreign keys.

**Alternatives considered:** Historical recipe-version tables or automatic link
version updates. Rejected as out of scope or liable to attach stale nutrition to
changed ingredients/servings.

## ADR-010 — Traceable imported and AI recipe provenance

**Status:** Accepted 2026-09-08 (T01 hardening)

**Context:** Source type and verification were independent, but imported/AI
recipes and families could omit all traceability.

**Decision:** `imported` and `ai_generated` recipes/families require a nonblank,
NUL-free source reference. Legacy/curated/user-generated references are optional
(omitted/SQL NULL); any supplied reference must also be nonblank and NUL-free.
An internal dataset-row, import-batch or generation-job ID suffices; no public URL
is required. Zod and 0020 INSERT/UPDATE guards enforce these presence rules,
including Unicode whitespace. Zod additionally bounds authoring text lengths.
Family source types still exclude `legacy`; defaults remain legacy/curated,
unverified, version 1. A reference never confers verification or publication rights.

**Consequences:** Preflight rejects opaque existing imports/AI rows without
inventing references. Catalog owners must supply authentic evidence before retrying.
Global references must not contain private user data or credentials. No import,
generation, ownership or review endpoint is implemented in T01.

**Alternatives considered:** Require public URLs or a full provenance subsystem;
infer traceability from source type. Rejected as unnecessary or unauditable.

## ADR-011 — Indexed quantity feasibility, not runtime ranking or consumption planning

**Status:** Accepted 2026-09-08 (T02)

**Decision:** Add a reusable leaf availability index and per-candidate reservation
session. Re-export unchanged strict unit semantics from a leaf module to avoid
barrel cycles. Aggregate compatible physical lots and canonical piece quantities;
contextual package labels alone never prove equivalent contents. Preserve explicit
missing/partial/unresolved/satisfied outcomes and diagnostics. Duplicate identical
lot IDs count once; conflicting/invalid related stock is quarantined as uncertainty.
Use exact decimal rational intermediate arithmetic and explicit finite Number
boundaries; arithmetic range failures are reported, never coerced to zero coverage.

Aggregate repeated compatible requirements before serving scaling, retain source
line indices and units (mixed physical units use their base). Preserve mathematical
fractional pieces with an explicit flag: existing T01 quantity contracts allow
fractions. No hidden whole-item/purchase rounding or Week portion optimizer.
Reserve direct required demand first, then approved substitutions, then optional
demand. Lot-ID order is only a reproducible feasibility witness, not FEFO, actual
stock consumption or a multi-meal simulation. Each candidate starts independently.

Caller supplies an explicit as-of date and authorized household-scoped inventory.
Past use-by is unavailable; past best-before is not automatically unsafe; elapsed
unknown/estimated dates require review and remain uncertain. Freshness rescue flags
are carried as raw witness facts, not recalculated/weighted expiry priorities.

**Consequences:** Legacy recipe scoring, static readers, cooking commands and Week
behavior stay unchanged pending their explicit integration tasks. New functions
claim quantity feasibility only, not nutrition/allergy certification. No migration,
API, UI, payment/auth or production configuration change is required.

## ADR-012 — Explicit one-hop substitutions and bounded family traversal

**Status:** Accepted 2026-09-08 (T02)

**Decision:** Substitution rules are explicit reviewed, source-referenced quantities,
scoped to a recipe/family ID and version. Every use needs per-call approval and
positive compatibility evidence for every active constraint; missing evidence
denies use. Rules express the replacement amount per original unit, including
partial replacements, never inferred food density. No contextual conversions,
transitive substitutions, preferences or learned rules. Deterministic rule-ID order
does not claim globally optimal allocation among competing substitutes.

Family traversal is lazy with the ADR-005 limits enforced during attempted partial
states, including rejected branches; callers may lower but not exceed 64 candidates
or 1024 states per family. Canonicalize slot/options and semantic aggregate demands;
contextual demands retain separate lines and slot identities because equal labels
do not prove equivalent contents. Retain selected-slot evidence and do not persist
variants. A selected optional-slot
option is required within that variant; omission is its separate zero-selection
choice. Never emit a zero-demand variant. Truncated searches do not prove no
feasible variant exists. Family instructions/cuisine/times absent in T01 stay absent.

**Consequences:** T03 can consume structured requirement facts without repeating
inventory math. D1/static catalog snapshots remain explicit internal read-only
sources; drift/alias promotion proposals require review, not automatic writes or
runtime cutover. No new persisted substitution or variant schema is needed.

## ADR-013 — Scoped deterministic ranking, not legacy runtime cutover

**Status:** Accepted 2026-09-08 (T03)

**Decision:** Consume unmodified server-generated T02 snapshots, bound to household
and explicit calendar date, before hard gates and normalized weighted utility.
Keep T02 arithmetic untouched; add only existing family/prep metadata and a private
scope/fingerprint guard rejecting serialized or mutated candidate inputs. Candidate
review keys additionally bind demands, substitutions and lot witnesses. Review
schemas validate structure, not authority; server-owned approval/review data remains
mandatory. Unknown active hard safety/time/nutrition requirements fail closed.
No safety policy requested is not a safe-food claim. See `RANKING_ENGINE.md` for
exact scores, bounds, policy configuration, dates and nutrition source limitations.

Persist ranking-specific household and member preferences/feedback because legacy
global preferences/favorites cannot enforce household scope and Week settings are
not ranking policy. Do not auto-import global/free-form intent. Personal soft
defaults replace household defaults; hard restrictions union. Household defaults
are owner-managed, personal data membership-bound. Existing `cooked_meals` remains
the only cooking history authority; no new cooking events/commands or automatic
Week skip/swap capture. Explicit latest tastes outrank weak behavioral feedback;
cooked meals affect recency only. No separate taste aggregate or learned model.

**Consequences:** Additive persistence with canonical FKs and bulk readers, no
legacy route/ranker cutover. Static-only feedback targets require explicit reviewed
D1 registration. No safety catalog is fabricated. Nutrition adapters preserve
partial serving-basis observations as unverified; hard ranges require independently
reviewed evidence. Expiry normalizes existing allocation shares, never reallocates
stock. T04 receives candidate utility/components, not future meal decisions.

## ADR-014 — Bounded sequential planning over the T02/T03 dependency

**Status:** Accepted 2026-09-08 (T04)

**Decision:** Add an explicitly invoked, pure weekly planner. Each ordered slot
regenerates T02 availability on branch-local projected inventory and invokes T03
hard eligibility/utility with trusted server-owned context. Deterministic bounded
beam search keeps alternative futures; hard constraints never become score penalties.
Expose recipe-search and planner-search incompleteness separately. A failed bounded
search is not proof of infeasibility. No production Week/API cutover or inventory
write is performed; T06 owns an authenticated shadow/canary integration.

Reuse exact Quantity arithmetic and T02 lot witnesses. An opt-in expiry-priority
allocation order supports projected consumption while preserving T02's default
ID-order behavior. Only explicit supported expiry evidence affects priority; T02
availability remains authoritative. Servings use T02 scaling without count rounding.
One offset-bearing planning instant derives its local date and each slot's instant
using the same fixed offset, with no inferred timezone or DST rules. Actual history
is frozen at the planning instant; future choices are plan-local, not cooked events.

T03 scores cover past-relative preference/expiry/time; additional plan terms cover
future repetition, ingredient continuity and period nutrition only. Period nutrition
targets explicitly concern household totals over requested meals, not invented daily
meal allocations. Unknown/unreviewed hard nutrition fails closed. Leftover scheduling
is deferred because legacy leftovers lack a trusted prepared-food expiry policy;
every selected meal cooks and consumes its requested servings, without hidden excess.

**Consequences:** Output includes selected demand/witnesses, shortages, per-lot deltas,
initial versioned stock, projected final stock and complete search metadata for T05.
It is generated state, not a reservation, shopping purchase or persisted Week plan.
No migration is needed. A future accepting writer must reauthorize membership and
recheck inventory/catalog/preference versions before invoking existing versioned,
idempotent Week/command paths. T03 remains immutable at `3592de9`; temporary use of
its branch is a tooling constraint only, and T04 is isolated in subsequent commits.

**T04 hardening clarification:** Incomplete input/candidate evaluation is not a
search-limit hit. `no_plan_found_without_proof` covers every unproven no-plan result;
sorted, source-tagged `search.incompleteReasons` explain missing proof while
`limitReasons`/`truncated` remain specific to actual computational caps. Existing
hard eligibility and exhaustive-proof scope are unchanged. Nutrition's neutral
utility baseline is not positive evidence: a support reason requires a positive
utility delta, above-neutral aggregate fit, and an above-neutral fully qualified
soft target covering the current meal. Empty future periods cannot justify it.
This corrects the generated-only result contract before T05 integration; no persisted
consumer, schema, allocation, scoring formula or search policy changes.

## ADR-020 — Browser-side image normalization for OCR payloads

**Status:** Proposed maintenance change, local-only on 2026-09-13.

**Decision:** Normalize gallery images before upload using `createImageBitmap` and
an in-memory canvas. Cap the longest side at 2,000 px, encode as JPEG at quality
0.82, and only use the derivative when it is smaller than the source. Do not
upscale small images, mutate the original file, persist image bytes, or log image
content. If bitmap/canvas APIs are unavailable or fail, retain the existing
`FileReader` path. Cancellation and private-session fencing apply across decode,
compression and read stages.

**Rationale:** The sample receipt is 1,086x1,448 PNG and approximately 2.1 MB;
JPEG quality 0.82 produces approximately 382 KB (81.9% smaller) at the same
dimensions, reducing request transfer/base64 and provider input overhead while
retaining the text-bearing pixels. This complements, but does not replace, the
server/provider timeout recovery already deployed.

**Release boundary:** No production deployment, schema, storage, auth, payment
or provider configuration change is implied. Promote only after browser/device
OCR smoke confirms item recall and latency against the attached receipt.

## ADR-021 — Task-based Qwen runtime and production model governance

**Status:** Accepted 2026-09-13 (architecture maintenance branch)

**Decision:** Add a single task-based runtime behind `AIRouter`. Feature and
domain code submit a semantic task and compact input; the runtime resolves a
logical Qwen role, applies per-task prompts and token ceilings, validates
structured output, performs at most one repair and one policy-approved
escalation, and emits non-PII usage/cost telemetry. Production composition sets
`AI_QWEN_ONLY=true`, so legacy Groq, DeepSeek, GLM and native Cloudflare adapters
are not constructed. Physical model IDs are configurable only through Worker
role aliases (`AI_MODEL_*`). Reasoning and judge roles are explicit opt-ins and
remain off for customer traffic by default.

**Rationale:** A centralized policy prevents accidental expensive-model use,
unbounded retries, provider drift and model names leaking into application
services. Qwen remains the only production inference family while preserving
legacy adapters for test/migration compatibility when Qwen-only mode is not
requested.

**Consequences:** OCR and fridge vision still return untrusted candidates. The
quality gate, deterministic normalization, inventory fencing and reconciliation
remain authoritative. Estimated pricing is operational telemetry, not billing
truth. The rolling `qwen3.7-flash` alias is canary-only; promotion requires an
offline golden-dataset comparison and an explicit configuration review. This
branch changes no canonical `main` code and performs no deployment.

## ADR-022 — Credential-bound Google sign-in and honest OCR pending UX

**Status:** Accepted 2026-09-16 for the auth/OCR production hardening branch.

**Decision:** Production Google sign-in may enter `/auth/google` only through
Google Identity Services and a signed ID-token credential. Remove any client
fallback that fabricates `userInfo` or calls the endpoint without a credential.
The web client waits for the asynchronously loaded GIS SDK, renders the official
button once, and exposes a retry/unavailable state without pretending that an
email or synthetic profile is a Google login.

Scan and receipt review screens expose a shared, accessible pending state with
explicit queue/AI/validation stages, elapsed time and bounded polling context.
The UI never presents a pending scan as ready and never writes inventory before
the server reports a terminal review state.

**Rationale:** The production screenshot's HTTP 400 was caused by the old
credential-less Google fallback, while GIS initialization also had a script-load
race. Async OCR is expected in production; a visible staged state prevents a
user from interpreting queue latency as an app freeze without weakening the
existing Qwen, evidence, ownership or confirmation contracts.

**Release boundary:** This is frontend/auth presentation hardening only. Google
token verification, sessions, CSRF, Turnstile, queue processing, migrations,
PayOS and production resources remain unchanged. Promote only after exact-head
review and browser auth/OCR smoke; no deployment is implied by this branch.

## ADR-028 — Honest OTP delivery, unified OAuth configuration, and durable onboarding

**Status:** Accepted 2026-09-19 for T16 development; production rollout requires
separate operator authorization.

**Decision:** Treat provider acceptance as part of issuing a usable production
OTP. Use Cloudflare Email Service's structured message API as primary delivery
and Resend as fallback. Reduce provider failures to stable non-sensitive
categories; never log recipients, subjects, message bodies, OTPs, provider
response bodies, or exception text. If no provider accepts a registration or
resend message in production, invalidate the newly issued challenge and return
an honest machine-readable failure instead of claiming delivery. Development may
surface `devOtp`, but production may not.

Extend ADR-022 by using one runtime `GOOGLE_CLIENT_ID` for both GIS initialization
and backend audience validation. The public `/config` endpoint may expose the
client ID because it identifies the OAuth application and is not a secret.
Production Google auth remains signed-ID-token-only; missing configuration or a
blocked GIS SDK produces an explicit unavailable/retry state, never synthetic
user information or a credential-less request.

Persist onboarding completion on the profile and return it from authoritative
session/auth responses. Local storage is only a same-device cache. The funnel is
landing → guest or account; new sessions complete preference onboarding once;
returning completed accounts enter the app. Preference persistence and marking
completion occur in one D1 batch. Guest-to-account inventory transfer remains
deferred and retains its existing retry fence.

**Consequences:** Migration 0038 is additive. Existing opaque HttpOnly Secure
cookies, CSRF origin checks, Turnstile, household isolation, private-session
fencing, Inventory Truth, Week compatibility, and PayOS boundaries are unchanged.
Email Service binding presence is not delivery evidence: release still requires
sender-domain onboarding and a real recipient smoke test. Google release still
requires the exact production origin in the OAuth client's authorized JavaScript
origins. No production deployment is implied by this ADR.

## ADR-029 — One server-authoritative Plus payment contract

**Status:** Accepted for explicitly authorized T18B development, 2026-09-21.
No deployment or real transaction is authorized.

**Decision:** Preserve the existing operational prices (monthly 49000, annual
499000, VND) in one Worker table. Authenticated read-only plan metadata and
strict plan-identity intent creation consume that table. No client price,
discount, destination bank, reference, success redirect or local entitlement
cache is payment authority. Extra legacy request fields cannot override prices.

The Worker creates a PayOS link using server-generated order/expiry and verifies
the provider's signed response before returning instructions. PayOS can augment
the transfer description; the verified returned description, bank fields and
amount drive the server-built VietQR URL and UI together. They are bound to the
server order by the response HMAC and explicit order/amount/currency checks,
not by assuming request and response descriptions are identical.

Only signed callback data may transition an owned stored intent. A D1 batch
conditionally upserts entitlement while the intent is pending, then consumes
the intent. Replays cannot extend a subscription; separate paid orders retain
separate purchase value. Existing 31/366-day durations are unchanged. A shared
provider transaction reference cannot pay two orders. Provider-creation errors
mark the intent failed; late callbacks cannot grant it and require operator
reconciliation/refund outside this task. Never retry such a grant automatically.

**Compatibility:** No migration; existing payment rows and endpoints remain.
The obsolete `/auth/plus/activate` is read-only/non-granting for old clients and
rejects `grantCode` (410). Old shared-secret integrations must stop: retaining
their orderless grants would bypass the new authority. Checkout uses the new
owned status endpoint and fresh `/me` instead. Billing now uses the existing
expected-owner HTTP headers; other authentication behavior is unchanged.

**Consequences:** Provider configuration remains server-only and fail-closed.
Metadata is not a price lock; the returned intent is the final payable offer.
That persisted offer remains authoritative after catalog changes: issued-order
reads, callback reconciliation, replay handling and entitlement grants validate
its structure and lifecycle, never equality with today's price table. The table
controls new offers only; signed callbacks must match the stored amount.
Refreshing or closing a modal does not cancel a provider order and never grants
Plus. New explicit checkout attempts create independent intents; single-flight
browser requests prevent double-click duplication. No cancel/refund automation
or claim of live-provider certification is introduced. Operators must separately
verify PayOS configuration/webhook delivery and approve deployment.
