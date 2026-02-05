import { roundTo } from '../utils.js';
import type { PowerInput, PowerResult } from './types.js';

// Power conversion constants
// 1 kW = 1.34102 HP (mechanical horsepower)
// 1 kW = 1.35962 PS (metric horsepower)
const KW_TO_HP = 1.34102;
const KW_TO_PS = 1.35962;

/**
 * Convert power between different units
 *
 * Units:
 * - kW (kilowatt)
 * - HP (mechanical horsepower)
 * - PS (metric horsepower, Pferdestärke)
 *
 * @param input - Power value with source unit
 * @returns Power in all units
 */
export function power(input: PowerInput): PowerResult {
  const { fromUnit, value } = input;

  // Handle zero value
  if (value === 0) {
    return {
      kW: 0,
      HP: 0,
      PS: 0,
    };
  }

  let kw: number;

  // Convert input to kW as intermediate value
  switch (fromUnit) {
    case 'kW':
      kw = value;
      break;
    case 'HP':
      // HP to kW: 1 HP = 0.7457 kW
      kw = value / KW_TO_HP;
      break;
    case 'PS':
      // PS to kW: 1 PS = 0.7355 kW
      kw = value / KW_TO_PS;
      break;
    default:
      kw = value;
  }

  // Convert kW to all other units
  return {
    kW: roundTo(kw, 2),
    HP: roundTo(kw * KW_TO_HP, 2),
    PS: roundTo(kw * KW_TO_PS, 4),
  };
}
