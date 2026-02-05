# formulab

> Industrial & manufacturing calculation library for engineers

[![npm version](https://img.shields.io/npm/v/formulab.svg)](https://www.npmjs.com/package/formulab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive collection of engineering formulas and calculations for manufacturing, quality control, logistics, and industrial applications. Zero dependencies, fully typed, tree-shakeable.

## Features

- 🏭 **50+ industrial calculations** — OEE, Cpk, metal weight, CBM, and more
- 📦 **Zero dependencies** — Lightweight and fast
- 🔷 **TypeScript first** — Full type definitions included
- 🌳 **Tree-shakeable** — Import only what you need
- ✅ **Well tested** — Comprehensive test coverage
- 📚 **Well documented** — Detailed API documentation

## Installation

```bash
npm install formulab
```

```bash
yarn add formulab
```

```bash
pnpm add formulab
```

## Quick Start

```typescript
import { oee, metalWeight, cbm } from 'formulab';

// Calculate OEE (Overall Equipment Effectiveness)
const result = oee({
  availability: 0.90,
  performance: 0.95,
  quality: 0.99
});
console.log(result.oee); // 0.846 (84.6%)

// Calculate metal weight
const weight = metalWeight({
  material: 'steel',
  shape: 'plate',
  dimensions: { length: 1000, width: 500, thickness: 10 }, // mm
});
console.log(weight.kg); // 39.25 kg

// Calculate CBM (Cubic Meter)
const volume = cbm({
  length: 120,
  width: 80,
  height: 100,
  unit: 'cm'
});
console.log(volume.cbm); // 0.96 m³
```

## Modules

### Quality & Production

```typescript
import { quality } from 'formulab';
// or
import { oee, cpk, ppm, taktTime, cycleTime, fpy } from 'formulab/quality';
```

| Function | Description |
|----------|-------------|
| `oee()` | Overall Equipment Effectiveness |
| `cpk()` | Process Capability Index |
| `ppm()` | Parts Per Million / Sigma Level |
| `taktTime()` | Takt Time calculation |
| `cycleTime()` | Cycle Time analysis |
| `fpy()` | First Pass Yield / RTY |
| `dpmo()` | Defects Per Million Opportunities |

### Metal & Machining

```typescript
import { metal } from 'formulab';
// or
import { metalWeight, hardness, bendAllowance, cutting } from 'formulab/metal';
```

| Function | Description |
|----------|-------------|
| `metalWeight()` | Weight calculation for various shapes |
| `hardness()` | Hardness conversion (HRC, HB, HV) |
| `bendAllowance()` | Sheet metal bend allowance |
| `bendDeduction()` | Sheet metal bend deduction |
| `kFactor()` | K-factor calculation |
| `cutting()` | Cutting speed, feed rate, RPM |
| `tolerance()` | ISO tolerance calculation (IT grades) |
| `surfaceRoughness()` | Ra, Rz, Rmax conversion |
| `bearingLife()` | L10 bearing life calculation |
| `pressTonnage()` | Press force calculation |

### Chemical & Process

```typescript
import { chemical } from 'formulab';
// or
import { concentration, dilution, ph } from 'formulab/chemical';
```

| Function | Description |
|----------|-------------|
| `concentration()` | Concentration conversion (mol, %, ppm) |
| `dilution()` | Dilution calculation (C1V1 = C2V2) |
| `ph()` | pH and buffer calculations |
| `mixingRatio()` | Chemical mixing ratio |

### Logistics & Inventory

```typescript
import { logistics } from 'formulab';
// or
import { cbm, dimWeight, eoq, safetyStock, kanban } from 'formulab/logistics';
```

| Function | Description |
|----------|-------------|
| `cbm()` | Cubic meter calculation |
| `dimWeight()` | Dimensional weight (volumetric) |
| `eoq()` | Economic Order Quantity |
| `safetyStock()` | Safety stock calculation |
| `kanban()` | Kanban quantity calculation |
| `palletCount()` | Pallet stacking calculation |
| `containerFit()` | Container capacity estimation |

### Construction

```typescript
import { construction } from 'formulab';
// or
import { concrete, rebar, slope, earthwork } from 'formulab/construction';
```

| Function | Description |
|----------|-------------|
| `concrete()` | Concrete mix ratio calculation |
| `rebar()` | Rebar weight calculation |
| `slope()` | Slope/gradient conversion (%, degree, ratio) |
| `earthwork()` | Earthwork volume calculation |
| `brick()` | Brick/block quantity |
| `paint()` | Paint coverage calculation |
| `stair()` | Stair dimension calculation |

### Automotive & Energy

```typescript
import { automotive } from 'formulab';
// or
import { torque, battery, fuelEconomy, charging } from 'formulab/automotive';
```

| Function | Description |
|----------|-------------|
| `torque()` | Torque/power conversion |
| `battery()` | Battery capacity (Ah, Wh, kWh) |
| `fuelEconomy()` | Fuel economy conversion (mpg, L/100km, km/L) |
| `charging()` | EV charging time calculation |
| `tireDiameter()` | Tire size calculation |
| `gearRatio()` | Gear ratio calculation |

### Energy & Utilities

```typescript
import { energy } from 'formulab';
// or
import { powerCost, compressedAir, motorEfficiency, carbon } from 'formulab/energy';
```

| Function | Description |
|----------|-------------|
| `powerCost()` | Electricity cost calculation |
| `compressedAir()` | Compressed air cost |
| `motorEfficiency()` | Motor efficiency (IE class) |
| `carbon()` | Carbon emission calculation |
| `roi()` | Equipment ROI / payback period |

### Utilities

```typescript
import { utils } from 'formulab';
// or
import { convert, decode } from 'formulab/utils';
```

| Function | Description |
|----------|-------------|
| `convert.length()` | Length unit conversion |
| `convert.weight()` | Weight unit conversion |
| `convert.pressure()` | Pressure unit conversion |
| `convert.temperature()` | Temperature conversion |
| `decode.vin()` | VIN number decoder |
| `decode.tire()` | Tire size decoder |
| `decode.steelGrade()` | Steel grade decoder (SS400, S45C, etc.) |

## API Examples

### OEE Calculation

```typescript
import { oee } from 'formulab';

const result = oee({
  // Method 1: Direct input
  availability: 0.90,
  performance: 0.95,
  quality: 0.99,
  
  // Method 2: Calculate from raw data (optional)
  plannedTime: 480,      // minutes
  runTime: 432,          // minutes
  totalCount: 1000,
  goodCount: 990,
  idealCycleTime: 0.5,   // minutes per unit
});

console.log(result);
// {
//   oee: 0.846,
//   availability: 0.90,
//   performance: 0.95,
//   quality: 0.99,
//   rating: 'Good'  // World-class > 0.85, Good > 0.70, Average > 0.50
// }
```

### Process Capability (Cpk)

```typescript
import { cpk } from 'formulab';

const result = cpk({
  data: [10.2, 10.5, 9.8, 10.1, 10.3, ...], // measurement data
  usl: 11.0,  // Upper Specification Limit
  lsl: 9.0,   // Lower Specification Limit
});

console.log(result);
// {
//   cpk: 1.33,
//   cp: 1.45,
//   cpu: 1.33,
//   cpl: 1.57,
//   mean: 10.15,
//   stdDev: 0.23,
//   rating: 'Capable'  // Excellent > 1.67, Capable > 1.33, Marginal > 1.0
// }
```

### Metal Weight

```typescript
import { metalWeight } from 'formulab';

// Plate/Sheet
const plate = metalWeight({
  material: 'steel',       // steel, stainless, aluminum, copper, brass
  shape: 'plate',
  dimensions: {
    length: 1000,          // mm
    width: 500,
    thickness: 10,
  },
});

// Round bar
const roundBar = metalWeight({
  material: 'aluminum',
  shape: 'round',
  dimensions: {
    diameter: 50,
    length: 2000,
  },
});

// Pipe
const pipe = metalWeight({
  material: 'stainless',
  shape: 'pipe',
  dimensions: {
    outerDiameter: 100,
    thickness: 5,
    length: 3000,
  },
});

console.log(plate.kg);     // 39.25 kg
console.log(roundBar.kg);  // 10.60 kg
console.log(pipe.kg);      // 35.81 kg
```

### Bend Allowance

```typescript
import { bendAllowance, bendDeduction } from 'formulab';

const ba = bendAllowance({
  thickness: 1.6,          // mm
  innerRadius: 3.2,        // mm (typically 2×thickness)
  bendAngle: 90,           // degrees
  kFactor: 0.44,           // optional, auto-calculated if omitted
  material: 'SPCC',        // optional, for k-factor lookup
});

console.log(ba);
// {
//   bendAllowance: 5.53,   // mm
//   bendDeduction: 3.67,   // mm
//   kFactor: 0.44,
//   arcLength: 5.53,
// }
```

### Dimensional Weight

```typescript
import { dimWeight } from 'formulab';

const result = dimWeight({
  length: 60,
  width: 40,
  height: 30,
  unit: 'cm',
  carrier: 'international', // international (5000), domestic (6000), custom
  // divisor: 5000,         // or specify custom divisor
});

console.log(result);
// {
//   dimWeight: 14.4,       // kg
//   actualVolume: 0.072,   // m³
//   cbm: 0.072,
// }
```

## Material Data

formulab includes built-in material property data:

```typescript
import { materials } from 'formulab';

// Metal densities (g/cm³)
materials.density.steel;      // 7.85
materials.density.stainless;  // 7.93
materials.density.aluminum;   // 2.71
materials.density.copper;     // 8.96

// Hardness conversion tables
materials.hardness.hrcToHb(45);  // 421
materials.hardness.hbToHv(200);  // 210

// Steel grades
materials.steel['SS400'];    // { tensile: 400, yield: 245, ... }
materials.steel['S45C'];     // { carbon: 0.45, tensile: 690, ... }
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
  Material,
  Shape,
} from 'formulab';
```

## Tree Shaking

Import only what you need to minimize bundle size:

```typescript
// ✅ Good - only imports oee function
import { oee } from 'formulab/quality';

// ✅ Good - tree-shakeable
import { oee, cpk } from 'formulab';

// ⚠️ Avoid - imports entire module
import * as formulab from 'formulab';
```

## Browser Support

formulab works in all modern browsers and Node.js:

- Node.js 16+
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

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
  Made with ❤️ by <a href="https://github.com/iyulab">iyulab</a>
</p>
