import { roundTo, requireFinite } from '../utils.js';
import type { TransformerLossInput, TransformerLossResult } from './types.js';

/**
 * Calculate transformer losses and efficiency.
 *
 * totalLoss = coreLoss + copperLoss × loadFraction²
 * efficiency = (outputPower / (outputPower + totalLoss)) × 100
 * optimalLoad = √(coreLoss / copperLoss)
 *
 * @param input - Transformer parameters
 * @returns Transformer loss result with efficiency and optimal loading
 * @throws {RangeError} ratedCapacity is not greater than 0; loadFraction or powerFactor is outside
 *   [0, 1]; or coreLoss, copperLoss, operatingHours or energyCost is negative
 */
export function transformerLoss(input: TransformerLossInput): TransformerLossResult {
  requireFinite('transformerLoss', input);
  const {
    ratedCapacity,
    coreLoss,
    copperLoss,
    loadFraction,
    powerFactor = 0.85,
    operatingHours,
    energyCost,
  } = input;

  // A transformer with no rating carries nothing; a negative loss, duration or price flips the
  // sign of a loss or cost, and the load share and power factor are fractions.
  if (!(ratedCapacity > 0)) {
    throw new RangeError('ratedCapacity must be greater than 0');
  }
  if (!(coreLoss >= 0)) {
    throw new RangeError('coreLoss must not be negative');
  }
  if (!(copperLoss >= 0)) {
    throw new RangeError('copperLoss must not be negative');
  }
  if (!(loadFraction >= 0) || loadFraction > 1) {
    throw new RangeError('loadFraction must be between 0 and 1');
  }
  if (!(powerFactor >= 0) || powerFactor > 1) {
    throw new RangeError('powerFactor must be between 0 and 1');
  }
  if (operatingHours !== undefined && !(operatingHours >= 0)) {
    throw new RangeError('operatingHours must not be negative');
  }
  if (energyCost !== undefined && !(energyCost >= 0)) {
    throw new RangeError('energyCost must not be negative');
  }

  // Output power in W = kVA × loadFraction × powerFactor × 1000
  const outputPower = ratedCapacity * loadFraction * powerFactor * 1000;

  // Core loss is constant regardless of load
  const coreLossAtLoad = coreLoss;

  // Copper loss scales with square of load fraction
  const copperLossAtLoad = copperLoss * loadFraction * loadFraction;

  const totalLoss = coreLossAtLoad + copperLossAtLoad;

  // Efficiency = output / (output + losses) × 100
  let efficiency = 0;
  if (outputPower + totalLoss > 0) {
    efficiency = (outputPower / (outputPower + totalLoss)) * 100;
  }

  // Optimal load fraction where core loss = copper loss at load
  // coreLoss = copperLoss × k² → k = √(coreLoss / copperLoss)
  let optimalLoadFraction = 0;
  if (copperLoss > 0) {
    optimalLoadFraction = Math.sqrt(coreLoss / copperLoss);
  }

  let annualLossEnergy: number | null = null;
  let annualLossCost: number | null = null;
  if (operatingHours !== undefined) {
    annualLossEnergy = (totalLoss * operatingHours) / 1000; // W·h → kWh
    if (energyCost !== undefined) {
      annualLossCost = annualLossEnergy * energyCost;
    }
  }

  return {
    outputPower: roundTo(outputPower, 4),
    totalLoss: roundTo(totalLoss, 4),
    coreLossAtLoad: roundTo(coreLossAtLoad, 4),
    copperLossAtLoad: roundTo(copperLossAtLoad, 4),
    efficiency: roundTo(efficiency, 4),
    optimalLoadFraction: roundTo(optimalLoadFraction, 4),
    annualLossEnergy: annualLossEnergy !== null ? roundTo(annualLossEnergy, 4) : null,
    annualLossCost: annualLossCost !== null ? roundTo(annualLossCost, 2) : null,
  };
}
