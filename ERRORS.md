# Error Behavior Specification

This document defines formulab's error handling policy and documents the error behavior of each function.

## Error Policy (v0.9.0+)

### Principles

1. **Validation failures → throw `RangeError`**: Invalid inputs that violate physical or mathematical constraints (negative lengths, zero denominators, out-of-range values) throw a `RangeError` with a descriptive message.

2. **No silent NaN/Infinity**: Functions should not return `NaN` or `Infinity` in output fields. If a calculation cannot produce a meaningful result, the function should throw.

3. **Predictable error contract**: Every public function documents its error behavior via `@throws` JSDoc tags.

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

1. **Zero-valued sentinels instead of throws (legacy, intentional-leaning).** Much of logistics/energy/food returns a zeroed result for non-positive inputs rather than throwing (marked "sentinel" in the Conditions column below). All sentinel outputs are finite, so the "no silent NaN/Infinity" guarantee holds; migrating them to throws would be a breaking change and is treated as a product decision, not a defect.
2. **Contract restoration (2026-07).** Ten construction/electronics/environmental functions had documented `throw` rows that the source did not implement — degenerate inputs could emit `NaN`/`Infinity` or an uncontrolled `TypeError` (`rebarWeight`, `concreteMix`, `brick`, `stair`, `resistorDecode`, `traceWidth`, `energyIntensity`, `productCarbonFootprint`, `vocEmissions`, `waterFootprint`). Their validation now matches the rows below; valid-but-degenerate cases (all-zero footprints/stages, zero VOC total) return finite 0-sentinels per the established sentinel pattern.

**Exception — `respiratorCalculate()`.** When `concentration` is 0 (no hazard present),
`safetyMargin` is `Infinity`. This is an intentional sentinel meaning "any respirator is infinitely
adequate", documented in the function's `@remarks`, and the function validates its inputs
(`oel > 0`, `concentration >= 0`) in the ordinary way. It is exempt from the "no Infinity in output
fields" rule; an execution-based NaN audit must allowlist it.

**Exception — capability-index family.** `cpk()`, `ppk()`, and `cmk()` do **not** throw on a degenerate spread (`stdDev ≤ 0`, or empty/constant measurements for `cmk()`). They return a **zero-valued result** as a sentinel instead. This is intentional and covered by tests. The "no silent NaN/Infinity" guarantee still holds (0 is finite), but these three are exempt from the "validation failures → throw" rule.

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
| `cpk()` | `safe` | stdDev ≤ 0 → returns zero-valued result (all indices = 0); does not throw |
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
| `lineBalancing()` | `throw` | Empty tasks, cycleTime ≤ 0, a task time ≤ 0 or > cycleTime (infeasible), circular dependency |
| `mtbf()` | `throw` | totalOperatingTime ≤ 0, numberOfFailures ≤ 0 |
| `ppk()` | `safe` | stdDev ≤ 0 → returns zero-valued result (all indices = 0); does not throw |
| `ppm()` | `throw` | defectRate outside [0, 100], ppm outside [0, 1,000,000], sigma outside [0, 6] (previously clamped silently) |
| `rpn()` | `safe` | — |
| `yieldCalc()` | `throw` | no steps; a step with total ≤ 0, good < 0, or good > total |
| `gageRR()` | `throw` | Insufficient data; `method: 'anova'` also throws for fewer than 2 parts, 2 operators, or 2 trials |
| `cmk()` | `safe` | empty measurements or computed stdDev ≤ 0 → returns zero-valued result; does not throw |
| `weibull()` | `throw` | < 2 failure times, a failure time ≤ 0, all failure times identical, missionTime < 0 |
| `paretoAnalysis()` | `throw` | Empty items, an item value < 0 |

