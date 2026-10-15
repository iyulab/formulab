#!/usr/bin/env node
/**
 * README code examples compile against the published types and print what their comments say.
 *
 * The README is the first thing a reader runs, and nothing ran it: in 2026-10 the OEE example's
 * "95% performance" input gave 105.56 % and its "// 84.6%" was really 94.05, the second OEE example
 * showed a performance factor rounded to three places where the function returns four, and the
 * dimWeight example passed a carrier that does not exist and listed fields the function never returns.
 *
 * For every ```typescript / ```ts block that imports from 'formulab':
 *   1. type-check it against the built declarations (`dist/`) — a wrong field or option fails;
 *   2. run it, recording each `console.log(…)` value;
 *   3. compare each value with the comment that follows it:
 *      - `console.log(x); // 84.65 (%)` — the first number (or the quoted string) must match;
 *      - `console.log(result);` followed by `// { key: value, … }` lines — every `key: number`,
 *        `key: 'string'` or `key: true|false` must match the same-named property of the value
 *        (nested `key: {` levels are followed; a top-level key is searched depth-first). A comment
 *        states what is printed, so numbers must be equal, not merely close.
 * Blocks without a value comment are type-checked and run only.
 *
 * Run: `pnpm build && pnpm check:readme-examples`. Exit 1 on a violation.
 */
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8');

/** Blocks with their starting README line, for messages. */
const blocks = [];
{
  const lines = readme.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^```(typescript|ts)\s*$/.test(lines[i])) continue;
    const start = i + 1;
    let end = start;
    while (end < lines.length && !lines[end].startsWith('```')) end++;
    const code = lines.slice(start, end).join('\n');
    if (/from 'formulab(\/[a-z]+)?'/.test(code)) {
      blocks.push({ line: start + 1, code });
    }
    i = end;
  }
}

