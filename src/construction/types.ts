/**
 * Beam Load Calculation Types
 */
export type LoadType = 'uniform' | 'concentrated' | 'combined';
export type BeamSupport = 'simple' | 'cantilever' | 'fixed';

export interface LoadInput {
  loadType: LoadType;
  support: BeamSupport;
  span: number;          // m
  uniformLoad?: number;  // kN/m
  pointLoad?: number;    // kN
  pointPosition?: number;  // m from left support (for concentrated/combined)
}

export interface LoadResult {
  maxMoment: number;      // kN·m
  maxShear: number;       // kN
  maxDeflectionCoeff: number; // coefficient (multiply by wL⁴/EI or PL³/EI)
  reactionLeft: number;   // kN
  reactionRight: number;  // kN
  momentAtPoint?: number; // kN·m at point load position
}

/**
 * Concrete Mix Design Types
 */
export type ConcreteGrade = '15' | '20' | '25' | '30' | '35' | '40';

export interface ConcreteInput {
  grade: ConcreteGrade;
  volume: number; // m³
}

export interface ConcreteResult {
  cement: number;  // kg
  sand: number;    // kg
  gravel: number;  // kg
  water: number;   // L
  ratio: string;   // e.g. "1 : 2 : 3"
}

/**
 * Earthwork Volume Types
 */
export interface EarthworkInput {
  length: number;       // m
  width: number;        // m
  depth: number;        // m
  swellFactor: number;  // default 1.25
  shrinkFactor: number; // default 0.9
}

export interface EarthworkResult {
  bankVolume: number;       // m³
  looseVolume: number;      // m³
  compactedVolume: number;  // m³
}

/**
 * Formwork Area Types
 */
export type ElementType = 'column' | 'beam' | 'slab' | 'wall' | 'footing';

export interface FormworkInput {
  elementType: ElementType;
  length: number;   // m
  width: number;    // m
  height: number;   // m
  quantity: number;  // default 1
  reuses: number;   // default 1
}

export interface FormworkResult {
  singleAreaSqm: number;
  totalAreaSqm: number;
  effectiveAreaSqm: number;   // total / reuses
  plywoodSheets: number;      // ceil(effective / 2.9768)
}

/**
 * Rebar Weight Calculation Types
 */
export type RebarSize = 'D10' | 'D13' | 'D16' | 'D19' | 'D22' | 'D25' | 'D29' | 'D32';

export interface RebarInput {
  size: RebarSize;
  length: number;   // meters
  quantity: number;
}

export interface RebarResult {
  unitWeight: number;    // kg/m
  totalLength: number;   // m
  totalWeight: number;   // kg
}

/**
 * Slope Conversion Types
 */
export type SlopeUnit = 'percent' | 'degrees' | 'ratio';

export interface SlopeInput {
  fromUnit: SlopeUnit;
  value: number;
}

export interface SlopeResult {
  percent: number;
  degrees: number;
  ratio: number;      // 1:N
  risePerMeter: number; // mm rise per 1m horizontal
}

/**
 * Aggregate Calculation Types
 */
export type AggregateType = 'gravel' | 'sand' | 'crushed_stone' | 'topsoil' | 'mulch' | 'custom';

export interface AggregateDensity {
  type: AggregateType;
  density: number; // kg/m³
  label: string;
}

export interface AggregateInput {
  length: number;       // m
  width: number;        // m
  depth: number;        // m (or cm, will be converted)
  depthUnit: 'meters' | 'centimeters';
  aggregateType: AggregateType;
  customDensity?: number; // kg/m³, used when aggregateType is 'custom'
}

export interface AggregateResult {
  volume: number;       // m³
  weight: number;       // kg
  weightTonnes: number; // metric tonnes
  coverageArea: number; // m² for the given depth
  density: number;      // kg/m³ used
  bags20kg: number;     // number of 20kg bags needed
  bags25kg: number;     // number of 25kg bags needed
}

/**
 * Brick Calculation Types
 */
export type BrickSize = 'modular' | 'standard' | 'queen' | 'king' | 'custom';

export interface BrickDimensions {
  length: number;  // mm
  height: number;  // mm
}

export interface BrickInput {
  wallArea: number;         // m²
  brickSize: BrickSize;
  customLength?: number;    // mm (for custom size)
  customHeight?: number;    // mm (for custom size)
  mortarThickness: number;  // mm (typically 10mm)
  wasteFactor: number;      // percentage (e.g., 5 for 5%)
}

export interface BrickResult {
  bricksPerSqMeter: number;   // bricks per m²
  totalBricks: number;        // total bricks needed (with waste)
  bricksWithoutWaste: number; // bricks without waste
  wastedBricks: number;       // extra bricks for waste
}

/**
 * PERT (Program Evaluation and Review Technique) Types
 */
export interface PertTask {
  id: string;
  name: string;
  predecessors: string[];
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
}

export interface PertInput {
  tasks: PertTask[];
  deadline?: number;
}

export interface PertTaskResult {
  id: string;
  name: string;
  duration: number;
  variance: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}

export interface PertResult {
  tasks: PertTaskResult[];
  criticalPath: string[];
  projectDuration: number;
  projectVariance: number;
  projectStdDev: number;
  zScore?: number;
  completionProbability?: number;
}

/**
 * Roof Calculation Types
 */
export interface RoofInput {
  rise: number;        // vertical rise (in same unit as run)
  run: number;         // horizontal run (in same unit as rise)
  footprintLength: number;  // roof footprint length (m)
  footprintWidth: number;   // roof footprint width (m)
}

export interface RoofResult {
  slopeRatio: string;     // e.g., "4:12"
  slopeDegrees: number;   // angle in degrees
  slopePercent: number;   // slope as percentage
  rafterLength: number;   // length of rafter for the given rise/run (m)
  slopeFactor: number;    // multiplier for roof area
  roofArea: number;       // total roof area (m²)
  pitchDescription: string; // descriptive pitch category
}

/**
 * Stair Calculation Types
 */
export interface StairInput {
  totalRise: number;      // mm - total vertical height
  totalRun: number;       // mm - total horizontal length
  riserHeight?: number;   // mm - optional desired riser height (default: auto-calculate)
}

export interface StairResult {
  numberOfRisers: number;       // count of risers
  numberOfTreads: number;       // count of treads (risers - 1)
  actualRiserHeight: number;    // mm - actual riser height
  treadDepth: number;           // mm - depth of each tread
  stringerLength: number;       // mm - length of stair stringer
  twoRPlusT: number;            // 2R + T comfort formula result (mm)
  codeCompliant: boolean;       // true if 2R + T is between 600-650mm
  totalAngle: number;           // degrees - stair angle
}
