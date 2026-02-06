import { roundTo } from '../utils.js';
import type { VocEmissionsInput, VocEmissionsResult } from './types.js';

/**
 * Calculate VOC (Volatile Organic Compound) emissions after capture/destruction
 *
 * @formula emitted = total × (1 - captureEff × destructionEff)
 * @reference EPA AP-42, CARB guidelines
 * @param input - Total VOC, capture efficiency, destruction efficiency
 * @returns Emitted, captured, and destroyed VOC amounts
 */
export function vocEmissions(input: VocEmissionsInput): VocEmissionsResult {
  const { totalVocKg, captureEfficiency, destructionEfficiency } = input;

  const capturedVocKg = roundTo(totalVocKg * captureEfficiency, 2);
  const destroyedVocKg = roundTo(capturedVocKg * destructionEfficiency, 2);
  const emittedVocKg = roundTo(totalVocKg - destroyedVocKg, 2);
  const reductionPercent = roundTo((destroyedVocKg / totalVocKg) * 100, 2);

  return {
    emittedVocKg,
    capturedVocKg,
    destroyedVocKg,
    reductionPercent,
  };
}
