#!/usr/bin/env node
/**
 * Dependency/runtime-floor drift check — the recurring signal `pnpm outdated` and Node's own
 * EOL schedule don't provide on their own. Run manually (`pnpm check:dependency-drift`) or from
 * the scheduled `dependency-check.yml` workflow.
 *
 * Two checks:
 *   1. Outdated devDependencies (via `pnpm outdated --format json`).
 *   2. Whether the declared `engines.node` floor's EOL date has passed, using endoflife.date's
 *      public API (https://endoflife.date/api/nodejs.json) — the same source manually queried
 *      to find the 2026-04-30 Node 20 EOL date this check exists to catch automatically next
 *      time.
 *
 * Exits 0 always (this is a signal, not a gate — it must never fail CI or block a release on
 * its own); prints a human-readable summary and sets `drift=true|false` on $GITHUB_OUTPUT when
 * running inside GitHub Actions, so the calling workflow decides what to do with the result.
 */
import { execSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';

function getOutdated() {
  try {
    // pnpm outdated exits 1 when packages ARE outdated — that's the expected case here, not a
    // script failure, so capture stdout regardless of exit code.
    execSync('pnpm outdated --format json', { encoding: 'utf8', stdio: 'pipe' });
    return [];
  } catch (err) {
    const stdout = err.stdout?.toString() ?? '';
    if (!stdout.trim()) return [];
    // pnpm can prepend plain-text warnings (e.g. "WARN Unsupported engine: wanted:
    // {"node":">=24"}...") to stdout before the JSON payload. Those warnings can themselves
    // contain `{` characters, so find the line that is *only* an opening brace — pnpm's
    // pretty-printed JSON output always starts its own line that way — rather than the first
    // `{` anywhere in the string.
    const lines = stdout.split('\n');
    const jsonStartLine = lines.findIndex((line) => line.trim() === '{');
    const jsonText = jsonStartLine === -1 ? stdout : lines.slice(jsonStartLine).join('\n');
    try {
      const parsed = JSON.parse(jsonText);
      return Object.entries(parsed).map(([name, info]) => ({
        name, current: info.current, latest: info.latest, type: info.dependencyType,
      }));
    } catch {
      // pnpm's --format json isn't available in every version; fall back to reporting that
      // outdated packages exist without the detail, rather than silently reporting none.
      return [{ name: '(unparseable pnpm outdated output — check manually)', current: '?', latest: '?', type: '?' }];
    }
  }
}

async function getNodeFloorEolStatus() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const engineRange = pkg.engines?.node ?? '';
  const majorMatch = engineRange.match(/(\d+)/);
  if (!majorMatch) return { engineRange, checked: false };
  const declaredMajor = majorMatch[1];

  const res = await fetch('https://endoflife.date/api/nodejs.json');
  if (!res.ok) return { engineRange, checked: false, error: `endoflife.date returned ${res.status}` };
  const cycles = await res.json();
  const cycle = cycles.find((c) => String(c.cycle) === declaredMajor);
  if (!cycle) return { engineRange, checked: false, error: `Node ${declaredMajor} not found in endoflife.date data` };

  const eolDate = new Date(cycle.eol);
  const isPastEol = Number.isFinite(eolDate.getTime()) && eolDate.getTime() < Date.now();
  return { engineRange, checked: true, declaredMajor, eol: cycle.eol, isPastEol };
}

const outdated = getOutdated();
const nodeStatus = await getNodeFloorEolStatus();

console.log('=== dependency drift check ===\n');

if (outdated.length === 0) {
  console.log('Dependencies: up to date.');
} else {
  console.log(`Dependencies: ${outdated.length} outdated —`);
  for (const dep of outdated) {
    console.log(`  ${dep.name}: ${dep.current} -> ${dep.latest} (${dep.type})`);
  }
}

console.log();
if (!nodeStatus.checked) {
  console.log(`Node engine floor: could not check (${nodeStatus.error ?? 'no engines.node declared'}).`);
} else if (nodeStatus.isPastEol) {
  console.log(`Node engine floor: declared >=${nodeStatus.declaredMajor}, EOL was ${nodeStatus.eol} — PAST EOL.`);
} else {
  console.log(`Node engine floor: declared >=${nodeStatus.declaredMajor}, EOL ${nodeStatus.eol} — still supported.`);
}

const drift = outdated.length > 0 || nodeStatus.isPastEol === true;
console.log(`\ndrift: ${drift}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `drift=${drift}\n`);
}
