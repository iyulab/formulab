/**
 * Environmental Domain Types
 */

export type FuelType = 'naturalGas' | 'diesel' | 'gasoline' | 'lpg' | 'coal' | 'fuelOil';
export type GhgGas = 'CO2' | 'CH4' | 'N2O' | 'HFC134a' | 'HFC152a' | 'SF6' | 'NF3' | 'CF4';
export type GridRegion = 'US_average' | 'EU_average' | 'China' | 'India' | 'Japan' | 'Korea' |
  'UK' | 'Germany' | 'France' | 'Brazil' | 'Australia' | 'Canada' | 'custom';
export type Scope3Category = 'purchasedGoods' | 'capitalGoods' | 'fuelEnergy' | 'transportation' |
  'waste' | 'businessTravel' | 'employeeCommuting' | 'leasedAssets';
export type WaterType = 'blue' | 'green' | 'grey';

/**
 * Scope 1 Emissions Types (Direct combustion)
 */
export interface Scope1EmissionsInput {
  fuelType: FuelType;
  quantity: number;          // m³ (gas), L (liquid), kg (solid)
}

export interface Scope1EmissionsResult {
  co2Kg: number;             // kg CO2
  co2Tonnes: number;         // tonnes CO2
  fuelType: FuelType;
  emissionFactor: number;    // kg CO2 per unit
  unit: string;              // m³, L, or kg
}

/**
 * Scope 2 Emissions Types (Purchased electricity)
 */
export interface Scope2EmissionsInput {
  electricityKwh: number;    // kWh consumed
  region: GridRegion;
  customFactor?: number;     // gCO2/kWh (for custom region)
}

export interface Scope2EmissionsResult {
  co2Kg: number;             // kg CO2
  co2Tonnes: number;         // tonnes CO2
  gridFactor: number;        // gCO2/kWh
  region: string;
}

/**
 * Scope 3 Emissions Types (Supply chain, spend-based)
 */
export interface Scope3EmissionsInput {
  category: Scope3Category;
  spendUsd: number;          // USD
}

export interface Scope3EmissionsResult {
  co2Kg: number;             // kg CO2eq
  co2Tonnes: number;         // tonnes CO2eq
  category: Scope3Category;
  eeioFactor: number;        // kg CO2eq per USD
}

/**
 * VOC Emissions Types
 */
export interface VocEmissionsInput {
  totalVocKg: number;         // kg total VOC
  captureEfficiency: number;  // 0-1
  destructionEfficiency: number; // 0-1
}

export interface VocEmissionsResult {
  emittedVocKg: number;       // kg VOC emitted
  capturedVocKg: number;      // kg VOC captured
  destroyedVocKg: number;     // kg VOC destroyed
  reductionPercent: number;   // %
}

/**
 * Product Carbon Footprint Types
 */
export interface LifecycleStage {
  name: string;
  co2Kg: number;              // kg CO2eq for this stage
}

export interface ProductCarbonFootprintInput {
  stages: LifecycleStage[];
  productionQuantity: number; // units produced
}

export interface ProductCarbonFootprintResult {
  totalCo2Kg: number;         // kg CO2eq total
  perUnitCo2Kg: number;       // kg CO2eq per unit
  stageBreakdown: {
    name: string;
    co2Kg: number;
    percent: number;
  }[];
  dominantStage: string;
}

/**
 * GWP Calculator Types
 */
export type GwpTimeHorizon = 'GWP20' | 'GWP100' | 'GWP500';

export interface GwpCalculatorInput {
  gas: GhgGas;
  quantityKg: number;        // kg
  timeHorizon?: GwpTimeHorizon; // default GWP100
}

export interface GwpCalculatorResult {
  co2eqKg: number;            // kg CO2eq
  co2eqTonnes: number;        // tonnes CO2eq
  gwpFactor: number;
  gas: GhgGas;
  timeHorizon: GwpTimeHorizon;
}

/**
 * Energy Intensity Types
 */
export interface EnergyIntensityInput {
  totalEnergyMJ: number;     // MJ total energy consumed
  productionUnits: number;   // units produced
  revenueUsd?: number;       // USD revenue (optional)
}

export interface EnergyIntensityResult {
  mjPerUnit: number;          // MJ/unit
  kwhPerUnit: number;         // kWh/unit
  mjPerRevenue?: number;      // MJ/USD (if revenue provided)
}

/**
 * Water Footprint Types
 */
export interface WaterFootprintInput {
  blueWaterM3: number;       // m³ (surface/groundwater consumed)
  greenWaterM3: number;      // m³ (rainwater consumed)
  greyWaterM3: number;       // m³ (water needed to dilute pollutants)
  productionUnits?: number;  // units (optional, for per-unit calc)
}

export interface WaterFootprintResult {
  totalWaterM3: number;       // m³
  bluePercent: number;        // %
  greenPercent: number;       // %
  greyPercent: number;        // %
  perUnitM3?: number;         // m³/unit
}

/**
 * Emissions Intensity Types
 */
export interface EmissionsIntensityInput {
  totalCo2Kg: number;        // kg CO2eq
  productionUnits?: number;  // units
  revenueUsd?: number;       // USD
  employees?: number;        // headcount
}

export interface EmissionsIntensityResult {
  kgPerUnit?: number;         // kg CO2eq/unit
  kgPerRevenue?: number;      // kg CO2eq/USD
  kgPerEmployee?: number;     // kg CO2eq/employee
  tonnesPerMillionUsd?: number; // tonnes CO2eq/M USD
}

/**
 * ESG Summary Types
 */
export interface EsgSummaryInput {
  baselineYear: number;
  baselineCo2Tonnes: number;
  currentYear: number;
  currentCo2Tonnes: number;
  targetYear: number;
  targetCo2Tonnes: number;
}

export interface EsgSummaryResult {
  reductionPercent: number;     // % reduction from baseline
  reductionTonnes: number;      // tonnes reduced
  annualRatePercent: number;    // % per year
  requiredAnnualRate: number;   // % per year needed to reach target
  onTrack: boolean;
  yearsRemaining: number;
  projectedCo2Tonnes: number;  // at current rate, projection for target year
}
