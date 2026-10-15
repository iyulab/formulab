import { describe, it, expect } from 'vitest';
import { chargeableWeight, VOLUMETRIC_KG_PER_M3 } from './chargeableWeight.js';

describe('chargeableWeight', () => {
  // A 60 × 40 × 30 cm carton of 8 kg: 0.072 m³ → 12.02 kg by air (1 m³ = 167 kg), so the volume governs.
  it('charges a light, bulky carton by its volume in air freight', () => {
    const r = chargeableWeight({ volume: 0.072, actualWeight: 8, mode: 'air' });
    expect(r).toEqual({ volumetricFactor: 167, volumetricWeight: 12.02, chargeableWeight: 12.02, isVolumetricHigher: true });
  });

  it('charges the same carton by its weight at sea (W/M: 1 m³ = 1 t)', () => {
    const r = chargeableWeight({ volume: 0.072, actualWeight: 80, mode: 'ocean' });
    expect(r.volumetricWeight).toBe(72);
    expect(r.chargeableWeight).toBe(80);
    expect(r.isVolumetricHigher).toBe(false);
  });

  it('uses each mode\'s factor', () => {
    expect(VOLUMETRIC_KG_PER_M3).toEqual({ air: 167, express: 200, ocean: 1000, truck: 333 });
    expect(chargeableWeight({ volume: 3, actualWeight: 0, mode: 'truck' }).volumetricWeight).toBe(999);
    expect(chargeableWeight({ volume: 1, actualWeight: 0, mode: 'express' }).volumetricWeight).toBe(200);
  });

  it('refuses a volume that is not positive, a negative weight and an unknown mode', () => {
    expect(() => chargeableWeight({ volume: 0, actualWeight: 1, mode: 'air' })).toThrow(RangeError);
    expect(() => chargeableWeight({ volume: 1, actualWeight: -1, mode: 'air' })).toThrow(RangeError);
    expect(() => chargeableWeight({ volume: 1, actualWeight: 1, mode: 'rail' as never })).toThrow(/unknown freight mode/);
    expect(() => chargeableWeight({ volume: 1, actualWeight: 1, mode: 'toString' as never })).toThrow(/unknown freight mode/);
  });
});
