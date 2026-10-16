import { describe, it, expect } from 'vitest';
import { slope } from './slope.js';

describe('slope', () => {
  describe('from percent', () => {
    it('should convert 100% slope to 45 degrees', () => {
      const result = slope({ fromUnit: 'percent', value: 100 });

      expect(result.percent).toBe(100);
      expect(result.degrees).toBeCloseTo(45, 1);
      expect(result.ratio).toBe(1);
    });

    it('should convert 10% slope correctly', () => {
      const result = slope({ fromUnit: 'percent', value: 10 });

      expect(result.percent).toBe(10);
      expect(result.degrees).toBeCloseTo(5.71, 1);
      expect(result.ratio).toBe(10); // 1:10
      expect(result.risePerMeter).toBe(100); // 100mm per meter
    });

    it('should convert 50% slope correctly', () => {
      const result = slope({ fromUnit: 'percent', value: 50 });

      expect(result.percent).toBe(50);
      expect(result.degrees).toBeCloseTo(26.57, 1);
      expect(result.ratio).toBe(2); // 1:2
    });
  });

  describe('from degrees', () => {
    it('should convert 45 degrees to 100% slope', () => {
      const result = slope({ fromUnit: 'degrees', value: 45 });

      expect(result.percent).toBeCloseTo(100, 1);
      expect(result.degrees).toBeCloseTo(45, 1);
      expect(result.ratio).toBeCloseTo(1, 1);
    });

    it('should convert 30 degrees correctly', () => {
      const result = slope({ fromUnit: 'degrees', value: 30 });

      expect(result.percent).toBeCloseTo(57.74, 1);
      expect(result.degrees).toBeCloseTo(30, 1);
    });

    it('should convert 5 degrees correctly', () => {
      const result = slope({ fromUnit: 'degrees', value: 5 });

      expect(result.percent).toBeCloseTo(8.75, 1);
      expect(result.degrees).toBeCloseTo(5, 1);
    });
  });

  describe('from ratio', () => {
    it('should convert 1:10 ratio to 10% slope', () => {
      const result = slope({ fromUnit: 'ratio', value: 10 });

      expect(result.percent).toBe(10);
      expect(result.ratio).toBe(10);
    });

    it('should convert 1:1 ratio to 100% slope', () => {
      const result = slope({ fromUnit: 'ratio', value: 1 });

      expect(result.percent).toBe(100);
      expect(result.degrees).toBeCloseTo(45, 1);
    });

    it('should convert 1:4 ratio correctly', () => {
      const result = slope({ fromUnit: 'ratio', value: 4 });

      expect(result.percent).toBe(25);
      expect(result.ratio).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle zero slope', () => {
      const result = slope({ fromUnit: 'percent', value: 0 });

      expect(result.percent).toBe(0);
      expect(result.degrees).toBe(0);
      expect(result.ratio).toBeNull();
      expect(result.risePerMeter).toBe(0);
    });

    it('gives a downhill grade the same 1:N as the uphill one, the direction in the signed fields', () => {
      const down = slope({ fromUnit: 'percent', value: -5 });
      expect(down.ratio).toBe(20); // 1:20, not 0
      expect(down.degrees).toBeCloseTo(-2.862, 3);
      expect(down.risePerMeter).toBe(-50);

      const fromDegrees = slope({ fromUnit: 'degrees', value: -45 });
      expect(fromDegrees.ratio).toBeCloseTo(1, 10);
      expect(fromDegrees.percent).toBeCloseTo(-100, 10);
    });

    it('should throw for zero ratio (1:0 is vertical, not flat)', () => {
      expect(() => slope({ fromUnit: 'ratio', value: 0 })).toThrow();
    });

    it('should throw for negative ratio', () => {
      expect(() => slope({ fromUnit: 'ratio', value: -5 })).toThrow();
    });

    it('should handle very steep slope (200%)', () => {
      const result = slope({ fromUnit: 'percent', value: 200 });

      expect(result.percent).toBe(200);
      expect(result.degrees).toBeCloseTo(63.43, 1);
      expect(result.ratio).toBe(0.5); // 1:0.5
    });
  });

  describe('rise per meter calculation', () => {
    it('should calculate rise per meter correctly for 1% slope', () => {
      const result = slope({ fromUnit: 'percent', value: 1 });

      expect(result.risePerMeter).toBe(10); // 10mm per meter
    });

    it('should calculate rise per meter correctly for 5% slope', () => {
      const result = slope({ fromUnit: 'percent', value: 5 });

      expect(result.risePerMeter).toBe(50); // 50mm per meter
    });
  });

  describe('real-world examples', () => {
    it('should handle typical road grade (6%)', () => {
      const result = slope({ fromUnit: 'percent', value: 6 });

      expect(result.percent).toBe(6);
      expect(result.degrees).toBeCloseTo(3.43, 1);
      expect(result.risePerMeter).toBe(60); // 60mm per meter
    });

    it('should handle wheelchair ramp max slope (8.33%)', () => {
      // ADA requires max 1:12 ratio = 8.33%
      const result = slope({ fromUnit: 'ratio', value: 12 });

      expect(result.percent).toBeCloseTo(8.33, 1);
      expect(result.degrees).toBeCloseTo(4.76, 1);
    });
  });
});

describe('slope — degree domain (tan diverges at ±90°)', () => {
  it('accepts degrees just inside (−90, 90), downhill included', () => {
    expect(slope({ fromUnit: 'degrees', value: 89.9 }).percent).toBeGreaterThan(50000);
    expect(slope({ fromUnit: 'degrees', value: -45 }).percent).toBeCloseTo(-100, 6);
  });

  it('throws at and beyond ±90° instead of reading 95° back as −85°', () => {
    for (const value of [90, 95, -90, -120]) {
      expect(() => slope({ fromUnit: 'degrees', value })).toThrow(RangeError);
    }
  });

  it('throws for a non-finite value in any unit', () => {
    expect(() => slope({ fromUnit: 'percent', value: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => slope({ fromUnit: 'degrees', value: Number.NaN })).toThrow(RangeError);
  });

  it('still accepts a very steep but finite percent', () => {
    expect(slope({ fromUnit: 'percent', value: 1_000_000 }).degrees).toBeCloseTo(89.9943, 3);
  });
});

describe('slope refusal codes', () => {
  it('names value for a non-numeric value', () => {
    expect(() => slope({ fromUnit: 'percent', value: 'abc' as never }))
      .toThrow(expect.objectContaining({ code: 'value_not_finite', parameter: 'value', got: 'abc' }));
  });

  it('names value (the field the caller passes) for degrees out of range', () => {
    expect(() => slope({ fromUnit: 'degrees', value: 95 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'value', exclusive_min: -90, exclusive_max: 90, got: 95 }));
  });
});
