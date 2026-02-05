/**
 * Battery Runtime Calculator Types
 */
export interface BatteryInput {
  capacityAh: number;
  voltageV: number;
  loadW: number;
  efficiency: number; // 0-1, default 0.85
}

export interface BatteryResult {
  energyWh: number;
  energyKwh: number;
  runtimeHours: number;
  runtimeMinutes: number;
  currentDraw: number; // amps
}

/**
 * EV Charging Calculator Types
 */
export interface ChargingInput {
  batteryCapacityKwh: number;
  chargerPowerKw: number;
  socStartPercent: number;
  socEndPercent: number;
  efficiency: number; // 0-1, default 0.9
}

export interface ChargingResult {
  energyNeeded: number;     // kWh (net energy to battery)
  energyFromGrid: number;   // kWh (accounting for efficiency)
  chargingTimeHours: number;
  chargingTimeMinutes: number;
}

/**
 * Fuel Economy Converter Types
 */
export type FuelUnit = 'kmPerL' | 'lPer100km' | 'mpgUS' | 'mpgUK';

export interface FuelInput {
  fromUnit: FuelUnit;
  value: number;
}

export interface FuelResult {
  kmPerL: number;
  lPer100km: number;
  mpgUS: number;
  mpgUK: number;
}

/**
 * Gear Ratio Calculator Types
 */
export interface GearInput {
  drivingTeeth: number;
  drivenTeeth: number;
  inputSpeed: number;       // RPM
  inputTorque: number;      // Nm
  efficiency: number;       // 0-1, default 0.95
}

export interface GearResult {
  gearRatio: number;        // :1
  outputSpeed: number;      // RPM
  outputTorque: number;     // Nm
  speedReduction: boolean;
  mechanicalAdvantage: number;
}

/**
 * Tire Comparison Types
 */
export interface TireSpec {
  width: number;     // mm
  aspect: number;    // %
  rim: number;       // inches
}

export interface TireInput {
  tire1: TireSpec;
  tire2: TireSpec;
}

export interface TireData {
  diameter: number;       // mm
  circumference: number;  // mm
  revsPerKm: number;
}

export interface TireResult {
  tire1: TireData;
  tire2: TireData;
  diameterDiff: number;        // mm
  diameterDiffPercent: number; // %
  speedoCorrection: number;    // %
}

/**
 * Torque Converter Types
 */
export type TorqueUnit = 'Nm' | 'kgfm' | 'ftlbf';

export interface TorqueInput {
  fromUnit: TorqueUnit;
  value: number;
}

export interface TorqueResult {
  Nm: number;
  kgfm: number;
  ftlbf: number;
}

/**
 * Power Converter Types
 */
export type PowerUnit = 'kW' | 'HP' | 'PS';

export interface PowerInput {
  fromUnit: PowerUnit;
  value: number;
}

export interface PowerResult {
  kW: number;
  HP: number;
  PS: number;
}
