import { z } from 'zod';
import { CanonicalIngredientIdSchema, PositiveQuantitySchema, StandardUnitSchema } from '../../domain/src/foundation';
import type { RefreshIngredient } from './refresh/schema';

const MeasuredStandardQuantitySchema = z.object({
  amount: PositiveQuantitySchema,
  unit: StandardUnitSchema,
}).strict();

const ScalingSchema = z.enum(['proportional', 'fixed', 'unresolved']);
const EvidenceSchema = z.object({
  basis: z.string().trim().min(1),
  reference: z.string().trim().min(1),
}).strict();

export const RuntimeIngredientV2Schema = z.object({
  sourcePosition: z.number().int().nonnegative(),
  ingredientId: CanonicalIngredientIdSchema,
  name: z.string().trim().min(1),
  optional: z.boolean(),
  authority: z.enum(['existing', 'reviewed_new', 'provisional']),
  authorityEvidence: EvidenceSchema.nullable(),
  display: z.object({ text: z.string().trim().min(1), scaling: ScalingSchema }).strict(),
  shopping: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none'), reason: z.enum(['process_water', 'reviewed_non_shopping']), evidence: EvidenceSchema.nullable() }).strict(),
    z.object({ kind: z.literal('unresolved'), text: z.string().trim().min(1), reason: z.string().trim().min(1) }).strict(),
    z.object({ kind: z.literal('measured'), quantity: MeasuredStandardQuantitySchema, scaling: ScalingSchema, conversionEvidence: EvidenceSchema.nullable() }).strict(),
  ]),
  process: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none') }).strict(),
    z.object({ kind: z.literal('qualitative'), text: z.string().trim().min(1) }).strict(),
    z.object({ kind: z.literal('measured'), amount: PositiveQuantitySchema, unitText: z.string().trim().min(1), scaling: ScalingSchema }).strict(),
  ]),
  consumed: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('excluded_process') }).strict(),
    z.object({ kind: z.literal('unknown'), reason: z.string().trim().min(1) }).strict(),
    z.object({ kind: z.literal('measured'), quantity: MeasuredStandardQuantitySchema, evidence: EvidenceSchema }).strict(),
  ]),
}).strict().superRefine((line, ctx) => {
  if (line.authority === 'reviewed_new' && line.authorityEvidence === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'reviewed authority requires evidence' });
  }
  if (line.shopping.kind === 'none' && line.shopping.reason === 'process_water'
    && (line.process.kind === 'none' || !/^(?:nước|nước lọc|nước sạch|tap water)(?:\s|$)/iu.test(line.name))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'process water exclusion requires water identity and process quantity' });
  }
  if (line.consumed.kind === 'excluded_process' && line.process.kind === 'none') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'excluded process consumption requires process use' });
  }
});

export type RuntimeIngredientV2 = z.infer<typeof RuntimeIngredientV2Schema>;

export class RuntimeIngredientProjectionBlockedError extends Error {
  readonly code = 'RUNTIME_INGREDIENT_V2_PROJECTION_BLOCKED';
  constructor(readonly reasons: readonly string[]) {
    super(`RUNTIME_INGREDIENT_V2_PROJECTION_BLOCKED: ${reasons.join(', ')}`);
  }
}

/** Source preservation is not an authority promotion or a claim about edible yield. */
export function ingredientV2FromRefresh(source: RefreshIngredient): RuntimeIngredientV2 {
  if (!source.canonicalIngredientId) throw new RuntimeIngredientProjectionBlockedError(['MISSING_INGREDIENT_ID']);
  const measured = source.quantity.kind === 'measured';
  const processUse = source.usageRole === 'process_only' || source.usageRole === 'mixed_process';
  const sourceUnitIsPhysical = source.quantity.kind === 'measured'
    && /^(?:g|kg|ml|l|lit|lít)$/iu.test(source.quantity.unit.trim());
  const process: RuntimeIngredientV2['process'] = !processUse ? { kind: 'none' }
    : source.quantity.kind === 'measured' ? { kind: 'measured', amount: source.quantity.amount, unitText: source.quantity.unit, scaling: 'unresolved' }
      : { kind: 'qualitative', text: source.quantity.text };
  const shopping: RuntimeIngredientV2['shopping'] = !source.includeInShopping
    ? { kind: 'none', reason: processUse && /^(?:nước|nước lọc|nước sạch|tap water)(?:\s|$)/iu.test(source.sourceName)
      ? 'process_water' : 'reviewed_non_shopping', evidence: null }
    : measured && sourceUnitIsPhysical && source.quantity.runtime !== null
      && source.quantity.evidence === 'source_explicit'
      ? { kind: 'measured', quantity: source.quantity.runtime, scaling: processUse ? 'unresolved' : 'proportional', conversionEvidence: null }
      : { kind: 'unresolved', text: source.quantity.text, reason: measured ? 'unsupported_or_unevidenced_purchase_unit' : 'qualitative_purchase_quantity' };
  const consumed: RuntimeIngredientV2['consumed'] = source.nutritionRole === 'excluded_process'
    ? { kind: 'excluded_process' }
    : { kind: 'unknown', reason: source.nutritionRole === 'unresolved_absorption' ? 'absorption_unknown' : 'edible_quantity_not_independently_certified' };
  const authority = source.reconciliation === 'existing_canonical_id' ? 'existing'
    : source.reconciliation === 'reviewed_new_canonical_id' && source.review !== null ? 'reviewed_new' : 'provisional';
  return RuntimeIngredientV2Schema.parse({
    sourcePosition: source.position,
    ingredientId: source.canonicalIngredientId,
    name: source.sourceName,
    optional: source.optional,
    authority,
    authorityEvidence: source.review ? { basis: source.review.basis, reference: source.review.evidenceReference } : null,
    display: { text: source.quantity.text, scaling: 'unresolved' },
    shopping,
    process,
    consumed,
  });
}

