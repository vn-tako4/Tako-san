import type { RefreshIngredient, RefreshRecipe } from './refresh/schema';
import { runtimeExclusionFromSource } from './refresh/compiler';

export type UnitClass = 'deterministic_physical' | 'count' | 'package' | 'cultural_measure' | 'qualitative' | 'process_description' | 'other_review_required';
export type TransformationClass = 'DIRECT_EXACT_UNIT' | 'EXACT_METRIC_CONVERSION' | 'COUNT_UNIT_COMPATIBLE'
  | 'QUALITATIVE_ONLY' | 'PROCESS_ONLY' | 'PACKAGE_SEMANTICS' | 'CULTURAL_MEASURE_REVIEW_REQUIRED'
  | 'MISSING_PURCHASE_QUANTITY' | 'PROVISIONAL_INGREDIENT_ID' | 'OTHER_REVIEW_REQUIRED';

export function classifySourceUnit(unit: string): UnitClass {
  const text = unit.normalize('NFKC').trim().toLowerCase();
  if (/^(?:g|kg|ml|l|lit|lít)$/u.test(text)) return 'deterministic_physical';
  if (/^(?:piece|slice|bunch|quả|qua|trái|củ|cu|tép|tep|cây|cay|nhánh|nhanh|lá|la|cái|cai|con|miếng|mieng|lát|lat|viên|thanh|cọng|hạt|đốt|cành|bìa|mớ|bó|bo|ổ|tờ|rễ|khúc|bắp|đầu|bẹ|tấm|cánh|nụ|đùi)(?:\s|\(|$)/u.test(text)) return 'count';
  if (/^(?:pack|package|gói|goi|hộp|hop|lon|chai|túi|bịch)(?:\s|\(|$)/u.test(text)) return 'package';
  if (/^(?:tbsp|tsp|cup|thìa|muỗng|muong|chén|chen|bát|tô|cốc|bicchiere|nắm|nam|vốc|nhúm|pinch|\/2 muỗng|lần rắc)(?:\s|\(|$)/u.test(text)) return 'cultural_measure';
  if (/(?:vừa đủ|tùy|tuỳ|to taste|as needed|some|^ít$)/u.test(text)) return 'qualitative';
  if (/(?:chiên|ngâm|luộc|rửa|chần|lót)/u.test(text)) return 'process_description';
  return 'other_review_required';
}

export function classifyTransformation(ingredient: RefreshIngredient): {
  transformationClass: TransformationClass;
  releaseBlocking: boolean;
  exclusionReason: string | null;
} {
  const exclusion = runtimeExclusionFromSource(ingredient);
  if (!exclusion) {
    const unit = ingredient.quantity.kind === 'measured' ? ingredient.quantity.unit.toLowerCase() : '';
    const kind = classifySourceUnit(unit);
    if (/^(?:g|kg|ml|l|piece|pack|bunch|slice)$/u.test(unit)) {
      return { transformationClass: 'DIRECT_EXACT_UNIT', releaseBlocking: false, exclusionReason: null };
    }
    if (kind === 'deterministic_physical') return { transformationClass: 'EXACT_METRIC_CONVERSION', releaseBlocking: false, exclusionReason: null };
    if (kind === 'count') return { transformationClass: 'COUNT_UNIT_COMPATIBLE', releaseBlocking: false, exclusionReason: null };
    if (kind === 'package') return { transformationClass: 'PACKAGE_SEMANTICS', releaseBlocking: true, exclusionReason: null };
    if (kind === 'cultural_measure') return { transformationClass: 'CULTURAL_MEASURE_REVIEW_REQUIRED', releaseBlocking: true, exclusionReason: null };
    return { transformationClass: 'OTHER_REVIEW_REQUIRED', releaseBlocking: true, exclusionReason: null };
  }
  if (!exclusion.requiresReviewedTransformation) return {
    transformationClass: 'PROCESS_ONLY', releaseBlocking: false, exclusionReason: exclusion.reason,
  };
  if (ingredient.quantity.kind === 'qualitative') return {
    transformationClass: 'QUALITATIVE_ONLY', releaseBlocking: true, exclusionReason: exclusion.reason,
  };
  const unitClass = classifySourceUnit(ingredient.quantity.unit);
  const transformationClass: TransformationClass = exclusion.reason === 'estimated_process' || exclusion.reason === 'no_runtime_quantity'
    ? 'MISSING_PURCHASE_QUANTITY'
    : unitClass === 'package' ? 'PACKAGE_SEMANTICS'
      : unitClass === 'cultural_measure' ? 'CULTURAL_MEASURE_REVIEW_REQUIRED'
        : ingredient.reconciliation === 'provisional_new_canonical_id' || ingredient.reconciliation === 'duplicate_alias'
          ? 'PROVISIONAL_INGREDIENT_ID' : 'OTHER_REVIEW_REQUIRED';
  return { transformationClass, releaseBlocking: true, exclusionReason: exclusion.reason };
}

export function auditRuntimeIngredientTransformations(recipes: readonly RefreshRecipe[]) {
  const rows = recipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => {
    const classification = classifyTransformation(ingredient);
    return {
      recipeId: recipe.identity.id,
      position: ingredient.position,
      ingredientId: ingredient.canonicalIngredientId,
      sourceName: ingredient.sourceName,
      sourceQuantity: ingredient.quantity.text,
      sourceUnit: ingredient.quantity.kind === 'measured' ? ingredient.quantity.unit : null,
      unitClass: ingredient.quantity.kind === 'measured' ? classifySourceUnit(ingredient.quantity.unit) : 'qualitative' as const,
      usageRole: ingredient.usageRole,
      includeInShopping: ingredient.includeInShopping,
      currentExclusionReason: classification.exclusionReason,
      transformationClass: classification.transformationClass,
      reviewEvidence: ingredient.review,
      releaseBlocking: classification.releaseBlocking,
    };
  }));
  const excluded = rows.filter((row) => row.currentExclusionReason !== null);
  const required = excluded.filter((row) => row.releaseBlocking);
  const projectedReviewRequired = rows.filter((row) => row.currentExclusionReason === null && row.releaseBlocking);
  const countBy = (values: readonly string[]) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((entry) => entry === value).length]));
  return {
    rows,
    summary: {
      canonicalRows: rows.length,
      currentlyProjected: rows.length - excluded.length,
      currentlyExcluded: excluded.length,
      requiredTransformations: required.length,
      projectedReviewRequired: projectedReviewRequired.length,
      totalReviewRequiredRows: required.length + projectedReviewRequired.length,
      intentionalSemanticExclusions: excluded.length - required.length,
      exclusionReasons: countBy(excluded.map((row) => row.currentExclusionReason!)),
      requiredTransformationClasses: countBy(required.map((row) => row.transformationClass)),
      projectedReviewClasses: countBy(projectedReviewRequired.map((row) => row.transformationClass)),
      unsupportedUnitClasses: countBy(excluded.filter((row) => row.currentExclusionReason === 'unsupported_unit').map((row) => row.unitClass)),
      safelyResolvedExcludedRows: 0,
    },
  };
}
