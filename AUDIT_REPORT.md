# Recipe Content Refresh V2 Audit

## Status

RECIPE_REFRESH_V2_RESEARCH_CANONICALIZED

Canonical source ready: true; runtime projection ready: false; production release ready: false. Blockers: RUNTIME_PROJECTION_LOSS, INGREDIENT_RECONCILIATION_INCOMPLETE, SOURCE_CONTENT_VERIFICATION_INCOMPLETE, NUTRITION_EVIDENCE_INCOMPLETE. Final release fingerprint: NOT GENERATED.

## ZIP audit

- Input SHA-256: `ebc18f06ee7fb4498f8cd2a7886f333a85b385f32af4407ae1b44b4ec3cc06fe`
- Recipes / unique IDs: 500 / 500
- Steps: 4938 (4904 objects, 34 strings, 27 title/description objects)
- Ingredient lines: 6766; raw numeric quantity 6714, quantity_text 30, null-with-unit 16, wholly qualitative 6
- Root schema variants: 15
- Source references: 1102 (1072 unique URLs)
- ZIP ingredient total is 6,766, not the reported production count 6,720. No data was changed to force reported handoff numbers.

## What was wrong

- The ZIP used 15 root shapes and three step representations instead of one source schema.
- 52 raw ingredient rows lacked numeric `quantity`; only evidence-backed quantity_text rows were parsed, leaving 23 truthful canonical qualitative rows.
- Nutrition counted process media such as 500 g salt beds and deep-frying oil as fully eaten.
- Name-derived enrichment IDs were incorrectly labeled reviewed and structural URL validity was overstated as relevance. Both now retain explicit provisional states.
- The V1 import compiler is INSERT-only and remains unchanged; refresh V2 is a separate source/projection path.

## Repairs

- Schema repair operations: 64; encoding repairs: 0.
- Process-only / mixed-process rows: 166 / 7.
- Ingredient concepts: 1438; reconciliation rows: 2515.
- Reconciliation: existing 505, reviewed new 0, provisional new 1642, duplicate aliases 368, ambiguous 0, invalid 0. Aliases of provisional IDs do not confer ingredient authority.
- 499/500 recipes have at least two structurally valid declared URLs; URL-specific content verification has not been recorded. The one source exception remains explicit.
- Approved titles applied: `vn-bun-01` → “Phở bò tái lăn Hà Nội”; `imp-7d38862afc164a8d` → “Mực xào xì dầu kiểu Hàn”.

## Nutrition

- Original numeric profiles: 289.
- Recomputed candidates: 353.
- Certified publishable: 1; blocked: 288; truthful null: 211.
- Original energy outliers >= 2,000 kcal/serving: 1; sodium outliers >= 10,000 mg/serving: 2. They are quarantined, not clipped.
- `vn-hap-01` no longer publishes 51,497.78 mg sodium/serving from the salt bed. `imp-6eaf6ed6d417c52c` no longer publishes 2,994.53 kcal/serving from 1 L frying oil.
- Blocker classes:
- ESTIMATED_EDIBLE_QUANTITY: 4495
- INCOMPLETE_NUTRIENT_REFERENCE: 420
- UNRESOLVED_ABSORPTION: 168
- MISSING_NUTRIENT_REFERENCE: 17
- QUALITATIVE_CONSUMED_AMOUNT: 14
- MISSING_EDIBLE_QUANTITY: 3

## Canonical package

- Path: `data/recipe-refresh/v2`
- Recipes: 500
- Previous source artifact SHA-256: `fc7eefe6573ee9de1083728db1f34b058954fa60ff478f7c5e41dce9e4570dbe`.
- Remediated canonical artifact SHA-256: `da87da20475fa8d7ec92c716e899ee572339573258ae6d9cc7f3f8f554f2d695`
- Provisional runtime projection fingerprint from `fingerprintRecipes()`: `6d0e3eb85696bb7c31bc54ac62783bc94432aaf008028eca79b17041f3eaed87`
- Final release fingerprint: NOT GENERATED.
- Machine-readable audit: `artifacts/recipe-refresh-v2`

## Runtime compatibility

3770/6766 rows project (55.72%); 2860 excluded rows require reviewed transformation. Exclusions by reason: unsupported_unit=2243, qualitative_quantity=18, process_only=4, estimated_process=139, no_runtime_quantity=4, non_shopping=588, other=0. Process-only cooking media can legitimately remain outside RuntimeRecipe. Required shopping/consumed rows cannot be silently dropped for a production release. Planner/inventory/shopping contracts remain unchanged.

## Source spot-check

A bounded online check covered the known source exception, both approved title corrections, the salt-bed defect, the deep-frying defect, and nine referenced FDC IDs. Nine of ten recipe pages returned HTTP 200; one Điện Máy Xanh request timed out and is not classified as dead. All nine FDC IDs returned HTTP 200 with the expected food descriptions through the official API. Keyless normalized API references returned HTTP 403 as expected, and two legacy human-facing FDC page routes returned 404 even though the underlying API IDs are valid. See `artifacts/recipe-refresh-v2/source-spot-check.json`; this mutable-web check is evidence, not part of the canonical content hash.

## Exceptions

- SOURCE_RELEVANCE_EXCEPTION: Only one exact-recipe source; the second source supports chayote preparation only.
- RUNTIME_QUALITATIVE_GAP: Canonical source retains qualitative and unsupported-unit ingredient rows; current RuntimeRecipe projects only positive quantities in StandardUnit.
- NUTRITION_EVIDENCE_BLOCKED: Blocked/null profiles remain intentionally absent from runtime nutrition until edible quantity and all material nutrients are evidenced.

## Findings

- P0: none.
- P1: production release blocked by RUNTIME_PROJECTION_LOSS, INGREDIENT_RECONCILIATION_INCOMPLETE, SOURCE_CONTENT_VERIFICATION_INCOMPLETE, NUTRITION_EVIDENCE_INCOMPLETE.
- P1: 2996 source ingredient rows are excluded from the provisional runtime projection; 2860 require reviewed transformation.
- P1: 288 researched nutrition profiles remain blocked; 1642 generated ingredient concepts lack authority review.
- P2: declared source URLs have structural validation only; bounded web spot-check evidence is separate.

## Remote boundary

- `staging_mutation=NO`
- `production_mutation=NO`
- `deploy=NO`
- `0040_created=NO`
- `final_release_manifest_created=NO`
- `T20_enablement=NO`

## Next

Hoplite must reconcile runtime/content loss, promote ingredient authority with explicit review evidence, verify source content and nutrition, then produce a complete final release projection and fingerprint before generating 0040.
