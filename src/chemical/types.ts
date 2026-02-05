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

export interface DilutionInput {
  solveFor: DilutionSolveFor;
  c1?: number; // initial concentration
  v1?: number; // initial volume
  c2?: number; // final concentration
  v2?: number; // final volume
}

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

export interface ReactorInput {
  shape: ReactorShape;
  diameter: number;      // m
  height?: number;       // m (cylindrical only)
  fillRatio: number;     // 0-1 (e.g., 0.8 = 80%)
  agitatorType?: 'none' | 'anchor' | 'turbine' | 'propeller';
}

export interface ReactorResult {
  totalVolume: number;      // m^3
  workingVolume: number;    // m^3 (totalVolume x fillRatio)
  totalVolumeLiters: number;
  workingVolumeLiters: number;
  surfaceArea: number;      // m^2 (for heat transfer)
  volumeToSurfaceRatio: number;
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
