import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RuntimeRecipeSchema } from '../../packages/recipes/src/runtime-recipe';
import { ALL_RECIPES } from '../../packages/recipes/src/data';
import { RefreshRecipeSchema, deriveRefreshReleaseEligibility, type RefreshIngredient } from '../../packages/recipes/src/refresh';
import { auditRuntimeIngredientTransformations, classifySourceUnit, classifyTransformation } from '../../packages/recipes/src/runtime-ingredient-audit';
import { ingredientV2FromRefresh, projectV1ShoppingRequirements, scaleIngredientV2 } from '../../packages/recipes/src/runtime-ingredient-v2';

const recipe = (id: string) => RefreshRecipeSchema.parse(JSON.parse(readFileSync(path.join(process.cwd(), 'data/recipe-refresh/v2/recipes', `${id}.json`), 'utf8')));
const sourceLine = (id: string, part: string) => recipe(id).ingredients.find((line) => line.sourceName.includes(part))!;
const explicitlyMeasured = (line: RefreshIngredient): RefreshIngredient => line.quantity.kind === 'measured'
  ? { ...line, quantity: { ...line.quantity, evidence: 'source_explicit' } } : line;
const project = (sources: readonly RefreshIngredient[]) => projectV1ShoppingRequirements(sources, sources.map(ingredientV2FromRefresh));

