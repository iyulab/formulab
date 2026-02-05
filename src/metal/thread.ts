import type { ThreadInput, ThreadResult } from './types.js';

const METRIC_THREADS: Record<string, { majorDiameter: number; pitch: number; tapDrill: number }> = {
  'M3':  { majorDiameter: 3, pitch: 0.5, tapDrill: 2.5 },
  'M4':  { majorDiameter: 4, pitch: 0.7, tapDrill: 3.3 },
  'M5':  { majorDiameter: 5, pitch: 0.8, tapDrill: 4.2 },
  'M6':  { majorDiameter: 6, pitch: 1.0, tapDrill: 5.0 },
  'M8':  { majorDiameter: 8, pitch: 1.25, tapDrill: 6.8 },
  'M10': { majorDiameter: 10, pitch: 1.5, tapDrill: 8.5 },
  'M12': { majorDiameter: 12, pitch: 1.75, tapDrill: 10.2 },
  'M14': { majorDiameter: 14, pitch: 2.0, tapDrill: 12.0 },
  'M16': { majorDiameter: 16, pitch: 2.0, tapDrill: 14.0 },
  'M18': { majorDiameter: 18, pitch: 2.5, tapDrill: 15.5 },
  'M20': { majorDiameter: 20, pitch: 2.5, tapDrill: 17.5 },
  'M22': { majorDiameter: 22, pitch: 2.5, tapDrill: 19.5 },
  'M24': { majorDiameter: 24, pitch: 3.0, tapDrill: 21.0 },
  'M27': { majorDiameter: 27, pitch: 3.0, tapDrill: 24.0 },
  'M30': { majorDiameter: 30, pitch: 3.5, tapDrill: 26.5 },
};

const UNIFIED_THREADS: Record<string, { majorDiameter: number; tpi: number; tapDrill: number }> = {
  '#4-40':   { majorDiameter: roundTo(0.112 * 25.4, 3), tpi: 40, tapDrill: 2.26 },
  '#6-32':   { majorDiameter: roundTo(0.138 * 25.4, 3), tpi: 32, tapDrill: 2.69 },
  '#8-32':   { majorDiameter: roundTo(0.164 * 25.4, 3), tpi: 32, tapDrill: 3.45 },
  '#10-24':  { majorDiameter: roundTo(0.190 * 25.4, 3), tpi: 24, tapDrill: 3.80 },
  '1/4-20':  { majorDiameter: roundTo(0.250 * 25.4, 3), tpi: 20, tapDrill: 5.11 },
  '5/16-18': { majorDiameter: roundTo(0.3125 * 25.4, 3), tpi: 18, tapDrill: 6.53 },
  '3/8-16':  { majorDiameter: roundTo(0.375 * 25.4, 3), tpi: 16, tapDrill: 7.94 },
  '7/16-14': { majorDiameter: roundTo(0.4375 * 25.4, 3), tpi: 14, tapDrill: 9.35 },
  '1/2-13':  { majorDiameter: roundTo(0.500 * 25.4, 3), tpi: 13, tapDrill: 10.80 },
  '5/8-11':  { majorDiameter: roundTo(0.625 * 25.4, 3), tpi: 11, tapDrill: 13.39 },
  '3/4-10':  { majorDiameter: roundTo(0.750 * 25.4, 3), tpi: 10, tapDrill: 16.50 },
};

export function getMetricSizes(): string[] {
  return Object.keys(METRIC_THREADS);
}

export function getUnifiedSizes(): string[] {
  return Object.keys(UNIFIED_THREADS);
}

/**
 * Look up thread dimensions from standard tables.
 */
export function thread(input: ThreadInput): ThreadResult | null {
  if (input.type === 'metric') {
    const spec = METRIC_THREADS[input.size];
    if (!spec) return null;

    const minorDiameter = roundTo(spec.majorDiameter - 1.0825 * spec.pitch, 3);
    const pitchDiameter = roundTo(spec.majorDiameter - 0.6495 * spec.pitch, 3);

    return {
      size: input.size,
      majorDiameter: spec.majorDiameter,
      pitch: spec.pitch,
      tapDrill: spec.tapDrill,
      minorDiameter,
      pitchDiameter,
    };
  }

  const spec = UNIFIED_THREADS[input.size];
  if (!spec) return null;

  const pitchMm = 25.4 / spec.tpi;
  const minorDiameter = roundTo(spec.majorDiameter - 1.0825 * pitchMm, 3);
  const pitchDiameter = roundTo(spec.majorDiameter - 0.6495 * pitchMm, 3);

  return {
    size: input.size,
    majorDiameter: spec.majorDiameter,
    pitch: spec.tpi,
    tapDrill: spec.tapDrill,
    minorDiameter,
    pitchDiameter,
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
