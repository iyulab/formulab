import { describe, it, expect } from 'vitest';
import { energyDensity } from './energyDensity.js';

describe('energyDensity', () => {
  it('should calculate energy in Wh', () => {
    // 3.2 Ah × 3.7 V = 11.84 Wh
    const result = energyDensity({ capacityAh: 3.2, nominalVoltage: 3.7 });
    expect(result.energyWh).toBeCloseTo(11.84, 2);
    expect(result.gravimetricWhPerKg).toBeNull();
    expect(result.volumetricWhPerL).toBeNull();
  });

  it('should calculate gravimetric energy density', () => {
    // 100 Ah × 3.6 V = 360 Wh, mass = 1.5 kg → 240 Wh/kg
    const result = energyDensity({
      capacityAh: 100,
      nominalVoltage: 3.6,
      massKg: 1.5,
    });
    expect(result.energyWh).toBeCloseTo(360, 1);
    expect(result.gravimetricWhPerKg).toBeCloseTo(240, 1);
  });

  it('should calculate volumetric energy density', () => {
    // 50 Ah × 3.7 V = 185 Wh, volume = 0.3 L → 616.67 Wh/L
    const result = energyDensity({
      capacityAh: 50,
      nominalVoltage: 3.7,
      volumeL: 0.3,
    });
    expect(result.energyWh).toBeCloseTo(185, 1);
    expect(result.volumetricWhPerL).toBeCloseTo(616.67, 1);
  });

  it('should calculate both densities when mass and volume provided', () => {
    // 5 Ah × 3.6 V = 18 Wh, mass = 0.048 kg, volume = 0.025 L
    const result = energyDensity({
      capacityAh: 5,
      nominalVoltage: 3.6,
      massKg: 0.048,
      volumeL: 0.025,
    });
    expect(result.energyWh).toBeCloseTo(18, 1);
    expect(result.gravimetricWhPerKg).toBeCloseTo(375, 0);
    expect(result.volumetricWhPerL).toBeCloseTo(720, 0);
  });

  describe('typical cell values', () => {
    it('18650 NMC cell: ~3.5Ah × 3.6V = 12.6Wh, ~46g → ~274 Wh/kg', () => {
      const result = energyDensity({
        capacityAh: 3.5,
        nominalVoltage: 3.6,
        massKg: 0.046,
      });
      expect(result.energyWh).toBeCloseTo(12.6, 1);
      expect(result.gravimetricWhPerKg).toBeCloseTo(273.91, 0);
    });

    it('LFP prismatic 280Ah × 3.2V = 896Wh, ~5.5kg → ~163 Wh/kg', () => {
      const result = energyDensity({
        capacityAh: 280,
        nominalVoltage: 3.2,
        massKg: 5.5,
      });
      expect(result.energyWh).toBeCloseTo(896, 1);
      expect(result.gravimetricWhPerKg).toBeCloseTo(162.91, 0);
    });
  });
});