### Metal (33 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `metalWeight()` | `throw` | Non-positive dimensions, innerDiameter < 0, outerDiameter ≤ innerDiameter, angle thickness > width or height |
| `bendAllowance()` | `throw` | thickness ≤ 0; insideRadius < 0; bendAngle not in (0, 180]; kFactor outside [0, 1]. At a closed hem (180°) `outsideSetback` and `bendDeduction` are `null` (the setback diverges; the bend allowance is defined). A radius below the minimum and an angle above 170° still return with `warnings` |
| `springback()` | `throw` | thickness ≤ 0, bendRadius ≤ 0, bendAngle outside (0, 180); material `'custom'` with missing/non-positive yieldStrength or elasticModulus; x = Y·R_i/(E·T) ≥ 0.5 (fully elastic bend — no permanent set; the unguarded cubic returned Infinity at x = 0.5 and negative springback past x ≈ 0.87, ISSUE-20260714) |
| `flatPattern()` | `throw` | the `bendAllowance()` bend domain; flangeA or flangeB ≤ 0; flangeC ≤ 0 for a U-shape; resulting flatLength ≤ 0 (flanges shorter than the bend setbacks) |
| `kFactorReverse()` | `throw` | thickness ≤ 0; bendAngle not in (0, 180); insideRadius < 0; measurements that imply a K-factor outside [0, 1] (the flat length does not belong to this bend) |
| `pressTonnage()` | `throw` | thickness, dieOpening, strengths, safetyFactor, frictionCoefficient, dieRadius ≤ 0; blankHolderPressure/blankDiameter < 0; drawRatio given and ≤ 0; blanking/bending/drawing without its positive perimeter/bendLength/punchDiameter (combined: < 0); blank diameter ≤ punch diameter; combined without operations |
| `bearing()` | `throw` | dynamicLoadRating ≤ 0, equivalentLoad ≤ 0, rpm ≤ 0 |
| `bolt()` | `throw` | diameter/pitch/kFactor/tensileStrength ≤ 0; torque ≤ 0 (torqueToPreload) or preload ≤ 0 (preloadToTorque) |
| `cutting()` | `throw` | cuttingSpeed or toolDiameter ≤ 0; a feed/depth/width/teeth field the operation reads given and ≤ 0 |
| `cuttingStock()` | `throw` | stockLength ≤ 0, kerf < 0, empty pieces, piece length ≤ 0, total quantity 0, piece length > stockLength |
| `gear()` | `safe` | Missing/invalid required fields per mode → empty sentinel result; does not throw |
| `hardness()` | `safe` | Out-of-range value clamps to the boundary table row, disclosed via `outOfTableRange: true` |
| `material()` | `throw` | Unknown grade |
| `pressFit()` | `throw` | shaftDiameter/holeDiameter/hubOuterDiameter/contactLength/youngsModulus/frictionCoefficient ≤ 0; hubOuterDiameter ≤ max(shaftDiameter, holeDiameter) (no hub wall). Clearance fit (shaft ≤ hole) → interference ≤ 0 with zero pressure/forces |
| `roughness()` | `throw` | value ≤ 0 |
| `screw()` | `throw` | Unknown designation |
| `spring()` | `throw` | wireDiameter/meanCoilDiameter/activeCoils ≤ 0 |
| `tap()` | `throw` | majorDiameter ≤ 0, pitch ≤ 0; threadPercentage not in (0, 100]; a pitch so coarse that the minor diameter is not positive (p ≥ D / 1.0825) |
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
| `concentration()` | `throw` | unknown fromUnit, value < 0, molecularWeight/solutionDensity ≤ 0 |
| `dilution()` | `throw` | any of the three given values ≤ 0 |
| `heatTransfer()` | `throw` | conductivity ≤ 0, area ≤ 0, thickness ≤ 0, coefficient ≤ 0, emissivity out of range, absolute temp ≤ 0 |
| `ph()` | `throw` | concentrations ≤ 0 or NaN |
| `pipeFlow()` | `throw` | diameter ≤ 0, flowRate ≤ 0 |
| `reactor()` | `throw` | diameter ≤ 0, cylindrical height ≤ 0, fillRatio outside (0, 1] |
| `shelfLife()` | `throw` | shelfLifeAtRef ≤ 0, q10 ≤ 0 |
| `injectionCycle()` | `throw` | wallThickness ≤ 0; shotWeight/moldOpenCloseTime/ejectionTime < 0; resin density ≤ 0, injectionRate ≤ 0 (when given); thermalDiffusivity ≤ 0; ejectionTemp ≤ moldTemp; (8/π²)·(Tm − Tw)/(Te − Tw) ≤ 1 — the melt too close to the ejection temperature for the cooling-time model |
| `flowControl()` | `throw` | flowRate < 0, inletPressure ≤ 0, outletPressure ≥ inletPressure (no pressure drop across the valve), fluidDensity ≤ 0; gas: molecularWeight ≤ 0 (when given), temperature ≤ −273.15 °C |
| `reliefValve()` | `throw` | requiredCapacity ≤ 0, molecularWeight ≤ 0, specificGravity ≤ 0, specificHeatRatio ≤ 1 or compressibility ≤ 0. Liquid with back pressure at or above the relieving pressure → requiredArea 0 |
| `pid()` | `throw` | Non-positive process params (processGain/deadTime/timeConstant ≤ 0, or ultimateGain/ultimatePeriod ≤ 0) |

