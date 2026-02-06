# formulab

> Industrial & manufacturing calculation library for engineers

[![npm version](https://img.shields.io/npm/v/formulab.svg)](https://www.npmjs.com/package/formulab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive collection of engineering formulas and calculations for manufacturing, quality control, logistics, and industrial applications. Zero dependencies, fully typed, tree-shakeable.

## Features

- **110+ industrial calculations** — OEE, Cpk, SPC control charts, metal weight, pipe flow, CBM, NIOSH lifting, and more
- **11 specialized domains** — Quality, Metal, Chemical, Electronics, Construction, Automotive, Logistics, Energy, Safety, Food, Utility
- **Zero dependencies** — Lightweight and fast
- **TypeScript first** — Full type definitions included
- **Tree-shakeable** — Import only what you need
- **Well tested** — Comprehensive test coverage
- **Research-based** — Built on industry standards (ISO, OSHA, NIOSH, IPC)

## Installation

```bash
npm install formulab
```

```bash
pnpm add formulab
```

## Quick Start

```typescript
import { oee, metalWeight, cbm } from 'formulab';

// Calculate OEE (Overall Equipment Effectiveness)
const result = oee({
  rawData: {
    plannedTime: 480,      // minutes (8 hours)
    runTime: 432,          // minutes (90% availability)
    totalCount: 1000,
    goodCount: 990,        // 99% quality
    idealCycleTime: 0.456, // minutes per piece (95% performance)
  },
});
console.log(result.percentages.oee); // 84.6%

// Calculate metal weight
const weight = metalWeight({
  shape: 'plate',
  materialName: 'steel',
  length: 1000,    // mm
  width: 500,      // mm
  thickness: 10,   // mm
});
console.log(weight.weight); // 39.25 kg

// Calculate CBM (Cubic Meter)
const volume = cbm({
  length: 120,
  width: 80,
  height: 100,
  quantity: 1,
  unit: 'cm',
});
console.log(volume.totalCbm); // 0.96 m³
```

## Domains

### Quality & Production (14 functions)

```typescript
import { oee, cpk, taktTime, dpmo, controlChart } from 'formulab/quality';
```

| Function | Description |
|----------|-------------|
| `oee()` | Overall Equipment Effectiveness |
| `cpk()` | Process Capability Index |
| `controlChart()` | SPC X-bar/R and X-bar/S charts |
| `cycleTime()` | Cycle Time analysis |
| `taktTime()` | Takt Time calculation |
| `aql()` | AQL sampling inspection |
| `downtime()` | Downtime analysis |
| `dpmo()` | Defects Per Million Opportunities |
| `lineBalancing()` | Line balancing optimization |
| `mtbf()` | Mean Time Between Failures |
| `ppk()` | Process Performance Index |
| `ppm()` | Parts Per Million conversion |
| `rpn()` | Risk Priority Number (FMEA) |
| `yieldCalc()` | First Pass Yield / RTY |

### Metal & Machining (22 functions)

```typescript
import { metalWeight, bendAllowance, cutting, bearing } from 'formulab/metal';
```

| Function | Description |
|----------|-------------|
| `metalWeight()` | Weight calculation for various shapes |
| `bendAllowance()` | Sheet metal bend allowance |
| `flatPattern()` | Flat pattern length calculation |
| `kFactorReverse()` | K-factor reverse engineering |
| `pressTonnage()` | Press brake tonnage |
| `bearing()` | L10 bearing life calculation |
| `bolt()` | Bolt torque and preload |
| `cutting()` | Cutting speed, feed rate, RPM |
| `cuttingStock()` | 1D cutting optimization |
| `gear()` | Gear module calculation |
| `hardness()` | Hardness conversion (HRC, HB, HV) |
| `material()` | Material properties lookup |
| `pressFit()` | Press fit interference |
| `roughness()` | Surface roughness conversion |
| `screw()` | Screw specification |
| `spring()` | Spring design calculation |
| `tap()` | Tap drill size |
| `thread()` | Thread dimensions |
| `tolerance()` | ISO tolerance (IT grades) |
| `vibration()` | Natural frequency analysis |
| `weldHeat()` | Weld heat input calculation |
| `welding()` | Welding parameters |

### Chemical & Process (9 functions)

```typescript
import { dilution, concentration, ph, reactor, pipeFlow, heatTransfer } from 'formulab/chemical';
```

| Function | Description |
|----------|-------------|
| `batch()` | Batch scaling calculation |
| `concentration()` | Concentration conversion |
| `dilution()` | Dilution (C1V1 = C2V2) |
| `heatTransfer()` | Conduction/convection/radiation heat transfer |
| `ph()` | pH and buffer calculations |
| `pipeFlow()` | Darcy-Weisbach pipe flow pressure drop |
| `reactor()` | Reactor sizing |
| `shelfLife()` | Shelf life prediction (Arrhenius) |
| `injectionCycle()` | Injection molding cycle time |

### Electronics & SMT (11 functions)

```typescript
import { traceWidth, solderPaste, resistorDecode, ohmsLaw } from 'formulab/electronics';
```

| Function | Description |
|----------|-------------|
| `ohmsLaw()` | Ohm's Law V/I/R/P calculator |
| `reflowProfile()` | Reflow temperature profile |
| `resistorDecode()` | Resistor color code decoder |
| `smtTakt()` | SMT line takt time |
| `solderPaste()` | Solder paste volume calculation |
| `traceWidth()` | PCB trace width (IPC-2221) |
| `awgProperties()` | AWG wire properties |
| `capacitorDecode()` | Capacitor code decoder |
| `ledResistor()` | LED resistor calculation |
| `stencilAperture()` | Stencil aperture design |
| `viaCurrent()` | Via current capacity |

### Construction (12 functions)

```typescript
import { concreteMix, rebarWeight, slope, stair, momentOfInertia } from 'formulab/construction';
```

| Function | Description |
|----------|-------------|
| `momentOfInertia()` | Section properties (Ix, Sx, rx) for 7 shapes |
| `beamLoad()` | Beam load calculation |
| `concreteMix()` | Concrete mix ratio |
| `earthwork()` | Earthwork volume |
| `formwork()` | Formwork area calculation |
| `rebarWeight()` | Rebar weight by size |
| `slope()` | Slope conversion (%, degree, ratio) |
| `aggregate()` | Aggregate volume calculation |
| `brick()` | Brick quantity estimation |
| `pert()` | PERT schedule analysis |
| `roof()` | Roof calculation |
| `stair()` | Stair dimension calculation |

### Automotive (8 functions)

```typescript
import { batteryRuntime, evCharging, torque, brakingDistance } from 'formulab/automotive';
```

| Function | Description |
|----------|-------------|
| `brakingDistance()` | Stopping distance (AASHTO method) |
| `batteryRuntime()` | Battery capacity/runtime |
| `evCharging()` | EV charging time estimation |
| `fuelEconomy()` | Fuel economy conversion |
| `gearRatio()` | Gear ratio calculation |
| `tireCompare()` | Tire size comparison |
| `torque()` | Torque conversion |
| `power()` | Power conversion (HP, kW) |

### Logistics & Inventory (14 functions)

```typescript
import { cbm, eoq, safetyStock, kanban } from 'formulab/logistics';
```

| Function | Description |
|----------|-------------|
| `cbm()` | Cubic meter calculation |
| `containerFit()` | Container capacity estimation |
| `dimWeight()` | Dimensional weight |
| `eoq()` | Economic Order Quantity |
| `fillRate()` | Fill rate calculation |
| `freightClass()` | NMFC freight class |
| `kanban()` | Kanban quantity |
| `pallet3d()` | 3D pallet optimization |
| `palletStack()` | Pallet stacking calculation |
| `pickTime()` | Picking time estimation |
| `safetyStock()` | Safety stock calculation |
| `serviceLevel()` | Service level calculation |
| `shipping()` | Shipping cost estimation |
| `tsp()` | Traveling salesman problem |

### Energy & Utilities (7 functions)

```typescript
import { powerCost, motorEfficiency, carbonFootprint, solarOutput } from 'formulab/energy';
```

| Function | Description |
|----------|-------------|
| `solarOutput()` | Solar panel output estimation (PVWatts-based) |
| `carbonFootprint()` | Scope 2 emissions |
| `compressedAirCost()` | Compressed air cost |
| `motorEfficiency()` | Motor upgrade ROI |
| `pfCorrection()` | Power factor correction |
| `powerCost()` | Electricity cost with demand |
| `vfdSavings()` | VFD energy savings |

### Safety & Ergonomics (7 functions)

```typescript
import { nioshLifting, noiseExposure, wbgtCalculate, ventilationRate } from 'formulab/safety';
```

| Function | Description |
|----------|-------------|
| `ventilationRate()` | Required ventilation ACH/CFM (ASHRAE/OSHA) |
| `fallClearance()` | Fall protection clearance |
| `nioshLifting()` | NIOSH lifting equation |
| `noiseExposure()` | TWA/Dose calculation |
| `wbgtCalculate()` | WBGT heat stress index |
| `havsCalculate()` | Hand-arm vibration exposure |
| `respiratorCalculate()` | Respirator MUC calculation |

### Food & HACCP (4 functions)

```typescript
import { calorie, nutrition, haccp } from 'formulab/food';
```

| Function | Description |
|----------|-------------|
| `calorie()` | Calorie requirement (BMR/TDEE) |
| `expiry()` | Expiry date calculation |
| `nutrition()` | Nutrition facts calculation |
| `haccp()` | HACCP checklist generation |

### Utility (3 functions)

```typescript
import { solveAssignment, calculateUnit } from 'formulab/utility';
```

| Function | Description |
|----------|-------------|
| `solveAssignment()` | Hungarian algorithm optimization |
| `calculateUnit()` | Unit conversion |
| `getUnitCategories()` | Get unit categories |

## API Examples

### OEE Calculation

```typescript
import { oee } from 'formulab/quality';

const result = oee({
  rawData: {
    plannedTime: 480,      // minutes
    runTime: 420,          // actual running time
    totalCount: 1000,      // total pieces produced
    goodCount: 990,        // good pieces
    idealCycleTime: 0.4,   // minutes per piece
  },
});

console.log(result);
// {
//   factors: { availability: 0.875, performance: 0.952, quality: 0.99, oee: 0.825 },
//   percentages: { availability: 87.5, performance: 95.2, quality: 99, oee: 82.5 }
// }
```

### NIOSH Lifting Equation

```typescript
import { nioshLifting } from 'formulab/safety';

const result = nioshLifting({
  loadWeight: 23,           // kg
  horizontalDistance: 25,   // cm
  verticalDistance: 75,     // cm (height at lift origin)
  verticalTravel: 25,       // cm (vertical travel distance)
  asymmetryAngle: 0,        // degrees
  coupling: 'good',         // 'good' | 'fair' | 'poor'
  frequency: 1,             // lifts per minute
  duration: 'short',        // 'short' | 'medium' | 'long'
});

console.log(result);
// {
//   rwl: 21.62,             // Recommended Weight Limit (kg)
//   liftingIndex: 1.06,     // LI = Load / RWL
//   riskLevel: 'moderate',
//   hm: 1.0, vm: 1.0, dm: 1.0, am: 1.0, fm: 0.94, cm: 1.0
// }
```

### Dimensional Weight

```typescript
import { dimWeight } from 'formulab/logistics';

const result = dimWeight({
  length: 60,
  width: 40,
  height: 30,
  unit: 'cm',
  carrier: 'international',
});

console.log(result);
// {
//   dimWeight: 14.4,
//   actualVolume: 0.072,
//   cbm: 0.072,
// }
```

## Tree Shaking

Import only what you need to minimize bundle size:

```typescript
// Recommended - domain-specific import
import { oee } from 'formulab/quality';
import { metalWeight } from 'formulab/metal';

// Also works - main entry point (tree-shakeable)
import { oee, metalWeight } from 'formulab';

// Avoid - imports entire module
import * as formulab from 'formulab';
```

## TypeScript Support

Full TypeScript support with detailed type definitions:

```typescript
import type {
  OeeInput,
  OeeResult,
  CpkInput,
  CpkResult,
  MetalWeightInput,
  MetalWeightResult,
} from 'formulab';
```

## Browser Support

formulab works in all modern browsers and Node.js:

- Node.js 18+
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

Contributions are welcome! Please see our [GitHub repository](https://github.com/iyulab/formulab).

```bash
# Clone the repository
git clone https://github.com/iyulab/formulab.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

## License

MIT © [iyulab](https://github.com/iyulab)

---

<p align="center">
  Made with engineering precision by <a href="https://github.com/iyulab">iyulab</a>
</p>
