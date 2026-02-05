import { roundTo } from '../utils.js';
import type { PressTonnageInput, PressTonnageResult, BendType } from './types.js';

/**
 * Bend force coefficient by bend type
 */
const BEND_COEFFICIENT: Record<BendType, number> = {
  air: 1.33,
  bottoming: 3.0,
  coining: 8.0,
};

/**
 * Deep Drawing Constants
 * Based on sheet metal forming handbooks and DIN 8584
 */
const DRAW_CONSTANTS = {
  /** Typical limiting draw ratio (LDR) for mild steel */
  LDR_MILD_STEEL: 0.48,
  /** Safe draw ratio for first draw (d/D) */
  SAFE_FIRST_DRAW_RATIO: 0.55,
  /** Minimum draw ratio before fracture risk */
  MIN_DRAW_RATIO: 0.45,
  /** Subsequent draw reduction factor */
  SUBSEQUENT_DRAW_FACTOR: 0.75,
  /** Default blank holder pressure (MPa) */
  DEFAULT_BLANK_HOLDER_PRESSURE: 2.5,
  /** Default friction coefficient (lubricated steel) */
  DEFAULT_FRICTION: 0.1,
  /** Efficiency factor for drawing formula */
  DRAW_EFFICIENCY: 0.7,
};

/**
 * Calculate blank holder force for deep drawing
 * F_bh = π/4 × (D² - d²) × p_bh
 *
 * @param blankDiameter D - blank diameter (mm)
 * @param punchDiameter d - punch diameter (mm)
 * @param blankHolderPressure p_bh - pressure (MPa)
 * @returns Force in kN
 */
function calculateBlankHolderForce(
  blankDiameter: number,
  punchDiameter: number,
  blankHolderPressure: number
): number {
  const blankArea = (Math.PI / 4) * (blankDiameter ** 2 - punchDiameter ** 2);
  // blankArea in mm², pressure in MPa = N/mm²
  // Force in N, convert to kN
  return (blankArea * blankHolderPressure) / 1000;
}

/**
 * Calculate drawing force with friction and bending effects
 *
 * Siebel formula (simplified):
 * F_d = π × d × t × σ × [(ln(D/d) + μ × π/2) × (1 + t/(2r)) + C]
 *
 * where:
 *   d = punch diameter
 *   t = thickness
 *   σ = tensile strength (UTS)
 *   D = blank diameter
 *   μ = friction coefficient
 *   r = die radius
 *   C = correction factor (~0.2-0.3)
 *
 * @returns Drawing force in kN
 */
function calculateDrawingForce(
  punchDiameter: number,
  blankDiameter: number,
  thickness: number,
  tensileStrength: number,
  frictionCoefficient: number,
  dieRadius: number
): number {
  const d = punchDiameter;
  const D = blankDiameter;
  const t = thickness;
  const sigma = tensileStrength;
  const mu = frictionCoefficient;
  const r = dieRadius || (5 * thickness); // Default die radius = 5t

  // Natural log of draw ratio inverse (D/d)
  const lnRatio = Math.log(D / d);

  // Friction term around die corner
  const frictionTerm = mu * (Math.PI / 2);

  // Bending/unbending effect over die radius
  const bendingFactor = 1 + t / (2 * r);

  // Correction factor for material flow
  const correctionFactor = 0.25;

  // Siebel formula
  const drawingStress = sigma * ((lnRatio + frictionTerm) * bendingFactor + correctionFactor);

  // Force = stress × wall area
  // Wall area = π × d × t
  const wallArea = Math.PI * d * t;

  // Force in N, convert to kN
  return (wallArea * drawingStress) / 1000;
}

/**
 * Estimate number of draws required based on total reduction
 *
 * First draw: d1/D = 0.55 (55% of blank)
 * Subsequent draws: dn/d(n-1) = 0.75-0.80
 */
