# Error Behavior Specification

This document defines formulab's error handling policy and documents the error behavior of each function.

## Error Policy (v0.9.0+)

### Principles

1. **Validation failures → throw `RangeError`**: Invalid inputs that violate physical or mathematical constraints (negative lengths, zero denominators, out-of-range values) throw a `RangeError` with a descriptive message.

2. **No silent NaN/Infinity**: Functions should not return `NaN` or `Infinity` in output fields. If a calculation cannot produce a meaningful result, the function should throw.

3. **Predictable error contract**: Every public function documents its error behavior via `@throws` JSDoc tags.

### Current Status

All 15 domains were fully audited against source on 2026-07-13. Most functions follow the policy above. Two classes of deviation exist:

1. **Zero-valued sentinels instead of throws (legacy, intentional-leaning).** Much of logistics/energy/food returns a zeroed result for non-positive inputs rather than throwing (marked "sentinel" in the Conditions column below). All sentinel outputs are finite, so the "no silent NaN/Infinity" guarantee holds; migrating them to throws would be a breaking change and is treated as a product decision, not a defect.
2. **Contract restoration (2026-07).** Ten construction/electronics/environmental functions had documented `throw` rows that the source did not implement — degenerate inputs could emit `NaN`/`Infinity` or an uncontrolled `TypeError` (`rebarWeight`, `concreteMix`, `brick`, `stair`, `resistorDecode`, `traceWidth`, `energyIntensity`, `productCarbonFootprint`, `vocEmissions`, `waterFootprint`). Their validation now matches the rows below; valid-but-degenerate cases (all-zero footprints/stages, zero VOC total) return finite 0-sentinels per the established sentinel pattern.

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
| `oee()` | `throw` | goodCount > totalCount, goodCount < 0, plannedTime ≤ 0 |
| `cpk()` | `safe` | stdDev ≤ 0 → returns zero-valued result (all indices = 0); does not throw |
| `controlChart()` | `throw` | Empty data, subgroup size < 2 |
| `cycleTime()` | `safe` | — |
| `taktTime()` | `throw` | demand = 0 |
| `aql()` | `throw` | lotSize ≤ 0; negative aqlLevel → '-' zero-plan result (does not throw) |
| `actionPriority()` | `throw` | severity/occurrence/detection outside 1–10 or non-finite |
| `cpkToOccurrence()` | `throw` | cpk negative or non-finite |
| `nelsonRules()` | `throw` | empty values, sigma ≤ 0, non-finite centerLine |
| `downtime()` | `safe` | — |
| `dpmo()` | `throw` | units ≤ 0, opportunities ≤ 0 |
| `lineBalancing()` | `throw` | Empty tasks, cycleTime ≤ 0, a task time > cycleTime (infeasible), circular dependency |
| `mtbf()` | `throw` | totalOperatingTime ≤ 0, numberOfFailures ≤ 0 |
| `ppk()` | `safe` | stdDev ≤ 0 → returns zero-valued result (all indices = 0); does not throw |
| `ppm()` | `throw` | defectRate outside [0, 100], ppm outside [0, 1,000,000], sigma outside [0, 6] (previously clamped silently) |
| `rpn()` | `safe` | — |
| `yieldCalc()` | `safe` | — |
| `gageRR()` | `throw` | Insufficient data |
| `cmk()` | `safe` | empty measurements or computed stdDev ≤ 0 → returns zero-valued result; does not throw |
| `weibull()` | `throw` | < 3 data points |
| `paretoAnalysis()` | `throw` | Empty items |

