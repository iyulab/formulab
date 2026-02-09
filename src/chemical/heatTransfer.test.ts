import { describe, it, expect } from 'vitest';
import { heatTransfer } from './heatTransfer.js';

describe('heatTransfer', () => {
  describe('conduction (Fourier\'s Law)', () => {
    it('should calculate heat through a wall', () => {
      // Steel wall: k=50 W/(m·K), A=2 m², L=0.01 m (10mm), ΔT=100°C
      const result = heatTransfer({
        mode: 'conduction',
        conductivity: 50,
        area: 2,
        thickness: 0.01,
        tempHot: 200,
        tempCold: 100,
      });
      // Q = 50 * 2 * 100 / 0.01 = 1,000,000 W
      expect(result.heatRate).toBe(1000000);
      expect(result.heatFluxDensity).toBe(500000);
      expect(result.tempDifference).toBe(100);
      // R = 0.01 / (50 * 2) = 0.0001 K/W
      expect(result.thermalResistance).toBe(0.0001);
    });

    it('should handle insulation material (low k)', () => {
      // Glass wool: k=0.04 W/(m·K), A=10 m², L=0.1 m, ΔT=20°C
      const result = heatTransfer({
        mode: 'conduction',
        conductivity: 0.04,
        area: 10,
        thickness: 0.1,
        tempHot: 25,
        tempCold: 5,
      });
      // Q = 0.04 * 10 * 20 / 0.1 = 80 W
      expect(result.heatRate).toBe(80);
    });
  });

  describe('convection (Newton\'s Law of Cooling)', () => {
    it('should calculate natural convection from a surface', () => {
      // h=10 W/(m²·K), A=1 m², ΔT=50°C
      const result = heatTransfer({
        mode: 'convection',
        coefficient: 10,
        area: 1,
        tempSurface: 80,
        tempFluid: 30,
      });
      // Q = 10 * 1 * 50 = 500 W
      expect(result.heatRate).toBe(500);
      expect(result.heatFluxDensity).toBe(500);
      expect(result.tempDifference).toBe(50);
      expect(result.thermalResistance).toBe(0.1);
    });

    it('should handle forced convection (high h)', () => {
      // h=500 W/(m²·K), A=0.5 m²
      const result = heatTransfer({
        mode: 'convection',
        coefficient: 500,
        area: 0.5,
        tempSurface: 100,
        tempFluid: 20,
      });
      // Q = 500 * 0.5 * 80 = 20000 W
      expect(result.heatRate).toBe(20000);
    });
  });

  describe('radiation (Stefan-Boltzmann Law)', () => {
    it('should calculate radiation from a hot surface', () => {
      // ε=0.9, A=1 m², T_hot=500°C, T_cold=25°C
      const result = heatTransfer({
        mode: 'radiation',
        emissivity: 0.9,
        area: 1,
        tempHot: 500,
        tempCold: 25,
      });
      // T_h = 773.15 K, T_c = 298.15 K
      // Q = 0.9 * 5.67e-8 * 1 * (773.15^4 - 298.15^4)
      // = 0.9 * 5.67e-8 * (3.574e11 - 7.907e9)
      // ≈ 0.9 * 5.67e-8 * 3.495e11 ≈ 17830 W
      expect(result.heatRate).toBeCloseTo(17830, -2);
      expect(result.tempDifference).toBe(475);
    });

    it('should handle blackbody radiation (ε=1)', () => {
      const result = heatTransfer({
        mode: 'radiation',
        emissivity: 1.0,
        area: 1,
        tempHot: 100,
        tempCold: 0,
      });
      // T_h = 373.15 K, T_c = 273.15 K
      expect(result.heatRate).toBeGreaterThan(0);
    });
  });

  describe('validation', () => {
    it('should throw RangeError on zero conductivity', () => {
      expect(() => heatTransfer({
        mode: 'conduction', conductivity: 0, area: 1, thickness: 0.1,
        tempHot: 100, tempCold: 50,
      })).toThrow(RangeError);
    });

    it('should throw RangeError on zero area', () => {
      expect(() => heatTransfer({
        mode: 'convection', coefficient: 10, area: 0,
        tempSurface: 100, tempFluid: 50,
      })).toThrow(RangeError);
    });

    it('should throw RangeError on invalid emissivity', () => {
      expect(() => heatTransfer({
        mode: 'radiation', emissivity: 1.5, area: 1,
        tempHot: 100, tempCold: 50,
      })).toThrow(RangeError);
    });

    it('should throw RangeError on zero thickness', () => {
      expect(() => heatTransfer({
        mode: 'conduction', conductivity: 50, area: 1, thickness: 0,
        tempHot: 100, tempCold: 50,
      })).toThrow(RangeError);
    });

    it('should throw RangeError on zero convection coefficient', () => {
      expect(() => heatTransfer({
        mode: 'convection', coefficient: 0, area: 1,
        tempSurface: 100, tempFluid: 50,
      })).toThrow(RangeError);
    });

    it('should throw RangeError on absolute zero violation', () => {
      expect(() => heatTransfer({
        mode: 'radiation', emissivity: 0.9, area: 1,
        tempHot: -300, tempCold: -300,
      })).toThrow(RangeError);
    });
  });
});
