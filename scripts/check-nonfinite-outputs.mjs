#!/usr/bin/env node
/**
 * Execution-based check of ERRORS.md's "No silent NaN/Infinity" policy.
 *
 * Reading a guard is not the same as watching it hold: a function that throws for one input can
 * sit beside an unguarded second one, and a value nested in an object or array is invisible to a
 * review of the top-level signature. So this runs the library instead of reading it:
 *
 *   1. Harvest inputs. Every `src/**\/*.test.ts` is parsed with the TypeScript compiler; each call to
 *      an exported function whose arguments are pure literals (numbers, strings, booleans, null,
 *      arrays and object literals of those) becomes a fixture.
 *   2. Degenerate them. Every numeric leaf of every fixture, nested ones included, is replaced in
 *      turn by 0 and by -1, and the function is called.
 *   3. Judge the output. A throw passes (that is the policy). A return passes only if every number
 *      in the whole output tree is finite. The unmodified fixture is judged the same way.
 *
 * Exempt outputs come from ERRORS.md itself, not from a list kept here: a sentence of the form
 * "`fn()` returns `field = Infinity`" (or `NaN`) exempts exactly that field of that function.
 * Documenting a sentinel is how it becomes allowed; nothing else is.
 *
 * Coverage is ratcheted. Functions with no harvestable fixture are listed in
 * `scripts/nonfinite-uncovered.json`. A newly exported function without a fixture fails the check
 * (add a literal-argument test), and a listed function that has gained one also fails (remove it
 * from the list), so the list can only shrink.
 *
 * Runs against dist/, so it refuses to run when any source file is newer than its build output —
 * a stale build reports functions that were already fixed.
 *
 * Usage: pnpm build && pnpm check:nonfinite-outputs     (exit 1 on any finding)
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadLibraryAndFixtures, numericLeaves, withLeaf } from './lib/fixtures.mjs';

const UNCOVERED_FILE = path.join(ROOT, 'scripts', 'nonfinite-uncovered.json');
const DEGENERATE = [0, -1];

const { lib, exported, fixtures } = await loadLibraryAndFixtures();

// ── 1. Allowed sentinels, from ERRORS.md ─────────────────────────────────────
const errorsDoc = readFileSync(path.join(ROOT, 'ERRORS.md'), 'utf8');
const allowed = new Set();
for (const m of errorsDoc.matchAll(/`(\w+)\(\)` returns `(\w+) = (Infinity|NaN)`/g)) {
  allowed.add(`${m[1]}.${m[2]}`);
}

// ── 2. Degenerate and judge ──────────────────────────────────────────────────
/** Non-finite numbers in an output tree, as `field.path=value`; the top-level field is kept for the allowlist. */
function nonFinite(value, at = [], out = []) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push({ top: String(at[0] ?? ''), text: `${at.join('.') || '(return)'}=${value}` });
  } else if (Array.isArray(value)) value.forEach((v, i) => nonFinite(v, [...at, i], out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) nonFinite(v, [...at, k], out);
  return out;
}

const findings = new Map();
let trials = 0;
function judge(fn, args, label) {
  trials++;
  let out;
  try {
    out = lib[fn](...structuredClone(args));
  } catch {
    return;
  }
  const bad = nonFinite(out).filter((b) => !allowed.has(`${fn}.${b.top}`));
  if (bad.length === 0) return;
  const list = findings.get(fn) ?? [];
  if (list.length < 3) list.push(`${label} → ${bad.slice(0, 3).map((b) => b.text).join(', ')}`);
  findings.set(fn, list);
}
for (const [fn, list] of fixtures) {
  for (const args of list) {
    judge(fn, args, 'fixture');
    for (const at of numericLeaves(args)) {
      for (const d of DEGENERATE) judge(fn, withLeaf(args, at, d), `${at.join('.')}=${d}`);
    }
  }
}

// ── 3. Coverage ratchet ──────────────────────────────────────────────────────
const uncovered = exported.filter((f) => !fixtures.has(f));
const listed = existsSync(UNCOVERED_FILE) ? JSON.parse(readFileSync(UNCOVERED_FILE, 'utf8')) : [];
const newlyUncovered = uncovered.filter((f) => !listed.includes(f));
const nowCovered = listed.filter((f) => !uncovered.includes(f));

console.log(
  `functions ${exported.length} · with fixtures ${fixtures.size} · without ${uncovered.length} · ` +
  `trials ${trials} · allowed sentinels ${[...allowed].join(', ') || 'none'}`,
);

let failed = false;
if (findings.size > 0) {
  failed = true;
  console.error(`\nNon-finite output from ${findings.size} function(s) — throw RangeError for the input, or document the sentinel in ERRORS.md as "\`fn()\` returns \`field = Infinity\`":`);
  for (const [fn, list] of findings) console.error(`  ${fn}: ${list.join(' | ')}`);
}
if (newlyUncovered.length > 0) {
  failed = true;
  console.error(`\nNo literal-argument test call found for: ${newlyUncovered.join(', ')} — add one, so the audit can exercise the function.`);
}
if (nowCovered.length > 0) {
  failed = true;
  console.error(`\nNow covered, remove from scripts/nonfinite-uncovered.json: ${nowCovered.join(', ')}`);
}
if (failed) process.exit(1);
console.log('No non-finite outputs outside documented sentinels.');
