#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const command = process.argv[2];
if (command !== 'build' && command !== 'check') {
  console.error('usage: runtime-ingredient-v2-audit.mjs build|check');
  process.exit(2);
}
const root = process.cwd();
const dataRoot = path.join(root, 'data/recipe-refresh/v2');
const artifactRoot = path.join(root, 'artifacts/runtime-ingredient-v2');
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const format = (value) => {
  const large = Object.entries(value).find(([, entry]) => Array.isArray(entry) && entry.length > 100);
  if (!large) return `${JSON.stringify(value, null, 2)}\n`;
  const [key, rows] = large;
  const fields = Object.entries(value).filter(([name]) => name !== key)
    .map(([name, entry]) => `  ${JSON.stringify(name)}: ${JSON.stringify(entry, null, 2).replaceAll('\n', '\n  ')}`);
  fields.push(`  ${JSON.stringify(key)}: [\n${rows.map((row) => `    ${JSON.stringify(row)}`).join(',\n')}\n  ]`);
  return `{\n${fields.join(',\n')}\n}\n`;
};
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });

try {
  const { RefreshSourceManifestSchema, RefreshRecipeSchema, fingerprintRefreshArtifact } = await vite.ssrLoadModule('/packages/recipes/src/refresh/index.ts');
  const { auditRuntimeIngredientTransformations, classifySourceUnit } = await vite.ssrLoadModule('/packages/recipes/src/runtime-ingredient-audit.ts');
  const manifest = RefreshSourceManifestSchema.parse(read(path.join(dataRoot, 'manifest.json')));
  const hashes = manifest.fileHashes.map((entry) => ({ path: entry.path,
    sha256: createHash('sha256').update(readFileSync(path.join(dataRoot, entry.path))).digest('hex') }));
  if (JSON.stringify(hashes) !== JSON.stringify(manifest.fileHashes)
    || await fingerprintRefreshArtifact(hashes) !== manifest.canonicalArtifactSha256) {
    throw new Error('canonical source hash drift; run recipe:refresh:check before auditing');
  }
  const recipes = manifest.orderedRecipeIds.map((id) => RefreshRecipeSchema.parse(read(path.join(dataRoot, `recipes/${id}.json`))));
  const audit = auditRuntimeIngredientTransformations(recipes);
  const unitGroups = new Map();
  for (const row of audit.rows.filter((entry) => entry.sourceUnit !== null)) {
    const key = row.sourceUnit;
    const group = unitGroups.get(key) ?? { unitText: key, unitClass: classifySourceUnit(key), count: 0, sampleRecipeIds: [], ingredientExamples: [] };
    group.count++;
    if (!group.sampleRecipeIds.includes(row.recipeId) && group.sampleRecipeIds.length < 5) group.sampleRecipeIds.push(row.recipeId);
    if (!group.ingredientExamples.includes(row.sourceName) && group.ingredientExamples.length < 5) group.ingredientExamples.push(row.sourceName);
    unitGroups.set(key, group);
  }
  const units = [...unitGroups.values()].sort((a, b) => b.count - a.count || compare(a.unitText, b.unitText));
  const existing = new Map();
  for (const recipe of recipes) for (const ingredient of recipe.ingredients) {
    if (ingredient.reconciliation !== 'existing_canonical_id') continue;
    const key = ingredient.sourceName.normalize('NFKC').trim().toLocaleLowerCase();
    const ids = existing.get(key) ?? new Set();
    ids.add(ingredient.canonicalIngredientId);
    existing.set(key, ids);
  }
  const concepts = new Map();
  for (const recipe of recipes) for (const ingredient of recipe.ingredients) {
    if (!ingredient.canonicalIngredientId?.startsWith('ING_ENR_')) continue;
    const id = ingredient.canonicalIngredientId;
    const concept = concepts.get(id) ?? { provisionalId: id, sourceNames: new Set(), recipeIds: new Set(), states: new Set(), review: null };
    concept.sourceNames.add(ingredient.sourceName);
    concept.recipeIds.add(recipe.identity.id);
    concept.states.add(ingredient.reconciliation);
    if (ingredient.review) concept.review = ingredient.review;
    concepts.set(id, concept);
  }
  const authorityQueue = [...concepts.values()].sort((a, b) => compare(a.provisionalId, b.provisionalId)).map((concept) => {
    const names = [...concept.sourceNames].sort(compare);
    const exactNameCandidates = [...new Set(names.flatMap((name) => [...(existing.get(name.normalize('NFKC').trim().toLocaleLowerCase()) ?? [])]))].sort(compare);
    return { provisionalId: concept.provisionalId, sourceNames: names, recipeIds: [...concept.recipeIds].sort(compare),
      currentStates: [...concept.states].sort(compare), exactNameCandidates, review: concept.review,
      decision: concept.review ? 'REVIEW_EVIDENCE_PRESENT_CHECK_MANUALLY' : 'REVIEW_REQUIRED', promotionAllowed: false };
  });
  const nutritionQueue = recipes.filter((recipe) => recipe.nutrition.certification === 'blocked').map((recipe) => ({
    recipeId: recipe.identity.id,
    blockers: recipe.nutrition.blockers.map((blocker) => ({ code: blocker.code, ingredientPosition: blocker.ingredientPosition })),
    candidateAvailable: Object.values(recipe.nutrition.candidatePerServing).some((value) => value !== null),
    certifiedRuntimeMacros: false,
  }));
  const blockerCounts = Object.fromEntries([...new Set(nutritionQueue.flatMap((row) => row.blockers.map((blocker) => blocker.code)))].sort(compare).map((code) => [code,
    nutritionQueue.reduce((count, row) => count + row.blockers.filter((blocker) => blocker.code === code).length, 0)]));
  const lossRecipes = new Set(audit.rows.filter((row) => row.releaseBlocking).map((row) => row.recipeId));
  const sourceQueue = recipes.flatMap((recipe) => recipe.research.sources.map((source) => ({
    recipeId: recipe.identity.id, url: source.url, role: source.role, verification: source.verification,
    verificationEvidence: source.verificationEvidence,
    riskTags: [
      ...(recipe.identity.id === 'vn-bun-01' || recipe.identity.id === 'imp-7d38862afc164a8d' ? ['title_correction'] : []),
      ...(lossRecipes.has(recipe.identity.id) ? ['ingredient_quantity_or_unit'] : []),
      ...(recipe.nutrition.certification === 'blocked' ? ['nutrition_evidence'] : []),
      ...(recipe.audit.schemaRepairs.length > 0 ? ['cooking_steps_or_schema'] : []),
    ],
  })));
  const outputs = {
    'transformation-audit.json': { canonicalSourceSha256: manifest.canonicalArtifactSha256, ...audit },
    'unsupported-unit-inventory.json': { canonicalSourceSha256: manifest.canonicalArtifactSha256, units },
    'ingredient-authority-queue.json': { canonicalSourceSha256: manifest.canonicalArtifactSha256, concepts: authorityQueue },
    'nutrition-remediation-queue.json': { canonicalSourceSha256: manifest.canonicalArtifactSha256, blockerCounts, recipes: nutritionQueue },
    'source-verification-queue.json': { canonicalSourceSha256: manifest.canonicalArtifactSha256, urls: sourceQueue },
  };
  for (const [name, value] of Object.entries(outputs)) {
    const file = path.join(artifactRoot, name);
    const bytes = format(value);
    if (command === 'check') {
      if (readFileSync(file, 'utf8') !== bytes) throw new Error(`${name}: deterministic audit drift`);
    } else {
      mkdirSync(artifactRoot, { recursive: true });
      writeFileSync(file, bytes);
    }
  }
  console.log(`runtime-ingredient-v2-audit=${command}=ok canonical=${audit.summary.canonicalRows} excluded=${audit.summary.currentlyExcluded} review=${audit.summary.requiredTransformations}`);
} finally {
  await vite.close();
}
