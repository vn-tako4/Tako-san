import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertNutritionAgreement,
  assertRefreshCatalog,
  assertReleaseExceptions,
  assertNoProvisionalIngredientAuthority,
  assertRefreshReleaseEligible,
  classifyIngredientSemantics,
  compileRefreshCatalog,
  fingerprintRefreshArtifact,
  generatedIngredientResolution,
  ingredientConceptKey,
  deriveRefreshReleaseEligibility,
  RefreshIngredientReconciliationRowSchema,
  RefreshSourceManifestSchema,
  RefreshRecipeSchema,
  runtimeExclusionFromSource,
  runtimeIngredientFromSource,
  type RefreshRecipe,
} from '../../packages/recipes/src/refresh';

const root = process.cwd();
const dataRoot = path.join(root, 'data', 'recipe-refresh', 'v2');
const artifactRoot = path.join(root, 'artifacts', 'recipe-refresh-v2');
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const emptyNutrients = () => ({
  energyKcal: null,
  proteinG: null,
  carbohydrateG: null,
  fatG: null,
  fiberG: null,
  sugarG: null,
  sodiumMg: null,
});

function recipeFixture(): RefreshRecipe {
  return RefreshRecipeSchema.parse({
    schemaVersion: 2,
    recipeVersion: 2,
    identity: { id: 'fixture-1', slug: 'fixture-1', title: 'Fixture' },
    content: {
      description: 'Fixture recipe',
      cuisine: 'vietnamese',
      cookTimeMinutes: 10,
      servings: 2,
      difficulty: 'easy',
      tags: [],
    },
    research: { inputPath: 'fixture.json', rawSchemaSignature: 'fixture', sources: [], notes: [] },
    ingredients: [{
      position: 0,
      sourceName: 'Muối vừa đủ',
      canonicalIngredientId: 'ING_ENR_SALT',
      reconciliation: 'provisional_new_canonical_id',
      reconciliationReason: 'fixture',
      review: null,
      usageRole: 'qualitative',
      nutritionRole: 'consumed',
      optional: false,
      includeInShopping: true,
      includeInNutrition: false,
      quantity: {
        kind: 'qualitative',
        text: 'vừa đủ',
        gramEquivalent: null,
        basis: null,
        evidence: 'missing',
        runtime: null,
      },
      note: null,
      sourceNutritionPer100g: null,
      sourceNutritionReference: null,
      sourceNutritionNote: null,
    }],
    steps: [{ stepNumber: 1, instruction: 'Nấu theo nguồn.' }],
    nutrition: {
      certification: 'null_truthful',
      profileId: null,
      basis: 'per_serving',
      servings: 2,
      perServing: emptyNutrients(),
      candidatePerServing: emptyNutrients(),
      originalPerServing: emptyNutrients(),
      blockers: [{ code: 'QUALITATIVE_CONSUMED_AMOUNT', ingredientPosition: 0, detail: 'quantity is qualitative' }],
      remediation: [],
    },
    media: { sourceImageUrl: null, legacyRuntimeImageUrl: '/fixture.webp', canonicalStatus: 'source_metadata_only' },
    audit: { schemaRepairs: [], encodingRepairs: [], runtimeExcludedIngredientPositions: [0], runtimeExclusions: [{ position: 0, reason: 'qualitative_quantity', requiresReviewedTransformation: true }] },
  });
}

