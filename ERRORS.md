# Error Behavior Specification

This document defines formulab's error handling policy and documents the error behavior of each function.

## Error Policy (v0.9.0+)

### Principles

1. **Validation failures → throw `RangeError`**: Invalid inputs that violate physical or mathematical constraints (negative lengths, zero denominators, out-of-range values) throw a `RangeError` with a descriptive message.

2. **No silent NaN/Infinity**: Functions should not return `NaN` or `Infinity` in output fields. If a calculation cannot produce a meaningful result, the function should throw.

3. **Predictable error contract**: Every public function documents its error behavior via `@throws` JSDoc tags.

4. **No non-finite input (0.58.0)**: Every public function refuses NaN and ±Infinity anywhere in its argument — nested objects and arrays included — with `RangeError('<fn>: <path> must be a finite number (got NaN)')`, before any other check. A guard written `x <= 0` lets NaN through, and until 0.58.0 99 functions turned it into `null` outputs beside a confident verdict (an arc-flash study with no incident energy that still named PPE category 4). The rows below list each function's own conditions; this one applies to all of them and is not repeated. `pnpm check:nonfinite-inputs` (CI) enforces it by execution. Type guards (`is…Input`) check shape only and still return `true` for a NaN field — the function they guard refuses it.

5. **Refusals carry their facts as data (0.62.0)**: a guard that checks one input against its bounds throws a `RangeError` (same prototype, same message) that also carries, as non-enumerable properties like `message`, `code`, `parameter`, the bound (`min` / `max` closed, `exclusive_min` / `exclusive_max` open) and `got`, the value given. A consumer translates the code and points at the input instead of showing or parsing the English sentence. The codes are one small vocabulary, shared with the @iyulab calculation engines: `parameter_out_of_range`, `value_not_finite` (principle 4), `empty_input`, and `insufficient_data` (`min` = the least count, `got` = the count given). `parameter` is the input's name as the message states it; a value derived from several inputs is not reported as one the caller gave. Guards that are not of that shape — an unknown table key, a condition over several inputs, a check on one item inside a list — throw a `RangeError` without them; `pnpm check:coded-refusals` (CI) keeps their number from growing.

### Current Status

All 15 domains were audited against source on 2026-07-13, and again on 2026-09-09 — the second
time **by execution rather than by reading**. The difference matters: the 2026-07-13 pass read the
sources and cleared them, but an execution audit that fed every function a degenerate value for each
of its numeric inputs and checked every output field for finiteness found **44 non-finite outputs
across 24 functions** still standing. Reading a guard is not the same as watching one hold, and a
function that already throws somewhere reads as guarded while an unguarded second parameter sits
beside it (`gearRatio()` validated the driving gear and not the driven one). Those 24 are fixed as
of 0.38.0. That audit only degenerated top-level numeric fields and found fixtures for part of the
library; a wider pass that also degenerates values nested in objects and arrays (a cargo dimension,
a box weight, one failure time) and harvests fixtures for 203 of 207 functions found 17 more
functions still emitting `NaN`/`Infinity`, two of them only exposed once the first guards were in
place. Those are guarded in the next release, and the audit now reports exactly the two documented
sentinels below — `respiratorCalculate()` and `nioshLifting()`.

Most functions follow the policy above. Two classes of deviation exist:

1. **No zero-valued sentinels (0.56.0).** Until 0.55.0 much of logistics/energy/food/quality returned a zeroed result where the input was invalid, empty, or left an output undefined — a payback of «0 months», a Cpk of 0 for a process that does not vary, an all-«C» ABC table. Those were finite, so the NaN/Infinity guarantee held, but each 0 read as an answer. As of 0.56.0 invalid and empty input throws, and an output with no value for valid input is `null`. A 0 that remains is a computed answer (a box that fits 0 times, a turnover of 0 when nothing sells).
2. **Contract restoration (2026-07).** Ten construction/electronics/environmental functions had documented `throw` rows that the source did not implement — degenerate inputs could emit `NaN`/`Infinity` or an uncontrolled `TypeError` (`rebarWeight`, `concreteMix`, `brick`, `stair`, `resistorDecode`, `traceWidth`, `energyIntensity`, `productCarbonFootprint`, `vocEmissions`, `waterFootprint`). Their validation now matches the rows below; the valid-but-degenerate cases (all-zero footprints/stages) report their shares as `null` since 0.56.0.

**Exception — `respiratorCalculate()`.** When `concentration` is 0 (no hazard present),
`safetyMargin` is `Infinity`. This is an intentional sentinel meaning "any respirator is infinitely
adequate", documented in the function's `@remarks`, and the function validates its inputs
(`oel > 0`, `concentration >= 0`) in the ordinary way. It is exempt from the "no Infinity in output
fields" rule; an execution-based NaN audit must allowlist it.

**Capability-index family (0.56.0).** `cpk()`, `ppk()` and `cmk()` used to return an all-zero result for a degenerate spread, which read as «incapable» — the opposite of a process that does not vary. They now throw for invalid input (negative σ, crossed limits, fewer than 2 measurements for `cmk()`) and return the indices as `null` at σ = 0.

## Error Patterns by Domain

### Legend

