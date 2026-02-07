import type { RebaInput, RebaResult } from './types.js';

// REBA Table A: Trunk × Neck × Legs (1-indexed)
const TABLE_A: number[][] = [
  //   Legs: 1  2  3  4
  /* Trunk=1, Neck=1 */ [1, 2, 3, 4],
  /* Trunk=1, Neck=2 */ [2, 3, 4, 5],
  /* Trunk=1, Neck=3 */ [2, 4, 5, 6],
  /* Trunk=2, Neck=1 */ [3, 4, 5, 6],
  /* Trunk=2, Neck=2 */ [4, 5, 6, 7],
  /* Trunk=2, Neck=3 */ [5, 6, 7, 8],
  /* Trunk=3, Neck=1 */ [5, 6, 7, 8],
  /* Trunk=3, Neck=2 */ [6, 7, 8, 9],
  /* Trunk=3, Neck=3 */ [7, 8, 9, 9],
  /* Trunk=4, Neck=1 */ [7, 8, 9, 9],
  /* Trunk=4, Neck=2 */ [8, 9, 9, 10],
  /* Trunk=4, Neck=3 */ [9, 9, 10, 10],
  /* Trunk=5, Neck=1 */ [8, 9, 10, 10],
  /* Trunk=5, Neck=2 */ [9, 10, 10, 11],
  /* Trunk=5, Neck=3 */ [10, 10, 11, 12],
];

// REBA Table B: Upper Arm × Lower Arm × Wrist (1-indexed)
const TABLE_B: number[][] = [
  //   Wrist: 1  2  3
  /* UA=1, LA=1 */ [1, 2, 2],
  /* UA=1, LA=2 */ [1, 2, 3],
  /* UA=2, LA=1 */ [3, 4, 5],
  /* UA=2, LA=2 */ [4, 5, 5],
  /* UA=3, LA=1 */ [5, 5, 6],
  /* UA=3, LA=2 */ [6, 7, 7],
  /* UA=4, LA=1 */ [7, 8, 8],
  /* UA=4, LA=2 */ [8, 9, 9],
  /* UA=5, LA=1 */ [9, 9, 9],
  /* UA=5, LA=2 */ [9, 9, 9],
  /* UA=6, LA=1 */ [9, 9, 9],
  /* UA=6, LA=2 */ [9, 9, 9],
];

