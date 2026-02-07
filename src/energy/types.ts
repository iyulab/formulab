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
 * Solar Output Calculator Types (PVWatts-based)
 */
export interface SolarOutputInput {
  panelWattage: number;      // W (per panel)
  panelCount: number;        // number of panels
  peakSunHours: number;      // hours/day (PSH)
  systemEfficiency: number;  // 0-1 (default ~0.80, accounts for inverter, wiring, soiling, degradation)
  tiltAngle: number;         // degrees from horizontal
  latitude: number;          // degrees (for optimal tilt estimation)
  azimuthOffset: number;     // degrees from south (0 = due south)
}

export interface SolarOutputResult {
  systemSizeKw: number;       // total system wattage in kW
  dailyOutputKwh: number;     // kWh per day
  monthlyOutputKwh: number;   // kWh per month (30 days)
  annualOutputKwh: number;    // kWh per year (365 days)
  capacityFactor: number;     // actual / theoretical ratio (0-1)
  tiltEfficiency: number;     // efficiency based on tilt/orientation (0-1)
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

/**
 * Boiler Efficiency Calculator Types
 */
export interface BoilerEfficiencyInput {
  fuelRate: number;            // kg/h or m³/h
  fuelHeatValue: number;       // kJ/kg or kJ/m³ (GCV/HHV)
  steamOutput: number;         // kg/h
  steamEnthalpy: number;       // kJ/kg
  feedwaterEnthalpy: number;   // kJ/kg
  operatingHours?: number;     // h/year (for annual metrics)
  fuelCost?: number;           // $/unit
}

export interface BoilerEfficiencyResult {
  heatInput: number;           // kW
  heatOutput: number;          // kW
  heatLoss: number;            // kW
  efficiency: number;          // %
  annualFuelCost: number | null;  // $/year
  annualHeatLoss: number | null;  // kWh/year
}

/**
 * Transformer Loss Calculator Types
 */
export interface TransformerLossInput {
  ratedCapacity: number;    // kVA
  coreLoss: number;         // W (no-load loss)
  copperLoss: number;       // W (full-load copper loss)
  loadFraction: number;     // 0-1
  powerFactor?: number;     // 0-1, default 0.85
  operatingHours?: number;  // h/year
  energyCost?: number;      // $/kWh
}

export interface TransformerLossResult {
  outputPower: number;         // W
  totalLoss: number;           // W
  coreLossAtLoad: number;      // W (constant)
  copperLossAtLoad: number;    // W
  efficiency: number;          // %
  optimalLoadFraction: number; // 0-1 (max efficiency point)
  annualLossEnergy: number | null;  // kWh/year
  annualLossCost: number | null;    // $/year
}

/**
 * Insulation ROI Calculator Types
 */
export interface InsulationRoiInput {
  surfaceArea: number;          // m²
  tempDifference: number;       // K or °C
  insulationK: number;          // W/(m·K) thermal conductivity
  insulationThickness: number;  // mm
  surfaceCoefficient?: number;  // W/(m²·K), default 10
  operatingHours: number;       // h/year
  energyCost: number;           // $/kWh
  boilerEfficiency?: number;    // 0-1, default 0.8
  installationCost?: number;    // $
}

export interface InsulationRoiResult {
  bareHeatLoss: number;         // W
  insulatedHeatLoss: number;    // W
  heatSaved: number;            // W
  heatLossReduction: number;    // %
  annualEnergySaved: number;    // kWh
  annualCostSaved: number;      // $
  paybackPeriod: number | null; // years
}

/**
 * LED ROI Calculator Types
 */
export interface LedRoiInput {
  fixtureCount: number;
  oldWatts: number;          // W per fixture
  newWatts: number;          // W per fixture
  operatingHours: number;    // h/year
  electricityRate: number;   // $/kWh
  fixtureCost?: number;      // $ per fixture
  installationCost?: number; // $ total
  co2Factor?: number;        // kg CO2/kWh, default 0.5
}

export interface LedRoiResult {
  oldAnnualEnergy: number;    // kWh
  newAnnualEnergy: number;    // kWh
  annualEnergySaved: number;  // kWh
  energyReduction: number;   // %
  annualCostSaved: number;   // $
  totalInvestment: number;   // $
  paybackPeriod: number | null; // years
  co2Saved: number;          // kg/year
}

/**
 * Heat Pump COP Calculator Types
 */
export interface HeatPumpInput {
  sourceTemp: number;         // °C
  sinkTemp: number;           // °C
  heatingCapacity: number;    // kW
  compressorPower: number;    // kW
  auxiliaryPower?: number;    // kW, default 0
  operatingHours?: number;    // h/year
  electricityRate?: number;   // $/kWh
  boilerEfficiency?: number;  // 0-1, for comparison
  fuelCost?: number;          // $/kWh (fuel energy cost)
}

export interface HeatPumpResult {
  cop: number;
  copCarnot: number;
  efficiency: number;         // % of Carnot
  annualElectricity: number | null;
  annualElecCost: number | null;
  annualFuelCost: number | null;
  annualSavings: number | null;
}

/**
 * Degree Day (HDD/CDD) Calculator Types
 */
export interface DegreeDayInput {
  dailyTemps: number[];       // °C
  baseHeating?: number;       // °C, default 18
  baseCooling?: number;       // °C, default 24
}

export interface DegreeDayResult {
  hdd: number;
  cdd: number;
  totalDays: number;
  heatingDays: number;
  coolingDays: number;
  neutralDays: number;
  avgTemp: number;
}

/**
 * Wind Output Calculator Types
 */
export interface WindOutputInput {
  ratedPower: number;         // kW
  hubHeight: number;          // m
  averageWindSpeed: number;   // m/s at reference height
  referenceHeight?: number;   // m, default 10
  cutInSpeed?: number;        // m/s, default 3
  cutOutSpeed?: number;       // m/s, default 25
  ratedSpeed?: number;        // m/s, default 12
  rotorDiameter?: number;     // m
  terrainRoughness?: number;  // Hellmann exponent, default 0.143
}

export interface WindOutputResult {
  adjustedWindSpeed: number;  // m/s at hub height
  capacityFactor: number;     // 0-1
  annualOutput: number;       // kWh/year
  monthlyOutput: number;      // kWh/month
  dailyOutput: number;        // kWh/day
  sweptArea: number | null;   // m²
  betzLimit: number | null;   // kW (max theoretical)
}

/**
 * CUSUM (Cumulative Sum) Energy Anomaly Detection Types
 */
export interface CusumInput {
  values: number[];
  target: number;             // μ₀
  allowance?: number;         // K, default σ/2
  decisionInterval?: number;  // H, default 5σ
  stdDev?: number;            // σ (auto-calculated if omitted)
}

export interface CusumResult {
  cusumPositive: number[];    // C⁺
  cusumNegative: number[];    // C⁻
  signals: number[];          // indices where signal detected
  isOutOfControl: boolean;
  shiftDetected: 'none' | 'positive' | 'negative' | 'both';
}
