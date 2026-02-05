import { describe, it, expect } from 'vitest';
import { concreteMix } from './concreteMix.js';

describe('concreteMix', () => {
  describe('grade 15 (M15)', () => {
    it('should calculate cement quantity correctly', () => {
      const result = concreteMix({
        grade: '15',
        volume: 1, // 1 m³
      });

      // 280 kg cement per m³
      expect(result.cement).toBe(280);
    });

    it('should calculate sand quantity with 1:2 ratio', () => {
      const result = concreteMix({
        grade: '15',
        volume: 1,
      });

      // Sand = cement × 2 = 280 × 2 = 560 kg
      expect(result.sand).toBe(560);
    });

    it('should calculate gravel quantity with 1:4 ratio', () => {
      const result = concreteMix({
        grade: '15',
        volume: 1,
      });

      // Gravel = cement × 4 = 280 × 4 = 1120 kg
      expect(result.gravel).toBe(1120);
    });

    it('should calculate water with 0.60 w/c ratio', () => {
      const result = concreteMix({
        grade: '15',
        volume: 1,
      });

      // Water = cement × 0.60 = 280 × 0.60 = 168 L
      expect(result.water).toBe(168);
    });

    it('should return ratio string', () => {
      const result = concreteMix({
        grade: '15',
        volume: 1,
      });

      expect(result.ratio).toBe('1 : 2 : 4');
    });
  });

  describe('grade 20 (M20)', () => {
    it('should calculate correct quantities', () => {
      const result = concreteMix({
        grade: '20',
        volume: 1,
      });

      expect(result.cement).toBe(330);
      // Sand = 330 × 1.5 = 495
      expect(result.sand).toBe(495);
      // Gravel = 330 × 3 = 990
      expect(result.gravel).toBe(990);
      // Water = 330 × 0.55 = 181.5
      expect(result.water).toBe(181.5);
      expect(result.ratio).toBe('1 : 1.5 : 3');
    });
  });

  describe('grade 25 (M25)', () => {
    it('should calculate correct quantities', () => {
      const result = concreteMix({
        grade: '25',
        volume: 1,
      });

      expect(result.cement).toBe(370);
      // Sand = 370 × 1 = 370
      expect(result.sand).toBe(370);
      // Gravel = 370 × 2 = 740
      expect(result.gravel).toBe(740);
      // Water = 370 × 0.50 = 185
      expect(result.water).toBe(185);
      expect(result.ratio).toBe('1 : 1 : 2');
    });
  });

  describe('grade 30 (M30)', () => {
    it('should calculate correct quantities', () => {
      const result = concreteMix({
        grade: '30',
        volume: 1,
      });

      expect(result.cement).toBe(400);
      // Water = 400 × 0.45 = 180
      expect(result.water).toBe(180);
      expect(result.ratio).toBe('1 : 1 : 2');
    });
  });

  describe('grade 35 (M35)', () => {
    it('should calculate correct quantities', () => {
      const result = concreteMix({
        grade: '35',
        volume: 1,
      });

      expect(result.cement).toBe(430);
      // Gravel = 430 × 1.5 = 645
      expect(result.gravel).toBe(645);
      // Water = 430 × 0.42 = 180.6
      expect(result.water).toBe(180.6);
      expect(result.ratio).toBe('1 : 1 : 1.5');
    });
  });

  describe('grade 40 (M40)', () => {
    it('should calculate correct quantities', () => {
      const result = concreteMix({
        grade: '40',
        volume: 1,
      });

      expect(result.cement).toBe(460);
      // Water = 460 × 0.40 = 184
      expect(result.water).toBe(184);
      expect(result.ratio).toBe('1 : 1 : 1.5');
    });
  });

  describe('volume scaling', () => {
    it('should scale quantities for 2 m³', () => {
      const result = concreteMix({
        grade: '20',
        volume: 2,
      });

      // Cement = 330 × 2 = 660
      expect(result.cement).toBe(660);
      // Sand = 660 × 1.5 = 990
      expect(result.sand).toBe(990);
      // Gravel = 660 × 3 = 1980
      expect(result.gravel).toBe(1980);
    });

    it('should scale quantities for 0.5 m³', () => {
      const result = concreteMix({
        grade: '25',
        volume: 0.5,
      });

      // Cement = 370 × 0.5 = 185
      expect(result.cement).toBe(185);
    });

    it('should scale quantities for 10 m³', () => {
      const result = concreteMix({
        grade: '30',
        volume: 10,
      });

      // Cement = 400 × 10 = 4000
      expect(result.cement).toBe(4000);
      // Water = 4000 × 0.45 = 1800
      expect(result.water).toBe(1800);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for column footing (0.8 m³)', () => {
      const result = concreteMix({
        grade: '25',
        volume: 0.8,
      });

      expect(result.cement).toBeCloseTo(296, 0);
    });

    it('should calculate for slab (5 m³)', () => {
      const result = concreteMix({
        grade: '30',
        volume: 5,
      });

      expect(result.cement).toBe(2000);
      expect(result.water).toBe(900);
    });

    it('should calculate for small repair (0.1 m³)', () => {
      const result = concreteMix({
        grade: '20',
        volume: 0.1,
      });

      expect(result.cement).toBe(33);
    });
  });

  describe('w/c ratio progression', () => {
    it('should have decreasing w/c ratio with higher grades', () => {
      const m15 = concreteMix({ grade: '15', volume: 1 });
      const m25 = concreteMix({ grade: '25', volume: 1 });
      const m40 = concreteMix({ grade: '40', volume: 1 });

      // w/c ratio = water / cement
      const wcM15 = m15.water / m15.cement;
      const wcM25 = m25.water / m25.cement;
      const wcM40 = m40.water / m40.cement;

      expect(wcM15).toBeGreaterThan(wcM25);
      expect(wcM25).toBeGreaterThan(wcM40);
    });
  });

  describe('cement content progression', () => {
    it('should have increasing cement content with higher grades', () => {
      const m15 = concreteMix({ grade: '15', volume: 1 });
      const m25 = concreteMix({ grade: '25', volume: 1 });
      const m40 = concreteMix({ grade: '40', volume: 1 });

      expect(m15.cement).toBeLessThan(m25.cement);
      expect(m25.cement).toBeLessThan(m40.cement);
    });
  });
});
