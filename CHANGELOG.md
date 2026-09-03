# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.33.1] - 2026-09-03

### Fixed

- **`safety/wbgtCalculate()` heat-stress threshold table partially verified.** `WBGT_THRESHOLDS`
  has carried an unverified "Based on ACGIH TLV guidelines" attribution since it was written -
  ACGIH's TLV table is copyrighted and not freely available, and ISO 7243's own reference-value
  table is not in its free sample. A peer-reviewed source reproducing both tables with citation
  (Parsons K, 2006, "Heat Stress Standard ISO 7243 and its Global Application", Industrial Health
  44, 368-379) is now available: its Table 1 (ISO 7243) confirms the existing `heavy` (26/23) and
  `veryHeavy` (25/20) acclimatized/unacclimatized values exactly, against the table's "sensible air
  movement" column - no value change, `@reference` added, golden tests pinned. `light` and
  `moderate` do **not** match either that table's rows or ACGIH's TLV table (Table 6 in the same
  source) and remain unverified pending a source that resolves the mismatch - values unchanged,
  per the "don't swap one unverified figure for another" policy already documented on this
  constant. See `WBGT_THRESHOLDS` JSDoc for the full breakdown.

## [0.33.0] - 2026-09-02

### Added

- **`automotive/tireCompare()` gains ISO 4000-1 / ETRTO Load Index support**, including HL (High
  Load) ratings used by heavy EVs. `TireSpec.loadIndex` (optional, 60-130) resolves to
  `TireData.maxLoadKg` via the new exported `tireLoadCapacityKg()` lookup; when both tires in a
  comparison supply it, `TireResult` additionally carries `loadCapacityDiffKg` and
  `loadCapacityReduced` — a replacement-tire safety check flagging when tire2 is rated to carry
  less than tire1 (the case that matters for heavy EVs, which need HL-rated tires and can't
  safely drop back to a lower-index replacement). SL/XL/HL are not separate tables: they are
  construction/reference-pressure classes that determine which Load Index a given tire size can
  be rated at — the Load Index-to-kg mapping itself is universal, so no separate "HL table" was
  needed once the standard one was verified. Golden-tested against ISO 4000-1 figures (cell-level
  extraction, cross-checked against the UK MOT Inspection Manual's independent table and
  published XL/HL comparison figures — all points agreed exactly). `loadIndex` is fully optional;
  omitting it on either tire preserves the exact prior `tireCompare()` output.

## [0.32.1] - 2026-09-02

### Fixed

- **`environmental/scope2Emissions()` grid emission factors were stale and unreproducible.**
  `GRID_EMISSION_FACTORS` carried an "IEA 2023 Emission Factors" citation whose values could not
  be reproduced against any accessible source — IEA's own Emissions Factors data product requires
  a paid license, and the specific figures previously cited (attempted in docket `#173`) did not
  match any independently verifiable dataset. Replaced with Our World in Data's "Carbon intensity
  of electricity generation" series (sourced from Ember's Yearly Electricity Data, 2025 figures —
  a freely reproducible, actively maintained global dataset), cross-checked against Umweltbundesamt
  (German Federal Environment Agency) national statistics for Germany (within 1%). All 12 region
  factors changed, in both directions — the largest swings are Canada (110 → 191 gCO2/kWh, +74%,
  a 3-year rising trend in the source data toward more gas generation) and Brazil (75 → 110, +47%,
  reduced hydro output), against France (56 → 41, -27%, continued nuclear-heavy low-carbon
  generation) and Australia (656 → 525, -20%, continued coal-to-renewables buildout).
  `scope2Emissions()` callers using the default region factors will see different
  `co2Kg`/`co2Tonnes` output for the same input — this is a data correction, not an API change.

## [0.32.0] - 2026-08-31

### Added

- **`quality/gageRR()` gains the AIAG MSA 4th Edition ANOVA method**, alongside the existing
  Average and Range method. Opt in with `input.method: 'anova'` (default remains
  `'average-range'`, fully backward-compatible). The ANOVA method separates the Part×Operator
  interaction from repeatability via a two-factor crossed random-effects ANOVA, pooling the
  interaction into the equipment term when it is not statistically significant (F-test, p > 0.25,
  per AIAG convention) — a distinction the Average-Range method cannot make. `GageRRResult` gains
  an additive `method` field (always present) and an `interaction` object (present only for the
  ANOVA method: `variance`, `fStatistic`, `pValue`, `pooled`). Golden-tested against a published
  AIAG MSA worked example (5 parts × 3 operators × 3 trials) cross-referencing its full ANOVA
  table and resulting variance components.
- `src/math.ts` gains `fCDF(f, df1, df2)`, an F-distribution CDF (regularized incomplete beta
  function) used by the above — verified against standard published F-table critical values.

## [0.31.0] - 2026-08-28

### Added

- **`construction/rebar` gains eleven new sizes: D4, D5, D6, D7, D8, D35, D38, D41, D43, D51,
  D57.** `RebarSize`, `getRebarUnitWeight()`, and `rebarWeight()` now cover every size KS D
  3504:2025's Table 4 publishes, with no gap in the band (previously D10-D32 only). Values are
  read directly from the standard's own published table and cross-checked against its disclosed
  unit-weight formula, the same rigor as the existing D10-D32 entries.

## [0.30.0] - 2026-08-28

### Fixed

- **`quality/gageRR`'s `percentTolerance` (%P/T) was inflated by an unexplained ×6**, on top of a
  value (`grr`) that is already scaled to AIAG's 5.15σ spread — the same scale `percentGRR` uses
  with no such multiplier. Since `status` takes the worse of `percentGRR` and `percentTolerance`,
  this could report a measurement system as "unacceptable" (>30%) when its true %P/T was
  acceptable or marginal — always in the direction of over-flagging, never under-flagging, but
  still a real defect. No other `gageRR` output changed.

- **`construction/rebar`'s unit-weight table (`getRebarUnitWeight()`/`rebarWeight()`) corrected
  six of its eight D10-D32 entries against KS D 3504:2025's own published table** (D10, D13, D19,
  D22, D29, D32 were off by 1-10%; D16 and D25 were already correct). The previous values came
  from a generic diameter-squared approximation formula that was never itself a cited source for
  this table; the corrected values are read directly from the standard and cross-checked against
  its own disclosed unit-weight formula.

### Added

- **`metal/vibration`'s `VibrationResult` gains an optional `polarMomentOfInertia` field (J).**
  For `system: 'shaftDisk'`, the torsional natural frequency was always correctly computed from
  the polar moment of inertia J, but the result only ever exposed the unrelated bending moment of
  inertia I (via `momentOfInertia`) — so the field callers could read never matched the quantity
  that actually drove the frequency. `polarMomentOfInertia` is now populated for `shaftDisk` only;
  `momentOfInertia` is unchanged for the beam systems it already served correctly. Additive,
  non-breaking.

- **`environmental/scope2Emissions` now supports market-based dual reporting** alongside its
  existing location-based (grid-average) calculation, per GHG Protocol Scope 2 Guidance (2015)'s
  dual-reporting requirement. New optional inputs — `contractedKwh`, `supplierFactor`,
  `residualMixFactor` — let callers express a supplier-specific/contractual (REC, PPA) emission
  factor for the covered portion of consumption and a residual-mix factor for the rest; supplying
  any of them adds `marketBasedCo2Kg`/`marketBasedCo2Tonnes` to the result. `locationBasedCo2Kg`/
  `locationBasedCo2Tonnes` were also added as explicit aliases of the existing `co2Kg`/`co2Tonnes`,
  which are unchanged for backward compatibility. This library does not embed a region-keyed
  residual-mix emission-factor table — those figures are jurisdiction- and year-specific published
  data (e.g. AIB in Europe); callers supply their own from their disclosure source. Additive,
  non-breaking.

## [0.29.0] - 2026-08-19

### Fixed

- **`check:dependency-drift` silently hid every outdated dependency once the Node engine floor
  moved above the machine's own Node version.** `pnpm outdated --format json`'s output can be
  prefixed with a plain-text `WARN Unsupported engine` line that itself contains `{...}`
  characters; the script's naive "parse from the first `{`" recovery grabbed the warning's brace
  instead of the real JSON payload's, so `JSON.parse` failed and the script fell back to an
  unhelpful "check manually" placeholder instead of the actual outdated-package list. Introduced
  by this same release's engine-floor bump (a Node <24 dev machine now always sees that warning).
  Now finds the payload by its own line (`{` alone on a line), which pnpm's pretty-printed JSON
  always starts with, regardless of what precedes it.

### Changed

- **Raised the minimum supported `Node.js` version from 20 to 24.** Node 20 reached end-of-life
  on 2026-04-30 and stopped receiving security patches; the release build itself (`publish.yml`)
  was still running on it. `engines.node` is now `>=24` (Active LTS until 2028-04-30), and CI now
  matrixes Node 24 & 26 instead of 20 & 22. No library API changed — this only affects the
  runtime you install the package into.

### Added

- Golden reference tests for `electronics/resistor`'s 6-band temperature-coefficient table's six
  previously-unconfirmed colors (black, orange, yellow, green, violet, grey) — cross-checked
  against Panasonic's industrial TCR reference table and Wikipedia's IEC 60062:2016 TCR color
  table, both agreeing with every value already in this table. No values changed; this closes the
  confirmation gap that previously covered only brown/red/blue.

## [0.28.1] - 2026-08-16

Golden reference test coverage for the Metal domain's remaining two functions, a deprecation
notice, and doc/tooling accuracy fixes.

### Fixed

- **`metal/welding` — the aluminum electrode list included a designation that doesn't exist.**
  `E5356` is not classified under AWS A5.3 (the specification this function's SMAW rod-diameter/
  current-range output represents) — AWS A5.3 covers exactly three SMAW aluminum electrodes
  (E1100, E3003, E4043); "5356" only exists as a GTAW/GMAW filler-wire alloy under AWS A5.10's
  `ER5356` designation, a different welding process. Replaced with `E3003` (a real A5.3
  designation). `welding({ baseMetal: 'aluminum', ... })` could previously recommend a rod that
  doesn't exist.

### Added

- Golden reference tests credited for `metal/tolerance` (already golden — cell-level ISO 286-1/
  286-2 transcriptions with a documented prior defect fix, just missing a formal citation) and
  `metal/welding` (cross-checked against all five AWS specifications it uses).
- Two new dev-only scripts (not part of the published library surface, same category as
  `audit-constant-provenance.mjs`): `check:dependency-drift` (checks `pnpm outdated` + the
  declared Node engine floor's EOL date; backed by a new monthly-scheduled CI workflow that
  files/updates a tracking issue on drift) and `check:function-counts` (verifies README's
  Verification Status table against the codebase using a documented counting convention).

### Changed

- **`automotive/evCharging` is deprecated in favor of `chargingLoss`.** `chargingLoss` computes
  the same energy/charging-time values from the same inputs and additionally provides a charger/
  battery loss breakdown, charger-type default efficiencies, ambient-temperature derating, and
  cited standards. `evCharging` is unchanged and not scheduled for removal.
- Corrected the project's own function/test-count claims, which had drifted out of sync with
  each other and with the codebase: README's Features bullet, Verification Status table (5
  domains), and test count; `package.json`'s description field. All now verified by
  `check:function-counts` rather than hand-maintained.

## [0.28.0] - 2026-08-16

### Added

- **`metal/kFactorReverse` gains a measurement-uncertainty range: `kFactorReverseRange()`.**
  Unlike `bendAllowance`'s K-factor table (a conventional default with no source to draw a
  range from — see its own doc comment), `kFactorReverse`'s inputs are physical measurements,
  which do have a defensible uncertainty: the measuring instrument's stated accuracy. Propagates
  a ±0.02mm default (typical shop-grade digital caliper accuracy) through the four measured
  inputs (`measuredFlatLength`, `legA`, `legB`, `insideRadius`) via corner-case interval
  propagation and returns `kFactor` alongside `kFactorMin`/`kFactorMax`. Pass a different
  `measurementUncertaintyMm` for a different instrument.
- **New generic `propagate()` utility in `math.ts`** (not part of a domain, shared internal
  numeric helper like `normalCDF`/`normalInvCDF`). Runs a function at every corner of its
  uncertain inputs' ± half-widths and returns the resulting min/max — no Monte Carlo, no
  distribution, deliberately bounded to a small number of uncertain inputs. Powers
  `kFactorReverseRange()`; available for a future measurement-derived function that needs the
  same treatment.

## [0.27.8] - 2026-08-16

`npm run audit:constant-provenance` (dev-only, not part of the published library surface)
fixes for two independent gaps that let a judgment-bearing constant go unclassified.

### Fixed

- **A constant whose type annotation spans multiple lines and contains an object-literal
  shape (`const T: Record<K, { a: number; b: number }> = {...}`) was silently skipped.**
  The initializer scan counted braces from the declaration line onward, so the type
  annotation's own `{...}` closed the scan before it ever reached the real value —
  the constant was dropped for having "no digits" in what the scanner thought was its
  body. Brace/bracket counting now starts only after the top-level `=`.
- **A table value threaded through a second rename before the comparison that reads it
  (`const row = TABLE[key]; const limit = cond ? row.a : row.b; ... x > limit`) was not
  followed.** Only the direct one-hop case (`row.field` compared in place) was tracked.
  The scan now follows one further rename, reading the assignment's right-hand side as a
  short multi-line window so a ternary split across lines is not missed either. Chains
  beyond two hops remain unfollowed by design — see the script's own doc comment for why.
- Added a regression control (alongside the existing bend-constants control) so a future
  change to either scan silently regressing is a hard failure, not a quiet drop.

## [0.27.7] - 2026-08-16

