import { describe, it, expect } from 'vitest';
import { boringBarDeflection } from './boringBarDeflection.js';

describe('boringBarDeflection', () => {
  it('should calculate deflection for 20mm steel boring bar', () => {
    const result = boringBarDeflection({
      barDiameter: 20,
      overhang: 60,
      cuttingForce: 200,
    });

    // I = π × 20⁴ / 64 = 7853.98 mm⁴
    // E = 200 GPa = 200,000 MPa
    // δ = 200 × 60³ / (3 × 200000 × 7853.98)
    //   = 200 × 216000 / 4712388 ≈ 0.00917 mm
    expect(result.momentOfInertia).toBeCloseTo(7854, 0);
    expect(result.deflection).toBeCloseTo(0.00917, 3);
    expect(result.ldRatio).toBe(3);
    expect(result.youngsModulus).toBe(200);
    expect(result.recommendation).toBe('Steel bar suitable');
  });

  it('should recommend carbide for L/D 4-6', () => {
    const result = boringBarDeflection({
      barDiameter: 20,
      overhang: 100,
      cuttingForce: 200,
    });

    expect(result.ldRatio).toBe(5);
    expect(result.recommendation).toBe('Carbide bar recommended');
  });

  it('should recommend heavy metal for L/D 6-10', () => {
    const result = boringBarDeflection({
      barDiameter: 20,
      overhang: 160,
      cuttingForce: 200,
    });

    expect(result.ldRatio).toBe(8);
    expect(result.recommendation).toBe('Heavy metal or damped bar recommended');
  });

  it('should warn when L/D exceeds 10', () => {
    const result = boringBarDeflection({
      barDiameter: 10,
      overhang: 120,
      cuttingForce: 200,
    });

    expect(result.ldRatio).toBe(12);
    expect(result.recommendation).toContain('exceeds practical limits');
  });

  it('should use carbide modulus when specified', () => {
    const steel = boringBarDeflection({
      barDiameter: 20, overhang: 60, cuttingForce: 200, material: 'steel',
    });
    const carbide = boringBarDeflection({
      barDiameter: 20, overhang: 60, cuttingForce: 200, material: 'carbide',
    });

    expect(carbide.youngsModulus).toBe(550);
    expect(carbide.deflection).toBeLessThan(steel.deflection);
  });
});
