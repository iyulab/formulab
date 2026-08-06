/**
 * audit-constant-provenance.mjs
 *
 * Finds constants that decide a verdict but do not say where they come from.
 *
 * A constant read through a comparison to produce a warning or a status is doing more
 * work than one that is merely displayed. When a displayed figure has no stated origin
 * that is an accuracy question; when a *threshold* has none, a caller cannot tell a legal
 * limit from a shop convention, and a limit that is quietly too generous produces a
 * reassuring answer nobody can audit.
 *
 * ## The filter is mechanical, and deliberately narrow
 *
 * A constant is in scope only if a code path reads it through a comparison that feeds a
 * verdict. "Is a magic number" and "is displayed" describe a far larger class and are not
 * covered here. Without that line the audit has no defensible stopping point and turns
 * into noise, which is the failure mode of every provenance sweep that gets ignored.
 *
 * ## Three buckets, not two
 *
 *   SOURCED   the doc comment names a normative source
 *   DECLARED  the doc comment states there is no normative source
 *   SILENT    nothing is said either way  <- the work list
 *
 * DECLARED is a finished state, not a lesser one. Saying "these are conventional values
 * with nothing behind them" is a real answer, and often the only honest one: replacing an
 * unsourced figure with another unsourced figure is not an improvement.
 *
 * ## Controls
 *
 * A check that starts at zero findings cannot tell "clean" from "broken", so known states
 * are re-verified on every run: the bend constants must land in DECLARED, and something
 * somewhere must land in SOURCED. Either failing means the classifier died, not that the
 * codebase changed.
 *
 * ## Known limits — read before trusting a zero
 *
 * Data flow is followed one hop. A table reached as `const t = TABLE[key]` and then
 * compared through `t.field` is two hops and is NOT reported: that is exactly how the
 * heat-stress limits were missed on the first pass. This under-reports, which is why it
 * reports rather than fails, and why it is an audit rather than a gate.
 *
 * It also needs source, not build output: compiled output drops module-private doc
 * comments, and the controls above will fail loudly rather than report a false all-clear.
 *
 * Usage: npm run audit:constant-provenance
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] || 'src';

/** A standards body followed by a number that identifies a document. */
const SOURCE_MARKERS =
  /\b(ISO|ASME|DIN|ASTM|JIS|AWS|API|IEC|ANSI|BS|EN|SAE|NIOSH|ACGIH|OSHA|NFPA|IPC|AIAG|VDI|GB|KS|IATF|IEEE|CIE|WHO|IPCC|EPA|ASHRAE|CIBSE|UL|MIL|NASA|CODATA|NIST)[\s-]?\d/;
const REFERENCE_TAG = /@(reference|source|see|standard)\b/i;
/** Statements that there is deliberately no normative source. */
const DECLARED_UNSOURCED =
  /\b(no normative source|no standard defines|not\s+(?:values\s+|limits\s+)?(?:drawn|taken)\s+from|conventional(?:\s+\w+)*\s+(?:defaults?|values?|proportions?|nominal)|shop defaults?|rule of thumb|in common use|empirical(?:ly)?\s+(?:derived|chosen)|not a specification|could not be confirmed|carry no verified source)\b/i;

const DECL = /^(?:export\s+)?const\s+([A-Z][A-Z0-9_]{2,})\b/;
const COMPARISON = /[<>]=?|===|!==/;
/** Signals that a comparison is producing a verdict rather than doing arithmetic. */
const VERDICT_SINK =
  /\b(warn|warning|warnings|status|verdict|severity|pass|fail|ok|valid|invalid|acceptable|safe|unsafe|exceed|violat|reject|accept|risk|grade|level|band|classif|interpret|recommend|flag|alert|error|threshold|limit|allowable)\w*\b/i;

