import { describe, it, expect } from 'vitest';
import { waterActivity } from './waterActivity.js';

describe('waterActivity', () => {
  describe('stable products (aw < 0.60)', () => {
    it('should classify as safe and stable', () => {
      const result = waterActivity({ aw: 0.40 });
      expect(result.isStable).toBe(true);
      expect(result.riskLevel).toBe('safe');
      expect(result.growthRisk.bacteria).toBe(false);
      expect(result.growthRisk.yeast).toBe(false);
      expect(result.growthRisk.mold).toBe(false);
      expect(result.growthRisk.xerophilic).toBe(false);
    });
  });

  describe('low risk (0.60-0.80)', () => {
    it('should allow only xerophilic growth', () => {
      const result = waterActivity({ aw: 0.70 });
      expect(result.riskLevel).toBe('low');
      expect(result.growthRisk.xerophilic).toBe(true);
      expect(result.growthRisk.mold).toBe(false);
      expect(result.growthRisk.bacteria).toBe(false);
    });
  });

  describe('moderate risk (0.80-0.91)', () => {
    it('should allow mold and yeast growth', () => {
      const result = waterActivity({ aw: 0.90 });
      expect(result.riskLevel).toBe('moderate');
      expect(result.growthRisk.mold).toBe(true);
      expect(result.growthRisk.yeast).toBe(true);
      expect(result.growthRisk.bacteria).toBe(false);
    });
  });

  describe('high risk (aw > 0.91)', () => {
    it('should allow all microbial growth', () => {
      const result = waterActivity({ aw: 0.95 });
      expect(result.riskLevel).toBe('high');
      expect(result.growthRisk.bacteria).toBe(true);
      expect(result.growthRisk.yeast).toBe(true);
      expect(result.growthRisk.mold).toBe(true);
      expect(result.growthRisk.xerophilic).toBe(true);
    });
  });

  describe('warnings', () => {
    it('should warn about bacteria growth', () => {
      const result = waterActivity({ aw: 0.95 });
      expect(result.warnings.some(w => w.includes('bacteria'))).toBe(true);
    });

    it('should warn about temperature', () => {
      const result = waterActivity({ aw: 0.90, temperature: 40 });
      expect(result.warnings.some(w => w.includes('temperature'))).toBe(true);
    });

    it('should have no warnings for safe product', () => {
      const result = waterActivity({ aw: 0.30 });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('boundary values', () => {
    it('should handle aw = 0', () => {
      const result = waterActivity({ aw: 0 });
      expect(result.isStable).toBe(true);
      expect(result.riskLevel).toBe('safe');
    });

    it('should handle aw = 1', () => {
      const result = waterActivity({ aw: 1.0 });
      expect(result.riskLevel).toBe('high');
    });
  });
});
