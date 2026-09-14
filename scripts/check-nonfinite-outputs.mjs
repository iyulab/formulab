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
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const UNCOVERED_FILE = path.join(ROOT, 'scripts', 'nonfinite-uncovered.json');
const DEGENERATE = [0, -1];

const require = createRequire(import.meta.url);
const ts = require('typescript');

function walk(dir, keep, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, keep, out);
    else if (keep(name)) out.push(p);
  }
  return out;
}

// ── 0. Build freshness ───────────────────────────────────────────────────────
if (!existsSync(path.join(DIST, 'index.js'))) {
  console.error('dist/ not found — run `pnpm build` first.');
  process.exit(1);
}
const stale = walk(SRC, (n) => n.endsWith('.ts') && !n.endsWith('.test.ts'))
  .filter((src) => {
    const out = path.join(DIST, path.relative(SRC, src)).replace(/\.ts$/, '.js');
    return !existsSync(out) || statSync(src).mtimeMs > statSync(out).mtimeMs;
  })
  .map((src) => path.relative(ROOT, src));
if (stale.length > 0) {
  console.error(`dist/ is older than ${stale.length} source file(s) — run \`pnpm build\` first:`);
  for (const s of stale.slice(0, 10)) console.error(`  ${s}`);
  process.exit(1);
}

const lib = await import(pathToFileURL(path.join(DIST, 'index.js')).href);
const exported = Object.keys(lib).filter((k) => typeof lib[k] === 'function').sort();
const exportedSet = new Set(exported);

// ── 1. Allowed sentinels, from ERRORS.md ─────────────────────────────────────
const errorsDoc = readFileSync(path.join(ROOT, 'ERRORS.md'), 'utf8');
const allowed = new Set();
for (const m of errorsDoc.matchAll(/`(\w+)\(\)` returns `(\w+) = (Infinity|NaN)`/g)) {
  allowed.add(`${m[1]}.${m[2]}`);
}

// ── 2. Harvest literal fixtures from tests ───────────────────────────────────
const NOT_LITERAL = Symbol('not-literal');
function literal(node) {
  const k = ts.SyntaxKind;
  switch (node.kind) {
    case k.NumericLiteral: return Number(node.text);
    case k.StringLiteral:
    case k.NoSubstitutionTemplateLiteral: return node.text;
    case k.TrueKeyword: return true;
    case k.FalseKeyword: return false;
    case k.NullKeyword: return null;
    case k.ParenthesizedExpression:
    case k.AsExpression:
    case k.SatisfiesExpression: return literal(node.expression);
    case k.PrefixUnaryExpression: {
      const v = literal(node.operand);
      if (typeof v !== 'number') return NOT_LITERAL;
      if (node.operator === k.MinusToken) return -v;
      if (node.operator === k.PlusToken) return v;
      return NOT_LITERAL;
    }
    case k.ArrayLiteralExpression: {
      const out = [];
      for (const e of node.elements) {
        const v = literal(e);
        if (v === NOT_LITERAL) return NOT_LITERAL;
        out.push(v);
      }
      return out;
    }
    case k.ObjectLiteralExpression: {
      const out = {};
      for (const p of node.properties) {
        if (!ts.isPropertyAssignment(p)) return NOT_LITERAL;
        const v = literal(p.initializer);
        if (v === NOT_LITERAL) return NOT_LITERAL;
        out[p.name.text ?? p.name.getText()] = v;
      }
      return out;
    }
    default: return NOT_LITERAL;
  }
}

const fixtures = new Map();
for (const file of walk(SRC, (n) => n.endsWith('.test.ts'))) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
      && exportedSet.has(node.expression.text)) {
      const args = node.arguments.map(literal);
      if (!args.includes(NOT_LITERAL)) {
        const list = fixtures.get(node.expression.text) ?? [];
        const key = JSON.stringify(args);
        if (!list.some((a) => JSON.stringify(a) === key)) list.push(args);
        fixtures.set(node.expression.text, list);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

// ── 3. Degenerate and judge ──────────────────────────────────────────────────
function numericLeaves(value, at = [], out = []) {
  if (typeof value === 'number') out.push(at);
  else if (Array.isArray(value)) value.forEach((v, i) => numericLeaves(v, [...at, i], out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) numericLeaves(v, [...at, k], out);
  return out;
}
function withLeaf(args, at, value) {
  const copy = structuredClone(args);
  let cur = copy;
  for (let i = 0; i < at.length - 1; i++) cur = cur[at[i]];
  cur[at[at.length - 1]] = value;
  return copy;
}
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

// ── 4. Coverage ratchet ──────────────────────────────────────────────────────
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
