// Energy domain formulas
export { solarOutput } from './solarOutput.js';
export { carbonFootprint } from './carbonFootprint.js';
export { compressedAirCost } from './compressedAirCost.js';
export { motorEfficiency } from './motorEfficiency.js';
export { pfCorrection } from './pfCorrection.js';
export { powerCost } from './powerCost.js';
export { vfdSavings } from './vfdSavings.js';
export { boilerEfficiency } from './boilerEfficiency.js';
export { transformerLoss } from './transformerLoss.js';
export { insulationRoi } from './insulationRoi.js';
export { ledRoi } from './ledRoi.js';
export { heatPump } from './heatPump.js';
export { degreeDay } from './degreeDay.js';
export { windOutput } from './windOutput.js';
export { cusum } from './cusum.js';

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
  // Boiler efficiency types
  BoilerEfficiencyInput,
  BoilerEfficiencyResult,
  // Transformer loss types
  TransformerLossInput,
  TransformerLossResult,
  // Insulation ROI types
  InsulationRoiInput,
  InsulationRoiResult,
  // LED ROI types
  LedRoiInput,
  LedRoiResult,
  // Heat Pump types
  HeatPumpInput,
  HeatPumpResult,
  // Degree Day types
  DegreeDayInput,
  DegreeDayResult,
  // Wind Output types
  WindOutputInput,
  WindOutputResult,
  // CUSUM types
  CusumInput,
  CusumResult,
} from './types.js';
