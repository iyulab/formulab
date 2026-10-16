import { roundTo, requireFinite } from '../utils.js';
import type { ShippingInput, ShippingResult, ShippingDays, ShippingTariff } from './types.js';
import { VOLUMETRIC_KG_PER_M3 } from './chargeableWeight.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate shipping cost estimate for different modes
 *
 * Supports multiple shipping modes:
 * - Ocean FCL (Full Container Load): Fixed container rate
 * - Ocean LCL (Less than Container Load): Per revenue tonne (weight or measure)
 * - Air Freight: Volumetric weight factor
 * - Express Courier: Premium volumetric rates
 * - Truck: Distance + weight based
 *
 * @param input - Shipment details
 * @returns Cost estimate
 * @throws RangeError if weight or volume is not positive, distance is not
 *   positive for truck mode, or the shipping mode is unknown
 */
export function shipping(input: ShippingInput): ShippingResult {
  requireFinite('shipping', input);
  const { mode, weight, volume, distance } = input;

  if (weight <= 0) {
    throw inputRangeError('weight must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'weight', exclusive_min: 0, got: weight,
    });
  }
  if (volume <= 0) {
    throw inputRangeError('volume must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'volume', exclusive_min: 0, got: volume,
    });
  }

  // The chargeable weight is the greater of actual and volumetric weight (per mode factor).
  const volumetricKgPerM3 = mode === 'ocean_fcl' || mode === 'ocean_lcl' ? VOLUMETRIC_KG_PER_M3.ocean
    : mode === 'air' ? VOLUMETRIC_KG_PER_M3.air
    : mode === 'express' ? VOLUMETRIC_KG_PER_M3.express
    : mode === 'truck' ? VOLUMETRIC_KG_PER_M3.truck
    : undefined;
  if (volumetricKgPerM3 === undefined) {
    throw inputRangeError('unknown shipping mode: ' + mode, {
      code: 'unknown_option', parameter: 'mode', got: String(mode),
    });
  }
  const volumetricWeight = roundTo(volume * volumetricKgPerM3, 2);
  const chargeableWeight = roundTo(Math.max(weight, volumetricWeight), 2);

  let estimatedCost: number;
  let transitDays: ShippingDays;
  let tariff: ShippingTariff;

  switch (mode) {
    case 'ocean_fcl': {
      const baseUsd = 1500;
      const extraFromKg = 10000;
      const extraUsdPerKg = 0.5;
      estimatedCost = roundTo(baseUsd + (weight > extraFromKg ? (weight - extraFromKg) * extraUsdPerKg : 0), 2);
      transitDays = { min: 20, max: 40 };
      tariff = { basis: 'container', containerFt: 20, baseUsd, extraFromKg, extraUsdPerKg };
      break;
    }
    case 'ocean_lcl': {
      // Weight or measure: the greater of tonnes and m³ is the revenue tonne count.
      const usdPerRevenueTonne = 50;
      const minimumUsd = 100;
      const revenueTonnes = Math.max(weight / 1000, volume);
      estimatedCost = roundTo(Math.max(revenueTonnes * usdPerRevenueTonne, minimumUsd), 2);
      transitDays = { min: 25, max: 45 };
      tariff = { basis: 'revenue_tonne', usdPerRevenueTonne, minimumUsd, revenueTonnes: roundTo(revenueTonnes, 3) };
      break;
    }
    case 'air': {
      const usdPerKg = 3.5;
      estimatedCost = roundTo(chargeableWeight * usdPerKg, 2);
      transitDays = { min: 3, max: 7 };
      tariff = { basis: 'chargeable_weight', usdPerKg, volumetricKgPerM3 };
      break;
    }
    case 'express': {
      const usdPerKg = 8;
      const minimumUsd = 50;
      estimatedCost = roundTo(Math.max(chargeableWeight * usdPerKg, minimumUsd), 2);
      transitDays = { min: 2, max: 5 };
      tariff = { basis: 'chargeable_weight', usdPerKg, volumetricKgPerM3, minimumUsd };
      break;
    }
    case 'truck': {
      if (distance == null || distance <= 0) {
        throw inputRangeError('distance must be greater than 0 for truck mode', {
          code: 'parameter_out_of_range', parameter: 'distance', exclusive_min: 0, got: distance ?? undefined,
        });
      }
      const usdPerKm = 1.5;
      const usdPerKg = 0.02;
      const kmPerDay = 500;
      estimatedCost = roundTo(distance * usdPerKm + weight * usdPerKg, 2);
      const days = Math.max(1, Math.ceil(distance / kmPerDay));
      transitDays = days === 1 ? { min: 1, max: 1 } : { min: days, max: days + 1 };
      tariff = { basis: 'distance_weight', usdPerKm, usdPerKg, kmPerDay, drivingDays: roundTo(distance / kmPerDay, 1) };
      break;
    }
  }

  return {
    mode,
    chargeableWeight,
    volumetricWeight,
    estimatedCost,
    costPerKg: roundTo(estimatedCost / chargeableWeight, 2),
    transitDays,
    tariff,
  };
}
