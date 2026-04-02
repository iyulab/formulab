import { describe, it, expect } from 'vitest';
import { vaAnalysis } from './vaAnalysis.js';

describe('vaAnalysis', () => {
  describe('basic calculation', () => {
    it('should categorize and compute ratios', () => {
      const result = vaAnalysis({
        activities: [
          { name: 'Assembly', duration: 30, category: 'VA' },
          { name: 'Inspection', duration: 10, category: 'NNVA' },
          { name: 'Waiting', duration: 20, category: 'NVA' },
          { name: 'Machining', duration: 40, category: 'VA' },
        ],
      });
      expect(result.totalDuration).toBe(100);
      expect(result.va.count).toBe(2);
      expect(result.va.totalDuration).toBe(70);
      expect(result.va.ratio).toBe(0.7);
      expect(result.nva.count).toBe(1);
      expect(result.nva.totalDuration).toBe(20);
      expect(result.nva.ratio).toBe(0.2);
      expect(result.nnva.count).toBe(1);
      expect(result.nnva.totalDuration).toBe(10);
      expect(result.nnva.ratio).toBe(0.1);
      expect(result.vaRatio).toBe(0.7);
    });

    it('should handle all VA activities', () => {
      const result = vaAnalysis({
        activities: [
          { name: 'A', duration: 10, category: 'VA' },
          { name: 'B', duration: 20, category: 'VA' },
        ],
      });
      expect(result.vaRatio).toBe(1);
      expect(result.nva.count).toBe(0);
      expect(result.nnva.count).toBe(0);
    });

    it('should handle all NVA activities', () => {
      const result = vaAnalysis({
        activities: [
          { name: 'A', duration: 10, category: 'NVA' },
        ],
      });
      expect(result.vaRatio).toBe(0);
      expect(result.nva.ratio).toBe(1);
    });

    it('should handle zero duration activities', () => {
      const result = vaAnalysis({
        activities: [
          { name: 'A', duration: 0, category: 'VA' },
          { name: 'B', duration: 10, category: 'NVA' },
        ],
      });
      expect(result.va.totalDuration).toBe(0);
      expect(result.va.ratio).toBe(0);
    });

    it('should handle all zero durations', () => {
      const result = vaAnalysis({
        activities: [
          { name: 'A', duration: 0, category: 'VA' },
          { name: 'B', duration: 0, category: 'NVA' },
        ],
      });
      expect(result.totalDuration).toBe(0);
      expect(result.va.ratio).toBe(0);
      expect(result.nva.ratio).toBe(0);
    });
  });

  describe('validation', () => {
    it('should throw for empty activities', () => {
      expect(() => vaAnalysis({ activities: [] })).toThrow(RangeError);
    });

    it('should throw for negative duration', () => {
      expect(() => vaAnalysis({
        activities: [{ name: 'A', duration: -5, category: 'VA' }],
      })).toThrow(RangeError);
    });

    it('should throw for NaN duration', () => {
      expect(() => vaAnalysis({
        activities: [{ name: 'A', duration: NaN, category: 'VA' }],
      })).toThrow(RangeError);
    });
  });
});
