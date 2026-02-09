import { describe, it, expect } from 'vitest';
import { toolDeflection } from './toolDeflection.js';

describe('toolDeflection', () => {
  it('should calculate deflection for 10mm carbide end mill', () => {
    const result = toolDeflection({
      toolDiameter: 10,
      stickout: 50,
      cuttingForce: 100,
    });

    // I = π × 10⁴ / 64 = 490.8739 mm⁴
    // E = 550 GPa = 550,000 MPa
    // δ = 100 × 50³ / (3 × 550000 × 490.8739)
    //   = 100 × 125000 / (3 × 550000 × 490.8739)
    //   = 12500000 / 809941899 ≈ 0.01543 mm
    expect(result.momentOfInertia).toBeCloseTo(490.874, 0);
    expect(result.deflection).toBeCloseTo(0.01543, 3);
    expect(result.youngsModulus).toBe(550);
    expect(result.stiffness).toBeGreaterThan(0);
  });

  it('should calculate deflection for HSS end mill', () => {
    const result = toolDeflection({
      toolDiameter: 10,
      stickout: 50,
      cuttingForce: 100,
      material: 'hss',
    });

    // Same geometry, E = 200 GPa → more deflection
    expect(result.youngsModulus).toBe(200);
    expect(result.deflection).toBeGreaterThan(0.04); // ~2.75× more than carbide
  });

  it('should use custom Young\'s modulus when provided', () => {
    const result = toolDeflection({
      toolDiameter: 10,
      stickout: 50,
      cuttingForce: 100,
      youngsModulus: 400,
    });

    expect(result.youngsModulus).toBe(400);
  });

  it('should show less deflection with larger diameter', () => {
    const thin = toolDeflection({ toolDiameter: 6, stickout: 50, cuttingForce: 100 });
    const thick = toolDeflection({ toolDiameter: 12, stickout: 50, cuttingForce: 100 });

    expect(thick.deflection).toBeLessThan(thin.deflection);
  });

  it('should show cubic relationship with stickout', () => {
    const short = toolDeflection({ toolDiameter: 10, stickout: 30, cuttingForce: 100 });
    const long = toolDeflection({ toolDiameter: 10, stickout: 60, cuttingForce: 100 });

    // 60/30 = 2× stickout → 8× deflection
    const ratio = long.deflection / short.deflection;
    expect(ratio).toBeCloseTo(8, 0);
  });

  it('should compute stiffness independently of force', () => {
    const withForce = toolDeflection({ toolDiameter: 10, stickout: 50, cuttingForce: 100 });
    const zeroForce = toolDeflection({ toolDiameter: 10, stickout: 50, cuttingForce: 0 });

    expect(zeroForce.deflection).toBe(0);
    expect(zeroForce.stiffness).toBe(withForce.stiffness);
  });

  describe('validation', () => {
    it('should throw on zero toolDiameter', () => {
      expect(() => toolDeflection({ toolDiameter: 0, stickout: 50, cuttingForce: 100 })).toThrow(RangeError);
    });

    it('should throw on zero stickout', () => {
      expect(() => toolDeflection({ toolDiameter: 10, stickout: 0, cuttingForce: 100 })).toThrow(RangeError);
    });

    it('should throw on negative cuttingForce', () => {
      expect(() => toolDeflection({ toolDiameter: 10, stickout: 50, cuttingForce: -1 })).toThrow(RangeError);
    });
  });
});