function sources(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') sources(p, out);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

/** The doc comment immediately above line `i`, if any. */
function docAbove(lines, i) {
  const buf = [];
  for (let j = i - 1; j >= 0; j--) {
    const line = lines[j].trim();
    if (line === '') { if (buf.length) break; continue; }
    if (!line.startsWith('*') && !line.startsWith('/*') && !line.startsWith('//')) break;
    buf.unshift(lines[j]);
    if (line.startsWith('/*')) break;
  }
  return buf.join('\n');
}

const rows = [];

for (const file of sources(SRC)) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const declared = DECL.exec(lines[i]);
    if (!declared) continue;
    const name = declared[1];

    // Read forward to the end of the initializer so numeric tables are recognised too.
    let body = '';
    let depth = 0;
    let opened = false;
    for (let k = i; k < Math.min(i + 200, lines.length); k++) {
      body += lines[k] + '\n';
      for (const ch of lines[k]) {
        if (ch === '{' || ch === '[') { depth++; opened = true; }
        else if (ch === '}' || ch === ']') depth--;
      }
      if (opened && depth <= 0) break;
      if (!opened && /;\s*$/.test(lines[k])) break;
    }
    if (!/\d/.test(body)) continue;

    const declaredLineCount = body.split('\n').length - 1;
    const uses = [];
    const re = new RegExp('\\b' + name + '\\b');
    for (let k = 0; k < lines.length; k++) {
      if (k >= i && k < i + declaredLineCount) continue;
      if (re.test(lines[k])) uses.push(k);
    }

    let judgment = false;
    const evidence = [];
    for (const k of uses) {
      const window = lines.slice(Math.max(0, k - 2), Math.min(lines.length, k + 8)).join('\n');
      const direct = COMPARISON.test(lines[k]);
      let hop = false;
      const assign = /const\s+([a-zA-Z_$][\w$]*)\s*=/.exec(lines[k]);
      if (assign) {
        const local = new RegExp('\\b' + assign[1] + '\\b');
        for (let k2 = k + 1; k2 < Math.min(lines.length, k + 30); k2++) {
          if (local.test(lines[k2]) && COMPARISON.test(lines[k2])) { hop = true; break; }
        }
      }
      if ((direct || hop) && VERDICT_SINK.test(window)) {
        judgment = true;
        evidence.push(`${path.relative(SRC, file).replace(/\\/g, '/')}:${k + 1}  ${lines[k].trim().slice(0, 90)}`);
      }
    }
    if (!judgment) continue;

    const doc = docAbove(lines, i);
    const bucket = SOURCE_MARKERS.test(doc) || REFERENCE_TAG.test(doc)
      ? 'SOURCED'
      : DECLARED_UNSOURCED.test(doc)
        ? 'DECLARED'
        : 'SILENT';

    rows.push({ file: path.relative(SRC, file).replace(/\\/g, '/'), name, bucket, evidence: evidence.slice(0, 2) });
  }
}

const of = (bucket) => rows.filter((r) => r.bucket === bucket);
const failures = [];
const bend = rows.filter((r) => r.file.endsWith('metal/bendAllowance.ts'));
if (bend.length === 0) {
  failures.push('the bend module produced no judgment-bearing constant, so the scan is not reaching it');
} else if (!bend.some((r) => r.name === 'MIN_BEND_RADIUS_MULTIPLIER' && r.bucket === 'DECLARED')) {
  failures.push('the minimum bend radius table is no longer classified DECLARED: ' + JSON.stringify(bend.map((r) => [r.name, r.bucket])));
}
if (of('SOURCED').length === 0) failures.push('nothing classified SOURCED, so the source detector is dead rather than the code clean');

console.log('=== controls ===');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`ok — bend constants DECLARED, ${of('SOURCED').length} SOURCED found`);

console.log(`\n=== counts ===\njudgment-bearing numeric constants: ${rows.length}`);
console.log(`  SOURCED  ${of('SOURCED').length}`);
console.log(`  DECLARED ${of('DECLARED').length}`);
console.log(`  SILENT   ${of('SILENT').length}`);

console.log('\n=== SILENT — a person decides ===');
console.log('A definition (a colour code, a unit conversion) needs no source. An empirical');
console.log('threshold does, and where none exists, say so rather than leaving it blank.\n');
for (const row of of('SILENT')) {
  console.log(`${row.file}  ::  ${row.name}`);
  for (const line of row.evidence) console.log(`    ${line}`);
}