### Electronics (12 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `ohmsLaw()` | `throw` | Negative values |
| `reflowProfile()` | `null` | Unknown paste type → returns `undefined` (whole result) |
| `getPasteTypes()` | `safe` | — (returns paste-type list) |
| `resistorDecode()` | `throw` | Unknown color in any band position, gold/silver as a digit, bandCount not 4/5/6, missing bands |
| `smtTakt()` | `throw` | placementRate ≤ 0, componentsPerBoard ≤ 0, boardsPerPanel ≤ 0, setupTimeSec < 0, availableTimeMin < 0 |
| `solderPaste()` | `throw` | any input ≤ 0 |
| `traceWidth()` | `throw` | current ≤ 0, tempRise ≤ 0, copperWeight ≤ 0 |
| `awgProperties()` | `throw` | AWG not between 0 and 40 |
| `capacitorDecode()` | `throw` | Invalid code format |
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
| `getRebarUnitWeight()` | `null` | Unknown size returns `undefined` (plain lookup) |
| `getAggregateDensity()` | `safe` | Unknown type returns 0 sentinel |
| `aggregateCoverage()` | `throw` | volumeM3 ≤ 0, depthCm ≤ 0 |
| `slope()` | `throw` | value not finite; ratio ≤ 0 (vertical/undefined; percent/degrees 0 is legit flat and returns `ratio: null` — flat ground has no 1:N form); degrees not in (−90, 90) |
| `aggregate()` | `throw` | Non-positive dimensions, unknown type |
| `brick()` | `throw` | wallArea ≤ 0, unknown brick size, custom dimensions ≤ 0, mortarThickness < 0, wasteFactor < 0 |
| `pert()` | `throw` | Empty tasks, an estimate < 0, estimates not ordered optimistic ≤ mostLikely ≤ pessimistic, deadline < 0, circular dependencies |
| `roof()` | `throw` | run ≤ 0, rise < 0, footprintLength/footprintWidth ≤ 0 |
| `stair()` | `throw` | totalRise ≤ 0, totalRun < 0, riserHeight < 0 (riserHeight 0 = auto-calculate) |

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
| `selfDischarge()` | `throw` | initialVoltage/finalVoltage/nominalVoltage/days ≤ 0, finalVoltage > initialVoltage (a negative discharge rate) |
| `thermalRunaway()` | `throw` | internalResistanceOhm < 0, heatTransferCoeff/surfaceAreaM2 ≤ 0. A negative currentA (charging) is valid — heat is I²R |
| `bmsBalancing()` | `throw` | Empty cellVoltages, any cell voltage ≤ 0, balancingCurrentMA/cellCapacityAh ≤ 0 |
| `chargingProfile()` | `throw` | capacity ≤ 0 |

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
| `illuminance()` | `throw` | roomLength/roomWidth/lumensPerLuminaire/targetLux ≤ 0, or luminaireHeight ≤ workplaneHeight |
| `ladderAngle()` | `throw` | provided height/baseDistance negative; ladderLength ≤ 0 when used as a given (height & baseDistance not both supplied); ladderLength shorter than the given height or baseDistance (equal returns a 90°/0° result with `warnings`) |
| `lel()` | `throw` | a gas component has negative (or NaN) concentration or non-positive LEL (empty gas list is valid → 'safe') |
| `nioshLifting()` | `throw` | any distance/angle/frequency/loadWeight negative (NaN included). RWL=0 (sustained high-frequency lifting) → liftingIndex=Infinity, an intentional sentinel. |
| `noiseExposure()` | `throw` | an exposure entry has negative duration (empty list is valid → compliant) |
| `respiratorCalculate()` | `throw` | oel ≤ 0, or concentration < 0. concentration=0 (no hazard) → safetyMargin=Infinity, an intentional sentinel. |
| `thermalComfort()` | `throw` | relativeHumidity outside 0–100, metabolicRate ≤ 0, clothingInsulation < 0, airVelocity < 0 (temperatures may be negative °C) |
| `ventilationRate()` | `throw` | non-positive room dimensions/occupants; custom space type without positive customAch |
| `wbgtCalculate()` | `safe` | all inputs (incl. negative °C) produce a valid index |

**Sentinel exceptions (intentional `Infinity`).** `respiratorCalculate()` returns `safetyMargin = Infinity` when `concentration = 0` (no hazard → any respirator is infinitely adequate), and `nioshLifting()` returns `liftingIndex = Infinity` when the frequency multiplier drives `RWL` to 0 (no weight is acceptable). Both arise from **valid** inputs and are tested, analogous to the capability-index zero-sentinel exception above.

