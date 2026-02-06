// Types
export type {
  FuelType,
  GhgGas,
  GridRegion,
  Scope3Category,
  WaterType,
  Scope1EmissionsInput,
  Scope1EmissionsResult,
  Scope2EmissionsInput,
  Scope2EmissionsResult,
  Scope3EmissionsInput,
  Scope3EmissionsResult,
  VocEmissionsInput,
  VocEmissionsResult,
  LifecycleStage,
  ProductCarbonFootprintInput,
  ProductCarbonFootprintResult,
  GwpTimeHorizon,
  GwpCalculatorInput,
  GwpCalculatorResult,
  EnergyIntensityInput,
  EnergyIntensityResult,
  WaterFootprintInput,
  WaterFootprintResult,
  EmissionsIntensityInput,
  EmissionsIntensityResult,
  EsgSummaryInput,
  EsgSummaryResult,
} from './types.js';

// Functions
export { scope1Emissions } from './scope1Emissions.js';
export { scope2Emissions } from './scope2Emissions.js';
export { scope3Emissions } from './scope3Emissions.js';
export { vocEmissions } from './vocEmissions.js';
export { productCarbonFootprint } from './productCarbonFootprint.js';
export { gwpCalculator } from './gwpCalculator.js';
export { energyIntensity } from './energyIntensity.js';
export { waterFootprint } from './waterFootprint.js';
export { emissionsIntensity } from './emissionsIntensity.js';
export { esgSummary } from './esgSummary.js';
