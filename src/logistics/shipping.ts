import { roundTo } from '../utils.js';
import type { ShippingInput, ShippingResult } from './types.js';

/**
 * Calculate shipping cost estimate for different modes
 *
 * Supports multiple shipping modes:
 * - Ocean FCL (Full Container Load): Fixed container rate
 * - Ocean LCL (Less than Container Load): Per CBM or weight
 * - Air Freight: Volumetric weight factor
 * - Express Courier: Premium volumetric rates
 * - Truck: Distance + weight based
 *
 * @param input - Shipment details
 * @returns Cost estimate or null if invalid input
 */
export function shipping(input: ShippingInput): ShippingResult | null {
  const { mode, weight, volume, distance } = input;

  if (weight <= 0 || volume <= 0) return null;

  let volumetricWeight: number;
  let estimatedCost: number;
  let transitDays: string;
  let notes: string;

  switch (mode) {
    case 'ocean_fcl': {
      volumetricWeight = roundTo((volume * 1000) / 6, 2);
      const base = 1500;
      const extra = weight > 10000 ? (weight - 10000) * 0.5 : 0;
      estimatedCost = roundTo(base + extra, 2);
      transitDays = '20-40 days';
      notes = 'Based on 20ft container. For 40ft, approximately double the base rate.';
      break;
    }
    case 'ocean_lcl': {
      volumetricWeight = roundTo((volume * 1000) / 6, 2);
      const byCbm = volume * 50;
      const byWeight = weight * 0.15;
      estimatedCost = roundTo(Math.max(byCbm, byWeight, 100), 2);
      transitDays = '25-45 days';
      notes = 'Charged per CBM or per kg, whichever is higher. Minimum charge $100.';
      break;
    }
    case 'air': {
      volumetricWeight = roundTo(volume * 167, 2);
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
      volumetricWeight = roundTo(volume * 200, 2);
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
      if (distance == null || distance <= 0) return null;
      volumetricWeight = roundTo(volume * 333, 2);
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
      return null;
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
