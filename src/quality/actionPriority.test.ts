import { describe, it, expect } from 'vitest';
import { actionPriority } from './actionPriority.js';

describe('actionPriority', () => {
  describe('basic AP lookup', () => {
    it('should return H for S=10, O=10, D=10', () => {
      const result = actionPriority({ severity: 10, occurrence: 10, detection: 10 });
      expect(result.actionPriority).toBe('H');
      expect(result.rpn).toBe(1000);
    });

    it('should return L for S=1, O=1, D=1', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 1 });
      expect(result.actionPriority).toBe('L');
      expect(result.rpn).toBe(1);
    });

    it('should return M for S=5, O=5, D=5 (mid-range)', () => {
      const result = actionPriority({ severity: 5, occurrence: 5, detection: 5 });
      expect(result.actionPriority).toBe('M');
    });
  });

  describe('severity group boundaries', () => {
    it('S=1 → sGroup 0', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 1 });
      expect(result.severityGroup).toBe(0);
    });

    it('S=2 → sGroup 1', () => {
      const result = actionPriority({ severity: 2, occurrence: 1, detection: 1 });
      expect(result.severityGroup).toBe(1);
    });

    it('S=3 → sGroup 1', () => {
      const result = actionPriority({ severity: 3, occurrence: 1, detection: 1 });
      expect(result.severityGroup).toBe(1);
    });

    it('S=4 → sGroup 2', () => {
      const result = actionPriority({ severity: 4, occurrence: 1, detection: 1 });
      expect(result.severityGroup).toBe(2);
    });

    it('S=7 → sGroup 3', () => {
      const result = actionPriority({ severity: 7, occurrence: 1, detection: 1 });
      expect(result.severityGroup).toBe(3);
    });

    it('S=9 → sGroup 4', () => {
      const result = actionPriority({ severity: 9, occurrence: 1, detection: 1 });
      expect(result.severityGroup).toBe(4);
    });
  });

  describe('detection group boundaries', () => {
    it('D=1 → dGroup 0', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 1 });
      expect(result.detectionGroup).toBe(0);
    });

    it('D=2 → dGroup 1', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 2 });
      expect(result.detectionGroup).toBe(1);
    });

    it('D=4 → dGroup 1', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 4 });
      expect(result.detectionGroup).toBe(1);
    });

    it('D=5 → dGroup 2', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 5 });
      expect(result.detectionGroup).toBe(2);
    });

    it('D=7 → dGroup 3', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 7 });
      expect(result.detectionGroup).toBe(3);
    });

    it('D=9 → dGroup 4', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 9 });
      expect(result.detectionGroup).toBe(4);
    });
  });

  describe('AP table spot checks', () => {
    // S=9-10, O=9-10, D=1 → H
    it('S=10, O=10, D=1 → H', () => {
      expect(actionPriority({ severity: 10, occurrence: 10, detection: 1 }).actionPriority).toBe('H');
    });

    // S=9-10, O=1, D=1 → L
    it('S=9, O=1, D=1 → L', () => {
      expect(actionPriority({ severity: 9, occurrence: 1, detection: 1 }).actionPriority).toBe('L');
    });

    // S=9-10, O=2-3, D=5-6 → M
    it('S=10, O=2, D=5 → M', () => {
      expect(actionPriority({ severity: 10, occurrence: 2, detection: 5 }).actionPriority).toBe('M');
    });

    // S=7-8, O=4-6, D=7-8 → H
    it('S=7, O=5, D=8 → H', () => {
      expect(actionPriority({ severity: 7, occurrence: 5, detection: 8 }).actionPriority).toBe('H');
    });

    // S=4-6, O=2-3, D=2-4 → L
    it('S=5, O=3, D=3 → L', () => {
      expect(actionPriority({ severity: 5, occurrence: 3, detection: 3 }).actionPriority).toBe('L');
    });

    // S=1, O=4-6, D=9-10 → M
    it('S=1, O=5, D=10 → M', () => {
      expect(actionPriority({ severity: 1, occurrence: 5, detection: 10 }).actionPriority).toBe('M');
    });

    // S=2-3, O=9-10, D=2-4 → M
    it('S=2, O=10, D=3 → M', () => {
      expect(actionPriority({ severity: 2, occurrence: 10, detection: 3 }).actionPriority).toBe('M');
    });

    // S=7-8, O=1, D=9-10 → M
    it('S=8, O=1, D=10 → M', () => {
      expect(actionPriority({ severity: 8, occurrence: 1, detection: 10 }).actionPriority).toBe('M');
    });
  });

  describe('RPN calculation', () => {
    it('should compute RPN as S × O × D', () => {
      const result = actionPriority({ severity: 7, occurrence: 4, detection: 3 });
      expect(result.rpn).toBe(84);
    });
  });

  describe('validation', () => {
    it('should throw for severity < 1', () => {
      expect(() => actionPriority({ severity: 0, occurrence: 5, detection: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for severity > 10', () => {
      expect(() => actionPriority({ severity: 11, occurrence: 5, detection: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for occurrence < 1', () => {
      expect(() => actionPriority({ severity: 5, occurrence: 0, detection: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for detection > 10', () => {
      expect(() => actionPriority({ severity: 5, occurrence: 5, detection: 11 }))
        .toThrow(RangeError);
    });

    it('should throw for NaN severity', () => {
      expect(() => actionPriority({ severity: NaN, occurrence: 5, detection: 5 }))
        .toThrow(RangeError);
    });
  });
});
