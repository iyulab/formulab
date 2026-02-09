# Error Behavior Specification

This document defines formulab's error handling policy and documents the error behavior of each function.

## Error Policy (v0.9.0+)

### Principles

1. **Validation failures → throw `RangeError`**: Invalid inputs that violate physical or mathematical constraints (negative lengths, zero denominators, out-of-range values) throw a `RangeError` with a descriptive message.

2. **No silent NaN/Infinity**: Functions should not return `NaN` or `Infinity` in output fields. If a calculation cannot produce a meaningful result, the function should throw.

3. **Predictable error contract**: Every public function documents its error behavior via `@throws` JSDoc tags.

### Current Status

All public functions follow the error policy above. As of v0.10.0, no functions return `NaN` or `Infinity` for invalid inputs.

## Error Patterns by Domain

### Legend

| Symbol | Meaning |
|--------|---------|
| `throw` | Throws `RangeError` |
| `null` | Returns `null` for optional/unavailable fields |
| `safe` | No error edge cases; all inputs produce valid outputs |

### Quality (18 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `oee()` | `throw` | goodCount > totalCount, goodCount < 0, plannedTime ≤ 0 |
| `cpk()` | `throw` | stdDev = 0 (returns Inf for Cp/Cpk) |
| `controlChart()` | `throw` | Empty data, subgroup size < 2 |
| `cycleTime()` | `safe` | — |
| `taktTime()` | `throw` | demand = 0 |
| `aql()` | `throw` | Invalid lot size, invalid AQL level |
| `downtime()` | `safe` | — |
| `dpmo()` | `throw` | opportunities = 0 |
| `lineBalancing()` | `throw` | Empty stations |
| `mtbf()` | `safe` | Returns 0 when failures = 0 |
| `ppk()` | `throw` | stdDev = 0 |
| `ppm()` | `safe` | — |
| `rpn()` | `safe` | — |
| `yieldCalc()` | `safe` | — |
| `gageRR()` | `throw` | Insufficient data |
| `cmk()` | `throw` | stdDev = 0 |
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
| `bearing()` | `throw` | load ≤ 0, rpm ≤ 0 |
| `bolt()` | `throw` | diameter ≤ 0, torque/preload ≤ 0 |
| `cutting()` | `throw` | toolDiameter ≤ 0 |
| `cuttingStock()` | `throw` | stockLength ≤ 0, empty pieces |
| `gear()` | `throw` | Missing required fields per mode |
| `hardness()` | `throw` | value out of conversion range |
| `material()` | `throw` | Unknown grade |
| `pressFit()` | `throw` | Negative interference |
| `roughness()` | `throw` | Negative value |
| `screw()` | `throw` | Unknown designation |
| `spring()` | `throw` | wireDiameter ≤ 0 |
| `tap()` | `throw` | Invalid parameters |
| `thread()` | `throw` | Unknown size |
| `tolerance()` | `throw` | Invalid IT grade or deviation letter |
| `vibration()` | `throw` | Missing system-specific fields |
| `weldHeat()` | `throw` | Invalid parameters |
| `welding()` | `throw` | Invalid base metal/joint combination |
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
| `pid()` | `throw` | Missing method-specific fields |

### Electronics (11 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `ohmsLaw()` | `throw` | Negative values |
| `reflowProfile()` | `throw` | Unknown paste type |
| `resistorDecode()` | `throw` | Invalid band colors/count |
| `smtTakt()` | `throw` | placementRate ≤ 0 |
| `solderPaste()` | `throw` | Negative dimensions |
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
| `earthwork()` | `throw` | Negative dimensions |
| `formwork()` | `throw` | Negative dimensions |
| `rebarWeight()` | `throw` | Unknown size |
| `slope()` | `throw` | ratio = 0 |
| `aggregate()` | `throw` | Non-positive dimensions, unknown type |
| `brick()` | `throw` | wallArea ≤ 0 |
| `pert()` | `throw` | Empty tasks, circular dependencies |
| `roof()` | `throw` | run = 0 |
| `stair()` | `throw` | totalRise ≤ 0 |

### Automotive (9 functions)

| Function | Error Behavior | Conditions |
|----------|---------------|------------|
| `brakingDistance()` | `throw` | speed ≤ 0, friction ≤ 0 |
| `batteryRuntime()` | `throw` | capacity ≤ 0 |
| `evCharging()` | `throw` | chargerPower ≤ 0 |
| `fuelEconomy()` | `throw` | distance ≤ 0, fuel ≤ 0 |
| `gearRatio()` | `throw` | teeth ≤ 0 |
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

### Energy (15 functions), Safety (14), Food (6), Logistics (17), Environmental (10), Utility (3)

Most functions in these domains follow the `throw` pattern for invalid inputs. See individual function JSDoc for details.

## Consumer Guidance

All functions follow the same error pattern: invalid inputs throw `RangeError`.

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