| Symbol | Meaning |
|--------|---------|
| `throw` | Throws `RangeError` |
| `null` | Returns `null` for optional/unavailable fields |
| `safe` | No error edge cases; all inputs produce valid outputs |

### Quality (21 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `oee()` | `throw` | plannedTime, runTime, idealCycleTime or totalCount ≤ 0; runTime > plannedTime; goodCount < 0 or > totalCount |
| `cpk()` | `throw` | usl ≤ lsl; a limit or the mean not finite; stdDev < 0 or not finite. stdDev = 0 → cp/cpk/cpu/cpl/sigmaLevel null (they divide by σ); withinSpecPercent 100 or 0 |
| `controlChart()` | `throw` | Empty data, subgroup size < 2 |
| `acceptanceControlChart()` | `throw` | no spec limit; sigma ≤ 0; proportions outside (0, 1) or rejectable ≤ acceptable; alpha/beta outside (0, 1) |
| `cycleTime()` | `throw` | empty measurements; a measurement ≤ 0 (NaN included) |
| `taktTime()` | `throw` | availableTime or demand ≤ 0 or non-finite |
| `aql()` | `throw` | lotSize ≤ 0; negative aqlLevel → '-' zero-plan result (does not throw) |
| `actionPriority()` | `throw` | severity/occurrence/detection outside 1–10 or non-finite |
| `cpkToOccurrence()` | `throw` | cpk negative or non-finite |
| `nelsonRules()` | `throw` | empty values, sigma ≤ 0, non-finite centerLine |
| `downtime()` | `throw` | any input < 0 |
| `dpmo()` | `throw` | defects < 0, units ≤ 0, opportunities ≤ 0, defects > units × opportunities |
| `lineBalancing()` | `throw` | Empty tasks, cycleTime ≤ 0, a task time ≤ 0 or > cycleTime (infeasible), a repeated task id, a predecessor that names no task (it looped until memory ran out before 0.58.0), circular dependency |
| `mtbf()` | `throw` | totalOperatingTime ≤ 0, numberOfFailures ≤ 0 |
| `ppk()` | `throw` | as `cpk()` (same arithmetic, long-term σ); with `data`, fewer than 2 readings (`empty_input` / `insufficient_data`) |
| `ppm()` | `throw` | defectRate outside [0, 100], ppm outside [0, 1,000,000], sigma outside [0, 6] (previously clamped silently) |
| `rpn()` | `safe` | — |
| `yieldCalc()` | `throw` | no steps; a step with total ≤ 0, good < 0, or good > total |
| `gageRR()` | `throw` | Empty or ragged measurements; a tolerance given and ≤ 0 (read as «no tolerance» before 0.59.0); Average-Range: a study outside the AIAG constant tables (2–3 trials, 2–3 operators, 2–10 parts — it used the 3/3/10 constants silently before 0.58.0); `method: 'anova'`: fewer than 2 parts, 2 operators, or 2 trials |
| `cmk()` | `throw` | fewer than 2 measurements; a measurement not finite; usl ≤ lsl. Identical measurements (σ = 0) → cm/cmk/isCapable null |
| `weibull()` | `throw` | < 2 failure times, a failure time ≤ 0, all failure times identical, missionTime < 0 |
| `paretoAnalysis()` | `throw` | Empty items, an item value < 0 |

