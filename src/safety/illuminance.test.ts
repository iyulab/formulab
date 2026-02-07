import { describe, it, expect } from 'vitest';
import { illuminance } from './illuminance.js';

describe('illuminance', () => {
  describe('basic fixture calculation', () => {
    it('should calculate number of fixtures needed', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 500,
        lumensPerLuminaire: 3000,
        cu: 0.5,
        mf: 0.8,
      });

      // N = (500 × 80) / (3000 × 0.5 × 0.8) = 40000 / 1200 = 33.33 → 34
      expect(result.fixturesNeeded).toBe(34);
    });

    it('should calculate actual lux with rounded fixture count', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 500,
        lumensPerLuminaire: 3000,
        cu: 0.5,
        mf: 0.8,
      });

      // actualLux = (34 × 3000 × 0.5 × 0.8) / 80 = 40800 / 80 = 510
      expect(result.actualLux).toBe(510);
      expect(result.actualLux).toBeGreaterThanOrEqual(500);
    });
  });

  describe('room index calculation', () => {
    it('should calculate room index correctly', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        workplaneHeight: 0.85,
        targetLux: 300,
        lumensPerLuminaire: 2500,
      });

      // Hm = 3 - 0.85 = 2.15
      // RI = (10 × 8) / (2.15 × (10 + 8)) = 80 / 38.7 = 2.067
      expect(result.roomIndex).toBeCloseTo(2.067, 2);
    });

    it('should use default workplane height of 0.85m', () => {
      const result = illuminance({
        roomLength: 6,
        roomWidth: 4,
        luminaireHeight: 2.8,
        targetLux: 500,
        lumensPerLuminaire: 3000,
      });

      // Hm = 2.8 - 0.85 = 1.95
      // RI = (6 × 4) / (1.95 × (6 + 4)) = 24 / 19.5 = 1.231
      expect(result.roomIndex).toBeCloseTo(1.231, 2);
    });
  });

  describe('CU auto-lookup', () => {
    it('should auto-lookup CU from room index', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 300,
        lumensPerLuminaire: 2500,
      });

      // Room Index ≈ 2.07 → CU lookup should interpolate between 2.0 (0.52) and 2.5 (0.57)
      expect(result.fixturesNeeded).toBeGreaterThan(0);
      expect(result.actualLux).toBeGreaterThanOrEqual(300);
    });

    it('should use provided CU override', () => {
      const withAuto = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 300,
        lumensPerLuminaire: 2500,
      });

      const withOverride = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 300,
        lumensPerLuminaire: 2500,
        cu: 0.3,
      });

      // Lower CU → more fixtures needed
      expect(withOverride.fixturesNeeded).toBeGreaterThan(withAuto.fixturesNeeded);
    });
  });

  describe('power density', () => {
    it('should calculate power density when watts provided', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 500,
        lumensPerLuminaire: 3000,
        wattsPerLuminaire: 36,
        cu: 0.5,
        mf: 0.8,
      });

      // powerDensity = (34 × 36) / 80 = 1224 / 80 = 15.3 W/m²
      expect(result.powerDensity).toBe(15.3);
    });

    it('should return null power density when watts not provided', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 500,
        lumensPerLuminaire: 3000,
      });

      expect(result.powerDensity).toBeNull();
    });
  });

  describe('recommended spacing', () => {
    it('should calculate max recommended spacing', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        workplaneHeight: 0.85,
        targetLux: 300,
        lumensPerLuminaire: 2500,
      });

      // Hm = 2.15, spacing = 1.5 × 2.15 = 3.225
      expect(result.recommendedSpacing).toBeCloseTo(3.225, 2);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero room length', () => {
      const result = illuminance({
        roomLength: 0,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 500,
        lumensPerLuminaire: 3000,
      });

      expect(result.fixturesNeeded).toBe(0);
    });

    it('should return zeros for zero lumens per luminaire', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 3,
        targetLux: 500,
        lumensPerLuminaire: 0,
      });

      expect(result.fixturesNeeded).toBe(0);
    });

    it('should return zeros when luminaire at workplane height', () => {
      const result = illuminance({
        roomLength: 10,
        roomWidth: 8,
        luminaireHeight: 0.85,
        workplaneHeight: 0.85,
        targetLux: 500,
        lumensPerLuminaire: 3000,
      });

      // Hm = 0 → invalid
      expect(result.fixturesNeeded).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate typical office lighting (500 lux)', () => {
      const result = illuminance({
        roomLength: 12,
        roomWidth: 8,
        luminaireHeight: 2.8,
        targetLux: 500,
        lumensPerLuminaire: 3600,
        wattsPerLuminaire: 36,
      });

      expect(result.fixturesNeeded).toBeGreaterThan(10);
      expect(result.actualLux).toBeGreaterThanOrEqual(500);
      expect(result.powerDensity).toBeGreaterThan(0);
    });

    it('should calculate warehouse lighting (200 lux)', () => {
      const result = illuminance({
        roomLength: 30,
        roomWidth: 20,
        luminaireHeight: 8,
        workplaneHeight: 0,
        targetLux: 200,
        lumensPerLuminaire: 20000,
        wattsPerLuminaire: 150,
      });

      expect(result.fixturesNeeded).toBeGreaterThan(0);
      expect(result.actualLux).toBeGreaterThanOrEqual(200);
    });
  });
});
