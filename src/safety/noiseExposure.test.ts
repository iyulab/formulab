import { describe, it, expect } from 'vitest';
import { noiseExposure } from './noiseExposure.js';

describe('noiseExposure', () => {
  describe('dose calculation', () => {
    it('should calculate 100% dose for 8 hours at 90 dB', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 90, duration: 8 }],
      });

      expect(result.dose).toBeCloseTo(100, 0);
    });

    it('should calculate 50% dose for 4 hours at 90 dB', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 90, duration: 4 }],
      });

      expect(result.dose).toBeCloseTo(50, 0);
    });

    it('should calculate 100% dose for 4 hours at 95 dB', () => {
      // At 95 dB, allowable time = 8 / 2^((95-90)/5) = 8 / 2 = 4 hours
      const result = noiseExposure({
        exposures: [{ soundLevel: 95, duration: 4 }],
      });

      expect(result.dose).toBeCloseTo(100, 0);
    });

    it('should calculate cumulative dose for multiple exposures', () => {
      const result = noiseExposure({
        exposures: [
          { soundLevel: 90, duration: 4 },  // 50%
          { soundLevel: 95, duration: 2 },  // 50%
        ],
      });

      expect(result.dose).toBeCloseTo(100, 0);
    });
  });

  describe('TWA calculation', () => {
    it('should calculate TWA 90 dB for 100% dose', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 90, duration: 8 }],
      });

      expect(result.twa).toBeCloseTo(90, 0);
    });

    it('should calculate TWA below 90 for dose < 100%', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 85, duration: 8 }],
      });

      expect(result.twa).toBeLessThan(90);
    });

    it('should return 0 TWA for zero dose', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 70, duration: 8 }],
      });

      expect(result.twa).toBe(0);
      expect(result.dose).toBe(0);
    });
  });

  describe('status determination', () => {
    it('should be compliant when dose <= 50%', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 90, duration: 4 }],
      });

      expect(result.dose).toBe(50);
      expect(result.status).toBe('compliant');
    });

    it('should require action when 50% < dose <= 100%', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 90, duration: 6 }],
      });

      expect(result.dose).toBe(75);
      expect(result.status).toBe('actionRequired');
    });

    it('should exceed when dose > 100%', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 95, duration: 8 }],
      });

      expect(result.dose).toBe(200);
      expect(result.status).toBe('exceeds');
    });
  });

  describe('edge cases', () => {
    it('should handle sound levels below 80 dB (unlimited exposure)', () => {
      const result = noiseExposure({
        exposures: [{ soundLevel: 75, duration: 24 }],
      });

      expect(result.dose).toBe(0);
      expect(result.status).toBe('compliant');
    });

    it('should handle empty exposures array', () => {
      const result = noiseExposure({
        exposures: [],
      });

      expect(result.dose).toBe(0);
      expect(result.twa).toBe(0);
      expect(result.status).toBe('compliant');
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate typical manufacturing exposure', () => {
      const result = noiseExposure({
        exposures: [
          { soundLevel: 85, duration: 4 },   // Machine operation
          { soundLevel: 75, duration: 2 },   // Break room
          { soundLevel: 88, duration: 2 },   // Assembly area
        ],
      });

      expect(result.status).toBe('compliant');
    });

    it('should calculate construction site exposure', () => {
      const result = noiseExposure({
        exposures: [
          { soundLevel: 100, duration: 2 },  // Jackhammer
          { soundLevel: 90, duration: 4 },   // General site noise
          { soundLevel: 85, duration: 2 },   // Equipment operation
        ],
      });

      expect(result.status).toBe('exceeds');
    });
  });
});
