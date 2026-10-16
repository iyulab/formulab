import { describe, it, expect } from 'vitest';
import { tap } from './tap.js';

describe('tap', () => {
  describe('metric thread tap drill', () => {
    it('should calculate tap drill for M10x1.5 at 75%', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
        threadPercentage: 75,
      });

      // Standard tap drill for M10 is 8.5mm
      expect(result.tapDrillSize).toBeCloseTo(8.5, 0);
    });

    it('should calculate tap drill for M6x1.0', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 6,
        pitch: 1.0,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(5.0, 0);
    });

    it('should calculate tap drill for M12x1.75', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 12,
        pitch: 1.75,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(10.2, 0);
    });
  });

  describe('thread percentage variations', () => {
    it('should calculate larger drill for lower thread percentage', () => {
      const high = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
        threadPercentage: 75,
      });

      const low = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
        threadPercentage: 60,
      });

      expect(low.tapDrillSize).toBeGreaterThan(high.tapDrillSize);
    });

    it('should default to 75% thread engagement', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      expect(result.threadPercentage).toBe(75);
    });
  });

  describe('thread dimensions', () => {
    it('should calculate minor diameter', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      // Minor diameter = D - 1.25H where H = 0.866 x p
      expect(result.minorDiameter).toBeGreaterThan(0);
      expect(result.minorDiameter).toBeLessThan(10);
    });

    it('should calculate pitch diameter', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      expect(result.pitchDiameter).toBeGreaterThan(result.minorDiameter);
      expect(result.pitchDiameter).toBeLessThan(10);
    });

    it('should calculate thread height', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      // H = 0.866 x pitch = 0.866 x 1.5 = 1.299
      expect(result.threadHeight).toBeCloseTo(1.299, 2);
    });
  });

  describe('unified thread (TPI)', () => {
    it('should convert TPI to metric pitch', () => {
      const result = tap({
        standard: 'unified',
        majorDiameter: 6.35, // 1/4 inch
        pitch: 20, // 20 TPI
      });

      // Pitch in mm = 25.4 / 20 = 1.27mm
      expect(result.threadHeight).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should throw for invalid major diameter', () => {
      expect(() => tap({
        standard: 'metric',
        majorDiameter: 0,
        pitch: 1.5,
      })).toThrow();
    });

    it('should throw for invalid pitch', () => {
      expect(() => tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 0,
      })).toThrow();
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for fine pitch thread M8x1.0', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 8,
        pitch: 1.0,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(7.0, 0);
    });

    it('should calculate for large thread M20x2.5', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 20,
        pitch: 2.5,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(17.5, 0);
    });
  });
});

describe('tap — the minor diameter must stay positive', () => {
  it('accepts the coarsest standard metric pitch for its diameter (M64 × 6)', () => {
    expect(tap({ standard: 'metric', majorDiameter: 64, pitch: 6 }).minorDiameter).toBeGreaterThan(0);
  });

  it('throws when the pitch leaves no core (D = 10, P = 20 gave a −6.24 mm tap drill)', () => {
    expect(() => tap({ standard: 'metric', majorDiameter: 10, pitch: 20 })).toThrow(RangeError);
    // Boundary: D_minor = D − 1.0825·p, so p = D / 1.0825 is exactly zero core.
    expect(() => tap({ standard: 'metric', majorDiameter: 10, pitch: 10 / (1.25 * 0.866025) })).toThrow(RangeError);
  });

  it('throws for a thread percentage outside (0, 100]', () => {
    expect(() => tap({ standard: 'metric', majorDiameter: 10, pitch: 1.5, threadPercentage: 0 })).toThrow(RangeError);
    expect(() => tap({ standard: 'metric', majorDiameter: 10, pitch: 1.5, threadPercentage: 120 })).toThrow(RangeError);
    expect(tap({ standard: 'metric', majorDiameter: 10, pitch: 1.5, threadPercentage: 100 }).threadPercentage).toBe(100);
  });
});

// The tap drill chart convention: 100 % of thread = a diametral depth of 1.299 p (Machinery's
// Handbook, «D − 1.299 × % / TPI»), so the chart drill D − p is 76.98 % and ISO 2306's drills
// (≈ D − p) read the same percentage on every diameter.
describe('tap percentage of thread (chart convention)', () => {
  it('M10 x 1.5 at 75 % is 8.54 mm, and the chart drill 8.5 mm is 76.98 %', () => {
    expect(tap({ standard: 'metric', majorDiameter: 10, pitch: 1.5, threadPercentage: 75 }).tapDrillSize).toBe(8.54);
    expect(tap({ standard: 'metric', majorDiameter: 10, pitch: 1.5, threadPercentage: 76.98 }).tapDrillSize).toBe(8.5);
  });

  it('D - p is 76.98 % for every metric coarse pitch', () => {
    for (const [d, p] of [[6, 1], [8, 1.25], [12, 1.75], [16, 2], [24, 3]] as const) {
      expect(tap({ standard: 'metric', majorDiameter: d, pitch: p, threadPercentage: 76.98 }).tapDrillSize).toBeCloseTo(d - p, 2);
    }
  });

  it('1/4-20 UNC at 75 % is 0.2013 in (the #7 drill, 0.2010 in, is the chart choice)', () => {
    const r = tap({ standard: 'unified', majorDiameter: 6.35, pitch: 20, threadPercentage: 75 });
    expect(r.tapDrillSize / 25.4).toBeCloseTo(0.2013, 3);
  });

  it('refuses a percentage that leaves no hole', () => {
    expect(() => tap({ standard: 'metric', majorDiameter: 1, pitch: 0.9, threadPercentage: 100 })).toThrow(RangeError);
  });
});


describe('tap refusals carry their facts', () => {
  it('bounds the pitch by the major diameter, in the caller\'s own unit', () => {
    expect(() => tap({ standard: 'metric', majorDiameter: 10, pitch: 20 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'pitch', got: 20, exclusive_max: 10 / (1.25 * 0.866025) }));
    expect(() => tap({ standard: 'unified', majorDiameter: 10, pitch: 1 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'pitch', got: 1, exclusive_min: (25.4 * 1.25 * 0.866025) / 10 }));
  });
});
