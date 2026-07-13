import { roundTo } from '../utils.js';
import type { VocEmissionsInput, VocEmissionsResult } from './types.js';

/**
 * Calculate VOC (Volatile Organic Compound) emissions after capture/destruction
 *
 * @formula emitted = total × (1 - captureEff × destructionEff)
 * @reference EPA AP-42, CARB guidelines
 * @param input - Total VOC, capture efficiency, destruction efficiency
 * @returns Emitted, captured, and destroyed VOC amounts. totalVocKg = 0 (no VOC used)
 *   is valid-but-degenerate: reductionPercent is reported as 0.
 * @throws {RangeError} totalVocKg < 0, or an efficiency outside [0, 1]
 */
export function vocEmissions(input: VocEmissionsInput): VocEmissionsResult {
  const { totalVocKg, captureEfficiency, destructionEfficiency } = input;

  if (totalVocKg < 0) {
    throw new RangeError('totalVocKg must not be negative');
  }
  if (captureEfficiency < 0 || captureEfficiency > 1) {
    throw new RangeError('captureEfficiency must be between 0 and 1');
  }
  if (destructionEfficiency < 0 || destructionEfficiency > 1) {
    throw new RangeError('destructionEfficiency must be between 0 and 1');
  }

  const capturedVocKg = roundTo(totalVocKg * captureEfficiency, 2);
  const destroyedVocKg = roundTo(capturedVocKg * destructionEfficiency, 2);
  const emittedVocKg = roundTo(totalVocKg - destroyedVocKg, 2);
  // totalVocKg = 0 is valid-but-degenerate — report 0%, not NaN
  const reductionPercent = totalVocKg > 0
    ? roundTo((destroyedVocKg / totalVocKg) * 100, 2)
    : 0;

  return {
    emittedVocKg,
    capturedVocKg,
    destroyedVocKg,
    reductionPercent,
  };
}
