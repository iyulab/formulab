import type { LoadInput, LoadResult } from './types.js';

/**
 * Calculate beam load analysis results
 *
 * Supports simple, cantilever, and fixed beam supports with
 * uniform, concentrated, or combined loading.
 *
 * @param input - Beam load input parameters
 * @returns Load analysis result or null for invalid inputs
 */
export function beamLoad(input: LoadInput): LoadResult | null {
  const { loadType, support, span, uniformLoad, pointLoad, pointPosition } = input;

  // Validate span
  if (span <= 0) {
    return null;
  }

  // Validate required inputs based on load type
  if (loadType === 'uniform' && (uniformLoad === undefined || uniformLoad === null)) {
    return null;
  }
  if (loadType === 'concentrated' && (pointLoad === undefined || pointLoad === null)) {
    return null;
  }
  if (loadType === 'combined') {
    if (uniformLoad === undefined || uniformLoad === null) return null;
    if (pointLoad === undefined || pointLoad === null) return null;
  }

  const w = uniformLoad ?? 0;
  const P = pointLoad ?? 0;
  const a = pointPosition ?? span / 2; // default to midspan
  const b = span - a;
  const L = span;

  let maxMoment = 0;
  let maxShear = 0;
  let maxDeflectionCoeff = 0;
  let reactionLeft = 0;
  let reactionRight = 0;
  let momentAtPoint: number | undefined;

  if (support === 'simple') {
    if (loadType === 'uniform') {
      // Simple beam with uniform load
      // M_max = wL²/8
      maxMoment = (w * L * L) / 8;
      // V_max = wL/2
      maxShear = (w * L) / 2;
      // δ_max coefficient = 5/384 (multiply by wL⁴/EI)
      maxDeflectionCoeff = 5 / 384;
      reactionLeft = (w * L) / 2;
      reactionRight = (w * L) / 2;
    } else if (loadType === 'concentrated') {
      // Simple beam with point load
      // M_max = P×a×b/L (maximum at point of application)
      maxMoment = (P * a * b) / L;
      // Reactions
      reactionLeft = (P * b) / L;
      reactionRight = (P * a) / L;
      // V_max = max(R_L, R_R)
      maxShear = Math.max(reactionLeft, reactionRight);
      // δ_max coefficient for center load = 1/48
      maxDeflectionCoeff = 1 / 48;
      momentAtPoint = maxMoment;
    } else if (loadType === 'combined') {
      // Combined uniform + point load
      const uniformReaction = (w * L) / 2;
      const pointReactionLeft = (P * b) / L;
      const pointReactionRight = (P * a) / L;

      reactionLeft = uniformReaction + pointReactionLeft;
      reactionRight = uniformReaction + pointReactionRight;

      // M_max for uniform = wL²/8, for point = Pab/L
      const uniformMoment = (w * L * L) / 8;
      const pointMoment = (P * a * b) / L;
      maxMoment = uniformMoment + pointMoment;

      maxShear = Math.max(reactionLeft, reactionRight);
      maxDeflectionCoeff = 5 / 384; // approximate
      momentAtPoint = pointMoment;
    }
  } else if (support === 'cantilever') {
    if (loadType === 'uniform') {
      // Cantilever with uniform load
      // M_max = wL²/2 (at fixed end)
      maxMoment = (w * L * L) / 2;
      // V_max = wL
      maxShear = w * L;
      // δ_max coefficient = 1/8 (multiply by wL⁴/EI)
      maxDeflectionCoeff = 1 / 8;
      reactionLeft = w * L; // reaction at fixed end
      reactionRight = 0;
    } else if (loadType === 'concentrated') {
      // Cantilever with point load at free end (or specified position)
      // M_max = P×a (at fixed end)
      maxMoment = P * a;
      maxShear = P;
      // δ_max coefficient = 1/3 (multiply by PL³/EI)
      maxDeflectionCoeff = 1 / 3;
      reactionLeft = P;
      reactionRight = 0;
      momentAtPoint = P * a;
    } else if (loadType === 'combined') {
      maxMoment = (w * L * L) / 2 + P * a;
      maxShear = w * L + P;
      maxDeflectionCoeff = 1 / 8;
      reactionLeft = w * L + P;
      reactionRight = 0;
      momentAtPoint = P * a;
    }
  } else if (support === 'fixed') {
    if (loadType === 'uniform') {
      // Fixed-fixed beam with uniform load
      // M_max = wL²/12 (at supports), M_center = wL²/24
      maxMoment = (w * L * L) / 12;
      // V_max = wL/2
      maxShear = (w * L) / 2;
      // δ_max coefficient = 1/384 (multiply by wL⁴/EI)
      maxDeflectionCoeff = 1 / 384;
      reactionLeft = (w * L) / 2;
      reactionRight = (w * L) / 2;
    } else if (loadType === 'concentrated') {
      // Fixed-fixed beam with center point load
      // M_max = PL/8 (at supports when a=L/2)
      maxMoment = (P * L) / 8;
      reactionLeft = P / 2;
      reactionRight = P / 2;
      maxShear = P / 2;
      maxDeflectionCoeff = 1 / 192;
      momentAtPoint = (P * L) / 8;
    } else if (loadType === 'combined') {
      maxMoment = (w * L * L) / 12 + (P * L) / 8;
      maxShear = (w * L) / 2 + P / 2;
      maxDeflectionCoeff = 1 / 384;
      reactionLeft = (w * L) / 2 + P / 2;
      reactionRight = (w * L) / 2 + P / 2;
      momentAtPoint = (P * L) / 8;
    }
  }

  const result: LoadResult = {
    maxMoment,
    maxShear,
    maxDeflectionCoeff,
    reactionLeft,
    reactionRight,
  };

  if (momentAtPoint !== undefined) {
    result.momentAtPoint = momentAtPoint;
  }

  return result;
}
