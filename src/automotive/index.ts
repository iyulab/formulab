// Automotive domain formulas
export { batteryRuntime } from './batteryRuntime.js';
export { evCharging } from './evCharging.js';
export { fuelEconomy } from './fuelEconomy.js';
export { gearRatio } from './gearRatio.js';
export { tireCompare } from './tireCompare.js';
export { torque } from './torque.js';
export { power } from './power.js';

// Types
export type {
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
  GearInput,
  GearResult,
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
} from './types.js';
