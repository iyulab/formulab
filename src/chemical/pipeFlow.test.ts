import { describe, it, expect } from 'vitest';
import { pipeFlow } from './pipeFlow.js';

describe('pipeFlow', () => {
  describe('laminar flow', () => {
    it('should detect laminar flow and use f=64/Re', () => {
      // Very low flow rate → laminar
      const result = pipeFlow({
        flowRate: 0.1,         // 0.1 L/min
        pipeDiameter: 50,      // 50mm
        pipeLength: 10,
        pipeMaterial: 'copper',
        fluidDensity: 998.2,
        fluidViscosity: 0.001002,
      });
      expect(result.flowRegime).toBe('laminar');
      expect(result.reynoldsNumber).toBeLessThan(2300);
      // f=64/Re but both are rounded, so check approximate relation
      expect(result.frictionFactor).toBeCloseTo(64 / result.reynoldsNumber, 1);
    });
  });

  describe('turbulent flow', () => {
    it('should detect turbulent flow for typical water pipe', () => {
      // 50 L/min through 25mm pipe → turbulent
      const result = pipeFlow({
        flowRate: 50,
        pipeDiameter: 25,
        pipeLength: 10,
        pipeMaterial: 'commercialSteel',
        fluidDensity: 998.2,
        fluidViscosity: 0.001002,
      });
      expect(result.flowRegime).toBe('turbulent');
      expect(result.reynoldsNumber).toBeGreaterThan(4000);
      // Velocity should be reasonable
      expect(result.velocity).toBeGreaterThan(0);
      expect(result.pressureDrop).toBeGreaterThan(0);
      expect(result.headLoss).toBeGreaterThan(0);
    });

    it('should show higher pressure drop for rougher pipe', () => {
      const smooth = pipeFlow({
        flowRate: 30, pipeDiameter: 25, pipeLength: 100,
        pipeMaterial: 'copper', fluidDensity: 998.2, fluidViscosity: 0.001002,
      });
      const rough = pipeFlow({
        flowRate: 30, pipeDiameter: 25, pipeLength: 100,
        pipeMaterial: 'galvanizedSteel', fluidDensity: 998.2, fluidViscosity: 0.001002,
      });
      expect(rough.pressureDrop).toBeGreaterThan(smooth.pressureDrop);
    });
  });

  describe('pressure drop relationships', () => {
    it('should increase with pipe length', () => {
      const short = pipeFlow({
        flowRate: 20, pipeDiameter: 25, pipeLength: 10,
        pipeMaterial: 'pvc', fluidDensity: 998.2, fluidViscosity: 0.001002,
      });
      const long = pipeFlow({
        flowRate: 20, pipeDiameter: 25, pipeLength: 100,
        pipeMaterial: 'pvc', fluidDensity: 998.2, fluidViscosity: 0.001002,
      });
      // Pressure drop should scale linearly with length
      expect(long.pressureDrop / short.pressureDrop).toBeCloseTo(10, 0);
    });

    it('should have consistent unit conversions', () => {
      const result = pipeFlow({
        flowRate: 30, pipeDiameter: 25, pipeLength: 50,
        pipeMaterial: 'commercialSteel', fluidDensity: 998.2, fluidViscosity: 0.001002,
      });
      expect(result.pressureDropKpa).toBeCloseTo(result.pressureDrop / 1000, 2);
      expect(result.pressureDropBar).toBeCloseTo(result.pressureDrop / 100000, 4);
    });
  });

  describe('custom roughness', () => {
    it('should accept custom roughness value', () => {
      const result = pipeFlow({
        flowRate: 30, pipeDiameter: 25, pipeLength: 50,
        pipeMaterial: 'custom', fluidDensity: 998.2, fluidViscosity: 0.001002,
        customRoughness: 0.045,
      });
      expect(result.velocity).toBeGreaterThan(0);
    });
  });

  describe('validation', () => {
    it('should throw on zero flow rate', () => {
      expect(() => pipeFlow({
        flowRate: 0, pipeDiameter: 25, pipeLength: 10,
        pipeMaterial: 'pvc', fluidDensity: 998.2, fluidViscosity: 0.001002,
      })).toThrow();
    });

    it('should throw on zero diameter', () => {
      expect(() => pipeFlow({
        flowRate: 10, pipeDiameter: 0, pipeLength: 10,
        pipeMaterial: 'pvc', fluidDensity: 998.2, fluidViscosity: 0.001002,
      })).toThrow();
    });

    it('should throw when custom material has no roughness', () => {
      expect(() => pipeFlow({
        flowRate: 10, pipeDiameter: 25, pipeLength: 10,
        pipeMaterial: 'custom', fluidDensity: 998.2, fluidViscosity: 0.001002,
      })).toThrow();
    });
  });
});
