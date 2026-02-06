import { describe, it, expect } from 'vitest';
import { boltCircle } from './boltCircle.js';

describe('boltCircle', () => {
  it('should calculate 4-hole pattern on 100mm BCD', () => {
    const result = boltCircle({
      boltCircleDiameter: 100,
      numberOfHoles: 4,
      startAngle: 0,
    });

    expect(result.radius).toBe(50);
    expect(result.angularSpacing).toBe(90);
    expect(result.holes).toHaveLength(4);

    // Hole 1: 0° → (50, 0)
    expect(result.holes[0].x).toBeCloseTo(50, 2);
    expect(result.holes[0].y).toBeCloseTo(0, 2);

    // Hole 2: 90° → (0, 50)
    expect(result.holes[1].x).toBeCloseTo(0, 2);
    expect(result.holes[1].y).toBeCloseTo(50, 2);

    // Hole 3: 180° → (-50, 0)
    expect(result.holes[2].x).toBeCloseTo(-50, 2);
    expect(result.holes[2].y).toBeCloseTo(0, 2);

    // Hole 4: 270° → (0, -50)
    expect(result.holes[3].x).toBeCloseTo(0, 2);
    expect(result.holes[3].y).toBeCloseTo(-50, 2);
  });

  it('should calculate 6-hole pattern with 30° start angle', () => {
    const result = boltCircle({
      boltCircleDiameter: 200,
      numberOfHoles: 6,
      startAngle: 30,
    });

    expect(result.angularSpacing).toBe(60);
    expect(result.holes).toHaveLength(6);
    expect(result.holes[0].angle).toBe(30);
    expect(result.holes[1].angle).toBe(90);

    // Hole at 90°: x=0, y=100
    expect(result.holes[1].x).toBeCloseTo(0, 2);
    expect(result.holes[1].y).toBeCloseTo(100, 2);
  });

  it('should default startAngle to 0', () => {
    const result = boltCircle({
      boltCircleDiameter: 100,
      numberOfHoles: 3,
    });

    expect(result.holes[0].angle).toBe(0);
    expect(result.angularSpacing).toBeCloseTo(120, 2);
  });

  it('should calculate 2-hole pattern', () => {
    const result = boltCircle({
      boltCircleDiameter: 80,
      numberOfHoles: 2,
    });

    expect(result.angularSpacing).toBe(180);
    expect(result.holes).toHaveLength(2);
    expect(result.holes[0].x).toBeCloseTo(40, 2);
    expect(result.holes[1].x).toBeCloseTo(-40, 2);
  });

  it('should handle odd number of holes', () => {
    const result = boltCircle({
      boltCircleDiameter: 150,
      numberOfHoles: 5,
    });

    expect(result.angularSpacing).toBe(72);
    expect(result.holes).toHaveLength(5);
    // First hole at 0°, radius = 75
    expect(result.holes[0].x).toBeCloseTo(75, 2);
    expect(result.holes[0].y).toBeCloseTo(0, 2);
  });
});
