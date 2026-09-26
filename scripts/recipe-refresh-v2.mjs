#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { createServer } from 'vite';

const ROOT = process.cwd();
const DATA_ROOT = path.join(ROOT, 'data', 'recipe-refresh', 'v2');
const RECIPE_ROOT = path.join(DATA_ROOT, 'recipes');
const ARTIFACT_ROOT = path.join(ROOT, 'artifacts', 'recipe-refresh-v2');
const CURRENT_RELEASE = path.join(ROOT, 'packages', 'recipes', 'src', 'import', 'catalog-release.current.json');
const APPROVED_BATCHES = path.join(ROOT, 'data', 'recipe-import', 'approved-batches.json');
const EXPECTED_RECIPE_COUNT = 500;
const SCHEMA_VERSION = 2;
const TITLE_OVERRIDES = new Map([
  ['vn-bun-01', 'Phở bò tái lăn Hà Nội'],
  ['imp-7d38862afc164a8d', 'Mực xào xì dầu kiểu Hàn'],
]);
const KNOWN_SOURCE_EXCEPTION = 'imp-0d6c454ae1073ef6';
const ALLOWED_EXCEPTION_CODES = new Set(['SOURCE_RELEVANCE_EXCEPTION', 'RUNTIME_QUALITATIVE_GAP', 'NUTRITION_EVIDENCE_BLOCKED']);