describe('Recipe Content Refresh V2 contracts', () => {
  it('keeps nutrition evidence separate from ingredient identity', () => {
    expect(ingredientConceptKey('Miso trắng')).not.toBe(ingredientConceptKey('Nước tương'));
    expect(ingredientConceptKey('Riềng tươi (galangal)')).not.toBe(ingredientConceptKey('Gừng tươi'));
    expect(ingredientConceptKey('Tỏi (pha nước chấm)')).toBe(ingredientConceptKey('Tỏi'));
    expect(ingredientConceptKey('Hành tím')).not.toBe(ingredientConceptKey('Hành tây'));
    expect(ingredientConceptKey('Me chín')).not.toBe(ingredientConceptKey('Mè rang'));
    expect(ingredientConceptKey('Mẻ')).not.toBe(ingredientConceptKey('Me chín'));
    expect(ingredientConceptKey('Bạc hà (dọc mùng)')).not.toBe(ingredientConceptKey('Bạc hà tươi'));
    expect(ingredientConceptKey('Rượu nấu ăn (Mirin)')).not.toBe(ingredientConceptKey('Rượu nấu ăn'));
  });

  it('classifies salt beds, deep-frying media and mixed process use without counting full quantities as eaten', () => {
    expect(classifyIngredientSemantics({
      name: 'Muối hột (lót đáy nồi)', note: 'môi trường truyền nhiệt, không ăn', basis: '', optional: false, qualitative: false,
    })).toMatchObject({ usageRole: 'process_only', nutritionRole: 'excluded_process', includeInNutrition: false });
    expect(classifyIngredientSemantics({
      name: 'Dầu ăn để chiên ngập', note: 'phần lớn còn lại trong chảo', basis: '', optional: false, qualitative: false,
    })).toMatchObject({ usageRole: 'process_only', nutritionRole: 'unresolved_absorption', includeInNutrition: false });
    expect(classifyIngredientSemantics({
      name: 'Gừng', note: 'một nửa băm ướp, một nửa lót đáy nồi', basis: '', optional: false, qualitative: false,
    })).toMatchObject({ usageRole: 'mixed_process', nutritionRole: 'unresolved_absorption', includeInNutrition: false });
  });

  it('never fabricates runtime quantities for qualitative source rows', async () => {
    const source = recipeFixture();
    const compiled = await compileRefreshCatalog([source]);
    expect(compiled.recipes[0].ingredients).toEqual([]);
    expect(compiled.recipes[0].nutrition).toBeUndefined();
  });

  it('accepts a canonical source while its release projection remains blocked', () => {
    const recipe = recipeFixture();
    const eligibility = deriveRefreshReleaseEligibility([recipe]);
    expect(eligibility).toMatchObject({ canonicalSourceReady: true, runtimeProjectionReady: false, productionReleaseReady: false, finalRuntimeFingerprint: null });
    expect(eligibility.blockers).toContain('RUNTIME_PROJECTION_LOSS');
    expect(() => assertRefreshReleaseEligible(eligibility, [recipe], 'a'.repeat(64))).toThrow(/RECIPE_REFRESH_RELEASE_BLOCKED.*RUNTIME_PROJECTION_LOSS/);
  });

  it('never promotes a provisional runtime fingerprint to production authority', () => {
    const recipe = recipeFixture();
    const eligibility = deriveRefreshReleaseEligibility([recipe]);
    expect(() => assertRefreshReleaseEligible({ ...eligibility, finalRuntimeFingerprint: 'a'.repeat(64) }, [recipe], 'a'.repeat(64))).toThrow();
    expect(() => assertRefreshReleaseEligible({ ...eligibility, productionReleaseReady: true, blockers: [] }, [recipe], 'a'.repeat(64))).toThrow();
  });

  it('requires a complete reviewed projection and an exact final fingerprint', () => {
    const base = recipeFixture();
    const recipe = RefreshRecipeSchema.parse({
      ...base,
      ingredients: [
        { ...base.ingredients[0], canonicalIngredientId: 'SALT', reconciliation: 'existing_canonical_id', usageRole: 'process_only', nutritionRole: 'excluded_process' },
        {
          ...base.ingredients[0], position: 1, sourceName: 'Rice', canonicalIngredientId: 'RICE', reconciliation: 'existing_canonical_id',
          usageRole: 'consumed', includeInNutrition: true,
          quantity: { kind: 'measured', amount: 100, unit: 'g', text: '100 g', gramEquivalent: 100, basis: null, evidence: 'source_explicit', runtime: { amount: 100, unit: 'g' } },
        },
      ],
      research: { ...base.research, sources: [1, 2].map((number) => ({
        url: `https://example.com/recipe-${number}`, role: 'declared', verification: 'content_verified',
        verificationEvidence: `fixture-review-${number}`, note: null,
      })) },
    });
    expect(deriveRefreshReleaseEligibility([recipe]).blockers).toEqual([]);
    const eligible = { ...deriveRefreshReleaseEligibility([recipe]), productionReleaseReady: true, finalRuntimeFingerprint: 'a'.repeat(64) };
    expect(() => assertRefreshReleaseEligible(eligible, [recipe], 'b'.repeat(64))).toThrow(/FINAL_FINGERPRINT_MISMATCH/);
    expect(assertRefreshReleaseEligible(eligible, [recipe], 'a'.repeat(64))).toBe('a'.repeat(64));
  });

  it('keeps generated concepts provisional and requires explicit review evidence for promotion', () => {
    expect(generatedIngredientResolution(false)).toBe('provisional_new_canonical_id');
    expect(generatedIngredientResolution(true)).toBe('duplicate_alias');
    const provisional = recipeFixture().ingredients[0];
    expect(() => assertNoProvisionalIngredientAuthority([provisional])).toThrow(/INGREDIENT_RECONCILIATION_INCOMPLETE/);
    const reviewed = RefreshRecipeSchema.parse({ ...recipeFixture(), ingredients: [{
      ...provisional, reconciliation: 'reviewed_new_canonical_id',
      review: { basis: 'fixture review', evidenceReference: 'fixture://review-1' },
    }] });
    expect(() => assertNoProvisionalIngredientAuthority(reviewed.ingredients)).not.toThrow();
    expect(() => assertNoProvisionalIngredientAuthority([{ ...provisional, reconciliation: 'duplicate_alias' }])).toThrow(/INGREDIENT_RECONCILIATION_INCOMPLETE/);
    expect(() => assertNoProvisionalIngredientAuthority([...reviewed.ingredients, { ...provisional, reconciliation: 'duplicate_alias' }])).not.toThrow();
    expect(() => RefreshRecipeSchema.parse({ ...reviewed, ingredients: [{ ...reviewed.ingredients[0], review: null }] })).toThrow(/review evidence/);
    const row = RefreshIngredientReconciliationRowSchema.parse({
      sourceName: 'Fixture', sourceId: null, nutritionSource: null, canonicalId: 'ING_ENR_SALT', canonicalName: 'Fixture',
      resolution: 'provisional_new_canonical_id', reason: 'generated name key', review: null,
    });
    expect(() => assertNoProvisionalIngredientAuthority([row])).toThrow(/INGREDIENT_RECONCILIATION_INCOMPLETE/);
  });

  it('does not treat a structurally valid URL as content verified', () => {
    const recipe = recipeFixture();
    const sources = [{ url: 'https://example.com/recipe', role: 'declared', verification: 'structurally_valid', verificationEvidence: null, note: null }];
    const parsed = RefreshRecipeSchema.parse({ ...recipe, research: { ...recipe.research, sources } });
    expect(deriveRefreshReleaseEligibility([parsed]).blockers).toContain('SOURCE_CONTENT_VERIFICATION_INCOMPLETE');
    expect(() => RefreshRecipeSchema.parse({ ...recipe, research: { ...recipe.research, sources: [{ ...sources[0], verification: 'content_verified' }] } })).toThrow(/URL-specific evidence/);
  });

  it('classifies runtime loss and distinguishes required consumed rows from process media', () => {
    const qualitative = recipeFixture().ingredients[0];
    expect(runtimeExclusionFromSource(qualitative)).toMatchObject({ reason: 'qualitative_quantity', requiresReviewedTransformation: true });
    const process = { ...qualitative, usageRole: 'process_only' as const, nutritionRole: 'excluded_process' as const };
    expect(runtimeExclusionFromSource(process)).toMatchObject({ reason: 'process_only', requiresReviewedTransformation: false });
    const recipe = RefreshRecipeSchema.parse({ ...recipeFixture(), ingredients: [process, {
      ...qualitative, position: 1, sourceName: 'Rice', canonicalIngredientId: 'RICE', reconciliation: 'existing_canonical_id',
      usageRole: 'consumed', includeInNutrition: true,
      quantity: { kind: 'measured', amount: 100, unit: 'g', text: '100 g', gramEquivalent: 100, basis: null, evidence: 'source_explicit', runtime: { amount: 100, unit: 'g' } },
    }] });
    expect(deriveRefreshReleaseEligibility([recipe]).blockers).not.toContain('RUNTIME_PROJECTION_LOSS');
    const unsupported = RefreshRecipeSchema.parse({ ...recipeFixture(), ingredients: [{
      ...qualitative,
      quantity: { kind: 'measured', amount: 1, unit: 'tbsp', text: '1 tbsp', gramEquivalent: null, basis: null, evidence: 'missing', runtime: null },
    }] }).ingredients[0];
    expect(runtimeExclusionFromSource(unsupported)).toMatchObject({ reason: 'unsupported_unit', requiresReviewedTransformation: true });
    expect(runtimeExclusionFromSource({ ...qualitative, includeInShopping: false })).toMatchObject({ reason: 'non_shopping', requiresReviewedTransformation: true });
    expect(runtimeExclusionFromSource({ ...process, includeInShopping: false })).toMatchObject({ reason: 'process_only', requiresReviewedTransformation: false });
  });

  it('keeps water and estimated process quantities out of the shopping-backed runtime projection', () => {
    const ingredient = recipeFixture().ingredients[0];
    const water = {
      ...ingredient,
      sourceName: 'Nước lọc',
      includeInShopping: false,
      quantity: { kind: 'measured' as const, amount: 500, unit: 'ml', text: '500 ml', gramEquivalent: 500, basis: 'source', evidence: 'source_explicit' as const, runtime: { amount: 500, unit: 'ml' as const } },
    };
    expect(runtimeIngredientFromSource(water)).toBeNull();
    const estimatedFryingOil = {
      ...water,
      sourceName: 'Dầu ăn để chiên ngập',
      usageRole: 'process_only' as const,
      nutritionRole: 'unresolved_absorption' as const,
      includeInShopping: true,
      quantity: { ...water.quantity, amount: 1000, text: 'ước lượng 1 lít', evidence: 'estimated' as const, runtime: { amount: 1, unit: 'l' as const } },
    };
    expect(runtimeIngredientFromSource(estimatedFryingOil)).toBeNull();
  });

  it('rejects invalid runtime units, ingredient IDs and measured quantities', () => {
    const recipe = recipeFixture();
    const measured = {
      ...recipe.ingredients[0],
      canonicalIngredientId: 'invalid-id',
      quantity: {
        kind: 'measured',
        amount: 0,
        unit: 'tbsp',
        text: '1 tbsp',
        gramEquivalent: null,
        basis: null,
        evidence: 'missing',
        runtime: { amount: 1, unit: 'tbsp' },
      },
    };
    expect(() => RefreshRecipeSchema.parse({ ...recipe, ingredients: [measured] })).toThrow();
  });

  it('rejects duplicate IDs, duplicate slugs and broken step numbering', () => {
    const first = recipeFixture();
    const duplicateId = RefreshRecipeSchema.parse({ ...first, identity: { ...first.identity, slug: 'other' } });
    expect(() => assertRefreshCatalog([first, duplicateId])).toThrow(/duplicate recipe ID/);
    const duplicateSlug = RefreshRecipeSchema.parse({ ...first, identity: { ...first.identity, id: 'fixture-2' } });
    expect(() => assertRefreshCatalog([first, duplicateSlug])).toThrow(/duplicate recipe slug/);
    const broken = RefreshRecipeSchema.parse({ ...first, steps: [{ stepNumber: 2, instruction: 'Broken.' }] });
    expect(() => assertRefreshCatalog([broken])).toThrow(/broken step numbering/);
  });

  it('rejects nutrition disagreement and unknown release exceptions', () => {
    const recipe = recipeFixture();
    expect(() => assertNutritionAgreement(recipe, {
      id: recipe.identity.id,
      slug: recipe.identity.slug,
      title: recipe.identity.title,
      description: recipe.content.description,
      cuisine: recipe.content.cuisine,
      cookTimeMinutes: recipe.content.cookTimeMinutes,
      servings: recipe.content.servings,
      difficulty: recipe.content.difficulty,
      imageUrl: recipe.media.legacyRuntimeImageUrl,
      nutrition: { calories: 1, proteinG: 1, fatG: 1, carbG: 1 },
      ingredients: [],
      steps: recipe.steps,
      tags: [],
    })).toThrow(/blocked\/null nutrition/);
    expect(() => assertReleaseExceptions(
      [{ code: 'UNKNOWN_EXCEPTION' }],
      new Set(['SOURCE_RELEVANCE_EXCEPTION']),
      { code: 'SOURCE_RELEVANCE_EXCEPTION', recipeId: 'known' },
    )).toThrow(/unknown release exception/);
  });

  it('detects artifact hash ordering/path drift', async () => {
    const first = { path: 'a.json', sha256: 'a'.repeat(64) };
    const second = { path: 'b.json', sha256: 'b'.repeat(64) };
    expect(await fingerprintRefreshArtifact([first, second])).not.toBe(await fingerprintRefreshArtifact([
      first,
      { ...second, sha256: 'c'.repeat(64) },
    ]));
    await expect(fingerprintRefreshArtifact([second, first])).rejects.toThrow(/strictly sorted/);
    await expect(fingerprintRefreshArtifact([{ path: '../escape', sha256: 'a'.repeat(64) }])).rejects.toThrow(/invalid canonical artifact path/);
  });
});

