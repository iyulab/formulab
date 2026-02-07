// Automotive domain formulas
export { brakingDistance } from './brakingDistance.js';
export { batteryRuntime } from './batteryRuntime.js';
export { evCharging } from './evCharging.js';
export { fuelEconomy } from './fuelEconomy.js';
export { gearRatio } from './gearRatio.js';
export { tireCompare } from './tireCompare.js';
export { torque } from './torque.js';
export { power } from './power.js';
export { chargingLoss } from './chargingLoss.js';

// Types
export type {
  // Braking Distance types
  BrakingDistanceInput,
  BrakingDistanceResult,
  // Battery types
  BatteryInput,
  BatteryResult,
  // Charging types
  ChargingInput,
  ChargingResult,
  // Fuel economy types
  FuelUnit,
  FuelInput,
  FuelResult,
  // Gear ratio types
  GearRatioInput,
  GearRatioResult,
  // Tire comparison types
  TireSpec,
  TireInput,
  TireData,
  TireResult,
  // Torque types
  TorqueUnit,
  TorqueInput,
  TorqueResult,
  // Power types
  PowerUnit,
  PowerInput,
  PowerResult,
  // Charging Loss types
  ChargingLossInput,
  ChargingLossResult,
} from './types.js';
