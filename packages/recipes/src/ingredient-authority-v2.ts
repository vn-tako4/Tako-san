import { z } from 'zod';
import { CanonicalIngredientIdSchema } from '../../domain/src/foundation';
import { RefreshReleaseBlockedError } from './refresh/release';

const NewIdSchema = CanonicalIngredientIdSchema.refine((id) => id.startsWith('ING_ENR_'), 'new concept must retain its provisional ING_ENR_ ID');
export const IngredientReviewDecisionSchema = z.object({
  provisionalId: NewIdSchema,
  sourceName: z.string().trim().min(1),
  decision: z.enum(['MATCH_EXISTING', 'ALIAS_EXISTING', 'REVIEWED_NEW_CONCEPT', 'POSSIBLE_DUPLICATE', 'AMBIGUOUS', 'INVALID']),
  targetId: CanonicalIngredientIdSchema.nullable(),
  review: z.object({ basis: z.string().trim().min(1), evidenceReference: z.string().trim().min(1) }).strict().nullable(),
}).strict().superRefine((row, ctx) => {
  const resolved = ['MATCH_EXISTING', 'ALIAS_EXISTING', 'REVIEWED_NEW_CONCEPT'].includes(row.decision);
  if (resolved !== (row.review !== null) || resolved !== (row.targetId !== null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'resolved identity requires explicit review evidence and target' });
  }
  if (row.decision === 'REVIEWED_NEW_CONCEPT' && row.targetId !== row.provisionalId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'reviewed new concept must retain its provisional ID' });
  }
  if ((row.decision === 'MATCH_EXISTING' || row.decision === 'ALIAS_EXISTING') && row.targetId?.startsWith('ING_ENR_')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'existing/alias target cannot be a provisional ID' });
  }
});
export type IngredientReviewDecision = z.infer<typeof IngredientReviewDecisionSchema>;

export function compileReviewedIngredientAuthority(
  concepts: readonly { provisionalId: string; sourceNames: readonly string[] }[],
  decisions: readonly IngredientReviewDecision[],
  existingIds: ReadonlySet<string>,
): { masterRows: Array<{ id: string; name: string; review: NonNullable<IngredientReviewDecision['review']> }>;
  aliases: Array<{ sourceId: string; canonicalId: string; review: NonNullable<IngredientReviewDecision['review']> }> } {
  const parsed = decisions.map((decision) => IngredientReviewDecisionSchema.parse(decision));
  const byId = new Map(parsed.map((decision) => [decision.provisionalId, decision]));
  if (byId.size !== parsed.length || byId.size !== concepts.length) {
    throw new RefreshReleaseBlockedError(['INGREDIENT_RECONCILIATION_INCOMPLETE']);
  }
  const masterRows: Array<{ id: string; name: string; review: NonNullable<IngredientReviewDecision['review']> }> = [];
  const aliases: Array<{ sourceId: string; canonicalId: string; review: NonNullable<IngredientReviewDecision['review']> }> = [];
  for (const concept of concepts) {
    const decision = byId.get(concept.provisionalId);
    if (!decision || !concept.sourceNames.includes(decision.sourceName)
      || !decision.targetId || !decision.review
      || ['POSSIBLE_DUPLICATE', 'AMBIGUOUS', 'INVALID'].includes(decision.decision)) {
      throw new RefreshReleaseBlockedError(['INGREDIENT_RECONCILIATION_INCOMPLETE']);
    }
    if (decision.decision === 'REVIEWED_NEW_CONCEPT') {
      if (existingIds.has(decision.targetId)) throw new RefreshReleaseBlockedError(['INGREDIENT_ID_COLLISION']);
      masterRows.push({ id: decision.targetId, name: decision.sourceName, review: decision.review });
    } else {
      if (!existingIds.has(decision.targetId)) throw new RefreshReleaseBlockedError(['UNREVIEWED_ALIAS_TARGET']);
      aliases.push({ sourceId: decision.provisionalId, canonicalId: decision.targetId, review: decision.review });
    }
  }
  return { masterRows: masterRows.sort((a, b) => a.id.localeCompare(b.id)), aliases: aliases.sort((a, b) => a.sourceId.localeCompare(b.sourceId)) };
}
