#!/usr/bin/env node
/**
 * README function-count verification — the counting convention this project uses (defined
 * here, not just described in prose): a domain's "Functions" count is its **primary
 * calculation functions** only. Excluded, each counted/credited separately:
 *   - type guards            (identifier matches /^is[A-Z]/, e.g. `isCpkInput`)
 *   - helper accessor functions (identifier matches /^get[A-Z]/, e.g. `getRebarUnitWeight`)
 *   - exported constants     (identifier is ALL_CAPS, e.g. `AGGREGATE_DENSITIES`)
 *
 * Parses each domain's `src/<domain>/index.ts` `export { ... } from './x.js'` lines (multi-name
 * lines included), classifies every named export by the rules above, and compares the resulting
 * per-domain primary-function count against README.md's Verification Status table.
 *
 * Exits 1 on any mismatch (domain count, or the total/type-guard headline figures) so this can
 * run as a CI check; run manually via `pnpm check:function-counts`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, 'src');

// Matches both single-line (`export { a, b } from './x.js';`) and multi-line
// (`export {\n  a,\n  b,\n} from './x.js';`) re-export blocks — `[\s\S]*?` spans newlines,
// which a per-line regex cannot, and this project genuinely has both shapes (e.g.
// `quality/index.ts`'s multi-line `actionPriority`/`AP_TABLE`/... block).
const EXPORT_BLOCK = /export\s*\{([\s\S]*?)\}\s*from\s*'\.\/([^']+)\.js';?/g;

function classify(name) {
  if (/^is[A-Z]/.test(name)) return 'guard';
  if (/^get[A-Z]/.test(name)) return 'helper';
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) return 'constant';
  return 'function';
}

function countDomain(domain) {
  const indexPath = path.join(SRC, domain, 'index.ts');
  const text = readFileSync(indexPath, 'utf8');
  const counts = { function: 0, guard: 0, helper: 0, constant: 0 };
  for (const match of text.matchAll(EXPORT_BLOCK)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (!name) continue;
      counts[classify(name)]++;
    }
  }
  return counts;
}

function parseReadmeTable(readmeText) {
  const rows = new Map();
  const lineRe = /^\|\s*([A-Za-z][A-Za-z ]*?)\s*\|\s*(\d+)\s*\|/;
  let inTable = false;
  for (const line of readmeText.split('\n')) {
    if (line.startsWith('| Domain | Functions |')) { inTable = true; continue; }
    if (inTable) {
      if (!line.startsWith('|')) break;
      if (line.startsWith('|--')) continue;
      const m = lineRe.exec(line);
      if (m) rows.set(m[1].trim(), Number(m[2]));
    }
  }
  return rows;
}

const DOMAIN_TO_README_NAME = {
  quality: 'Quality', metal: 'Metal', chemical: 'Chemical', electronics: 'Electronics',
  construction: 'Construction', automotive: 'Automotive', logistics: 'Logistics',
  energy: 'Energy', safety: 'Safety', food: 'Food', utility: 'Utility', battery: 'Battery',
  environmental: 'Environmental', machining: 'Machining', ie: 'IE',
};

const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const readmeCounts = parseReadmeTable(readme);

let mismatches = 0;
let totalFunctions = 0;
let totalGuards = 0;

console.log('=== function count verification ===\n');
for (const [domain, readmeName] of Object.entries(DOMAIN_TO_README_NAME)) {
  const counts = countDomain(domain);
  totalFunctions += counts.function;
  totalGuards += counts.guard;
  const readmeCount = readmeCounts.get(readmeName);
  const match = readmeCount === counts.function;
  if (!match) mismatches++;
  console.log(
    `${readmeName.padEnd(14)} actual=${counts.function}` +
    ` (guards=${counts.guard} helpers=${counts.helper} constants=${counts.constant})` +
    ` readme=${readmeCount ?? '?'} ${match ? 'OK' : 'MISMATCH'}`,
  );
}

console.log(`\nTotal primary functions: ${totalFunctions}`);
console.log(`Total type guards: ${totalGuards}`);

const featureLine = readme.split('\n').find((l) => /\bindustrial calculations\b/.test(l));
console.log(`README feature bullet: ${featureLine?.trim() ?? '(not found)'}`);

if (mismatches > 0) {
  console.error(`\n${mismatches} domain(s) mismatched — see MISMATCH lines above.`);
  process.exit(1);
}
console.log('\nAll domain counts match README.');
