/**
 * Batch Scaling Types
 */
export interface BatchIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface BatchInput {
  originalBatchSize: number;
  targetBatchSize: number;
  ingredients: BatchIngredient[];
}

export interface ScaledIngredient {
  name: string;
  originalAmount: number;
  scaledAmount: number;
  unit: string;
}

export interface BatchResult {
  scaleFactor: number;
  scaledIngredients: ScaledIngredient[];
}

/**
 * Concentration Conversion Types
 */
export type ConcentrationUnit = 'molPerL' | 'wtPercent' | 'ppm';

export interface ConcentrationInput {
  fromUnit: ConcentrationUnit;
  value: number;
  molecularWeight: number; // g/mol
  solutionDensity: number; // g/mL (default 1.0 for dilute)
}

export interface ConcentrationResult {
  molPerL: number;
  wtPercent: number;
  ppm: number;
}

/**
 * Dilution Calculator Types
 */
export type DilutionSolveFor = 'c2' | 'v2' | 'c1' | 'v1';

export type DilutionInput =
  | { solveFor: 'c1'; v1: number; c2: number; v2: number }
  | { solveFor: 'v1'; c1: number; c2: number; v2: number }
  | { solveFor: 'c2'; c1: number; v1: number; v2: number }
  | { solveFor: 'v2'; c1: number; v1: number; c2: number };

export interface DilutionResult {
  c1: number;
  v1: number;
  c2: number;
  v2: number;
  solventToAdd: number; // v2 - v1
}

/**
 * pH Buffer Calculator Types
 */
export type BufferSystem = 'acetate' | 'phosphate' | 'tris' | 'citrate' | 'carbonate' | 'custom';

export interface PhInput {
  bufferSystem: BufferSystem;
  acidConcentration: number;    // mol/L [HA]
  baseConcentration: number;    // mol/L [A-]
  temperature: number;          // Celsius, default 25
  customPka?: number;           // for 'custom' system
}

export interface PhResult {
  pH: number;
  pKa: number;
  bufferCapacity: number;       // mol/L
  effectiveRange: { min: number; max: number };
}

/**
 * Reactor Volume Calculator Types
 */
export type ReactorShape = 'cylindrical' | 'spherical';

interface ReactorBase {
  diameter: number;      // m
  fillRatio: number;     // 0-1 (e.g., 0.8 = 80%)
  agitatorType?: 'none' | 'anchor' | 'turbine' | 'propeller';
}

export type ReactorInput = ReactorBase & (
  | { shape: 'cylindrical'; height: number }
  | { shape: 'spherical' }
);

export interface ReactorResult {
  totalVolume: number;      // m^3
  workingVolume: number;    // m^3 (totalVolume x fillRatio)
  totalVolumeLiters: number;
  workingVolumeLiters: number;
  surfaceArea: number;      // m^2 (for heat transfer)
  volumeToSurfaceRatio: number;
}

/**
 * Heat Transfer Calculator Types
 */
export type HeatTransferMode = 'conduction' | 'convection' | 'radiation';

export type HeatTransferInput =
  | { mode: 'conduction'; conductivity: number; area: number; thickness: number; tempHot: number; tempCold: number }
  | { mode: 'convection'; coefficient: number; area: number; tempSurface: number; tempFluid: number }
  | { mode: 'radiation'; emissivity: number; area: number; tempHot: number; tempCold: number };

export interface HeatTransferResult {
  heatRate: number;          // W (total heat transfer rate Q)
  heatFluxDensity: number;   // W/m² (heat flux q)
  tempDifference: number;    // K or °C
  thermalResistance: number; // K/W
}

/**
 * Pipe Flow Calculator Types (Darcy-Weisbach + Swamee-Jain)
 */
export type PipeMaterial = 'commercialSteel' | 'stainlessSteel' | 'castIron' | 'copper' | 'pvc' | 'concrete' | 'galvanizedSteel' | 'custom';

export interface PipeFlowInput {
  flowRate: number;          // L/min
  pipeDiameter: number;      // mm (inner diameter)
  pipeLength: number;         // m
  pipeMaterial: PipeMaterial;
  fluidDensity: number;       // kg/m³ (default 998.2 for water at 20°C)
  fluidViscosity: number;     // Pa·s (default 0.001002 for water at 20°C)
  customRoughness?: number;   // mm (for 'custom' material)
}