Golden reference test coverage expansion across six domains (Machining, Environmental, Energy,
Battery, Automotive, Food), plus one real defect fix found along the way.

### Fixed

- **`machining/boringBarDeflection` — the `heavyMetal` material option used an understated
  Young's modulus.** 250 GPa was below the 276-365 GPa range published across manufacturer data
  sheets for the tungsten heavy alloys (90-97wt% W) actually used in damped boring bar cores.
  Corrected to 300 GPa, a documented representative value for that composition range.
  `boringBarDeflection({ material: 'heavyMetal' })` previously overestimated deflection for this
  material by roughly 20%.

### Added

- Golden reference tests credited or added across: `machining` (`boltCircle`, `sineBarHeight`,
  `effectiveDiameter`, `radialChipThinning`, `cuspHeight`, `boringBarDeflection`,
  `toolDeflection`, `cycleTimeEstimator`, `threadOverWires`, `triangleSolver` — the domain is now
  fully covered), `environmental` (`gwpCalculator`), `energy` (`degreeDay`, `windOutput`),
  `battery` (`stateOfHealth`, `thermalRunaway`), `automotive` (`chargingLoss`), `food`
  (`waterActivity`, `stabilityStudy`).
- `threadOverWires()` now additionally cites ASME B1.2 for its three-wire thread-gaging method.

### Changed

- Clarified a few `@reference` citations that had attributed general engineering rules of thumb
  (a boring-bar overhang/material selection guideline; default EV-charger efficiency and
  temperature-derating values) to specific standards that do not actually publish those numbers.
  The underlying values are unchanged — only the citation precision.

## [0.27.6] - 2026-08-16

Documentation-only release, same shape as 0.27.4/0.27.5.

### Added

- **`electronics/awg` — `awgProperties()` now cites ASTM B258** for the geometric diameter
  series its formula reproduces.

No calculation logic changed; output is identical to 0.27.5.

## [0.27.5] - 2026-08-16

Documentation-only release, same shape as 0.27.4.

### Added

- **`metal/thread` — `thread()` now cites ISO 261, ISO 68-1, and ASME B1.1** for its metric
  nominal-diameter/pitch series, basic-profile derivation, and unified thread-form/tap-drill
  data respectively.

No calculation logic changed; output is identical to 0.27.4.

## [0.27.4] - 2026-08-16

Documentation-only release: three functions that already implement a published standard now say
so in their doc comments.

### Added

- **`metal/gear` — `gear()` now cites ISO 21771** (Gears — Cylindrical involute gears and gear
  pairs — Concepts and geometry) for its addendum/dedendum/pressure-angle conventions.
- **`electronics/stencil` — `stencilAperture()` now cites IPC-7525** for its recommended-minimum
  area-ratio (0.66) and aspect-ratio (1.5) thresholds.
- **`safety/fallClearance` — `fallClearance()` now cites OSHA 29 CFR 1926.502(d)(16)(iv)** for
  the 3.5 ft (1.07 m) maximum deceleration distance already used in its warning threshold.

No calculation logic changed; all three functions produce identical output to 0.27.3.

## [0.27.3] - 2026-08-11

Golden reference test coverage expansion across four previously-uncredited domains (Chemical,
Construction, Machining, Electronics), including one real behavior fix found along the way.

### Fixed

- **`machining/gaugeBlockStack` — the `metric47` gauge block set was not actually a 47-piece
  set.** `METRIC_47_SET` carried an extra half-mm series (0.5, 1.5, ..., 9.5 — 10 blocks) that
  belongs only to the finer 87/88-piece set, inflating it to 56 blocks under a "47" name.
  Cross-checked against two independent catalog descriptions of the commercial 47-piece set
  (Mitutoyo Series 516 / DIN EN ISO 3650 equivalents): the real composition is 46 stacking blocks
  (9+9+9+9+10; the catalog's 47th piece is a 1.0005mm zero-reference block not used for
  stacking). Practical effect: `gaugeBlockStack({ availableSet: 'metric47' })` could previously
  recommend a physical block (e.g. a bare 0.5mm block) that a real 47-piece set does not contain.
  A target requiring a sub-1mm block now correctly fails to zero out on `metric47` — regression-
  pinned in `gaugeBlockStack.test.ts`. `METRIC_88_SET`'s comment was also corrected: the array
  has 87 entries, matching its catalog composition (the "88th" piece is the same non-stacking
  reference block); no behavior change there.

### Added

- **`chemical/pid` — Cohen-Coon P/PI/PID gains now have golden reference tests.** The existing
  Cohen-Coon test only asserted `> 0`; it is replaced with values hand-computed from the
  published Cohen & Coon (1953) coefficient table (verified independently against a second
  public source) at r = L/T = 0.1, covering Kp/Ti/Td and the derived Ki/Kd. The Ziegler-Nichols
  coefficients were also cross-checked against a second public source and annotated as
  standard-table values, not derived figures.
- **`chemical/reliefValve` — the API 520 critical-flow coefficient C now has a golden reference
  test.** C(k=1.4) = 356.06 matches the value commonly published for diatomic gases in API 520
  Part I references, independently of this codebase. Verified via the steam(k=1.3)/gas(k=1.4)
  required-area ratio, which isolates C from the rest of the sizing formula's unit conversions.
