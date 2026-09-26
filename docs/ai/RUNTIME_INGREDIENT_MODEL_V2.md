# Runtime Ingredient Model V2 — review candidate

Status: offline model and deterministic audit only. Canonical source SHA
`da87da20475fa8d7ec92c716e899ee572339573258ae6d9cc7f3f8f554f2d695`.
No runtime authority, D1 schema, deployment or final release projection changes.

## Consumer dependency map

| Consumer | V1 dependency | V2 requirement before cutover |
| --- | --- | --- |
| T02 candidates and T04 planner | `RecipeDefinition.ingredients.requiredQuantity` is scaled and allocated against lots | Use only evidenced shopping requirements; unknown demand must be infeasible/unresolved, never zero |
| T03 ranking and T20 composer | Candidate shortage/ingredient IDs drive hard restrictions and projected inventory | Preserve the full ingredient identity/restriction set even when purchase quantity is unresolved |
| T05 shopping | T02/T04 shortage witness is aggregated once | Use shopping quantity only; process purchase may be required even when consumed amount is unknown |
| Recipe/Week API and D1 hydration | `RuntimeRecipe` and fingerprint require positive closed-unit ingredient rows | Version a complete content projection before changing authority; provisional projection is not release authority |
| Cooking command | `requiredQuantity`/unit can determine stock deduction | Deduct an evidenced purchased/used amount, not a nutrition estimate or process absorption guess |
| Recipe detail and cooking UI | One numeric line is displayed and offered to shopping | Show source display text separately; unresolved purchase quantity must not become a one-click numeric shopping row |
| Servings scaling | T02 scales every V1 demand proportionally | Per-channel scaling policy must be explicit; a fixed salt bed or unknown frying medium cannot inherit food scaling |
| Nutrition | V1 macros come from certified per-serving profile | Edible/absorbed amount is separate; unknown means blocked/null, never full process quantity |

## Candidate contract and projection

`packages/recipes/src/runtime-ingredient-v2.ts` is a pure candidate model. It
preserves source display text, separates shopping demand from process use, and
starts consumed quantity as unknown except explicitly excluded process use.
`projectV1ShoppingRequirements` fails closed before T02 can receive incomplete
or provisional requirements. It is deliberately not wired into live planners or
the D1 hydrator. The existing V1 `StandardUnit`, `RuntimeRecipe`, static 71,
recipe authority and T20 code are unchanged.

Exact physical unit policy remains the domain contract: g/kg and ml/l; no
tbsp/tsp/cup/pinch or food-specific weights are inferred. A source count such
as `củ` is an audit candidate, not automatically a reviewed purchase identity.
The offline adapter is intentionally conservative: a source row can retain a
measured count but still require reviewed projection evidence.

## Deterministic queues

Run `node scripts/runtime-ingredient-v2-audit.mjs build` to regenerate the
tracked audit, then `pnpm recipe:ingredient-v2:audit` to check byte-for-byte
determinism. No network, AI or production reads occur. Outputs:

- `artifacts/runtime-ingredient-v2/transformation-audit.json`: all 6,766 rows,
  current projection/exclusion reason, transformation class and release block.
- `artifacts/runtime-ingredient-v2/unsupported-unit-inventory.json`: 127 unit
  texts, counts, sample recipes and ingredients.
- `artifacts/runtime-ingredient-v2/ingredient-authority-queue.json`: 1,395
  distinct `ING_ENR_*` IDs currently present in recipe rows; candidate hints
  are never promotions. The source manifest's 1,438 ingredient concepts count
  also includes 43 distinct existing canonical IDs.
- `artifacts/runtime-ingredient-v2/nutrition-remediation-queue.json`: the 288
  blocked profiles and blocker counts, retaining candidate availability.
- `artifacts/runtime-ingredient-v2/source-verification-queue.json`: 1,102
  declared/supporting URL occurrences with current verification status.

Of 2,996 current runtime exclusions, 2,860 still require reviewed
transformation and 136 are semantic exclusions. The classifier resolves **zero**
excluded rows into a final release projection; labels are triage, not evidence.
It also flags 169 **already-projected** rows for independent conversion review
(150 culinary measures, 12 package semantics, 7 other). Thus 3,029 rows need
review across both exclusion and projected-risk queues. The large culinary-unit
group is not converted to ml/g by this work. The current nutrition
outcome remains 1 publishable, 288 blocked, 211 truthful null. URL structural
validity remains distinct from content verification (zero recorded in package).

`compileReviewedIngredientAuthority` requires a separate per-concept decision
with basis/reference, validates aliases against actual existing IDs, and refuses
provisional authority output or incomplete decisions. No review decision file
has been manufactured for the current concepts.

## Release order

Review evidence and reconcile runtime/content model → review ingredient
identity/aliases and source claims → prove complete shopping, cooking, safety,
servings and nutrition behavior → derive final runtime fingerprint through the
project's fingerprint function → build final manifest and generated 0040 →
certify staging. `pnpm recipe:refresh:release-check` must remain red until the
separate derived release gate proves these conditions.
