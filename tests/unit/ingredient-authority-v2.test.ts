import { describe, expect, it } from 'vitest';
import { compileReviewedIngredientAuthority, IngredientReviewDecisionSchema } from '../../packages/recipes/src/ingredient-authority-v2';

const concept = { provisionalId: 'ING_ENR_GARLIC', sourceNames: ['Tỏi'] };
const review = { basis: 'fixture human review', evidenceReference: 'fixture:review-1' };

describe('Ingredient authority V2 promotion gate', () => {
  it('does not create a master row from a generated name alone', () => {
    expect(() => compileReviewedIngredientAuthority([concept], [], new Set(['GARLIC']))).toThrow(/INGREDIENT_RECONCILIATION_INCOMPLETE/);
    expect(() => compileReviewedIngredientAuthority([concept], [{ ...concept, sourceName: 'Tỏi', decision: 'REVIEWED_NEW_CONCEPT', targetId: concept.provisionalId, review: null }], new Set())).toThrow(/review evidence/);
  });

  it('requires a reviewed new concept and forbids ID collision', () => {
    const decision = IngredientReviewDecisionSchema.parse({ provisionalId: concept.provisionalId, sourceName: 'Tỏi',
      decision: 'REVIEWED_NEW_CONCEPT', targetId: concept.provisionalId, review });
    expect(compileReviewedIngredientAuthority([concept], [decision], new Set()).masterRows).toEqual([{ id: concept.provisionalId, name: 'Tỏi', review }]);
    expect(() => compileReviewedIngredientAuthority([concept], [decision], new Set([concept.provisionalId]))).toThrow(/INGREDIENT_ID_COLLISION/);
  });

  it('routes reviewed aliases to an existing ID, never to a provisional ID', () => {
    const decision = IngredientReviewDecisionSchema.parse({ provisionalId: concept.provisionalId, sourceName: 'Tỏi',
      decision: 'ALIAS_EXISTING', targetId: 'GARLIC', review });
    expect(compileReviewedIngredientAuthority([concept], [decision], new Set(['GARLIC']))).toEqual({
      masterRows: [], aliases: [{ sourceId: concept.provisionalId, canonicalId: 'GARLIC', review }],
    });
    expect(() => compileReviewedIngredientAuthority([concept], [{ ...decision, targetId: 'ING_ENR_OTHER' }], new Set(['ING_ENR_OTHER']))).toThrow(/provisional ID/);
    expect(() => compileReviewedIngredientAuthority([concept], [decision], new Set())).toThrow(/UNREVIEWED_ALIAS_TARGET/);
  });

  it('rejects unresolved, duplicate and forged identity decisions', () => {
    expect(() => compileReviewedIngredientAuthority([concept], [{ provisionalId: concept.provisionalId, sourceName: 'Tỏi',
      decision: 'POSSIBLE_DUPLICATE', targetId: null, review: null }], new Set())).toThrow(/INGREDIENT_RECONCILIATION_INCOMPLETE/);
    expect(() => compileReviewedIngredientAuthority([concept], [{ provisionalId: concept.provisionalId, sourceName: 'Other',
      decision: 'REVIEWED_NEW_CONCEPT', targetId: concept.provisionalId, review }], new Set())).toThrow(/INGREDIENT_RECONCILIATION_INCOMPLETE/);
    expect(() => compileReviewedIngredientAuthority([concept, concept], [{ provisionalId: concept.provisionalId, sourceName: 'Tỏi',
      decision: 'REVIEWED_NEW_CONCEPT', targetId: concept.provisionalId, review }], new Set())).toThrow(/INGREDIENT_RECONCILIATION_INCOMPLETE/);
  });
});
