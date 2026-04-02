/**
 * Standard Time Types
 */
export interface StandardTimeInput {
  observedTime: number;       // > 0
  ratingFactor: number;       // 0 < ratingFactor <= 2
  allowancePercent: number;   // 0-100
}

export interface StandardTimeResult {
  normalTime: number;
  standardTime: number;
  allowanceTime: number;
}

/**
 * Time Study Types
 */
export interface TimeStudyInput {
  observations: number[];   // at least 2, all > 0
  confidence: number;       // 0-1 (e.g. 0.95 for 95%)
  accuracy: number;         // percentage (e.g. 5 for ±5%)
}

export interface TimeStudyResult {
  mean: number;
  stdDev: number;
  count: number;
  requiredObservations: number;
  isSufficient: boolean;
}

/**
 * Work Sampling Types
 */
export interface WorkSamplingInput {
  totalObservations: number;      // > 0
  activityObservations: number;   // 0 <= activityObservations <= totalObservations
  confidence: number;             // 0-1 (e.g. 0.95)
  accuracy: number;               // percentage (e.g. 5 for ±5%)
}

export interface WorkSamplingResult {
  proportion: number;
  requiredObservations: number;
  isSufficient: boolean;
  marginOfError: number;
}

/**
 * VA/NVA Analysis Types
 */
export type ActivityCategory = 'VA' | 'NVA' | 'NNVA';

export interface Activity {
  name: string;
  duration: number;           // >= 0
  category: ActivityCategory;
}

export interface VaAnalysisInput {
  activities: Activity[];
}

export interface CategorySummary {
  count: number;
  totalDuration: number;
  ratio: number;              // 0-1
}

export interface VaAnalysisResult {
  totalDuration: number;
  va: CategorySummary;
  nva: CategorySummary;
  nnva: CategorySummary;
  vaRatio: number;            // 0-1
}

/**
 * Learning Curve Types
 */
export type LearningCurveModel = 'unit' | 'cumulative';

export interface LearningCurveInput {
  firstUnitTime: number;      // > 0
  learningRate: number;       // 0 < learningRate < 1
  unitNumber: number;         // >= 1, integer
  model?: LearningCurveModel; // default 'unit'
}

export interface LearningCurveResult {
  unitTime: number;
  cumulativeAverageTime: number;
  cumulativeTotalTime: number;
  learningExponent: number;   // b = ln(learningRate) / ln(2)
}
