import { roundTo, requireFinite } from '../utils.js';
import type { VocEmissionsInput, VocEmissionsResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate VOC (Volatile Organic Compound) emissions after capture/destruction
 *
 * @formula emitted = total × (1 - captureEff × destructionEff)
 * @reference EPA AP-42, CARB guidelines
 * @param input - Total VOC, capture efficiency, destruction efficiency
 * @returns Emitted, captured, and destroyed VOC amounts. With totalVocKg = 0 (no VOC
 *   used) reductionPercent is the abatement efficiency itself, capture × destruction.
 * @throws {RangeError} totalVocKg < 0, or an efficiency outside [0, 1]
 */
export function vocEmissions(input: VocEmissionsInput): VocEmissionsResult {
  requireFinite('vocEmissions', input);
  const { totalVocKg, captureEfficiency, destructionEfficiency } = input;

  if (totalVocKg < 0) {
    throw inputRangeError('totalVocKg must not be negative', {
      code: 'parameter_out_of_range', parameter: 'totalVocKg', min: 0, got: totalVocKg,
    });
  }
  if (captureEfficiency < 0 || captureEfficiency > 1) {
    throw inputRangeError('captureEfficiency must be between 0 and 1', {
      code: 'parameter_out_of_range', parameter: 'captureEfficiency', min: 0, max: 1, got: captureEfficiency,
    });
  }
  if (destructionEfficiency < 0 || destructionEfficiency > 1) {
    throw inputRangeError('destructionEfficiency must be between 0 and 1', {
      code: 'parameter_out_of_range', parameter: 'destructionEfficiency', min: 0, max: 1, got: destructionEfficiency,
    });
  }

  const capturedVocKg = roundTo(totalVocKg * captureEfficiency, 2);
  const destroyedVocKg = roundTo(capturedVocKg * destructionEfficiency, 2);
  const emittedVocKg = roundTo(totalVocKg - destroyedVocKg, 2);
  // With no VOC used there are no kilograms to compare, but the abatement train still has its
  // efficiency: captured share × destroyed share. A 0 % would read as «the system removes nothing».
  const reductionPercent = totalVocKg > 0
    ? roundTo((destroyedVocKg / totalVocKg) * 100, 2)
    : roundTo(captureEfficiency * destructionEfficiency * 100, 2);

  return {
    emittedVocKg,
    capturedVocKg,
    destroyedVocKg,
    reductionPercent,
  };
}
