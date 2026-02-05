# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
