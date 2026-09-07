import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  auditCommandInventory
} from '../src/domain/transaction/command-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'index.html');
const source = fs.readFileSync(sourcePath, 'utf8');
const audit = auditCommandInventory({ source });
const report = {
  schema: audit.schema,
  source: {
    runtimePath: 'index.html',
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
    chars: source.length,
    transactionRuntimeWired: audit.transactionRuntimeWired
  },
  scope: {
    inventory: 'direct source commands that mutate player state or persist',
    deepSlice: 'levelUpHero -> questProgress -> weeklyProgress',
    receiptFailureHarness: audit.opening.requiredFailureTest
  },
  summary: audit.summary,
  opening: audit.opening,
  inventory: audit.inventory,
  candidates: audit.candidates,
  errors: audit.errors
};

const writeIndex = process.argv.indexOf('--write');
if (writeIndex >= 0) {
  const outputPath = process.argv[writeIndex + 1];
  if (!outputPath) throw new Error('--write requires a path');
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(JSON.stringify(report, null, 2));
if (!audit.ok && !process.argv.includes('--allow-errors')) process.exitCode = 1;
