import { describe, it, expect } from 'vitest';
import { screw, getDesignations } from './screw.js';

describe('screw', () => {
  describe('coarse pitch threads', () => {
    it('should return M6 specifications', () => {
      const result = screw({ designation: 'M6', pitchType: 'coarse' });

      expect(result).not.toBeNull();
      expect(result!.nominalDiameter).toBe(6);
      expect(result!.pitch).toBe(1.0);
      expect(result!.clearanceClose).toBe(6.4);
      expect(result!.clearanceFree).toBe(7.0);
    });

    it('should return M10 specifications', () => {
      const result = screw({ designation: 'M10', pitchType: 'coarse' });

      expect(result).not.toBeNull();
      expect(result!.nominalDiameter).toBe(10);
      expect(result!.pitch).toBe(1.5);
    });

    it('should return M12 specifications', () => {
      const result = screw({ designation: 'M12', pitchType: 'coarse' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(1.75);
    });
  });

  describe('fine pitch threads', () => {
    it('should return M6 fine pitch', () => {
      const result = screw({ designation: 'M6', pitchType: 'fine' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(0.75);
    });

    it('should return M10 fine pitch', () => {
      const result = screw({ designation: 'M10', pitchType: 'fine' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(1.0);
    });
  });

  describe('minor diameter calculation', () => {
    it('should calculate minor diameter for M6', () => {
      const result = screw({ designation: 'M6', pitchType: 'coarse' });

      // Minor diameter = nominal - 1.0825 x pitch
      // = 6 - 1.0825 x 1.0 = 4.9175
      expect(result!.minorDiameter).toBeCloseTo(4.918, 2);
    });

    it('should calculate minor diameter for M10', () => {
      const result = screw({ designation: 'M10', pitchType: 'coarse' });

      // = 10 - 1.0825 x 1.5 = 8.376
      expect(result!.minorDiameter).toBeCloseTo(8.376, 2);
    });
  });

  describe('tap drill calculation', () => {
    it('should calculate tap drill for M6', () => {
      const result = screw({ designation: 'M6', pitchType: 'coarse' });

      // Tap drill = nominal - pitch = 6 - 1 = 5
      expect(result!.tapDrill).toBe(5);
    });

    it('should calculate tap drill for M8', () => {
      const result = screw({ designation: 'M8', pitchType: 'coarse' });

      // Tap drill = 8 - 1.25 = 6.75
      expect(result!.tapDrill).toBeCloseTo(6.75, 2);
    });
  });

  describe('clearance holes', () => {
    it('should provide close clearance for M4', () => {
      const result = screw({ designation: 'M4', pitchType: 'coarse' });

      expect(result!.clearanceClose).toBe(4.3);
    });

    it('should provide free clearance for M4', () => {
      const result = screw({ designation: 'M4', pitchType: 'coarse' });

      expect(result!.clearanceFree).toBe(4.8);
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid designation', () => {
      const result = screw({ designation: 'M7', pitchType: 'coarse' });

      expect(result).toBeNull();
    });

    it('should handle small screws (M1.6)', () => {
      const result = screw({ designation: 'M1.6', pitchType: 'coarse' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(0.35);
    });

    it('should handle large screws (M30)', () => {
      const result = screw({ designation: 'M30', pitchType: 'coarse' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(3.5);
    });
  });
});

describe('getDesignations', () => {
  it('should return all available designations', () => {
    const designations = getDesignations();

    expect(designations).toContain('M3');
    expect(designations).toContain('M6');
    expect(designations).toContain('M10');
    expect(designations).toContain('M20');
    expect(designations.length).toBeGreaterThan(10);
  });
});
