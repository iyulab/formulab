import { roundTo, requireFinite } from '../utils.js';
import { multiplicativeCascade } from '../math.js';
import type { OeeInput, OeeResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate OEE (Overall Equipment Effectiveness)
 *
 * @formula OEE = Availability × Performance × Quality
 *   - Availability = Run Time / Planned Production Time
 *   - Performance = (Ideal Cycle Time × Total Count) / Run Time
 *   - Quality = Good Count / Total Count
 *
 * @reference JIPM (1999). "TPM for Workshop Leaders", 3rd Ed.
 * @reference ISO 22400-2:2014. Key performance indicators for manufacturing operations.
 * @reference Nakajima, S. (1988). "Introduction to TPM". Productivity Press.
 *
 * @units plannedTime: minutes, runTime: minutes, idealCycleTime: minutes/piece
 *
 * @validation World-class benchmarks: A ≥ 90%, P ≥ 95%, Q ≥ 99.9% → OEE ≈ 85%
 *
 * @param input - OEE input parameters with raw production data
 * @returns OEE result with factors (0-1), percentages (0-100), and `cascade` — 100 % reduced by
 *   availability, performance, quality in that order (unrounded; last `remaining` is OEE %)
 * @throws {RangeError} plannedTime, runTime, idealCycleTime or totalCount ≤ 0; runTime > plannedTime;
 *   goodCount < 0 or > totalCount (NaN in any of them is refused too)
 */
export function oee(input: OeeInput): OeeResult {
  requireFinite('oee', input);
  const { rawData } = input;
  const { plannedTime, runTime, totalCount, goodCount, idealCycleTime } = rawData;

  if (!(plannedTime > 0)) {
    throw new InputRangeError(`Invalid input: plannedTime (${plannedTime}) must be positive`, {
      code: 'parameter_out_of_range', parameter: 'plannedTime', exclusive_min: 0, got: plannedTime,
    });
  }
  if (!(runTime > 0)) {
    throw new InputRangeError(`Invalid input: runTime (${runTime}) must be positive`, {
      code: 'parameter_out_of_range', parameter: 'runTime', exclusive_min: 0, got: runTime,
    });
  }
  if (runTime > plannedTime) {
    throw new InputRangeError(`Invalid input: runTime (${runTime}) cannot exceed plannedTime (${plannedTime})`, {
      code: 'parameter_out_of_range', parameter: 'runTime', max: plannedTime, got: runTime,
    });
  }
  if (!(idealCycleTime > 0)) {
    throw new InputRangeError(`Invalid input: idealCycleTime (${idealCycleTime}) must be positive`, {
      code: 'parameter_out_of_range', parameter: 'idealCycleTime', exclusive_min: 0, got: idealCycleTime,
    });
  }
  if (!(totalCount > 0)) {
    throw new InputRangeError(`Invalid input: totalCount (${totalCount}) must be positive`, {
      code: 'parameter_out_of_range', parameter: 'totalCount', exclusive_min: 0, got: totalCount,
    });
  }
  if (!(goodCount >= 0)) {
    throw new InputRangeError(`Invalid input: goodCount (${goodCount}) cannot be negative`, {
      code: 'parameter_out_of_range', parameter: 'goodCount', min: 0, got: goodCount,
    });
  }
  if (goodCount > totalCount) {
    throw new InputRangeError(`Invalid input: goodCount (${goodCount}) cannot exceed totalCount (${totalCount})`, {
      code: 'parameter_out_of_range', parameter: 'goodCount', max: totalCount, got: goodCount,
    });
  }

  // Availability = Run Time / Planned Time
  const availability = runTime / plannedTime;

  // Performance = (Ideal Cycle Time x Total Count) / Run Time
  // Note: idealCycleTime is in minutes, runTime is in minutes
  const performance = (idealCycleTime * totalCount) / runTime;

  // Quality = Good Count / Total Count
  const quality = goodCount / totalCount;

  // OEE = Availability x Performance x Quality, as running losses from 100 %
  const cascade = multiplicativeCascade(100, [
    { factor: 'availability', multiplier: availability },
    { factor: 'performance', multiplier: performance },
    { factor: 'quality', multiplier: quality },
  ] as const);
  const oeeValue = cascade[cascade.length - 1].remaining / 100;

  const factors = {
    availability: roundTo(availability, 4),
    performance: roundTo(performance, 4),
    quality: roundTo(quality, 4),
    oee: roundTo(oeeValue, 4),
  };
  // The factors × 100, so a percentage and its factor never disagree, and the OEE percentage
  // matches where the cascade lands (81.25 %, not 81.3 %).
  const percent = (f: number) => roundTo(f * 100, 2);
  return {
    factors,
    percentages: {
      availability: percent(factors.availability),
      performance: percent(factors.performance),
      quality: percent(factors.quality),
      oee: percent(factors.oee),
    },
    cascade,
  };
}
