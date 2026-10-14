#!/usr/bin/env node
/**
 * Every function ERRORS.md documents as `throw` has a test that watches it throw.
 *
 * ERRORS.md is the error contract readers and consumers rely on, and nothing tied it to the code:
 * in 2026-10 seven functions documented as `throw` validated nothing — `threadOverWires()` returned
 * a pitch diameter of −0.299 mm for a thread that cannot exist, `chargingLoss()` a negative charging
 * time, `gaugeBlockStack()` a 550 mm stack for a 1000 mm target, and `taktTime()`, `batch()` and
 * `paretoAnalysis()` zero-filled results. Their test files had no `toThrow` at all; some pinned the
 * zero results instead. (The 2026-07 contract restoration fixed ten more of the same kind by hand.)
 *
 * The rule checked here is the smallest one that catches that class: for each `| \`fn()\` | \`throw\` |`
 * row, some test file contains `expect(() => …fn(…)…).toThrow…`. It does not prove every documented
 * condition is covered — it proves the documented behaviour is exercised at least once, so a row
 * with no implementation behind it fails the build instead of waiting for a reader to find it.
 *
 * Run: `pnpm check:documented-throws`. Exit 1 on a violation.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

/** Functions whose ERRORS.md row says `throw`. */
const errors = readFileSync(join(ROOT, 'ERRORS.md'), 'utf8');
const documented = [...errors.matchAll(/^\|\s*`(\w+)\(\)`\s*\|\s*`throw`\s*\|/gm)].map((m) => m[1]);

/** The text of each `expect(() => …)` argument that is followed by `.toThrow`. */
function throwingBodies(src) {
  const bodies = [];
  const opener = /expect\(\s*(?:async\s*)?\(\)\s*=>/g;
  for (const m of src.matchAll(opener)) {
    // Walk to the parenthesis that closes `expect(`.
    let depth = 1;
    let i = m.index + 'expect('.length;
    for (; i < src.length && depth > 0; i++) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
    }
    if (/^\s*(?:\.rejects)?\s*\.toThrow/.test(src.slice(i, i + 40))) bodies.push(src.slice(m.index, i));
  }
  return bodies;
}

const bodies = walk(join(ROOT, 'src')).flatMap((file) => throwingBodies(readFileSync(file, 'utf8')));

const missing = documented.filter((fn) => !bodies.some((b) => new RegExp(`\\b${fn}\\(`).test(b)));

if (missing.length > 0) {
  console.error(`❌ documented throws: ${missing.length} function(s) ERRORS.md lists as \`throw\` with no test that sees them throw\n`);
  for (const fn of missing) console.error(`  ${fn}() — add expect(() => ${fn}(<an input the row names>)).toThrow(), or correct its ERRORS.md row`);
  process.exit(1);
}
console.log(`✅ documented throws — all ${documented.length} \`throw\` rows in ERRORS.md have a test that sees the function throw (${relative(ROOT, join(ROOT, 'src'))}/**/*.test.ts)`);
