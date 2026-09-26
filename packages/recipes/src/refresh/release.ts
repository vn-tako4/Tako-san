import { z } from 'zod';
import { CanonicalIngredientIdSchema } from '../../../domain/src/foundation';
import type { RefreshRecipe } from './schema';
import { runtimeExclusionFromSource, runtimeIngredientFromSource } from './compiler';

export const RefreshReleaseBlockerSchema = z.enum([
  'RUNTIME_PROJECTION_LOSS',
  'INGREDIENT_RECONCILIATION_INCOMPLETE',
  'SOURCE_CONTENT_VERIFICATION_INCOMPLETE',
  'NUTRITION_EVIDENCE_INCOMPLETE',
]);

export const RefreshReleaseEligibilitySchema = z.object({
  canonicalSourceReady: z.literal(true),
  runtimeProjectionReady: z.boolean(),
  productionReleaseReady: z.boolean(),
  nutritionCanonicalized: z.literal(true),
  nutritionReleaseCoverageIncomplete: z.boolean(),
  blockers: z.array(RefreshReleaseBlockerSchema),
  finalRuntimeFingerprint: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
}).strict().superRefine((value, ctx) => {
  if (value.productionReleaseReady && (value.blockers.length > 0 || !value.runtimeProjectionReady || value.nutritionReleaseCoverageIncomplete)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'release readiness disagrees with blockers and coverage' });
  }
  if (value.productionReleaseReady !== (value.finalRuntimeFingerprint !== null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'final fingerprint requires production release readiness' });
  }
  if (value.blockers.includes('RUNTIME_PROJECTION_LOSS') === value.runtimeProjectionReady) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'runtime projection readiness disagrees with loss blocker' });
  }
  if (value.blockers.includes('NUTRITION_EVIDENCE_INCOMPLETE') !== value.nutritionReleaseCoverageIncomplete) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'nutrition coverage disagrees with blocker' });
  }
  if (new Set(value.blockers).size !== value.blockers.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'duplicate release blocker' });
  }
});

export type RefreshReleaseEligibility = z.infer<typeof RefreshReleaseEligibilitySchema>;

export const RefreshSourceManifestSchema = z.object({
  schemaVersion: z.literal(2),
  sourceStatus: z.literal('RECIPE_REFRESH_V2_RESEARCH_CANONICALIZED'),
  baseReleaseId: z.string().min(1),
  inputArtifact: z.string().min(1),
  inputSha256: z.string().regex(/^[0-9a-f]{64}$/),
  recipeCount: z.literal(500),
  orderedRecipeIds: z.array(z.string().min(1)).length(500),
  ingredientConceptCount: z.number().int().nonnegative(),
  fileHashes: z.array(z.object({ path: z.string().min(1), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict()),
  canonicalArtifactSha256: z.string().regex(/^[0-9a-f]{64}$/),
  provisionalRuntimeProjectionFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
  releaseEligibility: RefreshReleaseEligibilitySchema,
  auditSummary: z.record(z.unknown()),
}).strict();

export const RefreshIngredientReconciliationRowSchema = z.object({
  sourceName: z.string().min(1),
  sourceId: z.string().nullable(),
  nutritionSource: z.string().nullable(),
  canonicalId: CanonicalIngredientIdSchema.nullable(),
  canonicalName: z.string().min(1),
  resolution: z.enum(['existing_canonical_id', 'reviewed_new_canonical_id', 'provisional_new_canonical_id', 'duplicate_alias', 'ambiguous', 'invalid']),
  reason: z.string().min(1),
  review: z.object({ basis: z.string().min(1), evidenceReference: z.string().min(1) }).strict().nullable(),
}).strict().superRefine((row, ctx) => {
  if ((row.resolution === 'reviewed_new_canonical_id') !== (row.review !== null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'reconciliation review evidence drift' });
  }
  if (['reviewed_new_canonical_id', 'provisional_new_canonical_id'].includes(row.resolution)
    && !row.canonicalId?.startsWith('ING_ENR_')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'new reconciliation identity must be ING_ENR_' });
  }
});

export class RefreshReleaseBlockedError extends Error {
  readonly code = 'RECIPE_REFRESH_RELEASE_BLOCKED';
  constructor(readonly blockers: readonly string[]) {
    super(`RECIPE_REFRESH_RELEASE_BLOCKED: ${blockers.join(', ') || 'productionReleaseReady=false'}`);
  }
}