describe('committed Recipe Content Refresh V2 package', () => {
  it('contains the independently audited 500-recipe corpus and reproduces the runtime fingerprint', async () => {
    const manifest = RefreshSourceManifestSchema.parse(readJson(path.join(dataRoot, 'manifest.json')));
    const audit = readJson(path.join(artifactRoot, 'audit-summary.json')) as {
      recipes: number;
      steps: number;
      ingredients: number;
      qualitativeIngredients: number;
      processOnlyIngredients: number;
      nutritionPublishable: number;
      nutritionBlocked: number;
      nutritionNull: number;
      rawStepShapes: { strings: number; titleDescription: number; titleDescriptionRecipes: number };
      rawQuantityShapes: { numeric: number; quantityText: number; nullWithUnit: number; whollyQualitative: number };
    };
    expect(audit).toEqual(manifest.auditSummary);
    expect(audit).toMatchObject({
      recipes: 500,
      steps: 4938,
      ingredients: 6766,
      rawStepShapes: { strings: 34, titleDescription: 27, titleDescriptionRecipes: 3 },
      rawQuantityShapes: { numeric: 6714, quantityText: 30, nullWithUnit: 16, whollyQualitative: 6 },
      nutritionPublishable: 1,
      nutritionBlocked: 288,
      nutritionNull: 211,
    });
    const files = readdirSync(path.join(dataRoot, 'recipes')).filter((name) => name.endsWith('.json'));
    expect(files).toHaveLength(500);
    const byId = new Map(files.map((name) => {
      const recipe = RefreshRecipeSchema.parse(readJson(path.join(dataRoot, 'recipes', name)));
      return [recipe.identity.id, recipe] as const;
    }));
    const recipes = manifest.orderedRecipeIds.map((id) => byId.get(id)!);
    assertRefreshCatalog(recipes, manifest.orderedRecipeIds);
    const compiled = await compileRefreshCatalog(recipes);
    expect(compiled.recipes.every((recipe) => recipe.ingredients.length > 0)).toBe(true);
    expect(readJson(path.join(artifactRoot, 'runtime-projection.json'))).toMatchObject({
      projectionStatus: 'provisional', productionReleaseReady: false, finalRuntimeFingerprint: null,
      provisionalRuntimeProjectionFingerprint: compiled.provisionalRuntimeProjectionFingerprint,
    });
    expect(compiled.provisionalRuntimeProjectionFingerprint).toBe(manifest.provisionalRuntimeProjectionFingerprint);
    expect(manifest.releaseEligibility).toEqual(deriveRefreshReleaseEligibility(recipes));
    expect(manifest.releaseEligibility.productionReleaseReady).toBe(false);
    expect(manifest.releaseEligibility.finalRuntimeFingerprint).toBeNull();
    expect(() => assertRefreshReleaseEligible(manifest.releaseEligibility, recipes, compiled.provisionalRuntimeProjectionFingerprint)).toThrow(/RECIPE_REFRESH_RELEASE_BLOCKED/);
    const drifted = recipes.map((recipe, index) => index === 0
      ? RefreshRecipeSchema.parse({ ...recipe, identity: { ...recipe.identity, title: `${recipe.identity.title} drift` } })
      : recipe);
    expect((await compileRefreshCatalog(drifted)).provisionalRuntimeProjectionFingerprint).not.toBe(compiled.provisionalRuntimeProjectionFingerprint);
    const hashes = manifest.fileHashes.map((entry) => ({ path: entry.path, sha256: createHash('sha256').update(readFileSync(path.join(dataRoot, entry.path))).digest('hex') }));
    expect(hashes).toEqual(manifest.fileHashes);
    expect(await fingerprintRefreshArtifact(hashes)).toBe(manifest.canonicalArtifactSha256);
  });

  it('preserves truthful qualitative rows and remediates the confirmed nutrition process defects', () => {
    const qualitative = RefreshRecipeSchema.parse(readJson(path.join(dataRoot, 'recipes', 'imp-389f525ea854b373.json')));
    const qualitativeRows = qualitative.ingredients.filter((ingredient) => ingredient.quantity.kind === 'qualitative');
    expect(qualitativeRows).toHaveLength(6);
    expect(qualitativeRows.every((ingredient) => ingredient.quantity.runtime === null)).toBe(true);

    const saltBed = RefreshRecipeSchema.parse(readJson(path.join(dataRoot, 'recipes', 'vn-hap-01.json')));
    expect(saltBed.ingredients.find((ingredient) => ingredient.sourceName.startsWith('Muối hột (lót đáy'))).toMatchObject({
      usageRole: 'process_only', nutritionRole: 'excluded_process', includeInNutrition: false,
    });
    expect(saltBed.nutrition.originalPerServing.sodiumMg).toBe(51497.78);
    expect(saltBed.nutrition.perServing.sodiumMg).toBeNull();

    const frying = RefreshRecipeSchema.parse(readJson(path.join(dataRoot, 'recipes', 'imp-6eaf6ed6d417c52c.json')));
    expect(frying.ingredients.find((ingredient) => ingredient.sourceName.includes('chiên ngập'))).toMatchObject({
      usageRole: 'process_only', nutritionRole: 'unresolved_absorption', includeInNutrition: false,
    });
    expect(frying.nutrition.originalPerServing.energyKcal).toBe(2994.53);
    expect(frying.nutrition.perServing.energyKcal).toBeNull();
    expect(frying.nutrition.blockers.some((blocker) => blocker.code === 'UNRESOLVED_ABSORPTION')).toBe(true);
  });

  it('keeps approved title corrections and the explicit source exception', () => {
    const pho = RefreshRecipeSchema.parse(readJson(path.join(dataRoot, 'recipes', 'vn-bun-01.json')));
    const squid = RefreshRecipeSchema.parse(readJson(path.join(dataRoot, 'recipes', 'imp-7d38862afc164a8d.json')));
    expect(pho.identity.title).toBe('Phở bò tái lăn Hà Nội');
    expect(squid.identity.title).toBe('Mực xào xì dầu kiểu Hàn');
    const exceptions = readJson(path.join(dataRoot, 'exceptions.json')) as Array<{ code: string; recipeId: string | null }>;
    expect(exceptions).toContainEqual(expect.objectContaining({ code: 'SOURCE_RELEVANCE_EXCEPTION', recipeId: 'imp-0d6c454ae1073ef6' }));
  });
});
