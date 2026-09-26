import { CanonicalIngredientIdSchema } from '../../../domain/src/foundation';
import { fingerprintRecipes } from '../catalog-fingerprint';
import { RuntimeRecipeSchema, type RuntimeRecipe } from '../runtime-recipe';
import type { RefreshIngredient, RefreshNutrients, RefreshRecipe } from './schema';
import { runtimeQuantity } from './normalize';

export type RefreshRuntimeExclusion = {
  position: number;
  reason: 'unsupported_unit' | 'qualitative_quantity' | 'process_only' | 'estimated_process' | 'no_runtime_quantity' | 'non_shopping' | 'other';
  requiresReviewedTransformation: boolean;
};

const emptyNutrients = (): RefreshNutrients => ({
  energyKcal: null,
  proteinG: null,
  carbohydrateG: null,
  fatG: null,
  fiberG: null,
  sugarG: null,
  sodiumMg: null,
});

export function runtimeIngredientFromSource(ingredient: RefreshIngredient): RuntimeRecipe['ingredients'][number] | null {
  const runtime = ingredient.quantity.runtime;
  if (runtime === null || ingredient.canonicalIngredientId === null || !ingredient.includeInShopping) return null;
  if ((ingredient.usageRole === 'process_only' || ingredient.usageRole === 'mixed_process')
    && ingredient.quantity.kind === 'measured' && ingredient.quantity.evidence === 'estimated') return null;
  if (!CanonicalIngredientIdSchema.safeParse(ingredient.canonicalIngredientId).success) return null;
  if (!(Number.isFinite(runtime.amount) && runtime.amount > 0)) return null;
  return {
    ingredientId: ingredient.canonicalIngredientId,
    name: ingredient.sourceName,
    requiredQuantity: runtime.amount,
    unit: runtime.unit,
    ...(ingredient.optional ? { isOptional: true } : {}),
  };
}

export function runtimeExclusionFromSource(ingredient: RefreshIngredient): RefreshRuntimeExclusion | null {
  if (runtimeIngredientFromSource(ingredient) !== null) return null;
  let reason: RefreshRuntimeExclusion['reason'] = 'other';
  if ((ingredient.usageRole === 'process_only' || ingredient.usageRole === 'mixed_process')
    && ingredient.quantity.kind === 'measured' && ingredient.quantity.evidence === 'estimated') reason = 'estimated_process';
  else if (ingredient.usageRole === 'process_only') reason = 'process_only';
  else if (!ingredient.includeInShopping) reason = 'non_shopping';
  else if (ingredient.quantity.kind === 'qualitative') reason = 'qualitative_quantity';
  else if (ingredient.quantity.runtime === null) reason = runtimeQuantity(ingredient.quantity.amount, ingredient.quantity.unit) === null
    ? 'unsupported_unit' : 'no_runtime_quantity';
  return {
    position: ingredient.position,
    reason,
    requiresReviewedTransformation: ingredient.usageRole !== 'process_only'
      && (ingredient.includeInShopping || ['consumed', 'qualitative', 'mixed_process'].includes(ingredient.usageRole)),
  };
}

export function compileRefreshRecipe(recipe: RefreshRecipe): RuntimeRecipe {
  const runtimeIngredients = recipe.ingredients.map(runtimeIngredientFromSource).filter((value): value is NonNullable<typeof value> => value !== null);
  const candidate: RuntimeRecipe = {
    id: recipe.identity.id,
    slug: recipe.identity.slug,
    title: recipe.identity.title,
    description: recipe.content.description,
    cuisine: recipe.content.cuisine,
    ...(recipe.content.category !== undefined ? { category: recipe.content.category } : {}),
    ...(recipe.content.region !== undefined ? { region: recipe.content.region } : {}),
    cookTimeMinutes: recipe.content.cookTimeMinutes,
    servings: recipe.content.servings,
    difficulty: recipe.content.difficulty,
    imageUrl: recipe.media.legacyRuntimeImageUrl,
    ...(recipe.nutrition.certification === 'publishable' ? {
      nutrition: {
        calories: recipe.nutrition.perServing.energyKcal!,
        proteinG: recipe.nutrition.perServing.proteinG!,
        fatG: recipe.nutrition.perServing.fatG!,
        carbG: recipe.nutrition.perServing.carbohydrateG!,
      },
    } : {}),
    ingredients: runtimeIngredients,
    steps: recipe.steps,
    tags: recipe.content.tags,
  };
  return RuntimeRecipeSchema.parse(candidate);
}

