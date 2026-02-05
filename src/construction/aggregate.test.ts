import { describe, it, expect } from 'vitest';
import { aggregate, getAggregateDensity, aggregateCoverage, AGGREGATE_DENSITIES } from './aggregate.js';

describe('aggregate', () => {
  describe('volume calculation', () => {
    it('should calculate volume correctly', () => {
      const result = aggregate({
        length: 10, // 10m
        width: 5, // 5m
        depth: 10, // 10cm
        depthUnit: 'centimeters',
        aggregateType: 'gravel',
      });

      // Volume = 10 × 5 × 0.1 = 5 m³
      expect(result.volume).toBe(5);
    });

    it('should handle depth in meters', () => {
      const result = aggregate({
        length: 10,
        width: 5,
        depth: 0.1,
        depthUnit: 'meters',
        aggregateType: 'gravel',
      });

      expect(result.volume).toBe(5);
    });
  });

  describe('weight calculation', () => {
    it('should calculate weight for gravel', () => {
      const result = aggregate({
        length: 10,
        width: 5,
        depth: 10,
        depthUnit: 'centimeters',
        aggregateType: 'gravel',
      });

      // Weight = 5 m³ × 1850 kg/m³ = 9250 kg
      expect(result.weight).toBe(9250);
      expect(result.weightTonnes).toBe(9.25);
    });

    it('should calculate weight for sand', () => {
      const result = aggregate({
        length: 5,
        width: 3,
        depth: 15,
        depthUnit: 'centimeters',
        aggregateType: 'sand',
      });

      // Volume = 5 × 3 × 0.15 = 2.25 m³
      // Weight = 2.25 × 1600 = 3600 kg
      expect(result.volume).toBe(2.25);
      expect(result.weight).toBe(3600);
    });

    it('should calculate weight for crushed stone', () => {
      const result = aggregate({
        length: 8,
        width: 4,
        depth: 20,
        depthUnit: 'centimeters',
        aggregateType: 'crushed_stone',
      });

      // Volume = 8 × 4 × 0.2 = 6.4 m³
      // Weight = 6.4 × 1600 = 10240 kg
      expect(result.volume).toBe(6.4);
      expect(result.weight).toBe(10240);
    });

    it('should calculate weight for topsoil', () => {
      const result = aggregate({
        length: 20,
        width: 10,
        depth: 30,
        depthUnit: 'centimeters',
        aggregateType: 'topsoil',
      });

      // Volume = 20 × 10 × 0.3 = 60 m³
      // Weight = 60 × 1100 = 66000 kg
      expect(result.volume).toBe(60);
      expect(result.weight).toBe(66000);
    });

    it('should calculate weight for mulch', () => {
      const result = aggregate({
        length: 15,
        width: 8,
        depth: 8,
        depthUnit: 'centimeters',
        aggregateType: 'mulch',
      });

      // Volume = 15 × 8 × 0.08 = 9.6 m³
      // Weight = 9.6 × 400 = 3840 kg
      expect(result.volume).toBe(9.6);
      expect(result.weight).toBe(3840);
    });
  });

  describe('custom density', () => {
    it('should use custom density when provided', () => {
      const result = aggregate({
        length: 5,
        width: 5,
        depth: 10,
        depthUnit: 'centimeters',
        aggregateType: 'custom',
        customDensity: 2000,
      });

      // Volume = 2.5 m³
      // Weight = 2.5 × 2000 = 5000 kg
      expect(result.volume).toBe(2.5);
      expect(result.weight).toBe(5000);
      expect(result.density).toBe(2000);
    });

    it('should throw error for custom without density', () => {
      expect(() =>
        aggregate({
          length: 5,
          width: 5,
          depth: 10,
          depthUnit: 'centimeters',
          aggregateType: 'custom',
        })
      ).toThrow('Custom density must be provided');
    });

    it('should throw error for zero custom density', () => {
      expect(() =>
        aggregate({
          length: 5,
          width: 5,
          depth: 10,
          depthUnit: 'centimeters',
          aggregateType: 'custom',
          customDensity: 0,
        })
      ).toThrow('Custom density must be provided and greater than zero');
    });
  });

  describe('coverage area', () => {
    it('should calculate coverage area as footprint', () => {
      const result = aggregate({
        length: 10,
        width: 5,
        depth: 10,
        depthUnit: 'centimeters',
        aggregateType: 'gravel',
      });

      expect(result.coverageArea).toBe(50);
    });
  });

  describe('bags calculation', () => {
    it('should calculate number of 20kg bags', () => {
      const result = aggregate({
        length: 2,
        width: 2,
        depth: 5,
        depthUnit: 'centimeters',
        aggregateType: 'sand',
      });

      // Volume = 0.2 m³
      // Weight = 0.2 × 1600 = 320 kg
      // Bags (20kg) = ceil(320/20) = 16
      expect(result.bags20kg).toBe(16);
    });

    it('should calculate number of 25kg bags', () => {
      const result = aggregate({
        length: 2,
        width: 2,
        depth: 5,
        depthUnit: 'centimeters',
        aggregateType: 'sand',
      });

      // Bags (25kg) = ceil(320/25) = 13
      expect(result.bags25kg).toBe(13);
    });
  });

  describe('error handling', () => {
    it('should throw error for zero length', () => {
      expect(() =>
        aggregate({
          length: 0,
          width: 5,
          depth: 10,
          depthUnit: 'centimeters',
          aggregateType: 'gravel',
        })
      ).toThrow('All dimensions must be greater than zero');
    });

    it('should throw error for negative width', () => {
      expect(() =>
        aggregate({
          length: 5,
          width: -1,
          depth: 10,
          depthUnit: 'centimeters',
          aggregateType: 'gravel',
        })
      ).toThrow('All dimensions must be greater than zero');
    });

    it('should throw error for zero depth', () => {
      expect(() =>
        aggregate({
          length: 5,
          width: 5,
          depth: 0,
          depthUnit: 'centimeters',
          aggregateType: 'gravel',
        })
      ).toThrow('All dimensions must be greater than zero');
    });
  });

  describe('getAggregateDensity', () => {
    it('should return correct density for gravel', () => {
      expect(getAggregateDensity('gravel')).toBe(1850);
    });

    it('should return correct density for sand', () => {
      expect(getAggregateDensity('sand')).toBe(1600);
    });

    it('should return 0 for custom type', () => {
      expect(getAggregateDensity('custom')).toBe(0);
    });
  });

  describe('aggregateCoverage', () => {
    it('should calculate area from volume and depth', () => {
      const area = aggregateCoverage(5, 10);
      // Area = 5 / 0.1 = 50 m²
      expect(area).toBe(50);
    });

    it('should throw error for zero volume', () => {
      expect(() => aggregateCoverage(0, 10)).toThrow('Volume and depth must be greater than zero');
    });

    it('should throw error for zero depth', () => {
      expect(() => aggregateCoverage(5, 0)).toThrow('Volume and depth must be greater than zero');
    });
  });

  describe('AGGREGATE_DENSITIES', () => {
    it('should contain all aggregate types', () => {
      expect(AGGREGATE_DENSITIES.length).toBe(6);
      expect(AGGREGATE_DENSITIES.map(a => a.type)).toContain('gravel');
      expect(AGGREGATE_DENSITIES.map(a => a.type)).toContain('sand');
      expect(AGGREGATE_DENSITIES.map(a => a.type)).toContain('custom');
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for driveway gravel base', () => {
      const result = aggregate({
        length: 20,
        width: 4,
        depth: 15,
        depthUnit: 'centimeters',
        aggregateType: 'gravel',
      });

      // Volume = 12 m³
      // Weight = 12 × 1850 = 22200 kg ≈ 22.2 tonnes
      expect(result.volume).toBe(12);
      expect(result.weightTonnes).toBe(22.2);
    });

    it('should calculate for garden bed topsoil', () => {
      const result = aggregate({
        length: 6,
        width: 1.5,
        depth: 20,
        depthUnit: 'centimeters',
        aggregateType: 'topsoil',
      });

      // Volume = 6 × 1.5 × 0.2 = 1.8 m³
      expect(result.volume).toBe(1.8);
    });

    it('should calculate for playground sand', () => {
      const result = aggregate({
        length: 8,
        width: 8,
        depth: 30,
        depthUnit: 'centimeters',
        aggregateType: 'sand',
      });

      // Volume = 64 × 0.3 = 19.2 m³
      // Weight = 19.2 × 1600 = 30720 kg
      expect(result.volume).toBe(19.2);
      expect(result.weight).toBe(30720);
    });
  });
});
