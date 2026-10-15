import { roundTo, requireFinite } from '../utils.js';
import type { GearRatioInput, GearRatioResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate gear ratio and output characteristics
 *
 * Formula:
 * - Gear Ratio = Driven Teeth / Driving Teeth
 * - Output Speed = Input Speed / Gear Ratio
 * - Output Torque = Input Torque x Gear Ratio x Efficiency
 * - Mechanical Advantage = Output Torque / Input Torque
 *
 * @param input - Gear parameters
 * @returns Gear result with ratio, speed, and torque
 * @throws RangeError if drivingTeeth or drivenTeeth is not greater than 0, or efficiency is not
 *   in (0, 1]. Signed inputSpeed/inputTorque are accepted as rotation direction.
 */
export function gearRatio(input: GearRatioInput): GearRatioResult {
  requireFinite('gearRatio', input);
  const { drivingTeeth, drivenTeeth, inputSpeed, inputTorque, efficiency } = input;

  if (!(drivingTeeth > 0)) {
    throw new InputRangeError('drivingTeeth must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'drivingTeeth', exclusive_min: 0, got: drivingTeeth,
    });
  }

  // The output speed divides by the ratio, so a driven gear with no teeth spins infinitely
  // fast rather than describing a gear pair.
  if (!(drivenTeeth > 0)) {
    throw new InputRangeError('drivenTeeth must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'drivenTeeth', exclusive_min: 0, got: drivenTeeth,
    });
  }
  // A negative efficiency reverses the output torque, and one above 1 creates power.
  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new InputRangeError('efficiency must be greater than 0 and at most 1', {
      code: 'parameter_out_of_range', parameter: 'efficiency', exclusive_min: 0, max: 1, got: efficiency,
    });
  }

  const ratio = drivenTeeth / drivingTeeth;
  const outputSpeed = inputSpeed / ratio;
  const outputTorque = inputTorque * ratio * efficiency;
  const speedReduction = ratio > 1;
  const mechanicalAdvantage = inputTorque === 0 ? 0 : outputTorque / inputTorque;

  return {
    gearRatio: roundTo(ratio, 2),
    outputSpeed: roundTo(outputSpeed, 2),
    outputTorque: roundTo(outputTorque, 2),
    speedReduction,
    mechanicalAdvantage: roundTo(mechanicalAdvantage, 2),
  };
}
