import { roundTo } from '../utils.js';
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
 */
export function transformerLoss(input: TransformerLossInput): TransformerLossResult {
  const {
    ratedCapacity,
    coreLoss,
    copperLoss,
    loadFraction,
    powerFactor = 0.85,
    operatingHours,
    energyCost,
  } = input;

  if (ratedCapacity <= 0 || coreLoss < 0 || copperLoss < 0) {
    return {
      outputPower: 0,
      totalLoss: 0,
      coreLossAtLoad: 0,
      copperLossAtLoad: 0,
      efficiency: 0,
      optimalLoadFraction: 0,
      annualLossEnergy: null,
      annualLossCost: null,
    };
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