function estimateNumberOfDraws(
  blankDiameter: number,
  finalDiameter: number
): { numberOfDraws: number; ratios: number[] } {
  const D = blankDiameter;
  const d_final = finalDiameter;

  // Total draw ratio
  const totalRatio = d_final / D;

  if (totalRatio >= DRAW_CONSTANTS.SAFE_FIRST_DRAW_RATIO) {
    // Single draw possible
    return { numberOfDraws: 1, ratios: [totalRatio] };
  }

  // Multi-draw required
  const ratios: number[] = [];
  let currentDiameter = D;
  let draws = 0;

  // First draw
  let firstDrawDia = D * DRAW_CONSTANTS.SAFE_FIRST_DRAW_RATIO;
  if (firstDrawDia <= d_final) {
    return { numberOfDraws: 1, ratios: [d_final / D] };
  }
  ratios.push(DRAW_CONSTANTS.SAFE_FIRST_DRAW_RATIO);
  currentDiameter = firstDrawDia;
  draws = 1;

  // Subsequent draws
  while (currentDiameter > d_final && draws < 10) {
    const nextDiameter = currentDiameter * DRAW_CONSTANTS.SUBSEQUENT_DRAW_FACTOR;
    if (nextDiameter <= d_final) {
      ratios.push(d_final / currentDiameter);
      draws++;
      break;
    }
    ratios.push(DRAW_CONSTANTS.SUBSEQUENT_DRAW_FACTOR);
    currentDiameter = nextDiameter;
    draws++;
  }

  return { numberOfDraws: draws, ratios };
}

/**
 * Calculate press tonnage for various sheet metal operations.
 *
 * Blanking Force: P = perimeter × thickness × shearStrength
 * Bending Force: P = (K × length × thickness² × tensileStrength) / dieOpening
 * Drawing Force: Siebel formula with friction, bending effects
 * Blank Holder Force: F_bh = π/4 × (D² - d²) × p_bh
 *
 * References:
 * - DIN 8584 (Deep Drawing)
 * - Schuler Metal Forming Handbook
 * - ASM Metals Handbook Vol. 14
 *
 * @param input - Press tonnage input parameters
 * @returns PressTonnageResult with forces, draw analysis, and warnings
 */
