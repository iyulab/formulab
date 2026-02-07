import { roundTo } from '../utils.js';
import type { ChargingLossInput, ChargingLossResult } from './types.js';

// Default charger efficiencies by type
const DEFAULT_CHARGER_EFFICIENCY: Record<string, number> = {
  ac_l1: 0.85,
  ac_l2: 0.90,
  dc_fast: 0.93,
};

/**
 * EV Charging Loss Calculator
 *
 * @formula
 *   - energyDelivered = batteryCapacity × (targetSoc − soc) / 100
 *   - energyConsumed = energyDelivered / (chargerEff × batteryEff)
 *   - totalLoss = energyConsumed − energyDelivered
 *   - chargingTime = energyConsumed / effectivePower
 *
 * @reference SAE J1772 — Electric Vehicle Charging
 * @reference IEC 61851 — Electric vehicle conductive charging system
 */
export function chargingLoss(input: ChargingLossInput): ChargingLossResult {
  const {
    batteryCapacity, chargerPower, chargerType,
    batteryEfficiency = 0.95,
    soc, ambientTemp,
  } = input;

  const chargerEfficiency = input.chargerEfficiency ?? DEFAULT_CHARGER_EFFICIENCY[chargerType] ?? 0.90;
  const targetSoc = input.targetSoc ?? (chargerType === 'dc_fast' ? 80 : 100);

  // Temperature derating
  let derating = 1.0;
  if (ambientTemp != null) {
    if (ambientTemp < 0) {
      derating = 0.70; // Cold weather significant derating
    } else if (ambientTemp < 10) {
      derating = 0.85;
    } else if (ambientTemp > 40) {
      derating = 0.90;
    } else if (ambientTemp > 35) {
      derating = 0.95;
    }
  }

  const effectivePower = chargerPower * derating;

  // Energy calculations
  const energyDelivered = batteryCapacity * (targetSoc - soc) / 100;
  const overallEff = chargerEfficiency * batteryEfficiency;
  const energyConsumed = overallEff > 0 ? energyDelivered / overallEff : 0;
  const totalLoss = energyConsumed - energyDelivered;

  // Loss breakdown
  const chargerLoss = energyConsumed * (1 - chargerEfficiency);
  const batteryLoss = (energyConsumed - chargerLoss) * (1 - batteryEfficiency);

  // Charging time
  const chargingTime = effectivePower > 0 ? energyConsumed / effectivePower : 0;

  return {
    energyDelivered: roundTo(energyDelivered, 2),
    energyConsumed: roundTo(energyConsumed, 2),
    totalLoss: roundTo(totalLoss, 2),
    overallEfficiency: roundTo(overallEff * 100, 2),
    chargerLoss: roundTo(chargerLoss, 2),
    batteryLoss: roundTo(batteryLoss, 2),
    chargingTime: roundTo(chargingTime, 2),
    effectivePower: roundTo(effectivePower, 2),
  };
}
