import { describe, it, expect } from 'vitest';
import { reflowProfile, getPasteTypes } from './reflow.js';

describe('reflowProfile', () => {
  describe('SAC305 (lead-free)', () => {
    it('should return correct melting point', () => {
      const result = reflowProfile('sac305');

      expect(result).not.toBeUndefined();
      expect(result!.meltingPoint).toBe(217);
    });

    it('should return correct preheat parameters', () => {
      const result = reflowProfile('sac305');

      expect(result!.profile.preheatRateCPerS).toEqual({ min: 1, max: 3 });
      expect(result!.profile.preheatTempC).toEqual({ min: 150, max: 200 });
      expect(result!.profile.preheatTimeS).toEqual({ min: 60, max: 120 });
    });

    it('should return correct peak temperature range', () => {
      const result = reflowProfile('sac305');

      expect(result!.profile.peakTempC).toEqual({ min: 235, max: 250 });
    });

    it('should return correct time above liquidus', () => {
      const result = reflowProfile('sac305');

      expect(result!.profile.timeAboveLiquidusS).toEqual({ min: 60, max: 90 });
    });

    it('should return correct cooling rate', () => {
      const result = reflowProfile('sac305');

      expect(result!.profile.coolingRateMaxCPerS).toBe(4);
    });

    it('should return correct total profile time', () => {
      const result = reflowProfile('sac305');

      expect(result!.profile.totalProfileTimeS).toEqual({ min: 240, max: 300 });
    });

    it('should return paste type label', () => {
      const result = reflowProfile('sac305');

      expect(result!.pasteType).toBe('SAC305');
    });
  });

  describe('Sn63Pb37 (leaded)', () => {
    it('should return correct melting point', () => {
      const result = reflowProfile('sn63pb37');

      expect(result).not.toBeUndefined();
      expect(result!.meltingPoint).toBe(183);
    });

    it('should return lower peak temperature than lead-free', () => {
      const result = reflowProfile('sn63pb37');

      expect(result!.profile.peakTempC).toEqual({ min: 210, max: 230 });
    });

    it('should return shorter total profile time', () => {
      const result = reflowProfile('sn63pb37');

      expect(result!.profile.totalProfileTimeS).toEqual({ min: 180, max: 240 });
    });

    it('should return correct soak parameters', () => {
      const result = reflowProfile('sn63pb37');

      expect(result!.profile.soakTempC).toEqual({ min: 150, max: 183 });
      expect(result!.profile.soakTimeS).toEqual({ min: 60, max: 90 });
    });
  });

  describe('SAC387', () => {
    it('should return correct melting point', () => {
      const result = reflowProfile('sac387');

      expect(result).not.toBeUndefined();
      expect(result!.meltingPoint).toBe(217);
    });

    it('should return higher peak temperature than SAC305', () => {
      const result = reflowProfile('sac387');

      expect(result!.profile.peakTempC).toEqual({ min: 240, max: 260 });
    });
  });

  describe('SnBi58 (low temperature)', () => {
    it('should return lowest melting point', () => {
      const result = reflowProfile('snbi58');

      expect(result).not.toBeUndefined();
      expect(result!.meltingPoint).toBe(138);
    });

    it('should return lower preheat temperature', () => {
      const result = reflowProfile('snbi58');

      expect(result!.profile.preheatTempC).toEqual({ min: 80, max: 120 });
    });

    it('should return lower peak temperature', () => {
      const result = reflowProfile('snbi58');

      expect(result!.profile.peakTempC).toEqual({ min: 160, max: 180 });
    });

    it('should return slower preheat rate', () => {
      const result = reflowProfile('snbi58');

      expect(result!.profile.preheatRateCPerS).toEqual({ min: 0.5, max: 2 });
    });

    it('should return lower cooling rate limit', () => {
      const result = reflowProfile('snbi58');

      expect(result!.profile.coolingRateMaxCPerS).toBe(3);
    });
  });

  describe('invalid paste type', () => {
    it('throws for a paste type it has no profile for', () => {
      expect(() => reflowProfile('invalid' as never)).toThrow(/pasteType must be one of/);
    });
  });

  describe('getPasteTypes', () => {
    it('should return all available paste types', () => {
      const types = getPasteTypes();

      expect(types).toContain('sac305');
      expect(types).toContain('sn63pb37');
      expect(types).toContain('sac387');
      expect(types).toContain('snbi58');
    });

    it('should return exactly 4 paste types', () => {
      const types = getPasteTypes();

      expect(types.length).toBe(4);
    });

    it('should return a new array each time', () => {
      const types1 = getPasteTypes();
      const types2 = getPasteTypes();

      expect(types1).not.toBe(types2);
      expect(types1).toEqual(types2);
    });
  });

  describe('profile immutability', () => {
    it('should return a copy, not the original', () => {
      const result1 = reflowProfile('sac305');
      const result2 = reflowProfile('sac305');

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });
});

describe('reflowProfile refusal codes', () => {
  it('names an unknown paste type', () => {
    expect(() => reflowProfile('invalid' as never))
      .toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'pasteType', got: 'invalid' }));
  });
});