export interface PipeFlowResult {
  velocity: number;            // m/s
  reynoldsNumber: number;
  flowRegime: 'laminar' | 'transitional' | 'turbulent';
  frictionFactor: number;      // Darcy friction factor
  pressureDrop: number;        // Pa
  pressureDropKpa: number;     // kPa
  pressureDropBar: number;     // bar
  headLoss: number;            // m
}

/**
 * Shelf Life Calculator Types
 */
export interface ShelfLifeInput {
  shelfLifeAtRef: number;    // known shelf-life (months) at reference temp
  refTemp: number;           // reference temperature (Celsius)
  targetTemp: number;        // target storage temperature (Celsius)
  q10: number;               // Q10 factor (default 2-3, typical food/pharma)
}

export interface ShelfLifeResult {
  estimatedShelfLife: number;   // months at target temp
  accelerationFactor: number;   // ratio
  refTemp: number;
  targetTemp: number;
  tempDifference: number;
}

/**
 * Injection Molding Cycle Time Types
 */
export type ResinType = 'abs' | 'pp' | 'pc' | 'pa' | 'pmma' | 'pet' | 'pom' | 'ps' | 'custom';

export interface InjectionCycleInput {
  resin: ResinType;
  wallThickness: number;       // mm
  shotWeight: number;          // g
  injectionRate?: number;      // cm^3/s (default by machine size)
  moldOpenCloseTime?: number;  // s (default 3)
  ejectionTime?: number;       // s (default 0.5)
  // Custom resin
  thermalDiffusivity?: number; // mm^2/s
  meltTemp?: number;           // Celsius
  moldTemp?: number;           // Celsius
  ejectionTemp?: number;       // Celsius
  density?: number;            // g/cm^3
}

export interface InjectionCyclePhase {
  phase: string;
  time: number;
  percentage: number;
}

export interface InjectionCycleResult {
  coolingTime: number;         // s
  fillTime: number;            // s
  packingTime: number;         // s
  moldOpenClose: number;       // s
  ejectionTime: number;        // s
  totalCycleTime: number;      // s
  partsPerHour: number;
  breakdown: InjectionCyclePhase[];
}

/**
 * Control Valve Cv Calculator Types
 */
export interface FlowControlInput {
  flowRate: number;           // m³/h
  inletPressure: number;      // kPa
  outletPressure: number;     // kPa
  fluidDensity: number;       // kg/m³
  fluidType: 'liquid' | 'gas' | 'steam';
  temperature?: number;       // °C, default 20
  molecularWeight?: number;   // for gas
  specificHeatRatio?: number; // for gas, default 1.4
}

export interface FlowControlResult {
  cv: number;                 // Flow coefficient (US)
  kv: number;                 // Flow coefficient (metric)
  pressureDrop: number;       // kPa
  pressureRatio: number;      // ΔP/P1
  isChoked: boolean;
  velocity: number;           // m/s (estimated pipe velocity)
}

/**
 * Relief Valve Sizing Types — API 520
 */
export interface ReliefValveInput {
  requiredCapacity: number;   // kg/h
  setPressure: number;        // kPa (gauge)
  backPressure: number;       // kPa (gauge)
  temperature: number;        // °C
  fluidType: 'liquid' | 'gas' | 'steam';
  molecularWeight?: number;
  specificGravity?: number;   // for liquid, water=1.0
  overpressure?: number;      // %, default 10
  dischargeCoefficient?: number; // Kd
}

export interface ReliefValveResult {
  requiredArea: number;       // mm²
  selectedOrifice: string;    // API letter (D-T)
  orificeArea: number;        // mm²
  relievingPressure: number;  // kPa
  capacityAtOrifice: number;  // kg/h
  percentUtilized: number;    // %
}

/**
 * PID Tuning Types — Ziegler-Nichols / Cohen-Coon
 */
export interface PidInput {
  method: 'ziegler-nichols-step' | 'ziegler-nichols-ultimate' | 'cohen-coon';
  processGain?: number;       // K (step response)
  deadTime?: number;          // L (seconds)
  timeConstant?: number;      // T (seconds)
  ultimateGain?: number;      // Ku
  ultimatePeriod?: number;    // Pu (seconds)
  controllerType: 'P' | 'PI' | 'PID';
}

export interface PidResult {
  kp: number;                 // Proportional gain
  ki: number;                 // Integral gain (1/s)
  kd: number;                 // Derivative gain (s)
  ti: number;                 // Integral time (s)
  td: number;                 // Derivative time (s)
  method: string;
}
