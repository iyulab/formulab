import type { PasteType, ReflowProfileNumbers, ReflowResult } from './types.js';
import { requireFinite } from '../utils.js';

type Range = readonly [min: number, max: number];

/**
 * Reflow profile windows per solder paste — the one source. The range strings of `ReflowResult`
 * are printed from these numbers, so the numeric `profile` and the strings cannot disagree.
 */
const REFLOW_WINDOWS: Record<PasteType, {
  name: string;
  meltingPoint: number;
  preheatRate: Range;
  preheatTemp: Range;
  preheatTime: Range;
  soakTemp: Range;
  soakTime: Range;
  peakTemp: Range;
  timeAboveLiquidus: Range;
  coolingRateMax: number;
  totalProfileTime: Range;
}> = {
  sac305: {
    name: 'SAC305', meltingPoint: 217,
    preheatRate: [1.0, 3.0], preheatTemp: [150, 200], preheatTime: [60, 120],
    soakTemp: [150, 200], soakTime: [60, 120], peakTemp: [235, 250],
    timeAboveLiquidus: [60, 90], coolingRateMax: 4.0, totalProfileTime: [240, 300],
  },
  sn63pb37: {
    name: 'Sn63Pb37', meltingPoint: 183,
    preheatRate: [1.0, 2.5], preheatTemp: [100, 150], preheatTime: [60, 90],
    soakTemp: [150, 183], soakTime: [60, 90], peakTemp: [210, 230],
    timeAboveLiquidus: [45, 75], coolingRateMax: 4.0, totalProfileTime: [180, 240],
  },
  sac387: {
    name: 'SAC387', meltingPoint: 217,
    preheatRate: [1.0, 3.0], preheatTemp: [150, 200], preheatTime: [60, 120],
    soakTemp: [150, 200], soakTime: [60, 120], peakTemp: [240, 260],
    timeAboveLiquidus: [60, 90], coolingRateMax: 4.0, totalProfileTime: [240, 300],
  },
  snbi58: {
    name: 'SnBi58', meltingPoint: 138,
    preheatRate: [0.5, 2.0], preheatTemp: [80, 120], preheatTime: [60, 90],
    soakTemp: [100, 130], soakTime: [60, 90], peakTemp: [160, 180],
    timeAboveLiquidus: [30, 60], coolingRateMax: 3.0, totalProfileTime: [180, 240],
  },
};

const PASTE_TYPES: PasteType[] = ['sac305', 'sn63pb37', 'sac387', 'snbi58'];

/** Temperatures and times are whole numbers; rates keep one decimal («1.0-3.0», «<4.0»). */
const whole = (r: Range): string => `${r[0]}-${r[1]}`;
const rate = (r: Range): string => `${r[0].toFixed(1)}-${r[1].toFixed(1)}`;
const span = (r: Range): { min: number; max: number } => ({ min: r[0], max: r[1] });

/**
 * Get all available paste types
 */
export function getPasteTypes(): PasteType[] {
  return [...PASTE_TYPES];
}

/**
 * Get reflow profile for a specific solder paste type
 * @param pasteType - The type of solder paste
 * @returns Reflow profile. The range strings are for display; `profile` carries the same windows
 *   as numbers (°C, s, °C/s) for a time-axis plot.
 * @throws {RangeError} a paste type that is not one of `getPasteTypes()`
 */
export function reflowProfile(pasteType: PasteType): ReflowResult {
  requireFinite('reflowProfile', pasteType);
  const w = Object.hasOwn(REFLOW_WINDOWS, pasteType) ? REFLOW_WINDOWS[pasteType] : undefined;
  if (!w) {
    throw new RangeError(`pasteType must be one of ${PASTE_TYPES.join(', ')}`);
  }
  const profile: ReflowProfileNumbers = {
    preheatRateCPerS: span(w.preheatRate),
    preheatTempC: span(w.preheatTemp),
    preheatTimeS: span(w.preheatTime),
    soakTempC: span(w.soakTemp),
    soakTimeS: span(w.soakTime),
    peakTempC: span(w.peakTemp),
    timeAboveLiquidusS: span(w.timeAboveLiquidus),
    coolingRateMaxCPerS: w.coolingRateMax,
    totalProfileTimeS: span(w.totalProfileTime),
  };
  return {
    pasteType: w.name,
    meltingPoint: w.meltingPoint,
    preheatRate: rate(w.preheatRate),
    preheatTemp: whole(w.preheatTemp),
    preheatTime: whole(w.preheatTime),
    soakTemp: whole(w.soakTemp),
    soakTime: whole(w.soakTime),
    peakTemp: whole(w.peakTemp),
    timeAboveLiquidus: whole(w.timeAboveLiquidus),
    coolingRate: `<${w.coolingRateMax.toFixed(1)}`,
    totalProfileTime: whole(w.totalProfileTime),
    profile,
  };
}
