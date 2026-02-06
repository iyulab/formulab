/**
 * Battery Domain Types
 */

export type BatteryChemistry = 'LFP' | 'NMC' | 'NCA' | 'LTO' | 'LCO' | 'LeadAcid' | 'NiMH';

/**
 * Energy Density Types
 */
export interface EnergyDensityInput {
  capacityAh: number;       // Ah
  nominalVoltage: number;   // V
  massKg?: number;          // kg (for gravimetric)
  volumeL?: number;         // L (for volumetric)
}

export interface EnergyDensityResult {
  energyWh: number;             // Wh = Ah × V
  gravimetricWhPerKg: number | null;   // Wh/kg
  volumetricWhPerL: number | null;     // Wh/L
}

/**
 * C-Rate Types
 */
export type CRateMode = 'currentToRate' | 'rateToCurrent';

export type CRateInput =
  | { mode: 'currentToRate'; capacityAh: number; currentA: number }
  | { mode: 'rateToCurrent'; capacityAh: number; cRate: number };

export interface CRateResult {
  cRate: number;             // C
  currentA: number;          // A
  theoreticalTimeH: number;  // hours = 1/C
  theoreticalTimeMin: number; // minutes
}

/**
 * State of Health Types
 */
export interface StateOfHealthInput {
  measuredCapacityAh: number;  // Ah
  ratedCapacityAh: number;     // Ah
}

export type SohStatus = 'excellent' | 'good' | 'degraded' | 'poor' | 'endOfLife';

export interface StateOfHealthResult {
  sohPercent: number;       // %
  capacityLoss: number;     // Ah
  capacityLossPercent: number; // %
  status: SohStatus;
}

/**
 * Battery Pack Config Types
 */
export interface BatteryPackConfigInput {
  cellVoltage: number;       // V (nominal cell voltage)
  cellCapacityAh: number;    // Ah
  targetVoltage: number;     // V
  targetCapacityAh: number;  // Ah
}

export interface BatteryPackConfigResult {
  seriesCells: number;       // S
  parallelCells: number;     // P
  totalCells: number;        // S × P
  actualVoltage: number;     // V
  actualCapacityAh: number;  // Ah
  totalEnergyWh: number;     // Wh
  totalEnergyKWh: number;    // kWh
}

/**
 * Cycle Life Types
 */
export interface CycleLifeInput {
  chemistry: BatteryChemistry;
  depthOfDischarge: number;    // % (0-100)
  temperatureC: number;        // C
}

export interface CycleLifeResult {
  estimatedCycles: number;
  baseCycles: number;
  dodFactor: number;
  temperatureFactor: number;
  chemistry: BatteryChemistry;
}

/**
 * Internal Resistance Types
 */
export interface InternalResistanceInput {
  openCircuitVoltage: number;   // V (OCV)
  loadVoltage: number;          // V (under load)
  loadCurrentA: number;         // A
}

export interface InternalResistanceResult {
  resistanceOhm: number;        // Ohm
  resistanceMilliOhm: number;   // mOhm
  voltageDrop: number;           // V
  powerLossW: number;            // W = I²R
}

/**
 * Self-Discharge Types
 */
export interface SelfDischargeInput {
  initialVoltage: number;   // V
  finalVoltage: number;     // V
  days: number;             // days
  nominalVoltage: number;   // V (for percentage calculation)
}

export interface SelfDischargeResult {
  voltageDropPerDay: number;     // V/day
  monthlyRatePercent: number;    // %/month
  dailyRatePercent: number;      // %/day
}

/**
 * Thermal Runaway Types
 */
export interface ThermalRunawayInput {
  ambientTempC: number;          // C
  currentA: number;              // A
  internalResistanceOhm: number; // Ohm
  heatTransferCoeff: number;     // W/(m²·K) (h)
  surfaceAreaM2: number;         // m²
  runawayTempC: number;          // C (onset temperature)
}

export interface ThermalRunawayResult {
  steadyStateTempC: number;      // C
  temperatureRiseC: number;      // C
  heatGenerationW: number;       // W = I²R
  heatDissipationW: number;      // W = hA(Tss - Tamb)
  safetyMarginC: number;         // C (Trunaway - Tss)
  isSafe: boolean;
}

/**
 * BMS Balancing Types
 */
export interface BmsBalancingInput {
  cellVoltages: number[];      // V (array of cell voltages)
  balancingCurrentMA: number;  // mA
  cellCapacityAh: number;      // Ah
}

export interface BmsBalancingResult {
  maxVoltage: number;              // V
  minVoltage: number;              // V
  voltageDelta: number;            // V
  averageVoltage: number;          // V
  maxBalancingTimeMin: number;     // minutes
  maxBalancingTimeH: number;       // hours
  isBalanced: boolean;             // delta <= 10mV
  cellDetails: {
    cellIndex: number;
    voltage: number;
    deltaFromAvg: number;          // mV
    balancingTimeMin: number;
  }[];
}

/**
 * Charging Profile Types
 */
export interface ChargingProfileInput {
  capacityAh: number;         // Ah
  chargingCurrentA: number;   // A (CC phase)
  cutoffCurrentA: number;     // A (CV phase end)
  ccEndSocPercent?: number;   // % (SOC at end of CC, default 80)
}

export interface ChargingProfileResult {
  ccPhaseTimeH: number;       // hours
  ccPhaseTimeMin: number;     // minutes
  cvPhaseTimeH: number;       // hours
  cvPhaseTimeMin: number;     // minutes
  totalTimeH: number;         // hours
  totalTimeMin: number;       // minutes
  ccPhaseAh: number;          // Ah delivered in CC phase
  cvPhaseAh: number;          // Ah delivered in CV phase
  averageCRate: number;       // average C-rate over full charge
}