### Logistics (17 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `abcAnalysis()` | `throw` | empty items; an item's annualUsage or unitCost < 0; every item's annual value 0 (no share to classify by) |
| `cbm()` | `throw` | length, width, height or quantity ≤ 0 |
| `containerFit()` | `throw` | cargo dimension ≤ 0. Box larger than container in every orientation → zero-fit result (sentinel) |
| `eoq()` | `safe` | annualDemand/orderCost/holdingCost ≤ 0 → all-zero result (sentinel; does not throw) |
| `inventoryTurnover()` | `throw` | periodDays ≤ 0; cogs or averageInventory < 0. averageInventory 0 → turnoverRatio and gmroii null (0 days of supply); cogs 0 → daysOfSupply/weeksOfSupply null (the stock never runs out); gmroii null when grossMargin omitted |
| `loadCapacity()` | `throw`/`null` | ratedCapacity, ratedLoadCenter or actualLoadCenter ≤ 0; attachmentWeightLoss or actualLoad < 0; utilization/isOverloaded/safetyMargin = null when actualLoad omitted |
| `pallet3d()` | `throw` | box weight/length/width/height ≤ 0; given customLength/customWidth ≤ 0; maxStackHeight or maxPayload < 0 (0 = default); empty boxes |
| `palletStack()` | `throw` | box dimension ≤ 0. Box exceeds pallet/maxHeight in all orientations → zero result (sentinel) |
| `safetyStock()` | `throw` | serviceLevel ∉ (0, 1); avgLeadTime, avgDemand, demandStdDev or leadTimeStdDev < 0 |
| `shipping()` | `throw` | weight ≤ 0, volume ≤ 0, distance ≤ 0 or missing (truck mode), unknown mode |
| `tsp()` | `throw` | Empty nodes (a single node returns a single-node result, does not throw) |
| `dimWeight()` | `throw` | length/width/height ≤ 0, actualWeight < 0 |
| `fillRate()` | `throw` | totalOrders ≤ 0 |
| `serviceLevel()` | `throw` | safetyStock or demandStdDev < 0 (demandStdDev = 0 → zScore 0; serviceLevel 100 if safetyStock > 0, else 50) |
| `freightClass()` | `throw` | weight/length/width/height ≤ 0 |
| `kanban()` | `throw` | dailyDemand/leadTime/containerQuantity ≤ 0 (safetyFactor < 0 → all-zero sentinel, does not throw) |
| `pickTime()` | `throw` | speed or itemsPerOrder ≤ 0; distance, searchTimePerItem, pickTimePerItem or documentationTime < 0 |

### Energy (15 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `powerCost()` | `throw` | powerFactor or pfPenaltyThreshold ∉ [0, 1]; energyConsumption, energyRate, demandPeak, demandRate, pfPenaltyRate or fixedCharges < 0 |
| `boilerEfficiency()` | `throw` | fuelRate or fuelHeatValue ≤ 0; steamOutput, steamEnthalpy, feedwaterEnthalpy, operatingHours or fuelCost < 0; steamEnthalpy < feedwaterEnthalpy; a heat output above the fuel heat input (efficiency above 100 %) (annual fields null without operatingHours/fuelCost) |
| `carbonFootprint()` | `throw` | electricityUsage or emissionFactor < 0 |
| `cusum()` | `safe` | Empty values → empty arrays, shiftDetected 'none' (sentinel) |
| `heatPump()` | `throw` | compressorPower ≤ 0; heatingCapacity, auxiliaryPower, operatingHours, electricityRate or fuelCost < 0; boilerEfficiency ∉ (0, 1] (annual fields null when omitted; sink not warmer than source → copCarnot/efficiency null) |
| `ledRoi()` | `throw` | fixtureCount or operatingHours ≤ 0; oldWatts, newWatts, electricityRate, fixtureCost, installationCost or co2Factor < 0 (paybackPeriod null when totalInvestment or annualCostSaved ≤ 0) |
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
| `expiry()` | `throw` | shelfLifeDays < 0 (calculateExpiry). shelfLifeDays or totalShelfLife = 0 → percentUsed 100 (sentinel; percentUsed clamped 0–100) |
| `getCategories()` | `safe` | — (returns static category list) |
| `haccp()` | `null` | Unknown category → null |
| `nutrition()` | `throw` | servingSize ≤ 0; ingredient amountG or nutrient value < 0. Empty ingredients (total weight 0) → all per-serving values 0 (sentinel) |
| `stabilityStudy()` | `safe` | Fewer than 2 usable temperature groups → default result (Ea 0, q10 1, shelf life 0) (sentinel) |
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
| `scope3Emissions()` | `throw` | spendUsd < 0 |
| `gwpCalculator()` | `throw` | quantityKg < 0 |
| `esgSummary()` | `throw` | baselineCo2Tonnes ≤ 0; currentCo2Tonnes or targetCo2Tonnes < 0; baselineYear, currentYear or targetYear ≤ 0; currentYear before baselineYear. currentYear = baselineYear → annualRatePercent/projectedCo2Tonnes null; target year reached → requiredAnnualRate null (projection null once past it); onTrack null when the target is unmet and there is no trend |
| `emissionsIntensity()` | `throw` | totalCo2Kg < 0, or a given productionUnits/revenueUsd/employees < 0 (a zero denominator leaves its field `undefined`) |
| `energyIntensity()` | `throw` | totalEnergyMJ < 0, productionUnits ≤ 0 (mjPerRevenue `undefined` unless revenueUsd > 0) |
| `productCarbonFootprint()` | `throw` | Empty stages, productionQuantity ≤ 0 or NaN. Negative stages (recycling credits) valid; total ≤ 0 → stage percents 0 (sentinel) |
| `vocEmissions()` | `throw` | totalVocKg < 0, efficiency outside [0, 1]. totalVocKg = 0 → reductionPercent 0 (sentinel) |
| `waterFootprint()` | `throw` | Any water volume < 0. All-zero footprint → percents 0 (sentinel); perUnitM3 `undefined` unless productionUnits > 0 |

