import type { StandardUnit } from '../../../domain/src';
import type { RefreshIngredient, RefreshNutrients } from './schema';

const ESTIMATE_PATTERN = /(?:ước|xấp xỉ|khoảng|approx|proxy|đại diện|worker|không cân|không.*định lượng)/iu;
const REVIEWED_DERIVATION_PATTERN = /(?:USDA|FDC|nguồn|công thức|định lượng|household weight|ghi rõ|theo\s|×|=)/iu;
const DEEP_FRY_PATTERN = /(?:chiên ngập|dầu (?:để )?chiên|deep[ -]?fry|frying medium|ngập dầu)/iu;
const EXCLUDED_PROCESS_PATTERN = /(?:lót đáy|lót nồi|môi trường truyền nhiệt)/iu;
const UNRESOLVED_PROCESS_PATTERN = /(?:chỉ dùng cho nước luộc|cho nước luộc|nước chần|nước ngâm|nước rửa|đổ bỏ nước|discard|blanching|soaking liquid|chà.+rửa)/iu;
const GARNISH_PATTERN = /(?:trang trí|rắc khi dọn|rưới khi dọn|garnish)/iu;
const OPTIONAL_PATTERN = /(?:tùy chọn|tuỳ chọn|optional|nếu thích|if desired)/iu;
const EXTRACTION_PATTERN = /(?:xương.+ninh|ninh.+xương|túi gia vị|vớt bỏ|lọc bỏ|marinade.+discard|ướp.+bỏ)/iu;
const MIXED_USAGE_PATTERN = /(?:một nửa|phần còn lại|chia.+(?:phần|nửa)|vừa.+vừa)/iu;
const WATER_PATTERN = /^(?:nước|nước lọc|nước sạch|tap water)(?:\s|$)/iu;
const CONTEXT_PAREN_PATTERN = /(?:cho|dùng|làm|pha|ướp|nêm|trang trí|ăn kèm|tùy chọn|tuỳ chọn|để|nước chấm|sốt|thái|băm|cắt|luộc|hấp|chiên|xào|nướng|rắc|ngâm|chần|đã|giữ lại|rưới cuối)/iu;
const PREPARATION_SUFFIX_PATTERN = /\s*(?:,|—)\s*(?:băm|thái|cắt|bỏ|rút|giữ|còn|đã|để|làm|dùng|ngâm|luộc|hấp|chiên|xào|nướng|gọt|xé)\b.*$/iu;
const TRAILING_PREPARATION_PATTERN = /\s+(?:(?:đã|được)\s+)?(?:băm(?:\s+(?:nhỏ|nhuyễn))?|thái(?:\s+(?:nhỏ|mỏng|lát|sợi|khúc|xéo))?|bào(?:\s+(?:mịn|nhuyễn))?|nạo(?:\s+nhuyễn)?|đập\s+dập|cắt(?:\s+(?:nhỏ|khúc|lát|miếng))?|bóc\s+vỏ|rút\s+chỉ(?:\s+lưng)?|làm\s+sạch|rang|chín|tươi)$/iu;
const PROTEIN_MINCE_PATTERN = /(?:thịt|cá|tôm|mực|gà|bò|heo|lợn).+\bbăm(?:\s+(?:nhỏ|nhuyễn))?$/iu;
const CONCEPT_ALIASES = new Map([
  ['cu rieng', 'riềng'],
  ['củ riềng', 'riềng'],
  ['riềng tươi', 'riềng'],
  ['duong', 'đường'],
  ['duong cat trang', 'đường'],
  ['đường cát', 'đường'],
  ['đường cát trắng', 'đường'],
  ['đường kính', 'đường'],
  ['đường trắng', 'đường'],
  ['ngo tay', 'rau mùi tây'],
  ['mùi tây', 'rau mùi tây'],
  ['ngò tây', 'rau mùi tây'],
  ['ngò tây lá dẹt', 'rau mùi tây'],
  ['bột ngô', 'bột bắp'],
  ['tinh bột ngô', 'bột bắp'],
  ['mè', 'vừng'],
  ['mè rang', 'vừng rang'],
  ['lạc rang', 'đậu phộng rang'],
  ['nuoc loc', 'nước'],
  ['nước lọc', 'nước'],
  ['hanh tim', 'hành tím'],
  ['hành khô', 'hành tím'],
  ['me kho', 'me chua'],
  ['me', 'me chua'],
  ['me chín', 'me chua'],
  ['me vắt', 'me chua'],
  ['cơm me chín', 'me chua'],
  ['nước cốt me', 'me chua'],
  ['riềng (galangal)', 'riềng'],
  ['riềng tươi (galangal)', 'riềng'],
  ['bột bắp (bột ngô)', 'bột bắp'],
  ['bột ngô (bột bắp)', 'bột bắp'],
  ['mè (vừng) rang', 'vừng rang'],
  ['vừng rang (mè rang)', 'vừng rang'],
  ['dứa (khóm)', 'dứa'],
  ['dứa (thơm)', 'dứa'],
  ['thơm (dứa)', 'dứa'],
  ['miso trắng (shiro miso)', 'miso trắng'],
]);

