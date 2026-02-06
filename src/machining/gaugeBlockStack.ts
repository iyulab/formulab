import { roundTo } from '../utils.js';
import type { GaugeBlockStackInput, GaugeBlockStackResult } from './types.js';

/**
 * Metric 47-piece gauge block set (mm)
 * Standard: Grade 1 metric set per ISO 3650
 */
const METRIC_47_SET: number[] = [
  // Series 1: 1.001–1.009 (9 blocks, 0.001 steps)
  1.001, 1.002, 1.003, 1.004, 1.005, 1.006, 1.007, 1.008, 1.009,
  // Series 2: 1.01–1.49 (49 blocks → typically 1.01-1.09 step 0.01, then 1.10-1.49 step 0.10)
  // Actually standard 47-set has:
  // 9 × 0.001: 1.001-1.009
  // 9 × 0.01: 1.01-1.09
  // 9 × 0.10: 1.10-1.90 (but typically only up to 1.49 in some sets)
  // Let's use the standard 47-piece metric set:
  1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09,
  // Series 3: 0.5 step
  1.10, 1.20, 1.30, 1.40, 1.50, 1.60, 1.70, 1.80, 1.90,
  // Series 4: whole mm
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  // Series 5: tens
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
];

/**
 * Metric 88-piece gauge block set (mm) — extended precision
 */
const METRIC_88_SET: number[] = [
  // 0.001 step: 1.001-1.009
  1.001, 1.002, 1.003, 1.004, 1.005, 1.006, 1.007, 1.008, 1.009,
  // 0.01 step: 1.01-1.49
  1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09,
  1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19,
  1.20, 1.21, 1.22, 1.23, 1.24, 1.25, 1.26, 1.27, 1.28, 1.29,
  1.30, 1.31, 1.32, 1.33, 1.34, 1.35, 1.36, 1.37, 1.38, 1.39,
  1.40, 1.41, 1.42, 1.43, 1.44, 1.45, 1.46, 1.47, 1.48, 1.49,
  // whole mm: 1-9
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  // tens: 10-100
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
];

/**
 * Inch 81-piece gauge block set
 */
const INCH_81_SET: number[] = [
  // 0.0001 step: 0.1001-0.1009
  0.1001, 0.1002, 0.1003, 0.1004, 0.1005, 0.1006, 0.1007, 0.1008, 0.1009,
  // 0.001 step: 0.101-0.149
  0.101, 0.102, 0.103, 0.104, 0.105, 0.106, 0.107, 0.108, 0.109,
  0.110, 0.111, 0.112, 0.113, 0.114, 0.115, 0.116, 0.117, 0.118, 0.119,
  0.120, 0.121, 0.122, 0.123, 0.124, 0.125, 0.126, 0.127, 0.128, 0.129,
  0.130, 0.131, 0.132, 0.133, 0.134, 0.135, 0.136, 0.137, 0.138, 0.139,
  0.140, 0.141, 0.142, 0.143, 0.144, 0.145, 0.146, 0.147, 0.148, 0.149,
  // 0.050 step: 0.050-0.950
  0.050, 0.100, 0.150, 0.200, 0.250, 0.300, 0.350, 0.400, 0.450,
  0.500, 0.550, 0.600, 0.650, 0.700, 0.750, 0.800, 0.850, 0.900, 0.950,
  // whole: 1.000-4.000
  1.000, 2.000, 3.000, 4.000,
];

const SETS: Record<string, number[]> = {
  metric47: METRIC_47_SET,
  metric88: METRIC_88_SET,
  inch81: INCH_81_SET,
};

/**
 * Build a gauge block stack using successive subtraction algorithm.
 *
 * The algorithm works from the smallest digit up:
 * 1. Find a block that eliminates the least significant digit
 * 2. Subtract it from the remaining target
 * 3. Repeat until the remaining target is 0 or no suitable block is found
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. — Gauge blocks.
 *
 * @param input - Gauge block stack parameters
 * @returns GaugeBlockStackResult with selected blocks and error
 */
export function gaugeBlockStack(input: GaugeBlockStackInput): GaugeBlockStackResult {
  const { targetDimension, availableSet = 'metric47' } = input;

  const setBlocks = SETS[availableSet];
  const used = new Set<number>();
  const blocks: number[] = [];
  let remaining = roundTo(targetDimension, 4);

  // Successive subtraction algorithm (Machinery's Handbook method):
  // 1. Find a block that, when subtracted, eliminates the least significant non-zero digit
  // 2. Prefer blocks that reduce the number of significant decimal places
  // 3. Repeat until remaining is 0 or no suitable block found
  for (let iter = 0; iter < 10 && remaining > 0.0005; iter++) {
    let bestBlock: number | null = null;
    let bestScore = -Infinity;

    for (const block of setBlocks) {
      if (used.has(block)) continue;
      if (block > remaining + 0.00005) continue;

      const newRemaining = roundTo(remaining - block, 4);
      if (newRemaining < -0.00005) continue;

      // Score: prefer blocks that eliminate more decimal places
      // Count trailing zeros in newRemaining (fewer significant decimals = better)
      const score = trailingZeroScore(newRemaining);

      if (score > bestScore || (score === bestScore && block > (bestBlock ?? 0))) {
        bestScore = score;
        bestBlock = block;
      }
    }

    if (bestBlock === null) break;

    used.add(bestBlock);
    blocks.push(bestBlock);
    remaining = roundTo(remaining - bestBlock, 4);
  }

  const totalDimension = roundTo(blocks.reduce((sum, b) => sum + b, 0), 4);

  return {
    targetDimension,
    blocks: blocks.sort((a, b) => b - a),
    totalDimension,
    error: roundTo(Math.abs(targetDimension - totalDimension), 4),
    blockCount: blocks.length,
  };
}

/**
 * Score how "clean" a number is — higher score means fewer significant decimal digits.
 * 0 → score 4, X.X → score 3, X.XX → score 2, X.XXX → score 1, X.XXXX → score 0
 */
function trailingZeroScore(value: number): number {
  if (Math.abs(value) < 0.00005) return 4;
  const s = value.toFixed(4);
  const decimals = s.split('.')[1] ?? '';
  let zeros = 0;
  for (let i = decimals.length - 1; i >= 0; i--) {
    if (decimals[i] === '0') zeros++;
    else break;
  }
  return zeros;
}
