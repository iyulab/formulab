import { roundTo, requireFinite } from '../utils.js';
import type { InsulationRoiInput, InsulationRoiResult } from './types.js';
import { inputRangeError } from '../errors.js';

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
 * @throws RangeError if surfaceArea, tempDifference, insulationK, insulationThickness,
 *   surfaceCoefficient or boilerEfficiency is not greater than 0, boilerEfficiency is above 1,
 *   or operatingHours, energyCost or installationCost is negative
 */
export function insulationRoi(input: InsulationRoiInput): InsulationRoiResult {
  requireFinite('insulationRoi', input);
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

  if (!(surfaceArea > 0)) {
    throw inputRangeError('surfaceArea must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'surfaceArea', exclusive_min: 0, got: surfaceArea,
    });
  }
  if (!(tempDifference > 0)) {
    throw inputRangeError('tempDifference must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'tempDifference', exclusive_min: 0, got: tempDifference,
    });
  }
  if (!(insulationK > 0)) {
    throw inputRangeError('insulationK must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'insulationK', exclusive_min: 0, got: insulationK,
    });
  }
  if (!(insulationThickness > 0)) {
    throw inputRangeError('insulationThickness must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'insulationThickness', exclusive_min: 0, got: insulationThickness,
    });
  }
  if (!(surfaceCoefficient > 0)) {
    throw inputRangeError('surfaceCoefficient must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'surfaceCoefficient', exclusive_min: 0, got: surfaceCoefficient,
    });
  }
  if (!(boilerEfficiency > 0) || boilerEfficiency > 1) {
    throw inputRangeError('boilerEfficiency must be greater than 0 and at most 1', {
      code: 'parameter_out_of_range', parameter: 'boilerEfficiency', exclusive_min: 0, max: 1, got: boilerEfficiency,
    });
  }
  if (!(operatingHours >= 0)) {
    throw inputRangeError('operatingHours must not be negative', {
      code: 'parameter_out_of_range', parameter: 'operatingHours', min: 0, got: operatingHours,
    });
  }
  if (!(energyCost >= 0)) {
    throw inputRangeError('energyCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'energyCost', min: 0, got: energyCost,
    });
  }
  if (installationCost !== undefined && !(installationCost >= 0)) {
    throw inputRangeError('installationCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'installationCost', min: 0, got: installationCost,
    });
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
