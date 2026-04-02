import { describe, it, expect } from 'vitest';
import { workSampling } from './workSampling.js';

describe('workSampling', () => {
  describe('basic calculation', () => {
    it('should compute proportion correctly', () => {
      const result = workSampling({
        totalObservations: 100,
        activityObservations: 70,
        confidence: 0.95,
        accuracy: 5,
      });
      expect(result.proportion).toBe(0.7);
    });

    it('should compute required observations', () => {
      const result = workSampling({
        totalObservations: 100,
        activityObservations: 50,
        confidence: 0.95,
        accuracy: 5,
      });
      // z=1.96, p=0.5, e=0.05 → n = (1.96²×0.5×0.5)/(0.05²) ≈ 384.16 → 385
      expect(result.requiredObservations).toBeGreaterThan(380);
      expect(result.requiredObservations).toBeLessThan(390);
    });

    it('should determine sufficient observations', () => {
      const result = workSampling({
        totalObservations: 500,
        activityObservations: 250,
        confidence: 0.95,
        accuracy: 5,
      });
      expect(result.isSufficient).toBe(true);
    });

    it('should determine insufficient observations', () => {
      const result = workSampling({
        totalObservations: 50,
        activityObservations: 25,
        confidence: 0.95,
        accuracy: 5,
      });
      expect(result.isSufficient).toBe(false);
    });

    it('should handle proportion of 0', () => {
      const result = workSampling({
        totalObservations: 100,
        activityObservations: 0,
        confidence: 0.95,
        accuracy: 5,
      });
      expect(result.proportion).toBe(0);
      expect(result.requiredObservations).toBe(0);
    });

    it('should handle proportion of 1', () => {
      const result = workSampling({
        totalObservations: 100,
        activityObservations: 100,
        confidence: 0.95,
        accuracy: 5,
      });
      expect(result.proportion).toBe(1);
      expect(result.requiredObservations).toBe(0);
    });

    it('should compute margin of error', () => {
      const result = workSampling({
        totalObservations: 400,
        activityObservations: 200,
        confidence: 0.95,
        accuracy: 5,
      });
      // z × sqrt(p(1-p)/n) = 1.96 × sqrt(0.25/400) = 1.96 × 0.025 ≈ 0.049
      expect(result.marginOfError).toBeCloseTo(0.049, 2);
    });
  });

  describe('validation', () => {
    it('should throw for totalObservations <= 0', () => {
      expect(() => workSampling({
        totalObservations: 0, activityObservations: 0, confidence: 0.95, accuracy: 5
      })).toThrow(RangeError);
    });

    it('should throw for negative activityObservations', () => {
      expect(() => workSampling({
        totalObservations: 100, activityObservations: -1, confidence: 0.95, accuracy: 5
      })).toThrow(RangeError);
    });

    it('should throw for activityObservations > totalObservations', () => {
      expect(() => workSampling({
        totalObservations: 100, activityObservations: 101, confidence: 0.95, accuracy: 5
      })).toThrow(RangeError);
    });

    it('should throw for confidence <= 0', () => {
      expect(() => workSampling({
        totalObservations: 100, activityObservations: 50, confidence: 0, accuracy: 5
      })).toThrow(RangeError);
    });

    it('should throw for accuracy <= 0', () => {
      expect(() => workSampling({
        totalObservations: 100, activityObservations: 50, confidence: 0.95, accuracy: 0
      })).toThrow(RangeError);
    });
  });
});