### Metal (33 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `metalWeight()` | `throw` | Unknown materialName or shape (an unknown material returned an empty weight before 0.58.0), non-positive dimensions, innerDiameter < 0, outerDiameter ≤ innerDiameter, angle thickness > width or height |
| `bendAllowance()` | `throw` | unknown material with no kFactor (reported as a kFactor out of range before 0.58.0); thickness ≤ 0; insideRadius < 0; bendAngle not in (0, 180]; kFactor outside [0, 1]. At a closed hem (180°) `outsideSetback` and `bendDeduction` are `null` (the setback diverges; the bend allowance is defined). A radius below the minimum and an angle above 170° still return with `warnings` |
| `springback()` | `throw` | thickness ≤ 0, bendRadius ≤ 0, bendAngle outside (0, 180); material `'custom'` with missing/non-positive yieldStrength or elasticModulus; x = Y·R_i/(E·T) ≥ 0.5 (fully elastic bend — no permanent set; the unguarded cubic returned Infinity at x = 0.5 and negative springback past x ≈ 0.87) |
| `flatPattern()` | `throw` | shapeType not lShape/uShape (an unknown one was bent as a U before 0.58.0); unknown material with no kFactor; the `bendAllowance()` bend domain; flangeA or flangeB ≤ 0; flangeC ≤ 0 for a U-shape; resulting flatLength ≤ 0 (flanges shorter than the bend setbacks) |
| `kFactorReverse()` | `throw` | thickness ≤ 0; bendAngle not in (0, 180); insideRadius < 0; measurements that imply a K-factor outside [0, 1] (the flat length does not belong to this bend) |
| `pressTonnage()` | `throw` | thickness, dieOpening, strengths, safetyFactor, frictionCoefficient, dieRadius ≤ 0; blankHolderPressure/blankDiameter < 0; drawRatio given and ≤ 0; blanking/bending/drawing without its positive perimeter/bendLength/punchDiameter (combined: < 0); blank diameter ≤ punch diameter; combined without operations |
| `bearing()` | `throw` | dynamicLoadRating ≤ 0, equivalentLoad ≤ 0, rpm ≤ 0 |
| `bolt()` | `throw` | diameter/pitch/kFactor/tensileStrength ≤ 0; torque ≤ 0 (torqueToPreload) or preload ≤ 0 (preloadToTorque) |
| `cutting()` | `throw` | cuttingSpeed or toolDiameter ≤ 0; a feed/depth/width/teeth field the operation reads given and ≤ 0 |
| `cuttingStock()` | `throw` | stockLength ≤ 0, kerf < 0, empty pieces, piece length ≤ 0, a piece quantity that is not a whole number > 0 (0 and negatives were dropped and 2.5 cut as 3 before 0.58.0), piece length > stockLength |
| `gear()` | `throw` | fromModule: module or teethGear1 missing or ≤ 0, a given teethGear2 ≤ 0; fromPitchDiameter: pitchDiameter or numberOfTeeth missing or ≤ 0; any tooth count ≤ 2.5 (no root circle) |
| `hardness()` | `safe` | Out-of-range value clamps to the boundary table row, disclosed via `outOfTableRange: true` |
| `material()` | `throw` | Unknown grade |
| `pressFit()` | `throw` | shaftDiameter/holeDiameter/hubOuterDiameter/contactLength/youngsModulus/frictionCoefficient ≤ 0; hubOuterDiameter ≤ max(shaftDiameter, holeDiameter) (no hub wall). Clearance fit (shaft ≤ hole) → interference ≤ 0 with zero pressure/forces |
| `roughness()` | `throw` | value ≤ 0 |
| `screw()` | `throw` | Unknown designation |
| `spring()` | `throw` | wireDiameter/meanCoilDiameter/activeCoils ≤ 0 |
| `tap()` | `throw` | majorDiameter ≤ 0, pitch ≤ 0; threadPercentage not in (0, 100]; a pitch so coarse that the minor diameter is not positive (p ≥ D / 1.0825); a threadPercentage that leaves no hole (≥ 100·D / 1.299p) |
| `thread()` | `throw` | Unknown size |
| `tolerance()` | `throw` | Nominal size out of range, unknown IT grade, unknown deviation letter |
| `vibration()` | `throw` | Non-positive system/geometry field (k, m, length, width, height, diameter, outer/inner diameter, disk mass/radius); custom youngsModulus/density/shearModulus ≤ 0; innerDiameter ≥ outerDiameter |
| `weldHeat()` | `throw` | voltage ≤ 0, current ≤ 0, travelSpeed ≤ 0, thickness ≤ 0 |
| `welding()` | `throw` | thickness ≤ 0 |
| `weldStrength()` | `throw` | legSize ≤ 0, weldLength ≤ 0, weldCount < 1, appliedLoad < 0 |
| `materialGradeConverter()` | `null` | Unknown grade returns null equivalents |
| `pipeSpec()` | `throw` | Unknown size/schedule |
| `flangeSpec()` | `throw` | Unknown size/class |
| `getMetricSizes()` | `safe` | — (returns metric thread size keys) |
| `getUnifiedSizes()` | `safe` | — (returns unified thread size keys) |
| `getStandardPitch()` | `safe` | Unknown diameter returns a computed fallback |
| `getKFactor()` | `safe` | Unknown condition returns default 0.20 |
| `getDesignations()` | `safe` | — (returns screw designation keys) |
| `getCategories()` | `safe` | — (returns material category keys) |
| `getGrades()` | `safe` | Unknown category returns [] |

### Chemical (12 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `batch()` | `throw` | originalBatchSize ≤ 0 or non-finite; targetBatchSize < 0 or non-finite; ingredient amount < 0 |
| `concentration()` | `throw` | unknown fromUnit, value < 0, molecularWeight/solutionDensity ≤ 0, more than 100 wt% solute (wt% > 100, ppm > 10⁶, or a molarity implying it) |
| `dilution()` | `throw` | any of the three given values ≤ 0 |
| `heatTransfer()` | `throw` | conductivity ≤ 0, area ≤ 0, thickness ≤ 0, coefficient ≤ 0, emissivity out of range, absolute temp ≤ 0 |
| `ph()` | `throw` | concentrations ≤ 0 or NaN |
| `pipeFlow()` | `throw` | diameter ≤ 0, flowRate ≤ 0 |
| `reactor()` | `throw` | diameter ≤ 0, cylindrical height ≤ 0, fillRatio outside (0, 1] |
| `shelfLife()` | `throw` | shelfLifeAtRef ≤ 0, q10 ≤ 0 |
| `injectionCycle()` | `throw` | wallThickness ≤ 0; shotWeight ≤ 0 (a shot of 0 g gave a parts-per-hour rate before 0.58.0); moldOpenCloseTime/ejectionTime < 0; resin density ≤ 0, injectionRate ≤ 0 (when given); thermalDiffusivity ≤ 0; ejectionTemp ≤ moldTemp; (8/π²)·(Tm − Tw)/(Te − Tw) ≤ 1 — the melt too close to the ejection temperature for the cooling-time model |
| `flowControl()` | `throw` | flowRate ≤ 0, inletPressure ≤ 0, outletPressure < 0 (absolute) or ≥ inletPressure (no pressure drop across the valve), fluidDensity ≤ 0; gas: molecularWeight ≤ 0 (when given), temperature ≤ −273.15 °C |
| `reliefValve()` | `throw` | requiredCapacity ≤ 0, setPressure ≤ 0, molecularWeight ≤ 0, specificGravity ≤ 0, specificHeatRatio ≤ 1 or compressibility ≤ 0; overpressure < 0; temperature ≤ −273.15 °C (any fluid since 0.59.0 — liquid sizing does not read it, but a value below absolute zero describes nothing); liquid with back pressure at or above the relieving pressure (no differential — it returned requiredArea 0 and the smallest orifice before 0.57.0) |
| `pid()` | `throw` | A parameter the method needs missing (it was replaced by 1 before 0.58.0) or not > 0 (NaN included): processGain/deadTime/timeConstant, or ultimateGain/ultimatePeriod |

