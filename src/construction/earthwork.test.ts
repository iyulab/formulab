import { describe, it, expect } from 'vitest';
import { earthwork } from './earthwork.js';

describe('earthwork', () => {
  describe('basic volume calculations', () => {
    it('should calculate bank volume correctly', () => {
      const result = earthwork({
        length: 10,
        width: 5,
        depth: 2,
        swellFactor: 1.25,
        shrinkFactor: 0.9,
      });

      expect(result.bankVolume).toBe(100); // 10 * 5 * 2 = 100 m³
    });

    it('should calculate loose volume with swell factor', () => {
      const result = earthwork({
        length: 10,
        width: 5,
        depth: 2,
        swellFactor: 1.25,
        shrinkFactor: 0.9,
      });

      expect(result.looseVolume).toBe(125); // 100 * 1.25 = 125 m³
    });

    it('should calculate compacted volume with shrink factor', () => {
      const result = earthwork({
        length: 10,
        width: 5,
        depth: 2,
        swellFactor: 1.25,
        shrinkFactor: 0.9,
      });

      expect(result.compactedVolume).toBe(90); // 100 * 0.9 = 90 m³
    });
  });

  describe('different soil types', () => {
    it('should handle sand (low swell)', () => {
      // Sand typically swells 10-15%
      const result = earthwork({
        length: 100,
        width: 10,
        depth: 1,
        swellFactor: 1.12,
        shrinkFactor: 0.95,
      });

      expect(result.bankVolume).toBe(1000);
      expect(result.looseVolume).toBe(1120);
      expect(result.compactedVolume).toBe(950);
    });

    it('should handle clay (high swell)', () => {
      // Clay typically swells 30-40%
      const result = earthwork({
        length: 100,
        width: 10,
        depth: 1,
        swellFactor: 1.35,
        shrinkFactor: 0.85,
      });

      expect(result.bankVolume).toBe(1000);
      expect(result.looseVolume).toBe(1350);
      expect(result.compactedVolume).toBe(850);
    });

    it('should handle rock (high swell)', () => {
      // Rock typically swells 50-70%
      const result = earthwork({
        length: 50,
        width: 20,
        depth: 3,
        swellFactor: 1.6,
        shrinkFactor: 1.3, // Rock expands when broken
      });

      expect(result.bankVolume).toBe(3000);
      expect(result.looseVolume).toBe(4800);
      expect(result.compactedVolume).toBe(3900);
    });
  });

  describe('edge cases', () => {
    it('should handle zero dimensions', () => {
      const result = earthwork({
        length: 0,
        width: 5,
        depth: 2,
        swellFactor: 1.25,
        shrinkFactor: 0.9,
      });

      expect(result.bankVolume).toBe(0);
      expect(result.looseVolume).toBe(0);
      expect(result.compactedVolume).toBe(0);
    });

    it('should handle swell factor of 1.0 (no swell)', () => {
      const result = earthwork({
        length: 10,
        width: 10,
        depth: 1,
        swellFactor: 1.0,
        shrinkFactor: 0.9,
      });

      expect(result.bankVolume).toBe(100);
      expect(result.looseVolume).toBe(100); // Same as bank
    });

    it('should handle shrink factor of 1.0 (no shrink)', () => {
      const result = earthwork({
        length: 10,
        width: 10,
        depth: 1,
        swellFactor: 1.25,
        shrinkFactor: 1.0,
      });

      expect(result.compactedVolume).toBe(100); // Same as bank
    });
  });

  describe('real-world excavation scenarios', () => {
    it('should calculate foundation excavation', () => {
      // Foundation pit: 20m x 15m x 3m deep
      const result = earthwork({
        length: 20,
        width: 15,
        depth: 3,
        swellFactor: 1.25,
        shrinkFactor: 0.9,
      });

      expect(result.bankVolume).toBe(900);
      expect(result.looseVolume).toBe(1125); // Trucks needed
      expect(result.compactedVolume).toBe(810); // Backfill volume
    });

    it('should calculate trench excavation', () => {
      // Pipe trench: 100m long, 1m wide, 1.5m deep
      const result = earthwork({
        length: 100,
        width: 1,
        depth: 1.5,
        swellFactor: 1.3,
        shrinkFactor: 0.85,
      });

      expect(result.bankVolume).toBe(150);
      expect(result.looseVolume).toBe(195);
      expect(result.compactedVolume).toBe(127.5);
    });
  });
});
