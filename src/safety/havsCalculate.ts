import type { HavsInput, HavsResult, ToolExposure } from './types.js';

// Exposure Action Value (EAV) = 2.5 m/s²
const EAV = 2.5;

// Exposure Limit Value (ELV) = 5.0 m/s²
const ELV = 5.0;

// Reference period T0 = 8 hours
const T0 = 8;

/**
 * Calculate partial A(8) exposure for a single tool
 * Formula: A_partial = a_hv × sqrt(T / T0)
 * Where:
 * - a_hv = vibration magnitude (m/s²)
 * - T = exposure time (hours)
 * - T0 = reference period (8 hours)
 */
function calculatePartialExposure(tool: ToolExposure): number {
  const { vibrationMagnitude, exposureTime } = tool;
  if (vibrationMagnitude <= 0 || exposureTime <= 0) return 0;
  return vibrationMagnitude * Math.sqrt(exposureTime / T0);
}

/**
 * Calculate total daily A(8) exposure from multiple tools
 * Formula: A(8) = sqrt(sum(A_partial²))
 */
function calculateTotalA8(partialExposures: number[]): number {
  const sumOfSquares = partialExposures.reduce((sum, a) => sum + a * a, 0);
  return Math.sqrt(sumOfSquares);
}

/**
 * Calculate exposure points (100 points = EAV)
 * Formula: points = (A(8) / EAV)² × 100
 */
function calculateExposurePoints(a8: number): number {
  return Math.pow(a8 / EAV, 2) * 100;
}

/**
 * Determine exposure status based on A(8) value
 */
function determineStatus(a8: number): 'safe' | 'action' | 'limit' {
  if (a8 >= ELV) return 'limit';
  if (a8 >= EAV) return 'action';
  return 'safe';
}

/**
 * Calculate maximum safe daily exposure time at current weighted average vibration level
 * Formula: T_max = T0 × (EAV / a_avg)²
 * Where a_avg is the weighted average vibration magnitude
 */
function calculateMaxDailyExposure(tools: ToolExposure[]): number {
  const totalTime = tools.reduce((sum, t) => sum + t.exposureTime, 0);
  if (totalTime <= 0) return T0;

  // Calculate time-weighted average vibration magnitude squared
  const sumVibSquaredTime = tools.reduce(
    (sum, t) => sum + t.vibrationMagnitude * t.vibrationMagnitude * t.exposureTime,
    0
  );
  const avgVibSquared = sumVibSquaredTime / totalTime;

  if (avgVibSquared <= 0) return T0;

  // T_max = T0 × (EAV² / a_avg²)
  return T0 * (EAV * EAV) / avgVibSquared;
}

/**
 * Calculate Hand-Arm Vibration exposure based on ISO 5349 and EU Physical Agents Directive 2002/44/EC.
 *
 * A(8) = sqrt(sum(A_partial²))
 * Where A_partial = a_hv × sqrt(T / T0)
 *
 * Exposure Limits:
 * - EAV (Exposure Action Value) = 2.5 m/s²
 * - ELV (Exposure Limit Value) = 5.0 m/s²
 *
 * @param input - HAVS input parameters with tool exposures
 * @returns HAVS results including A(8), status, and exposure metrics
 */
export function havsCalculate(input: HavsInput): HavsResult {
  const { tools } = input;

  // Filter out empty entries
  const validTools = tools.filter(t => t.vibrationMagnitude > 0 && t.exposureTime > 0);

  // Calculate partial exposures for each tool
  const partialExposures = validTools.map(calculatePartialExposure);

  // Calculate total A(8)
  const a8 = calculateTotalA8(partialExposures);

  // Calculate percentages of limits
  const percentEAV = (a8 / EAV) * 100;
  const percentELV = (a8 / ELV) * 100;

  // Calculate exposure points
  const exposurePoints = calculateExposurePoints(a8);

  // Determine status
  const status = determineStatus(a8);

  // Calculate max daily exposure
  const maxDailyExposure = calculateMaxDailyExposure(validTools);

  return {
    a8,
    partialExposures,
    percentEAV,
    percentELV,
    exposurePoints,
    status,
    maxDailyExposure: Math.min(maxDailyExposure, T0),
  };
}
