import type { RpnInput, RpnResult, RiskLevel } from './types.js';

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Get risk level classification based on RPN value
 * Standard FMEA risk level thresholds
 */
function getRiskLevel(rpnValue: number): RiskLevel {
  if (rpnValue <= 50) return 'low';
  if (rpnValue <= 100) return 'medium';
  if (rpnValue <= 200) return 'high';
  return 'critical';
}

/**
 * Clamp value to 1-10 scale
 */
function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

/**
 * Calculate Risk Priority Number (RPN) for FMEA analysis
 * RPN = Severity x Occurrence x Detection
 * Each factor is on a 1-10 scale, resulting in RPN range of 1-1000
 *
 * @param input - RPN input parameters
 * @returns RPN analysis result
 */
export function rpn(input: RpnInput): RpnResult {
  const { severity, occurrence, detection } = input;

  // Validate and clamp inputs to 1-10 scale
  const severityScore = clampScore(severity);
  const occurrenceScore = clampScore(occurrence);
  const detectionScore = clampScore(detection);

  // Calculate RPN
  const rpnValue = severityScore * occurrenceScore * detectionScore;

  return {
    rpn: roundTo(rpnValue, 0),
    riskLevel: getRiskLevel(rpnValue),
    severityScore,
    occurrenceScore,
    detectionScore,
  };
}