export function pressTonnage(input: PressTonnageInput): PressTonnageResult {
  const {
    operation,
    thickness,
    tensileStrength,
    shearStrength,
    safetyFactor = 1.25,
    cuttingPerimeter = 0,
    bendLength = 0,
    dieOpening = 8 * thickness,
    bendType = 'air',
    punchDiameter = 0,
    blankDiameter = 0,
    frictionCoefficient = DRAW_CONSTANTS.DEFAULT_FRICTION,
    blankHolderPressure = DRAW_CONSTANTS.DEFAULT_BLANK_HOLDER_PRESSURE,
    dieRadius = 5 * thickness,
  } = input;

  let blankingForce = 0;
  let bendingForce = 0;
  let drawingForce = 0;
  let blankHolderForce = 0;
  let actualDrawRatio = 0;
  let numberOfDraws = 1;
  const breakdown: { operation: string; force: number }[] = [];
  const warnings: string[] = [];

  // Calculate blanking force
  if (operation === 'blanking' || (operation === 'combined' && cuttingPerimeter > 0)) {
    // P = L × t × τ (shear strength)
    // Result in N, convert to kN
    blankingForce = (cuttingPerimeter * thickness * shearStrength) / 1000;

    if (operation === 'blanking') {
      breakdown.push({ operation: 'blanking', force: roundTo(blankingForce, 2) });
    }
  }

  // Calculate bending force
  if (operation === 'bending' || (operation === 'combined' && bendLength > 0)) {
    // P = (K × L × t² × σ) / W
    const k = BEND_COEFFICIENT[bendType];
    // Result in N, convert to kN
    bendingForce = (k * bendLength * thickness * thickness * tensileStrength) / (dieOpening * 1000);

    if (operation === 'bending') {
      breakdown.push({ operation: 'bending', force: roundTo(bendingForce, 2) });
    }
  }

  // Calculate drawing force with enhanced formula
  if (operation === 'drawing' || (operation === 'combined' && punchDiameter > 0)) {
    // Determine blank diameter and draw ratio
    let D = blankDiameter;
    const d = punchDiameter;

    // If blank diameter not provided, estimate from drawRatio input
    if (D <= 0 && input.drawRatio && input.drawRatio > 0) {
      D = d / input.drawRatio;
    }

    // If still no blank diameter, use legacy calculation
    if (D <= 0) {
      // Legacy: simple formula P = n × π × d × t × σ
      const n = 1 / (input.drawRatio || 0.7);
      drawingForce = (n * Math.PI * punchDiameter * thickness * tensileStrength) / 1000;
      actualDrawRatio = input.drawRatio || 0.7;
    } else {
      // Enhanced calculation with blank diameter
      actualDrawRatio = d / D;

      // Calculate drawing force using Siebel formula
      drawingForce = calculateDrawingForce(
        d, D, thickness, tensileStrength, frictionCoefficient, dieRadius
      );

      // Calculate blank holder force
      blankHolderForce = calculateBlankHolderForce(D, d, blankHolderPressure);

      // Estimate number of draws
      const drawEstimate = estimateNumberOfDraws(D, d);
      numberOfDraws = drawEstimate.numberOfDraws;

      // Generate warnings
      if (actualDrawRatio < DRAW_CONSTANTS.MIN_DRAW_RATIO) {
        warnings.push(`Draw ratio ${roundTo(actualDrawRatio, 3)} is below safe limit (${DRAW_CONSTANTS.MIN_DRAW_RATIO}). Risk of fracture.`);
      } else if (actualDrawRatio < DRAW_CONSTANTS.SAFE_FIRST_DRAW_RATIO) {
        warnings.push(`Draw ratio ${roundTo(actualDrawRatio, 3)} requires careful process control. Consider annealing between draws.`);
      }

      if (numberOfDraws > 1) {
        warnings.push(`Multi-draw operation recommended: ${numberOfDraws} draws required for d/D = ${roundTo(actualDrawRatio, 3)}`);
      }

      if (frictionCoefficient > 0.15) {
        warnings.push('High friction coefficient. Ensure adequate lubrication to prevent galling.');
      }

      if (blankHolderPressure > 5) {
        warnings.push('High blank holder pressure may cause excessive thinning.');
      } else if (blankHolderPressure < 1.5) {
        warnings.push('Low blank holder pressure may cause wrinkling.');
      }
    }

    if (operation === 'drawing') {
      breakdown.push({ operation: 'drawing', force: roundTo(drawingForce, 2) });
      if (blankHolderForce > 0) {
        breakdown.push({ operation: 'blankHolder', force: roundTo(blankHolderForce, 2) });
      }
    }
  }

  // For combined operation without explicit operations array, return zeros
  if (operation === 'combined' && !input.operations) {
    return {
      blankingForce: 0,
      bendingForce: 0,
      drawingForce: 0,
      blankHolderForce: 0,
      totalForce: 0,
      recommendedPress: 0,
      drawRatio: 0,
      numberOfDraws: 0,
      breakdown: [],
      warnings: [],
    };
  }

  // Calculate total force (blank holder adds to drawing force requirement)
  const totalForce = blankingForce + bendingForce + drawingForce + blankHolderForce;

  // Calculate recommended press tonnage
  // Force in kN, convert to tons (1 ton = 9.80665 kN)
  // Apply safety factor and round up to nearest 10 tons
  const forceInTons = totalForce / 9.80665;
  const withSafety = forceInTons * safetyFactor;
  const recommendedPress = Math.ceil(withSafety / 10) * 10;

  return {
    blankingForce: roundTo(blankingForce, 2),
    bendingForce: roundTo(bendingForce, 2),
    drawingForce: roundTo(drawingForce, 2),
    blankHolderForce: roundTo(blankHolderForce, 2),
    totalForce: roundTo(totalForce, 2),
    recommendedPress,
    drawRatio: roundTo(actualDrawRatio, 3),
    numberOfDraws,
    breakdown,
    warnings,
  };
}
