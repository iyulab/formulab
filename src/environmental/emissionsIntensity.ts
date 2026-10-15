import { roundTo, requireFinite } from '../utils.js';
import type { EmissionsIntensityInput, EmissionsIntensityResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate emissions intensity across multiple metrics
 *
 * @formula kg/unit, kg/USD, kg/employee
 * @reference GHG Protocol, CDP
 * @param input - Total CO2 and normalization denominators
 * @returns Emissions intensity per unit, revenue, and/or employee
 * @throws {RangeError} totalCo2Kg is negative, or a given productionUnits, revenueUsd or employees
 *   is negative (a zero denominator leaves its field undefined)
 */
export function emissionsIntensity(input: EmissionsIntensityInput): EmissionsIntensityResult {
  requireFinite('emissionsIntensity', input);
  const { totalCo2Kg, productionUnits, revenueUsd, employees } = input;

  // Negative emissions (offsets, removals) are outside this intensity model, and a negative
  // denominator would flip the sign of an intensity instead of leaving it unreported.
  if (!(totalCo2Kg >= 0)) {
    throw inputRangeError('totalCo2Kg must not be negative', {
      code: 'parameter_out_of_range', parameter: 'totalCo2Kg', min: 0, got: totalCo2Kg,
    });
  }
  if (productionUnits != null && !(productionUnits >= 0)) {
    throw inputRangeError('productionUnits must not be negative', {
      code: 'parameter_out_of_range', parameter: 'productionUnits', min: 0, got: productionUnits,
    });
  }
  if (revenueUsd != null && !(revenueUsd >= 0)) {
    throw inputRangeError('revenueUsd must not be negative', {
      code: 'parameter_out_of_range', parameter: 'revenueUsd', min: 0, got: revenueUsd,
    });
  }
  if (employees != null && !(employees >= 0)) {
    throw inputRangeError('employees must not be negative', {
      code: 'parameter_out_of_range', parameter: 'employees', min: 0, got: employees,
    });
  }

  const kgPerUnit = productionUnits != null && productionUnits > 0
    ? roundTo(totalCo2Kg / productionUnits, 4)
    : undefined;

  const kgPerRevenue = revenueUsd != null && revenueUsd > 0
    ? roundTo(totalCo2Kg / revenueUsd, 6)
    : undefined;

  const kgPerEmployee = employees != null && employees > 0
    ? roundTo(totalCo2Kg / employees, 2)
    : undefined;

  const tonnesPerMillionUsd = revenueUsd != null && revenueUsd > 0
    ? roundTo((totalCo2Kg / 1000) / (revenueUsd / 1000000), 2)
    : undefined;

  return { kgPerUnit, kgPerRevenue, kgPerEmployee, tonnesPerMillionUsd };
}
