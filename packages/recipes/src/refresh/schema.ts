import { z } from 'zod';
import { CanonicalIngredientIdSchema, StandardUnitSchema } from '../../../domain/src/foundation';
import { RUNTIME_RECIPE_CUISINES, RUNTIME_RECIPE_REGIONS } from '../runtime-recipe';

const NullableNutrientSchema = z.number().finite().nonnegative().nullable();

export const RefreshNutrientsSchema = z.object({
  energyKcal: NullableNutrientSchema,
  proteinG: NullableNutrientSchema,
  carbohydrateG: NullableNutrientSchema,
  fatG: NullableNutrientSchema,
  fiberG: NullableNutrientSchema,
  sugarG: NullableNutrientSchema,
  sodiumMg: NullableNutrientSchema,
}).strict();

export const RefreshMeasuredQuantitySchema = z.object({
  kind: z.literal('measured'),
  amount: z.number().finite().positive(),
  unit: z.string().trim().min(1),
  text: z.string().trim().min(1),
  gramEquivalent: z.number().finite().nonnegative().nullable(),
  basis: z.string().nullable(),
  evidence: z.enum(['source_explicit', 'reviewed_derived', 'estimated', 'missing']),
  runtime: z.object({
    amount: z.number().finite().positive(),
    unit: StandardUnitSchema,
  }).strict().nullable(),
}).strict();

export const RefreshQualitativeQuantitySchema = z.object({
  kind: z.literal('qualitative'),
  text: z.string().trim().min(1),
  gramEquivalent: z.null(),
  basis: z.string().nullable(),
  evidence: z.literal('missing'),
  runtime: z.null(),
}).strict();

export const RefreshIngredientSchema = z.object({
  position: z.number().int().nonnegative(),
  sourceName: z.string().trim().min(1),
  canonicalIngredientId: CanonicalIngredientIdSchema.nullable(),
  reconciliation: z.enum(['existing_canonical_id', 'reviewed_new_canonical_id', 'provisional_new_canonical_id', 'duplicate_alias', 'ambiguous', 'invalid']),
  reconciliationReason: z.string().trim().min(1),
  review: z.object({ basis: z.string().trim().min(1), evidenceReference: z.string().trim().min(1) }).strict().nullable(),
  usageRole: z.enum(['consumed', 'process_only', 'mixed_process', 'optional', 'garnish', 'qualitative']),
  nutritionRole: z.enum(['consumed', 'excluded_process', 'unresolved_absorption', 'excluded_optional']),
  optional: z.boolean(),
  includeInShopping: z.boolean(),
  includeInNutrition: z.boolean(),
  quantity: z.discriminatedUnion('kind', [RefreshMeasuredQuantitySchema, RefreshQualitativeQuantitySchema]),
  note: z.string().nullable(),
  sourceNutritionPer100g: RefreshNutrientsSchema.nullable(),
  sourceNutritionReference: z.string().nullable(),
  sourceNutritionNote: z.string().nullable(),
}).strict().superRefine((ingredient, ctx) => {
  if ((ingredient.reconciliation === 'reviewed_new_canonical_id') !== (ingredient.review !== null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Reviewed new ingredient ID requires explicit review evidence; other resolutions must not claim it' });
  }
  if (['reviewed_new_canonical_id', 'provisional_new_canonical_id'].includes(ingredient.reconciliation)
    && !ingredient.canonicalIngredientId?.startsWith('ING_ENR_')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'New enrichment identity requires an ING_ENR_ ID' });
  }
});

export const RefreshStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().trim().min(1),
  tip: z.string().trim().min(1).optional(),
  timerMinutes: z.number().finite().nonnegative().optional(),
}).strict();

export const RefreshNutritionSchema = z.object({
  certification: z.enum(['publishable', 'blocked', 'null_truthful']),
  profileId: z.string().nullable(),
  basis: z.literal('per_serving'),
  servings: z.number().int().positive(),
  perServing: RefreshNutrientsSchema,
  candidatePerServing: RefreshNutrientsSchema,
  originalPerServing: RefreshNutrientsSchema,
  blockers: z.array(z.object({
    code: z.string().min(1),
    ingredientPosition: z.number().int().nonnegative().nullable(),
    detail: z.string().min(1),
  }).strict()),
  remediation: z.array(z.string().min(1)),
}).strict().superRefine((nutrition, ctx) => {
  const certifiedValues = Object.values(nutrition.perServing);
  if (nutrition.certification === 'publishable') {
    if (nutrition.profileId === null || certifiedValues.some((value) => value === null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Publishable nutrition requires a profile ID and all seven certified nutrients' });
    }
  } else if (nutrition.profileId !== null || certifiedValues.some((value) => value !== null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Blocked/null nutrition must not expose certified nutrients' });
  }
});

export const RefreshRecipeSchema = z.object({
  schemaVersion: z.literal(2),
  recipeVersion: z.literal(2),
  identity: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
  }).strict(),
  content: z.object({
    description: z.string(),
    cuisine: z.enum(RUNTIME_RECIPE_CUISINES),
    category: z.string().optional(),
    region: z.enum(RUNTIME_RECIPE_REGIONS).optional(),
    cookTimeMinutes: z.number().finite().nonnegative(),
    servings: z.number().int().positive(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.array(z.string()),
  }).strict(),
  research: z.object({
    inputPath: z.string().min(1),
    rawSchemaSignature: z.string().min(1),
    sources: z.array(z.object({
      url: z.string().url(),
      role: z.enum(['declared', 'supporting', 'exception']),
      verification: z.enum(['structurally_valid', 'content_verified']),
      verificationEvidence: z.string().trim().min(1).nullable(),
      note: z.string().nullable(),
    }).strict().superRefine((source, ctx) => {
      if ((source.verification === 'content_verified') !== (source.verificationEvidence !== null)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Content verification requires URL-specific evidence' });
      }
    })),
    notes: z.array(z.string()),
  }).strict(),
  ingredients: z.array(RefreshIngredientSchema),
  steps: z.array(RefreshStepSchema).min(1),
  nutrition: RefreshNutritionSchema,
  media: z.object({
    sourceImageUrl: z.string().nullable(),
    legacyRuntimeImageUrl: z.string(),
    canonicalStatus: z.literal('source_metadata_only'),
  }).strict(),
  audit: z.object({
    schemaRepairs: z.array(z.string()),
    encodingRepairs: z.array(z.string()),
    runtimeExcludedIngredientPositions: z.array(z.number().int().nonnegative()),
    runtimeExclusions: z.array(z.object({
      position: z.number().int().nonnegative(),
      reason: z.enum(['unsupported_unit', 'qualitative_quantity', 'process_only', 'estimated_process', 'no_runtime_quantity', 'non_shopping', 'other']),
      requiresReviewedTransformation: z.boolean(),
    }).strict()),
  }).strict(),
}).strict();

export type RefreshNutrients = z.infer<typeof RefreshNutrientsSchema>;
export type RefreshIngredient = z.infer<typeof RefreshIngredientSchema>;
export type RefreshRecipe = z.infer<typeof RefreshRecipeSchema>;
