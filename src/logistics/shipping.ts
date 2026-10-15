import { roundTo, requireFinite } from '../utils.js';
import type { ShippingInput, ShippingResult } from './types.js';
import { VOLUMETRIC_KG_PER_M3 } from './chargeableWeight.js';

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
    throw new RangeError('weight must be greater than 0');
  }
  if (volume <= 0) {
    throw new RangeError('volume must be greater than 0');
  }

  let volumetricWeight: number;
  let estimatedCost: number;
  let transitDays: string;
  let notes: string;

  switch (mode) {
    case 'ocean_fcl': {
      volumetricWeight = roundTo(volume * VOLUMETRIC_KG_PER_M3.ocean, 2);
      const base = 1500;
      const extra = weight > 10000 ? (weight - 10000) * 0.5 : 0;
      estimatedCost = roundTo(base + extra, 2);
      transitDays = '20-40 days';
      notes = 'Based on 20ft container. For 40ft, approximately double the base rate.';
      break;
    }
    case 'ocean_lcl': {
      volumetricWeight = roundTo(volume * VOLUMETRIC_KG_PER_M3.ocean, 2);
      // Weight or measure: the greater of tonnes and m³ is the revenue tonne count.
      const revenueTons = Math.max(weight / 1000, volume);
      estimatedCost = roundTo(Math.max(revenueTons * 50, 100), 2);
      transitDays = '25-45 days';
      notes = 'Charged per revenue tonne (W/M: the greater of tonnes or m³) at $50. Minimum charge $100.';
      break;
    }
    case 'air': {
      volumetricWeight = roundTo(volume * VOLUMETRIC_KG_PER_M3.air, 2);
      const chargeableWt = Math.max(weight, volumetricWeight);
      estimatedCost = roundTo(chargeableWt * 3.5, 2);
      transitDays = '3-7 days';
      notes = 'Volumetric factor: 1 CBM = 167 kg. Rate: $3.50/kg chargeable weight.';
      const result: ShippingResult = {
        mode: 'Air Freight',
        chargeableWeight: roundTo(chargeableWt, 2),
        volumetricWeight,
        estimatedCost,
        costPerKg: roundTo(estimatedCost / chargeableWt, 2),
        transitDays,
        notes,
      };
      return result;
    }
    case 'express': {
      volumetricWeight = roundTo(volume * VOLUMETRIC_KG_PER_M3.express, 2);
      const chargeableWt = Math.max(weight, volumetricWeight);
      estimatedCost = roundTo(Math.max(chargeableWt * 8, 50), 2);
      transitDays = '2-5 days';
      notes = 'Volumetric factor: 1 CBM = 200 kg. Rate: $8/kg. Minimum charge $50.';
      const result: ShippingResult = {
        mode: 'Express Courier',
        chargeableWeight: roundTo(chargeableWt, 2),
        volumetricWeight,
        estimatedCost,
        costPerKg: roundTo(estimatedCost / chargeableWt, 2),
        transitDays,
        notes,
      };
      return result;
    }
    case 'truck': {
      if (distance == null || distance <= 0) {
        throw new RangeError('distance must be greater than 0 for truck mode');
      }
      volumetricWeight = roundTo(volume * VOLUMETRIC_KG_PER_M3.truck, 2);
      const chargeableWt = Math.max(weight, volumetricWeight);
      estimatedCost = roundTo(distance * 1.5 + weight * 0.02, 2);
      const transitDaysNum = Math.max(1, Math.ceil(distance / 500));
      transitDays = transitDaysNum === 1 ? '1 day' : `${transitDaysNum}-${transitDaysNum + 1} days`;
      notes = `Rate: $1.50/km + $0.02/kg. Estimated ~${roundTo(distance / 500, 1)} driving days at 500 km/day.`;
      const result: ShippingResult = {
        mode: 'Truck',
        chargeableWeight: roundTo(chargeableWt, 2),
        volumetricWeight,
        estimatedCost,
        costPerKg: roundTo(estimatedCost / chargeableWt, 2),
        transitDays,
        notes,
      };
      return result;
    }
    default:
      throw new RangeError('unknown shipping mode: ' + mode);
  }

  // For ocean modes
  const chargeableWeight = roundTo(Math.max(weight, volumetricWeight), 2);
  const modeLabels: Record<string, string> = {
    ocean_fcl: 'Ocean FCL (20ft)',
    ocean_lcl: 'Ocean LCL',
  };

  return {
    mode: modeLabels[mode] ?? mode,
    chargeableWeight,
    volumetricWeight,
    estimatedCost,
    costPerKg: roundTo(estimatedCost / chargeableWeight, 2),
    transitDays,
    notes,
  };
}