### Electronics (12 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `ohmsLaw()` | `throw` | Negative values |
| `reflowProfile()` | `throw` | A paste type that is not one of `getPasteTypes()` |
| `reflowNominalCurve()` | `throw` | A paste type that is not one of `getPasteTypes()` (RangeError); windows that admit no curve of this shape (Error — a table defect) |
| `getPasteTypes()` | `safe` | — (returns paste-type list) |
| `resistorDecode()` | `throw` | Unknown color in any band position, gold/silver as a digit, bandCount not 4/5/6, missing bands |
| `smtTakt()` | `throw` | placementRate ≤ 0, componentsPerBoard ≤ 0, boardsPerPanel ≤ 0, setupTimeSec < 0, availableTimeMin < 0 |
| `solderPaste()` | `throw` | any input ≤ 0 |
| `traceWidth()` | `throw` | current ≤ 0, tempRise ≤ 0, copperWeight ≤ 0 |
| `awgProperties()` | `throw` | AWG not between 0 and 40 |
| `capacitorDecode()` | `throw` | Invalid code format, multiplier digit 7 (unassigned) |
| `ledResistor()` | `throw` | forwardVoltage ≥ supplyVoltage |
| `stencilAperture()` | `throw` | Dimensions ≤ 0 |
| `viaCurrent()` | `throw` | Dimensions ≤ 0 |

### Construction (15 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `momentOfInertia()` | `throw` | Non-positive dimensions |
| `beamLoad()` | `throw` | span ≤ 0 |
| `concreteMix()` | `throw` | Unknown grade, volume ≤ 0 |
| `earthwork()` | `throw` | Non-positive length/width/depth or non-positive swell/shrink factor |
| `formwork()` | `throw` | Non-positive used dimension (per element type) or non-positive quantity |
| `rebarWeight()` | `throw` | Unknown size, length ≤ 0, quantity ≤ 0 |
| `getRebarUnitWeight()` | `throw` | A size not in the table (an inherited key such as `'toString'` included) |
| `getAggregateDensity()` | `throw`/`null` | type not in the table; `'custom'` → null (no table density — the caller supplies it) |
| `aggregateCoverage()` | `throw` | volumeM3 ≤ 0, depthCm ≤ 0 |
| `slope()` | `throw` | value not finite; ratio ≤ 0 (vertical/undefined; percent/degrees 0 is legit flat and returns `ratio: null` — flat ground has no 1:N form); degrees not in (−90, 90) |
| `aggregate()` | `throw` | Non-positive dimensions, unknown type |
| `brick()` | `throw` | wallArea ≤ 0, unknown brick size, custom dimensions ≤ 0, mortarThickness < 0, wasteFactor < 0 |
| `pert()` | `throw` | Empty tasks, a repeated task id, a predecessor that names no task (it was dropped silently before 0.58.0), an estimate < 0, estimates not ordered optimistic ≤ mostLikely ≤ pessimistic, deadline < 0, circular dependencies |
| `roof()` | `throw` | run ≤ 0, rise < 0, footprintLength/footprintWidth ≤ 0 |
| `stair()` | `throw` | totalRise ≤ 0, totalRun ≤ 0, riserHeight < 0 (riserHeight 0 = auto-calculate) |

### Automotive (9 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `brakingDistance()` | `throw` | speed ≤ 0, friction ≤ 0 |
| `batteryRuntime()` | `throw` | capacityAh/voltageV/loadW ≤ 0, efficiency outside (0, 1] |
| `evCharging()` | `throw` | batteryCapacityKwh ≤ 0, socEndPercent ≤ socStartPercent, chargerPowerKw ≤ 0, efficiency ≤ 0 |
| `fuelEconomy()` | `throw` | value ≤ 0 |
| `gearRatio()` | `throw` | drivingTeeth/drivenTeeth ≤ 0, efficiency outside (0, 1]. Signed speed/torque is direction |
| `tireCompare()` | `throw` | width/aspect/rim ≤ 0, loadIndex outside 60–130 |
| `torque()` | `safe` | — |
| `power()` | `safe` | — |
| `chargingLoss()` | `throw` | batteryCapacity or chargerPower ≤ 0; soc or targetSoc outside [0, 100]; targetSoc ≤ soc (nothing to charge); chargerEfficiency or batteryEfficiency outside (0, 1] |