export function projectV1ShoppingRequirements(sourceIngredients: readonly RefreshIngredient[], lines: readonly RuntimeIngredientV2[]): Array<{
  ingredientId: string; name: string; requiredQuantity: number; unit: z.infer<typeof StandardUnitSchema>; isOptional: boolean;
}> {
  const reasons: string[] = [];
  const projected = [];
  const sourceByPosition = new Map(sourceIngredients.map((source) => [source.position, source]));
  if (sourceByPosition.size !== sourceIngredients.length || lines.length !== sourceIngredients.length
    || new Set(lines.map((line) => line.sourcePosition)).size !== lines.length) {
    throw new RuntimeIngredientProjectionBlockedError(['SOURCE_LINE_COVERAGE_DRIFT']);
  }
  for (const raw of lines) {
    const line = RuntimeIngredientV2Schema.parse(raw);
    const prefix = `position:${line.sourcePosition}`;
    const source = sourceByPosition.get(line.sourcePosition);
    if (!source || line.name !== source.sourceName || line.ingredientId !== source.canonicalIngredientId) {
      reasons.push(`${prefix}:SOURCE_LINE_IDENTITY_DRIFT`);
      continue;
    }
    if (source.includeInShopping !== (line.shopping.kind !== 'none')) reasons.push(`${prefix}:SHOPPING_SEMANTIC_DRIFT`);
    const expectedAuthority = source.reconciliation === 'existing_canonical_id' ? 'existing'
      : source.reconciliation === 'reviewed_new_canonical_id' && source.review !== null ? 'reviewed_new' : 'provisional';
    if (line.authority !== expectedAuthority) reasons.push(`${prefix}:UNREVIEWED_INGREDIENT_PROMOTION`);
    if (line.shopping.kind === 'none') {
      if (line.shopping.reason !== 'process_water' && line.shopping.evidence === null) reasons.push(`${prefix}:UNREVIEWED_NON_SHOPPING_EXCLUSION`);
      continue;
    }
    if (line.authority === 'provisional') reasons.push(`${prefix}:PROVISIONAL_INGREDIENT_AUTHORITY`);
    if (line.shopping.kind === 'unresolved') { reasons.push(`${prefix}:UNRESOLVED_SHOPPING_QUANTITY`); continue; }
    const runtime = source.quantity.runtime;
    if (source.quantity.kind !== 'measured' || source.quantity.evidence !== 'source_explicit'
      || runtime === null || runtime.amount !== line.shopping.quantity.amount || runtime.unit !== line.shopping.quantity.unit) {
      if (line.shopping.conversionEvidence === null) reasons.push(`${prefix}:UNREVIEWED_PURCHASE_CONVERSION`);
    }
    if (line.shopping.scaling === 'unresolved') { reasons.push(`${prefix}:UNRESOLVED_SERVINGS_SCALING`); continue; }
    projected.push({ ingredientId: line.ingredientId, name: line.name,
      requiredQuantity: line.shopping.quantity.amount, unit: line.shopping.quantity.unit, isOptional: line.optional });
  }
  if (reasons.length > 0 || projected.length === 0) {
    throw new RuntimeIngredientProjectionBlockedError(reasons.length > 0 ? reasons : ['NO_SHOPPING_REQUIREMENTS']);
  }
  return projected;
}

export function scaleIngredientV2(line: RuntimeIngredientV2, factor: number): RuntimeIngredientV2 {
  if (!Number.isFinite(factor) || factor <= 0) throw new RangeError('servings factor must be positive and finite');
  const source = RuntimeIngredientV2Schema.parse(line);
  const scale = (amount: number, policy: z.infer<typeof ScalingSchema>) => policy === 'proportional' ? amount * factor : amount;
  if (factor !== 1 && (source.shopping.kind === 'measured' && source.shopping.scaling === 'unresolved'
    || source.process.kind === 'measured' && source.process.scaling === 'unresolved')) {
    throw new RuntimeIngredientProjectionBlockedError([`position:${source.sourcePosition}:UNRESOLVED_SERVINGS_SCALING`]);
  }
  const shopping = source.shopping.kind === 'measured' ? { ...source.shopping,
    quantity: { ...source.shopping.quantity, amount: scale(source.shopping.quantity.amount, source.shopping.scaling) } } : source.shopping;
  const process = source.process.kind === 'measured' ? { ...source.process,
    amount: scale(source.process.amount, source.process.scaling) } : source.process;
  // Display text is never rewritten into a fabricated culinary amount.
  return RuntimeIngredientV2Schema.parse({ ...source, shopping, process });
}
