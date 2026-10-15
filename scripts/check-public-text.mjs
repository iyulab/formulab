#!/usr/bin/env node
/**
 * Everything this repository ships or shows is public — source comments, tests, README, CHANGELOG,
 * ERRORS.md, scripts. Text written while maintaining it must describe the library's behaviour, not
 * the process around it: in 2026-10 some forty internal references had accumulated (issue-draft file
 * names, planning-folder paths, cycle numbers, tracker ids, the name of a consuming application) and
 * were removed by hand.
 *
 * This check matches the *shapes* such references take, not a list of words, so a new one is caught
 * without anyone having to know its vocabulary first:
 *   - issue-draft file names            ISSUE-<anything>-<8-digit date>
 *   - a planning folder                 claudedocs/
 *   - work-cycle numbers                cycle-123
 *   - tracker / decision ids            NT-12 · SIP-345-01 · HD-20 · L1-589-01 · R12-10-15-01 · D-342
 *   - an absolute local path            C:\Users\…  ·  /c/data/…  ·  /Users/<name>/…
 *
 * Exempt: `.gitignore` (it names folders precisely so they are never committed).
 * Run: `pnpm check:public-text`. Exit 1 on a match.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const PATTERNS = [
  { name: 'issue-draft file name', re: /\bISSUE-[A-Za-z0-9-]*\d{8}/ },
  { name: 'planning folder', re: /\bclaudedocs\// },
  { name: 'work-cycle number', re: /\bcycle-\d{2,}\b/ },
  { name: 'tracker id', re: /\b(?:NT|SIP|HD|BD|PD)-\d+\b/ },
  { name: 'decision id', re: /\b(?:L[0-3]|R\d{1,2})-\d{3}-\d{2}\b|\bR\d{1,2}-\d{2}-\d{2}-\d{2}\b|\bD-\d{3}\b/ },
  { name: 'absolute local path', re: /\b[A-Za-z]:\\(?:Users|data)\\|\/c\/data\/|\/Users\/[a-z][\w.-]*\// },
];

const EXEMPT = new Set(['.gitignore']);
const BINARY = /\.(?:png|jpe?g|gif|ico|wasm|woff2?|pdf|zip|gz)$/i;
const SELF = 'scripts/check-public-text.mjs';

const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf-8' })
  .split('\n')
  .filter((f) => f && !EXEMPT.has(f) && f !== SELF && !BINARY.test(f) && !/(?:^|\/)pnpm-lock\.yaml$/.test(f));

const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(join(ROOT, file), 'utf-8');
  } catch {
    continue; // listed but absent in this checkout (e.g. a deleted, unstaged file)
  }
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const { name, re } of PATTERNS) {
      const m = lines[i].match(re);
      if (m) hits.push(`${file}:${i + 1} — ${name}: \`${m[0]}\``);
    }
  }
}

if (hits.length) {
  console.error(`❌ public text: ${hits.length} internal reference(s) — describe the behaviour instead\n`);
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}
console.log(`✅ public text — ${files.length} tracked files, no internal reference shapes`);
