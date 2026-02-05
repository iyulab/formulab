import { describe, it, expect } from 'vitest';
import { respiratorCalculate } from './respiratorCalculate.js';

describe('respiratorCalculate', () => {
  describe('MUC calculation', () => {
    it('should calculate MUC for half-mask (APF=10)', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'half-mask',
      });

      // MUC = APF × OEL = 10 × 10 = 100
      expect(result.muc).toBe(100);
      expect(result.apf).toBe(10);
    });

    it('should calculate MUC for full-facepiece (APF=50)', () => {
      const result = respiratorCalculate({
        concentration: 200,
        oel: 5,
        respiratorType: 'full-facepiece',
      });

      // MUC = 50 × 5 = 250
      expect(result.muc).toBe(250);
      expect(result.apf).toBe(50);
    });

    it('should calculate MUC for SCBA (APF=10000)', () => {
      const result = respiratorCalculate({
        concentration: 50000,
        oel: 10,
        respiratorType: 'scba-pd',
      });

      // MUC = 10000 × 10 = 100000
      expect(result.muc).toBe(100000);
      expect(result.apf).toBe(10000);
    });
  });

  describe('hazard ratio calculation', () => {
    it('should calculate hazard ratio correctly', () => {
      const result = respiratorCalculate({
        concentration: 100,
        oel: 10,
        respiratorType: 'half-mask',
      });

      // HR = 100 / 10 = 10
      expect(result.hazardRatio).toBe(10);
    });

    it('should return Infinity for zero OEL', () => {
      const result = respiratorCalculate({
        concentration: 100,
        oel: 0,
        respiratorType: 'half-mask',
      });

      expect(result.hazardRatio).toBe(Infinity);
    });
  });

  describe('protection adequacy', () => {
    it('should be adequate when concentration <= MUC', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'half-mask',
      });

      // MUC = 100, concentration = 50
      expect(result.protectionAdequate).toBe(true);
    });

    it('should not be adequate when concentration > MUC', () => {
      const result = respiratorCalculate({
        concentration: 150,
        oel: 10,
        respiratorType: 'half-mask',
      });

      // MUC = 100, concentration = 150
      expect(result.protectionAdequate).toBe(false);
    });

    it('should be adequate at exact MUC', () => {
      const result = respiratorCalculate({
        concentration: 100,
        oel: 10,
        respiratorType: 'half-mask',
      });

      expect(result.protectionAdequate).toBe(true);
    });
  });

  describe('safety margin calculation', () => {
    it('should calculate safety margin correctly', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'half-mask',
      });

      // Required APF = HR = 5, Actual APF = 10
      // Safety margin = 10 / 5 = 2
      expect(result.safetyMargin).toBe(2);
    });

    it('should return Infinity for zero required APF', () => {
      const result = respiratorCalculate({
        concentration: 0,
        oel: 10,
        respiratorType: 'half-mask',
      });

      expect(result.safetyMargin).toBe(Infinity);
    });
  });

  describe('all respirator types', () => {
    it('should have correct APF for filtering-facepiece', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'filtering-facepiece',
      });
      expect(result.apf).toBe(10);
    });

    it('should have correct APF for powered-half-mask', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'powered-half-mask',
      });
      expect(result.apf).toBe(50);
    });

    it('should have correct APF for powered-hood', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'powered-hood',
      });
      expect(result.apf).toBe(25);
    });

    it('should have correct APF for powered-full-facepiece', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'powered-full-facepiece',
      });
      expect(result.apf).toBe(1000);
    });

    it('should have correct APF for supplied-air-half', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'supplied-air-half',
      });
      expect(result.apf).toBe(10);
    });

    it('should have correct APF for supplied-air-full', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'supplied-air-full',
      });
      expect(result.apf).toBe(50);
    });

    it('should have correct APF for supplied-air-full-pd', () => {
      const result = respiratorCalculate({
        concentration: 50,
        oel: 10,
        respiratorType: 'supplied-air-full-pd',
      });
      expect(result.apf).toBe(1000);
    });
  });

  describe('real-world scenarios', () => {
    it('should evaluate silica dust exposure', () => {
      // Silica OEL = 0.025 mg/m³, exposure = 0.5 mg/m³
      const result = respiratorCalculate({
        concentration: 0.5,
        oel: 0.025,
        respiratorType: 'half-mask',
      });

      // HR = 0.5 / 0.025 = 20, APF = 10
      expect(result.hazardRatio).toBe(20);
      expect(result.protectionAdequate).toBe(false);
    });

    it('should evaluate lead fume welding', () => {
      // Lead OEL = 0.05 mg/m³, exposure = 1 mg/m³
      const result = respiratorCalculate({
        concentration: 1,
        oel: 0.05,
        respiratorType: 'powered-full-facepiece',
      });

      // HR = 20, APF = 1000
      expect(result.protectionAdequate).toBe(true);
      expect(result.safetyMargin).toBe(50);
    });
  });
});
