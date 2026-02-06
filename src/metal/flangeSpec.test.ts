import { describe, it, expect } from 'vitest';
import { flangeSpec } from './flangeSpec.js';

describe('flangeSpec', () => {
  describe('ASME B16.5 Class 150', () => {
    it('should return 4" Class 150 WN flange specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '4',
      });
      expect(result.nominalSize).toBe('4');
      expect(result.pressureClass).toBe('150');
      expect(result.outerDiameter).toBeCloseTo(228.6, 1);
      expect(result.thickness).toBeCloseTo(19.1, 1);
      expect(result.boltHoles).toBe(8);
      expect(result.boltSize).toBe('M16');
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should return 2" Class 150 WN flange specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '2',
      });
      expect(result.outerDiameter).toBeCloseTo(152.4, 1);
      expect(result.boltHoles).toBe(4);
    });

    it('should return 8" Class 150 WN flange specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '8',
      });
      expect(result.outerDiameter).toBeCloseTo(342.9, 1);
      expect(result.boltHoles).toBe(8);
    });
  });

  describe('ASME B16.5 Class 300', () => {
    it('should return 4" Class 300 with larger OD and more bolts', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '300',
        nominalSize: '4',
      });
      expect(result.outerDiameter).toBeCloseTo(254.0, 1);
      expect(result.thickness).toBeCloseTo(25.4, 1);
      expect(result.boltHoles).toBe(8);
      expect(result.boltSize).toBe('M20');
    });
  });

  describe('ASME B16.5 Class 600', () => {
    it('should return 6" Class 600 specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '600',
        nominalSize: '6',
      });
      expect(result.outerDiameter).toBeCloseTo(355.6, 1);
      expect(result.thickness).toBeCloseTo(36.6, 1);
      expect(result.boltHoles).toBe(12);
    });
  });

  describe('pressure class comparison', () => {
    it('higher class should have thicker flange', () => {
      const cl150 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '150', nominalSize: '4' });
      const cl300 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '300', nominalSize: '4' });
      const cl600 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '600', nominalSize: '4' });
      expect(cl300.thickness).toBeGreaterThan(cl150.thickness);
      expect(cl600.thickness).toBeGreaterThan(cl300.thickness);
    });

    it('higher class should have heavier flange', () => {
      const cl150 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '150', nominalSize: '8' });
      const cl600 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '600', nominalSize: '8' });
      expect(cl600.weight).toBeGreaterThan(cl150.weight);
    });
  });

  describe('error handling', () => {
    it('should throw for unknown size', () => {
      expect(() => flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '99',
      })).toThrow();
    });

    it('should throw for EN_1092_1 (not implemented)', () => {
      expect(() => flangeSpec({
        standard: 'EN_1092_1',
        pressureClass: '150',
        nominalSize: '4',
      })).toThrow('EN 1092-1');
    });
  });
});
