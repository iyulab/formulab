# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
