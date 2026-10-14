#!/usr/bin/env node
/**
 * Discovery audit (not a CI gate): inputs outside a formula's domain that the function accepts.
 *
 * `check:nonfinite-outputs` catches an input that drives an output to NaN/Infinity. It cannot see
 * the other way an out-of-domain input slips through: a finite result that reads as valid — a 95°
 * slope read back as −85°, a −6.24 mm tap drill, a −34.7 mm gauge stack (all fixed in 0.55.0). What
 * those had in common is a sign: an output that is non-negative for the tested input turns negative
 * for an input the function did not refuse.
 *
 * So, for every harvested fixture (the same harvester as the gate, `lib/fixtures.mjs`), each numeric
 * input leaf is replaced in turn by probes on the far side of common domains — negative, an angle past
 * 90° and past 180° — and a call that returns is compared with the unmodified call:
 * every output field that was ≥ 0 and is now < 0 is reported.
 *
 * A report is a question, not a verdict. A negative input can legitimately give a negative output
 * (a downhill grade, a loss, a deviation), so each finding is triaged by hand: throw for the input, or
 * accept the sign as meaningful. Exit code is 0 either way.
 *
 * Usage: pnpm build && pnpm audit:sign-flips [--fn name,name] [--json]   (--json: every finding, machine-readable)
 */
import { loadLibraryAndFixtures, numericLeaves, withLeaf } from './lib/fixtures.mjs';

const PROBES = [-1, -10, 95, 180, 270];
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
      for (const probe of PROBES) {
        trials++;
        const r = call(fn, withLeaf(args, at, probe));
        if (!r.ok) continue;
        const flipped = [];
        for (const [field, v] of numbers(r.out)) {
          const was = before.get(field);
          if (was !== undefined && was >= 0 && v < 0) flipped.push(`${field} ${was} → ${v}`);
        }
        if (flipped.length === 0) continue;
        const byInput = findings.get(fn) ?? new Map();
        const key = `${at.join('.')}=${probe}`;
        if (!byInput.has(key)) byInput.set(key, flipped.slice(0, 3).join(', '));
        findings.set(fn, byInput);
      }
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(Object.fromEntries([...findings].map(([fn, byInput]) => [fn, Object.fromEntries(byInput)])), null, 2));
  process.exit(0);
}
console.log(`functions ${only ? only.size : fixtures.size} · trials ${trials} · functions with a sign flip ${findings.size}`);
for (const [fn, byInput] of [...findings].sort((a, b) => a[0].localeCompare(b[0]))) {
  const inputs = [...byInput];
  console.log(`\n${fn} — ${inputs.length} accepted input(s):`);
  for (const [input, flips] of inputs.slice(0, 4)) console.log(`  ${input}: ${flips}`);
  if (inputs.length > 4) console.log(`  … ${inputs.length - 4} more`);
}
