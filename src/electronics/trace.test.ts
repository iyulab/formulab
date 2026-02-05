import { describe, it, expect } from 'vitest';
import { traceWidth } from './trace.js';

describe('traceWidth', () => {
  describe('external layer calculations', () => {
    it('should calculate trace width for 1A current', () => {
      const result = traceWidth({
        current: 1,
        tempRise: 10,
        copperWeight: 1, // 1 oz
        layer: 'external',
      });

      expect(result.widthMils).toBeGreaterThan(0);
      expect(result.widthMm).toBeGreaterThan(0);
    });

    it('should increase width with higher current', () => {
      const low = traceWidth({
        current: 1,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      const high = traceWidth({
        current: 5,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      expect(high.widthMils).toBeGreaterThan(low.widthMils);
    });

    it('should decrease width with higher temp rise allowance', () => {
      const lowTemp = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      const highTemp = traceWidth({
        current: 2,
        tempRise: 30,
        copperWeight: 1,
        layer: 'external',
      });

      expect(highTemp.widthMils).toBeLessThan(lowTemp.widthMils);
    });

    it('should decrease width with heavier copper', () => {
      const thin = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 0.5, // 0.5 oz
        layer: 'external',
      });

      const thick = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 2, // 2 oz
        layer: 'external',
      });

      expect(thick.widthMils).toBeLessThan(thin.widthMils);
    });
  });

  describe('internal layer calculations', () => {
    it('should calculate trace width for internal layer', () => {
      const result = traceWidth({
        current: 1,
        tempRise: 10,
        copperWeight: 1,
        layer: 'internal',
      });

      expect(result.widthMils).toBeGreaterThan(0);
    });

    it('should require wider traces for internal layers', () => {
      const external = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      const internal = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'internal',
      });

      // Internal layers have worse heat dissipation
      expect(internal.widthMils).toBeGreaterThan(external.widthMils);
    });
  });

  describe('cross section area', () => {
    it('should calculate cross section area', () => {
      const result = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      expect(result.crossSection).toBeGreaterThan(0);
    });
  });

  describe('resistance calculation', () => {
    it('should calculate resistance per inch', () => {
      const result = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      expect(result.resistance).toBeGreaterThan(0);
    });

    it('should show lower resistance for wider traces', () => {
      const narrow = traceWidth({
        current: 1,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      const wide = traceWidth({
        current: 5,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      // Wider trace (for higher current) has more area = lower resistance
      expect(wide.resistance).toBeLessThan(narrow.resistance);
    });
  });

  describe('voltage drop calculation', () => {
    it('should calculate voltage drop per inch', () => {
      const result = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      // V = I × R
      expect(result.voltageDrop).toBeCloseTo(2 * result.resistance, 10);
    });
  });

  describe('power loss calculation', () => {
    it('should calculate power loss per inch', () => {
      const result = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      // P = I² × R
      const expectedPower = 2 * 2 * result.resistance;
      expect(result.powerLoss).toBeCloseTo(expectedPower, 10);
    });
  });

  describe('unit conversion', () => {
    it('should convert mils to mm correctly', () => {
      const result = traceWidth({
        current: 2,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      // 1 mil = 0.0254 mm
      expect(result.widthMm).toBeCloseTo(result.widthMils * 0.0254, 3);
    });
  });

  describe('copper weight variations', () => {
    it('should calculate for 0.5 oz copper', () => {
      const result = traceWidth({
        current: 1,
        tempRise: 10,
        copperWeight: 0.5,
        layer: 'external',
      });

      expect(result.widthMils).toBeGreaterThan(0);
    });

    it('should calculate for 2 oz copper', () => {
      const result = traceWidth({
        current: 3,
        tempRise: 10,
        copperWeight: 2,
        layer: 'external',
      });

      expect(result.widthMils).toBeGreaterThan(0);
    });

    it('should calculate for 3 oz copper', () => {
      const result = traceWidth({
        current: 5,
        tempRise: 10,
        copperWeight: 3,
        layer: 'external',
      });

      expect(result.widthMils).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for USB 2.0 power (500mA)', () => {
      const result = traceWidth({
        current: 0.5,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      expect(result.widthMils).toBeLessThan(50);
      expect(result.widthMm).toBeLessThan(1.5);
    });

    it('should calculate for motor driver (5A)', () => {
      const result = traceWidth({
        current: 5,
        tempRise: 20,
        copperWeight: 2,
        layer: 'external',
      });

      expect(result.widthMils).toBeGreaterThan(30);
    });

    it('should calculate for power supply rail (10A)', () => {
      const result = traceWidth({
        current: 10,
        tempRise: 30,
        copperWeight: 2,
        layer: 'external',
      });

      expect(result.widthMm).toBeGreaterThan(1);
    });

    it('should calculate for signal trace (100mA)', () => {
      const result = traceWidth({
        current: 0.1,
        tempRise: 10,
        copperWeight: 1,
        layer: 'external',
      });

      expect(result.widthMils).toBeLessThan(20);
    });
  });
});
