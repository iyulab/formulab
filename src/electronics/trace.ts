import type { TraceInput, TraceResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Round to specified decimal places
 */

/**
 * IPC-2221 constants for trace width calculation
 * k values differ between external and internal layers
 */
const IPC2221_CONSTANTS = {
  external: {
    k: 0.048,
    b: 0.44,
    c: 0.725,
  },
  internal: {
    k: 0.024,
    b: 0.44,
    c: 0.725,
  },
};

/**
 * Copper thickness per oz/ft2 in mils
 * 1 oz/ft2 = 1.378 mils (35 um)
 */
const COPPER_THICKNESS_PER_OZ = 1.378;

/**
 * Copper resistivity at 25C in ohm-mil
 */
const COPPER_RESISTIVITY = 0.6787; // micro-ohm-inch = 0.6787 ohm-mil^2/inch

/**
 * Calculate PCB trace width using IPC-2221 formula
 * @param input - Trace parameters (current, temp rise, copper weight, layer)
 * @returns Trace width and related calculations
 */
export function traceWidth(input: TraceInput): TraceResult {
  const { current, tempRise, copperWeight, layer } = input;

  // Get constants for the layer type
  const constants = IPC2221_CONSTANTS[layer];

  // IPC-2221 formula:
  // Area (mil^2) = (I / (k * dT^b))^(1/c)
  // where:
  //   I = current in amps
  //   k = constant (0.048 external, 0.024 internal)
  //   dT = temperature rise in C
  //   b = 0.44
  //   c = 0.725
  const crossSection = Math.pow(
    current / (constants.k * Math.pow(tempRise, constants.b)),
    1 / constants.c
  );

  // Copper thickness in mils
  const copperThickness = copperWeight * COPPER_THICKNESS_PER_OZ;

  // Width = Area / thickness
  const widthMils = roundTo(crossSection / copperThickness, 4);

  // Convert to mm (1 mil = 0.0254 mm)
  const widthMm = roundTo(widthMils * 0.0254, 4);

  // Calculate resistance per inch at 25C
  // R = resistivity / Area (where resistivity is in micro-ohm-inch)
  // Area is in mil^2
  // R = 0.6787 / Area (micro-ohm/inch) = 0.6787e-6 / Area (ohm/inch)
  const resistance = roundTo(COPPER_RESISTIVITY / crossSection * 1e-6, 8);

  // Voltage drop per inch = I * R
  const voltageDrop = roundTo(current * resistance, 8);

  // Power loss per inch = I^2 * R
  const powerLoss = roundTo(current * current * resistance, 8);

  return {
    widthMils,
    widthMm,
    crossSection: roundTo(crossSection, 4),
    resistance,
    voltageDrop,
    powerLoss,
  };
}