const COUNT_UNIT = /^(?:quả|qua|trái|trai|củ|cu|tép|tep|cây|cay|nhánh|nhanh|lá|la|cái|cai|con|miếng|mieng|viên|thanh|cọng|nụ|cánh|bắp|đùi|ổ|tấm|tờ|rễ|đầu|hạt|tuýp|bìa|bẹ|khúc)(?:\s|\(|$)/iu;
const BUNCH_UNIT = /^(?:bó|bo|mớ|mo)(?:\s|\(|$)/iu;
const SLICE_UNIT = /^(?:lát|lat)(?:\s|\(|$)/iu;
const PACK_UNIT = /^(?:gói|goi|package|pack|hộp|hop)(?:\s|\(|$)/iu;

export function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/gu, ' ') : '';
}

export function normalizedNutritionSource(value: unknown): string {
  return normalizeText(value).replace(/([?&])api_key=DEMO_KEY(?:&|$)/i, '$1').replace(/[?&]$/, '');
}

export function ingredientIdentityName(value: unknown): string {
  let identity = normalizeText(value)
    .replace(/\s*\(([^()]*)\)/gu, (full, content) => CONTEXT_PAREN_PATTERN.test(content) ? '' : full)
    .replace(PREPARATION_SUFFIX_PATTERN, '')
    .trim();
  while (TRAILING_PREPARATION_PATTERN.test(identity) && !PROTEIN_MINCE_PATTERN.test(identity)) {
    identity = identity.replace(TRAILING_PREPARATION_PATTERN, '').trim();
  }
  return identity;
}

export function ingredientConceptKey(value: unknown): string {
  const key = ingredientIdentityName(value).toLowerCase().replace(/\s+/gu, ' ').trim();
  return CONCEPT_ALIASES.get(key) ?? key;
}

export function generatedIngredientResolution(isAlias: boolean): 'duplicate_alias' | 'provisional_new_canonical_id' {
  return isAlias ? 'duplicate_alias' : 'provisional_new_canonical_id';
}

export function nutritionFromRaw(value: unknown): RefreshNutrients | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const nutrient = (key: string): number | null => typeof row[key] === 'number' && Number.isFinite(row[key]) && row[key] >= 0 ? row[key] : null;
  return {
    energyKcal: nutrient('energy_kcal'),
    proteinG: nutrient('protein_g'),
    carbohydrateG: nutrient('carbohydrate_g'),
    fatG: nutrient('fat_g'),
    fiberG: nutrient('fiber_g'),
    sugarG: nutrient('sugar_g'),
    sodiumMg: nutrient('sodium_mg'),
  };
}

function normalizeDirectUnit(unit: string, amount: number): { amount: number; unit: StandardUnit } | null {
  const key = unit.normalize('NFKC').trim().toLowerCase();
  if (key === 'g') return amount >= 1000 && amount % 1000 === 0 ? { amount: amount / 1000, unit: 'kg' } : { amount, unit: 'g' };
  if (key === 'kg') return { amount, unit: 'kg' };
  if (key === 'ml') return amount >= 1000 && amount % 1000 === 0 ? { amount: amount / 1000, unit: 'l' } : { amount, unit: 'ml' };
  if (key === 'l' || key === 'lit' || key === 'lít') return { amount, unit: 'l' };
  if (key === 'piece' || COUNT_UNIT.test(key)) return { amount, unit: 'piece' };
  if (key === 'bunch' || BUNCH_UNIT.test(key)) return { amount, unit: 'bunch' };
  if (key === 'slice' || SLICE_UNIT.test(key)) return { amount, unit: 'slice' };
  if (key === 'pack' || PACK_UNIT.test(key)) return { amount, unit: 'pack' };
  if (key === 'oz') return { amount: Number((amount * 28.349523125).toFixed(6)), unit: 'g' };
  if (key === 'lb') return { amount: Number((amount * 453.59237).toFixed(6)), unit: 'g' };
  return null;
}

export function parseExplicitQuantityText(text: string): { amount: number; unit: StandardUnit } | null {
  const match = text.normalize('NFKC').trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|mL|l|lít|lit)(?:\s|\(|$)/iu);
  if (!match) return null;
  return normalizeDirectUnit(match[2], Number(match[1].replace(',', '.')));
}

