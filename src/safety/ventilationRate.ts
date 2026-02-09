import { roundTo } from '../utils.js';
import type { VentilationRateInput, VentilationRateResult, SpaceType } from './types.js';

/**
 * Recommended ACH by space type
 * Source: ASHRAE 62.1, OSHA guidelines, ACGIH Industrial Ventilation
 */
const ACH_TABLE: Record<Exclude<SpaceType, 'custom'>, number> = {
  office: 6,          // ASHRAE 62.1 typical
  classroom: 6,       // ASHRAE 62.1
  retail: 8,          // ASHRAE 62.1
  restaurant: 10,     // ASHRAE 62.1 (kitchen areas higher)
  industrial: 12,     // ACGIH / OSHA general industry
  warehouse: 6,       // ASHRAE guideline
  gym: 15,            // ASHRAE 62.1 for exercise rooms
};

/**
 * Ventilation Rate Calculator (ASHRAE 62.1 / OSHA)
 *
 * Calculates required ventilation airflow based on room dimensions,
 * occupancy, space type, and activity level.
 *
 * @throws {RangeError} Room dimensions must be positive
 * @throws {RangeError} Occupants must be positive
 * @throws {RangeError} Custom ACH must be provided and positive for custom space type
 * @param input - room dimensions, occupants, space type
 * @returns ventilation requirements in multiple units
 */
export function ventilationRate(input: VentilationRateInput): VentilationRateResult {
  const { roomLength, roomWidth, roomHeight, occupants, activityLevel, spaceType, customAch } = input;

  if (roomLength <= 0 || roomWidth <= 0 || roomHeight <= 0) {
    throw new RangeError('Room dimensions must be positive');
  }
  if (occupants <= 0) {
    throw new RangeError('Occupants must be positive');
  }

  const roomVolume = roomLength * roomWidth * roomHeight; // m³

  // Determine ACH
  let baseAch: number;
  if (spaceType === 'custom') {
    if (customAch == null || customAch <= 0) {
      throw new RangeError('Custom ACH must be provided and positive for custom space type');
    }
    baseAch = customAch;
  } else {
    baseAch = ACH_TABLE[spaceType];
  }

  // Activity level multiplier (per ACGIH metabolic rate adjustments)
  const activityMultiplier: Record<string, number> = {
    sedentary: 1.0,
    light: 1.2,
    moderate: 1.5,
    heavy: 2.0,
  };
  const multiplier = activityMultiplier[activityLevel];

  const requiredAch = baseAch * multiplier;

  // Calculate airflow in m³/h
  const m3PerHour = roomVolume * requiredAch;

  // Convert to other units
  // 1 m³ = 35.3147 ft³
  // 1 m³/h = 35.3147/60 CFM = 0.58858 CFM
  const cfm = m3PerHour * 0.58858;

  // 1 m³/h = 1000/3600 L/s ≈ 0.27778 L/s
  const litersPerSecond = m3PerHour * 0.27778;

  const cfmPerPerson = cfm / occupants;

  return {
    roomVolume: roundTo(roomVolume, 2),
    requiredAch: roundTo(requiredAch, 1),
    cfm: roundTo(cfm, 1),
    m3PerHour: roundTo(m3PerHour, 1),
    litersPerSecond: roundTo(litersPerSecond, 1),
    cfmPerPerson: roundTo(cfmPerPerson, 1),
  };
}
