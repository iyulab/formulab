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

/**
 * Power Factor Correction Calculator Types
 */
export interface PfCorrectionInput {
  kW: number;              // Active power in kW
  currentPf: number;       // Current power factor (0-1)
  targetPf: number;        // Target power factor (0-1)
  electricityRate: number; // $/kWh
  monthlyUsageHours: number; // Hours per month
  pfPenaltyRate: number;   // Penalty rate per 0.01 below threshold
  pfPenaltyThreshold: number; // PF threshold for penalty
  capacitorCostPerKvar: number; // Cost per kVAR of capacitor
}

export interface PfCorrectionResult {
  currentKva: number;        // Current apparent power (kVA)
  targetKva: number;         // Target apparent power (kVA)
  kvarRequired: number;      // Required reactive power compensation (kVAR)
  capacitorCost: number;     // Cost of capacitors ($)
  currentMonthlyPenalty: number;  // Current monthly PF penalty ($)
  newMonthlyPenalty: number;      // New monthly PF penalty (should be 0)
  monthlySavings: number;    // Monthly savings from avoided penalties ($)
  annualSavings: number;     // Annual savings ($)
  paybackMonths: number;     // Payback period in months
}

/**
 * VFD (Variable Frequency Drive) Savings Calculator Types
 */
export interface VfdSavingsInput {
  motorKw: number;         // Motor power in kW
  fullSpeedRpm: number;    // Full speed RPM (e.g., 1800)
  newSpeedRpm: number;     // Reduced speed RPM (e.g., 1440)
  runningHoursPerYear: number; // Annual running hours
  electricityRate: number; // $/kWh
  loadFactor: number;      // Motor load factor (0-1)
  vfdCost: number;         // Cost of VFD installation ($)
  vfdEfficiency: number;   // VFD efficiency (0-1, typically 0.95-0.98)
}

export interface VfdSavingsResult {
  speedRatio: number;          // New speed / Full speed
  powerRatio: number;          // (Speed ratio)^3 - Affinity law
  originalPowerKw: number;     // Original power consumption (kW)
  newPowerKw: number;          // New power consumption with VFD (kW)
  powerReduction: number;      // Power reduction (kW)
  powerReductionPercent: number; // Power reduction (%)
  originalAnnualCost: number;  // Annual cost without VFD ($)
  newAnnualCost: number;       // Annual cost with VFD ($)
  annualSavings: number;       // Annual savings ($)
  paybackYears: number;        // Simple payback period (years)
  co2ReductionKg: number;      // Annual CO2 reduction (kg) - using avg 0.5 kg/kWh
}