// REBA Table C: Score A × Score B → Score C
const TABLE_C: number[][] = [
  // ScoreB:  1  2  3  4  5  6  7  8  9 10 11 12
  /* A= 1 */ [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7],
  /* A= 2 */ [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8],
  /* A= 3 */ [2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8],
  /* A= 4 */ [3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9],
  /* A= 5 */ [4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9],
  /* A= 6 */ [6, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10],
  /* A= 7 */ [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11],
  /* A= 8 */ [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11],
  /* A= 9 */ [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12],
  /* A=10 */ [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12],
  /* A=11 */ [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12],
  /* A=12 */ [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
];

function clampIdx(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * REBA (Rapid Entire Body Assessment) — Ergonomic Risk
 *
 * @reference Hignett, S. & McAtamney, L. (2000). REBA, Applied Ergonomics 31(2), 201-205.
 * @reference 중대재해처벌법 시행령 — 인체공학적 유해요인 평가
 */
export function ergonomicRisk(input: RebaInput): RebaResult {
  // --- Trunk Score ---
  const absTA = Math.abs(input.trunkAngle);
  let trunkScore: number;
  if (absTA === 0) trunkScore = 1;
  else if (absTA <= 20) trunkScore = 2;
  else if (absTA <= 60) trunkScore = 3;
  else trunkScore = 4;
  if (input.trunkAngle < 0) trunkScore = Math.max(trunkScore, 2); // extension
  if (input.trunkTwisted) trunkScore += 1;
  if (input.trunkSideBent) trunkScore += 1;

  // --- Neck Score ---
  let neckScore: number;
  if (input.neckAngle >= 0 && input.neckAngle <= 20) neckScore = 1;
  else neckScore = 2;
  if (input.neckTwisted) neckScore += 1;
  if (input.neckSideBent) neckScore += 1;

  // --- Leg Score ---
  let legScore: number;
  if (input.legSupport === 'bilateral') legScore = 1;
  else legScore = 2;
  if (input.kneeFlexion > 30 && input.kneeFlexion <= 60) legScore += 1;
  else if (input.kneeFlexion > 60) legScore += 2;

  // --- Table A lookup ---
  const tIdx = clampIdx(trunkScore, 1, 5) - 1;
  const nIdx = clampIdx(neckScore, 1, 3) - 1;
  const lIdx = clampIdx(legScore, 1, 4) - 1;
  const tableARow = tIdx * 3 + nIdx;
  let scoreA = TABLE_A[clampIdx(tableARow, 0, TABLE_A.length - 1)][lIdx];

  // Load/Force score
  let loadScore = 0;
  if (input.load >= 5 && input.load < 10) loadScore = 1;
  else if (input.load >= 10) loadScore = 2;
  if (input.shockForce) loadScore += 1;
  scoreA += loadScore;

  // --- Upper Arm Score ---
  const absUAA = Math.abs(input.upperArmAngle);
  let upperArmScore: number;
  if (absUAA <= 20) upperArmScore = 1;
  else if (absUAA <= 45) upperArmScore = 2;
  else if (absUAA <= 90) upperArmScore = 3;
  else upperArmScore = 4;
  if (input.shoulderRaised) upperArmScore += 1;
  if (input.armAbducted) upperArmScore += 1;
  if (input.armSupported) upperArmScore -= 1;
  upperArmScore = Math.max(1, upperArmScore);

  // --- Lower Arm Score ---
  let lowerArmScore: number;
  if (input.lowerArmAngle >= 60 && input.lowerArmAngle <= 100) lowerArmScore = 1;
  else lowerArmScore = 2;

  // --- Wrist Score ---
  const absWA = Math.abs(input.wristAngle);
  let wristScore: number;
  if (absWA <= 15) wristScore = 1;
  else wristScore = 2;
  if (input.wristTwisted) wristScore += 1;

  // --- Table B lookup ---
  const uaIdx = clampIdx(upperArmScore, 1, 6) - 1;
  const laIdx = clampIdx(lowerArmScore, 1, 2) - 1;
  const wIdx = clampIdx(wristScore, 1, 3) - 1;
  const tableBRow = uaIdx * 2 + laIdx;
  let scoreB = TABLE_B[clampIdx(tableBRow, 0, TABLE_B.length - 1)][wIdx];

  // Coupling score
  // Simplified: good=0, fair=1, poor=2, unacceptable=3
  // Use 0 as default (good coupling assumed)
  scoreB += 0;

  // --- Table C lookup ---
  const aIdx = clampIdx(scoreA, 1, 12) - 1;
  const bIdx = clampIdx(scoreB, 1, 12) - 1;
  let scoreC = TABLE_C[aIdx][bIdx];

  // Activity score
  let activityScore = 0;
  if (input.staticPosture) activityScore += 1;
  if (input.repeatedSmallRange) activityScore += 1;
  if (input.rapidLargeChange) activityScore += 1;

  const rebaScore = scoreC + activityScore;

  // Risk level and action
  let riskLevel: RebaResult['riskLevel'];
  let actionLevel: number;
  if (rebaScore <= 1) { riskLevel = 'negligible'; actionLevel = 0; }
  else if (rebaScore <= 3) { riskLevel = 'low'; actionLevel = 1; }
  else if (rebaScore <= 7) { riskLevel = 'medium'; actionLevel = 2; }
  else if (rebaScore <= 10) { riskLevel = 'high'; actionLevel = 3; }
  else { riskLevel = 'very_high'; actionLevel = 4; }

  return {
    trunkScore,
    neckScore,
    legScore,
    upperArmScore,
    lowerArmScore,
    wristScore,
    scoreA,
    scoreB,
    scoreC,
    rebaScore,
    riskLevel,
    actionLevel,
  };
}