export function assertNutritionAgreement(recipe: RefreshRecipe, runtime: RuntimeRecipe): void {
  if (recipe.nutrition.certification === 'publishable') {
    const expected = recipe.nutrition.perServing;
    if (!runtime.nutrition || runtime.nutrition.calories !== expected.energyKcal || runtime.nutrition.proteinG !== expected.proteinG
      || runtime.nutrition.fatG !== expected.fatG || runtime.nutrition.carbG !== expected.carbohydrateG) {
      throw new Error(`${recipe.identity.id}: runtime nutrition disagrees with certified v2 profile`);
    }
    if (recipe.nutrition.profileId !== `${recipe.identity.id}_nutrition_v2`) throw new Error(`${recipe.identity.id}: invalid v2 nutrition profile ID`);
  } else if (runtime.nutrition !== undefined || recipe.nutrition.profileId !== null) {
    throw new Error(`${recipe.identity.id}: blocked/null nutrition must not project runtime macros`);
  }
}

export function assertRefreshCatalog(recipes: readonly RefreshRecipe[], expectedIds?: readonly string[]): void {
  const ids = recipes.map((recipe) => recipe.identity.id);
  if (new Set(ids).size !== ids.length) throw new Error('duplicate recipe ID');
  const slugs = recipes.map((recipe) => recipe.identity.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error('duplicate recipe slug');
  if (expectedIds) {
    if (ids.length !== expectedIds.length) throw new Error(`recipe count ${ids.length} != ${expectedIds.length}`);
    const actual = [...ids].sort();
    const expected = [...expectedIds].sort();
    if (actual.some((id, index) => id !== expected[index])) throw new Error('recipe ID set does not match the expected catalog');
  }
  for (const recipe of recipes) {
    if (recipe.steps.some((step, index) => step.stepNumber !== index + 1)) throw new Error(`${recipe.identity.id}: broken step numbering`);
    if (recipe.ingredients.some((ingredient) => ingredient.quantity.runtime !== null && ingredient.canonicalIngredientId === null)) {
      throw new Error(`${recipe.identity.id}: runtime ingredient lacks canonical ID`);
    }
  }
}

export function assertReleaseExceptions(
  exceptions: readonly { code: string; recipeId?: string | null }[],
  allowedCodes: ReadonlySet<string>,
  requiredRecipeException: { code: string; recipeId: string },
): void {
  const codes = exceptions.map((entry) => entry.code);
  for (const code of codes) if (!allowedCodes.has(code)) throw new Error(`unknown release exception: ${code}`);
  if (new Set(codes).size !== allowedCodes.size || [...allowedCodes].some((code) => !codes.includes(code))) {
    throw new Error('release exception set drift');
  }
  const recipeException = exceptions.find((entry) => entry.code === requiredRecipeException.code);
  if (recipeException?.recipeId !== requiredRecipeException.recipeId) throw new Error(`${requiredRecipeException.code} recipe drift`);
}

export async function compileRefreshCatalog(recipes: readonly RefreshRecipe[]): Promise<{
  recipes: RuntimeRecipe[];
  provisionalRuntimeProjectionFingerprint: string;
}> {
  assertRefreshCatalog(recipes);
  const runtime = recipes.map((recipe) => {
    const compiled = compileRefreshRecipe(recipe);
    assertNutritionAgreement(recipe, compiled);
    return compiled;
  });
  return { recipes: runtime, provisionalRuntimeProjectionFingerprint: await fingerprintRecipes(runtime) };
}

export function nutrientsOrEmpty(value: RefreshNutrients | null | undefined): RefreshNutrients {
  return value ?? emptyNutrients();
}
