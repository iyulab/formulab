import { describe, it, expect } from 'vitest';
import { pipeSpec } from './pipeSpec.js';

describe('pipeSpec', () => {
  describe('ANSI standard', () => {
    it('should return 2" SCH40 pipe dimensions', () => {
      const result = pipeSpec({ standard: 'ANSI', nominalSize: '2', schedule: 'SCH40' });
      expect(result.nominalSize).toBe('2');
      expect(result.outerDiameter).toBeCloseTo(60.3, 1);
      expect(result.wallThickness).toBeCloseTo(3.91, 2);
      expect(result.innerDiameter).toBeCloseTo(52.48, 1);
      expect(result.weightPerMeter).toBeGreaterThan(0);
      expect(result.crossSectionArea).toBeGreaterThan(0);
      expect(result.internalArea).toBeGreaterThan(0);
    });

    it('should return 4" SCH80 pipe dimensions', () => {
      const result = pipeSpec({ standard: 'ANSI', nominalSize: '4', schedule: 'SCH80' });
      expect(result.outerDiameter).toBeCloseTo(114.3, 1);
      expect(result.wallThickness).toBeCloseTo(8.56, 2);
      // ID = 114.3 - 2*8.56 = 97.18
      expect(result.innerDiameter).toBeCloseTo(97.18, 1);
    });

    it('should return 1/2" SCH40 pipe dimensions', () => {
      const result = pipeSpec({ standard: 'ANSI', nominalSize: '1/2', schedule: 'SCH40' });
      expect(result.outerDiameter).toBeCloseTo(21.3, 1);
      expect(result.wallThickness).toBeCloseTo(2.77, 2);
    });

    it('should handle SCH160', () => {
      const result = pipeSpec({ standard: 'ANSI', nominalSize: '6', schedule: 'SCH160' });
      expect(result.wallThickness).toBeCloseTo(18.26, 2);
    });

    it('should handle XXS', () => {
      const result = pipeSpec({ standard: 'ANSI', nominalSize: '2', schedule: 'XXS' });
      expect(result.wallThickness).toBeCloseTo(11.07, 2);
    });
  });

  describe('DN standard', () => {
    it('should convert DN50 to 2" and return correct specs', () => {
      const result = pipeSpec({ standard: 'DN', nominalSize: 'DN50', schedule: 'SCH40' });
      expect(result.nominalSize).toBe('2');
      expect(result.outerDiameter).toBeCloseTo(60.3, 1);
    });

    it('should convert DN100 to 4"', () => {
      const result = pipeSpec({ standard: 'DN', nominalSize: 'DN100', schedule: 'SCH40' });
      expect(result.nominalSize).toBe('4');
      expect(result.outerDiameter).toBeCloseTo(114.3, 1);
    });

    it('should convert DN200 to 8"', () => {
      const result = pipeSpec({ standard: 'DN', nominalSize: 'DN200', schedule: 'SCH40' });
      expect(result.outerDiameter).toBeCloseTo(219.1, 1);
    });
  });

  describe('weight calculation', () => {
    it('weight should increase with thicker schedule', () => {
      const sch40 = pipeSpec({ standard: 'ANSI', nominalSize: '4', schedule: 'SCH40' });
      const sch80 = pipeSpec({ standard: 'ANSI', nominalSize: '4', schedule: 'SCH80' });
      expect(sch80.weightPerMeter).toBeGreaterThan(sch40.weightPerMeter);
    });

    it('internal area should decrease with thicker schedule', () => {
      const sch40 = pipeSpec({ standard: 'ANSI', nominalSize: '4', schedule: 'SCH40' });
      const sch80 = pipeSpec({ standard: 'ANSI', nominalSize: '4', schedule: 'SCH80' });
      expect(sch80.internalArea).toBeLessThan(sch40.internalArea);
    });
  });

  describe('error handling', () => {
    it('should throw for unknown pipe size', () => {
      expect(() => pipeSpec({ standard: 'ANSI', nominalSize: '99', schedule: 'SCH40' })).toThrow();
    });

    it('should throw for unknown DN size', () => {
      expect(() => pipeSpec({ standard: 'DN', nominalSize: 'DN999', schedule: 'SCH40' })).toThrow();
    });
  });
});