describe('Runtime Ingredient Model V2 candidate contract', () => {
  it('leaves all V1 static runtime recipes valid and unchanged', () => {
    expect(ALL_RECIPES.map((item) => RuntimeRecipeSchema.parse(item))).toEqual(ALL_RECIPES);
  });

  it('keeps display, shopping, process and consumption independent', () => {
    const salt = ingredientV2FromRefresh(sourceLine('vn-hap-01', 'Muối hột'));
    expect(salt.display.text).toBe('500 g');
    expect(salt.shopping).toMatchObject({ kind: 'unresolved', text: '500 g' });
    expect(salt.process).toMatchObject({ kind: 'measured', amount: 500, unitText: 'g' });
    expect(salt.consumed).toEqual({ kind: 'excluded_process' });
    expect(() => project([sourceLine('vn-hap-01', 'Muối hột')])).toThrow(/UNRESOLVED_SHOPPING_QUANTITY/);
  });

  it('does not count deep-frying oil as fully consumed or silently omit it from shopping', () => {
    const oil = ingredientV2FromRefresh(sourceLine('imp-6eaf6ed6d417c52c', 'chiên ngập'));
    expect(oil.consumed).toEqual({ kind: 'unknown', reason: 'absorption_unknown' });
    expect(oil.shopping.kind).not.toBe('none');
    expect(() => project([sourceLine('imp-6eaf6ed6d417c52c', 'chiên ngập')])).toThrow(/PROJECTION_BLOCKED/);
  });

  it('keeps qualitative consumed ingredients unresolved for both shopping and nutrition', () => {
    const line = recipe('imp-389f525ea854b373').ingredients.find((row) => row.quantity.kind === 'qualitative' && row.includeInShopping)!;
    const candidate = ingredientV2FromRefresh(line);
    expect(candidate.shopping.kind).toBe('unresolved');
    expect(candidate.consumed.kind).toBe('unknown');
    expect(() => project([line])).toThrow(/UNRESOLVED_SHOPPING_QUANTITY/);
  });

  it('allows non-shopping process water but requires evidence for other non-shopping omissions', () => {
    const base = sourceLine('vn-hap-01', 'Muối hột');
    const waterSource = { ...base, sourceName: 'Nước lọc', includeInShopping: false };
    const riceSource = explicitlyMeasured({ ...sourceLine('vn-hap-01', 'Gà ta (nửa con)'), canonicalIngredientId: 'RICE', reconciliation: 'existing_canonical_id' });
    const water = ingredientV2FromRefresh(waterSource);
    const rice = ingredientV2FromRefresh(riceSource);
    expect(water.shopping).toMatchObject({ kind: 'none', reason: 'process_water' });
    expect(projectV1ShoppingRequirements([waterSource, riceSource], [water, rice])).toHaveLength(1);
    const omittedSource = { ...base, sourceName: 'Muối hột', includeInShopping: false };
    const omittedFood = ingredientV2FromRefresh(omittedSource);
    expect(() => projectV1ShoppingRequirements([omittedSource, riceSource], [omittedFood, rice])).toThrow(/UNREVIEWED_NON_SHOPPING_EXCLUSION/);
  });

  it('does not use culinary volume/count defaults and only recognizes physical conversions', () => {
    const base = sourceLine('vn-hap-01', 'Muối hột');
    const oil = ingredientV2FromRefresh({ ...base, sourceName: 'Oil', usageRole: 'consumed', nutritionRole: 'consumed',
      quantity: { ...base.quantity, kind: 'measured', amount: 1, unit: 'tbsp', text: '1 tbsp', runtime: null, evidence: 'source_explicit' } } as RefreshIngredient);
    expect(oil.shopping.kind).toBe('unresolved');
    expect(classifySourceUnit('tbsp')).toBe('cultural_measure');
    expect(classifySourceUnit('kg')).toBe('deterministic_physical');
    expect(classifySourceUnit('quả')).toBe('count');
    expect(classifySourceUnit('gói')).toBe('package');
  });

  it('scales only evidenced shopping quantities and preserves display text', () => {
    const base = sourceLine('vn-hap-01', 'Gà ta (nửa con)');
    const line = ingredientV2FromRefresh(explicitlyMeasured({ ...base, reconciliation: 'existing_canonical_id', canonicalIngredientId: 'CHICKEN_THIGH' }));
    const doubled = scaleIngredientV2(line, 2);
    expect(doubled.shopping).toMatchObject({ kind: 'measured', quantity: { amount: 1600, unit: 'g' } });
    expect(doubled.display).toEqual(line.display);
    expect(doubled.consumed.kind).toBe('unknown');
    expect(() => scaleIngredientV2(line, 0)).toThrow(/positive/);
    expect(() => scaleIngredientV2(ingredientV2FromRefresh(sourceLine('vn-hap-01', 'Muối hột')), 2)).toThrow(/UNRESOLVED_SERVINGS_SCALING/);
  });

  it('never promotes provisional or indirect alias authority', () => {
    const base = sourceLine('vn-hap-01', 'Gà ta (nửa con)');
    const provisional = ingredientV2FromRefresh(base);
    expect(provisional.authority).toBe('provisional');
    expect(() => project([base])).toThrow(/PROVISIONAL_INGREDIENT_AUTHORITY/);
    const alias = ingredientV2FromRefresh(sourceLine('vn-hap-01', 'Muối hột'));
    expect(alias.authority).toBe('provisional');
    expect(() => project([sourceLine('vn-hap-01', 'Muối hột')])).toThrow(/PROVISIONAL_INGREDIENT_AUTHORITY/);
    const reviewed = ingredientV2FromRefresh({ ...base, reconciliation: 'reviewed_new_canonical_id', review: { basis: 'fixture review', evidenceReference: 'fixture:1' } });
    expect(reviewed.authority).toBe('reviewed_new');
  });

  it('categorizes release-required losses separately from semantic process exclusions', () => {
    const required = sourceLine('vn-hap-01', 'Gừng tươi');
    expect(classifyTransformation(required).releaseBlocking).toBe(true);
    const process = { ...sourceLine('vn-hap-01', 'Muối hột'), quantity: { kind: 'qualitative' as const, text: 'vừa đủ', gramEquivalent: null, basis: null, evidence: 'missing' as const, runtime: null } };
    expect(classifyTransformation(process).releaseBlocking).toBe(false);
    const qualitative = recipe('imp-389f525ea854b373').ingredients.find((line) => line.quantity.kind === 'qualitative' && line.includeInShopping)!;
    expect(classifyTransformation(qualitative)).toMatchObject({ transformationClass: 'QUALITATIVE_ONLY', releaseBlocking: true });
    const recipeFixture = recipe('vn-hap-01');
    const audit = auditRuntimeIngredientTransformations([recipeFixture]);
    expect(audit.summary.canonicalRows).toBe(recipeFixture.ingredients.length);
    expect(audit.summary.currentlyProjected + audit.summary.currentlyExcluded).toBe(audit.summary.canonicalRows);
  });

  it('does not treat already-projected culinary conversions as independently reviewed', () => {
    const source = sourceLine('vn-xao-05', 'Dầu ăn');
    expect(source.quantity).toMatchObject({ kind: 'measured', unit: 'muỗng canh', runtime: { unit: 'g' } });
    expect(classifyTransformation(source)).toEqual({
      transformationClass: 'CULTURAL_MEASURE_REVIEW_REQUIRED', releaseBlocking: true, exclusionReason: null,
    });
    expect(ingredientV2FromRefresh(source).shopping.kind).toBe('unresolved');
  });

  it('requires complete source-line coverage and explicit evidence for a changed purchase conversion', () => {
    const base = explicitlyMeasured({ ...sourceLine('vn-hap-01', 'Gà ta (nửa con)'),
      canonicalIngredientId: 'CHICKEN_THIGH', reconciliation: 'existing_canonical_id' });
    const line = ingredientV2FromRefresh(base);
    expect(() => projectV1ShoppingRequirements([base, { ...base, position: base.position + 1 }], [line])).toThrow(/SOURCE_LINE_COVERAGE_DRIFT/);
    expect(line.shopping.kind).toBe('measured');
    if (line.shopping.kind !== 'measured') return;
    const changed = { ...line, shopping: { ...line.shopping, quantity: { ...line.shopping.quantity, amount: line.shopping.quantity.amount + 1 } } };
    expect(() => projectV1ShoppingRequirements([base], [changed])).toThrow(/UNREVIEWED_PURCHASE_CONVERSION/);
    const supported = { ...changed, shopping: { ...changed.shopping, conversionEvidence: { basis: 'test-only reviewed conversion', reference: 'fixture:conversion' } } };
    expect(projectV1ShoppingRequirements([base], [supported])).toHaveLength(1);
  });

  it('keeps nutrition and source release blockers independent of model compilation', () => {
    const salt = recipe('vn-hap-01');
    expect(salt.nutrition.profileId).toBeNull();
    expect(salt.nutrition.perServing.energyKcal).toBeNull();
    expect(salt.research.sources.every((source) => source.verification === 'structurally_valid')).toBe(true);
    const eligibility = deriveRefreshReleaseEligibility([salt]);
    expect(eligibility.productionReleaseReady).toBe(false);
    expect(eligibility.finalRuntimeFingerprint).toBeNull();
  });

  it('reconstructs the committed 500-recipe transformation audit without changing source identity', () => {
    const root = process.cwd();
    const manifest = JSON.parse(readFileSync(path.join(root, 'data/recipe-refresh/v2/manifest.json'), 'utf8')) as { orderedRecipeIds: string[]; canonicalArtifactSha256: string };
    const recipes = manifest.orderedRecipeIds.map(recipe);
    const committed = JSON.parse(readFileSync(path.join(root, 'artifacts/runtime-ingredient-v2/transformation-audit.json'), 'utf8'));
    expect(committed).toEqual({ canonicalSourceSha256: manifest.canonicalArtifactSha256, ...auditRuntimeIngredientTransformations(recipes) });
    expect(committed.summary).toMatchObject({ canonicalRows: 6766, currentlyProjected: 3770, currentlyExcluded: 2996, requiredTransformations: 2860, projectedReviewRequired: 169 });
    expect(committed.summary.intentionalSemanticExclusions).toBe(136);
  });
});