export function runtimeQuantity(amount: number, unit: string): { amount: number; unit: StandardUnit } | null {
  return Number.isFinite(amount) && amount > 0 ? normalizeDirectUnit(unit, amount) : null;
}

export function quantityEvidence(basis: string, unit: string): 'source_explicit' | 'reviewed_derived' | 'estimated' | 'missing' {
  if (!basis) return /^(?:g|kg|ml|mL|l|lít|lit)$/iu.test(unit.trim()) ? 'source_explicit' : 'missing';
  if (ESTIMATE_PATTERN.test(basis) || /[~≈]/u.test(basis)) return 'estimated';
  if (/^(?:g|kg|ml|mL|l|lít|lit)$/iu.test(unit.trim()) || REVIEWED_DERIVATION_PATTERN.test(basis)) return 'reviewed_derived';
  return 'missing';
}

export function runtimeQuantityFromEvidence(input: {
  amount: number;
  unit: string;
  gramEquivalent: number | null;
  evidence: 'source_explicit' | 'reviewed_derived' | 'estimated' | 'missing';
}): { amount: number; unit: StandardUnit } | null {
  const direct = runtimeQuantity(input.amount, input.unit);
  if (direct !== null) return direct;
  if (input.evidence !== 'reviewed_derived' || input.gramEquivalent === null || input.gramEquivalent <= 0) return null;
  return { amount: input.gramEquivalent, unit: 'g' };
}

export function classifyIngredientSemantics(input: {
  name: string;
  note: string;
  basis: string;
  optional: boolean;
  qualitative: boolean;
}): Pick<RefreshIngredient, 'usageRole' | 'nutritionRole' | 'includeInShopping' | 'includeInNutrition'> {
  const text = `${input.name} ${input.note} ${input.basis}`;
  const optional = input.optional || OPTIONAL_PATTERN.test(input.name);
  const garnish = GARNISH_PATTERN.test(input.name) || (input.optional && GARNISH_PATTERN.test(input.note));
  const deepFry = DEEP_FRY_PATTERN.test(text);
  const excludedProcess = EXCLUDED_PROCESS_PATTERN.test(text);
  const unresolvedProcess = UNRESOLVED_PROCESS_PATTERN.test(text);
  const extraction = EXTRACTION_PATTERN.test(text);

  if (deepFry) return { usageRole: 'process_only', nutritionRole: 'unresolved_absorption', includeInShopping: true, includeInNutrition: false };
  if ((excludedProcess || unresolvedProcess || extraction) && MIXED_USAGE_PATTERN.test(text)) {
    return { usageRole: 'mixed_process', nutritionRole: 'unresolved_absorption', includeInShopping: true, includeInNutrition: false };
  }
  if (excludedProcess) return { usageRole: 'process_only', nutritionRole: 'excluded_process', includeInShopping: !WATER_PATTERN.test(input.name), includeInNutrition: false };
  if (unresolvedProcess || extraction) return { usageRole: 'process_only', nutritionRole: 'unresolved_absorption', includeInShopping: !WATER_PATTERN.test(input.name), includeInNutrition: false };
  if (garnish) return { usageRole: 'garnish', nutritionRole: 'excluded_optional', includeInShopping: true, includeInNutrition: false };
  if (optional) return { usageRole: 'optional', nutritionRole: 'excluded_optional', includeInShopping: true, includeInNutrition: false };
  if (input.qualitative) return { usageRole: 'qualitative', nutritionRole: 'consumed', includeInShopping: !WATER_PATTERN.test(input.name), includeInNutrition: false };
  return { usageRole: 'consumed', nutritionRole: 'consumed', includeInShopping: !WATER_PATTERN.test(input.name), includeInNutrition: true };
}

export function hasEstimatedQuantity(ingredient: RefreshIngredient): boolean {
  return ingredient.quantity.kind === 'measured' && ingredient.quantity.evidence === 'estimated';
}