### Metal (33 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `metalWeight()` | `throw` | Non-positive dimensions, outerDiameter ≤ innerDiameter |
| `bendAllowance()` | `safe` | — (out-of-range inputs produce warning strings, not throws) |
| `springback()` | `throw` | thickness ≤ 0, bendRadius ≤ 0, bendAngle outside (0, 180); material `'custom'` with missing/non-positive yieldStrength or elasticModulus |
| `flatPattern()` | `safe` | — (no input validation) |
| `kFactorReverse()` | `safe` | — (no input validation) |
| `pressTonnage()` | `throw` | Missing operation-specific fields |
| `bearing()` | `throw` | dynamicLoadRating ≤ 0, equivalentLoad ≤ 0, rpm ≤ 0 |
| `bolt()` | `throw` | diameter/pitch/kFactor/tensileStrength ≤ 0; torque ≤ 0 (torqueToPreload) or preload ≤ 0 (preloadToTorque) |
| `cutting()` | `throw` | toolDiameter ≤ 0 |
| `cuttingStock()` | `throw` | stockLength ≤ 0, empty pieces, total quantity 0, piece length > stockLength |
| `gear()` | `safe` | Missing/invalid required fields per mode → empty sentinel result; does not throw |
| `hardness()` | `safe` | Out-of-range value clamps to the boundary table row, disclosed via `outOfTableRange: true` |
| `material()` | `throw` | Unknown grade |
| `pressFit()` | `throw` | shaftDiameter/holeDiameter/hubOuterDiameter/contactLength ≤ 0 |
| `roughness()` | `throw` | value ≤ 0 |
| `screw()` | `throw` | Unknown designation |
| `spring()` | `throw` | wireDiameter/meanCoilDiameter/activeCoils ≤ 0 |
| `tap()` | `throw` | majorDiameter ≤ 0, pitch ≤ 0 |
| `thread()` | `throw` | Unknown size |
| `tolerance()` | `throw` | Nominal size out of range, unknown IT grade, unknown deviation letter |
| `vibration()` | `throw` | Non-positive system/geometry field (k, m, length, width, height, diameter, outer/inner diameter, disk mass/radius); innerDiameter ≥ outerDiameter |
| `weldHeat()` | `throw` | voltage ≤ 0, current ≤ 0, travelSpeed ≤ 0, thickness ≤ 0 |
| `welding()` | `throw` | thickness ≤ 0 |
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
| `batch()` | `throw` | batchSize ≤ 0 |
| `concentration()` | `throw` | molecularWeight ≤ 0 |
| `dilution()` | `throw` | Division by zero (denominator value = 0) |
| `heatTransfer()` | `throw` | conductivity ≤ 0, area ≤ 0, thickness ≤ 0, coefficient ≤ 0, emissivity out of range, absolute temp ≤ 0 |
| `ph()` | `throw` | concentrations ≤ 0 |
| `pipeFlow()` | `throw` | diameter ≤ 0, flowRate ≤ 0 |
| `reactor()` | `throw` | diameter ≤ 0 |
| `shelfLife()` | `throw` | Invalid temperatures |
| `injectionCycle()` | `throw` | Invalid resin parameters |
| `flowControl()` | `throw` | pressureDrop ≤ 0 |
| `reliefValve()` | `throw` | Capacity ≤ 0 |
| `pid()` | `throw` | Non-positive process params (processGain/deadTime/timeConstant ≤ 0, or ultimateGain/ultimatePeriod ≤ 0) |

### Electronics (12 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `ohmsLaw()` | `throw` | Negative values |
| `reflowProfile()` | `null` | Unknown paste type → returns `undefined` (whole result) |
| `getPasteTypes()` | `safe` | — (returns paste-type list) |
| `resistorDecode()` | `throw` | Unknown color in any band position, gold/silver as a digit, bandCount not 4/5/6, missing bands |
| `smtTakt()` | `throw` | placementRate ≤ 0, componentsPerBoard ≤ 0 |
| `solderPaste()` | `throw` | padCount ≤ 0, stencilThickness ≤ 0 |
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
| `rebarWeight()` | `throw` | Unknown size |
| `getRebarUnitWeight()` | `null` | Unknown size returns `undefined` (plain lookup) |
| `getAggregateDensity()` | `safe` | Unknown type returns 0 sentinel |
| `aggregateCoverage()` | `throw` | volumeM3 ≤ 0, depthCm ≤ 0 |
| `slope()` | `throw` | ratio ≤ 0 (vertical/undefined; percent/degrees 0 is legit flat) |
| `aggregate()` | `throw` | Non-positive dimensions, unknown type |
| `brick()` | `throw` | wallArea ≤ 0, unknown brick size, custom dimensions ≤ 0, mortarThickness < 0 |
| `pert()` | `throw` | Empty tasks, circular dependencies |
| `roof()` | `throw` | run = 0 |
| `stair()` | `throw` | totalRise ≤ 0, totalRun < 0, riserHeight < 0 (riserHeight 0 = auto-calculate) |