- **`construction/momentOfInertia` — T-section and C-channel golden tests are now fully pinned.**
  Previously only asserted `> 0`/positivity for Ix/Iy/Sx/Sy; now pinned to values hand-computed
  independently from Roark's parallel-axis (component) method. `@reference` tags added (was prose
  only). README's Verification Status table credited the whole Construction domain to
  "AISC, Timoshenko" — a repo-wide audit found only `momentOfInertia()` actually cites them (the
  other 14 functions are self-evident geometry or already disclose "convention, not a code
  limit"); the table and its note now say so.
- **`construction/truePosition`, `machining/gaugeBlockStack`, `electronics/resistorDecode`
  credited in golden-test coverage.** All three already had exact pinned expected values against
  their cited standards (ASME Y14.5, Mitutoyo/DIN EN ISO 3650 catalog composition, IEC 60062) —
  the README table just hadn't caught up.

### Investigated, not changed

- **`construction/rebar`'s D16/D25 unit-weight overrides remain unconfirmed against a named
  standard.** Two secondary sources checked were inconclusive (one mislabeled a
  cross-sectional-area column as unit weight; the other was a different national standard family
  than this table's Korean/JIS D-series). No value changed — see
  `claudedocs/issues/ISSUE-formulab-20260811-rebar-unit-weight-standard-unconfirmed.md`.
- **`electronics/resistor`'s 6-band temperature-coefficient table** — brown/red/blue entries are
  corroborated by every source checked; the rest of the table could not be cross-verified the
  same way (a different published TCR scheme uses unrelated figures for the same colors, and it
  wasn't established whether that's a different standard edition or a real disagreement). No
  value changed; flagged in JSDoc.

## [0.27.2] - 2026-08-06

### Changed

- Repository tooling only, no change to the published API. Added an audit that lists
  constants which decide a verdict without saying where they come from, sorting them into
  sourced, explicitly-unsourced, and silent. It reports rather than fails: it follows data
  flow one hop, so a table reached through a local and compared through a field is not
  seen, and a check that under-reports must not gate. Run it with
  `npm run audit:constant-provenance`.

## [0.27.1] - 2026-08-06

### Fixed

- Restored the code spans that went missing from the previous entry, which left it naming
  neither the module it describes nor the function it contrasts against.

## [0.27.0] - 2026-08-06

### Added

- **`quality/aql` — the lot size ranges the sampling tables are indexed by are now exported.**

  A caller that wants to present one row per lot size range could not get the boundaries out
  of `aql()`: it returns a plan, not the bounds that produced it. The only way was to restate
  the series on the consumer side, which makes a second source for the same figures — the day
  a boundary moves, the consumer keeps listing the old one.

  Two things about the ranges are worth knowing before tabulating them, and both are pinned
  by tests. The plan is constant across a range, so a row per range is honest for the code
  letter and the accept and reject numbers. The **sample size is not**: a plan can call for
  more units than the smallest lots in its range contain, and the sample is then the whole
  lot. Read the sample size at the top of a range, where nothing is capped.

## [0.26.2] - 2026-08-06

### Changed

- **Formulas that do come from a standard now name it — and one table says it could not be checked.**

  The previous release covered constants whose origin was unstated. This one covers the
  opposite case: calculations that follow a published standard exactly, while the code said
  nothing about it. A reader could not tell which figures were fixed by a standard and which
  were the library's own choices, and that is the difference between a value that must not
  drift and one that may.

  - `metal/bearing` — the rating life exponents cite ISO 281, and the doc now says what makes
    the result the *basic* rating life rather than a modified one.
  - `metal/tap` — the profile factors cite ISO 68-1, and the 75% thread engagement default is
    now named for what it is: a shop convention layered on top of that geometry, prescribed by
    nothing.
  - `metal/screw` — the diameter/pitch series and the clearance hole series are tabulated, not
    derived, so a disagreement is a transcription error. The doc says so and cites the series.
  - `electronics/resistor` — the colour code cites IEC 60062, and the doc distinguishes a
    definition from a measurement.
  - `metal/roughness` — records that the grade notation and the profile parameters behind Ra
    and Rz were superseded at the end of 2021, while the values themselves are unchanged.

- **`safety/wbgt` — the index formula is sourced; the exposure limits are marked unverified.**

  The weightings match ISO 7243 exactly and now cite it. The limit table beside them does not
  get the same treatment: it has long been described as threshold limit values, but the
  published table it would come from is not freely available, and secondary sources disagree
  on both the figures and which column belongs to acclimatized workers. The values are left
  as they are — substituting one unverified figure for another is not an improvement — and
  the uncertainty is stated where a caller will see it, together with the fact that the
  caution band is a margin chosen here rather than part of the index.

## [0.26.1] - 2026-08-06

### Changed

- **Constants that decide a verdict now say where they come from — or that nothing backs them.**

  A constant read through a comparison to produce a warning or a status is doing more work
  than one that is merely displayed: when its origin is unstated, a caller cannot tell a
  legal limit from a shop convention, and a threshold that is quietly too narrow or too wide
  produces a verdict nobody can audit. Every such constant in the library was reviewed. No
  value changed — replacing an unsourced figure with another unsourced figure is not an
  improvement.

  - `safety/havsCalculate` — the hand-arm vibration action and limit values now cite
    Directive 2002/44/EC, Article 3(1), and say so explicitly: the status returned is a
    statement about that regime, not a universal one. Other jurisdictions set their own
    figures on their own basis.
  - `construction/stair` — the auto-calculation riser heights are comfort figures, and they
    are narrower than any model code permits. They now say that outright, so a result derived
    from them is not presented as a code check.
  - `construction/concreteMix` — the mix table claimed to be "based on standard mix design
    proportions" without naming a standard, which is worse than saying nothing: it asserts a
    backing that does not exist. It now states that the proportions are conventional, and that
    the higher grades are outside what a nominal-mix table covers at all.
  - `metal/roughness` — the grade table's identifier names a standard, but only part of it
    comes from one. The grade-to-Ra series does; the Rz column does not, because no standard
    defines a general conversion between the two — they measure different things. The two are
    now separated in the comment, and results derived from the Rz column are called estimates.

## [0.26.0] - 2026-08-04

### Added

- **`metal/material`** — grades now carry Poisson's ratio, where the published data supports one.

  Callers doing FEA need `v` alongside `E` and density, and the lookup had two of the three.
  It is optional on both `MaterialSpec` and `MaterialResult`, and one grade deliberately has
  no value: a grade whose sources disagree returns no key at all rather than a chosen number.

  The precision is deliberately lower than the modulus beside it. Every tabulation that covers
  more than one alloy publishes `v` by family rather than by grade (0.27-0.30 for steels,
  0.330-0.334 for wrought aluminium, 0.33-0.34 for copper, 0.32-0.34 for titanium), so these
  are family figures written per grade and two decimals is the honest width; a third digit
  would claim agreement between sources that does not exist.

  The copper alloys stay on the same source as their modulus. CDA publishes elastic and shear
  modulus in ksi, and `v = E/(2G) - 1` follows from that pair: 17000/6400 for C11000 and
  16000/6000 for C26000 and C51900, which independently agrees with the 0.331 tabulated for
  70-30 brass. The golden block recomputes from those ksi figures rather than restating the
  stored value, for the same reason the modulus check does.

  CP-Ti Grade 2 carries no ratio. Its sources give 0.34 and 0.37 — a 9% disagreement rather
  than a last-digit one — and it is the only commercially pure grade in the table, so no
  sibling settles it. The absence is asserted by a test, so filling it later has to be an
  argued change rather than a quiet one.
## [0.25.1] - 2026-08-04

### Fixed

- **`metal/material`** — the Young's modulus reported for C1100 copper is 117 GPa, not 115.

  The three copper grades in this table are CDA figures, and the CDA tables publish modulus
  in ksi: C26000 and C51900 both read 16000 ksi, which the stored values round to 110 GPa.
  C1100 reads 17000 ksi, or 117.2 GPa, and was stored as 115 — a figure that circulates
  widely enough to look unremarkable on its own.

  That is what made it hard to see. Checked in isolation every value in the table sits
  inside some published spread, so no single entry looks wrong; only lining the family up
  against one tabulation showed that two grades followed it and the third did not. A value
  that disagrees with its own family's source is an inconsistency rather than an alternative
  reading, which is the distinction that decided this change — elsewhere in the table,
  grades that genuinely sit inside a spread are left alone, because moving a defensible
  figure to another defensible figure is churn.

  Callers that read `youngsModulus` for C1100 to size a beam, a column or a press fit will
  see results shift by about 1.9 %. Nothing else in the table moved.

### Changed

- The Young's modulus golden block now names the published source each of the fifteen values
  was checked against, replacing entries that pointed at a sibling grade instead of at data.
  The copper family is additionally asserted against the ksi figures its tables publish, so
  a future edit has to disagree with the source rather than merely with a previous edit.

## [0.25.0] - 2026-08-03

### Added

- **`metal/tolerance`** — `ISO286_SIZE_RANGES`, the nominal size ranges the tolerance
  tables cover, each stated as `{ over, upTo }` in millimetres.

  A caller could not enumerate them: `tolerance()` takes one size and returns one zone,
  so anything presenting results per size range — a lookup table, a range selector — had
  to restate the bounds on its own side. That is a second source for the same figures,
  and the day the covered span moves the caller keeps listing the old one. The exported
  ranges are derived from the same list the lookup uses, and tests assert the two agree:
  every advertised upper bound is accepted, the size just past the last one is rejected,
  and no two ranges resolve to the same grade.

## [0.24.2] - 2026-08-03

### Fixed

- **`metal/tolerance`** — standard tolerance grades are read from the tabulated ISO 286-1
  values instead of being derived from the tolerance unit `i = 0.45·∛D + 0.001·D`.

  The published grades were derived from that unit, but the standard rounds each derived
  value to a preferred one, so recomputing it does not reproduce the table — and rounding
  the result back does not repair it: at 6-10 mm the unit gives IT7 = 14.4, which rounds
  to 14, while the table reads 15.

  At the fine grades the disagreement stayed under a micrometre, which is how it went
  unnoticed. It did not stay there. It widened with the grade, reaching 16.5 um at IT14,
  and it was worst in the smallest size range, where the unit was evaluated at the range
  maximum rather than at the geometric mean the standard uses: IT13 at 2 mm came out 163
  um against a tabulated 140, and IT8 at 2 mm was off by 16 %. A function that names
  ISO 286 has to agree with the table, not with the derivation behind it, so the
  tabulated grades IT5-IT14 across the twelve size ranges are now carried directly.

  Every deviation this function produces moves by the same amount, and so does every
  clearance and interference limit `fit()` composes from it. Callers pinning golden
  values against the standard will find them exact where they previously needed a
  sub-micrometre allowance; the allowance in this library's own golden tests has been
  removed rather than kept as slack.

- **`metal/tolerance`** — hole classes K, M, N and P at IT5 no longer lose their deviation
  term.

  `ES = -ei + delta` needs the grade one step finer than the requested one, and IT4 sat
  below the range the function carried. The lookup returned nothing, the term silently
  became zero, and the whole zone shifted by it — a 25 mm K5 hole came out at -11.2/-2 um
  against a tabulated -8/+1. IT4 is now carried for this purpose while the accepted input
  range stays IT5-IT14.

## [0.24.1] - 2026-08-03

### Fixed

- **`metal/tolerance`** — hole classes above H no longer disagree with the ISO 286-2 table.

  The hole branch took the absolute value of the shaft fundamental deviation, on the
  stated assumption that hole deviations are "always positive or zero". That holds for
  the letters A through H and fails for everything above them, where the zone sits below
  nominal. Taking the absolute value discarded that sign *and* dropped the delta term
  that ISO 286-1 requires on the hole side, so the zone landed in the wrong place
  entirely — for a 25 mm K7 hole the table gives −15/+6 um and the function returned
  +2/+22.9 um.

  Nothing caught it because the output stayed a plausible pair of micrometre figures and
  every existing case in the suite used an H-basis hole, where the absolute value happens
  to be correct. Golden values for both sides of H are now transcribed from the table and
  pinned across two size ranges, with a structural test covering the letters that have no
  transcribed row.

  The hole branch now follows ISO 286-1 directly: `EI = -es` for A through H, and
  `ES = -ei + delta`, `EI = ES - IT` above them, where delta is the difference between
  the grade and the next finer one and applies through IT8 for K/M/N and through IT7 for
  P and beyond.

  **This changes computed output** for `fitType: 'hole'` with the letters K, M, N and P.
  The previous values were wrong, so consumers pinning them should update against the
  table. Shaft calculations, `fit()`, and every other letter are unaffected.

## [0.24.0] - 2026-08-03

### Added

- **`metal/fit`** — combines a hole and a shaft tolerance class into an ISO 286 fit.

  `tolerance()` computes one tolerance zone at a time, but ISO 286 is used in practice
  as a pair: a drawing carries `Ø30 H7/g6`, and what the designer needs from it is the
  clearance or interference that pair produces. Callers were left to run the function
  twice and perform the extreme-condition subtraction themselves, which is exactly where
  sign errors live — the tightest pairing is the *smallest* hole with the *largest*
  shaft, and getting that backwards yields a plausible-looking number.

  `fit({ nominalSize, holeDeviation, holeGrade, shaftDeviation, shaftGrade })` returns
  both member zones alongside `minClearance`, `maxClearance` and `fitClass`. Clearance is
  a single signed quantity in micrometres — positive is a gap, negative is interference —
  so there is no second field to keep in sync with the first. The classification follows
  ISO 286-1 and introduces no threshold of its own: clearance when even the tightest
  pairing leaves a gap, interference when even the loosest one overlaps, transition when
  the sign changes inside the range.

  This is a composition of two existing calls and adds no new table data. `tolerance()`
  is unchanged and remains the right entry point when only one zone is wanted.

  Golden values in the accompanying tests are transcribed from the ISO 286-2 limit
  deviation tables rather than produced by this implementation. They are asserted with a
  stated tolerance of 0.7 um, because `tolerance()` derives the standard tolerance grade
  from the ISO 286-1 formula while the published table rounds each grade to a whole
  micrometre; the two therefore disagree slightly, and hiding that behind a loose
  assertion would have made the golden test stop being one.

## [0.23.1] - 2026-08-02

### Changed

- **`metal/material`** — documentation and test coverage only. No property value,
  signature or output changed.
  - Every grade's Young's modulus is now pinned by a golden test that records, per
    grade, how the figure was checked against published data. These are transcribed
    reference values rather than computed results, so nothing else in the suite could
    catch a typo in one, and a wrong modulus propagates silently into any caller that
    sizes a beam, a column or a press fit. Two structural guards accompany them: one
    fails if a grade is added without a golden entry, the other catches a unit slip
    (MPa or psi where GPa is expected) that a per-grade equality check cannot see.
  - The table header no longer claims the table is required by `springback()` or by
    deflection calculations. It is not — those functions carry their own category-level
    presets, which are coarser than these grade-level values and can differ from them
    inside the same published band. The header now says so, and records that the
    modulus figures are conventional values from within each grade's published spread
    rather than one authority's point values, since the two cited sources disagree in
    the last digit for several grades and neither takes precedence.

## [0.23.0] - 2026-07-21

### Added

- **`metal/beamDeflection`** — maximum elastic deflection of a prismatic beam and its
  serviceability check. Given the support type (simple / cantilever / fixed-fixed),
  load type (uniform / concentrated / combined), span, elastic modulus, moment of
  inertia, the load magnitudes, and a serviceability limit ratio, it returns the maximum
  deflection `δ_max`, its location, the allowable deflection `span/ratio`, their ratio
  (utilization), and an `isSafe` verdict.
  - Closed-form maxima: simple `5wL⁴/384EI` & `PL³/48EI`; cantilever `wL⁴/8EI` & `PL³/3EI`;
    fixed-fixed `wL⁴/384EI` & `PL³/192EI`. Combined = exact linear superposition (the
    uniform peak and the canonically placed point peak coincide, so δ_max is the true
    combined maximum).
  - **mm/N/MPa units** — E in MPa, I in mm⁴, span in mm, w in N/mm, P in N → δ in mm, so
    the moment of inertia flows straight from `momentOfInertia` (which returns mm⁴).
  - **`beamDeflectionCurve`** — samples the elastic deflected shape `v(x)` for
    visualization; its peak equals `beamDeflection`'s `maxDeflection` by construction
    (same shape functions, no second physics).
  - **v1 scope** (documented in the JSDoc): elastic small-deflection prismatic beam; the
    point load acts at the canonical maximum-deflection location (midspan for
    simple/fixed, free end for cantilever); off-centre point loads are deferred.
  - `RangeError` on non-positive `span`, `youngsModulus`, `momentOfInertia`, or
    `deflectionLimitRatio`, or a missing load required by the load type.
  - Reference: standard mechanics-of-materials tables (e.g. Roark's Formulas for Stress
    and Strain).

## [0.22.0] - 2026-07-21

### Added

- **`metal/columnBuckling`** — Euler elastic critical buckling load of a straight,
  prismatic, axially loaded column. Given the elastic modulus, least moment of inertia,
  area, unbraced length, end condition, and yield strength, it returns the effective
  length factor `K`, effective length, Euler critical load `Pcr = π²EI/(KL)²`, critical
  stress, radius of gyration, slenderness ratio, transition slenderness `Cc = π√(2E/σy)`,
  squash (yield) load, and an `isElastic` verdict.
  - End conditions map to AISC theoretical `K`: pinned-pinned 1.0, fixed-fixed 0.5,
    fixed-free 2.0, fixed-pinned 0.7.
  - **Slenderness validity guard** — `isElastic` is `slenderness ≥ Cc`. For short/stubby
    columns (`slenderness < Cc`) inelastic buckling governs and raw Euler over-predicts;
    `Pcr` is returned honestly (never clamped) alongside the flag and the reference
    `yieldLoad`, so a consumer can warn instead of drawing an unreachable capacity.
  - **v1 scope** (documented in the JSDoc): elastic Euler only (inelastic/Johnson flagged,
    not computed), idealized theoretical `K`, concentric axial load on a prismatic member.
  - `RangeError` on non-positive `youngsModulus`, `momentOfInertia`, `area`, `length`,
    or `yieldStrength`.
  - Reference: AISC 360 Chapter E; Euler (1744).

## [0.21.0] - 2026-07-20

### Added

- **`metal/weldStrength`** — load-carrying capacity of an equal-leg fillet weld
  (AISC 360 ASD / AWS D1.1). Given leg size, weld length/count, electrode class, and
  applied shear load, it returns the effective throat (`0.707 × leg`), effective area,
  allowable shear stress (`0.30 × FEXX`), allowable load (capacity), actual stress,
  utilization, the minimum leg that carries the load, and an `isSafe` verdict.
  - Electrode classes `E60`–`E110` map to their exact SI `FEXX` (1 ksi = 6.894757 MPa,
    rounded to the nearest MPa: E70 = 483, E100 = 689, E110 = 758).
  - **v1 scope is deliberately conservative** (matches the common baseline calculators),
    documented in the JSDoc: ASD only (LRFD deferred), longitudinal/conservative
    `0.30 × FEXX` with no directional strength increase, weld-metal check only
    (base-metal rupture is the engineer's responsibility), and equal-leg 90° joints.
    Each is an additive extension point for future demand.
  - A hand-derived golden test pins the AISC ASD model (E70, leg 6 mm, L 100 mm,
    P 50 kN → capacity 61.47 kN, utilization 0.8135, min leg 4.881 mm).
  - `appliedLoad = 0` is a valid capacity-only query; throws `RangeError` on non-positive
    leg/length, `weldCount < 1`, or negative load.

## [0.20.1] - 2026-07-20

### Fixed

- **`metal/pressFit` interface pressure was ~36% too high** (correctness). The
  C-factor used the **rigid-shaft** model `C = (d_o²+d²)/(d_o²−d²) + nu`, which
  assumes only the hub deforms. But `pressFit` takes a single `E`/`poissonRatio`,
  i.e. shaft and hub are the **same material**, so the solid shaft *also* compresses
  and absorbs part of the interference. Shigley's same-material, solid-shaft
  derivation cancels the two Poisson terms and leaves `C = (d_o²+d²)/(d_o²−d²) + 1`.
  For a steel-on-steel sample (shaft 50.025, hole 50.000, hub OD 100, L 50,
  E 210 GPa) the interface pressure drops from **53.4 MPa to 39.4 MPa**, matching
  Shigley; assembly force and holding torque (and the derived hub-hoop / shaft-radial
  stresses) scale by the same factor.

  > ⚠️ **Behavioral change for consumers.** Every `pressFit` output except
  > `interference` decreases by ~26% (÷1.356). Re-validate any downstream limits or
  > displayed values.

  A hand-derived golden test now pins the interface pressure to Shigley's value so
  this cannot silently regress. A consequence of the nu cancellation: for this
  model the result is **independent of `poissonRatio`**; the field is retained (it
  belongs to the material spec and the deferred dissimilar-material model will need
  it) but no longer affects the output.

## [0.20.0] - 2026-07-14

### Added

- **`safety/LADDER_COMPLIANT_ANGLE_RANGE`** (additive). `ladderAngle()`'s OSHA 4:1
  compliant range (70°–80°) was only exposed as the derived boolean `isCompliant` —
  a consumer wanting to draw the compliant band on a diagram had no way to get the
  thresholds themselves without hardcoding a second copy of `70`/`80`, which drifts
  silently if the range is ever revised. `ladderAngle()` now reads its own compliance
  check from this exported constant (`{ min: 70, max: 80 }`), so there is exactly one
  source of truth. Re-exported from `formulab/safety` and the package root.

## [0.19.0] - 2026-07-14

> **Not published to npm as a separate version.** This commit was pushed to `main`
> together with 0.20.0, so a single publish run fired and these changes shipped inside
> **0.20.0**. Consumers needing the springback fix must install `formulab@>=0.20.0` —
> `0.19.0` does not exist on the registry.

Resolution of ISSUE-20260714 (springback model singularity), execution-verified in triage.

### Changed

- **`metal/springback()` rejects fully-elastic bends** (⚠️ inputs that previously returned
  values now throw). The Kalpakjian springback factor Ks = 4x³ − 3x + 1 = (x + 1)(2x − 1)²
  has a double root at x = Y·R_i/(E·T) = 0.5 — exactly the elastic limit (max bending
  strain T/2R_i ≤ yield strain Y/E). The unguarded cubic returned `Infinity` at x = 0.5
  (violating the no-NaN/Infinity error policy) and, past x ≈ 0.87, Ks > 1 — negative
  springback with a *shrinking* final radius (e.g. mild steel t=0.5, R=400 → springback
  angle −45°), silently presented as genuine results. `springback()` now throws
  `RangeError` for x ≥ 0.5 with the physical reason (the sheet never yields, so no
  permanent set exists); the JSDoc documents the domain derivation. Reachable with
  realistic thin-sheet/large-radius inputs (aluminum 5052 at t=0.5 mm crosses at R ≈ 91 mm).

### Added

- **`metal/springback()` → `overbendExceeds180`** (additive). Even inside the model
  domain the required overbend can pass 180° (thin sheet, large radius, target near
  180° — e.g. mild steel t=0.5, R=10, target 175° → 189.18°), which no single
  press-brake stroke can execute. The result now discloses it instead of leaving the
  judgment to consumers. Compared before rounding, boundary pinned on both sides.
- **`metal/springback()` → `radiusBelow2T`** (additive). The cited validity R_i > 2T
  (neutral axis at mid-thickness) was documented but silent at runtime; tight bends are
  routine, so they stay computable and the accuracy caveat is disclosed.

## [0.18.0] - 2026-07-13

Owner-approved follow-ups to the 0.17.0 silent-clamp audit.

### Changed

- **`energy/solarOutput()` tilt/orientation model rebuilt** (⚠️ output values change). The
  former cos-approximation floored both correction factors at 0.5, pinning every away-facing
  array at exactly 50% of south-facing regardless of tilt. The factor is now computed
  physically: isotropic-sky transposition (Liu & Jordan) with standard solar geometry
  (Duffie & Beckman eq. 1.6.2) integrated over the year, normalized to the best
  equator-facing tilt (scanned 0–90°, so the ratio is ≤ 1 by construction — no clamp
  exists). Model assumptions documented in-source: diffuse fraction 0.3, albedo 0.2.
  Anchors at latitude 37: south/latitude-tilt ≈ 1.0, SE ≈ 0.96, E/W ≈ 0.85, flat ≈ 0.88,
  north 30° ≈ 0.61, north 60° ≈ 0.38 — consistent with fixed-orientation literature
  (Lave & Kleissl 2011: north ≈ 0.6–0.7) and PVWatts-derived tables. Note: the original
  audit guessed north should be 30–40%; the literature does not support that — the real
  defect was the hard 50% pin and tilt-insensitivity, both gone now.
  `tiltEfficiencyFloored` (introduced in 0.17.0, never published) is removed; new
  validation throws for tiltAngle outside [0, 90] and latitude outside [-90, 90].
  `azimuthOffset` is documented hemisphere-neutrally (degrees from the equator-facing
  direction).

### Added

- **`quality/aql()` — AQL 10/15/25 columns.** The embedded ISO 2859-1 Table 2-A now covers
  0.065–25 (was 0.065–6.5), so AQL 10 — a real, commonly used level — no longer reports
  `aqlAdjusted: true` with a substituted 6.5 plan. Transcribed cell-by-cell from the
  ISO 2859-1:1999(E) Table 2-A scan and cross-verified against MIL-STD-105E Table II-A
  (identical master table); arrow cells resolve per the documented simplification.
  Cell-level golden tests pin direct, down-arrow, and up-arrow cells. Per ISO 2859-1,
  AQLs above 10 apply to nonconformities-per-100-items inspection only (documented).
- **`chemical/reliefValve()` → `suggestedMinValves`** (additive). First-order minimum count
  of parallel 'T' valves (`ceil(requiredArea / 16,774)`); 1 when a single valve suffices.
  Documented as a first-order figure — an actual multi-valve installation must be re-sized
  per API 520.

## [0.17.0] - 2026-07-13

### Added — clamp/snap disclosure (ISSUE-20260713 audit)

An execution-based audit confirmed five silent-clamp defects across four functions: realistic
inputs land outside a model/table boundary, the output is clamped to the boundary, and nothing
in the result says so. Following the `illuminance()` `roomIndexClamped` precedent (0.16.0),
every clamping function now reports the clamp. All new fields are **additive booleans** —
no existing field changed.

- **`chemical/reliefValve()` → `orificeExceedsMax`.** When the required area exceeds the largest
  API 526 orifice ('T', 16,774 mm²) the loop silently reported 'T' as the selection — e.g. a gas
  relief of 50,000 kg/h @ 1,000 kPa(g) needs ~43,000 mm² (2.56 × T) yet came back as
  `selectedOrifice: 'T'` with no warning, a valve that delivers only ~39% of the required
  capacity. The flag marks that a single valve cannot do it (parallel valves needed);
  `percentUtilized > 100` accompanies it.
- **`metal/weldHeat()` → `hazHardnessClamped`, `coolingTimeClamped`.** HAZ hardness is clamped
  to the Yurioka model's 150–700 HV range and t8/5 to 0.5–300 s. Stainless/cast-iron
  compositions blow past 700 HV (cast iron ≈ 4200 raw) and thin-sheet GTAW lands under 0.5 s,
  producing flat, input-insensitive outputs with no explanation. When the 700 HV ceiling is
  hit the recommendation now says so via the new code **`hazHardnessCapped`** (`{ cap: 700 }`)
  instead of presenting "700 HV" as the expected value (`WeldRecommendationCode` union gains
  one member).
- **`metal/roughness()` → `outOfTableRange`.** Ra/Rz/N inputs outside the ISO 1302 table
  (Ra 0.025–50 µm) were silently snapped up to 4× off (lapped Ra 0.006 → N1 = 0.025;
  sand-cast Ra 100 → N12 = 50). Nearest-grade snapping *within* the table is by design and
  is not flagged.
- **`metal/hardness()` → `outOfTableRange`.** Same class, found while codifying the convention:
  inputs outside the ASTM E140 table (HRC 20–68) clamp to the boundary row, now disclosed.
- **`energy/solarOutput()` → `tiltEfficiencyFloored`.** The tilt/azimuth factors floor at 0.5,
  so a north-facing array reports exactly 50% of south-facing forever (real yield can be
  30–40%). The flag marks the output as an optimistic bound, not an estimate.
- **`quality/aql()` → `aqlUsed`, `aqlAdjusted`.** The embedded ISO 2859-1 table covers AQL
  0.065–6.5 while the standard defines 0.010–1000; requests outside or between columns were
  silently substituted (10 → 6.5, 0.01 → 0.065 — a *looser* plan than asked). `aqlUsed` reports
  the column actually applied.

The rule is now codified in CLAUDE.md: **a function that clamps or snaps to a boundary must
disclose it via a boolean flag.**

### Fixed — error-contract restoration (full ERRORS.md audit)

A source-level audit of all 15 domains found ten functions whose documented `RangeError`
contract was not implemented — degenerate inputs produced `NaN`/`Infinity` or an uncontrolled
`TypeError`. They now validate as documented (⚠️ behavior change for previously-garbage paths):

- `construction/rebarWeight` (unknown size → was NaN), `concreteMix` (unknown grade → was
  TypeError; volume ≤ 0), `brick` (wallArea ≤ 0; unknown size → was TypeError; custom
  dimensions ≤ 0; negative mortar), `stair` (totalRise ≤ 0 → was NaN with a specified riser;
  negative totalRun/riserHeight; riserHeight 0 still means auto-calculate)
- `electronics/resistorDecode` (unknown colors → was NaN; gold/silver as digit → was negative
  resistance; the silent `?? 20%` tolerance fallback for invalid colors now throws),
  `traceWidth` (current/tempRise/copperWeight ≤ 0 → was NaN/Infinity)
- `environmental/energyIntensity` (productionUnits ≤ 0 → was Infinity), `productCarbonFootprint`
  (empty stages → was TypeError; quantity ≤ 0; negative stages remain valid as recycling
  credits, total ≤ 0 → stage percents 0), `vocEmissions` (negative total, efficiency outside
  [0, 1]; zero total → reductionPercent 0), `waterFootprint` (negative volumes; all-zero
  footprint → percents 0)
- `quality/ppm` — out-of-range inputs were clamped silently (defectRate 150 → 100%,
  **sigma 7 → 6**, which substitutes a defect rate orders of magnitude off). Now throws
  `RangeError` for defectRate outside [0, 100], ppm outside [0, 1,000,000], sigma outside
  [0, 6]

### Documentation

- **ERRORS.md is now a complete, source-verified contract**: full per-function tables added for
  Logistics (17), Energy (15), Food (7), Utility (18), Environmental (10), and IE (5) — these
  domains previously had a one-line stub — and 12 stale rows in Metal/Construction/Electronics
  corrected against source. Every domain's row count now matches its function count (210 total).
- README/package.json function census corrected by script count: **210 calculations + 8 type
  guards** (package.json still said 182).

## [0.16.0] - 2026-07-13

### Added

- **`safety/illuminance()` now discloses CU-table clamping.** The coefficient-of-utilization
  table only covers room indices 0.6–5.0; outside that range the lookup silently clamped to the
  boundary CU and the result gave no hint. Realistic industrial rooms do land outside it — a
  10 m-high warehouse gives RI ≈ 0.55, a 50×30 m factory floor RI ≈ 8.7 — so the approximation
  was invisible exactly where it mattered.

  `IlluminanceResult` gains **`cu`** (the coefficient actually used) and **`roomIndexClamped`**
  (true when the room index fell outside the table and the CU was clamped; false when the caller
  supplied `cu` itself, since no lookup happened). `CU_TABLE` and `CU_TABLE_RANGE` are now
  exported so a consumer can state the valid range in its own notice.

  ⚠️ **Additive to the result object.** No existing field changed.

## [0.15.0] - 2026-07-13

### Added

- **`metal/springback()` — sheet-metal springback and overbend compensation.** Computes the
  springback factor `Ks = R_i/R_f = 4x³ − 3x + 1` (with `x = Y·R_i/(E·T)`), the final radius
  after unloading, the angle the bend opens up, and the overbend angle needed to land on the
  target angle (Kalpakjian & Schmid; ASM Metals Handbook Vol. 14B). Material presets mirror
  `bendAllowance()`'s enum (mildSteel / stainless304 / aluminum5052 / aluminum6061) so a bend
  workflow keeps one material selection, plus `custom` with explicit yield strength and
  Young's modulus. Invalid geometry and incomplete `custom` material throw `RangeError`.

  Previously `bendAllowance()` only *warned* that an extreme bend angle "may cause springback
  issues" without quantifying it; this closes that gap.

- **`MaterialResult.youngsModulus` (GPa).** The material lookup returned yield strength but no
  elastic modulus, so springback/deflection work could not be driven from a material grade.
  Reference values (ASM Handbook · MatWeb) added for all 15 grades.

  ⚠️ **Additive to the result object.** Consumers spreading `MaterialResult` into their own
  types get one extra field; no existing field changed.

## [0.14.2] - 2026-07-07

### Documentation

- **`utility/correlation()` — zero-variance sentinel now documented.** `correlation()`
  throws `RangeError` for genuinely invalid input (mismatched lengths, fewer than 2 points),
  but for **valid** constant data (one variable has zero variance, so the Pearson denominator
  is 0) it returns `{ r: 0, r2: 0, n }` as a finite sentinel rather than throwing or emitting
  `NaN` — the same "valid-but-degenerate → finite sentinel" policy as the capability-index
  family. This behavior was already covered by tests but was undocumented in `ERRORS.md`,
  which implied all migrated utility functions throw on invalid input. `ERRORS.md` and the
  `correlation()` JSDoc now document the exception. No behavior change. Surfaced during an
  error-handling characterization audit (online-tools NT-66 갈래①).

## [0.14.1] - 2026-07-06

### Fixed

- **`quality/gageRR()` — `status` now also considers `%GRR`-of-tolerance when a `tolerance`
  is supplied.** Previously `status` was classified from `percentGRR` (the process-control
  criterion, %GRR of Total Variation) alone, so a measurement system with excellent %GRR but
  a tolerance far narrower than the part-to-part variation could report `'acceptable'` while
  `percentTolerance` (the product-acceptance criterion) sat well above 30%. `status` is now
  `worse(byPercentGRR, byPercentTolerance)` — AIAG MSA 4th Ed.'s ≤10/≤30 bands applied to
  both criteria — falling back to `byPercentGRR` alone when no tolerance is given (unchanged
  behavior). Reported via dogfooding (online-tools `quality/gage-rr`, ISSUE-20260705).

## [0.14.0] - 2026-07-05

### Changed (breaking within 0.x) — standard-table conformance sweep

Four independently transcribed lookup tables were found to diverge from their cited
standards (origin: upstream-006, forge-fmea). Each was re-verified cell-by-cell against
the standard or a cell-complete reproduction; all changes move outputs **toward the
published standard**, and every fix ships with cell-level golden tests.

- **`quality/actionPriority()` — AIAG-VDA 2019 AP table conformance** (upstream-006):
  - Occurrence bands were a copy of the severity bands (`4-6/7-8/9-10`); corrected to the
    handbook's `4-5/6-7/8-10`. Detection bands corrected from five bands to the handbook's
    four (`1/2-4/5-6/7-10`) — **`detectionGroup` in the result now ranges 0–3 (was 0–4)**
    and `occurrenceGroup` boundaries moved.
  - The S=1 row is now all-L and the O=1 rows all-L per the handbook (e.g.
    `{S:1, O:10, D:10}` returned `'H'`, now `'L'`). Boundary verdicts moved at O=5/6, O=7/8
    and D=6/7 splits.
  - Verification: Relyence FMEA user-guide reproduction of the handbook table (cell-complete,
    re-extracted twice) + structural invariants; handbook hardcopy not consulted — flagged
    for anyone with 1st-edition access to spot-audit.
- **`safety/ergonomicRisk()` (REBA) — Tables A/B re-transcribed from the published REBA
  worksheet** (Hignett & McAtamney 2000 / Hedge worksheet): 14 of 15 Table A rows and 10 of
  12 Table B rows were a smoothed monotone pattern, not the published values (Table A even
  reached 12; the standard caps at 9; the irregular cells `N3/T1 = 3,3,5,6` and the
  duplicated `N1/N2` Trunk-1 rows were missing). Table C, load score, risk levels were
  already correct. Trunk extension now caps at 3 and upper-arm extension at 2 per the
  worksheet zones (previously |angle| symmetric).
- **`safety/nioshLifting()` — FM/CM tables conformed to NIOSH 94-110 Tables 5 & 7**:
  - CM for fair coupling was inverted (`V<75: 1.0, V≥75: 0.95`; the manual says
    `V<75: 0.95, V≥75: 1.00`) — and the prior test pinned the inverted value while citing
    Table 7.
  - FM now carries the manual's V<75/V≥75 columns: at high frequencies with V<75cm the
    published FM is 0.00 (→ `rwl: 0`, `liftingIndex: Infinity`, the documented sentinel);
    previously the more permissive V≥75 column was used everywhere. Invented FM values that
    do not exist in Table 5 were removed (medium-duration F13-15 `0.19/0.17/0.15` → 0, long
    F11-12 `0.11/0.10` → 0), and frequency >15 lifts/min now yields FM 0 (was clamped to the
    F=15 value). All changes are conservative (lower or equal RWL).
- **`quality/aql()` — re-transcribed from ISO 2859-1:1999 Tables 1 & 2-A** (scanned table
  images from the published standard, cell-by-cell):
  - Table 1: the S-1/S-2/S-3 code-letter columns promoted one lot-size band late in many
    rows (e.g. lot 281–500 at S-1 is code **B**, not A). S-4 and general levels I/II/III
    were already correct.
  - Table 2-A: nearly every Ac/Re pair sat one ladder step too permissive — an off-by-one
    introduced by omitting the standard's 0.15 AQL column (e.g. code J at AQL 6.5 accepted
    on 14 nonconforming; the standard accepts on 10). The 0.15 AQL level is now supported.
    The fixed-sample-size simplification of arrow cells is unchanged and now documented in
    the JSDoc.

- **`environmental/gwpCalculator()` — six cells conformed to IPCC AR6 Table 7.SM.7**
  (verified against the published supplementary table itself): the whole SF6 row was
  computed with the superseded 3,200-year lifetime — AR6 assesses 1,000 years — so
  `18,300/25,200/34,100` → **`18,200/24,300/29,000`** (GWP20/100/500); NF3 GWP500
  `20,700` → **`18,200`**; HFC-152a GWP500 `44` → **`46.8`**; CH4 GWP500 `7.6` (AR4
  leftover) → **`10.0`** (AR6 fossil methane, consistent with the fossil 20/100-year
  values already used). GWP100 additionally cross-checked against the GHG Protocol AR6
  GWP tables v2.0. The JSDoc now states the CH4 row uses AR6 *fossil* methane values,
  and Table 7.SM.7 golden tests pin the corrected cells.
- **`safety/nioshLifting()` — outputs now pass through `roundTo`** per the library-wide
  convention (README "Floating-Point Handling"): `rwl`/`liftingIndex` to 2 decimals,
  computed multipliers (`hm`/`vm`/`dm`/`am`) to 4. `riskLevel` is classified from the
  rounded `liftingIndex` so the returned index and level always agree. The
  `liftingIndex = Infinity` sentinel is unaffected (`roundTo` passes it through).

### Added

- **`quality`: AP matrix exported for consumers** (upstream-006 feature request) —
  `AP_TABLE` (`[severityGroup][occurrenceGroup][detectionGroup]`, deep-readonly) and
  `AP_SEVERITY_BANDS` / `AP_OCCURRENCE_BANDS` / `AP_DETECTION_BANDS`
  (`ApRatingBand { min, max }[]`, index = group), so matrix visualizations don't need a
  locally duplicated table.
- **`safety/ergonomicRisk()`: REBA Step 11 coupling** — optional
  `coupling?: 'good' | 'fair' | 'poor' | 'unacceptable'` input (+0…+3 to Score B, default
  `'good'` preserves existing calls) and `couplingScore` in the result.

### Docs

- README: function tables and domain counts synced to the actual exports (217 functions;
  `actionPriority`/`cpkToOccurrence`/`nelsonRules` rows and the whole Industrial
  Engineering section were missing); ERRORS.md quality rows completed; CLAUDE.md now
  prescribes lookup-table transcription discipline (cell-level golden tests, irregular-cell
  pins, invariant tests).

## [0.13.8] - 2026-06-21

### Fixed

- **`formulab/metal`: re-export the weld-heat code types referenced by `WeldHeatResult`** — addresses online-tools ISSUE-20260621-formulab-weld-type-exports. The 0.13.7 i18n additions surfaced `preheatTemp.sourceCode: WeldPreheatSourceCode` and `recommendationCodes: WeldRecommendation[]` on the exported `WeldHeatResult`, but the supporting type aliases `WeldPreheatSourceCode`, `WeldRecommendationCode`, and `WeldRecommendation` were defined in `types.ts` yet missing from the `metal/index.ts` barrel — so consumers could not name them (`TS2305: Module 'formulab/metal' has no exported member 'WeldRecommendation'`). All three are now re-exported alongside `WeldHeatInput`/`WeldHeatResult`. Type-only change; no runtime or behavioral impact.

## [0.13.7] - 2026-06-21

### Changed (breaking within 0.x)

- **Safety domain: clamp/`Infinity`/0-guard validation migrated to the standard error policy (12 functions)** — the v0.13.5/0.13.6 zero-fill sweep was return-pattern-driven and missed the safety domain, where invalid inputs were masked by `Math.max/min` clamping, `Infinity`, or 0-guards rather than `throw` (reported by online-tools: ISSUE-20260621-formulab-validation-gaps-pid-safety-domain — gap 2). For an accuracy-critical domain this left no defense-in-depth for non-page consumers. The following now **throw `RangeError`** with a per-constraint message:
  - `arcFlash()` (voltage/boltedFaultCurrent/workingDistance/faultClearingTime/gapBetweenConductors ≤ 0), `illuminance()` (roomLength/roomWidth/lumensPerLuminaire/targetLux ≤ 0, or luminaireHeight ≤ workplaneHeight — **return-type behavior change**: previously returned an all-zero result), `lel()` (gas with negative concentration or non-positive LEL), `respiratorCalculate()` (oel ≤ 0 — **was a tested `Infinity` return**; concentration < 0), `confinedSpace()` (oxygenPercent outside 0–100, or any negative gas reading; customGas pel/idlh ≤ 0), `thermalComfort()` (relativeHumidity outside 0–100, metabolicRate ≤ 0, clothingInsulation < 0, airVelocity < 0), `nioshLifting()` (negative distance/angle/frequency/loadWeight), `ladderAngle()` (negative height/baseDistance; ladderLength ≤ 0 when used as a given), `fallClearance()` (workerHeight ≤ 0, or negative distances), `havsCalculate()` (negative tool vibrationMagnitude/exposureTime), `noiseExposure()` (negative exposure duration), `ergonomicRisk()` (load < 0).
  - **Boundaries deliberately preserved** (valid degenerate domain answers, not invalid input): `confinedSpace()` accepts a reading of `0` (a valid, possibly catastrophic measurement); `fallClearance()` keeps anchorHeight ≤ 0 → `isAdequate=false` + warning; `thermalComfort()`/`wbgtCalculate()` accept negative °C temperatures; `ergonomicRisk()` accepts negative joint angles (flexion/extension); empty tool/exposure/gas lists report no-exposure. **Intentional `Infinity` sentinels kept** (and now documented in `ERRORS.md`): `respiratorCalculate().safetyMargin = Infinity` when concentration = 0 (no hazard), `nioshLifting().liftingIndex = Infinity` when RWL = 0 (no acceptable weight) — both from valid inputs, analogous to the `cpk`/`ppk`/`cmk` degenerate-spread exception. `wbgtCalculate()` remains `safe` (no invalid-input class).
- **`lel()` status thresholds conservatized (NT-14)** — the mixed-gas `%LEL` status used `safe < 25 / caution 25–50 / danger > 50`, more permissive than the industry `%LEL` convention used everywhere else in the library (`confinedSpace()` and all locale docs: `safe < 10 / caution 10–25 / danger > 25`, evacuate above 25% LEL). `lel()` now follows the same `10 / 25` convention. **Behavior change**: the `status` field returns `caution`/`danger` at lower `%LEL` than before (e.g. 20% LEL: `safe` → `caution`; 40% LEL: `caution` → `danger`). Numeric outputs (`mixtureLel`, `percentOfLel`, `safetyMargin`) are unchanged.

### Added

- **`weldHeat()`: machine-readable i18n codes (additive, backward-compatible)** — addresses online-tools ISSUE-20260621-formulab-weldheat-recommendations-no-code, where consumers could only render the English `recommendations` prose and `preheatTemp.source` string (i18n required brittle reverse-mapping or re-implementing the branch logic — both layer-violating anti-patterns). The result now also carries:
  - `preheatTemp.sourceCode: 'awsTable' | 'awsJudgment' | 'engineeringJudgment'` alongside the unchanged `source` string.
  - `recommendationCodes: { code, params }[]` parallel (index-aligned) to `recommendations`, with stable codes (`preheat`, `fastCooling`, `pwht`, `stainlessInterpass`, …) and interpolation params (e.g. `{ min, max, source }`, `{ t85 }`, `{ hazHardnessMax }`). Consumers map `code` → a localized template and interpolate `params`. The existing `recommendations`/`source` strings are untouched.

## [0.13.6] - 2026-06-21

### Changed (breaking within 0.x)

- **Invalid-input zero-fill results migrated to the standard error policy — tail of the v0.13.5 sweep** — the v0.13.5 sweep missed a set of public functions that still returned an all-zero/sentinel result object on must-be-positive invalid input instead of throwing (reported by online-tools: ISSUE-20260621-formulab-zerofill-invalid-guards, which independently reproduced user-facing zero-fills the prior full-audit had marked drained). `ERRORS.md` already documented several of these as `throw` (aspirational); the code now conforms. All of the following now **throw `RangeError`** with a per-constraint message, consistent with the rest of the library — consumers branch on the boundary, not on a zero result:
  - **metal**: `bolt()` (diameter/pitch/kFactor/tensileStrength ≤ 0; torque ≤ 0 in `torqueToPreload`, preload ≤ 0 in `preloadToTorque` — all six former zero-fill paths), `pressFit()` (shaftDiameter/holeDiameter/hubOuterDiameter/contactLength ≤ 0 — the clearance-fit `interference ≤ 0` and `hubOuterDiameter ≤ shaftDiameter` results are legitimate physical states and **kept**), `spring()` (wireDiameter/meanCoilDiameter/activeCoils ≤ 0), `tap()` (majorDiameter/pitch ≤ 0), `welding()` (thickness ≤ 0 — previously returned empty recommendations + zero rod diameter).
  - **logistics**: `dimWeight()` (length/width/height ≤ 0; actualWeight < 0 — zero actual weight stays legit, billing falls back to dimensional weight), `fillRate()` (totalOrders ≤ 0), `freightClass()` (weight/length/width/height ≤ 0), `kanban()` (dailyDemand/leadTime/containerQuantity ≤ 0), `pickTime()` (speed/itemsPerOrder ≤ 0).
  - **electronics**: `smtTakt()` (placementRate/componentsPerBoard ≤ 0), `solderPaste()` (padCount/stencilThickness ≤ 0).
  - **energy**: `motorEfficiency()` (currentEfficiency/newEfficiency ≤ 0).
  - **automotive**: `batteryRuntime()` (capacityAh ≤ 0 — completing the voltageV/loadW guards added in 0.13.5).
  - **chemical**: `ph()` (acidConcentration/baseConcentration ≤ 0), `pid()` (non-positive process parameters in every method branch — processGain/deadTime/timeConstant ≤ 0 for Z-N step & Cohen-Coon, ultimateGain/ultimatePeriod ≤ 0 for Z-N ultimate; previously returned all-zero gains).
  - **quality**: `aql()` (lotSize ≤ 0).
  - **construction**: `slope()` (ratio ≤ 0 — a 1:N ratio with N ≤ 0 is vertical/undefined, previously inverted to "flat 0%"; percent/degrees value 0 stays legit flat ground).
- **Intentionally kept** (unchanged): `cpk()`/`ppk()`/`cmk()` degenerate-spread zero result (stdDev ≤ 0 → zero indices — a computable degenerate case, not invalid input); `kanban()` negative `safetyFactor` zero-fill and `fillRate()` `serviceLevel()` (not must-be-positive); all legitimate-zero computations (e.g. automotive `power()`/`torque()`, energy `carbonFootprint()` where 0 input = 0 output). `ERRORS.md` condition descriptions corrected for the migrated functions.

## [0.13.5] - 2026-06-18

### Changed (breaking within 0.x)

- **Invalid-input `return null` / zero-fill results migrated to the standard error policy across 8 domains** — a systematic sweep (reported by online-tools: ISSUE-20260612-formulab-null-returns-full-audit) found ~25 public functions that returned `null` or an all-zero/sentinel result object on invalid input instead of throwing, contradicting `ERRORS.md`. `ERRORS.md` itself was found to be aspirational for several of these (it claimed `throw` where the code 0-filled) and has been corrected to match the code. All of the following now **throw `RangeError`** with a per-constraint message:
  - **automotive**: `fuelEconomy()` (value ≤ 0), `evCharging()` (socEndPercent ≤ socStartPercent, chargerPowerKw ≤ 0), `batteryRuntime()` (voltageV ≤ 0, loadW ≤ 0), `gearRatio()` (drivingTeeth ≤ 0).
  - **energy**: `insulationRoi()` (surfaceArea/tempDifference/insulationK/insulationThickness ≤ 0), `degreeDay()` (empty `dailyTemps`).
  - **food**: `calorie()` (weightKg/heightCm/age ≤ 0).
  - **metal**: `cutting()` (toolDiameter ≤ 0), `bearing()` (dynamicLoadRating/equivalentLoad/rpm ≤ 0), `roughness()` (value ≤ 0), `weldHeat()` (voltage/current/travelSpeed/thickness ≤ 0), `vibration()` (non-positive system/geometry field; innerDiameter ≥ outerDiameter), `pressTonnage()` (combined operation without `operations`). **Return type changes** (`... | null` → non-nullable): `cuttingStock()` (empty pieces, zero total quantity, stockLength ≤ 0, piece > stockLength), `material()` (unknown category/grade), `screw()` (unknown designation), `thread()` (unknown size), `tolerance()` (nominal size out of range, unknown IT grade / deviation letter).
  - **quality**: `mtbf()` (totalOperatingTime ≤ 0, numberOfFailures ≤ 0 — with zero failures MTBF is undefined; the previous `0` wrongly read as "fails constantly"), `dpmo()` (units ≤ 0, opportunities ≤ 0), `lineBalancing()` (empty tasks, cycleTime ≤ 0, a task time > cycleTime, circular dependency; `... | null` → non-nullable).
  - **electronics**: `viaCurrent()` (holeDiameter/platingThickness/viaLength/tempRise ≤ 0; `... | null` → non-nullable).
  - **logistics**: `shipping()` (weight/volume ≤ 0, truck distance ≤ 0, unknown mode; `... | null` → non-nullable), `tsp()` (empty nodes; `... | null` → non-nullable).
  - **construction**: `pert()` (empty tasks, circular dependency; `... | null` → non-nullable).
- **Lookup-miss policy unified to throw** — unknown designation/grade/size/category (`material`/`screw`/`thread`/`tolerance`) now throw, consistent with the rest of metal (`hardness`/`pipeSpec`/`flangeSpec`). Consumers branch on the boundary, not on `null`.
- **Intentionally kept** (not invalid input): `npv().irr` non-convergence null; `nelsonRules()` internal rule-helper nulls (never surfaced); `pallet3d()` internal placement-helper null; `cpk()`/`ppk()`/`cmk()` degenerate-spread zero result; `energyDensity()` missing-mass null.

## [0.13.4] - 2026-06-18

### Changed (breaking within 0.x)

- **`earthwork()` / `formwork()` (construction): zero-filled result on invalid input migrated to the standard error policy** — both functions previously returned an all-zero result for non-positive dimensions instead of throwing, and their existing tests encoded that as an "edge case". They now **throw `RangeError`** with a per-constraint message, matching `ERRORS.md` (which already documented them as `throw`) and the beamLoad/compressedAirCost migrations:
  - `earthwork()`: non-positive `length`/`width`/`depth`, or non-positive `swellFactor`/`shrinkFactor` (a zero factor silently produced a zero loose/compacted volume).
  - `formwork()`: non-positive dimension **consumed by the element type's area formula** (column/beam/footing → length, width, height; slab → length, width; wall → length, height) or non-positive `quantity`. Dimensions a given element type ignores (slab height, wall width) are left unvalidated, so a formula-irrelevant zero is still accepted. `reuses ≤ 0 → 1` remains intentional lenient behavior.

  Reported by online-tools: ISSUE-20260618-formulab-earthwork-formwork-zerofill (NT-9). `ERRORS.md` condition text updated from "Negative dimensions" to the precise non-positive constraints.

## [0.13.3] - 2026-06-12

### Changed (breaking within 0.x)

- **`compressedAirCost()` (energy): `costPerCfm` renamed to `costPerFt3`** — the value is total cost divided by delivered volume in cubic feet ($/ft³); "CFM" is a flow rate (ft³/min), so the old name was dimensionally wrong (the conversion comment also incorrectly read "1 m3 = 35.3147 CFM"). Reported by online-tools: ISSUE-20260612-formulab-compressedaircost-cfm-dimension-zerofill.
- **`compressedAirCost()`: zero-filled result on invalid input migrated to the standard error policy** — non-positive `compressorPower`/`runningHours`/`airOutput` now **throws `RangeError`** with a per-constraint message instead of returning an all-zero result. Note: zero-fill returns are not caught by `return null` scans — the null-returns audit (ISSUE-20260612-formulab-null-returns-full-audit) should also cover this pattern.

## [0.13.2] - 2026-06-12

### Changed (breaking within 0.x)

- **`beamLoad()` (construction): `LoadResult | null` migrated to the standard error policy** — now **throws `RangeError`** with a per-constraint message (non-positive span, missing `uniformLoad`/`pointLoad` for the selected load type) instead of returning `null`, matching ERRORS.md and the 0.13.0 utility migration. Also adds a new guard: `pointPosition` outside `[0, span]` now throws (previously produced physically meaningless negative moments). Return type is non-nullable. Reported by online-tools: ISSUE-20260612-formulab-beamload-null-returns.

## [0.13.1] - 2026-06-12

### Added

- **`statistics()` gains `sampleVariance` / `sampleStdDev`** — sample statistics with Bessel's correction (divisor n−1), `undefined` when the data set has fewer than 2 values. The existing `variance`/`stdDev` remain population statistics (divisor n) and are now explicitly documented as such in JSDoc and `StatisticsResult`. Additive and non-breaking. Practitioner-facing calculators typically need the sample variant for measured data (reported by online-tools: ISSUE-20260612-formulab-statistics-population-vs-sample).

## [0.13.0] - 2026-06-11

### Changed (breaking within 0.x)

- **`utility` domain: `Result | null` signatures migrated to the standard error policy** — 16 functions (`assignment`, `bilinearInterpolation`, `correlation`, `depreciation`, `histogram`, `lcc`, `linearInterpolation`, `movingAverage`, `normalize`, `npv`, `percentile`, `regression`, `roi`, `statistics`, `unit`, `weightedScore`) now **throw `RangeError`** with a descriptive, per-constraint message instead of returning `null` on invalid input, matching every other domain and ERRORS.md. Return types are now non-nullable. `NpvResult.irr: number | null` is intentionally kept — IRR non-convergence is a domain answer, not invalid input. Consumers that branched on `null` should catch `RangeError` instead (reported by online-tools: ISSUE-20260610-formulab-utility-null-returns).
- **`effectiveDiameter()` (machining): placeholder `effectiveRpm: 0` removed** — the result no longer hard-codes a zero RPM (reported by online-tools: ISSUE-20260610-formulab-effectivediameter-rpm-placeholder). The function now returns:
  - `rpmCorrectionFactor` (= D / Deff, always present) — multiply nominal RPM by this to keep the programmed surface speed at depth;
  - `effectiveRpm?` — computed as `(Vc × 1000) / (π × Deff)` only when the new optional `cuttingSpeed` (m/min) input is provided; omitted otherwise (never 0-filled).
  Also adds input validation (`RangeError` on non-positive D/ap, ap > D, non-positive Vc) and clamps `Deff = D` beyond the equator (ap > D/2) where the previous formula incorrectly decreased.

### Fixed

- **`lineBalancing()` (quality): successors can now share a station with their predecessors** — the RPW assignment marked a task "completed" only when its station closed, which forced every successor into a later station and inflated the station count to the precedence-chain depth (e.g. a 5-task chain with a generous cycle time produced 4 stations and 5% line efficiency instead of 1 station / 20%). Standard RPW (Helgeson & Birnie) allows same-station placement because the within-station sequence preserves precedence. Reported by online-tools: ISSUE-20260611-formulab-linebalancing-same-station-precedence.

## [0.12.1] - 2026-06-09

### Added

- **`controlChart()` gains `chartType: 'imr'`** — Individuals & Moving-Range (I-MR) chart for single-value time series where subgroup size = 1. Computes X̄ ± E₂·MR̄ control limits for the Individuals chart and D₄·MR̄ for the MR chart (d₂=1.128, E₂=2.66, D₄=3.267; AIAG SPC 2nd Ed. / Montgomery). `sigmaEstimate` uses σ̂ = MR̄/d₂; first data point carries no moving range (`subgroupStats[0].range` is `undefined`). Additive — existing Xbar-R/S code paths are unchanged. New `ControlChartType` union member: `'imr'`.
- **`histogram()` gains optional `range`** — `HistogramInput` now accepts `range?: [number, number]` to specify an explicit `[min, max]` binning window. Useful when spec limits or reference bounds extend beyond the data span. Falls back to data-derived min/max when the provided range is invalid (`range[1] <= range[0]`). Values outside the supplied range are clamped into the first or last bin. `totalCount` always reflects the actual data length. Additive and non-breaking.

## [0.12.0] - 2026-06-09

### Added

- **`cpk()` now returns `withinSpecPercent`** — estimated percentage of output within `[LSL, USL]` under a normal model, mirroring `ppk()`. The capability (`cpk`) and performance (`ppk`) result shapes are now symmetric, so consumers no longer need to recompute the within-spec fraction with `normalCDF`. `CpkResult` gains the field (additive, non-breaking). For `cpk()` this is a short-term/potential estimate (uses the supplied short-term σ); see the function JSDoc.
- **`ppk()` gains cpk-aligned field names** — `PpkResult` now also exposes `ppu`, `ppl`, and `sigmaLevel` (matching `cpk()`'s `cpu`/`cpl`/`sigmaLevel`). Additive and non-breaking; values are identical to the existing fields.

### Changed

- **`cpk()` outputs are now rounded via `roundTo`** (cp/cpk/cpu/cpl/withinSpecPercent to 4 dp, sigmaLevel to 2 dp), consistent with `ppk()` and the library-wide rounding convention. Previously `cpk()` returned full-precision floats.

### Deprecated

- **`PpkResult.ppUpper` / `ppLower` / `sigma`** — superseded by `ppu` / `ppl` / `sigmaLevel` for symmetry with `cpk()`. The old fields remain available (identical values) and will be removed in a future release. Note `sigma` was a misleading name — it holds the sigma *level* (3 × Ppk), not the standard deviation.

### Fixed

- **ERRORS.md accuracy** — `cpk()`, `ppk()`, and `cmk()` were documented as throwing on `stdDev = 0` (the `cpk()` row also wrongly claimed it returns `Infinity`), but all three intentionally return a zero-valued result (verified by tests). Corrected the per-function tables and added an explicit note that the capability-index family is exempt from the "validation failures → throw" rule.

## [0.11.1] - 2026-04-02

### Fixed

- **Subpath exports** — added a `default` condition to every subpath in `package.json` `exports`. Previously only the `import` condition was present, causing `ERR_PACKAGE_PATH_NOT_EXPORTED` when consumed from CJS contexts (e.g. the `tsx` test runner). ESM consumers are unaffected.

## [0.11.0] - 2026-04-02

### Added

- **New IE (Industrial Engineering) domain** (`formulab/ie`) with 5 functions: `standardTime`, `timeStudy`, `workSampling`, `vaAnalysis`, `learningCurve`.
- **New quality (FMEA/SPC) functions**: `actionPriority` (AIAG-VDA 2019 AP matrix), `cpkToOccurrence` (Cpk → FMEA occurrence mapping), `nelsonRules` (SPC control-chart 8 rules).

### Fixed

- **`learningCurve()` unit vs cumulative model** — the two models previously produced identical results. The unit model now sums individual unit times and the cumulative model derives unit time from cumulative totals.

## [0.10.1] - 2026-02-09

### Fixed

- **`throw new Error` → `throw new RangeError`** across all 18 remaining files — runtime error type now matches `@throws {RangeError}` JSDoc and ERRORS.md policy. Affected domains: automotive, chemical, construction, electronics, energy, environmental, machining, metal, quality, safety.

### Changed

- **README.md** — Updated test count (2,494), error handling section (no legacy NaN/Infinity), utility domain (3 → 16 functions).

## [0.10.0] - 2026-02-09

### Breaking Changes

- **`awgProperties()` return type** — Changed from `AwgResult | null` to `AwgResult`. Invalid AWG range (< 0 or > 40) now throws `RangeError` instead of returning `null`.
- **`metalWeight()`** — Now throws `RangeError` on non-positive dimensions (length, width, thickness, diameter) and when outerDiameter ≤ innerDiameter for pipes.
- **`cRate()`** — Now throws `RangeError` when capacityAh ≤ 0, currentA ≤ 0, or cRate ≤ 0. Previously returned `Infinity`.
- **`toolDeflection()`** — Now throws `RangeError` on non-positive toolDiameter/stickout or negative cuttingForce. Stiffness is computed as `3EI/L³` (beam property) instead of `F/δ`.
- **`boringBarDeflection()`** — Same changes as `toolDeflection()`: validation + stiffness formula fix.
- **`heatTransfer()`** — All `throw new Error()` changed to `throw new RangeError()`. Removed `Infinity` fallback in radiation thermal resistance.

### Added

- **`@throws` JSDoc annotations** for 14 functions across 10 domains — documents every throw condition for IDE/editor hints:
  - automotive: `brakingDistance`
  - chemical: `heatTransfer`, `pipeFlow`
  - construction: `aggregate`, `momentOfInertia`
  - electronics: `ohmsLaw`, `stencil`
  - energy: `solarOutput`
  - environmental: `scope2Emissions`
  - machining: `triangleSolver`
  - metal: `flangeSpec`, `pipeSpec`
  - quality: `controlChart`
  - safety: `ventilationRate`

- **26 new validation tests** — error path coverage for `metalWeight`, `cRate`, `toolDeflection`, `boringBarDeflection`, `heatTransfer`, `awgProperties`

### Changed

- **ERRORS.md** — Removed legacy migration roadmap (all NaN/Infinity patterns resolved). Updated all 6 function entries to reflect `throw` behavior.
- Total test count: 2468 → 2494 (+26)

## [0.9.0] - 2026-02-09

### Added

- **Type Guards** — 8 runtime type guard functions for discriminated union inputs ([#2](https://github.com/iyulab/formulab/issues/2)):
  - `isCRateInput()` — battery domain (mode: currentToRate | rateToCurrent)
  - `isDilutionInput()` — chemical domain (solveFor: c1 | v1 | c2 | v2)
  - `isReactorInput()` — chemical domain (shape: cylindrical | spherical)
  - `isHeatTransferInput()` — chemical domain (mode: conduction | convection | radiation)
  - `isMomentOfInertiaInput()` — construction domain (shape: 7 variants)
  - `isOhmsLawInput()` — electronics domain (solveFor: voltage | current | resistance | power)
  - `isMetalWeightInput()` — metal domain (shape: plate | round | pipe | angle)
  - `isBoltInput()` — metal domain (mode: torqueToPreload | preloadToTorque)

- **Error Behavior Specification** — `ERRORS.md` documenting error policy and per-function error behavior ([#1](https://github.com/iyulab/formulab/issues/1)):
  - Defined error policy: validation failures → throw RangeError
  - Documented all 174 functions' error behavior (throw / NaN / Infinity / null / safe)
  - Identified 6 legacy NaN/Infinity patterns with migration roadmap to v0.10.0

### Changed

- Total function count: 174 → 182 (+8 type guards)

## [0.7.0] - 2026-02-07

### Added

- **Quality** (+4 functions, 14 → 18):
  - `gageRR()` — Gage R&R repeatability/reproducibility analysis (AIAG MSA 4th Edition)
  - `cmk()` — Machine capability index Cm/Cmk (threshold ≥ 1.67)
  - `weibull()` — Weibull reliability analysis with median rank regression
  - `paretoAnalysis()` — Pareto 80/20 ABC classification

- **Safety** (+5 functions, 9 → 14):
  - `thermalComfort()` — PMV/PPD thermal comfort (ISO 7730 Fanger model)
  - `ergonomicRisk()` — REBA ergonomic risk assessment scoring
  - `arcFlash()` — Arc flash incident energy & PPE category (IEEE 1584/NFPA 70E)
  - `confinedSpace()` — Confined space atmospheric assessment (OSHA 29 CFR 1910.146)
  - `lel()` — Lower explosive limit for mixed gases (Le Chatelier's rule)

- **Energy** (+4 functions, 11 → 15):
  - `heatPump()` — Heat pump COP & Carnot efficiency with annual savings
  - `degreeDay()` — Heating/Cooling degree day calculation (HDD/CDD)
  - `windOutput()` — Wind turbine output with Rayleigh capacity factor
  - `cusum()` — CUSUM energy anomaly detection (Page's algorithm)

- **Chemical** (+3 functions, 9 → 12):
  - `flowControl()` — Control valve Cv/Kv sizing (ISA/IEC 60534)
  - `reliefValve()` — Safety relief valve sizing (API 520/526)
  - `pid()` — PID controller tuning (Ziegler-Nichols / Cohen-Coon)

- **Logistics** (+1 function, 16 → 17):
  - `abcAnalysis()` — ABC inventory classification by annual value

- **Food** (+2 functions, 4 → 6):
  - `waterActivity()` — Water activity microbial growth risk (HACCP)
  - `stabilityStudy()` — Accelerated stability study with Arrhenius regression (ICH Q1A)

- **Automotive** (+1 function, 8 → 9):
  - `chargingLoss()` — EV charging loss/efficiency with temperature derating

### Changed

- Total function count: 154 → 174 (+20)
- Total domains: 14 (unchanged)

## [0.6.0] - 2026-02-07

### Added

- **Energy** (+4 functions, 7 → 11):
  - `boilerEfficiency()` — Boiler thermal efficiency (direct input-output method)
  - `transformerLoss()` — Transformer loss calculation with optimal load point
  - `insulationRoi()` — Insulation ROI with payback period
  - `ledRoi()` — LED lighting retrofit ROI with CO2 savings

- **Safety** (+2 functions, 7 → 9):
  - `ladderAngle()` — Ladder safety angle calculation (OSHA 4:1 rule, 70°–80° compliance)
  - `illuminance()` — Workplace illuminance calculation (Lumen Method with CU lookup)

- **Logistics** (+2 functions, 14 → 16):
  - `inventoryTurnover()` — Inventory turnover ratio, days/weeks of supply, GMROII
  - `loadCapacity()` — Forklift load capacity derating with attachment loss

## [0.5.0] - 2026-02-07

### Added

- **Machining** (new domain, 12 functions):
  - `truePosition()` — GD&T True Position with MMC bonus tolerance (ASME Y14.5)
  - `boltCircle()` — Bolt hole pattern coordinate calculation
  - `sineBarHeight()` — Sine bar gauge block height with rounding error analysis
  - `radialChipThinning()` — Radial chip thinning compensation for light cuts
  - `toolDeflection()` — End mill cantilever deflection (carbide/HSS)
  - `cuspHeight()` — Ball end mill scallop height and surface roughness
  - `effectiveDiameter()` — Ball end mill effective cutting diameter at depth
  - `boringBarDeflection()` — Boring bar deflection with L/D ratio guidance
  - `threadOverWires()` — 3-wire thread measurement (60°/55°/29°/30° angles)
  - `gaugeBlockStack()` — Gauge block combination using successive subtraction (47/88/81-pc sets)
  - `triangleSolver()` — Triangle solver (SSS/SAS/ASA/AAS/SSA with law of cosines/sines)
  - `cycleTimeEstimator()` — CNC cycle time estimation with operation breakdown

## [0.4.0] - 2026-02-07

### Added

- **Battery** (new domain, 10 functions):
  - `energyDensity()` — Wh/kg and Wh/L energy density calculation
  - `cRate()` — C-rate ↔ current/time bidirectional conversion
  - `stateOfHealth()` — SOH % with degradation status thresholds (IEEE 1188)
  - `batteryPackConfig()` — Series/parallel cell configuration calculator
  - `cycleLife()` — Cycle life estimation with chemistry (7 types), DOD, and temperature factors
  - `internalResistance()` — DCIR calculation from OCV and load voltage (IEC 61960)
  - `selfDischarge()` — Self-discharge rate (daily and monthly %)
  - `thermalRunaway()` — Thermal safety margin analysis (SAE J2464)
  - `bmsBalancing()` — BMS passive cell balancing time estimation
  - `chargingProfile()` — CC-CV charging profile timing with phase breakdown

- **Environmental** (new domain, 10 functions):
  - `scope1Emissions()` — Direct combustion emissions with 6 fuel types (EPA/IPCC 2006 factors)
  - `scope2Emissions()` — Purchased electricity emissions for 12 grid regions (IEA 2023 factors)
  - `scope3Emissions()` — Supply chain spend-based emissions for 8 Scope 3 categories (EPA EEIO)
  - `vocEmissions()` — VOC emissions with capture/destruction efficiency
  - `productCarbonFootprint()` — Product lifecycle carbon footprint with stage breakdown (ISO 14067)
  - `gwpCalculator()` — GWP conversion for 8 GHG gases × 3 time horizons (IPCC AR6)
  - `energyIntensity()` — Energy intensity per unit/revenue (ISO 50001)
  - `waterFootprint()` — Water footprint blue/green/grey breakdown (ISO 14046)
  - `emissionsIntensity()` — Emissions intensity per unit/revenue/employee
  - `esgSummary()` — ESG reduction tracking with projections (TCFD/CDP/SBTi)

- **Metal** (3 new functions, 22 → 25):
  - `materialGradeConverter()` — ASTM/EN/JIS/GB/KS grade cross-reference (20 grades × 5 standards)
  - `pipeSpec()` — ANSI/ASME B36.10 pipe dimensions lookup (15 sizes × 6 schedules)
  - `flangeSpec()` — ASME B16.5 WN flange dimensions lookup (8 sizes × 3 pressure classes)

### Changed

- Total domains: 11 → 13
- Total function count: 111 → 134 (+23)
- Total test count: 1705 → 1887 (+182)

## [0.3.0] - 2026-02-06

### Added

- **Quality**: `controlChart()` — SPC X-bar/R and X-bar/S control charts with AIAG/ASTM E2587 constants (n=2..25)
- **Chemical**: `pipeFlow()` — Darcy-Weisbach pipe flow calculator with Swamee-Jain friction factor (laminar/transitional/turbulent)
- **Chemical**: `heatTransfer()` — Three modes: conduction (Fourier), convection (Newton), radiation (Stefan-Boltzmann)
- **Construction**: `momentOfInertia()` — Section properties (A, Ix, Iy, Sx, Sy, rx, ry) for 7 cross-section shapes (rectangle, circle, hollow rectangle, hollow circle, I-beam, T-section, C-channel)
- **Electronics**: `ohmsLaw()` — V/I/R/P calculator with discriminated union input
- **Energy**: `solarOutput()` — Solar panel output estimation based on PVWatts methodology
- **Safety**: `ventilationRate()` — Required ventilation rate (ACH/CFM/L/s) per ASHRAE 62.1 / OSHA guidelines
- **Automotive**: `brakingDistance()` — Stopping distance calculator per AASHTO method with grade adjustment

### Changed

- Total function count: 103 → 111
- Total test count: 1630 → 1705

## [0.2.0] - 2026-02-06

### Breaking Changes
- **`MetalWeightInput`**: Now a discriminated union by `shape`. Each shape variant requires its specific fields (e.g., `shape: 'plate'` requires `width` and `thickness`). The `materialName` field is now a `MaterialName` literal union type instead of `string`.
- **`DilutionInput`**: Now a discriminated union by `solveFor`. Each variant provides exactly the three known values, eliminating optional fields and `!` assertions.
- **`ReactorInput`**: Now a discriminated union by `shape`. `shape: 'cylindrical'` requires `height`; `shape: 'spherical'` does not accept `height`.
- **`BoltInput`**: Now a discriminated union by `mode`. `mode: 'torqueToPreload'` requires `torque`; `mode: 'preloadToTorque'` requires `preload`.
- **QR code types removed**: `QrcodeInput`, `QrcodeResult`, `ErrorCorrectionLevel` types and `qrcode.ts` module removed from `formulab/utility` (was empty shell with no implementation).

### Enhanced
- **`roundTo()`**: Fixed negative number rounding (`-2.555` now correctly rounds to `-2.56` instead of `-2.55`). Uses sign-aware epsilon correction.
- **`oee()`**: Results now consistently rounded via `roundTo()` (factors to 4 decimals, percentages to 1 decimal).

### Fixed
- **Duplicate code removal**: Consolidated `normalCDF()`, `normalInvCDF()`, and `clamp()` from 6 files into shared `math.ts` module.
- **`Math.round` inconsistency**: Replaced manual `Math.round(x * N) / N` patterns with `roundTo()` in 8 files (`metalWeight`, `fallClearance`, `welding`, `carbonFootprint`, `powerCost`, `bendAllowance`, `weldHeat`, `roughness`).
- **Duplicate test file**: Removed `src/metal/pressTonnage.test.ts` (14 duplicate tests); canonical version at `src/metal/__tests__/pressTonnage.test.ts` (19 tests) retained.

### Changed
- **Coverage thresholds**: Raised from baseline (5% lines) to realistic levels (90% lines, 95% functions, 85% branches, 90% statements).
- Total test count: 1630 tests across 102 test files.

## [0.1.11] - 2026-02-06

### Enhanced
- **`fallClearance()`**: Complete rewrite with ANSI Z359.1/Z359.4 compliance
  - Added `rescueClearance` parameter (default 0.9m per ANSI Z359.4)
  - Added `obstacleHeight` parameter for elevated obstacle detection
  - Added `freeSpaceRequired` and `clearanceAboveObstacle` outputs
  - Added `warnings` array with validation against OSHA/ANSI limits
  - Separated physical fall distance from safety factor (correct per standards)

- **`weldHeat()`**: Major enhancement with industry standards
  - Added AWS D1.1:2020 Table 5.8 preheat requirements with CE×thickness interaction
  - Added Rosenthal cooling time equations (t8/5) for thick and thin plate heat flow
  - Added Yurioka HAZ hardness formula with cooling rate factor
  - Added Carbon Equivalent Pcm formula for low-alloy steels (C < 0.18%)
  - Added hydrogen control level determination
  - Added source attribution for preheat recommendations

- **`pressTonnage()`**: Deep drawing enhancements with DIN 8584 basis
  - Added Siebel formula for drawing force with friction and bending effects
  - Added blank holder force calculation: F_bh = π/4 × (D² - d²) × p_bh
  - Added multi-draw detection and estimation for deep draws (d/D < 0.55)
  - Added `frictionCoefficient`, `blankHolderPressure`, `dieRadius` parameters
  - Added `warnings` array for process risk assessment

### Added
- **Test suite**: `pressTonnage` (19 test cases covering blanking, bending, enhanced drawing)
- Total test count: 1648 tests across 103 test files

### Changed
- Formula review completed for high-risk domains (safety, metal)
- Three functions upgraded from 70-85% to 95%+ theoretical completeness

## [0.1.10] - 2026-02-06

### Added
- **Test suites (Cycle 14)**: 28개 함수 완전 테스트 추가 (437 test cases)
  - metal: `bendAllowance`, `bolt`, `cuttingStock`, `flatPattern`, `gear`, `kFactorReverse`, `material`, `pressFit`, `pressTonnage`, `roughness`, `screw`, `spring`, `tap`, `thread`, `tolerance`, `vibration`, `weldHeat`, `welding`
  - logistics: `containerFit`, `fillRate`, `freightClass`, `pallet3d`, `palletStack`, `pickTime`, `shipping`, `tsp`
  - construction: `roof`, `stair`
- Total test count: 1622 tests across 102 test files

### Changed
- Coverage dramatically improved: 62.09% → 98.11% lines (+36.02%)
- Branch coverage: 88.72% → 90.55%
- Function coverage: 89.63% → 100%
- All domains now have 95%+ line coverage
- **Milestone**: 100% function coverage achieved, 98%+ line coverage, library fully tested

## [0.1.9] - 2026-02-05

### Added
- **Test suites (Cycle 13)**: 25개 함수 대규모 테스트 추가 (488 test cases)
  - quality: `aql`, `cycle`, `downtime`, `lineBalancing`, `ppk`
  - chemical: `concentration`, `ph`, `reactor`, `shelfLife`, `injectionCycle`
  - electronics: `reflow`, `resistor`, `smt-takt`, `solder`, `trace`, `capacitor`, `stencil`, `via`
  - construction: `beamLoad`, `concreteMix`, `formwork`, `rebar`, `aggregate`, `brick`, `pert`
- Total test count: 1185 tests across 74 test files

### Changed
- Coverage improved: 36.46% → 62.09% lines (+25.63%)
- quality 도메인: 98.68% lines
- chemical 도메인: 99.40% lines
- electronics 도메인: 98.37% lines
- construction 도메인: 83.30% lines
- **Milestone**: Line coverage 60% 돌파, 6개 도메인 90%+ 커버리지 달성

## [0.1.8] - 2026-02-05

### Added
- **Test suites (Cycle 11)**: `yieldCalc`, `rpn`, `ppm` (quality), `safetyStock`, `kanban` (logistics)
- **Test suites (Cycle 12)**: 17개 함수 대규모 테스트 추가
  - safety: `fallClearance`, `noiseExposure`, `wbgtCalculate`, `havsCalculate`, `respiratorCalculate`
  - food: `haccp`, `expiry`
  - automotive: `batteryRuntime`, `evCharging`, `fuelEconomy`, `tireCompare`, `torque`, `power`
  - energy: `compressedAirCost`, `motorEfficiency`, `pfCorrection`, `vfdSavings`
- Total test count: 697 tests across 49 test files

### Changed
- Coverage improved: 20.74% → 36.46% lines (+15.72%)
- safety 도메인: 39.63% → 100% lines
- food 도메인: 45.45% → 100% lines
- automotive 도메인: 11.89% → 68.96% lines
- energy 도메인: 26.45% → 100% lines
- **Milestone**: Line coverage 35% 돌파, 4개 도메인 100% 커버리지 달성

## [0.1.7] - 2026-02-05

### Added
- **Test suites**: `cutting`, `bearing`, `hardness` (metal domain, 45 test cases)
- Total test count: 371 tests across 27 test files

### Changed
- Coverage improved: 18.71% → 20.74% lines (+2.03%)
- metal 도메인: 4.78% → 11.54% lines
- **Milestone**: Line coverage 20% 돌파

## [0.1.6] - 2026-02-05

### Added
- **Test suites**: `calculateUnit`, `getUnitCategories`, `getUnitsForCategory` (unit conversion, 29 test cases)
- **Test suites**: `solveAssignment` (Hungarian algorithm, 12 test cases)
- Total test count: 326 tests across 24 test files

### Changed
- Coverage improved: 15.21% → 18.71% lines (+3.5%)
- utility 도메인: 0% → 78.83% lines
- Branches coverage: 76.89% → 80.96%

## [0.1.5] - 2026-02-05

### Added
- **Test suites**: `ledResistor`, `awgProperties` (electronics domain, 33 test cases)
- **Test suites**: `calorie`, `nutrition` (food domain, 23 test cases)
- Total test count: 285 tests across 22 test files

### Changed
- Coverage improved: 12.08% → 15.21% lines
- electronics 도메인: 0% → 18.77% lines
- food 도메인: 0% → 45.45% lines

## [0.1.4] - 2026-02-05

### Added
- **Test suites**: `slope`, `earthwork` (construction domain, 27 test cases)
- **Test suites**: `powerCost`, `carbonFootprint` (energy domain, 24 test cases)
- Total test count: 229 tests across 18 test files

### Changed
- Coverage improved: 10.38% → 12.08% lines
- construction 도메인: 0% → 7.73% lines
- energy 도메인: 0% → 26.45% lines

## [0.1.3] - 2026-02-05

### Added
- **Test suites**: `dilution`, `batch` (chemical domain, 25 test cases)
- **Input validation tests**: `eoq` validation edge cases (5 test cases)
- Total test count: 178 tests across 14 test files

### Fixed
- **`eoq()` input validation**: Returns zeros for invalid inputs (negative/zero demand, cost)
- **`gearRatio()` NaN bug**: `mechanicalAdvantage` now returns 0 when `inputTorque` is 0

### Changed
- Coverage improved: 8.8% → 10.38% lines

## [0.1.2] - 2026-02-05

### Added
- **Test suites**: `eoq`, `dimWeight`, `gearRatio` (40 additional test cases)
- Total test count: 148 tests across 12 test files
- Coverage measurement infrastructure fully operational

### Fixed
- **Coverage tool version mismatch**: Downgraded `@vitest/coverage-v8` from 4.x to 3.x to match vitest 3.x

### Changed
- **Coverage thresholds**: Adjusted to realistic baseline (lines: 5%, functions: 50%, branches: 50%)
- Current coverage metrics: 8.8% lines, 62.38% functions, 72.25% branches

## [0.1.1] - 2026-02-05

### Fixed
- **Main entry point**: Added missing exports for 5 domains (metal, chemical, electronics, construction, energy)
- **`roundTo()` precision bug**: Fixed IEEE 754 floating-point rounding issues (e.g., `roundTo(0.615, 2)` now correctly returns `0.62`)
- **Massive duplicate code removal**: Consolidated `roundTo()` from 36 files to single source in `utils.ts`
  - Removed from: quality (8 files), metal (15 files), electronics (8 files), chemical (3 files)
- **README documentation**: Updated all API examples to match actual implementation

### Changed
- **BREAKING**: `GearInput` → `GearRatioInput` (automotive domain) to avoid collision with metal domain
- **BREAKING**: `GearResult` → `GearRatioResult` (automotive domain)
- **BREAKING**: `getCategories()` → `getUnitCategories()` (utility domain) to avoid collision with metal domain
- Removed `--passWithNoTests` flag from test script (tests are now mandatory)

### Added
- Input validation for `oee()`: throws error when `goodCount > totalCount`
- Input validation for `oee()`: throws error when `goodCount < 0`
- Test suites: `oee`, `cpk`, `taktTime`, `dpmo`, `mtbf`, `metalWeight`, `cbm`, `nioshLifting`, `roundTo` (108 test cases)
- NaN/Infinity handling in `roundTo()`
- Vitest coverage configuration with thresholds
- `test:coverage` npm script

## [0.1.0] - 2026-02-05

### Added

Initial release with 103 calculation functions across 11 domains.

#### Quality & Production (13 functions)
- `oee()` - Overall Equipment Effectiveness calculation
- `cpk()` - Process Capability Index
- `cycleTime()` - Cycle Time analysis
- `taktTime()` - Takt Time calculation
- `aql()` - AQL sampling inspection (ISO 2859-1)
- `downtime()` - Downtime analysis
- `dpmo()` - Defects Per Million Opportunities
- `lineBalancing()` - Line balancing optimization
- `mtbf()` - Mean Time Between Failures
- `ppk()` - Process Performance Index
- `ppm()` - Parts Per Million conversion
- `rpn()` - Risk Priority Number (FMEA)
- `yieldCalc()` - First Pass Yield / RTY

#### Metal & Machining (22 functions)
- `metalWeight()` - Weight calculation for various shapes
- `bendAllowance()` - Sheet metal bend allowance
- `flatPattern()` - Flat pattern length calculation
- `kFactorReverse()` - K-factor reverse engineering
- `pressTonnage()` - Press brake tonnage
- `bearing()` - L10 bearing life calculation
- `bolt()` - Bolt torque and preload
- `cutting()` - Cutting speed, feed rate, RPM
- `cuttingStock()` - 1D cutting optimization
- `gear()` - Gear module calculation
- `hardness()` - Hardness conversion (HRC, HB, HV)
- `material()` - Material properties lookup
- `pressFit()` - Press fit interference
- `roughness()` - Surface roughness conversion
- `screw()` - Screw specification
- `spring()` - Spring design calculation
- `tap()` - Tap drill size
- `thread()` - Thread dimensions
- `tolerance()` - ISO tolerance (IT grades)
- `vibration()` - Natural frequency analysis
- `weldHeat()` - Weld heat input calculation
- `welding()` - Welding parameters

#### Chemical & Process (7 functions)
- `batch()` - Batch scaling calculation
- `concentration()` - Concentration unit conversion
- `dilution()` - Dilution calculation (C1V1 = C2V2)
- `ph()` - pH and buffer calculations
- `reactor()` - Reactor sizing
- `shelfLife()` - Shelf life prediction (Arrhenius)
- `injectionCycle()` - Injection molding cycle time

#### Electronics & SMT (10 functions)
- `reflowProfile()` - Reflow temperature profile
- `resistorDecode()` - Resistor color code decoder
- `smtTakt()` - SMT line takt time
- `solderPaste()` - Solder paste volume calculation
- `traceWidth()` - PCB trace width (IPC-2221)
- `awgProperties()` - AWG wire properties
- `capacitorDecode()` - Capacitor code decoder
- `ledResistor()` - LED resistor calculation
- `stencilAperture()` - Stencil aperture design
- `viaCurrent()` - Via current capacity

#### Construction (11 functions)
- `beamLoad()` - Beam load calculation
- `concreteMix()` - Concrete mix ratio
- `earthwork()` - Earthwork volume
- `formwork()` - Formwork area calculation
- `rebarWeight()` - Rebar weight by size
- `slope()` - Slope conversion (%, degree, ratio)
- `aggregate()` - Aggregate volume calculation
- `brick()` - Brick quantity estimation
- `pert()` - PERT schedule analysis
- `roof()` - Roof calculation
- `stair()` - Stair dimension calculation

#### Automotive (7 functions)
- `batteryRuntime()` - Battery capacity/runtime
- `evCharging()` - EV charging time estimation
- `fuelEconomy()` - Fuel economy conversion
- `gearRatio()` - Gear ratio calculation
- `tireCompare()` - Tire size comparison
- `torque()` - Torque conversion
- `power()` - Power conversion (HP, kW)

#### Logistics & Inventory (14 functions)
- `cbm()` - Cubic meter calculation
- `containerFit()` - Container capacity estimation
- `dimWeight()` - Dimensional weight
- `eoq()` - Economic Order Quantity
- `fillRate()` - Fill rate calculation
- `freightClass()` - NMFC freight class
- `kanban()` - Kanban quantity
- `pallet3d()` - 3D pallet optimization
- `palletStack()` - Pallet stacking calculation
- `pickTime()` - Picking time estimation
- `safetyStock()` - Safety stock calculation
- `serviceLevel()` - Service level calculation
- `shipping()` - Shipping cost estimation
- `tsp()` - Traveling salesman problem

#### Energy & Utilities (6 functions)
- `carbonFootprint()` - Scope 2 emissions
- `compressedAirCost()` - Compressed air cost
- `motorEfficiency()` - Motor upgrade ROI
- `pfCorrection()` - Power factor correction
- `powerCost()` - Electricity cost with demand
- `vfdSavings()` - VFD energy savings

#### Safety & Ergonomics (6 functions)
- `fallClearance()` - Fall protection clearance
- `nioshLifting()` - NIOSH lifting equation (1991 revised)
- `noiseExposure()` - TWA/Dose calculation (OSHA)
- `wbgtCalculate()` - WBGT heat stress index
- `havsCalculate()` - Hand-arm vibration exposure
- `respiratorCalculate()` - Respirator MUC calculation

#### Food & HACCP (4 functions)
- `calorie()` - Calorie requirement (BMR/TDEE)
- `expiry()` - Expiry date calculation
- `nutrition()` - Nutrition facts calculation
- `haccp()` - HACCP checklist generation

#### Utility (3 functions)
- `solveAssignment()` - Hungarian algorithm optimization
- `calculateUnit()` - Unit conversion
- `getUnitCategories()` - Get unit categories

### Technical Features
- Zero dependencies
- Full TypeScript support with detailed type definitions
- Tree-shakeable ESM exports
- Subpath exports for each domain (`formulab/quality`, `formulab/metal`, etc.)
- Node.js 18+ support
