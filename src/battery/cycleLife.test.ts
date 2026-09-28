import { describe, it, expect } from 'vitest';
import { cycleLife } from './cycleLife.js';

describe('cycleLife', () => {
  describe('base cycle values (80% DOD, 25°C)', () => {
    it('LFP → 3500 cycles', () => {
      const result = cycleLife({ chemistry: 'LFP', depthOfDischarge: 80, temperatureC: 25 });
      expect(result.baseCycles).toBe(3500);
      expect(result.dodFactor).toBe(1);
      expect(result.temperatureFactor).toBe(1.0);
      expect(result.estimatedCycles).toBe(3500);
    });

    it('NMC → 1500 cycles', () => {
      expect(cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 25 }).estimatedCycles).toBe(1500);
    });

    it('LTO → 15000 cycles', () => {
      expect(cycleLife({ chemistry: 'LTO', depthOfDischarge: 80, temperatureC: 25 }).estimatedCycles).toBe(15000);
    });
  });

  // Battery University BU-808, Table 2 (cycles to 70% capacity): the factor is each row divided by the 80% row.
  describe('DOD factor — BU-808 Table 2, relative to 80% DOD', () => {
    const nmcRows: [number, number][] = [[100, 300], [80, 400], [60, 600], [40, 1000], [20, 2000], [10, 6000]];
    const lfpRows: [number, number][] = [[100, 600], [80, 900], [60, 1500], [40, 3000], [20, 9000], [10, 15000]];

    it.each(nmcRows)('NMC column at %i%% DOD → %i / 400', (dod, cycles) => {
      const r = cycleLife({ chemistry: 'NMC', depthOfDischarge: dod, temperatureC: 25 });
      expect(r.dodCurve).toBe('NMC');
      expect(r.dodFactor).toBeCloseTo(cycles / 400, 4);
    });

    it.each(lfpRows)('LFP column at %i%% DOD → %i / 900', (dod, cycles) => {
      const r = cycleLife({ chemistry: 'LFP', depthOfDischarge: dod, temperatureC: 25 });
      expect(r.dodCurve).toBe('LFP');
      expect(r.dodFactor).toBeCloseTo(cycles / 900, 4);
    });

    it('interpolates log-linearly between rows (cycles fall geometrically with depth)', () => {
      // 50% sits halfway between the 40% (2.5) and 60% (1.5) rows: √(2.5 × 1.5) = 1.9365
      const r = cycleLife({ chemistry: 'NMC', depthOfDischarge: 50, temperatureC: 25 });
      expect(r.dodFactor).toBeCloseTo(Math.sqrt(2.5 * 1.5), 4);
      expect(r.estimatedCycles).toBe(2905);
    });

    it('shallow cycles last longer all the way down to the table\'s last row — no flat plateau', () => {
      const at = (dod: number) => cycleLife({ chemistry: 'NMC', depthOfDischarge: dod, temperatureC: 25 }).dodFactor;
      expect(at(10)).toBeGreaterThan(at(20));
      expect(at(20)).toBeGreaterThan(at(30));
      expect(at(30)).toBeGreaterThan(at(50));
    });

    it('holds the 10% row below 10% DOD rather than extrapolating past the table, and says so', () => {
      const below = cycleLife({ chemistry: 'NMC', depthOfDischarge: 9.9, temperatureC: 25 });
      expect(below.dodFactor).toBe(15);
      expect(below.dodBelowTable).toBe(true);
      const onRow = cycleLife({ chemistry: 'NMC', depthOfDischarge: 10, temperatureC: 25 });
      expect(onRow.dodFactor).toBe(15);
      expect(onRow.dodBelowTable).toBe(false);
    });

    it('50% vs 100% DOD differs by about 2.6× for NMC, as the table does (not 2.1× as the old model)', () => {
      const f50 = cycleLife({ chemistry: 'NMC', depthOfDischarge: 50, temperatureC: 25 }).dodFactor;
      const f100 = cycleLife({ chemistry: 'NMC', depthOfDischarge: 100, temperatureC: 25 }).dodFactor;
      expect(f50 / f100).toBeCloseTo(2.582, 2);
    });

    it('applies the NMC trend to chemistries the table has no column for, and says so', () => {
      for (const chemistry of ['NCA', 'LCO', 'LTO', 'LeadAcid', 'NiMH'] as const) {
        expect(cycleLife({ chemistry, depthOfDischarge: 60, temperatureC: 25 }).dodCurve).toBe('NMC');
      }
    });
  });

  it('rejects a depth of discharge outside 0–100%', () => {
    for (const dod of [0, -5, 120, Number.NaN]) {
      expect(() => cycleLife({ chemistry: 'NMC', depthOfDischarge: dod, temperatureC: 25 })).toThrow(RangeError);
    }
  });

  it('rejects an unknown chemistry instead of returning NaN', () => {
    expect(() => cycleLife({ chemistry: 'Zinc' as never, depthOfDischarge: 80, temperatureC: 25 })).toThrow(RangeError);
  });

  describe('temperature factor', () => {
    it('sub-zero → factor 0.5', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: -10 });
      expect(result.temperatureFactor).toBe(0.5);
      expect(result.estimatedCycles).toBe(750);
    });

    it('cold (5°C) → factor 0.8', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 5 });
      expect(result.temperatureFactor).toBe(0.8);
      expect(result.estimatedCycles).toBe(1200);
    });

    it('optimal (25°C) → factor 1.0', () => {
      expect(cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 25 }).temperatureFactor).toBe(1.0);
    });

    it('warm (40°C) → factor 0.8', () => {
      expect(cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 40 }).temperatureFactor).toBe(0.8);
    });

    it('hot (50°C) → factor 0.5', () => {
      expect(cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 50 }).temperatureFactor).toBe(0.5);
    });
  });

  describe('combined factors', () => {
    it('LFP, 40% DOD, 25°C → 3500 × 3000/900', () => {
      expect(cycleLife({ chemistry: 'LFP', depthOfDischarge: 40, temperatureC: 25 }).estimatedCycles).toBe(11667);
    });

    it('LCO, 100% DOD, 50°C → 800 × 0.75 × 0.5 = 300', () => {
      expect(cycleLife({ chemistry: 'LCO', depthOfDischarge: 100, temperatureC: 50 }).estimatedCycles).toBe(300);
    });

    it('NMC, 60% DOD, 40°C → 1500 × 1.5 × 0.8 = 1800', () => {
      expect(cycleLife({ chemistry: 'NMC', depthOfDischarge: 60, temperatureC: 40 }).estimatedCycles).toBe(1800);
    });
  });
});