### Automotive (9 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `brakingDistance()` | `throw` | speed ≤ 0, friction ≤ 0 |
| `batteryRuntime()` | `throw` | capacityAh ≤ 0, voltageV ≤ 0, loadW ≤ 0 |
| `evCharging()` | `throw` | socEndPercent ≤ socStartPercent, chargerPowerKw ≤ 0 |
| `fuelEconomy()` | `throw` | value ≤ 0 |
| `gearRatio()` | `throw` | drivingTeeth ≤ 0 |
| `tireCompare()` | `throw` | Invalid tire format |
| `torque()` | `safe` | — |
| `power()` | `safe` | — |
| `chargingLoss()` | `throw` | energyInput ≤ 0 |

### Battery (10 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `energyDensity()` | `null` | Missing mass → null gravimetric |
| `cRate()` | `throw` | capacityAh ≤ 0, currentA ≤ 0, cRate ≤ 0 |
| `stateOfHealth()` | `throw` | ratedCapacity ≤ 0 |
| `batteryPackConfig()` | `throw` | cellVoltage ≤ 0 |
| `cycleLife()` | `throw` | Unknown chemistry |
| `internalResistance()` | `throw` | loadCurrent = 0 |
| `selfDischarge()` | `throw` | days ≤ 0 |
| `thermalRunaway()` | `throw` | surfaceArea ≤ 0 |
| `bmsBalancing()` | `throw` | Empty cellVoltages |
| `chargingProfile()` | `throw` | capacity ≤ 0 |

### Machining (12 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `truePosition()` | `throw` | Negative coordinates |
| `boltCircle()` | `throw` | diameter ≤ 0, holes ≤ 0 |
| `sineBarHeight()` | `throw` | angle out of range |
| `radialChipThinning()` | `throw` | toolDiameter ≤ 0 |
| `toolDeflection()` | `throw` | toolDiameter ≤ 0, stickout ≤ 0, cuttingForce < 0 |
| `cuspHeight()` | `throw` | toolDiameter ≤ 0 |
| `effectiveDiameter()` | `throw` | Invalid depth |
| `boringBarDeflection()` | `throw` | barDiameter ≤ 0, overhang ≤ 0, cuttingForce < 0 |
| `threadOverWires()` | `throw` | Invalid thread parameters |
| `gaugeBlockStack()` | `throw` | Target out of range |
| `triangleSolver()` | `throw` | Invalid triangle (negative sides, sum ≥ 180°) |
| `cycleTimeEstimator()` | `throw` | Empty operations |

