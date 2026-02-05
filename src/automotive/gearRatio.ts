import { roundTo } from '../utils.js';
import type { GearInput, GearResult } from './types.js';

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
 */
export function gearRatio(input: GearInput): GearResult {
  const { drivingTeeth, drivenTeeth, inputSpeed, inputTorque, efficiency } = input;

  // Handle edge case - zero driving teeth
  if (drivingTeeth === 0) {
    return {
      gearRatio: 0,
      outputSpeed: 0,
      outputTorque: 0,
      speedReduction: false,
      mechanicalAdvantage: 0,
    };
  }

  const ratio = drivenTeeth / drivingTeeth;
  const outputSpeed = inputSpeed / ratio;
  const outputTorque = inputTorque * ratio * efficiency;
  const speedReduction = ratio > 1;
  const mechanicalAdvantage = outputTorque / inputTorque;

  return {
    gearRatio: roundTo(ratio, 2),
    outputSpeed: roundTo(outputSpeed, 2),
    outputTorque: roundTo(outputTorque, 2),
    speedReduction,
    mechanicalAdvantage: roundTo(mechanicalAdvantage, 2),
  };
}
