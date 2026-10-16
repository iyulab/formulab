import { describe, it, expect } from 'vitest';
import { getContainerSpec, getContainerTypes } from './containerSpec.js';
import { containerFit } from './containerFit.js';

describe('getContainerSpec', () => {
  it('lists the standard dry vans, smallest first', () => {
    expect(getContainerTypes()).toEqual(['20ft', '40ft', '40hc']);
  });

  it('gives inside dimensions and typical payload', () => {
    expect(getContainerSpec('20ft')).toEqual({ type: '20ft', interior: { length: 5898, width: 2352, height: 2393 }, maxPayload: 28200 });
    expect(getContainerSpec('40ft')).toEqual({ type: '40ft', interior: { length: 12032, width: 2352, height: 2393 }, maxPayload: 26680 });
    expect(getContainerSpec('40hc')).toEqual({ type: '40hc', interior: { length: 12032, width: 2352, height: 2698 }, maxPayload: 26460 });
  });

  // ISO 668: a 40 ft box is twice a 20 ft one plus the 76 mm gap; a high cube is 305 mm (1 ft) taller.
  it('keeps the ISO 668 relations between the types', () => {
    const [a, b, hc] = getContainerTypes().map(getContainerSpec);
    expect(b.interior.width).toBe(a.interior.width);
    expect(b.interior.height).toBe(a.interior.height);
    expect(hc.interior.length).toBe(b.interior.length);
    expect(hc.interior.height - b.interior.height).toBe(305);
    expect(b.interior.length).toBeGreaterThan(2 * a.interior.length);
  });

  it('returns a copy', () => {
    const spec = getContainerSpec('20ft');
    spec.interior.length = 1;
    expect(getContainerSpec('20ft').interior.length).toBe(5898);
  });

  it('refuses an unknown type', () => {
    expect(() => getContainerSpec('45ft' as never)).toThrow(RangeError);
    expect(() => getContainerSpec('toString' as never)).toThrow(RangeError);
  });

  it('feeds containerFit directly', () => {
    const { interior, maxPayload } = getContainerSpec('40hc');
    const r = containerFit({ container: interior, cargo: { length: 1200, width: 800, height: 1300, weight: 800 }, rotation: 'layered', maxPayload });
    // 10 × 2 = 20 pallets per layer by floor (as given), 2 layers by height; 26460 / 800 → 33 by payload
    expect(r).toMatchObject({ unitsPerLayer: 20, layers: 2, totalUnits: 33, limitedBy: 'payload' });
  });
});

describe('getContainerSpec coded refusals', () => {
  it('codes an unknown container type', () => {
    expect(() => getContainerSpec('45ft' as never)).toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'type', got: '45ft' }));
  });
});
