import { roundTo } from '../utils.js';
import type { UnitCategory, UnitDef, UnitInput, UnitResult } from './types.js';

/**
 * Helper to create linear conversion functions
 */
const linear = (factor: number): Pick<UnitDef, 'toBase' | 'fromBase'> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

/**
 * Unit definitions for all supported categories
 */
const UNITS: Record<UnitCategory, UnitDef[]> = {
  length: [
    { id: 'mm', labelKey: 'mm', ...linear(0.001) },
    { id: 'cm', labelKey: 'cm', ...linear(0.01) },
    { id: 'm', labelKey: 'm', ...linear(1) },
    { id: 'km', labelKey: 'km', ...linear(1000) },
    { id: 'in', labelKey: 'in', ...linear(0.0254) },
    { id: 'ft', labelKey: 'ft', ...linear(0.3048) },
    { id: 'yd', labelKey: 'yd', ...linear(0.9144) },
    { id: 'mi', labelKey: 'mi', ...linear(1609.344) },
    { id: 'um', labelKey: 'μm', ...linear(0.000001) },
  ],
  weight: [
    { id: 'mg', labelKey: 'mg', ...linear(0.000001) },
    { id: 'g', labelKey: 'g', ...linear(0.001) },
    { id: 'kg', labelKey: 'kg', ...linear(1) },
    { id: 't', labelKey: 't', ...linear(1000) },
    { id: 'lb', labelKey: 'lb', ...linear(0.45359237) },
    { id: 'oz', labelKey: 'oz', ...linear(0.028349523125) },
  ],
  volume: [
    { id: 'mL', labelKey: 'mL', ...linear(0.000001) },
    { id: 'L', labelKey: 'L', ...linear(0.001) },
    { id: 'm3', labelKey: 'm³', ...linear(1) },
    { id: 'galUS', labelKey: 'gal(US)', ...linear(0.003785412) },
    { id: 'galUK', labelKey: 'gal(UK)', ...linear(0.00454609) },
    { id: 'flozUS', labelKey: 'fl oz(US)', ...linear(0.0000295735) },
    { id: 'cup', labelKey: 'cup', ...linear(0.000236588) },
  ],
  temperature: [
    {
      id: 'C', labelKey: '°C',
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      id: 'F', labelKey: '°F',
      toBase: (v) => (v - 32) * 5 / 9,
      fromBase: (v) => v * 9 / 5 + 32,
    },
    {
      id: 'K', labelKey: 'K',
      toBase: (v) => v - 273.15,
      fromBase: (v) => v + 273.15,
    },
  ],
  pressure: [
    { id: 'Pa', labelKey: 'Pa', ...linear(1) },
    { id: 'kPa', labelKey: 'kPa', ...linear(1000) },
    { id: 'MPa', labelKey: 'MPa', ...linear(1000000) },
    { id: 'bar', labelKey: 'bar', ...linear(100000) },
    { id: 'atm', labelKey: 'atm', ...linear(101325) },
    { id: 'psi', labelKey: 'psi', ...linear(6894.757) },
    { id: 'mmHg', labelKey: 'mmHg', ...linear(133.322) },
  ],
  area: [
    { id: 'mm2', labelKey: 'mm²', ...linear(0.000001) },
    { id: 'cm2', labelKey: 'cm²', ...linear(0.0001) },
    { id: 'm2', labelKey: 'm²', ...linear(1) },
    { id: 'km2', labelKey: 'km²', ...linear(1000000) },
    { id: 'ha', labelKey: 'ha', ...linear(10000) },
    { id: 'acre', labelKey: 'acre', ...linear(4046.8564224) },
    { id: 'ft2', labelKey: 'ft²', ...linear(0.09290304) },
    { id: 'in2', labelKey: 'in²', ...linear(0.00064516) },
  ],
  speed: [
    { id: 'ms', labelKey: 'm/s', ...linear(1) },
    { id: 'kmh', labelKey: 'km/h', ...linear(1 / 3.6) },
    { id: 'mph', labelKey: 'mph', ...linear(0.44704) },
    { id: 'kn', labelKey: 'knot', ...linear(0.514444) },
    { id: 'fts', labelKey: 'ft/s', ...linear(0.3048) },
  ],
};

/**
 * Get all available unit categories
 *
 * @returns Array of category names
 */
export function getUnitCategories(): UnitCategory[] {
  return Object.keys(UNITS) as UnitCategory[];
}

/**
 * Get unit definitions for a specific category
 *
 * @param category - Unit category
 * @returns Array of unit definitions
 */
export function getUnitsForCategory(category: UnitCategory): UnitDef[] {
  return UNITS[category] ?? [];
}

/**
 * Calculate unit conversion
 *
 * Converts a value from one unit to another within the same category,
 * and provides conversions to all units in that category.
 *
 * @param input - Unit conversion input
 * @returns Conversion result with target value and all conversions, or null if invalid
 */
export function calculateUnit(input: UnitInput): UnitResult | null {
  const units = UNITS[input.category];
  if (!units) return null;

  const from = units.find((u) => u.id === input.fromUnit);
  const to = units.find((u) => u.id === input.toUnit);
  if (!from || !to) return null;

  const baseValue = from.toBase(input.value);
  const toValue = to.fromBase(baseValue);

  const allConversions = units.map((u) => ({
    unitId: u.id,
    value: roundTo(u.fromBase(baseValue), 6),
  }));

  return {
    toValue: roundTo(toValue, 6),
    allConversions,
  };
}
