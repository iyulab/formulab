# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`formulab` is a zero-dependency, tree-shakeable TypeScript library of ~218 industrial/manufacturing calculation functions spread across 15 domains (quality, metal, chemical, electronics, construction, automotive, logistics, energy, safety, food, utility, battery, environmental, machining, ie). It ships as ESM only. Each function is a pure input→output calculation, often verified against a published engineering standard.

## Commands

Package manager is **pnpm** (`packageManager: pnpm@9.15.0`). Node ≥ 20.

```bash
pnpm build            # tsc → dist/ (this IS the build; there is no bundler)
pnpm test             # vitest run (all tests once)
pnpm test:watch       # vitest watch mode
pnpm test:coverage    # vitest run --coverage (enforces thresholds)
pnpm docs:api         # typedoc → markdown API docs

# Run a single test file
pnpm vitest run src/quality/cpk.test.ts
# Run tests matching a name
pnpm vitest run -t "Six Sigma"
```

`prepublishOnly` runs clean → build → test, so a broken build or failing test blocks publish.

## Architecture

**Flat domain modules.** `src/<domain>/` contains one file per function, its co-located `<name>.test.ts`, a single `types.ts` holding every input/output interface for that domain, and an `index.ts` that re-exports functions and types. The root `src/index.ts` just `export *`s every domain. (`src/metal/__tests__/` is a legacy exception; new tests are co-located.)

**Two export layers, both must stay in sync with package.json:**
- Root import: `import { cpk } from 'formulab'` → `src/index.ts`
- Subpath import (preferred, smaller): `import { cpk } from 'formulab/quality'` → maps via `exports` in `package.json` to `dist/quality/index.js`

Every domain has a matching subpath entry in `package.json`'s `exports`. **Adding a new domain requires adding a new `exports` entry** (with `types`/`import`/`default` conditions — the `default` condition is required, see commit history) AND an `export *` line in `src/index.ts`.

**Shared helpers (internal, not part of public API):**
- `src/utils.ts` — `roundTo(value, decimals)`: sign-aware epsilon-corrected rounding. Use this for all final numeric outputs to avoid IEEE-754 artifacts (`roundTo(0.615, 2) === 0.62`). It passes `NaN`/`Infinity` through unchanged.
- `src/math.ts` — shared statistical primitives (e.g. `normalCDF`) that were previously duplicated across domains. Reuse these rather than re-deriving.

## Module system rules (easy to get wrong)

- ESM only, `verbatimModuleSyntax: true`, `moduleResolution: bundler`.
- **Relative imports must include the `.js` extension even though the source is `.ts`**: `import type { CpkInput } from './types.js'`. The compiler does not rewrite extensions.
- Type-only imports/exports must use `import type` / `export type` (enforced by `verbatimModuleSyntax`).
- `noUnusedLocals`/`noUnusedParameters` are on under `strict` — dead bindings fail the build.

## Conventions for a calculation function

Each function file follows the pattern in `src/quality/cpk.ts`:

1. Input/output are named interfaces in the domain's `types.ts` (`<Name>Input`, `<Name>Result`). Functions taking variant inputs use **discriminated unions** keyed on a literal discriminant (`mode`, `shape`, `solveFor`, …), and many ship a runtime **type guard** (`isCpkInput`-style) for safe narrowing of `unknown` form/API data.
2. Rich JSDoc above the function: `@formula`, `@reference` (the authoritative standard — NIOSH, ISO, AIAG, ASME, Machinery's Handbook, etc.), `@units`, `@validation`, `@param`, `@returns`, and `@throws`.
3. **Error policy (see `ERRORS.md`):** invalid inputs throw `RangeError` with a descriptive message; functions must never return `NaN`/`Infinity` in output fields. When you change a function's validation behavior, update both its `@throws` JSDoc and the table in `ERRORS.md`.
4. Verified functions carry **golden reference tests** asserting against published values from the cited standard — preserve and extend these; don't loosen a golden assertion to make a change pass.
5. **Clamp/snap disclosure.** When a function clamps or snaps a computed value or an input to a model/table boundary instead of throwing, the result MUST disclose it via an additive boolean flag (`roomIndexClamped`, `orificeExceedsMax`, `hazHardnessClamped`/`coolingTimeClamped`, `outOfTableRange`, `tiltEfficiencyFloored`, `aqlAdjusted` are the precedents). A silent clamp presents a boundary artifact as a genuine result — a 2026-07 execution-based audit (ISSUE-20260713) confirmed five such defects across four functions with realistic inputs. Nearest-value snapping *within* a standard's table is the lookup's intended behavior and is not flagged; only boundary/out-of-range substitution is. Pin boundary golden tests on both sides (just inside → `false`, just outside → `true`).
6. **Lookup-table transcription discipline.** Functions embedding a standard's lookup table (AP matrix, REBA tables, NIOSH multipliers, ISO 2859 sampling plans, …) are the library's highest-risk defect class: four independent transcription slips were found in 2026-07 (axis bands copied from a neighboring axis, irregular cells smoothed into a monotone pattern, invented extrapolated values, an off-by-one from an omitted column). When adding or touching such a table: (a) transcribe from the standard itself or a cell-complete reproduction — never reconstruct "plausible" values from the table's apparent pattern; (b) cite the exact table number in `@reference` and record the verification source; (c) pin **cell-level golden tests** including the table's irregular cells and band boundaries — a test asserting the implementation's own output is not a golden test; (d) test structural invariants where the standard states them (e.g. "S=1 → always L", merged rows, band coverage without gaps).

## Adding a function (checklist)

1. `src/<domain>/<name>.ts` — implementation + full JSDoc, outputs passed through `roundTo`.
2. Add `<Name>Input`/`<Name>Result` (and a type guard if it's a discriminated union) to `src/<domain>/types.ts`.
3. `src/<domain>/<name>.test.ts` — co-located tests, including a golden case if a standard exists.
4. Export the function and its types from `src/<domain>/index.ts`.
5. If it's a brand-new domain: add the `exports` map entry in `package.json` and the `export *` in `src/index.ts`.
6. Update the relevant table in `README.md` and, if validation behavior is notable, `ERRORS.md`.

## CI & publishing

- CI (`.github/workflows/ci.yml`) runs on push/PR to `main` over Node 20 & 22: `pnpm install --frozen-lockfile` → `pnpm build` → `pnpm test:coverage`. Coverage thresholds (lines 90 / functions 95 / branches 85 / statements 90, in `vitest.config.ts`) are enforced — dropping below fails CI.
- Publishing is automated: the publish workflow triggers on manual dispatch **or any push to `main` that changes `package.json`**. To release, bump `version` in `package.json` (and update `CHANGELOG.md`); merging that to `main` runs CI then `pnpm publish`.
