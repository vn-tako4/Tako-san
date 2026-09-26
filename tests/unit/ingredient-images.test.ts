import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FRIGO_ASSETS } from '../../src/web/lib/frigo-assets';
import {
  getIngredientImage,
  listRequiredIconAssets,
} from '../../src/web/lib/ingredient-images';

const A = FRIGO_ASSETS.ingredients as Record<string, Record<string, string>>;

describe('ingredient icon mapping v2 (data-driven)', () => {
  it('matches canonical IDs exactly, case-insensitively', () => {
    expect(getIngredientImage('SALT')).toBe(A.pantry.salt);
    expect(getIngredientImage('salt')).toBe(A.pantry.salt);
    expect(getIngredientImage('BLACK_PEPPER')).toBe(A.pantry.pepper);
    expect(getIngredientImage('SHALLOT')).toBe(A.vegetables.shallot);
  });

  it('prefers specific rules over generic ones (ordering)', () => {
    // cá hồi → salmon, but plain cá → white-fish (old code mapped both to salmon)
    expect(getIngredientImage(undefined, 'Cá hồi')).toBe(A.pantry.salmon);
    expect(getIngredientImage(undefined, 'cá lóc')).toBe(A.pantry['white-fish']);
    // trái bơ → avocado, bơ lạt → butter (old code mapped trái bơ to butter)
    expect(getIngredientImage(undefined, 'trái bơ')).toBe(A.vegetables.avocado);
    expect(getIngredientImage(undefined, 'Bơ lạt')).toBe(A.pantry.butter);
    // dầu mè / dầu hào before generic dầu (old code mapped both to cooking-oil)
    expect(getIngredientImage(undefined, 'dầu mè')).toBe(A.pantry['sesame-oil']);
    expect(getIngredientImage(undefined, 'dầu hào')).toBe(A.pantry['oyster-sauce']);
    expect(getIngredientImage(undefined, 'dầu ăn')).toBe(A.pantry['cooking-oil']);
    // mì chính / khoai mì before mì → noodles
    expect(getIngredientImage(undefined, 'mì chính')).toBe(A.pantry['seasoning-powder']);
    expect(getIngredientImage(undefined, 'khoai mì')).toBe(A.generic['category-vegetable']);
    // nước mắm / nước tương / nước dừa before nước → water; nước màu → other
    expect(getIngredientImage(undefined, 'nước mắm')).toBe(A.pantry['fish-sauce']);
    expect(getIngredientImage(undefined, 'nước màu')).toBe(A.generic['category-other']);
    expect(getIngredientImage(undefined, 'nước lọc')).toBe(A.pantry.water);
    // giò heo → meat before heo → pork; chả cá → white-fish before chả → sausage
    expect(getIngredientImage(undefined, 'giò heo')).toBe(A.generic['category-meat']);
    expect(getIngredientImage(undefined, 'chả cá')).toBe(A.pantry['white-fish']);
    // trứng cá → seafood before trứng → egg
    expect(getIngredientImage(undefined, 'trứng cá')).toBe(A.generic['category-seafood']);
    expect(getIngredientImage(undefined, 'lòng đỏ trứng')).toBe(A.pantry.egg);
  });

  it('matches names that lost diacritics upstream (unaccented phase)', () => {
    expect(getIngredientImage(undefined, 'Dau an')).toBe(A.pantry['cooking-oil']);
    expect(getIngredientImage(undefined, 'Muoi')).toBe(A.pantry.salt);
    expect(getIngredientImage(undefined, 'Tieu xay')).toBe(A.pantry.pepper);
    expect(getIngredientImage(undefined, 'Toi')).toBe(A.vegetables.garlic);
    expect(getIngredientImage(undefined, 'Hanh la')).toBe(A.vegetables.scallion);
    expect(getIngredientImage(undefined, 'Bot ngot')).toBe(A.pantry['seasoning-powder']);
    // 'oc' must not match inside 'nuoc' (word-boundary matching)
    expect(getIngredientImage(undefined, 'Nuoc loc')).toBe(A.pantry.water);
    // 'cat' (cát) must not match 'cật' (kidney → meat)
    expect(getIngredientImage(undefined, 'Duong cat trang')).toBe(A.pantry.sugar);
    // unaccented multi-word phrases that stay unambiguous still resolve
    expect(getIngredientImage(undefined, 'Bo lat')).toBe(A.pantry.butter);
    expect(getIngredientImage(undefined, 'Ca hoi')).toBe(A.pantry.salmon);
    expect(getIngredientImage(undefined, 'Oc huong')).toBe(A.generic['category-seafood']);
  });

  it('never guesses on ambiguous unaccented spellings', () => {
    // bơ/bò, cá/cà, đậu/dầu/dâu — must not pick a wrong icon
    for (const name of ['Ca', 'Dau', 'Bo', 'Com']) {
      const img = getIngredientImage(undefined, name);
      expect(img).not.toBe(A.pantry.butter);
      expect(img).not.toBe(A.pantry.beef);
      expect(img).not.toBe(A.pantry.salmon);
      expect(img).not.toBe(A.pantry['white-fish']);
      expect(img).not.toBe(A.pantry['cooking-oil']);
    }
    // 'Me' (me/mè) and 'chao' (chao/cháo) are ambiguous even as bare
    // keywords: phase 1 must skip them for unaccented input instead of
    // resolving tamarind / tofu.
    expect(getIngredientImage(undefined, 'Me')).toBe(A.generic['category-other']);
    expect(getIngredientImage(undefined, 'me chua')).toBe(A.generic['category-other']);
    expect(getIngredientImage(undefined, 'chao')).toBe(A.generic['category-other']);
    // ...but the accented forms still resolve precisely
    expect(getIngredientImage(undefined, 'mè trắng')).toBe(A.pantry.sesame);
    expect(getIngredientImage(undefined, 'kẹo me')).toBe(A.generic['category-fruit']);
    expect(getIngredientImage(undefined, 'cháo trắng')).toBe(A.pantry['cooked-rice']);
    expect(getIngredientImage(undefined, 'chao môn')).toBe(A.pantry.tofu);
  });

  it('falls back by category instead of always tomato', () => {
    // fake names below contain no Vietnamese word, so no rule may fire
    expect(getIngredientImage(undefined, 'qqqq zzz', 'spice')).toBe(
      A.generic['category-spice'],
    );
    expect(getIngredientImage(undefined, 'qqqq zzz', 'meat')).toBe(
      A.generic['category-meat'],
    );
    expect(getIngredientImage(undefined, 'qqqq zzz', 'seafood')).toBe(
      A.generic['category-seafood'],
    );
    // unknown category → other
    expect(getIngredientImage(undefined, 'qqqq zzz', 'nope')).toBe(
      A.generic['category-other'],
    );
  });

  it('stays backward compatible with old two-arg call sites', () => {
    expect(getIngredientImage('PORK_BELLY')).toBe(A.pantry['pork-belly']);
    expect(getIngredientImage(undefined, 'thịt ba chỉ')).toBe(A.pantry['pork-belly']);
    expect(getIngredientImage(undefined, 'cà chua')).toBe(A.vegetables.tomato);
    // total fallback for the truly unknown: category "other" icon
    // (tomato is only the last resort when an asset key is missing)
    expect(getIngredientImage(undefined, 'zzz-no-such-ingredient')).toBe(
      A.generic['category-other'],
    );
    expect(getIngredientImage()).toBe(A.generic['category-other']);
  });

  it('every asset referenced by the rule table exists in frigo-assets and on disk', () => {
    const required = listRequiredIconAssets();
    // 214 rules share assets; the distinct set must cover all 39 new icons
    expect(required.length).toBeGreaterThan(80);
    const requiredSet = new Set(required);
    const newAssets = [
      // vegetables (+15)
      'vegetables/shallot', 'vegetables/lemongrass', 'vegetables/cilantro',
      'vegetables/vietnamese-coriander', 'vegetables/bean-sprouts',
      'vegetables/bitter-melon', 'vegetables/luffa', 'vegetables/winter-melon',
      'vegetables/zucchini', 'vegetables/galangal', 'vegetables/turmeric',
      'vegetables/leek', 'vegetables/mint', 'vegetables/pineapple',
      'vegetables/white-radish',
      // pantry (+16)
      'pantry/salt', 'pantry/pepper', 'pantry/seasoning-powder', 'pantry/water',
      'pantry/flour', 'pantry/peanut', 'pantry/sesame', 'pantry/honey',
      'pantry/cooking-wine', 'pantry/squid', 'pantry/crab', 'pantry/spare-ribs',
      'pantry/oyster-sauce', 'pantry/sesame-oil', 'pantry/rice-paper',
      'pantry/vinegar',
      // generic (+8)
      'generic/category-vegetable', 'generic/category-spice',
      'generic/category-meat', 'generic/category-seafood',
      'generic/category-fruit', 'generic/category-grain',
      'generic/category-dairy', 'generic/category-other',
    ];
    expect(newAssets).toHaveLength(39);
    for (const path of newAssets) {
      expect(requiredSet.has(path)).toBe(true);
    }
    const missing: string[] = [];
    for (const path of required) {
      const [group, key] = path.split('/');
      const resolved = (FRIGO_ASSETS.ingredients as Record<string, Record<string, string> | undefined>)[group]?.[key];
      if (!resolved) {
        missing.push(`unresolved:${path}`);
        continue;
      }
      const diskPath = join(__dirname, '..', '..', 'public', 'frigo', 'ingredients', `${path}.png`);
      if (!existsSync(diskPath)) missing.push(`missing-file:${path}`);
    }
    expect(missing).toEqual([]);
  });
});
