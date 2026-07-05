# Error Behavior Specification

This document defines formulab's error handling policy and documents the error behavior of each function.

## Error Policy (v0.9.0+)

### Principles

1. **Validation failures → throw `RangeError`**: Invalid inputs that violate physical or mathematical constraints (negative lengths, zero denominators, out-of-range values) throw a `RangeError` with a descriptive message.

2. **No silent NaN/Infinity**: Functions should not return `NaN` or `Infinity` in output fields. If a calculation cannot produce a meaningful result, the function should throw.

3. **Predictable error contract**: Every public function documents its error behavior via `@throws` JSDoc tags.

### Current Status

All public functions follow the error policy above. As of v0.10.0, no functions return `NaN` or `Infinity` for invalid inputs.

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
| `ppm()` | `safe` | — |
| `rpn()` | `safe` | — |
| `yieldCalc()` | `safe` | — |
| `gageRR()` | `throw` | Insufficient data |
| `cmk()` | `safe` | empty measurements or computed stdDev ≤ 0 → returns zero-valued result; does not throw |
| `weibull()` | `throw` | < 3 data points |
| `paretoAnalysis()` | `throw` | Empty items |

### Metal (25 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `metalWeight()` | `throw` | Non-positive dimensions, outerDiameter ≤ innerDiameter |
| `bendAllowance()` | `throw` | thickness ≤ 0, bendAngle out of range |
| `flatPattern()` | `throw` | Invalid dimensions |
| `kFactorReverse()` | `throw` | Invalid dimensions |
| `pressTonnage()` | `throw` | Missing operation-specific fields |
| `bearing()` | `throw` | dynamicLoadRating ≤ 0, equivalentLoad ≤ 0, rpm ≤ 0 |
| `bolt()` | `throw` | diameter/pitch/kFactor/tensileStrength ≤ 0; torque ≤ 0 (torqueToPreload) or preload ≤ 0 (preloadToTorque) |
| `cutting()` | `throw` | toolDiameter ≤ 0 |
| `cuttingStock()` | `throw` | stockLength ≤ 0, empty pieces, total quantity 0, piece length > stockLength |
| `gear()` | `throw` | Missing required fields per mode |
| `hardness()` | `throw` | value out of conversion range |
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

### Electronics (11 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `ohmsLaw()` | `throw` | Negative values |
| `reflowProfile()` | `throw` | Unknown paste type |
| `resistorDecode()` | `throw` | Invalid band colors/count |
| `smtTakt()` | `throw` | placementRate ≤ 0, componentsPerBoard ≤ 0 |
| `solderPaste()` | `throw` | padCount ≤ 0, stencilThickness ≤ 0 |
| `traceWidth()` | `throw` | current ≤ 0 |
| `awgProperties()` | `throw` | AWG not between 0 and 40 |
| `capacitorDecode()` | `throw` | Invalid code format |
| `ledResistor()` | `throw` | forwardVoltage ≥ supplyVoltage |
| `stencilAperture()` | `throw` | Dimensions ≤ 0 |
| `viaCurrent()` | `throw` | Dimensions ≤ 0 |

### Construction (12 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `momentOfInertia()` | `throw` | Non-positive dimensions |
| `beamLoad()` | `throw` | span ≤ 0 |
| `concreteMix()` | `throw` | volume ≤ 0 |
| `earthwork()` | `throw` | Non-positive length/width/depth or non-positive swell/shrink factor |
| `formwork()` | `throw` | Non-positive used dimension (per element type) or non-positive quantity |
| `rebarWeight()` | `throw` | Unknown size |
| `slope()` | `throw` | ratio ≤ 0 (vertical/undefined; percent/degrees 0 is legit flat) |
| `aggregate()` | `throw` | Non-positive dimensions, unknown type |
| `brick()` | `throw` | wallArea ≤ 0 |
| `pert()` | `throw` | Empty tasks, circular dependencies |
| `roof()` | `throw` | run = 0 |
| `stair()` | `throw` | totalRise ≤ 0 |

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

### Energy (15 functions), Food (6), Logistics (17), Environmental (10)

Most functions in these domains follow the `throw` pattern for invalid inputs. See individual function JSDoc for details.

### Utility

As of v0.13.0 all utility functions follow the standard `throw` pattern — the former `Result | null` signatures (16 functions: assignment, bilinearInterpolation, correlation, depreciation, histogram, lcc, linearInterpolation, movingAverage, normalize, npv, percentile, regression, roi, statistics, unit, weightedScore) were migrated to `RangeError` throws with descriptive messages. One deliberate `null` remains: `NpvResult.irr: number | null` models IRR non-convergence, which is a domain answer rather than an invalid input.

## Consumer Guidance

Most functions follow the same error pattern: invalid inputs throw `RangeError`. The exception is the capability-index family (`cpk()`, `ppk()`, `cmk()`), which returns a zero-valued result for a degenerate spread instead of throwing (see Exception note above).

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