### Battery (10 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `energyDensity()` | `throw` | capacityAh/nominalVoltage ≤ 0; massKg/volumeL given and ≤ 0. Omitted mass/volume → null density |
| `cRate()` | `throw` | capacityAh ≤ 0, currentA ≤ 0, cRate ≤ 0 |
| `stateOfHealth()` | `throw` | ratedCapacityAh ≤ 0, measuredCapacityAh < 0 |
| `batteryPackConfig()` | `throw` | cellVoltage ≤ 0 |
| `cycleLife()` | `throw` | Unknown chemistry; depthOfDischarge ≤ 0, > 100 or non-finite |
| `internalResistance()` | `throw` | openCircuitVoltage/loadVoltage < 0, loadVoltage > openCircuitVoltage (a negative resistance), loadCurrentA ≤ 0 |
| `selfDischarge()` | `throw` | initialVoltage/finalVoltage/nominalVoltage/days ≤ 0, finalVoltage > initialVoltage (a negative discharge rate), limitMvPerDay given and ≤ 0 |
| `thermalRunaway()` | `throw` | internalResistanceOhm < 0, heatTransferCoeff/surfaceAreaM2 ≤ 0. A negative currentA (charging) is valid — heat is I²R |
| `bmsBalancing()` | `throw` | cellVoltages missing or fewer than 2 cells (nothing to balance; a missing list was a TypeError before 0.58.0), any cell voltage ≤ 0, balancingCurrentMA/cellCapacityAh ≤ 0 |
| `chargingProfile()` | `throw` | capacity, charging current or cutoff current ≤ 0; cutoff current ≥ charging current; CC end SOC outside (0, 100) |

### Machining (12 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `truePosition()` | `throw` | A non-finite coordinate; negative or non-finite tolerance, featureSize or mmcSize. Negative coordinates are valid (measured from a datum) |
| `boltCircle()` | `throw` | diameter ≤ 0, holes ≤ 0 |
| `sineBarHeight()` | `throw` | sineBarLength ≤ 0; angle not in [0, 90]; roundToBlock given and ≤ 0; roundToBlock rounds the stack beyond the bar length |
| `radialChipThinning()` | `throw` | toolDiameter ≤ 0, radialDepthOfCut outside (0, toolDiameter), chipLoadTarget ≤ 0 |
| `toolDeflection()` | `throw` | toolDiameter ≤ 0, stickout ≤ 0, cuttingForce < 0, Young's modulus ≤ 0 |
| `cuspHeight()` | `throw` | toolDiameter ≤ 0 |
| `effectiveDiameter()` | `throw` | Invalid depth |
| `boringBarDeflection()` | `throw` | barDiameter ≤ 0, overhang ≤ 0, cuttingForce < 0 |
| `threadOverWires()` | `throw` | majorDiameter, pitch or a given wireSize ≤ 0 or non-finite; threadAngle not 60/55/29/30; pitch so coarse the pitch diameter is not positive (60°: P ≥ d / 0.6495; 29°/30°: P ≥ 2d) |
| `gaugeBlockStack()` | `throw` | targetDimension ≤ 0 or non-finite, or above the sum of every block in the set. A target inside that range the set cannot build exactly returns the closest stack with `error` > 0 |
| `triangleSolver()` | `throw` | Invalid triangle (negative sides, sum ≥ 180°) |
| `cycleTimeEstimator()` | `throw` | operation distance or time < 0, setupTime < 0, partCount < 0, cutting move with a distance or feedRate whose feedRate is missing or ≤ 0, rapid move with rapidRate ≤ 0. Empty operations throw. Operations adding up to no time → `utilization` null |

### Safety (14 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `arcFlash()` | `throw` | voltage/boltedFaultCurrent/workingDistance/faultClearingTime/gapBetweenConductors ≤ 0; voltage outside 208–15 000 V, boltedFaultCurrent outside 0.7–106 kA, gapBetweenConductors outside 13–152 mm (IEEE 1584-2002 model range); `mcc`/`panel` above 1 kV (no Table 4 distance exponent) |
| `confinedSpace()` | `throw` | oxygenPercent outside 0–100, or any gas reading (lelPercent, h2sPpm, coPpm, customGas) negative; customGas pel/idlh ≤ 0. A reading of 0 is a valid measurement and does not throw. |
| `ergonomicRisk()` | `throw` | load < 0 (joint angles may be negative and are not checked) |
| `fallClearance()` | `throw` | dRingHeight ≤ 0, or lanyardLength/decelerationDistance/harnessStretch/safetyFactor/workingHeight/obstacleHeight negative (NaN included). A negative anchorAboveFeet (anchor below the feet) is valid geometry and is reported through the free-fall warning. Without workingHeight, `clearanceAboveObstacle` and `isAdequate` are `null` (not computable), not a throw. |
| `havsCalculate()` | `throw` | a tool has negative vibrationMagnitude/exposureTime (empty/all-zero tool list is valid) |
| `illuminance()` | `throw` | roomLength/roomWidth/lumensPerLuminaire/targetLux ≤ 0, workplaneHeight < 0, or luminaireHeight ≤ workplaneHeight |
| `ladderAngle()` | `throw` | provided height/baseDistance negative; ladderLength ≤ 0 when used as a given (height & baseDistance not both supplied); ladderLength shorter than the given height or baseDistance (equal returns a 90°/0° result with `warnings`) |
| `lel()` | `throw` | empty gas list; a gas component has negative (or NaN) concentration or non-positive LEL. All concentrations 0 → 0 % LEL, 'safe', mixtureLel and safetyMargin null (no mixture composition) |
| `nioshLifting()` | `throw` | any distance/angle/frequency/loadWeight negative (NaN included). RWL=0 (sustained high-frequency lifting) → liftingIndex=Infinity, an intentional sentinel. |
| `noiseExposure()` | `throw` | an exposure entry has negative duration (empty list is valid → compliant) |
| `respiratorCalculate()` | `throw` | oel ≤ 0, or concentration < 0. concentration=0 (no hazard) → safetyMargin=Infinity, an intentional sentinel. |
| `thermalComfort()` | `throw` | relativeHumidity outside 0–100, metabolicRate ≤ 0, clothingInsulation < 0, airVelocity < 0 (temperatures may be negative °C) |
| `ventilationRate()` | `throw` | non-positive room dimensions/occupants; custom space type without positive customAch |
| `wbgtCalculate()` | `safe` | all inputs (incl. negative °C) produce a valid index |

