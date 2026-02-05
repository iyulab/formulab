import type { PhInput, PhResult, BufferSystem } from './types.js';
import { roundTo } from '../utils.js';

/**
 * pKa values at 25C for common buffer systems
 */
const PKA_VALUES: Record<Exclude<BufferSystem, 'custom'>, number> = {
  acetate: 4.76,    // acetic acid / acetate
  phosphate: 7.20,  // H2PO4- / HPO4^2- (pKa2)
  tris: 8.07,       // Tris base / Tris-H+
  citrate: 6.40,    // citric acid pKa3
  carbonate: 6.35,  // H2CO3 / HCO3- (pKa1)
};

/**
 * Temperature coefficient (dpKa/dT) for buffer systems
 * Typical range: -0.03 to +0.01 per degree C
 */
const DPKA_DT: Record<Exclude<BufferSystem, 'custom'>, number> = {
  acetate: 0.0,     // negligible
  phosphate: -0.0028, // slight decrease
  tris: -0.028,     // significant decrease at higher temp
  citrate: -0.002,
  carbonate: -0.0055,
};

/**
 * Calculate pH for buffer solutions using Henderson-Hasselbalch equation.
 *
 * pH = pKa + log10([A-]/[HA])
 *
 * Also calculates buffer capacity and effective range.
 *
 * @param input - pH calculation input with buffer system and concentrations
 * @returns pH result with pKa, buffer capacity, and effective range
 */
export function ph(input: PhInput): PhResult {
  const { bufferSystem, acidConcentration, baseConcentration, temperature, customPka } = input;

  // Guard against invalid acid concentration
  if (acidConcentration <= 0) {
    return {
      pH: 0,
      pKa: 0,
      bufferCapacity: 0,
      effectiveRange: { min: 0, max: 0 },
    };
  }

  // Get base pKa at 25C
  let pKaBase: number;
  let dpKadT: number;

  if (bufferSystem === 'custom') {
    pKaBase = customPka ?? 7.0;
    dpKadT = 0;
  } else {
    pKaBase = PKA_VALUES[bufferSystem];
    dpKadT = DPKA_DT[bufferSystem];
  }

  // Apply temperature correction
  const tempDiff = temperature - 25;
  const pKa = pKaBase + dpKadT * tempDiff;

  // Henderson-Hasselbalch: pH = pKa + log10([A-]/[HA])
  const ratio = baseConcentration / acidConcentration;
  const pH = pKa + Math.log10(ratio);

  // Buffer capacity (simplified): beta = 2.303 * C * Ka * [H+] / (Ka + [H+])^2
  // Approximation: at pH = pKa, capacity is maximized at ~0.576 * C
  const totalConcentration = acidConcentration + baseConcentration;
  const bufferCapacity = 0.576 * totalConcentration * (1 - Math.abs(ratio - 1) / (ratio + 1));

  // Effective buffer range: pKa +/- 1
  const effectiveRange = {
    min: roundTo(pKa - 1, 2),
    max: roundTo(pKa + 1, 2),
  };

  return {
    pH: roundTo(pH, 2),
    pKa: roundTo(pKa, 2),
    bufferCapacity: roundTo(bufferCapacity, 4),
    effectiveRange,
  };
}

/**
 * Round to specified decimal places
 */