### Safety (14 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `arcFlash()` | `throw` | voltage/boltedFaultCurrent/workingDistance/faultClearingTime/gapBetweenConductors ≤ 0 |
| `confinedSpace()` | `throw` | oxygenPercent outside 0–100, or any gas reading (lelPercent, h2sPpm, coPpm, customGas) negative; customGas pel/idlh ≤ 0. A reading of 0 is a valid measurement and does not throw. |
| `ergonomicRisk()` | `throw` | load < 0 (joint angles may be negative and are not checked) |
| `fallClearance()` | `throw` | workerHeight ≤ 0, or any distance negative. anchorHeight ≤ 0 is a valid (inadequate) geometry → isAdequate=false, does not throw. |
| `havsCalculate()` | `throw` | a tool has negative vibrationMagnitude/exposureTime (empty/all-zero tool list is valid) |
| `illuminance()` | `throw` | roomLength/roomWidth/lumensPerLuminaire/targetLux ≤ 0, or luminaireHeight ≤ workplaneHeight |
| `ladderAngle()` | `throw` | provided height/baseDistance negative; ladderLength ≤ 0 when used as a given (height & baseDistance not both supplied) |
| `lel()` | `throw` | a gas component has negative concentration or non-positive LEL (empty gas list is valid → 'safe') |
| `nioshLifting()` | `throw` | any distance/angle/frequency/loadWeight negative. RWL=0 (sustained high-frequency lifting) → liftingIndex=Infinity, an intentional sentinel. |
| `noiseExposure()` | `throw` | an exposure entry has negative duration (empty list is valid → compliant) |
| `respiratorCalculate()` | `throw` | oel ≤ 0, or concentration < 0. concentration=0 (no hazard) → safetyMargin=Infinity, an intentional sentinel. |
| `thermalComfort()` | `throw` | relativeHumidity outside 0–100, metabolicRate ≤ 0, clothingInsulation < 0, airVelocity < 0 (temperatures may be negative °C) |
| `ventilationRate()` | `throw` | non-positive room dimensions/occupants; custom space type without positive customAch |
| `wbgtCalculate()` | `safe` | all inputs (incl. negative °C) produce a valid index |

**Sentinel exceptions (intentional `Infinity`).** `respiratorCalculate()` returns `safetyMargin = Infinity` when `concentration = 0` (no hazard → any respirator is infinitely adequate), and `nioshLifting()` returns `liftingIndex = Infinity` when the frequency multiplier drives `RWL` to 0 (no weight is acceptable). Both arise from **valid** inputs and are tested, analogous to the capability-index zero-sentinel exception above.

### Logistics (17 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `abcAnalysis()` | `safe` | totalValue or totalItems = 0 → all items class 'C' with zeroed values (sentinel; does not throw) |
| `cbm()` | `safe` | — |
| `containerFit()` | `safe` | Box larger than container in every orientation → zero-fit result (sentinel) |
| `eoq()` | `safe` | annualDemand/orderCost/holdingCost ≤ 0 → all-zero result (sentinel; does not throw) |
| `inventoryTurnover()` | `null` | gmroii = null when grossMargin omitted; averageInventory or cogs ≤ 0 → zeroed result (sentinel) |
| `loadCapacity()` | `null` | utilization/isOverloaded/safetyMargin = null when actualLoad omitted; non-positive capacity/load-center inputs → zeroed result (sentinel) |
| `pallet3d()` | `safe` | Empty boxes → empty result with warning 'No boxes provided' (sentinel) |
| `palletStack()` | `safe` | Box exceeds pallet/maxHeight in all orientations → zero result (sentinel) |
| `safetyStock()` | `safe` | — |
| `shipping()` | `throw` | weight ≤ 0, volume ≤ 0, distance ≤ 0 or missing (truck mode), unknown mode |
| `tsp()` | `throw` | Empty nodes (a single node returns a single-node result, does not throw) |
| `dimWeight()` | `throw` | length/width/height ≤ 0, actualWeight < 0 |
| `fillRate()` | `throw` | totalOrders ≤ 0 |
| `serviceLevel()` | `safe` | demandStdDev ≤ 0 → zScore 0 sentinel keyed on safetyStock sign |
| `freightClass()` | `throw` | weight/length/width/height ≤ 0 |
| `kanban()` | `throw` | dailyDemand/leadTime/containerQuantity ≤ 0 (safetyFactor < 0 → all-zero sentinel, does not throw) |
| `pickTime()` | `throw` | speed ≤ 0, itemsPerOrder ≤ 0 |

