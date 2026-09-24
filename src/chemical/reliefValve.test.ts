import { describe, it, expect } from 'vitest';
import { reliefValve } from './reliefValve.js';

describe('reliefValve', () => {
  describe('gas sizing', () => {
    it('should calculate required area for gas relief', () => {
      const result = reliefValve({
        requiredCapacity: 5000, // kg/h
        setPressure: 1000,      // kPa gauge
        backPressure: 101,      // kPa gauge
        temperature: 100,       // °C
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.requiredArea).toBeGreaterThan(0);
      expect(result.selectedOrifice).toBeTruthy();
      expect(result.orificeArea).toBeGreaterThanOrEqual(result.requiredArea);
      expect(result.percentUtilized).toBeLessThanOrEqual(100);
    });

    it('should select correct orifice letter', () => {
      const result = reliefValve({
        requiredCapacity: 100,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(['D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'T'])
        .toContain(result.selectedOrifice);
    });
  });

  describe('liquid sizing', () => {
    it('should calculate required area for liquid relief', () => {
      const result = reliefValve({
        requiredCapacity: 10000,
        setPressure: 700,
        backPressure: 101,
        temperature: 20,
        fluidType: 'liquid',
        specificGravity: 1.0,
      });

      expect(result.requiredArea).toBeGreaterThan(0);
      expect(result.orificeArea).toBeGreaterThanOrEqual(result.requiredArea);
    });
  });

  describe('orifice selection', () => {
    it('should select larger orifice for higher capacity', () => {
      const small = reliefValve({
        requiredCapacity: 100,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        molecularWeight: 29,
      });
      const large = reliefValve({
        requiredCapacity: 50000,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(large.orificeArea).toBeGreaterThanOrEqual(small.orificeArea);
    });
  });

  describe('relieving pressure', () => {
    it('should calculate relieving pressure with overpressure', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 1000,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        overpressure: 10,
      });

      // Relieving = set + atm + 10% overpressure
      // = 1000 + 101.325 + 100 = 1201.325
      expect(result.relievingPressure).toBeCloseTo(1201.33, 0);
    });
  });

  describe('capacity at orifice', () => {
    it('should be >= required capacity', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
      });

      expect(result.capacityAtOrifice).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('orifice exceeds max (ISSUE-20260713 silent clamp)', () => {
    // Regression pins from the issue's execution evidence: realistic large reliefs
    // exceed the largest API 526 orifice ('T', 16,774 mm²) and must be flagged.
    it('flags gas relief beyond T (200,000 kg/h @ 1,000 kPa(g), 100°C, M=29)', () => {
      const result = reliefValve({
        requiredCapacity: 200000,
        setPressure: 1000,
        backPressure: 0,
        temperature: 100,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.requiredArea).toBeCloseTo(22657.4, 0);
      expect(result.selectedOrifice).toBe('T');
      expect(result.orificeArea).toBe(16774);
      expect(result.orificeExceedsMax).toBe(true);
      expect(result.percentUtilized).toBeCloseTo(135.07, 1);
      expect(result.capacityAtOrifice).toBeCloseTo(148066.38, 0);
      expect(result.suggestedMinValves).toBe(2); // ceil(22657.4 / 16774) = ceil(1.351)
    });

    it('flags steam relief beyond T (150,000 kg/h @ 1,500 kPa(g))', () => {
      const result = reliefValve({
        requiredCapacity: 150000,
        setPressure: 1500,
        backPressure: 0,
        temperature: 200,
        fluidType: 'steam',
        molecularWeight: 18,
      });

      expect(result.requiredArea).toBeCloseTo(17096.58, 0);
      expect(result.selectedOrifice).toBe('T');
      expect(result.orificeExceedsMax).toBe(true);
      expect(result.percentUtilized).toBeGreaterThan(100);
      expect(result.suggestedMinValves).toBe(2); // ceil(17096.58 / 16774) = ceil(1.019)
    });

    it('does not flag when T still covers the required area (boundary)', () => {
      const result = reliefValve({
        requiredCapacity: 148000, // 16,766 mm² < 16,774
        setPressure: 1000,
        backPressure: 0,
        temperature: 100,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.selectedOrifice).toBe('T');
      expect(result.requiredArea).toBeLessThanOrEqual(16774);
      expect(result.orificeExceedsMax).toBe(false);
      expect(result.percentUtilized).toBeLessThanOrEqual(100);
      expect(result.suggestedMinValves).toBe(1);
    });

    it('does not flag ordinary in-range selections', () => {
      const result = reliefValve({
        requiredCapacity: 5000,
        setPressure: 1000,
        backPressure: 101,
        temperature: 100,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.orificeExceedsMax).toBe(false);
    });

    it('does not flag the liquid zero-differential edge (requiredArea = 0)', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 100,
        backPressure: 500, // back pressure above relieving pressure → dp <= 0
        temperature: 20,
        fluidType: 'liquid',
      });

      expect(result.requiredArea).toBe(0);
      expect(result.orificeExceedsMax).toBe(false);
      expect(result.suggestedMinValves).toBe(1); // degenerate zero-area case still suggests one valve
    });
  });

  describe('API 520 Part I worked examples (golden, SI equations)', () => {
    // Reproduced by the `fluids` library (API520_A_g / API520_A_l doctests).
    it('Example 1 — gas, critical flow: 24,270 kg/h, 348 K, Z 0.90, M 51, k 1.11, P1 670 kPa a → 3,699 mm²', () => {
      const result = reliefValve({
        requiredCapacity: 24270,
        setPressure: (670 - 101.325) / 1.1, // so that P1 = 1.1 × set + atm = 670 kPa a
        backPressure: 0,
        temperature: 348 - 273.15,
        fluidType: 'gas',
        molecularWeight: 51,
        specificHeatRatio: 1.11,
        compressibility: 0.9,
      });
      expect(result.relievingPressure).toBeCloseTo(670, 6);
      expect(result.requiredArea).toBeCloseTo(3699.0, 0);
    });

    it('Example 5 (first step) — liquid: 6,814 L/min, G 0.9, ΔP 1,551.6 kPa → 3,066 mm² at Kw 0.97', () => {
      const result = reliefValve({
        requiredCapacity: 0.9 * 999 * (6814 / 60000) * 3600, // kg/h
        setPressure: 1724,
        backPressure: 0.2 * 1724,
        temperature: 38,
        fluidType: 'liquid',
        specificGravity: 0.9,
      });
      // this function takes Kw = 1.0; the example's 3,066 mm² uses Kw = 0.97
      expect(result.requiredArea * 1.0).toBeCloseTo(3066 * 0.97, -1);
    });

    it('a literal gas case (fixture for check:nonfinite-outputs)', () => {
      const result = reliefValve({ requiredCapacity: 5000, setPressure: 1000, backPressure: 100, temperature: 50, fluidType: 'gas', molecularWeight: 28 });
      expect(result.requiredArea).toBeCloseTo(536.45, 1);
      expect(result.selectedOrifice).toBe('J');
    });
  });

  describe('gas critical-flow coefficient C (golden, API 520 Part I)', () => {
    // A ratio test only: it is blind to any constant factor, which is how a US-units C (520…)
    // applied to SI inputs overstated every gas area 7.6× until 0.49.0. The absolute goldens are
    // the API 520 worked examples above. The ratio below is the same in either unit system:
    // C(k) = 520 x sqrt(k x (2/(k+1))^((k+1)/(k-1))) is the API 520 critical-flow coefficient (US).
    // Computed independently of this file: C(1.4) = 356.0604, C(1.3) = 346.9764 — 356 for k=1.4
    // is the value commonly published for diatomic gases (air, nitrogen) in API 520 Part I
    // Table 8 and secondary process-safety references. Since area is inversely proportional to
    // C and every other input below is held identical between the two calls, the steam/gas area
    // ratio must equal C(1.4)/C(1.3) regardless of the formula's internal unit conversions —
    // this isolates the k-dependent coefficient from the rest of the sizing arithmetic.
    it('steam (k=1.3) vs gas (k=1.4) area ratio matches C(1.4)/C(1.3) = 1.02618', () => {
      const common = {
        requiredCapacity: 10000,
        setPressure: 500,
        backPressure: 0,
        temperature: 25,
        molecularWeight: 29,
      } as const;

      const gas = reliefValve({ ...common, fluidType: 'gas' });
      const steam = reliefValve({ ...common, fluidType: 'steam' });

      expect(steam.requiredArea / gas.requiredArea).toBeCloseTo(1.02618, 4);
    });
  });

  describe('percent utilized', () => {
    it('should be <= 100%', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
      });

      expect(result.percentUtilized).toBeLessThanOrEqual(100);
      expect(result.percentUtilized).toBeGreaterThan(0);
    });
  });
});

// ERRORS.md guarantees no NaN/Infinity in output fields; these inputs used to
// produce them instead of throwing.
describe('reliefValve input domain', () => {
  it('rejects a zero molecular weight that would make an output non-finite', () => {
    expect(() => reliefValve({ requiredCapacity: 5000, setPressure: 1000, backPressure: 0, temperature: 100, fluidType: 'gas', molecularWeight: 0 } as never)).toThrow(RangeError);
  });

  it('rejects a negative molecular weight that would make an output non-finite', () => {
    expect(() => reliefValve({ requiredCapacity: 5000, setPressure: 1000, backPressure: 0, temperature: 100, fluidType: 'gas', molecularWeight: -1 } as never)).toThrow(RangeError);
  });

});
