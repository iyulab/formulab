import type { PasteType, ReflowResult } from './types.js';

/**
 * Reflow profile data for different solder paste types
 */
const REFLOW_PROFILES: Record<PasteType, ReflowResult> = {
  sac305: {
    pasteType: 'SAC305',
    meltingPoint: 217,
    preheatRate: '1.0-3.0',
    preheatTemp: '150-200',
    preheatTime: '60-120',
    soakTemp: '150-200',
    soakTime: '60-120',
    peakTemp: '235-250',
    timeAboveLiquidus: '60-90',
    coolingRate: '<4.0',
    totalProfileTime: '240-300',
  },
  sn63pb37: {
    pasteType: 'Sn63Pb37',
    meltingPoint: 183,
    preheatRate: '1.0-2.5',
    preheatTemp: '100-150',
    preheatTime: '60-90',
    soakTemp: '150-183',
    soakTime: '60-90',
    peakTemp: '210-230',
    timeAboveLiquidus: '45-75',
    coolingRate: '<4.0',
    totalProfileTime: '180-240',
  },
  sac387: {
    pasteType: 'SAC387',
    meltingPoint: 217,
    preheatRate: '1.0-3.0',
    preheatTemp: '150-200',
    preheatTime: '60-120',
    soakTemp: '150-200',
    soakTime: '60-120',
    peakTemp: '240-260',
    timeAboveLiquidus: '60-90',
    coolingRate: '<4.0',
    totalProfileTime: '240-300',
  },
  snbi58: {
    pasteType: 'SnBi58',
    meltingPoint: 138,
    preheatRate: '0.5-2.0',
    preheatTemp: '80-120',
    preheatTime: '60-90',
    soakTemp: '100-130',
    soakTime: '60-90',
    peakTemp: '160-180',
    timeAboveLiquidus: '30-60',
    coolingRate: '<3.0',
    totalProfileTime: '180-240',
  },
};

const PASTE_TYPES: PasteType[] = ['sac305', 'sn63pb37', 'sac387', 'snbi58'];

/**
 * Get all available paste types
 */
export function getPasteTypes(): PasteType[] {
  return [...PASTE_TYPES];
}

/**
 * Get reflow profile for a specific solder paste type
 * @param pasteType - The type of solder paste
 * @returns Reflow profile or undefined if paste type is invalid
 */
export function reflowProfile(pasteType: PasteType): ReflowResult | undefined {
  const profile = REFLOW_PROFILES[pasteType];
  if (!profile) {
    return undefined;
  }
  return { ...profile };
}
