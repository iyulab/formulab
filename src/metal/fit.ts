import { roundTo } from '../utils.js';
import { tolerance } from './tolerance.js';
import type { FitInput, FitResult } from './types.js';

/**
 * Combine a hole and a shaft tolerance class into an ISO 286 fit.
 *
 * ISO 286 is used in practice as a pair, not as a single tolerance zone: a drawing
 * carries `Ø30 H7/g6`, and what the designer needs from it is the clearance or
 * interference the pair produces. Computing one zone at a time leaves that final
 * subtraction to the caller, which is where sign errors live.
 *
 * This is a composition of two `tolerance()` calls plus the two extreme-condition
 * subtractions; it introduces no new table data.
 *
 * Clearance is measured in micrometres and is positive when the hole is larger than
 * the shaft. A negative value is an interference — the parts must be pressed or
 * shrunk together — so a single signed quantity covers both cases and there is no
 * separate "interference" field to keep in sync.
 *
 * The classification follows ISO 286-1 directly and invents no threshold:
 * a fit is a clearance fit when even the tightest pairing leaves a gap, an
 * interference fit when even the loosest pairing overlaps, and a transition fit
 * when the outcome depends on where each part falls inside its own tolerance zone.
 *
 * @throws RangeError if the nominal size is out of range, an IT grade is unknown,
 *   or a deviation letter is unknown (propagated from `tolerance()`)
 */
export function fit(input: FitInput): FitResult {
  const { nominalSize, holeDeviation, holeGrade, shaftDeviation, shaftGrade } = input;

  const hole = tolerance({
    nominalSize,
    fitType: 'hole',
    deviationLetter: holeDeviation,
    itGrade: holeGrade,
  });
  const shaft = tolerance({
    nominalSize,
    fitType: 'shaft',
    deviationLetter: shaftDeviation,
    itGrade: shaftGrade,
  });

  // Extreme conditions: the tightest pairing is the smallest hole with the largest
  // shaft, the loosest is the largest hole with the smallest shaft. Both deviations
  // are already micrometres relative to the same nominal size, so they subtract directly.
  const minClearance = hole.lowerDeviation - shaft.upperDeviation;
  const maxClearance = hole.upperDeviation - shaft.lowerDeviation;

  const fitClass: FitResult['fitClass'] =
    minClearance >= 0 ? 'clearance' : maxClearance <= 0 ? 'interference' : 'transition';

  return {
    designation: `${nominalSize} ${holeDeviation.toUpperCase()}${holeGrade}/${shaftDeviation.toLowerCase()}${shaftGrade}`,
    hole,
    shaft,
    minClearance: roundTo(minClearance, 1),
    maxClearance: roundTo(maxClearance, 1),
    fitClass,
  };
}