const args = process.argv.slice(2);
const command = args[0];
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? true : null;
};
if (!['build', 'check', 'release-check'].includes(command)) {
  console.error('usage: recipe-refresh-v2.mjs build --input <tako-enrichment-500-recipes.zip> | check | release-check');
  process.exit(2);
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const write = (file, value) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, typeof value === 'string' ? value : json(value), { encoding: 'utf8', flag: 'w' });
};
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const unique = (values) => [...new Set(values)];
const asObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { ALL_RECIPES } = await vite.ssrLoadModule('/packages/recipes/src/data.ts');
  const factory = await vite.ssrLoadModule('/packages/recipes/src/import/index.ts');
  const refresh = await vite.ssrLoadModule('/packages/recipes/src/refresh/index.ts');
  const { createIngredientResolver } = await vite.ssrLoadModule('/packages/recipes/src/import/ingredients.ts');
  const { normalizeIngredientAlias } = await vite.ssrLoadModule('/packages/domain/src/foundation.ts');

  const loadCurrentRuntimeCatalog = async () => {
    const registry = JSON.parse(readFileSync(APPROVED_BATCHES, 'utf8'));
    const approved = [];
    for (const entry of registry.batches) {
      const bytes = new Uint8Array(readFileSync(path.join(ROOT, entry.source)));
      const result = await factory.compileImportBatch(bytes, factory.importFormatForPath(entry.source), { legacy: ALL_RECIPES, approvedBatches: approved });
      if (!result.ok) throw new Error(`approved batch no longer compiles: ${entry.batchId}`);
      approved.push({ header: result.header, recipes: result.recipes });
    }
    return [...ALL_RECIPES, ...approved.flatMap((batch) => batch.recipes.map((recipe) => recipe.runtime))];
  };

  const currentCatalog = await loadCurrentRuntimeCatalog();
  const currentManifest = JSON.parse(readFileSync(CURRENT_RELEASE, 'utf8'));
  const expectedIds = currentManifest.orderedRecipeIds;
  if (currentCatalog.length !== EXPECTED_RECIPE_COUNT || expectedIds.length !== EXPECTED_RECIPE_COUNT) {
    throw new Error(`current release must contain ${EXPECTED_RECIPE_COUNT} recipes`);
  }

  if (command === 'build') {
    const input = option('--input');
    if (!input || input === true) throw new Error('build requires --input <zip>');
    await build(path.resolve(ROOT, input));
  } else {
    const { manifest, recipes, provisionalRuntimeProjectionFingerprint } = await check();
    if (command === 'release-check') {
      refresh.assertRefreshReleaseEligible(manifest.releaseEligibility, recipes, provisionalRuntimeProjectionFingerprint);
      console.log('recipe-refresh-release-check=ok');
    }
  }

  async function build(inputPath) {
    const inputBytes = readFileSync(inputPath);
    const inputSha256 = sha256(inputBytes);
    const entries = unzipSync(new Uint8Array(inputBytes));
    const rawEntries = Object.entries(entries)
      .filter(([name]) => name.endsWith('.json'))
      .map(([name, bytes]) => ({ name, raw: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) }))
      .sort((left, right) => compare(left.name, right.name));
    if (rawEntries.length !== EXPECTED_RECIPE_COUNT) throw new Error(`ZIP recipe count ${rawEntries.length} != ${EXPECTED_RECIPE_COUNT}`);
    const rawAudit = auditRawEntries(rawEntries);

    const rawById = new Map();
    for (const entry of rawEntries) {
      const id = asObject(entry.raw).recipe_id;
      if (typeof id !== 'string' || !id) throw new Error(`${entry.name}: missing recipe_id`);
      if (rawById.has(id)) throw new Error(`duplicate recipe ID in ZIP: ${id}`);
      rawById.set(id, entry);
    }
    const zipIds = [...rawById.keys()].sort(compare);
    const releaseIds = [...expectedIds].sort(compare);
    if (zipIds.some((id, index) => id !== releaseIds[index])) throw new Error('ZIP IDs do not match current catalog release IDs');

    const resolver = createIngredientResolver();
    const rows = rawEntries.flatMap((entry) => {
      const raw = asObject(entry.raw);
      return Array.isArray(raw.ingredients) ? raw.ingredients.map((ingredient, position) => ({
        recipeId: raw.recipe_id,
        inputPath: entry.name,
        position,
        raw: asObject(ingredient),
      })) : [];
    });

    const nameOwners = new Map();
    for (const row of rows) {
      const name = refresh.normalizeText(row.raw.name);
      const direct = resolver.resolve(name);
      const resolution = direct.status === 'unresolved' ? resolver.resolve(refresh.ingredientIdentityName(name)) : direct;
      if (resolution.status === 'resolved') {
        const key = refresh.ingredientConceptKey(name);
        const bucket = nameOwners.get(key) ?? new Set();
        bucket.add(resolution.ingredientId);
        nameOwners.set(key, bucket);
      }
    }

    const prepared = [];
    const conceptNames = new Map();
    for (const row of rows) {
      const sourceName = refresh.normalizeText(row.raw.name);
      const nutritionSource = refresh.normalizedNutritionSource(row.raw.nutrition_source);
      const exact = resolver.resolve(sourceName);
      const direct = exact.status === 'unresolved' ? resolver.resolve(refresh.ingredientIdentityName(sourceName)) : exact;
      let ingredientId = null;
      let resolution = 'provisional_new_canonical_id';
      let reason = '';
      let conceptKey = '';
      if (!sourceName) {
        resolution = 'invalid';
        reason = 'source ingredient name is empty';
      } else if (direct.status === 'resolved') {
        ingredientId = direct.ingredientId;
        resolution = 'existing_canonical_id';
        reason = exact.status === 'resolved'
          ? `exact ${direct.via} resolution against the reviewed catalog`
          : `context-stripped ${direct.via} resolution against the reviewed catalog`;
      } else if (direct.status === 'ambiguous') {
        resolution = 'ambiguous';
        reason = `exact alias maps to multiple existing canonical IDs: ${direct.candidates.join(', ')}`;
      } else {
        const nameKey = refresh.ingredientConceptKey(sourceName);
        const owners = nameOwners.get(nameKey) ?? new Set();
        if (owners.size === 1) {
          ingredientId = [...owners][0];
          resolution = 'duplicate_alias';
          reason = 'same conservative ingredient-name key as an exact existing canonical alias';
        } else if (owners.size > 1) {
          resolution = 'ambiguous';
          reason = `ingredient-name key maps to multiple existing canonical IDs: ${[...owners].sort(compare).join(', ')}`;
        } else {
          conceptKey = `source-name:${nameKey}`;
          const bucket = conceptNames.get(conceptKey) ?? new Map();
          bucket.set(sourceName, (bucket.get(sourceName) ?? 0) + 1);
          conceptNames.set(conceptKey, bucket);
        }
      }
      prepared.push({ ...row, sourceName, nutritionSource, ingredientId, resolution, reason, conceptKey });
    }

    const concepts = new Map();
    for (const [key, names] of conceptNames) {
      const orderedNames = [...names.entries()].sort((left, right) => right[1] - left[1] || left[0].length - right[0].length || compare(left[0], right[0]));
      concepts.set(key, {
        id: `ING_ENR_${sha256(key).slice(0, 16).toUpperCase()}`,
        canonicalName: orderedNames[0][0],
        aliases: orderedNames.map(([name]) => name),
      });
    }
    for (const row of prepared) {
      if (!row.ingredientId && row.conceptKey) {
        const concept = concepts.get(row.conceptKey);
        row.ingredientId = concept.id;
        const duplicate = normalizeIngredientAlias(row.sourceName) !== normalizeIngredientAlias(concept.canonicalName);
        row.resolution = refresh.generatedIngredientResolution(duplicate);
        row.reason = duplicate ? `provisional alias of ${concept.canonicalName} via the same name key` : 'new deterministic enrichment concept; ingredient authority review pending';
      }
    }

    const preparedByRecipe = new Map();
    for (const row of prepared) {
      const bucket = preparedByRecipe.get(row.recipeId) ?? [];
      bucket.push(row);
      preparedByRecipe.set(row.recipeId, bucket);
    }

    const canonicalRecipes = [];
    const schemaAnomalies = [];
    const sourceQuality = [];
    const nutritionRemediation = [];
    let schemaRepairCount = 0;
    let encodingRepairCount = 0;

    for (const base of currentCatalog) {
      const entry = rawById.get(base.id);
      if (!entry) throw new Error(`missing ZIP recipe: ${base.id}`);
      const raw = asObject(entry.raw);
      const repairs = [];
      const encodingRepairs = [];
      const ingredients = (preparedByRecipe.get(base.id) ?? []).sort((left, right) => left.position - right.position).map((row) => normalizeIngredient(row));
      const steps = normalizeSteps(raw.steps, repairs, encodingRepairs);
      const sources = normalizeSources(base.id, raw, repairs);
      const rawSchemaSignature = Object.keys(raw).sort(compare).join(',');
      const notes = flattenNotes(raw);
      if (base.id === 'vn-bun-01') notes.push('Approved title correction from mission: Phở bò tái lăn Hà Nội.');
      const servings = Number.isInteger(raw.servings) && raw.servings > 0 ? raw.servings : base.servings;
      const nutrition = certifyNutrition(base.id, servings, ingredients, raw.nutrition_computed);
      const title = TITLE_OVERRIDES.get(base.id) ?? base.title;
      const description = refresh.normalizeText(raw.description) || base.description;
      const cookTimeMinutes = finite(raw.total_time_minutes) && raw.total_time_minutes >= 0 ? raw.total_time_minutes : base.cookTimeMinutes;
      const difficulty = ['easy', 'medium', 'hard'].includes(raw.difficulty) ? raw.difficulty : base.difficulty;
      const runtimeExcludedIngredientPositions = ingredients.filter((ingredient) => refresh.runtimeIngredientFromSource(ingredient) === null).map((ingredient) => ingredient.position);
      const runtimeExclusions = ingredients.map(refresh.runtimeExclusionFromSource).filter(Boolean);

      const recipe = refresh.RefreshRecipeSchema.parse({
        schemaVersion: SCHEMA_VERSION,
        recipeVersion: 2,
        identity: { id: base.id, slug: base.slug, title },
        content: {
          description,
          cuisine: base.cuisine,
          ...(base.category !== undefined ? { category: base.category } : {}),
          ...(base.region !== undefined ? { region: base.region } : {}),
          cookTimeMinutes,
          servings,
          difficulty,
          tags: base.tags,
        },
        research: { inputPath: entry.name, rawSchemaSignature, sources, notes: unique(notes) },
        ingredients,
        steps,
        nutrition,
        media: { sourceImageUrl: null, legacyRuntimeImageUrl: base.imageUrl, canonicalStatus: 'source_metadata_only' },
        audit: { schemaRepairs: unique(repairs), encodingRepairs: unique(encodingRepairs), runtimeExcludedIngredientPositions, runtimeExclusions },
      });
      canonicalRecipes.push(recipe);
      schemaRepairCount += repairs.length;
      encodingRepairCount += encodingRepairs.length;
      schemaAnomalies.push({
        recipeId: base.id,
        inputPath: entry.name,
        rootSignature: rawSchemaSignature,
        rawStepTypes: unique((Array.isArray(raw.steps) ? raw.steps : []).map((step) => typeof step)).sort(compare),
        repairs: recipe.audit.schemaRepairs,
        encodingRepairs: recipe.audit.encodingRepairs,
      });
      sourceQuality.push({
        recipeId: base.id,
        sourceCount: sources.length,
        uniqueSourceCount: new Set(sources.map((source) => source.url)).size,
        declaredCount: sources.filter((source) => source.role === 'declared').length,
        structurallyValidCount: sources.filter((source) => source.verification === 'structurally_valid').length,
        contentVerifiedCount: sources.filter((source) => source.verification === 'content_verified').length,
        supportingCount: sources.filter((source) => source.role === 'supporting').length,
        invalidCount: repairs.filter((repair) => repair === 'invalid_source_url_removed').length,
        exception: base.id === KNOWN_SOURCE_EXCEPTION ? 'Only one exact-recipe source; the second source supports chayote preparation only.' : null,
        sources,
      });
      nutritionRemediation.push({ recipeId: base.id, ...nutrition });
    }

    const compiled = await refresh.compileRefreshCatalog(canonicalRecipes);
    if (compiled.recipes.some((recipe) => recipe.ingredients.length === 0)) {
      const ids = compiled.recipes.filter((recipe) => recipe.ingredients.length === 0).map((recipe) => recipe.id);
      throw new Error(`runtime projection has recipes without safe structured ingredients: ${ids.join(', ')}`);
    }

    const reconciliation = buildReconciliation(prepared, concepts).map((row) => refresh.RefreshIngredientReconciliationRowSchema.parse(row));
    const sourceExceptions = sourceQuality.filter((entry) => entry.exception !== null).length;
    const unexpectedSourceGaps = sourceQuality.filter((entry) => entry.recipeId !== KNOWN_SOURCE_EXCEPTION && entry.declaredCount < 2);
    if (unexpectedSourceGaps.length > 0) throw new Error(`recipes lack two declared structurally valid sources: ${unexpectedSourceGaps.map((entry) => entry.recipeId).join(', ')}`);
    const knownSourceQuality = sourceQuality.find((entry) => entry.recipeId === KNOWN_SOURCE_EXCEPTION);
    if (knownSourceQuality?.declaredCount !== 1 || knownSourceQuality.supportingCount !== 1) {
      throw new Error(`${KNOWN_SOURCE_EXCEPTION}: source exception classification drift`);
    }
    const auditSummary = buildAuditSummary(canonicalRecipes, reconciliation, schemaRepairCount, encodingRepairCount, sourceExceptions, rawAudit, sourceQuality);
    const releaseEligibility = refresh.deriveRefreshReleaseEligibility(canonicalRecipes);
    const exceptions = buildExceptions(canonicalRecipes, sourceQuality);
    const nutritionEvidence = nutritionRemediation.map((entry) => ({
      recipeId: entry.recipeId,
      certification: entry.certification,
      profileId: entry.profileId,
      perServing: entry.perServing,
      blockers: entry.blockers,
    }));

    mkdirSync(RECIPE_ROOT, { recursive: true });
    for (const recipe of canonicalRecipes) write(path.join(RECIPE_ROOT, `${recipe.identity.id}.json`), recipe);
    write(path.join(DATA_ROOT, 'ingredient-reconciliation.json'), reconciliation);
    write(path.join(DATA_ROOT, 'nutrition-evidence.json'), nutritionEvidence);
    write(path.join(DATA_ROOT, 'exceptions.json'), exceptions);

    write(path.join(ARTIFACT_ROOT, 'audit-summary.json'), auditSummary);
    write(path.join(ARTIFACT_ROOT, 'raw-zip-audit.json'), rawAudit);
    write(path.join(ARTIFACT_ROOT, 'ingredient-reconciliation.json'), reconciliation);
    write(path.join(ARTIFACT_ROOT, 'nutrition-remediation.json'), nutritionRemediation);
    write(path.join(ARTIFACT_ROOT, 'schema-anomalies.json'), schemaAnomalies);
    write(path.join(ARTIFACT_ROOT, 'source-quality.json'), sourceQuality);
    write(path.join(ARTIFACT_ROOT, 'runtime-projection.json'), {
      schemaVersion: SCHEMA_VERSION,
      recipeVersion: 2,
      recipeCount: compiled.recipes.length,
      projectionStatus: 'provisional',
      productionReleaseReady: false,
      finalRuntimeFingerprint: null,
      provisionalRuntimeProjectionFingerprint: compiled.provisionalRuntimeProjectionFingerprint,
      recipes: compiled.recipes,
    });

    const packageFiles = listPackageFiles().filter((file) => path.basename(file) !== 'manifest.json');
    const fileHashes = packageFiles.map((file) => ({ path: path.relative(DATA_ROOT, file), sha256: sha256(readFileSync(file)) }));
    const canonicalArtifactSha256 = await refresh.fingerprintRefreshArtifact(fileHashes);
    const manifest = {
      schemaVersion: SCHEMA_VERSION,
      sourceStatus: 'RECIPE_REFRESH_V2_RESEARCH_CANONICALIZED',
      baseReleaseId: currentManifest.releaseId,
      inputArtifact: path.basename(inputPath),
      inputSha256,
      recipeCount: canonicalRecipes.length,
      orderedRecipeIds: expectedIds,
      ingredientConceptCount: new Set(canonicalRecipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.canonicalIngredientId).filter(Boolean))).size,
      fileHashes,
      canonicalArtifactSha256,
      provisionalRuntimeProjectionFingerprint: compiled.provisionalRuntimeProjectionFingerprint,
      releaseEligibility,
      auditSummary,
    };
    write(path.join(DATA_ROOT, 'manifest.json'), refresh.RefreshSourceManifestSchema.parse(manifest));
    write(path.join(ARTIFACT_ROOT, 'content-artifact.json'), {
      canonicalArtifactSha256,
      provisionalRuntimeProjectionFingerprint: compiled.provisionalRuntimeProjectionFingerprint,
      releaseEligibility,
      inputSha256,
      recipeCount: canonicalRecipes.length,
    });
    write(path.join(ROOT, 'AUDIT_REPORT.md'), renderAuditReport(manifest, auditSummary, nutritionRemediation, exceptions));

    console.log(`recipe-refresh-build=ok recipes=${canonicalRecipes.length} ingredients=${auditSummary.ingredients} steps=${auditSummary.steps}`);
    console.log(`canonicalArtifactSha256=${canonicalArtifactSha256}`);
    console.log(`provisionalRuntimeProjectionFingerprint=${compiled.provisionalRuntimeProjectionFingerprint}`);
  }

  function normalizeIngredient(row) {
    const raw = row.raw;
    const sourceName = row.sourceName || 'INVALID_SOURCE_NAME';
    const note = refresh.normalizeText(raw.note) || null;
    const basis = refresh.normalizeText(raw.gram_basis) || null;
    const quantityText = refresh.normalizeText(raw.quantity_text);
    const rawUnit = refresh.normalizeText(raw.unit);
    const rawQuantity = finite(raw.quantity) && raw.quantity > 0 ? raw.quantity : null;
    const parsedText = quantityText ? refresh.parseExplicitQuantityText(quantityText) : null;
    const textualAmount = quantityText.match(/^(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+)/u)?.[1] ?? null;
    const parsedAmount = textualAmount?.includes('/')
      ? textualAmount.split('/').map((part) => Number(part.trim())).reduce((left, right) => left / right)
      : textualAmount ? Number(textualAmount.replace(',', '.')) : null;
    const sourceAmount = rawQuantity ?? (finite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null);
    const sourceUnit = rawUnit || (quantityText.replace(/^\d+(?:[.,]\d+)?\s*/u, '').trim() || 'quantity_text');
    const gramEquivalent = finite(raw.gram_equivalent) && raw.gram_equivalent >= 0 ? raw.gram_equivalent : deriveDirectGramEquivalent(sourceAmount, rawUnit);
    const qualitative = sourceAmount === null;
    const optional = raw.optional === true;
    const semantics = refresh.classifyIngredientSemantics({ name: sourceName, note: note ?? '', basis: basis ?? '', optional, qualitative });
    const evidence = qualitative ? 'missing' : refresh.quantityEvidence(basis ?? '', sourceUnit);
    const runtime = parsedText ?? (sourceAmount !== null ? refresh.runtimeQuantityFromEvidence({
      amount: sourceAmount,
      unit: rawUnit,
      gramEquivalent,
      evidence,
    }) : null);
    const quantity = qualitative ? {
      kind: 'qualitative',
      text: quantityText || note || basis || 'không định lượng',
      gramEquivalent: null,
      basis,
      evidence: 'missing',
      runtime: null,
    } : {
      kind: 'measured',
      amount: sourceAmount,
      unit: sourceUnit,
      text: quantityText || `${sourceAmount} ${sourceUnit}`,
      gramEquivalent,
      basis,
      evidence,
      runtime,
    };
    return refresh.RefreshIngredientSchema.parse({
      position: row.position,
      sourceName,
      canonicalIngredientId: row.ingredientId,
      reconciliation: row.resolution,
      reconciliationReason: row.reason || 'no reviewed resolution available',
      review: null,
      usageRole: semantics.usageRole,
      nutritionRole: semantics.nutritionRole,
      optional,
      includeInShopping: semantics.includeInShopping,
      includeInNutrition: semantics.includeInNutrition,
      quantity,
      note,
      sourceNutritionPer100g: refresh.nutritionFromRaw(raw.nutrition_per_100g),
      sourceNutritionReference: row.nutritionSource || null,
      sourceNutritionNote: refresh.normalizeText(raw.nutrition_note) || null,
    });
  }

  function auditRawEntries(rawEntries) {
    const rootSignatures = new Map();
    const urls = [];
    let ingredients = 0;
    let numericQuantityIngredients = 0;
    let quantityTextIngredients = 0;
    let nullQuantityWithUnitIngredients = 0;
    let whollyQualitativeIngredients = 0;
    let objectSteps = 0;
    let stringSteps = 0;
    let titleDescriptionSteps = 0;
    const titleDescriptionRecipeIds = new Set();
    for (const entry of rawEntries) {
      const raw = asObject(entry.raw);
      const signature = Object.keys(raw).sort(compare).join(',');
      rootSignatures.set(signature, (rootSignatures.get(signature) ?? 0) + 1);
      const sources = Array.isArray(raw.sources) ? raw.sources : Array.isArray(raw.sources_read) ? raw.sources_read : [];
      for (const source of sources) if (typeof source === 'string') urls.push(source);
      for (const ingredientValue of Array.isArray(raw.ingredients) ? raw.ingredients : []) {
        const ingredient = asObject(ingredientValue);
        ingredients += 1;
        if (finite(ingredient.quantity)) numericQuantityIngredients += 1;
        else if (typeof ingredient.quantity_text === 'string') quantityTextIngredients += 1;
        else if (ingredient.unit !== null && ingredient.unit !== undefined) nullQuantityWithUnitIngredients += 1;
        else whollyQualitativeIngredients += 1;
      }
      for (const step of Array.isArray(raw.steps) ? raw.steps : []) {
        if (typeof step === 'string') stringSteps += 1;
        else {
          objectSteps += 1;
          const row = asObject(step);
          if (!refresh.normalizeText(row.instruction) && (refresh.normalizeText(row.title) || refresh.normalizeText(row.description))) {
            titleDescriptionSteps += 1;
            titleDescriptionRecipeIds.add(raw.recipe_id);
          }
        }
      }
    }
    return {
      recipes: rawEntries.length,
      ingredients,
      numericQuantityIngredients,
      quantityTextIngredients,
      nullQuantityWithUnitIngredients,
      whollyQualitativeIngredients,
      steps: objectSteps + stringSteps,
      objectSteps,
      stringSteps,
      titleDescriptionSteps,
      titleDescriptionRecipeIds: [...titleDescriptionRecipeIds].sort(compare),
      sourceReferences: urls.length,
      uniqueSourceUrls: new Set(urls).size,
      schemaVariantCount: rootSignatures.size,
      rootSignatures: [...rootSignatures].map(([signature, count]) => ({ signature, count })).sort((left, right) => right.count - left.count || compare(left.signature, right.signature)),
    };
  }

  function deriveDirectGramEquivalent(amount, unit) {
    if (amount === null) return null;
    const key = unit.toLowerCase();
    if (key === 'g') return amount;
    if (key === 'kg') return amount * 1000;
    return null;
  }

  function normalizeSteps(value, repairs, encodingRepairs) {
    const rawSteps = Array.isArray(value) ? value : [];
    const seen = new Set();
    const steps = [];
    rawSteps.forEach((rawStep, index) => {
      let instruction = '';
      let tip = '';
      let timer = null;
      let declaredNumber = null;
      if (typeof rawStep === 'string') {
        instruction = refresh.normalizeText(rawStep);
        repairs.push('string_step_to_structured');
      } else {
        const row = asObject(rawStep);
        instruction = refresh.normalizeText(row.instruction);
        if (!instruction && (row.title || row.description)) {
          const title = refresh.normalizeText(row.title);
          const description = refresh.normalizeText(row.description);
          instruction = title && description ? `${title}: ${description}` : title || description;
          repairs.push('title_description_step_to_instruction');
        }
        tip = refresh.normalizeText(row.tip);
        timer = finite(row.timer_minutes) ? row.timer_minutes : finite(row.timerMinutes) ? row.timerMinutes
          : typeof row.timer_minutes === 'string' && /^\d+(?:\.\d+)?$/.test(row.timer_minutes) ? Number(row.timer_minutes) : null;
        declaredNumber = Number.isInteger(row.n) ? row.n : Number.isInteger(row.stepNumber) ? row.stepNumber : null;
      }
      if (!instruction) { repairs.push('empty_step_removed'); return; }
      if (/(?:Ã|Â|�|â€™|â€“|â€œ|â€)/u.test(instruction)) encodingRepairs.push(`unrepaired_mojibake_step_${index + 1}`);
      const duplicateKey = instruction.normalize('NFKC').toLowerCase();
      if (seen.has(duplicateKey)) { repairs.push('duplicate_step_removed'); return; }
      seen.add(duplicateKey);
      const stepNumber = steps.length + 1;
      if (declaredNumber !== null && declaredNumber !== stepNumber) repairs.push('step_number_resequenced');
      steps.push({
        stepNumber,
        instruction,
        ...(tip ? { tip } : {}),
        ...(finite(timer) && timer >= 0 ? { timerMinutes: timer } : {}),
      });
    });
    if (steps.length === 0) throw new Error('recipe has no non-empty steps after normalization');
    return steps;
  }

  function normalizeSources(recipeId, raw, repairs) {
    const values = Array.isArray(raw.sources) ? raw.sources : Array.isArray(raw.sources_read) ? raw.sources_read : [];
    if (!Array.isArray(raw.sources) && Array.isArray(raw.sources_read)) repairs.push('sources_read_to_sources');
    const out = [];
    const seen = new Set();
    for (const value of values) {
      const url = refresh.normalizeText(value);
      if (!url || seen.has(url)) { if (url) repairs.push('duplicate_source_removed'); continue; }
      try {
        const parsed = new URL(url);
        if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('unsupported source URL protocol');
      } catch { repairs.push('invalid_source_url_removed'); continue; }
      seen.add(url);
      const supporting = recipeId === KNOWN_SOURCE_EXCEPTION && out.length === 1;
      out.push({
        url,
        role: supporting ? 'supporting' : 'declared',
        verification: 'structurally_valid',
        verificationEvidence: null,
        note: supporting ? 'Supports chayote preparation only; not a second exact recipe source.' : null,
      });
    }
    return out;
  }

  function flattenNotes(raw) {
    const fields = ['notes', 'note', 'nutrition_note', 'conflicts_notes', 'source_conflicts', 'notes_conflict', 'conflicts_notes', 'title_fix'];
    const result = [];
    for (const field of fields) {
      const value = raw[field];
      if (typeof value === 'string' && value.trim()) result.push(`${field}: ${refresh.normalizeText(value)}`);
      else if (Array.isArray(value)) for (const item of value) if (typeof item === 'string' && item.trim()) result.push(`${field}: ${refresh.normalizeText(item)}`);
      else if (value && typeof value === 'object') result.push(`${field}: ${JSON.stringify(value)}`);
    }
    return result;
  }

  function originalNutrition(value) {
    const perServing = asObject(asObject(value).per_serving);
    return {
      energyKcal: finite(perServing.energy_kcal) && perServing.energy_kcal >= 0 ? perServing.energy_kcal : null,
      proteinG: finite(perServing.protein_g) && perServing.protein_g >= 0 ? perServing.protein_g : null,
      carbohydrateG: finite(perServing.carbohydrate_g) && perServing.carbohydrate_g >= 0 ? perServing.carbohydrate_g : null,
      fatG: finite(perServing.fat_g) && perServing.fat_g >= 0 ? perServing.fat_g : null,
      fiberG: finite(perServing.fiber_g) && perServing.fiber_g >= 0 ? perServing.fiber_g : null,
      sugarG: finite(perServing.sugar_g) && perServing.sugar_g >= 0 ? perServing.sugar_g : null,
      sodiumMg: finite(perServing.sodium_mg) && perServing.sodium_mg >= 0 ? perServing.sodium_mg : null,
    };
  }

  function certifyNutrition(recipeId, servings, ingredients, rawNutrition) {
    const totals = { energyKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 };
    const blockers = [];
    const remediation = [];
    let included = 0;
    for (const ingredient of ingredients) {
      if (ingredient.nutritionRole === 'excluded_process') {
        remediation.push(`excluded process ingredient #${ingredient.position}: ${ingredient.sourceName}`);
        continue;
      }
      if (ingredient.nutritionRole === 'excluded_optional') continue;
      if (ingredient.nutritionRole === 'unresolved_absorption') {
        blockers.push({ code: 'UNRESOLVED_ABSORPTION', ingredientPosition: ingredient.position, detail: `${ingredient.sourceName}: consumed/absorbed amount is not evidenced` });
        continue;
      }
      if (!ingredient.includeInNutrition) {
        blockers.push({ code: 'QUALITATIVE_CONSUMED_AMOUNT', ingredientPosition: ingredient.position, detail: `${ingredient.sourceName}: edible quantity is qualitative` });
        continue;
      }
      if (ingredient.quantity.kind !== 'measured' || ingredient.quantity.gramEquivalent === null) {
        blockers.push({ code: 'MISSING_EDIBLE_QUANTITY', ingredientPosition: ingredient.position, detail: `${ingredient.sourceName}: no evidence-backed gram equivalent` });
        continue;
      }
      if (ingredient.quantity.evidence === 'estimated') {
        blockers.push({ code: 'ESTIMATED_EDIBLE_QUANTITY', ingredientPosition: ingredient.position, detail: `${ingredient.sourceName}: gram equivalent is explicitly estimated` });
        continue;
      }
      const nutrients = ingredient.sourceNutritionPer100g;
      if (!nutrients || Object.values(nutrients).some((value) => value === null)) {
        blockers.push({ code: 'INCOMPLETE_NUTRIENT_REFERENCE', ingredientPosition: ingredient.position, detail: `${ingredient.sourceName}: all seven nutrients are not evidenced` });
        continue;
      }
      if (!ingredient.sourceNutritionReference) {
        blockers.push({ code: 'MISSING_NUTRIENT_REFERENCE', ingredientPosition: ingredient.position, detail: `${ingredient.sourceName}: nutrient values have no source reference` });
        continue;
      }
      const factor = ingredient.quantity.gramEquivalent / 100;
      totals.energyKcal += nutrients.energyKcal * factor;
      totals.proteinG += nutrients.proteinG * factor;
      totals.carbohydrateG += nutrients.carbohydrateG * factor;
      totals.fatG += nutrients.fatG * factor;
      totals.fiberG += nutrients.fiberG * factor;
      totals.sugarG += nutrients.sugarG * factor;
      totals.sodiumMg += nutrients.sodiumMg * factor;
      included += 1;
    }
    const candidatePerServing = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, included > 0 ? round2(value / servings) : null]));
    const originalPerServing = originalNutrition(rawNutrition);
    const originalHasNumber = Object.values(originalPerServing).some((value) => value !== null);
    const certification = blockers.length === 0 && included > 0 ? 'publishable' : originalHasNumber ? 'blocked' : 'null_truthful';
    const perServing = certification === 'publishable' ? candidatePerServing : {
      energyKcal: null,
      proteinG: null,
      carbohydrateG: null,
      fatG: null,
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
    };
    if (originalPerServing.energyKcal !== null && originalPerServing.energyKcal >= 2000) remediation.push('original energy outlier reviewed; no clipping applied');
    if (originalPerServing.sodiumMg !== null && originalPerServing.sodiumMg >= 10000) remediation.push('original sodium outlier reviewed; no clipping applied');
    return {
      certification,
      profileId: certification === 'publishable' ? `${recipeId}_nutrition_v2` : null,
      basis: 'per_serving',
      servings,
      perServing,
      candidatePerServing,
      originalPerServing,
      blockers,
      remediation: unique(remediation),
    };
  }

  function buildReconciliation(prepared, concepts) {
    const rows = new Map();
    for (const row of prepared) {
      const key = `${row.sourceName}\0${row.nutritionSource}\0${row.ingredientId ?? ''}\0${row.resolution}`;
      if (!rows.has(key)) rows.set(key, {
        sourceName: row.sourceName,
        sourceId: null,
        nutritionSource: row.nutritionSource || null,
        canonicalId: row.ingredientId,
        canonicalName: row.conceptKey ? concepts.get(row.conceptKey)?.canonicalName ?? row.sourceName : row.sourceName,
        resolution: row.resolution,
        reason: row.reason,
        review: null,
      });
    }
    return [...rows.values()].sort((left, right) => compare(left.canonicalId ?? '', right.canonicalId ?? '') || compare(left.sourceName, right.sourceName));
  }

  function buildAuditSummary(recipes, reconciliation, schemaRepairs, encodingRepairs, sourceExceptions, rawAudit, sourceQuality) {
    const ingredients = recipes.flatMap((recipe) => recipe.ingredients);
    const nutrition = recipes.map((recipe) => recipe.nutrition.certification);
    const reconciliationCounts = Object.fromEntries(['existing_canonical_id', 'reviewed_new_canonical_id', 'provisional_new_canonical_id', 'duplicate_alias', 'ambiguous', 'invalid']
      .map((resolution) => [resolution, reconciliation.filter((row) => row.resolution === resolution).length]));
    const exclusions = recipes.flatMap((recipe) => recipe.audit.runtimeExclusions);
    const exclusionReasons = Object.fromEntries(['unsupported_unit', 'qualitative_quantity', 'process_only', 'estimated_process', 'no_runtime_quantity', 'non_shopping', 'other']
      .map((reason) => [reason, exclusions.filter((entry) => entry.reason === reason).length]));
    const projectedIngredientCount = ingredients.length - exclusions.length;
    return {
      recipes: recipes.length,
      steps: recipes.reduce((total, recipe) => total + recipe.steps.length, 0),
      ingredients: ingredients.length,
      quantifiedIngredients: ingredients.filter((ingredient) => ingredient.quantity.kind === 'measured').length,
      qualitativeIngredients: ingredients.filter((ingredient) => ingredient.quantity.kind === 'qualitative').length,
      processOnlyIngredients: ingredients.filter((ingredient) => ingredient.usageRole === 'process_only').length,
      mixedProcessIngredients: ingredients.filter((ingredient) => ingredient.usageRole === 'mixed_process').length,
      unresolvedIngredients: ingredients.filter((ingredient) => ingredient.canonicalIngredientId === null).length,
      runtimeProjectedIngredients: projectedIngredientCount,
      runtimeExcludedIngredients: exclusions.length,
      runtimeProjectionCoverage: {
        canonicalIngredientCount: ingredients.length,
        projectedIngredientCount,
        excludedIngredientCount: exclusions.length,
        requiredTransformationCount: exclusions.filter((entry) => entry.requiresReviewedTransformation).length,
        coverageRatio: Number((projectedIngredientCount / ingredients.length).toFixed(6)),
        exclusionsByReason: exclusionReasons,
      },
      ingredientConcepts: new Set(ingredients.map((ingredient) => ingredient.canonicalIngredientId).filter(Boolean)).size,
      sourceExceptions,
      recipesWithTwoDeclaredSources: sourceQuality.filter((entry) => entry.declaredCount >= 2).length,
      sources: {
        declaredUrls: sourceQuality.reduce((sum, entry) => sum + entry.declaredCount, 0),
        structurallyValidUrls: sourceQuality.reduce((sum, entry) => sum + entry.structurallyValidCount, 0),
        contentVerifiedUrls: sourceQuality.reduce((sum, entry) => sum + entry.contentVerifiedCount, 0),
        supportingUrls: sourceQuality.reduce((sum, entry) => sum + entry.supportingCount, 0),
        invalidUrls: sourceQuality.reduce((sum, entry) => sum + entry.invalidCount, 0),
        exceptions: sourceExceptions,
      },
      nutritionPublishable: nutrition.filter((status) => status === 'publishable').length,
      nutritionBlocked: nutrition.filter((status) => status === 'blocked').length,
      nutritionNull: nutrition.filter((status) => status === 'null_truthful').length,
      nutritionOriginalProfiles: recipes.filter((recipe) => Object.values(recipe.nutrition.originalPerServing).some((value) => value !== null)).length,
      nutritionRecomputedCandidates: recipes.filter((recipe) => Object.values(recipe.nutrition.candidatePerServing).some((value) => value !== null)).length,
      schemaRepairs,
      encodingRepairs,
      ingredientReconciliationRows: reconciliation.length,
      ingredientReconciliation: reconciliationCounts,
      rawQuantityShapes: {
        numeric: rawAudit.numericQuantityIngredients,
        quantityText: rawAudit.quantityTextIngredients,
        nullWithUnit: rawAudit.nullQuantityWithUnitIngredients,
        whollyQualitative: rawAudit.whollyQualitativeIngredients,
      },
      rawStepShapes: {
        objects: rawAudit.objectSteps,
        strings: rawAudit.stringSteps,
        titleDescription: rawAudit.titleDescriptionSteps,
        titleDescriptionRecipes: rawAudit.titleDescriptionRecipeIds.length,
      },
      sourceReferences: rawAudit.sourceReferences,
      uniqueSourceUrls: rawAudit.uniqueSourceUrls,
      schemaVariants: rawAudit.schemaVariantCount,
    };
  }

  function buildExceptions(recipes, sourceQuality) {
    const runtimeGap = recipes.filter((recipe) => recipe.audit.runtimeExcludedIngredientPositions.length > 0).map((recipe) => ({
      recipeId: recipe.identity.id,
      positions: recipe.audit.runtimeExcludedIngredientPositions,
    }));
    const nutritionBlocked = recipes.filter((recipe) => recipe.nutrition.certification !== 'publishable').map((recipe) => ({
      recipeId: recipe.identity.id,
      certification: recipe.nutrition.certification,
      blockerCodes: unique(recipe.nutrition.blockers.map((blocker) => blocker.code)).sort(compare),
    }));
    return [
      {
        code: 'SOURCE_RELEVANCE_EXCEPTION',
        recipeId: KNOWN_SOURCE_EXCEPTION,
        detail: sourceQuality.find((entry) => entry.recipeId === KNOWN_SOURCE_EXCEPTION)?.exception,
      },
      {
        code: 'RUNTIME_QUALITATIVE_GAP',
        recipeId: null,
        detail: 'Canonical source retains qualitative and unsupported-unit ingredient rows; current RuntimeRecipe projects only positive quantities in StandardUnit.',
        recipes: runtimeGap,
      },
      {
        code: 'NUTRITION_EVIDENCE_BLOCKED',
        recipeId: null,
        detail: 'Blocked/null profiles remain intentionally absent from runtime nutrition until edible quantity and all material nutrients are evidenced.',
        recipes: nutritionBlocked,
      },
    ];
  }

  function listPackageFiles() {
    const files = [];
    const visit = (dir) => {
      for (const name of readdirSync(dir).sort(compare)) {
        const file = path.join(dir, name);
        if (statSync(file).isDirectory()) visit(file); else files.push(file);
      }
    };
    visit(DATA_ROOT);
    return files;
  }

  function renderAuditReport(manifest, summary, nutritionRows, exceptions) {
    const energyOutliers = nutritionRows.filter((row) => row.originalPerServing.energyKcal !== null && row.originalPerServing.energyKcal >= 2000).length;
    const sodiumOutliers = nutritionRows.filter((row) => row.originalPerServing.sodiumMg !== null && row.originalPerServing.sodiumMg >= 10000).length;
    const blockerCounts = new Map();
    for (const row of nutritionRows) for (const blocker of row.blockers) blockerCounts.set(blocker.code, (blockerCounts.get(blocker.code) ?? 0) + 1);
    const blockerLines = [...blockerCounts].sort((left, right) => right[1] - left[1] || compare(left[0], right[0]))
      .map(([code, count]) => `- ${code}: ${count}`).join('\n');
    return `# Recipe Content Refresh V2 Audit\n\n` +
      `## Status\n\nRECIPE_REFRESH_V2_RESEARCH_CANONICALIZED\n\n` +
      `Canonical source ready: ${manifest.releaseEligibility.canonicalSourceReady}; runtime projection ready: ${manifest.releaseEligibility.runtimeProjectionReady}; production release ready: ${manifest.releaseEligibility.productionReleaseReady}. Blockers: ${manifest.releaseEligibility.blockers.join(', ')}. Final release fingerprint: NOT GENERATED.\n\n` +
      `## ZIP audit\n\n- Input SHA-256: \`${manifest.inputSha256}\`\n- Recipes / unique IDs: ${summary.recipes} / ${summary.recipes}\n- Steps: ${summary.steps} (${summary.rawStepShapes.objects} objects, ${summary.rawStepShapes.strings} strings, ${summary.rawStepShapes.titleDescription} title/description objects)\n- Ingredient lines: ${summary.ingredients}; raw numeric quantity ${summary.rawQuantityShapes.numeric}, quantity_text ${summary.rawQuantityShapes.quantityText}, null-with-unit ${summary.rawQuantityShapes.nullWithUnit}, wholly qualitative ${summary.rawQuantityShapes.whollyQualitative}\n- Root schema variants: ${summary.schemaVariants}\n- Source references: ${summary.sourceReferences} (${summary.uniqueSourceUrls} unique URLs)\n- ZIP ingredient total is 6,766, not the reported production count 6,720. No data was changed to force reported handoff numbers.\n\n` +
      `## What was wrong\n\n- The ZIP used 15 root shapes and three step representations instead of one source schema.\n- 52 raw ingredient rows lacked numeric \`quantity\`; only evidence-backed quantity_text rows were parsed, leaving ${summary.qualitativeIngredients} truthful canonical qualitative rows.\n- Nutrition counted process media such as 500 g salt beds and deep-frying oil as fully eaten.\n- Name-derived enrichment IDs were incorrectly labeled reviewed and structural URL validity was overstated as relevance. Both now retain explicit provisional states.\n- The V1 import compiler is INSERT-only and remains unchanged; refresh V2 is a separate source/projection path.\n\n` +
      `## Repairs\n\n- Schema repair operations: ${summary.schemaRepairs}; encoding repairs: ${summary.encodingRepairs}.\n- Process-only / mixed-process rows: ${summary.processOnlyIngredients} / ${summary.mixedProcessIngredients}.\n- Ingredient concepts: ${summary.ingredientConcepts}; reconciliation rows: ${summary.ingredientReconciliationRows}.\n- Reconciliation: existing ${summary.ingredientReconciliation.existing_canonical_id}, reviewed new ${summary.ingredientReconciliation.reviewed_new_canonical_id}, provisional new ${summary.ingredientReconciliation.provisional_new_canonical_id}, duplicate aliases ${summary.ingredientReconciliation.duplicate_alias}, ambiguous ${summary.ingredientReconciliation.ambiguous}, invalid ${summary.ingredientReconciliation.invalid}. Aliases of provisional IDs do not confer ingredient authority.\n- ${summary.recipesWithTwoDeclaredSources}/500 recipes have at least two structurally valid declared URLs; URL-specific content verification has not been recorded. The one source exception remains explicit.\n- Approved titles applied: \`vn-bun-01\` → “Phở bò tái lăn Hà Nội”; \`imp-7d38862afc164a8d\` → “Mực xào xì dầu kiểu Hàn”.\n\n` +
      `## Nutrition\n\n- Original numeric profiles: ${summary.nutritionOriginalProfiles}.\n- Recomputed candidates: ${summary.nutritionRecomputedCandidates}.\n- Certified publishable: ${summary.nutritionPublishable}; blocked: ${summary.nutritionBlocked}; truthful null: ${summary.nutritionNull}.\n- Original energy outliers >= 2,000 kcal/serving: ${energyOutliers}; sodium outliers >= 10,000 mg/serving: ${sodiumOutliers}. They are quarantined, not clipped.\n- \`vn-hap-01\` no longer publishes 51,497.78 mg sodium/serving from the salt bed. \`imp-6eaf6ed6d417c52c\` no longer publishes 2,994.53 kcal/serving from 1 L frying oil.\n- Blocker classes:\n${blockerLines}\n\n` +
      `## Canonical package\n\n- Path: \`data/recipe-refresh/v2\`\n- Recipes: ${manifest.recipeCount}\n- Previous source artifact SHA-256: \`fc7eefe6573ee9de1083728db1f34b058954fa60ff478f7c5e41dce9e4570dbe\`.\n- Remediated canonical artifact SHA-256: \`${manifest.canonicalArtifactSha256}\`\n- Provisional runtime projection fingerprint from \`fingerprintRecipes()\`: \`${manifest.provisionalRuntimeProjectionFingerprint}\`\n- Final release fingerprint: NOT GENERATED.\n- Machine-readable audit: \`artifacts/recipe-refresh-v2\`\n\n` +
      `## Runtime compatibility\n\n${summary.runtimeProjectionCoverage.projectedIngredientCount}/${summary.runtimeProjectionCoverage.canonicalIngredientCount} rows project (${(summary.runtimeProjectionCoverage.coverageRatio * 100).toFixed(2)}%); ${summary.runtimeProjectionCoverage.requiredTransformationCount} excluded rows require reviewed transformation. Exclusions by reason: ${Object.entries(summary.runtimeProjectionCoverage.exclusionsByReason).map(([reason, count]) => `${reason}=${count}`).join(', ')}. Process-only cooking media can legitimately remain outside RuntimeRecipe. Required shopping/consumed rows cannot be silently dropped for a production release. Planner/inventory/shopping contracts remain unchanged.\n\n` +
      `## Source spot-check\n\nA bounded online check covered the known source exception, both approved title corrections, the salt-bed defect, the deep-frying defect, and nine referenced FDC IDs. Nine of ten recipe pages returned HTTP 200; one Điện Máy Xanh request timed out and is not classified as dead. All nine FDC IDs returned HTTP 200 with the expected food descriptions through the official API. Keyless normalized API references returned HTTP 403 as expected, and two legacy human-facing FDC page routes returned 404 even though the underlying API IDs are valid. See \`artifacts/recipe-refresh-v2/source-spot-check.json\`; this mutable-web check is evidence, not part of the canonical content hash.\n\n` +
      `## Exceptions\n\n${exceptions.map((entry) => `- ${entry.code}: ${entry.detail}`).join('\n')}\n\n` +
      `## Findings\n\n- P0: none.\n- P1: production release blocked by ${manifest.releaseEligibility.blockers.join(', ')}.\n- P1: ${summary.runtimeExcludedIngredients} source ingredient rows are excluded from the provisional runtime projection; ${summary.runtimeProjectionCoverage.requiredTransformationCount} require reviewed transformation.\n- P1: 288 researched nutrition profiles remain blocked; ${summary.ingredientReconciliation.provisional_new_canonical_id} generated ingredient concepts lack authority review.\n- P2: declared source URLs have structural validation only; bounded web spot-check evidence is separate.\n\n` +
      `## Remote boundary\n\n- \`staging_mutation=NO\`\n- \`production_mutation=NO\`\n- \`deploy=NO\`\n- \`0040_created=NO\`\n- \`final_release_manifest_created=NO\`\n- \`T20_enablement=NO\`\n\n` +
      `## Next\n\nHoplite must reconcile runtime/content loss, promote ingredient authority with explicit review evidence, verify source content and nutrition, then produce a complete final release projection and fingerprint before generating 0040.\n`;
  }

  async function check() {
    if (!existsSync(path.join(DATA_ROOT, 'manifest.json'))) throw new Error('canonical refresh manifest is missing');
    const manifest = refresh.RefreshSourceManifestSchema.parse(JSON.parse(readFileSync(path.join(DATA_ROOT, 'manifest.json'), 'utf8')));
    if (manifest.baseReleaseId !== currentManifest.releaseId) throw new Error('base release ID drift');
    if (JSON.stringify(manifest.orderedRecipeIds) !== JSON.stringify(expectedIds)) throw new Error('manifest recipe IDs drift from the current catalog release');
    const recipeFiles = readdirSync(RECIPE_ROOT).filter((name) => name.endsWith('.json')).sort(compare);
    if (recipeFiles.length !== EXPECTED_RECIPE_COUNT) throw new Error(`recipe count ${recipeFiles.length} != ${EXPECTED_RECIPE_COUNT}`);
    const parsedRecipes = recipeFiles.map((name) => refresh.RefreshRecipeSchema.parse(JSON.parse(readFileSync(path.join(RECIPE_ROOT, name), 'utf8'))));
    refresh.assertRefreshCatalog(parsedRecipes, expectedIds);
    const recipesById = new Map(parsedRecipes.map((recipe) => [recipe.identity.id, recipe]));
    const recipes = manifest.orderedRecipeIds.map((id) => {
      const recipe = recipesById.get(id);
      if (!recipe) throw new Error(`recipe ID missing from canonical package: ${id}`);
      return recipe;
    });
    if (recipesById.size !== manifest.orderedRecipeIds.length) throw new Error('canonical package contains an unexpected recipe ID');
    for (const recipe of recipes) {
      const actual = recipe.ingredients.map(refresh.runtimeExclusionFromSource).filter(Boolean);
      if (JSON.stringify(actual) !== JSON.stringify(recipe.audit.runtimeExclusions)
        || JSON.stringify(actual.map((entry) => entry.position)) !== JSON.stringify(recipe.audit.runtimeExcludedIngredientPositions)) {
        throw new Error(`${recipe.identity.id}: runtime exclusion audit drift`);
      }
    }
    const eligibility = refresh.deriveRefreshReleaseEligibility(recipes);
    if (JSON.stringify(eligibility) !== JSON.stringify(manifest.releaseEligibility)) throw new Error('release eligibility drift');
    const exceptions = JSON.parse(readFileSync(path.join(DATA_ROOT, 'exceptions.json'), 'utf8'));
    const reconciliation = JSON.parse(readFileSync(path.join(DATA_ROOT, 'ingredient-reconciliation.json'), 'utf8'));
    if (!Array.isArray(reconciliation)) throw new Error('ingredient reconciliation must be an array');
    reconciliation.forEach((row) => refresh.RefreshIngredientReconciliationRowSchema.parse(row));
    refresh.assertReleaseExceptions(exceptions, ALLOWED_EXCEPTION_CODES, {
      code: 'SOURCE_RELEVANCE_EXCEPTION',
      recipeId: KNOWN_SOURCE_EXCEPTION,
    });
    const fileHashes = manifest.fileHashes.map((entry) => {
      const file = path.join(DATA_ROOT, entry.path);
      if (!existsSync(file)) throw new Error(`canonical package file missing: ${entry.path}`);
      const actual = sha256(readFileSync(file));
      if (actual !== entry.sha256) throw new Error(`artifact hash drift: ${entry.path}`);
      return entry;
    });
    const actualPackageFiles = listPackageFiles()
      .filter((file) => path.basename(file) !== 'manifest.json')
      .map((file) => path.relative(DATA_ROOT, file));
    if (JSON.stringify(actualPackageFiles) !== JSON.stringify(fileHashes.map((entry) => entry.path))) {
      throw new Error('canonical package file set drift');
    }
    const rootHash = await refresh.fingerprintRefreshArtifact(fileHashes);
    if (rootHash !== manifest.canonicalArtifactSha256) throw new Error('canonical artifact root hash drift');
    const compiled = await refresh.compileRefreshCatalog(recipes);
    if (compiled.recipes.some((recipe) => recipe.ingredients.length === 0)) throw new Error('runtime projection contains a recipe without safe structured ingredients');
    if (compiled.provisionalRuntimeProjectionFingerprint !== manifest.provisionalRuntimeProjectionFingerprint) throw new Error('provisional runtime fingerprint drift');
    const committedProjection = JSON.parse(readFileSync(path.join(ARTIFACT_ROOT, 'runtime-projection.json'), 'utf8'));
    if (committedProjection.projectionStatus !== 'provisional' || committedProjection.productionReleaseReady !== false
      || committedProjection.finalRuntimeFingerprint !== null
      || committedProjection.provisionalRuntimeProjectionFingerprint !== compiled.provisionalRuntimeProjectionFingerprint
      || JSON.stringify(committedProjection.recipes) !== JSON.stringify(compiled.recipes)) {
      throw new Error('runtime projection artifact drift');
    }
    const committedAudit = JSON.parse(readFileSync(path.join(ARTIFACT_ROOT, 'audit-summary.json'), 'utf8'));
    if (JSON.stringify(committedAudit) !== JSON.stringify(manifest.auditSummary)) throw new Error('audit summary artifact drift');
    const contentArtifact = JSON.parse(readFileSync(path.join(ARTIFACT_ROOT, 'content-artifact.json'), 'utf8'));
    if (contentArtifact.canonicalArtifactSha256 !== rootHash || contentArtifact.provisionalRuntimeProjectionFingerprint !== compiled.provisionalRuntimeProjectionFingerprint
      || JSON.stringify(contentArtifact.releaseEligibility) !== JSON.stringify(eligibility)
      || contentArtifact.inputSha256 !== manifest.inputSha256 || contentArtifact.recipeCount !== recipes.length) {
      throw new Error('content artifact drift');
    }
    console.log(`recipe-refresh-check=ok recipes=${recipes.length} canonicalArtifactSha256=${rootHash} provisionalRuntimeProjectionFingerprint=${compiled.provisionalRuntimeProjectionFingerprint}`);
    return { manifest, recipes, provisionalRuntimeProjectionFingerprint: compiled.provisionalRuntimeProjectionFingerprint };
  }
} finally {
  await vite.close();
}
