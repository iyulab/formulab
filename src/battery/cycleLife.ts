import { roundTo } from '../utils.js';
import type { BatteryChemistry, CycleLifeInput, CycleLifeResult, DodCurve } from './types.js';

/**
 * Base cycle life by battery chemistry (at ~80% DOD, 25°C)
 * @reference Manufacturer datasheets, Battery University
 */
const BASE_CYCLE_LIFE: Record<BatteryChemistry, number> = {
  LFP: 3500,
  NMC: 1500,
  NCA: 1000,
  LTO: 15000,
  LCO: 800,
  LeadAcid: 500,
  NiMH: 600,
};

/**
 * Cycles to 70% capacity at each depth of discharge, transcribed from Battery University BU-808
 * "How to Prolong Lithium-based Batteries", Table 2 (NMC and LiPO4 columns; verified against the
 * page's HTML, 2026-09-29). Only the shape of each column is used: the DOD factor is a row divided by
 * the 80% row, so `BASE_CYCLE_LIFE` stays the datasheet figure at 80% DOD and the table says how depth
 * moves it.
 * @reference Battery University, BU-808, Table 2: Cycle life as a function of depth of discharge
 */
const BU808_TABLE2: Record<DodCurve, readonly (readonly [dod: number, cycles: number])[]> = {
  NMC: [[10, 6000], [20, 2000], [40, 1000], [60, 600], [80, 400], [100, 300]],
  LFP: [[10, 15000], [20, 9000], [40, 3000], [60, 1500], [80, 900], [100, 600]],
};

/**
 * Which BU-808 column a chemistry follows. The table has LiPO4 (LFP) and NMC columns only; every other
 * chemistry takes the NMC trend as an approximation, and the result says so (`dodCurve`).
 */
function dodCurveFor(chemistry: BatteryChemistry): DodCurve {
  return chemistry === 'LFP' ? 'LFP' : 'NMC';
}

/**
 * DOD factor: cycles at this depth over cycles at 80%, interpolated log-linearly between rows (cycle
 * counts fall roughly geometrically with depth). Below the table's shallowest row (10%) that row holds —
 * no extrapolation past the source — and the result discloses it (`dodBelowTable`).
 */
function getDodFactor(dod: number, curve: DodCurve): number {
  const rows = BU808_TABLE2[curve];
  const at80 = 80;
  const cyclesAt80 = rows.find(([d]) => d === at80)?.[1] ?? rows[0][1];
  if (dod <= rows[0][0]) return rows[0][1] / cyclesAt80;
  for (let i = 1; i < rows.length; i++) {
    const [d0, c0] = rows[i - 1];
    const [d1, c1] = rows[i];
    if (dod <= d1) {
      const t = (dod - d0) / (d1 - d0);
      return Math.exp(Math.log(c0) + t * (Math.log(c1) - Math.log(c0))) / cyclesAt80;
    }
  }
  return rows[rows.length - 1][1] / cyclesAt80;
}

/**
 * Temperature factor: how temperature affects cycle life
 * <0°C → 0.5, 0-15 → 0.8, 15-35 → 1.0, 35-45 → 0.8, >45 → 0.5
 * A qualitative step, not a transcribed table: BU-808 gives the direction (heat and cold both shorten
 * life) but no cycle-count-by-temperature figures to derive it from.
 */
function getTemperatureFactor(tempC: number): number {
  if (tempC < 0) return 0.5;
  if (tempC < 15) return 0.8;
  if (tempC <= 35) return 1.0;
  if (tempC <= 45) return 0.8;
  return 0.5;
}

/**
 * Estimate battery cycle life based on chemistry, DOD, and temperature
 *
 * @formula cycles = baseCycles × dodFactor × temperatureFactor,
 *   dodFactor = cycles(DOD) / cycles(80%) from BU-808 Table 2 (log-linear between rows)
 * @reference Battery University BU-808 Table 2 (DOD factor); manufacturer datasheets (base cycles at 80% DOD)
 * @param input - Chemistry type, DOD percentage, temperature
 * @returns Estimated cycle count with adjustment factors and the BU-808 column the DOD factor followed
 * @throws {RangeError} depthOfDischarge is not greater than 0 and at most 100, or the chemistry is unknown
 */
export function cycleLife(input: CycleLifeInput): CycleLifeResult {
  const { chemistry, depthOfDischarge, temperatureC } = input;

  if (!Number.isFinite(depthOfDischarge) || depthOfDischarge <= 0 || depthOfDischarge > 100) {
    throw new RangeError('depthOfDischarge must be greater than 0 and at most 100 (%)');
  }

  const baseCycles = BASE_CYCLE_LIFE[chemistry];
  if (baseCycles === undefined) {
    throw new RangeError(`Unknown chemistry: ${String(chemistry)}`);
  }
  const dodCurve = dodCurveFor(chemistry);
  const dodFactor = getDodFactor(depthOfDischarge, dodCurve);
  const temperatureFactor = getTemperatureFactor(temperatureC);

  const estimatedCycles = roundTo(baseCycles * dodFactor * temperatureFactor, 0);

  return {
    estimatedCycles,
    baseCycles,
    dodFactor: roundTo(dodFactor, 4),
    temperatureFactor,
    chemistry,
    dodCurve,
    dodBelowTable: depthOfDischarge < BU808_TABLE2[dodCurve][0][0],
  };
}