**Sentinel exceptions (intentional `Infinity`).** `respiratorCalculate()` returns `safetyMargin = Infinity` when `concentration = 0` (no hazard → any respirator is infinitely adequate), and `nioshLifting()` returns `liftingIndex = Infinity` when the frequency multiplier drives `RWL` to 0 (no weight is acceptable). Both arise from **valid** inputs and are tested: the quantity is genuinely unbounded there, not undefined.

### Logistics (17 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `abcAnalysis()` | `throw` | empty items; an item's annualUsage or unitCost < 0; every item's annual value 0 (no share to classify by) |
| `cbm()` | `throw` | length, width, height or quantity ≤ 0 |
| `chargeableWeight()` | `throw` | volume ≤ 0, actualWeight < 0, unknown mode |
| `containerFit()` | `throw` | cargo or container dimension ≤ 0; cargo weight, maxPayload or maxStackWeight < 0; maxLayers not a whole number ≥ 1 (`parameter_out_of_range`). A box larger than the container in every orientation fits 0 times, and a weight limit below one unit loads 0 — real answers (`limitedBy` says which), not sentinels |
| `getContainerSpec()` | `throw` | unknown container type |
| `eoq()` | `throw` | annualDemand, orderCost or holdingCost ≤ 0 (NaN included) |
| `eoqCostCurve()` | `throw` | an `eoq()` input invalid, minQuantity ≤ 0, maxQuantity ≤ minQuantity, points not a whole number ≥ 2 |
| `inventoryTurnover()` | `throw` | periodDays ≤ 0; cogs or averageInventory < 0. averageInventory 0 → turnoverRatio and gmroii null (0 days of supply); cogs 0 → daysOfSupply/weeksOfSupply null (the stock never runs out); gmroii null when grossMargin omitted |
| `loadCapacity()` | `throw`/`null` | ratedCapacity, ratedLoadCenter or actualLoadCenter ≤ 0; attachmentWeightLoss or actualLoad < 0; utilization/isOverloaded/safetyMargin = null when actualLoad omitted |
| `pallet3d()` | `throw` | box weight/length/width/height ≤ 0; given customLength/customWidth ≤ 0; maxStackHeight or maxPayload < 0 (0 = default); empty boxes |
| `palletStack()` | `throw` | box dimension, pallet length or width, or maxHeight ≤ 0; boxWeight, maxWeight, deckHeight or palletWeight < 0 (`parameter_out_of_range`). A box exceeding the pallet or maxHeight in every orientation stacks 0 boxes — a real answer, not a sentinel |
| `safetyStock()` | `throw` | serviceLevel ∉ (0, 1); avgLeadTime, avgDemand, demandStdDev or leadTimeStdDev < 0 |
| `safetyStockSimulation()` | `throw` | serviceLevel ∉ (0, 1); avgDemand or avgLeadTime ≤ 0; a standard deviation < 0; iterations not a whole number in [100, 100000]; bins not a whole number ≥ 1; unknown demandDistribution |
| `shipping()` | `throw` | weight ≤ 0, volume ≤ 0, distance ≤ 0 or missing (truck mode), unknown mode |
| `tsp()` | `throw` | Empty nodes (a single node returns a single-node result, does not throw) |
| `dimWeight()` | `throw` | length/width/height ≤ 0, actualWeight < 0 |
| `fillRate()` | `throw` | totalOrders ≤ 0 |
| `serviceLevel()` | `throw` | safetyStock or demandStdDev < 0 (demandStdDev = 0 → the σ → 0 limits: serviceLevel 100 with a safety stock, 50 without; zScore null with a safety stock — it is unbounded — and 0 without) |
| `freightClass()` | `throw` | weight/length/width/height ≤ 0 |
| `kanban()` | `throw` | dailyDemand, leadTime or containerQuantity ≤ 0; safetyFactor < 0 (NaN included) |
| `pickTime()` | `throw` | speed or itemsPerOrder ≤ 0; distance, searchTimePerItem, pickTimePerItem or documentationTime < 0 |

