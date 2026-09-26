import { FRIGO_ASSETS } from './frigo-assets';
import RULES_DATA from './ingredient-icon-rules.json';

type IngredientIconRule = {
  /** Canonical ingredient IDs — exact match, case-insensitive. */
  ids?: string[];
  /** Vietnamese name fragments — case-insensitive substring. */
  keywords?: string[];
  /** Path under FRIGO_ASSETS.ingredients, e.g. 'vegetables/tomato'. */
  asset: string;
};

type IconRulesFile = {
  version: number;
  rules: IngredientIconRule[];
  categoryFallback: Record<string, string>;
};

const { rules: ICON_RULES, categoryFallback: CATEGORY_FALLBACK } =
  RULES_DATA as IconRulesFile;

function resolveAsset(path: string): string | undefined {
  const [group, key] = path.split('/');
  const bucket = (FRIGO_ASSETS.ingredients as Record<string, Record<string, string> | undefined>)[group];
  return bucket?.[key];
}

/**
 * Strip Vietnamese diacritics for lenient matching.
 * Some ingredient rows lost their accents upstream ("Dau an", "Muoi", "Toi").
 */
function normalizeVi(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Phase-2 (unaccented) keyword index.
 * A normalized keyword is usable only when it is unambiguous — i.e. every
 * rule using that normalized form points to the same asset. Ambiguous ones
 * ('bo' = bơ/bò, 'ca' = cá/cà, 'dau' = đậu/dầu/dâu, 'chao' = chao/cháo,
 * 'cat' = cát/cật …) are dropped so an unaccented name never picks the
 * wrong icon.
 *
 * Matching is word-boundary based: short keywords like 'oc' (ốc) must not
 * fire inside 'nuoc' (nước).
 */
type Phase2Entry = { pattern: RegExp; asset: string };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPhase2Index(): { index: Phase2Entry[]; ambiguous: Set<string> } {
  const assetByNorm = new Map<string, Set<string>>();
  for (const rule of ICON_RULES) {
    for (const k of rule.keywords ?? []) {
      const n = normalizeVi(k.toLowerCase());
      if (!assetByNorm.has(n)) assetByNorm.set(n, new Set());
      assetByNorm.get(n)!.add(rule.asset);
    }
  }
  // Normalized forms claimed by more than one asset (bo = bơ/bò, ca = cá/cà,
  // dau = đậu/dầu/dâu, me = me/mè, chao = chao/cháo, cat = cát/cật …) must
  // never resolve an unaccented name to a possibly-wrong icon.
  const ambiguous = new Set<string>();
  for (const [n, assets] of assetByNorm) {
    if (assets.size > 1) ambiguous.add(n);
  }
  const index: Phase2Entry[] = [];
  for (const rule of ICON_RULES) {
    for (const k of rule.keywords ?? []) {
      const n = normalizeVi(k.toLowerCase());
      if (!ambiguous.has(n)) {
        index.push({
          pattern: new RegExp(`\\b${escapeRegExp(n)}\\b`),
          asset: rule.asset,
        });
      }
    }
  }
  return { index, ambiguous };
}

const { index: PHASE2_INDEX, ambiguous: AMBIGUOUS_NORM } = buildPhase2Index();

function matchRule(
  cleanId: string,
  cleanName: string,
  normName: string,
): string | undefined {
  // When the input itself lost all diacritics, a bare (unaccented) keyword
  // whose normalized form is ambiguous (me = me/mè, chao = chao/cháo) must
  // not match in phase 1 either — an unaccented name never guesses.
  const inputBare = !!cleanName && normalizeVi(cleanName) === cleanName;
  for (const rule of ICON_RULES) {
    if (
      cleanId &&
      rule.ids?.some((id) => id.toUpperCase() === cleanId)
    ) {
      const hit = resolveAsset(rule.asset);
      if (hit) return hit;
    }
    if (
      cleanName &&
      rule.keywords?.some((k) => {
        const kl = k.toLowerCase();
        if (inputBare && AMBIGUOUS_NORM.has(normalizeVi(kl))) return false;
        return cleanName.includes(kl);
      })
    ) {
      const hit = resolveAsset(rule.asset);
      if (hit) return hit;
    }
  }
  // Phase 2: unaccented fallback for rows that lost diacritics upstream.
  // Runs whenever phase 1 found nothing — the input itself may already be
  // unaccented ("Dau an"), in which case normalization is a no-op but the
  // normalized keyword index is still the right thing to match against.
  if (normName) {
    for (const { pattern, asset } of PHASE2_INDEX) {
      if (pattern.test(normName)) {
        const hit = resolveAsset(asset);
        if (hit) return hit;
      }
    }
  }
  return undefined;
}

/**
 * Data-driven replacement for the old if-chain.
 *
 * Matching order (first win):
 *  1. Exact canonical ingredient ID (case-insensitive).
 *  2. Vietnamese name substring — rules are ordered most-specific-first,
 *     e.g. 'cá hồi' → salmon before 'cá' → white-fish,
 *     'dầu mè' → sesame-oil before 'dầu' → cooking-oil.
 *  2b. Same as (2) but diacritics-insensitive, for rows that lost accents
 *      upstream; ambiguous spellings (bơ/bò, cá/cà, đậu/dầu…) stay unmatched.
 *      When the input itself has no diacritics, phase (2) additionally skips
 *      bare keywords whose normalized form is ambiguous (me = me/mè,
 *      chao = chao/cháo), so an unaccented name never guesses a wrong icon.
 *  3. Category fallback icon (new optional param) instead of always tomato.
 *  4. Tomato only as a last resort if frigo-assets.ts is missing an entry.
 *
 * The rule table lives in ingredient-icon-rules.json (single source of truth,
 * shared with audit-icon-coverage.py). Do not hand-edit order here.
 */
export function getIngredientImage(
  ingredientId?: string,
  name?: string,
  category?: string,
): string {
  const cleanId = (ingredientId || '').trim().toUpperCase();
  const cleanName = (name || '').trim().toLowerCase();

  const hit = matchRule(cleanId, cleanName, normalizeVi(cleanName));
  if (hit) return hit;

  const cat = (category || 'other').trim().toLowerCase();
  const fallbackPath = CATEGORY_FALLBACK[cat] ?? CATEGORY_FALLBACK.other;
  return (
    resolveAsset(fallbackPath) ??
    resolveAsset('vegetables/tomato') ??
    ''
  );
}

/** Every asset path referenced by the rule table — useful for a build-time
 *  check that frigo-assets.ts actually declares them all. */
export function listRequiredIconAssets(): string[] {
  const seen = new Set<string>();
  for (const rule of ICON_RULES) seen.add(rule.asset);
  for (const path of Object.values(CATEGORY_FALLBACK)) seen.add(path);
  return [...seen].sort();
}