### Utility (18 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `solveAssignment()` | `throw` | Empty matrix |
| `bilinearInterpolation()` | `throw` | x or y length < 2, z row/column count mismatch |
| `calculateUnit()` | `throw` | Unknown category/fromUnit/toUnit |
| `getUnitCategories()` | `safe` | — |
| `getUnitsForCategory()` | `safe` | Unknown category returns [] |
| `correlation()` | `throw` | Missing/mismatched x·y, fewer than 2 points; zero variance → `{ r: 0, r2: 0, n }` sentinel (see Exception below) |
| `depreciation()` | `throw` | assetCost ≤ 0, salvageValue < 0 or ≥ assetCost, usefulLife ≤ 0, unknown method |
| `histogram()` | `throw` | Empty data, resolved bins < 1 |
| `lcc()` | `throw` | initialCost < 0, lifespan ≤ 0, discountRate outside [0, 1) |
| `linearInterpolation()` | `throw` | Missing/mismatched x·y, fewer than 2 points |
| `movingAverage()` | `throw` | Empty data, window < 1 or > data length, unknown method |
| `normalize()` | `throw` | Empty data, unknown method |
| `npv()` | `throw` | initialInvestment < 0, empty cashFlows, discountRate outside [0, 1); `irr: null` on non-convergence (intentional) |
| `percentile()` | `throw` | Empty data, p outside 0–100 |
| `regression()` | `throw` | Missing/mismatched x·y, fewer than 2 points, zero variance in x |
| `roi()` | `throw` | investment/annualReturn/years ≤ 0 |
| `statistics()` | `throw` | Empty data (sampleVariance/sampleStdDev are `undefined` when n < 2) |
| `weightedScore()` | `throw` | Missing/empty/mismatched arrays, a weight < 0, weight sum 0 |

As of v0.13.0 all utility functions follow the standard `throw` pattern — the former `Result | null` signatures (16 functions: assignment, bilinearInterpolation, correlation, depreciation, histogram, lcc, linearInterpolation, movingAverage, normalize, npv, percentile, regression, roi, statistics, unit, weightedScore) were migrated to `RangeError` throws with descriptive messages. One deliberate `null` remains: `NpvResult.irr: number | null` models IRR non-convergence, which is a domain answer rather than an invalid input.

**Exception — `correlation()` zero-variance sentinel.** `correlation()` throws `RangeError` for genuinely invalid input (mismatched lengths, fewer than 2 points), but for **valid** input where one variable has zero variance (constant data, so the Pearson denominator `√(ΣΔx²·ΣΔy²) = 0`) it returns `{ r: 0, r2: 0, n }` rather than throwing or emitting `NaN`. This is the same "valid-but-degenerate → finite sentinel" pattern as the capability-index family: constant data has an undefined correlation, and `r = 0` is reported as the finite sentinel. (Note: `r = 0` reads as "no linear correlation"; whether that is the ideal representation of "undefined" is a product question, not an error-handling one.)

## Consumer Guidance

Most functions follow the same error pattern: invalid inputs throw `RangeError`. The exceptions are the capability-index family (`cpk()`, `ppk()`, `cmk()`), which returns a zero-valued result for a degenerate spread instead of throwing, and `correlation()`, which returns `r = 0` for zero-variance (constant) data — both are valid-but-degenerate sentinels (see Exception notes above).

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