### Energy (15 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `powerCost()` | `safe` | — |
| `boilerEfficiency()` | `null` | annualFuelCost/annualHeatLoss null without operatingHours (+fuelCost); fuelRate or fuelHeatValue ≤ 0 → all-zero result (sentinel) |
| `carbonFootprint()` | `safe` | electricityUsage ≤ 0 → all-zero result (sentinel) |
| `cusum()` | `safe` | Empty values → empty arrays, shiftDetected 'none' (sentinel) |
| `heatPump()` | `null` | Annual fields null without operatingHours/electricityRate/fuelCost; totalPower ≤ 0 → cop 0; deltaT ≤ 0 → copCarnot/efficiency 0 (sentinels) |
| `ledRoi()` | `null` | paybackPeriod null when totalInvestment or annualCostSaved ≤ 0; fixtureCount or operatingHours ≤ 0 → all-zero result (sentinel) |
| `pfCorrection()` | `safe` | monthlySavings ≤ 0 → paybackMonths 0 (sentinel) |
| `transformerLoss()` | `null` | annualLossEnergy/annualLossCost null without operatingHours (+energyCost); ratedCapacity ≤ 0 or negative losses → all-zero result (sentinel) |
| `vfdSavings()` | `safe` | annualSavings ≤ 0 → paybackYears 0 (sentinel) |
| `windOutput()` | `null` | sweptArea/betzLimit null without rotorDiameter; non-positive adjusted wind speed → capacityFactor 0 (sentinel) |
| `compressedAirCost()` | `throw` | compressorPower/runningHours/airOutput ≤ 0 |
| `insulationRoi()` | `throw` | surfaceArea/tempDifference/insulationK/insulationThickness ≤ 0 (paybackPeriod null without positive installationCost/annualCostSaved) |
| `degreeDay()` | `throw` | Empty dailyTemps |
| `motorEfficiency()` | `throw` | currentEfficiency ≤ 0, newEfficiency ≤ 0 (paybackPeriod null without positive upgradeCost/annualSavings) |
| `solarOutput()` | `throw` | panelWattage/panelCount/peakSunHours ≤ 0, systemEfficiency outside (0, 1], tiltAngle outside [0, 90], latitude outside [-90, 90] |

### Food (7 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `calorie()` | `throw` | weightKg/heightCm/age ≤ 0 |
| `expiry()` | `safe` | shelfLifeDays or totalShelfLife ≤ 0 → percentUsed 100 (sentinel; percentUsed clamped 0–100) |
| `getCategories()` | `safe` | — (returns static category list) |
| `haccp()` | `null` | Unknown category → null |
| `nutrition()` | `safe` | Empty ingredients (total weight 0) → all per-serving values 0 (sentinel) |
| `stabilityStudy()` | `safe` | Fewer than 2 usable temperature groups → default result (Ea 0, q10 1, shelf life 0) (sentinel) |
| `waterActivity()` | `safe` | — |

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
| `scope1Emissions()` | `safe` | — |
| `scope2Emissions()` | `throw` | region 'custom' without customFactor |
| `scope3Emissions()` | `safe` | — |
| `gwpCalculator()` | `safe` | — |
| `esgSummary()` | `safe` | yearsElapsed/yearsRemaining ≤ 0 → rate fields 0 (sentinel) |
| `emissionsIntensity()` | `null` | Per-unit/revenue/employee fields `undefined` unless the respective denominator > 0 |
| `energyIntensity()` | `throw` | totalEnergyMJ < 0, productionUnits ≤ 0 (mjPerRevenue `undefined` unless revenueUsd > 0) |
| `productCarbonFootprint()` | `throw` | Empty stages, productionQuantity ≤ 0. Negative stages (recycling credits) valid; total ≤ 0 → stage percents 0 (sentinel) |
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
| `weightedScore()` | `throw` | Missing/empty/mismatched arrays, weight sum 0 |

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