### Energy (15 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `powerCost()` | `throw` | powerFactor or pfPenaltyThreshold ∉ [0, 1]; energyConsumption, energyRate, demandPeak, demandRate, pfPenaltyRate or fixedCharges < 0 |
| `boilerEfficiency()` | `throw` | fuelRate or fuelHeatValue ≤ 0; steamOutput, steamEnthalpy, feedwaterEnthalpy, operatingHours or fuelCost < 0; steamEnthalpy < feedwaterEnthalpy; a heat output above the fuel heat input (efficiency above 100 %) (annual fields null without operatingHours/fuelCost) |
| `carbonFootprint()` | `throw` | electricityUsage or emissionFactor < 0 |
| `cusum()` | `throw` | empty values; a given allowance < 0 or decisionInterval ≤ 0; a given stdDev ≤ 0; σ needed (allowance or decisionInterval omitted) but not estimable — fewer than 2 values or all equal (σ = 1 was substituted before 0.56.0) |
| `heatPump()` | `throw` | compressorPower ≤ 0; heatingCapacity, auxiliaryPower, operatingHours, electricityRate or fuelCost < 0; boilerEfficiency ∉ (0, 1] (annual fields null when omitted; sink not warmer than source → copCarnot/efficiency null) |
| `ledRoi()` | `throw` | fixtureCount, operatingHours, oldWatts or newWatts ≤ 0 (an old fixture drawing 0 W gave a 0 % reduction beside added use before 0.58.0; a replacement drawing 0 W a 100 % saving before 0.59.0); electricityRate, fixtureCost, installationCost or co2Factor < 0 (paybackPeriod null when totalInvestment or annualCostSaved ≤ 0) |
| `pfCorrection()` | `throw` | currentPf/targetPf ∉ (0, 1]; pfPenaltyThreshold ∉ [0, 1]; kW, electricityRate, monthlyUsageHours, pfPenaltyRate or capacitorCostPerKvar < 0 (monthlySavings ≤ 0 → paybackMonths null) |
| `transformerLoss()` | `throw` | ratedCapacity ≤ 0; loadFraction or powerFactor ∉ [0, 1]; coreLoss, copperLoss, operatingHours or energyCost < 0 (annual fields null without operatingHours/energyCost) |
| `vfdSavings()` | `throw` | motorKw or fullSpeedRpm ≤ 0; loadFactor or vfdEfficiency ∉ (0, 1]; newSpeedRpm, runningHoursPerYear, electricityRate or vfdCost < 0 (annualSavings ≤ 0 → paybackYears null) |
| `windOutput()` | `throw` | hubHeight, referenceHeight or ratedSpeed ≤ 0; ratedPower, averageWindSpeed, cutInSpeed, cutOutSpeed, rotorDiameter or terrainRoughness < 0 (sweptArea/betzLimit null without rotorDiameter; zero wind → capacityFactor 0) |
| `compressedAirCost()` | `throw` | compressorPower/runningHours/airOutput ≤ 0; electricityRate or maintenanceCost < 0 |
| `insulationRoi()` | `throw` | surfaceArea/tempDifference/insulationK/insulationThickness/surfaceCoefficient ≤ 0; boilerEfficiency ∉ (0, 1]; operatingHours, energyCost or installationCost < 0 (paybackPeriod null without positive installationCost/annualCostSaved) |
| `degreeDay()` | `throw` | Empty dailyTemps |
| `motorEfficiency()` | `throw` | currentEfficiency/newEfficiency ∉ (0, 1]; loadFactor ∉ [0, 1]; motorPower, runningHours, electricityRate or upgradeCost < 0 (paybackPeriod null without positive upgradeCost/annualSavings) |
| `solarOutput()` | `throw` | panelWattage/panelCount/peakSunHours ≤ 0, systemEfficiency outside (0, 1], tiltAngle outside [0, 90], latitude outside [-90, 90] |

### Food (7 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `calorie()` | `throw` | weightKg/heightCm/age ≤ 0 (NaN included) |
| `expiry()` | `throw` | shelfLifeDays < 0 (calculateExpiry); expiryDate before productionDate (calculateRemaining). A 0-day shelf life is used up on production day → percentUsed 100; percentUsed is clamped to 0–100 (isExpired and remainingDays carry the overrun) |
| `getCategories()` | `safe` | — (returns static category list) |
| `haccp()` | `throw` | A category that is not one of `getHaccpCategories()` |
| `nutrition()` | `throw` | servingSize ≤ 0; ingredient amountG or nutrient value < 0; ingredients adding up to 0 g (none, or all 0) |
| `stabilityStudy()` | `throw` | shelfLifeCriterion ≤ 0; storageTemp or a data point temperature ≤ −273.15 °C; fewer than 2 temperatures with a rising degradation; an extrapolation that is not representable. Equal rates at every temperature → Ea 0 and r2 null |
| `waterActivity()` | `throw` | aw outside [0, 1] |

### IE (5 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `learningCurve()` | `throw` | firstUnitTime ≤ 0; learningRate outside (0, 1); unitNumber < 1 or non-integer (non-finite values rejected) |
| `standardTime()` | `throw` | observedTime ≤ 0; ratingFactor outside (0, 2]; allowancePercent outside [0, 100] (non-finite values rejected) |
| `timeStudy()` | `throw` | Fewer than 2 observations or any ≤ 0; confidence outside (0, 1); accuracy ≤ 0 |
| `vaAnalysis()` | `throw` | Empty activities; any duration < 0 or non-finite |
| `workSampling()` | `throw` | totalObservations ≤ 0; activityObservations < 0 or > total; confidence outside (0, 1); accuracy ≤ 0 |

