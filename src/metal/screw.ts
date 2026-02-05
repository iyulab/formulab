import { roundTo } from '../utils.js';
import type { ScrewInput, ScrewResult, ScrewSpec } from './types.js';

const SCREW_TABLE: Record<string, ScrewSpec> = {
  'M1.6': { nominal: 1.6, coarsePitch: 0.35, finePitch: 0.2, clearanceClose: 1.7, clearanceFree: 2.0 },
  'M2':   { nominal: 2, coarsePitch: 0.4, finePitch: 0.25, clearanceClose: 2.2, clearanceFree: 2.6 },
  'M2.5': { nominal: 2.5, coarsePitch: 0.45, finePitch: 0.35, clearanceClose: 2.7, clearanceFree: 3.1 },
  'M3':   { nominal: 3, coarsePitch: 0.5, finePitch: 0.35, clearanceClose: 3.2, clearanceFree: 3.6 },
  'M4':   { nominal: 4, coarsePitch: 0.7, finePitch: 0.5, clearanceClose: 4.3, clearanceFree: 4.8 },
  'M5':   { nominal: 5, coarsePitch: 0.8, finePitch: 0.5, clearanceClose: 5.3, clearanceFree: 5.8 },
  'M6':   { nominal: 6, coarsePitch: 1.0, finePitch: 0.75, clearanceClose: 6.4, clearanceFree: 7.0 },
  'M8':   { nominal: 8, coarsePitch: 1.25, finePitch: 0.75, clearanceClose: 8.4, clearanceFree: 10.0 },
  'M10':  { nominal: 10, coarsePitch: 1.5, finePitch: 1.0, clearanceClose: 10.5, clearanceFree: 12.0 },
  'M12':  { nominal: 12, coarsePitch: 1.75, finePitch: 1.25, clearanceClose: 13.0, clearanceFree: 14.5 },
  'M16':  { nominal: 16, coarsePitch: 2.0, finePitch: 1.5, clearanceClose: 17.0, clearanceFree: 18.0 },
  'M20':  { nominal: 20, coarsePitch: 2.5, finePitch: 1.5, clearanceClose: 21.0, clearanceFree: 22.0 },
  'M24':  { nominal: 24, coarsePitch: 3.0, finePitch: 2.0, clearanceClose: 25.0, clearanceFree: 26.0 },
  'M30':  { nominal: 30, coarsePitch: 3.5, finePitch: 2.0, clearanceClose: 31.0, clearanceFree: 33.0 },
};

export function getDesignations(): string[] {
  return Object.keys(SCREW_TABLE);
}

/**
 * Calculate metric screw dimensions and clearances.
 */
export function screw(input: ScrewInput): ScrewResult | null {
  const spec = SCREW_TABLE[input.designation];
  if (!spec) return null;

  const pitch = input.pitchType === 'coarse' ? spec.coarsePitch : spec.finePitch;
  const minorDiameter = roundTo(spec.nominal - 1.0825 * pitch, 3);
  const tapDrill = roundTo(spec.nominal - pitch, 2);

  return {
    designation: input.designation,
    nominalDiameter: spec.nominal,
    pitch,
    minorDiameter,
    tapDrill,
    clearanceClose: spec.clearanceClose,
    clearanceFree: spec.clearanceFree,
  };
}
