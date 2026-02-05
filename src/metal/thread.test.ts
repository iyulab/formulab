import { describe, it, expect } from 'vitest';
import { thread, getMetricSizes, getUnifiedSizes } from './thread.js';

describe('thread', () => {
  describe('metric threads', () => {
    it('should return M6 thread dimensions', () => {
      const result = thread({ type: 'metric', size: 'M6' });

      expect(result).not.toBeNull();
      expect(result!.majorDiameter).toBe(6);
      expect(result!.pitch).toBe(1.0);
      expect(result!.tapDrill).toBe(5.0);
    });

    it('should return M10 thread dimensions', () => {
      const result = thread({ type: 'metric', size: 'M10' });

      expect(result).not.toBeNull();
      expect(result!.majorDiameter).toBe(10);
      expect(result!.pitch).toBe(1.5);
      expect(result!.tapDrill).toBe(8.5);
    });

    it('should calculate minor diameter for metric thread', () => {
      const result = thread({ type: 'metric', size: 'M10' });

      // Minor = D - 1.0825 x p = 10 - 1.0825 x 1.5 = 8.376
      expect(result!.minorDiameter).toBeCloseTo(8.376, 2);
    });

    it('should calculate pitch diameter for metric thread', () => {
      const result = thread({ type: 'metric', size: 'M10' });

      // Pitch = D - 0.6495 x p = 10 - 0.6495 x 1.5 = 9.026
      expect(result!.pitchDiameter).toBeCloseTo(9.026, 2);
    });
  });

  describe('unified threads', () => {
    it('should return 1/4-20 thread dimensions', () => {
      const result = thread({ type: 'unified', size: '1/4-20' });

      expect(result).not.toBeNull();
      expect(result!.majorDiameter).toBeCloseTo(6.35, 1); // 0.25 x 25.4
      expect(result!.pitch).toBe(20); // TPI
    });

    it('should return #10-24 thread dimensions', () => {
      const result = thread({ type: 'unified', size: '#10-24' });

      expect(result).not.toBeNull();
      expect(result!.majorDiameter).toBeCloseTo(4.826, 1);
    });

    it('should return 1/2-13 thread dimensions', () => {
      const result = thread({ type: 'unified', size: '1/2-13' });

      expect(result).not.toBeNull();
      expect(result!.majorDiameter).toBeCloseTo(12.7, 1);
      expect(result!.pitch).toBe(13);
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid metric size', () => {
      const result = thread({ type: 'metric', size: 'M7' });

      expect(result).toBeNull();
    });

    it('should return null for invalid unified size', () => {
      const result = thread({ type: 'unified', size: '1/3-20' });

      expect(result).toBeNull();
    });
  });

  describe('full size range', () => {
    it('should handle small metric thread M3', () => {
      const result = thread({ type: 'metric', size: 'M3' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(0.5);
    });

    it('should handle large metric thread M30', () => {
      const result = thread({ type: 'metric', size: 'M30' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(3.5);
    });

    it('should handle small unified thread #4-40', () => {
      const result = thread({ type: 'unified', size: '#4-40' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(40);
    });

    it('should handle large unified thread 3/4-10', () => {
      const result = thread({ type: 'unified', size: '3/4-10' });

      expect(result).not.toBeNull();
      expect(result!.pitch).toBe(10);
    });
  });
});

describe('getMetricSizes', () => {
  it('should return all metric thread sizes', () => {
    const sizes = getMetricSizes();

    expect(sizes).toContain('M3');
    expect(sizes).toContain('M6');
    expect(sizes).toContain('M10');
    expect(sizes).toContain('M20');
    expect(sizes).toContain('M30');
  });
});

describe('getUnifiedSizes', () => {
  it('should return all unified thread sizes', () => {
    const sizes = getUnifiedSizes();

    expect(sizes).toContain('#4-40');
    expect(sizes).toContain('#10-24');
    expect(sizes).toContain('1/4-20');
    expect(sizes).toContain('1/2-13');
    expect(sizes).toContain('3/4-10');
  });
});
