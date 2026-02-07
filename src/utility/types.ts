/**
 * Assignment Problem Types (Hungarian Algorithm)
 */
export type AssignmentObjective = 'minimize' | 'maximize';

export interface AssignmentInput {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  objective: AssignmentObjective;
}

export interface AssignmentPair {
  row: number;
  col: number;
  rowLabel: string;
  colLabel: string;
  cost: number;
}

export interface AssignmentResult {
  totalCost: number;
  assignments: AssignmentPair[];
  unassignedRows: string[];
  unassignedCols: string[];
}

/**
 * Unit Conversion Types
 */
export type UnitCategory =
  | 'length' | 'weight' | 'volume' | 'temperature' | 'pressure' | 'area' | 'speed'
  | 'energy' | 'power' | 'force' | 'torque' | 'flowRate' | 'angle' | 'density';

export interface UnitDef {
  id: string;
  labelKey: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface UnitInput {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  value: number;
}

export interface ConversionEntry {
  unitId: string;
  value: number;
}

export interface UnitResult {
  toValue: number;
  allConversions: ConversionEntry[];
}

/**
 * Statistics Types
 */
export interface StatisticsInput {
  data: number[];
}

export interface StatisticsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDev: number;
}

/**
 * Percentile Types
 */
export interface PercentileInput {
  data: number[];
  percentile: number;
}

export interface PercentileResult {
  percentile: number;
  value: number;
}

/**
 * Correlation Types (Pearson)
 */
export interface CorrelationInput {
  x: number[];
  y: number[];
}

export interface CorrelationResult {
  r: number;
  r2: number;
  n: number;
}

/**
 * Linear Regression Types
 */
export interface RegressionInput {
  x: number[];
  y: number[];
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  equation: string;
}

/**
 * Moving Average Types
 */
export type MovingAverageMethod = 'sma' | 'ema';

export interface MovingAverageInput {
  data: number[];
  window: number;
  method: MovingAverageMethod;
}

export interface MovingAverageResult {
  values: number[];
}

/**
 * Linear Interpolation Types
 */
export interface LinearInterpolationInput {
  x: number[];
  y: number[];
  target: number;
}

export interface LinearInterpolationResult {
  value: number;
  lowerIndex: number;
  upperIndex: number;
  isExtrapolation: boolean;
}

/**
 * Bilinear Interpolation Types
 */
export interface BilinearInterpolationInput {
  x: number[];
  y: number[];
  z: number[][];
  targetX: number;
  targetY: number;
}

export interface BilinearInterpolationResult {
  value: number;
  isExtrapolation: boolean;
}

/**
 * ROI (Return on Investment) Types
 */
export interface RoiInput {
  investment: number;
  annualReturn: number;
  years: number;
}

export interface RoiResult {
  roi: number;
  annualRoi: number;
  paybackPeriod: number;
  totalReturn: number;
  netProfit: number;
}

/**
 * NPV (Net Present Value) Types
 */
export interface NpvInput {
  initialInvestment: number;
  cashFlows: number[];
  discountRate: number;
}

export interface NpvResult {
  npv: number;
  irr: number | null;
  profitabilityIndex: number;
}

/**
 * Depreciation Types
 */
export type DepreciationMethod = 'straight-line' | 'declining-balance';

export interface DepreciationInput {
  assetCost: number;
  salvageValue: number;
  usefulLife: number;
  method: DepreciationMethod;
}

export interface DepreciationYearEntry {
  year: number;
  depreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

export interface DepreciationResult {
  annualDepreciation: number;
  schedule: DepreciationYearEntry[];
  totalDepreciation: number;
}

/**
 * Life Cycle Cost (LCC) Types
 */
export interface LccInput {
  initialCost: number;
  annualOperatingCost: number;
  annualMaintenanceCost: number;
  disposalCost: number;
  lifespan: number;
  discountRate: number;
}

export interface LccResult {
  totalLcc: number;
  presentValueOperating: number;
  presentValueMaintenance: number;
  presentValueDisposal: number;
  annualEquivalentCost: number;
}

/**
 * Normalize Types
 */
export type NormalizeMethod = 'min-max' | 'z-score';

export interface NormalizeInput {
  data: number[];
  method: NormalizeMethod;
}

export interface NormalizeResult {
  values: number[];
  min: number;
  max: number;
  mean: number;
  stdDev: number;
}

/**
 * Histogram Types
 */
export interface HistogramInput {
  data: number[];
  bins?: number;
}

export interface HistogramBin {
  lower: number;
  upper: number;
  count: number;
  frequency: number;
}

export interface HistogramResult {
  bins: HistogramBin[];
  binWidth: number;
  totalCount: number;
}

/**
 * Weighted Score Types
 */
export interface WeightedScoreInput {
  criteria: string[];
  weights: number[];
  alternatives: string[];
  scores: number[][];
}

export interface WeightedScoreAlternative {
  name: string;
  totalScore: number;
  rank: number;
  weightedScores: number[];
}

export interface WeightedScoreResult {
  rankings: WeightedScoreAlternative[];
  normalizedWeights: number[];
}
