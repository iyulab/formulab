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
