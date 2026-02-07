import { describe, it, expect } from 'vitest';
import { calculateUnit, getUnitCategories, getUnitsForCategory } from './unit.js';

describe('getUnitCategories', () => {
  it('should return all unit categories', () => {
    const categories = getUnitCategories();

    expect(categories).toContain('length');
    expect(categories).toContain('weight');
    expect(categories).toContain('volume');
    expect(categories).toContain('temperature');
    expect(categories).toContain('pressure');
    expect(categories).toContain('area');
    expect(categories).toContain('speed');
    expect(categories).toContain('energy');
    expect(categories).toContain('power');
    expect(categories).toContain('force');
    expect(categories).toContain('torque');
    expect(categories).toContain('flowRate');
    expect(categories).toContain('angle');
    expect(categories).toContain('density');
    expect(categories).toHaveLength(14);
  });
});

describe('getUnitsForCategory', () => {
  it('should return length units', () => {
    const units = getUnitsForCategory('length');

    expect(units.length).toBeGreaterThan(0);
    expect(units.map(u => u.id)).toContain('m');
    expect(units.map(u => u.id)).toContain('ft');
    expect(units.map(u => u.id)).toContain('in');
  });

  it('should return weight units', () => {
    const units = getUnitsForCategory('weight');

    expect(units.map(u => u.id)).toContain('kg');
    expect(units.map(u => u.id)).toContain('lb');
    expect(units.map(u => u.id)).toContain('g');
  });

  it('should return temperature units', () => {
    const units = getUnitsForCategory('temperature');

    expect(units.map(u => u.id)).toContain('C');
    expect(units.map(u => u.id)).toContain('F');
    expect(units.map(u => u.id)).toContain('K');
  });
});