// A block that only imports (the type and tree-shaking listings) has nothing to run.
const runnable = blocks.filter(b => /\b[a-zA-Z]+\(/.test(b.code.replace(/^\s*import[\s\S]*?;$/gm, '').replace(/\/\/.*$/gm, '')));
const violations = [];

// 1. Type-check every block, one program for all (each as its own module) — an import-only listing
//    still names exports that must exist.
const dir = mkdtempSync(join(tmpdir(), 'formulab-readme-'));
const files = blocks.map((b, i) => {
  const f = join(dir, `block${i}.ts`);
  writeFileSync(f, `export {};\n${b.code}\n`);
  return f;
});
const program = ts.createProgram(files, {
  strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true, types: [],
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  baseUrl: ROOT, paths: { formulab: ['dist/index.d.ts'], 'formulab/*': ['dist/*/index.d.ts'] },
  noUnusedLocals: false,
});
for (const d of ts.getPreEmitDiagnostics(program)) {
  const idx = files.findIndex(f => d.file && d.file.fileName.replace(/\\/g, '/') === f.replace(/\\/g, '/'));
  // The tree-shaking listing shows alternative imports of the same names side by side on purpose.
  if (idx < 0 || d.code === 2300) continue;
  const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
  violations.push(`README.md:${blocks[idx].line + line - 1} — ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
}

// 2–3. Run and compare.
const distUrl = (sub) => pathToFileURL(join(ROOT, 'dist', sub ?? '', 'index.js')).href;

/** Value comments, keyed by the 0-based line of their console.log within the block. */
function expectations(code) {
  const lines = code.split('\n');
  const out = new Map();
  lines.forEach((l, i) => {
    if (!/console\.log\(/.test(l)) return;
    const inline = l.match(/console\.log\([^)]*\);?\s*\/\/\s*(.+)$/);
    if (inline) { out.set(i, { kind: 'scalar', text: inline[1].trim() }); return; }
    const following = [];
    for (let j = i + 1; j < lines.length && /^\s*\/\//.test(lines[j]); j++) following.push(lines[j].replace(/^\s*\/\/\s?/, ''));
    if (following.length) out.set(i, { kind: 'object', text: following.join('\n') });
  });
  return out;
}

/** A comment states what `console.log` prints, so a number must be that number (`1.0` reads as 1). */
function sameNumber(actual, written) {
  return typeof actual === 'number' && actual === Number(written);
}
function findKey(value, key, seen = new Set()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return undefined;
  seen.add(value);
  if (Object.hasOwn(value, key)) return { found: true, v: value[key] };
  for (const v of Object.values(value)) {
    const r = findKey(v, key, seen);
    if (r) return r;
  }
  return undefined;
}

let compared = 0;
for (const b of runnable) {
  const exp = expectations(b.code);
  const logged = [];
  const lines = b.code.split('\n');
  const instrumented = lines
    .map((l, i) => l.replace(/console\.log\(/, `__log(${i}, `))
    .join('\n')
    .replace(/from 'formulab(?:\/([a-z]+))?'/g, (_m, sub) => `from '${distUrl(sub)}'`);
  const js = ts.transpileModule(instrumented, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const f = join(dir, `run-${b.line}.mjs`);
  writeFileSync(f, `const __logs = globalThis.__readmeLogs;\nconst __log = (i, v) => __logs.push([i, v]);\n${js}`);
  globalThis.__readmeLogs = logged;
  try {
    await import(pathToFileURL(f).href);
  } catch (e) {
    violations.push(`README.md:${b.line} — the example throws: ${e instanceof Error ? e.message : String(e)}`);
    continue;
  }
  for (const [i, value] of logged) {
    const e = exp.get(i);
    if (!e) continue;
    const at = `README.md:${b.line + i}`;
    if (e.kind === 'scalar') {
      compared++;
      const str = e.text.match(/^"([^"]*)"|^'([^']*)'/);
      if (str) {
        const want = str[1] ?? str[2];
        if (value !== want) violations.push(`${at} — prints ${JSON.stringify(value)}, the comment says "${want}"`);
        continue;
      }
      const num = e.text.match(/-?\d+(?:\.\d+)?/);
      if (num && !sameNumber(value, num[0])) violations.push(`${at} — prints ${JSON.stringify(value)}, the comment says ${num[0]}`);
      continue;
    }
    // `key: {` opens a level and `}` closes it, so `percentages: { oee: 82.5 }` reads percentages.oee;
    // a top-level key is looked up depth-first.
    const path = [];
    for (const m of e.text.matchAll(/([A-Za-z_]\w*)\s*:\s*(?:(\{)|(-?\d+(?:\.\d+)?|'[^']*'|"[^"]*"|true|false)(?=\s*[,}\n/]|\s*$))|(\})/g)) {
      if (m[4]) { path.pop(); continue; }
      const [, key, open, written] = m;
      if (open) { path.push(key); continue; }
      compared++;
      const at2 = `${at} (${[...path, key].join('.')})`;
      let hit;
      if (path.length) {
        let v = value;
        for (const k of [...path, key]) v = v !== null && typeof v === 'object' && Object.hasOwn(v, k) ? v[k] : undefined;
        hit = v === undefined ? undefined : { found: true, v };
      } else {
        hit = findKey(value, key);
      }
      if (!hit) { violations.push(`${at2} — the comment shows \`${key}\`, which the result does not have`); continue; }
      const ok = /^-?\d/.test(written) ? sameNumber(hit.v, written)
        : written === 'true' || written === 'false' ? hit.v === (written === 'true')
        : hit.v === written.slice(1, -1);
      if (!ok) violations.push(`${at2} — is ${JSON.stringify(hit.v)}, the comment says ${written}`);
    }
  }
}
rmSync(dir, { recursive: true, force: true });

if (violations.length) {
  console.error(`❌ README examples: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log(`✅ README examples — ${blocks.length} blocks type-check, ${runnable.length} run, ${compared} commented values match`);
