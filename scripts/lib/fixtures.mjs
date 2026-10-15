/**
 * Shared by the execution audits: load the built library and harvest the literal-argument calls in
 * the tests as fixtures, then vary one numeric leaf at a time.
 *
 * - `check-nonfinite-outputs.mjs` (CI gate) — no NaN/Infinity in any output.
 * - `audit-sign-flips.mjs` (discovery, not a gate) — a non-negative output turned negative by an input
 *   the function accepted, the mark of an input outside the formula's domain.
 *
 * One harvester, so both audits exercise exactly the same calls.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
export const SRC = path.join(ROOT, 'src');
export const DIST = path.join(ROOT, 'dist');

const require = createRequire(import.meta.url);
const ts = require('typescript');

export function walk(dir, keep, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, keep, out);
    else if (keep(name)) out.push(p);
  }
  return out;
}

/**
 * The built library (refusing a dist/ older than any source file — a stale build reports functions
 * already fixed), its exported function names, and the harvested fixtures per function.
 */
export async function loadLibraryAndFixtures() {
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
  // Calculations only: an exported class (`InputRangeError`) is a function to `typeof`, not a formula.
  const exported = Object.keys(lib)
    .filter((k) => typeof lib[k] === 'function' && !/^class\b/.test(Function.prototype.toString.call(lib[k])))
    .sort();
  const exportedSet = new Set(exported);


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

  return { lib, exported, exportedSet, fixtures };
}

export function numericLeaves(value, at = [], out = []) {
  if (typeof value === 'number') out.push(at);
  else if (Array.isArray(value)) value.forEach((v, i) => numericLeaves(v, [...at, i], out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) numericLeaves(v, [...at, k], out);
  return out;
}
export function withLeaf(args, at, value) {
  const copy = structuredClone(args);
  let cur = copy;
  for (let i = 0; i < at.length - 1; i++) cur = cur[at[i]];
  cur[at[at.length - 1]] = value;
  return copy;
}
