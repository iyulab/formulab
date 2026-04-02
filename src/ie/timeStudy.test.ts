import { describe, it, expect } from 'vitest';
import { timeStudy } from './timeStudy.js';

describe('timeStudy', () => {
  describe('basic calculation', () => {
    it('should compute mean and stdDev', () => {
      const result = timeStudy({
        observations: [10, 12, 11, 13, 10],
        confidence: 0.95,
        accuracy: 5,
      });
      expect(result.mean).toBeCloseTo(11.2, 2);
      expect(result.stdDev).toBeCloseTo(1.3038, 2);
      expect(result.count).toBe(5);
    });

    it('should determine sufficient observations', () => {
      // Large sample with low variance should be sufficient
      const obs = Array(100).fill(10).map((v, i) => v + (i % 3 - 1) * 0.1);
      const result = timeStudy({ observations: obs, confidence: 0.95, accuracy: 5 });
      expect(result.isSufficient).toBe(true);
    });

    it('should determine insufficient observations', () => {
      const result = timeStudy({
        observations: [10, 20],
        confidence: 0.95,
        accuracy: 5,
      });
      expect(result.isSufficient).toBe(false);
      expect(result.requiredObservations).toBeGreaterThan(2);
    });

    it('should require fewer observations with lower confidence', () => {
      const high = timeStudy({ observations: [10, 11, 12], confidence: 0.99, accuracy: 5 });
      const low = timeStudy({ observations: [10, 11, 12], confidence: 0.90, accuracy: 5 });
      expect(low.requiredObservations).toBeLessThan(high.requiredObservations);
    });

    it('should require fewer observations with higher accuracy tolerance', () => {
      const tight = timeStudy({ observations: [10, 11, 12], confidence: 0.95, accuracy: 2 });
      const loose = timeStudy({ observations: [10, 11, 12], confidence: 0.95, accuracy: 10 });
      expect(loose.requiredObservations).toBeLessThan(tight.requiredObservations);
    });
  });

  describe('validation', () => {
    it('should throw for fewer than 2 observations', () => {
      expect(() => timeStudy({ observations: [10], confidence: 0.95, accuracy: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for empty observations', () => {
      expect(() => timeStudy({ observations: [], confidence: 0.95, accuracy: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for non-positive observation', () => {
      expect(() => timeStudy({ observations: [10, 0, 12], confidence: 0.95, accuracy: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for negative observation', () => {
      expect(() => timeStudy({ observations: [10, -1, 12], confidence: 0.95, accuracy: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for confidence >= 1', () => {
      expect(() => timeStudy({ observations: [10, 12], confidence: 1, accuracy: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for confidence <= 0', () => {
      expect(() => timeStudy({ observations: [10, 12], confidence: 0, accuracy: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for accuracy <= 0', () => {
      expect(() => timeStudy({ observations: [10, 12], confidence: 0.95, accuracy: 0 }))
        .toThrow(RangeError);
    });
  });
});
