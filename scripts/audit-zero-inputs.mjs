#!/usr/bin/env node
/**
 * Discovery audit (not a CI gate): a zero input the function accepts and answers with zeros.
 *
 * 0.56.0 removed the zero-valued sentinels the library documented: invalid or empty input throws, an
 * output with no value is `null`. Two undocumented ones survived — `stair()` with no horizontal run gave a
 * 0 mm tread at 90°, `flowControl()` with no flow gave Cv 0 — because nothing listed them as sentinels.
 * What they share: a single input set to 0 collapses the result to zeros, and the function returns.
 *
 * So, for every harvested fixture (the gate's harvester, `lib/fixtures.mjs`), each numeric input leaf is
 * set to 0 in turn. A call that returns is compared with the unmodified call, and it is reported when at
 * least half of the output numbers that were non-zero became 0.
 *
 * A report is a question, not a verdict. A zero input is often a real answer — no usage costs nothing, a
 * flat roof has no pitch. Each finding is triaged by hand: throw (nothing to design or measure), `null`
 * (an output with no value), or keep (the zero is the answer). Exit code is 0 either way.
 *
 * Usage: pnpm build && pnpm audit:zero-inputs [--fn name,name] [--json]
 */
import { loadLibraryAndFixtures, numericLeaves, withLeaf } from './lib/fixtures.mjs';

const only = (() => {
  const i = process.argv.indexOf('--fn');
  return i > 0 ? new Set(process.argv[i + 1].split(',')) : null;
})();

const { lib, fixtures } = await loadLibraryAndFixtures();

/** Every number in an output tree, keyed by its path. */
function numbers(value, at = [], out = new Map()) {
  if (typeof value === 'number') out.set(at.join('.') || '(return)', value);
  else if (Array.isArray(value)) value.forEach((v, i) => numbers(v, [...at, i], out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) numbers(v, [...at, k], out);
  return out;
}

function call(fn, args) {
  try {
    return { ok: true, out: lib[fn](...structuredClone(args)) };
  } catch {
    return { ok: false };
  }
}

const findings = new Map();
let trials = 0;
for (const [fn, list] of fixtures) {
  if (only && !only.has(fn)) continue;
  for (const args of list) {
    const base = call(fn, args);
    if (!base.ok) continue;
    const before = numbers(base.out);
    for (const at of numericLeaves(args)) {
      trials++;
      const r = call(fn, withLeaf(args, at, 0));
      if (!r.ok) continue;
      const after = numbers(r.out);
      const nonZero = [...before].filter(([, v]) => v !== 0);
      if (nonZero.length === 0) continue;
      const collapsed = nonZero.filter(([field]) => after.get(field) === 0);
      if (collapsed.length * 2 < nonZero.length) continue;
      const byInput = findings.get(fn) ?? new Map();
      const key = at.join('.');
      if (!byInput.has(key)) {
        byInput.set(key, `${collapsed.length}/${nonZero.length} → 0 (${collapsed.slice(0, 3).map(([f]) => f).join(', ')})`);
      }
      findings.set(fn, byInput);
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(Object.fromEntries([...findings].map(([fn, byInput]) => [fn, Object.fromEntries(byInput)])), null, 2));
  process.exit(0);
}
console.log(`functions ${only ? only.size : fixtures.size} · trials ${trials} · functions with a zero collapse ${findings.size}`);
for (const [fn, byInput] of [...findings].sort((a, b) => a[0].localeCompare(b[0]))) {
  const inputs = [...byInput];
  console.log(`\n${fn} — ${inputs.length} input(s):`);
  for (const [input, what] of inputs.slice(0, 5)) console.log(`  ${input}=0: ${what}`);
  if (inputs.length > 5) console.log(`  … ${inputs.length - 5} more`);
}
