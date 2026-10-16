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

/** The Battery University BU-808 Table 2 column a chemistry's DOD factor follows. */
export type DodCurve = 'NMC' | 'LFP';

export interface CycleLifeResult {
  estimatedCycles: number;
  baseCycles: number;
  dodFactor: number;
  temperatureFactor: number;
  chemistry: BatteryChemistry;
  /** Which BU-808 column set the DOD factor — 'NMC' is an approximation for chemistries the table has no column for. */
  dodCurve: DodCurve;
  /** True when depthOfDischarge is below the table's shallowest row (10%) and that row's factor was used. */
  dodBelowTable: boolean;
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
  /**
   * Acceptance limit on the open-circuit voltage decay, mV/day — the line's own screening limit
   * (it depends on cell, temperature and meter resolution; there is no universal value). When
   * given, the result says whether the measured decay is within it.
   */
  limitMvPerDay?: number;
}

export interface SelfDischargeResult {
  voltageDropPerDay: number;     // V/day
  /** The same decay in mV/day — the unit OCV screening limits are written in. */
  voltageDropMvPerDay: number;   // mV/day
  /**
   * Voltage decay as % of the nominal voltage per month. **Not a capacity loss**: datasheet
   * self-discharge figures (e.g. Li-ion 1–3 %/month) are % of capacity, and on a flat OCV–SOC
   * curve one % of voltage is several % of state of charge.
   */
  monthlyRatePercent: number;    // %/month of nominal voltage
  /** Voltage decay as % of the nominal voltage per day (not a capacity loss). */
  dailyRatePercent: number;      // %/day of nominal voltage
  /** `voltageDropMvPerDay ≤ limitMvPerDay`. Present only when `limitMvPerDay` is given. */
  withinLimit?: boolean;
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
  /** τ of the CV current's exponential taper, I(t) = Icc·e^(−t/τ), in hours: cvPhaseAh / (Icc − Icut). */
  cvTimeConstantH: number;
  /**
   * The charging current over time the phase times assume — flat at Icc through the CC phase, then
   * the exponential taper to the cutoff — sampled for plotting. Starts at t = 0 and ends at totalTimeH.
   */
  currentCurve: { timeH: number; currentA: number }[];
}
