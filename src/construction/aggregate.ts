import type { AggregateInput, AggregateResult, AggregateType, AggregateDensity } from './types.js';
import { roundTo, requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

/**
 * Common aggregate densities (kg/m³)
 */
export const AGGREGATE_DENSITIES: AggregateDensity[] = [
  { type: 'gravel', density: 1850, label: 'Gravel' },
  { type: 'sand', density: 1600, label: 'Sand' },
  { type: 'crushed_stone', density: 1600, label: 'Crushed Stone' },
  { type: 'topsoil', density: 1100, label: 'Topsoil' },
  { type: 'mulch', density: 400, label: 'Mulch' },
  { type: 'custom', density: null, label: 'Custom' },
];

/**
 * Get density for a specific aggregate type
 *
 * @param type - Aggregate type
 * @returns Density in kg/m³, or `null` for `'custom'` — it has no table density
 * @throws {RangeError} the type is not in the table
 */
export function getAggregateDensity(type: AggregateType): number | null {
  requireFinite('getAggregateDensity', type);
  const aggregate = AGGREGATE_DENSITIES.find(a => a.type === type);
  // A density of 0 for an unknown type would turn every volume into 0 kg.
  if (!aggregate) {
    throw new RangeError(`unknown aggregate type: ${String(type)}`);
  }
  return aggregate.density;
}

/**
 * Calculate how much area can be covered with a given volume at a specific depth
 *
 * @throws {RangeError} Volume and depth must be greater than zero
 * @param volumeM3 - Volume in cubic meters
 * @param depthCm - Depth in centimeters
 * @returns Coverage area in square meters
 */
export function aggregateCoverage(volumeM3: number, depthCm: number): number {
  requireFinite('aggregateCoverage', { volumeM3, depthCm });
  if (volumeM3 <= 0 || depthCm <= 0) {
    throw new RangeError('Volume and depth must be greater than zero');
  }
  const depthM = depthCm / 100;
  return roundTo(volumeM3 / depthM, 2);
}

/**
 * Calculate aggregate volume, weight, and coverage
 *
 * Formulas:
 * - Volume = length × width × depth
 * - Weight = volume × density
 * - Coverage area = length × width (footprint)
 *
 * @throws {RangeError} All dimensions must be greater than zero
 * @throws {RangeError} Custom density must be provided and greater than zero
 * @throws {RangeError} Unknown aggregate type: {aggregateType}
 * @param input - Aggregate input parameters
 * @returns Aggregate calculation results
 */
export function aggregate(input: AggregateInput): AggregateResult {
  requireFinite('aggregate', input);
  const { length, width, depth, depthUnit, aggregateType, customDensity } = input;

  // Validate inputs
  if (length <= 0 || width <= 0 || depth <= 0) {
    throw new RangeError('All dimensions must be greater than zero');
  }

  // Convert depth to meters if in centimeters
  const depthInMeters = depthUnit === 'centimeters' ? depth / 100 : depth;

  // Get density based on aggregate type
  let density: number;
  if (aggregateType === 'custom') {
    if (customDensity === undefined || customDensity <= 0) {
      throw inputRangeError('Custom density must be provided and greater than zero', {
        code: 'parameter_out_of_range', parameter: 'customDensity', exclusive_min: 0, got: customDensity ?? undefined,
      });
    }
    density = customDensity;
  } else {
    const aggregateInfo = AGGREGATE_DENSITIES.find(a => a.type === aggregateType);
    if (!aggregateInfo || aggregateInfo.density === null) {
      throw new RangeError(`Unknown aggregate type: ${aggregateType}`);
    }
    density = aggregateInfo.density;
  }

  // Calculate volume (m³)
  const volume = roundTo(length * width * depthInMeters, 3);

  // Calculate weight (kg)
  const weight = roundTo(volume * density, 2);

  // Convert to metric tonnes
  const weightTonnes = roundTo(weight / 1000, 3);

  // Coverage area is simply length × width (the footprint)
  const coverageArea = roundTo(length * width, 2);

  // Calculate bags needed
  const bags20kg = Math.ceil(weight / 20);
  const bags25kg = Math.ceil(weight / 25);

  return {
    volume,
    weight,
    weightTonnes,
    coverageArea,
    density,
    bags20kg,
    bags25kg,
  };
}