export function deriveRefreshReleaseEligibility(recipes: readonly RefreshRecipe[]): RefreshReleaseEligibility {
  const ingredients = recipes.flatMap((recipe) => recipe.ingredients);
  const runtimeLoss = ingredients.some((ingredient) => runtimeExclusionFromSource(ingredient)?.requiresReviewedTransformation === true)
    || recipes.some((recipe) => recipe.ingredients.every((ingredient) => runtimeIngredientFromSource(ingredient) === null));
  let provisionalAuthority = false;
  try { assertNoProvisionalIngredientAuthority(ingredients); } catch (error) {
    if (!(error instanceof RefreshReleaseBlockedError)) throw error;
    provisionalAuthority = true;
  }
  const sourceGap = recipes.some((recipe) => recipe.research.sources.filter((source) => source.verification === 'content_verified' && source.role === 'declared').length
    < (recipe.identity.id === 'imp-0d6c454ae1073ef6' ? 1 : 2));
  const nutritionGap = recipes.some((recipe) => recipe.nutrition.certification === 'blocked');
  const blockers: z.infer<typeof RefreshReleaseBlockerSchema>[] = [];
  if (runtimeLoss) blockers.push('RUNTIME_PROJECTION_LOSS');
  if (provisionalAuthority) blockers.push('INGREDIENT_RECONCILIATION_INCOMPLETE');
  if (sourceGap) blockers.push('SOURCE_CONTENT_VERIFICATION_INCOMPLETE');
  if (nutritionGap) blockers.push('NUTRITION_EVIDENCE_INCOMPLETE');
  return RefreshReleaseEligibilitySchema.parse({
    canonicalSourceReady: true,
    runtimeProjectionReady: !runtimeLoss,
    productionReleaseReady: false,
    nutritionCanonicalized: true,
    nutritionReleaseCoverageIncomplete: nutritionGap,
    blockers,
    finalRuntimeFingerprint: null,
  });
}

export function assertRefreshReleaseEligible(eligibility: RefreshReleaseEligibility, recipes: readonly RefreshRecipe[], actualRuntimeFingerprint: string): string {
  const parsed = RefreshReleaseEligibilitySchema.parse(eligibility);
  const derived = deriveRefreshReleaseEligibility(recipes);
  if (JSON.stringify(parsed.blockers) !== JSON.stringify(derived.blockers)
    || parsed.runtimeProjectionReady !== derived.runtimeProjectionReady
    || parsed.nutritionReleaseCoverageIncomplete !== derived.nutritionReleaseCoverageIncomplete) {
    throw new RefreshReleaseBlockedError(['RELEASE_ELIGIBILITY_DRIFT']);
  }
  if (!parsed.productionReleaseReady || parsed.blockers.length > 0 || parsed.finalRuntimeFingerprint === null) {
    throw new RefreshReleaseBlockedError(parsed.blockers);
  }
  assertNoProvisionalIngredientAuthority(recipes.flatMap((recipe) => recipe.ingredients));
  if (parsed.finalRuntimeFingerprint !== actualRuntimeFingerprint) {
    throw new RefreshReleaseBlockedError(['FINAL_FINGERPRINT_MISMATCH']);
  }
  return parsed.finalRuntimeFingerprint;
}

type IngredientAuthorityCandidate = {
  canonicalIngredientId?: string | null;
  canonicalId?: string | null;
  reconciliation?: string;
  resolution?: string;
  review: { basis: string; evidenceReference: string } | null;
};

export function assertNoProvisionalIngredientAuthority(ingredients: readonly IngredientAuthorityCandidate[]): void {
  const idOf = (ingredient: IngredientAuthorityCandidate) => ingredient.canonicalIngredientId ?? ingredient.canonicalId ?? null;
  const stateOf = (ingredient: IngredientAuthorityCandidate) => ingredient.reconciliation ?? ingredient.resolution;
  const reviewedIds = new Set(ingredients.filter((ingredient) => stateOf(ingredient) === 'reviewed_new_canonical_id' && ingredient.review !== null)
    .map(idOf));
  for (const ingredient of ingredients) {
    const id = idOf(ingredient);
    const state = stateOf(ingredient);
    if (!id || state === 'ambiguous' || state === 'invalid'
      || (state === 'reviewed_new_canonical_id' && (!id.startsWith('ING_ENR_') || ingredient.review === null))
      || state === 'provisional_new_canonical_id'
      || (id?.startsWith('ING_ENR_') && !reviewedIds.has(id))) {
      throw new RefreshReleaseBlockedError(['INGREDIENT_RECONCILIATION_INCOMPLETE']);
    }
  }
}
