// Energy domain formulas
export { solarOutput } from './solarOutput.js';
export { carbonFootprint } from './carbonFootprint.js';
export { compressedAirCost } from './compressedAirCost.js';
export { motorEfficiency } from './motorEfficiency.js';
export { pfCorrection } from './pfCorrection.js';
export { powerCost } from './powerCost.js';
export { vfdSavings } from './vfdSavings.js';

// Types
export type {
  // Solar output types
  SolarOutputInput,
  SolarOutputResult,
  // Carbon footprint types
  CarbonFootprintInput,
  CarbonFootprintResult,
  // Compressed air cost types
  CompressedAirCostInput,
  CompressedAirCostResult,
  // Motor efficiency types
  MotorEfficiencyInput,
  MotorEfficiencyResult,
  // PF correction types
  PfCorrectionInput,
  PfCorrectionResult,
  // Power cost types
  PowerCostInput,
  PowerCostResult,
  // VFD savings types
  VfdSavingsInput,
  VfdSavingsResult,
} from './types.js';
