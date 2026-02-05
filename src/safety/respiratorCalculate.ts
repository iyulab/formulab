import type { RespiratorInput, RespiratorResult, RespiratorType } from './types.js';

/**
 * OSHA Assigned Protection Factors (APFs)
 * From 29 CFR 1910.134 Table 1
 */
const APF_VALUES: Record<RespiratorType, number> = {
  'filtering-facepiece': 10,
  'half-mask': 10,
  'full-facepiece': 50,
  'powered-half-mask': 50,
  'powered-hood': 25,
  'powered-full-facepiece': 1000,
  'supplied-air-half': 10,
  'supplied-air-full': 50,
  'supplied-air-full-pd': 1000,
  'scba-pd': 10000,
};

/**
 * Calculate Maximum Use Concentration (MUC)
 * Formula: MUC = APF × OEL
 *
 * The MUC is the maximum concentration of a hazardous substance
 * that a specific respirator can be used in.
 */
function calculateMUC(apf: number, oel: number): number {
  return apf * oel;
}

/**
 * Calculate Hazard Ratio
 * Formula: HR = Concentration / OEL
 *
 * The hazard ratio indicates how many times the workplace
 * concentration exceeds the occupational exposure limit.
 */
function calculateHazardRatio(concentration: number, oel: number): number {
  if (oel <= 0) return Infinity;
  return concentration / oel;
}

/**
 * Calculate the minimum APF required for adequate protection
 * Required APF must be >= Hazard Ratio
 */
function calculateRequiredAPF(hazardRatio: number): number {
  return hazardRatio;
}

/**
 * Calculate safety margin
 * How much the selected APF exceeds the required APF
 */
function calculateSafetyMargin(apf: number, requiredAPF: number): number {
  if (requiredAPF <= 0) return Infinity;
  return apf / requiredAPF;
}

/**
 * Calculate respirator MUC (Maximum Use Concentration) and protection factor
 * based on OSHA 29 CFR 1910.134 and NIOSH respirator selection guidelines.
 *
 * MUC = APF × OEL
 * Hazard Ratio = Concentration / OEL
 * Protection is adequate when Concentration <= MUC
 *
 * @param input - Respirator input parameters
 * @returns Respirator results including MUC, APF, and protection assessment
 */
export function respiratorCalculate(input: RespiratorInput): RespiratorResult {
  const { concentration, oel, respiratorType } = input;

  // Get APF for selected respirator type
  const apf = APF_VALUES[respiratorType];

  // Calculate MUC
  const muc = calculateMUC(apf, oel);

  // Calculate hazard ratio
  const hazardRatio = calculateHazardRatio(concentration, oel);

  // Calculate required APF
  const requiredAPF = calculateRequiredAPF(hazardRatio);

  // Check if protection is adequate
  // Protection is adequate if concentration <= MUC (i.e., APF >= hazardRatio)
  const protectionAdequate = concentration <= muc;

  // Calculate safety margin
  const safetyMargin = calculateSafetyMargin(apf, requiredAPF);

  return {
    muc,
    apf,
    hazardRatio,
    requiredAPF,
    protectionAdequate,
    safetyMargin,
  };
}
