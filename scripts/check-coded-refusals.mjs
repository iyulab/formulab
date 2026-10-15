#!/usr/bin/env node
/**
 * Refusals carry their facts as data: new guards throw `inputRangeError(…)`, not a bare `new RangeError(…)`.
 *
 * A bare `RangeError` has only an English sentence, which a consumer with a non-English UI can neither
 * show nor parse. `inputRangeError()` attaches `code`, `parameter`, the bound and
 * the value given. The guards whose condition reads as «one input against its bounds» were converted;
 * the rest (unknown table keys, conditions over several inputs, per-item checks inside loops) still throw
 * a bare `RangeError` and are counted here. The count may only go down: a new bare throw fails, and a
 * converted one asks for the baseline to be lowered so it cannot creep back.
 *
 * Run: `pnpm check:coded-refusals`. Exit 1 when the count rises above the baseline.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Bare `throw new RangeError(` left in src/. Lower it when you convert one; never raise it. */
const BASELINE = 233;

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

const sites = [];
for (const file of walk(join(ROOT, 'src'))) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/\bthrow new RangeError\(/.test(line)) sites.push(`${relative(ROOT, file)}:${i + 1}`);
  });
}

if (sites.length > BASELINE) {
  console.error(`check:coded-refusals — ${sites.length} bare RangeError throws, baseline ${BASELINE}.`);
  console.error('A new guard should throw inputRangeError() (src/errors.ts) with code, parameter, bound and got.');
  console.error('Sites (the new one is among them):');
  for (const s of sites) console.error(`  ${s}`);
  process.exit(1);
}
if (sites.length < BASELINE) {
  console.log(`check:coded-refusals — ${sites.length} bare RangeError throws, below the baseline ${BASELINE}: lower BASELINE in scripts/check-coded-refusals.mjs to ${sites.length}.`);
  process.exit(1);
}
console.log(`check:coded-refusals — ${sites.length} bare RangeError throws (baseline ${BASELINE}).`);
