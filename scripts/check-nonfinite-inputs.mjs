#!/usr/bin/env node
/**
 * Every public function refuses a non-finite input — NaN or ±Infinity anywhere in its argument.
 *
 * A guard written `x <= 0` lets NaN through (every comparison with NaN is false), and the formula then
 * turns it into `null` outputs beside a confident verdict — an arc-flash study with no incident energy
 * that still named PPE category 4. `check:nonfinite-outputs` only sees NaN/Infinity in the output; once
 * 0.56.0 mapped those to `null`, the input that caused them became invisible. The 2026-10 run of this
 * check found 99 functions accepting NaN; the fix is one entry check, `requireFinite()` (`src/utils.ts`).
 *
 * For every harvested fixture (the shared harvester, `lib/fixtures.mjs`), each numeric input leaf is set
 * to NaN, then to Infinity. A call that returns is a violation. Type guards are skipped: they check
 * shape and answer with a boolean, and the function they guard refuses the value.
 *
 * Usage: pnpm build && pnpm check:nonfinite-inputs [--fn name,name]. Exit 1 on a violation.
 */
import { loadLibraryAndFixtures, numericLeaves, withLeaf } from './lib/fixtures.mjs';

const only = (() => {
  const i = process.argv.indexOf('--fn');
  return i > 0 ? new Set(process.argv[i + 1].split(',')) : null;
})();

const { lib, fixtures } = await loadLibraryAndFixtures();

function returns(fn, args) {
  try {
    return { out: lib[fn](...structuredClone(args)) };
  } catch {
    return null;
  }
}

const violations = new Map();
let trials = 0;
for (const [fn, list] of fixtures) {
  if (only && !only.has(fn)) continue;
  for (const args of list) {
    const base = returns(fn, args);
    // A type guard (`isCRateInput`) answers a shape question with a boolean; it never throws.
    if (!base || typeof base.out === 'boolean') continue;
    for (const at of numericLeaves(args)) {
      for (const value of [NaN, Infinity]) {
        trials++;
        if (!returns(fn, withLeaf(args, at, value))) continue;
        const byInput = violations.get(fn) ?? new Set();
        byInput.add(`${at.join('.')}=${value}`);
        violations.set(fn, byInput);
      }
    }
  }
}

console.log(`functions ${only ? only.size : fixtures.size} · trials ${trials} · accepting a non-finite input ${violations.size}`);
for (const [fn, inputs] of [...violations].sort((a, b) => a[0].localeCompare(b[0]))) {
  const list = [...inputs];
  console.log(`  ${fn}: ${list.slice(0, 6).join(', ')}${list.length > 6 ? ` … ${list.length - 6} more` : ''}`);
}
if (violations.size > 0) process.exit(1);
