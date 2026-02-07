import { roundTo } from '../utils.js';
import type { InsulationRoiInput, InsulationRoiResult } from './types.js';

/**
 * Calculate insulation ROI for pipes, vessels, or surfaces.
 *
 * bareHeatLoss = surfaceCoefficient × area × ΔT
 * insulatedHeatLoss = area × ΔT / (1/surfaceCoefficient + thickness/k)
 * annualEnergySaved = (bare − insulated) × hours / 1000 / boilerEfficiency
 * payback = installationCost / annualCostSaved
 *
 * @param input - Insulation parameters
 * @returns Insulation ROI result with heat savings and payback
 */
export function insulationRoi(input: InsulationRoiInput): InsulationRoiResult {
  const {
    surfaceArea,
    tempDifference,
    insulationK,
    insulationThickness,
    surfaceCoefficient = 10,
    operatingHours,
    energyCost,
    boilerEfficiency = 0.8,
    installationCost,
  } = input;

  if (surfaceArea <= 0 || tempDifference <= 0 || insulationK <= 0 || insulationThickness <= 0) {
    return {
      bareHeatLoss: 0,
      insulatedHeatLoss: 0,
      heatSaved: 0,
      heatLossReduction: 0,
      annualEnergySaved: 0,
      annualCostSaved: 0,
      paybackPeriod: null,
    };
  }

  // Bare surface heat loss: Q = h × A × ΔT (W)
  const bareHeatLoss = surfaceCoefficient * surfaceArea * tempDifference;

  // Insulated heat loss: Q = A × ΔT / (1/h + thickness_m / k)
  const thicknessM = insulationThickness / 1000; // mm → m
  const thermalResistance = (1 / surfaceCoefficient) + (thicknessM / insulationK);
  const insulatedHeatLoss = (surfaceArea * tempDifference) / thermalResistance;

  const heatSaved = bareHeatLoss - insulatedHeatLoss;
  const heatLossReduction = bareHeatLoss > 0 ? (heatSaved / bareHeatLoss) * 100 : 0;

  // Annual energy saved (kWh) = heat saved (W) × hours / 1000 / boiler efficiency
  // Divide by boiler efficiency because saved heat = saved fuel input
  const annualEnergySaved = (heatSaved * operatingHours) / 1000 / boilerEfficiency;
  const annualCostSaved = annualEnergySaved * energyCost;

  let paybackPeriod: number | null = null;
  if (installationCost !== undefined && installationCost > 0 && annualCostSaved > 0) {
    paybackPeriod = installationCost / annualCostSaved;
  }

  return {
    bareHeatLoss: roundTo(bareHeatLoss, 4),
    insulatedHeatLoss: roundTo(insulatedHeatLoss, 4),
    heatSaved: roundTo(heatSaved, 4),
    heatLossReduction: roundTo(heatLossReduction, 4),
    annualEnergySaved: roundTo(annualEnergySaved, 4),
    annualCostSaved: roundTo(annualCostSaved, 2),
    paybackPeriod: paybackPeriod !== null ? roundTo(paybackPeriod, 4) : null,
  };
}
