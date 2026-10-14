import { describe, it, expect } from 'vitest';
import { brick } from './brick.js';
import { pert } from './pert.js';
import { rebarWeight } from './rebar.js';
import { roof } from './roof.js';

// A negative physical quantity has no meaning; returning a sign-flipped "result" for it presents
// garbage as a calculation. Each function refuses it, and accepts the domain boundary.
describe('construction: physical input domains', () => {
  it('brick refuses a negative wasteFactor and accepts 0', () => {
    expect(() => brick({ wallArea: 10, brickSize: 'modular', mortarThickness: 10, wasteFactor: -5 })).toThrow(RangeError);
    // 1e6 / (204 × 67) ≈ 73.16 bricks/m² → 731.6 → 732
    const r = brick({ wallArea: 10, brickSize: 'modular', mortarThickness: 10, wasteFactor: 0 });
    expect(r.bricksPerSqMeter).toBe(73.2);
    expect(r.totalBricks).toBe(732);
    expect(r.wastedBricks).toBe(0);
  });

  it('pert refuses a negative estimate or deadline and accepts 0', () => {
    expect(() => pert({ tasks: [{ id: 'A', name: 'A', predecessors: [], optimistic: -1, mostLikely: 2, pessimistic: 4 }] })).toThrow(RangeError);
    expect(() => pert({ tasks: [{ id: 'A', name: 'A', predecessors: [], optimistic: 1, mostLikely: 2, pessimistic: 4 }], deadline: -5 })).toThrow(RangeError);
    // Estimates out of order: optimistic > mostLikely, mostLikely > pessimistic
    expect(() => pert({ tasks: [{ id: 'A', name: 'A', predecessors: [], optimistic: 3, mostLikely: 2, pessimistic: 4 }] })).toThrow(RangeError);
    expect(() => pert({ tasks: [{ id: 'A', name: 'A', predecessors: [], optimistic: 1, mostLikely: 5, pessimistic: 4 }] })).toThrow(RangeError);
    // Equal estimates (a deterministic task) are accepted: te = 3, variance 0
    const fixed = pert({ tasks: [{ id: 'A', name: 'A', predecessors: [], optimistic: 3, mostLikely: 3, pessimistic: 3 }] });
    expect(fixed.projectDuration).toBe(3);
    expect(fixed.projectVariance).toBe(0);
    // te = (0 + 8 + 4) / 6 = 2, σ = 4/6, z = (0 − 2) / (2/3) = −3
    const r = pert({ tasks: [{ id: 'A', name: 'A', predecessors: [], optimistic: 0, mostLikely: 2, pessimistic: 4 }], deadline: 0 });
    expect(r.projectDuration).toBe(2);
    expect(r.zScore).toBeCloseTo(-3, 2);
  });

  it('rebarWeight refuses a non-positive length or quantity', () => {
    expect(() => rebarWeight({ size: 'D10', length: -6, quantity: 10 })).toThrow(RangeError);
    expect(() => rebarWeight({ size: 'D10', length: 6, quantity: 0 })).toThrow(RangeError);
    const r = rebarWeight({ size: 'D10', length: 6, quantity: 1 });
    expect(r.totalWeight).toBe(3.36);
  });

  it('roof refuses a non-positive footprint', () => {
    expect(() => roof({ rise: 4, run: 12, footprintLength: 10, footprintWidth: -8 })).toThrow(RangeError);
    expect(() => roof({ rise: 4, run: 12, footprintLength: 0, footprintWidth: 8 })).toThrow(RangeError);
    const r = roof({ rise: 0, run: 12, footprintLength: 10, footprintWidth: 8 });
    expect(r.slopeFactor).toBe(1);
    expect(r.roofArea).toBe(80);
  });
});
