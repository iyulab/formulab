import { roundTo } from '../utils.js';
import type { PipeSpecInput, PipeSpecResult, PipeSchedule } from './types.js';

interface PipeDimension {
  od: number;           // outer diameter, mm
  schedules: Partial<Record<PipeSchedule, number>>; // wall thickness per schedule
}

/**
 * ANSI B36.10/B36.19 pipe dimensions
 * @reference ASME B36.10M, B36.19M
 */
const PIPE_DATA: Record<string, PipeDimension> = {
  // NPS (inch) → OD and wall thicknesses
  '1/2':  { od: 21.3,  schedules: { SCH5: 1.65, SCH10: 2.11, SCH40: 2.77,  SCH80: 3.73,  SCH160: 4.78, XXS: 7.47 } },
  '3/4':  { od: 26.7,  schedules: { SCH5: 1.65, SCH10: 2.11, SCH40: 2.87,  SCH80: 3.91,  SCH160: 5.56, XXS: 7.82 } },
  '1':    { od: 33.4,  schedules: { SCH5: 1.65, SCH10: 2.77, SCH40: 3.38,  SCH80: 4.55,  SCH160: 6.35, XXS: 9.09 } },
  '1-1/4': { od: 42.2, schedules: { SCH5: 1.65, SCH10: 2.77, SCH40: 3.56,  SCH80: 4.85,  SCH160: 6.35, XXS: 9.70 } },
  '1-1/2': { od: 48.3, schedules: { SCH5: 1.65, SCH10: 2.77, SCH40: 3.68,  SCH80: 5.08,  SCH160: 7.14, XXS: 10.15 } },
  '2':    { od: 60.3,  schedules: { SCH5: 1.65, SCH10: 2.77, SCH40: 3.91,  SCH80: 5.54,  SCH160: 8.74, XXS: 11.07 } },
  '2-1/2': { od: 73.0, schedules: { SCH5: 2.11, SCH10: 3.05, SCH40: 5.16,  SCH80: 7.01,  SCH160: 9.53, XXS: 14.02 } },
  '3':    { od: 88.9,  schedules: { SCH5: 2.11, SCH10: 3.05, SCH40: 5.49,  SCH80: 7.62,  SCH160: 11.13, XXS: 15.24 } },
  '4':    { od: 114.3, schedules: { SCH5: 2.11, SCH10: 3.05, SCH40: 6.02,  SCH80: 8.56,  SCH160: 13.49, XXS: 17.12 } },
  '6':    { od: 168.3, schedules: { SCH5: 2.77, SCH10: 3.40, SCH40: 7.11,  SCH80: 10.97, SCH160: 18.26, XXS: 21.95 } },
  '8':    { od: 219.1, schedules: { SCH5: 2.77, SCH10: 3.76, SCH40: 8.18,  SCH80: 12.70, SCH160: 23.01, XXS: 22.23 } },
  '10':   { od: 273.1, schedules: { SCH5: 3.40, SCH10: 4.19, SCH40: 9.27,  SCH80: 15.09, SCH160: 28.58, XXS: 25.40 } },
  '12':   { od: 323.9, schedules: { SCH5: 3.96, SCH10: 4.57, SCH40: 10.31, SCH80: 17.48, SCH160: 33.32, XXS: 25.40 } },
  '14':   { od: 355.6, schedules: { SCH5: 3.96, SCH10: 4.78, SCH40: 11.13, SCH80: 19.05, SCH160: 35.71 } },
  '16':   { od: 406.4, schedules: { SCH5: 4.19, SCH10: 4.78, SCH40: 12.70, SCH80: 21.44, SCH160: 40.49 } },
};

/**
 * DN to NPS mapping
 */
const DN_TO_NPS: Record<string, string> = {
  'DN15':  '1/2',
  'DN20':  '3/4',
  'DN25':  '1',
  'DN32':  '1-1/4',
  'DN40':  '1-1/2',
  'DN50':  '2',
  'DN65':  '2-1/2',
  'DN80':  '3',
  'DN100': '4',
  'DN150': '6',
  'DN200': '8',
  'DN250': '10',
  'DN300': '12',
  'DN350': '14',
  'DN400': '16',
};

const STEEL_DENSITY = 7850; // kg/m³

/**
 * Look up pipe specifications from ANSI/ASME standards
 *
 * @reference ASME B36.10M, ASME B36.19M
 * @param input - Pipe standard, nominal size, and schedule
 * @returns Pipe dimensions (OD, wall thickness, ID, weight, areas)
 */
export function pipeSpec(input: PipeSpecInput): PipeSpecResult {
  const { standard, nominalSize, schedule } = input;

  // Normalize nominal size
  let nps: string;
  if (standard === 'DN') {
    const dnKey = nominalSize.toUpperCase().replace(/\s/g, '');
    nps = DN_TO_NPS[dnKey];
    if (!nps) {
      throw new Error(`Unknown DN size: ${nominalSize}`);
    }
  } else {
    // Remove quotes and clean up
    nps = nominalSize.replace(/"/g, '').replace(/'/g, '').trim();
  }

  const pipeData = PIPE_DATA[nps];
  if (!pipeData) {
    throw new Error(`Unknown pipe size: ${nps}`);
  }

  const wallThickness = pipeData.schedules[schedule];
  if (wallThickness == null) {
    throw new Error(`Schedule ${schedule} not available for size ${nps}`);
  }

  const od = pipeData.od;
  const id = roundTo(od - 2 * wallThickness, 2);

  // Cross-section area of pipe wall (metal area)
  const crossSectionArea = roundTo(
    (Math.PI / 4) * (od * od - id * id),
    2,
  );

  // Internal flow area
  const internalArea = roundTo((Math.PI / 4) * id * id, 2);

  // Weight per meter (kg/m) for carbon steel
  // mass = density × volume = 7850 × (π/4)(OD² - ID²) × 1m
  // Note: dimensions in mm, convert to m
  const weightPerMeter = roundTo(
    STEEL_DENSITY * crossSectionArea * 1e-6, // mm² to m², per 1m length
    2,
  );

  return {
    nominalSize: nps,
    outerDiameter: od,
    wallThickness,
    innerDiameter: id,
    weightPerMeter,
    crossSectionArea,
    internalArea,
  };
}
