/**
 * Carbon Footprint Calculator Types
 */
export interface CarbonFootprintInput {
  electricityUsage: number;  // kWh
  emissionFactor: number;    // g CO2/kWh
}

export interface CarbonFootprintResult {
  co2Kg: number;
  co2Tonnes: number;
  treesEquivalent: number;
  carsEquivalent: number;
}

/**
 * Compressed Air Cost Calculator Types
 */
export interface CompressedAirCostInput {
  compressorPower: number;  // kW
  runningHours: number;     // hours
  electricityRate: number;  // $/kWh
  airOutput: number;        // m3
  maintenanceCost: number;  // $
}

export interface CompressedAirCostResult {
  electricityCost: number;
  totalCost: number;
  costPerM3: number;
  costPerCfm: number;
}

/**
 * Motor Efficiency Calculator Types
 */
export interface MotorEfficiencyInput {
  motorPower: number;        // kW
  runningHours: number;      // hours/year
  currentEfficiency: number; // 0-1
  newEfficiency: number;     // 0-1
  electricityRate: number;   // $/kWh
  loadFactor: number;        // 0-1
  upgradeCost?: number;      // $ (optional)
}

export interface MotorEfficiencyResult {
  currentAnnualCost: number;
  newAnnualCost: number;
  annualSavings: number;
  energySavings: number;
  paybackPeriod: number | null;
}

/**
 * Power Cost Calculator Types
 */
export interface PowerCostInput {
  energyConsumption: number;  // kWh
  energyRate: number;         // $/kWh
  demandPeak: number;         // kW
  demandRate: number;         // $/kW
  powerFactor: number;        // 0-1
  pfPenaltyThreshold: number; // 0-1
  pfPenaltyRate: number;      // penalty rate per 0.01 below threshold
  fixedCharges: number;       // monthly fixed charges
}

export interface PowerCostResult {
  energyCost: number;
  demandCost: number;
  pfPenalty: number;
  fixedCharges: number;
  totalCost: number;
}
