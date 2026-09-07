import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { extractCatalogFromRuntimeSource } from '../src/domain/catalog/extract-catalog.mjs';
import { validateCatalog } from '../src/domain/catalog/validate-catalog.mjs';

const root = process.cwd();
const runtimePath = process.env.HV_CATALOG_SOURCE || join(root, 'index.html');

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(relative(root, path).replaceAll('\\', '/'));
  }
  return files;
}

if (!existsSync(runtimePath)) {
  throw new Error('Catalog runtime source not found: ' + runtimePath);
}

const source = readFileSync(runtimePath, 'utf8');
const catalog = extractCatalogFromRuntimeSource(source, {
  runtimePath: relative(root, runtimePath).replaceAll('\\', '/'),
  availableAssetPaths: walkFiles(join(root, 'assets'))
});
const validation = validateCatalog(catalog);
const report = {
  schema: validation.schema,
  source: {
    ...catalog.source,
    sha256: createHash('sha256').update(source).digest('hex'),
    chars: source.length
  },
  summary: validation.summary,
  issues: validation.issues
};

const writeIndex = process.argv.indexOf('--write');
if (writeIndex >= 0) {
  const outputPath = process.argv[writeIndex + 1];
  if (!outputPath) throw new Error('--write requires a path');
  const absoluteOutputPath = join(root, outputPath);
  mkdirSync(dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(JSON.stringify(report, null, 2));
if (!validation.ok && !process.argv.includes('--allow-errors')) process.exitCode = 1;
