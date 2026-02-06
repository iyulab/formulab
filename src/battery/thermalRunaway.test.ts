import { describe, it, expect } from 'vitest';
import { thermalRunaway } from './thermalRunaway.js';

describe('thermalRunaway', () => {
  it('should calculate safe operation scenario', () => {
    // Q = 10² × 0.02 = 2W, hA = 5 × 0.01 = 0.05
    // ΔT = 2/0.05 = 40°C, Tss = 25 + 40 = 65°C
    // margin = 150 - 65 = 85°C → safe
    const result = thermalRunaway({
      ambientTempC: 25,
      currentA: 10,
      internalResistanceOhm: 0.02,
      heatTransferCoeff: 5,
      surfaceAreaM2: 0.01,
      runawayTempC: 150,
    });
    expect(result.heatGenerationW).toBeCloseTo(2, 2);
    expect(result.temperatureRiseC).toBeCloseTo(40, 1);
    expect(result.steadyStateTempC).toBeCloseTo(65, 1);
    expect(result.safetyMarginC).toBeCloseTo(85, 1);
    expect(result.isSafe).toBe(true);
  });

  it('should detect unsafe condition', () => {
    // Q = 50² × 0.05 = 125W, hA = 5 × 0.005 = 0.025
    // ΔT = 125/0.025 = 5000°C, Tss = 25 + 5000 = 5025°C
    // margin = 150 - 5025 = -4875°C → unsafe!
    const result = thermalRunaway({
      ambientTempC: 25,
      currentA: 50,
      internalResistanceOhm: 0.05,
      heatTransferCoeff: 5,
      surfaceAreaM2: 0.005,
      runawayTempC: 150,
    });
    expect(result.isSafe).toBe(false);
    expect(result.safetyMarginC).toBeLessThan(0);
  });

  it('should handle good cooling (high h, large A)', () => {
    // Q = 20² × 0.01 = 4W, hA = 25 × 0.04 = 1.0
    // ΔT = 4/1.0 = 4°C, Tss = 30 + 4 = 34°C, margin = 200 - 34 = 166°C
    const result = thermalRunaway({
      ambientTempC: 30,
      currentA: 20,
      internalResistanceOhm: 0.01,
      heatTransferCoeff: 25,
      surfaceAreaM2: 0.04,
      runawayTempC: 200,
    });
    expect(result.steadyStateTempC).toBeCloseTo(34, 1);
    expect(result.safetyMarginC).toBeCloseTo(166, 1);
    expect(result.isSafe).toBe(true);
  });

  it('should verify heat balance at steady state', () => {
    const result = thermalRunaway({
      ambientTempC: 25,
      currentA: 15,
      internalResistanceOhm: 0.03,
      heatTransferCoeff: 10,
      surfaceAreaM2: 0.02,
      runawayTempC: 180,
    });
    // At steady state, heat generation = heat dissipation
    expect(result.heatGenerationW).toBeCloseTo(result.heatDissipationW, 1);
  });
});