describe('calculateUnit', () => {
  describe('length conversions', () => {
    it('should convert meters to feet', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'm',
        toUnit: 'ft',
        value: 1,
      });

      expect(result).not.toBeNull();
      expect(result!.toValue).toBeCloseTo(3.28084, 4);
    });

    it('should convert feet to meters', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'ft',
        toUnit: 'm',
        value: 3.28084,
      });

      expect(result!.toValue).toBeCloseTo(1, 4);
    });

    it('should convert inches to centimeters', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'in',
        toUnit: 'cm',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(2.54, 4);
    });

    it('should convert kilometers to miles', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'km',
        toUnit: 'mi',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(0.621371, 4);
    });
  });

  describe('weight conversions', () => {
    it('should convert kg to lb', () => {
      const result = calculateUnit({
        category: 'weight',
        fromUnit: 'kg',
        toUnit: 'lb',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(2.20462, 4);
    });

    it('should convert lb to kg', () => {
      const result = calculateUnit({
        category: 'weight',
        fromUnit: 'lb',
        toUnit: 'kg',
        value: 2.20462,
      });

      expect(result!.toValue).toBeCloseTo(1, 3);
    });

    it('should convert grams to ounces', () => {
      const result = calculateUnit({
        category: 'weight',
        fromUnit: 'g',
        toUnit: 'oz',
        value: 28.3495,
      });

      expect(result!.toValue).toBeCloseTo(1, 3);
    });
  });

  describe('temperature conversions', () => {
    it('should convert Celsius to Fahrenheit', () => {
      const result = calculateUnit({
        category: 'temperature',
        fromUnit: 'C',
        toUnit: 'F',
        value: 0,
      });

      expect(result!.toValue).toBe(32);
    });

    it('should convert Fahrenheit to Celsius', () => {
      const result = calculateUnit({
        category: 'temperature',
        fromUnit: 'F',
        toUnit: 'C',
        value: 212,
      });

      expect(result!.toValue).toBe(100);
    });

    it('should convert Celsius to Kelvin', () => {
      const result = calculateUnit({
        category: 'temperature',
        fromUnit: 'C',
        toUnit: 'K',
        value: 0,
      });

      expect(result!.toValue).toBeCloseTo(273.15, 2);
    });

    it('should convert Kelvin to Celsius', () => {
      const result = calculateUnit({
        category: 'temperature',
        fromUnit: 'K',
        toUnit: 'C',
        value: 273.15,
      });

      expect(result!.toValue).toBeCloseTo(0, 4);
    });
  });

  describe('volume conversions', () => {
    it('should convert liters to gallons (US)', () => {
      const result = calculateUnit({
        category: 'volume',
        fromUnit: 'L',
        toUnit: 'galUS',
        value: 3.78541,
      });

      expect(result!.toValue).toBeCloseTo(1, 3);
    });

    it('should convert mL to cups', () => {
      const result = calculateUnit({
        category: 'volume',
        fromUnit: 'mL',
        toUnit: 'cup',
        value: 236.588,
      });

      expect(result!.toValue).toBeCloseTo(1, 3);
    });
  });

  describe('pressure conversions', () => {
    it('should convert bar to psi', () => {
      const result = calculateUnit({
        category: 'pressure',
        fromUnit: 'bar',
        toUnit: 'psi',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(14.5038, 3);
    });

    it('should convert atm to kPa', () => {
      const result = calculateUnit({
        category: 'pressure',
        fromUnit: 'atm',
        toUnit: 'kPa',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(101.325, 2);
    });
  });

  describe('area conversions', () => {
    it('should convert m² to ft²', () => {
      const result = calculateUnit({
        category: 'area',
        fromUnit: 'm2',
        toUnit: 'ft2',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(10.7639, 3);
    });

    it('should convert hectares to acres', () => {
      const result = calculateUnit({
        category: 'area',
        fromUnit: 'ha',
        toUnit: 'acre',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(2.47105, 3);
    });
  });

  describe('speed conversions', () => {
    it('should convert km/h to mph', () => {
      const result = calculateUnit({
        category: 'speed',
        fromUnit: 'kmh',
        toUnit: 'mph',
        value: 100,
      });

      expect(result!.toValue).toBeCloseTo(62.1371, 3);
    });

    it('should convert m/s to km/h', () => {
      const result = calculateUnit({
        category: 'speed',
        fromUnit: 'ms',
        toUnit: 'kmh',
        value: 1,
      });

      expect(result!.toValue).toBeCloseTo(3.6, 4);
    });
  });

  describe('allConversions', () => {
    it('should provide conversions to all units in category', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'm',
        toUnit: 'ft',
        value: 1,
      });

      expect(result!.allConversions.length).toBeGreaterThan(0);
      expect(result!.allConversions.find(c => c.unitId === 'm')?.value).toBe(1);
      expect(result!.allConversions.find(c => c.unitId === 'cm')?.value).toBe(100);
      expect(result!.allConversions.find(c => c.unitId === 'mm')?.value).toBe(1000);
    });
  });

  describe('energy conversions', () => {
    it('should convert kWh to BTU', () => {
      const result = calculateUnit({
        category: 'energy',
        fromUnit: 'kWh',
        toUnit: 'BTU',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(3412.14, 0);
    });

    it('should convert J to cal', () => {
      const result = calculateUnit({
        category: 'energy',
        fromUnit: 'J',
        toUnit: 'cal',
        value: 4.184,
      });
      expect(result!.toValue).toBeCloseTo(1, 3);
    });
  });

  describe('power conversions', () => {
    it('should convert kW to hp', () => {
      const result = calculateUnit({
        category: 'power',
        fromUnit: 'kW',
        toUnit: 'hp',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(1.341, 2);
    });

    it('should convert hp to W', () => {
      const result = calculateUnit({
        category: 'power',
        fromUnit: 'hp',
        toUnit: 'W',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(745.7, 0);
    });
  });

  describe('force conversions', () => {
    it('should convert kN to lbf', () => {
      const result = calculateUnit({
        category: 'force',
        fromUnit: 'kN',
        toUnit: 'lbf',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(224.809, 0);
    });

    it('should convert kgf to N', () => {
      const result = calculateUnit({
        category: 'force',
        fromUnit: 'kgf',
        toUnit: 'N',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(9.80665, 4);
    });
  });

  describe('torque conversions', () => {
    it('should convert N·m to lb·ft', () => {
      const result = calculateUnit({
        category: 'torque',
        fromUnit: 'Nm',
        toUnit: 'lbft',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(0.7376, 3);
    });

    it('should convert kgf·m to N·m', () => {
      const result = calculateUnit({
        category: 'torque',
        fromUnit: 'kgfm',
        toUnit: 'Nm',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(9.80665, 4);
    });
  });

  describe('flowRate conversions', () => {
    it('should convert L/min to gpm', () => {
      const result = calculateUnit({
        category: 'flowRate',
        fromUnit: 'Lmin',
        toUnit: 'gpm',
        value: 3.78541,
      });
      expect(result!.toValue).toBeCloseTo(1, 3);
    });

    it('should convert m³/h to L/min', () => {
      const result = calculateUnit({
        category: 'flowRate',
        fromUnit: 'm3h',
        toUnit: 'Lmin',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(16.6667, 3);
    });
  });

  describe('angle conversions', () => {
    it('should convert degrees to radians', () => {
      const result = calculateUnit({
        category: 'angle',
        fromUnit: 'deg',
        toUnit: 'rad',
        value: 180,
      });
      expect(result!.toValue).toBeCloseTo(Math.PI, 4);
    });

    it('should convert revolutions to degrees', () => {
      const result = calculateUnit({
        category: 'angle',
        fromUnit: 'rev',
        toUnit: 'deg',
        value: 1,
      });
      expect(result!.toValue).toBe(360);
    });
  });

  describe('density conversions', () => {
    it('should convert g/cm³ to kg/m³', () => {
      const result = calculateUnit({
        category: 'density',
        fromUnit: 'gcm3',
        toUnit: 'kgm3',
        value: 1,
      });
      expect(result!.toValue).toBe(1000);
    });

    it('should convert lb/ft³ to kg/m³', () => {
      const result = calculateUnit({
        category: 'density',
        fromUnit: 'lbft3',
        toUnit: 'kgm3',
        value: 1,
      });
      expect(result!.toValue).toBeCloseTo(16.0185, 2);
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid category', () => {
      const result = calculateUnit({
        category: 'invalid' as any,
        fromUnit: 'm',
        toUnit: 'ft',
        value: 1,
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid fromUnit', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'invalid',
        toUnit: 'ft',
        value: 1,
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid toUnit', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'm',
        toUnit: 'invalid',
        value: 1,
      });

      expect(result).toBeNull();
    });

    it('should handle zero value', () => {
      const result = calculateUnit({
        category: 'length',
        fromUnit: 'm',
        toUnit: 'ft',
        value: 0,
      });

      expect(result!.toValue).toBe(0);
    });

    it('should handle negative value', () => {
      const result = calculateUnit({
        category: 'temperature',
        fromUnit: 'C',
        toUnit: 'F',
        value: -40,
      });

      // -40°C = -40°F (they're equal at this point)
      expect(result!.toValue).toBe(-40);
    });
  });
});
