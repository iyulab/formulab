import { roundTo, requireFinite } from '../utils.js';
import type { CarbonFootprintInput, CarbonFootprintResult } from './types.js';
import { InputRangeError } from '../errors.js';

// Constants for environmental equivalents
// Average tree absorbs ~21.76 kg CO2 per year (EPA estimate)
const KG_CO2_PER_TREE_PER_YEAR = 21.76;
// Average passenger vehicle emits ~4,600 kg CO2 per year (EPA estimate)
const KG_CO2_PER_CAR_PER_YEAR = 4600;

/**
 * Calculate carbon footprint from electricity usage
 *
 * CO2 (kg) = electricity usage (kWh) * emission factor (g CO2/kWh) / 1000
 * Trees equivalent = CO2 (kg) / 21.76 (kg CO2 absorbed per tree per year)
 * Cars equivalent = CO2 (kg) / 4600 (kg CO2 emitted per car per year)
 *
 * @param input - Carbon footprint input parameters
 * @returns Carbon footprint result with CO2 emissions and environmental equivalents
 * @throws {RangeError} electricityUsage or emissionFactor is negative
 */
export function carbonFootprint(input: CarbonFootprintInput): CarbonFootprintResult {
  requireFinite('carbonFootprint', input);
  const { electricityUsage, emissionFactor } = input;

  // A negative usage or emission factor would report a negative emission, which this
  // electricity-only model does not represent (offsets and credits are outside it).
  if (!(electricityUsage >= 0)) {
    throw new InputRangeError('electricityUsage must not be negative', {
      code: 'parameter_out_of_range', parameter: 'electricityUsage', min: 0, got: electricityUsage,
    });
  }
  if (!(emissionFactor >= 0)) {
    throw new InputRangeError('emissionFactor must not be negative', {
      code: 'parameter_out_of_range', parameter: 'emissionFactor', min: 0, got: emissionFactor,
    });
  }

  // Calculate CO2 emissions
  // emission factor is in g CO2/kWh, convert to kg
  const co2Kg = (electricityUsage * emissionFactor) / 1000;
  const co2Tonnes = co2Kg / 1000;

  // Calculate environmental equivalents
  const treesEquivalent = roundTo(co2Kg / KG_CO2_PER_TREE_PER_YEAR, 0);
  const carsEquivalent = co2Kg / KG_CO2_PER_CAR_PER_YEAR;

  return {
    co2Kg,
    co2Tonnes,
    treesEquivalent,
    carsEquivalent,
  };
}
