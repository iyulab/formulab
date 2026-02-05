import { roundTo } from '../utils.js';
import type { TorqueInput, TorqueResult } from './types.js';

// Torque conversion constants
// 1 Nm = 0.10197 kgf·m
// 1 Nm = 0.73756 ft·lbf
const NM_TO_KGFM = 0.10197;
const NM_TO_FTLBF = 0.73756;

/**
 * Convert torque between different units
 *
 * Units:
 * - Nm (Newton-meter)
 * - kgf·m (kilogram-force meter)
 * - ft·lbf (foot-pound force)
 *
 * @param input - Torque value with source unit
 * @returns Torque in all units
 */
export function torque(input: TorqueInput): TorqueResult {
  const { fromUnit, value } = input;

  // Handle zero value
  if (value === 0) {
    return {
      Nm: 0,
      kgfm: 0,
      ftlbf: 0,
    };
  }

  let nm: number;

  // Convert input to Nm as intermediate value
  switch (fromUnit) {
    case 'Nm':
      nm = value;
      break;
    case 'kgfm':
      // kgf·m to Nm: 1 kgf·m = 9.80665 Nm
      nm = value / NM_TO_KGFM;
      break;
    case 'ftlbf':
      // ft·lbf to Nm: 1 ft·lbf = 1.35582 Nm
      nm = value / NM_TO_FTLBF;
      break;
    default:
      nm = value;
  }

  // Convert Nm to all other units
  return {
    Nm: roundTo(nm, 2),
    kgfm: roundTo(nm * NM_TO_KGFM, 3),
    ftlbf: roundTo(nm * NM_TO_FTLBF, 3),
  };
}