### Environmental (10 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `scope1Emissions()` | `throw` | quantity < 0 |
| `scope2Emissions()` | `throw` | electricityKwh < 0; a given customFactor/supplierFactor/residualMixFactor < 0; region 'custom' without customFactor; market-based requested with contractedKwh negative; contractedKwh>0 and no supplierFactor; contractedKwh > electricityKwh; uncontracted remainder > 0 with no residualMixFactor |
| `getGridEmissionFactor()` | `throw` | region not in the grid table (incl. `'custom'`) |
| `scope3Emissions()` | `throw` | spendUsd < 0 |
| `gwpCalculator()` | `throw` | quantityKg < 0 |
| `esgSummary()` | `throw` | baselineCo2Tonnes ≤ 0; currentCo2Tonnes or targetCo2Tonnes < 0; baselineYear, currentYear or targetYear ≤ 0; currentYear before baselineYear. currentYear = baselineYear → annualRatePercent/projectedCo2Tonnes null; target year reached → requiredAnnualRate null (projection null once past it); onTrack null when the target is unmet and there is no trend |
| `emissionsIntensity()` | `throw` | totalCo2Kg < 0, or a given productionUnits/revenueUsd/employees < 0 (a zero denominator leaves its field `undefined`) |
| `energyIntensity()` | `throw` | totalEnergyMJ < 0, productionUnits ≤ 0 (mjPerRevenue `undefined` unless revenueUsd > 0) |
| `productCarbonFootprint()` | `throw` | Empty stages, productionQuantity ≤ 0 or NaN. Negative stages (recycling credits) valid; total ≤ 0 → stage percents null |
| `vocEmissions()` | `throw` | totalVocKg < 0, efficiency outside [0, 1]. totalVocKg = 0 → reductionPercent is the abatement efficiency (capture × destruction) |
| `waterFootprint()` | `throw` | Any water volume < 0. All-zero footprint → percents null; perUnitM3 `undefined` unless productionUnits > 0 |

### Utility (18 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `solveAssignment()` | `throw` | Empty matrix |
| `bilinearInterpolation()` | `throw` | x or y length < 2, z row/column count mismatch |
| `calculateUnit()` | `throw` | Unknown category/fromUnit/toUnit |
| `getUnitCategories()` | `safe` | — |
| `getUnitsForCategory()` | `safe` | Unknown category returns [] |
| `correlation()` | `throw` | Missing/mismatched x·y, fewer than 2 points; zero variance (constant x or y) → `r`/`r2` null |
| `depreciation()` | `throw` | assetCost ≤ 0, salvageValue < 0 or ≥ assetCost, usefulLife ≤ 0, unknown method |
| `histogram()` | `throw` | Empty data, resolved bins < 1, a `normal` distribution whose `stdDev` is not greater than 0 |
| `lcc()` | `throw` | initialCost < 0, lifespan ≤ 0, discountRate outside [0, 1) |
| `linearInterpolation()` | `throw` | Missing/mismatched x·y, fewer than 2 points |
| `movingAverage()` | `throw` | Empty data, window < 1 or > data length, unknown method |
| `normalize()` | `throw` | Empty data, unknown method |
| `npv()` | `throw` | initialInvestment < 0, empty cashFlows, discountRate outside [0, 1); `irr: null` on non-convergence (intentional); `profitabilityIndex: null` with no initial investment |
| `percentile()` | `throw` | Empty data, p outside 0–100 |
| `regression()` | `throw` | Missing/mismatched x·y, fewer than 2 points, zero variance in x |
| `roi()` | `throw` | investment/annualReturn/years ≤ 0 |
| `statistics()` | `throw` | Empty data (sampleVariance/sampleStdDev are `undefined` when n < 2) |
| `weightedScore()` | `throw` | Missing/empty/mismatched arrays, a weight < 0, weight sum 0 |

As of v0.13.0 all utility functions follow the standard `throw` pattern — the former `Result | null` signatures (16 functions: assignment, bilinearInterpolation, correlation, depreciation, histogram, lcc, linearInterpolation, movingAverage, normalize, npv, percentile, regression, roi, statistics, unit, weightedScore) were migrated to `RangeError` throws with descriptive messages. One deliberate `null` remains: `NpvResult.irr: number | null` models IRR non-convergence, which is a domain answer rather than an invalid input.

**`correlation()` and constant data (0.56.0).** For valid input where one variable has zero variance, the Pearson denominator is 0 and the correlation is undefined: `r` and `r2` are `null`. The former `r = 0` read as «no linear correlation», which constant data does not show either way.

## Consumer Guidance

Most functions follow the same error pattern: invalid inputs throw `RangeError`, and an output that has no value for valid input (constant data, a zero spread) is `null` — never a 0 that reads as an answer.

```typescript
import { cRate } from 'formulab/battery';

try {
  const result = cRate(input);
  // All values guaranteed finite
} catch (e) {
  if (e instanceof RangeError) {
    // Invalid input — e.message describes the violated constraint
  }
}
```
