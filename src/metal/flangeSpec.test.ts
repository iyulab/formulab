import { describe, it, expect } from 'vitest';
import { flangeSpec } from './flangeSpec.js';

describe('flangeSpec', () => {
  describe('ASME B16.5 Class 150', () => {
    it('should return 4" Class 150 WN flange specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '4',
      });
      expect(result.nominalSize).toBe('4');
      expect(result.pressureClass).toBe('150');
      expect(result.outerDiameter).toBeCloseTo(228.6, 1);
      expect(result.thickness).toBeCloseTo(22.4, 1);
      expect(result.boltHoles).toBe(8);
      expect(result.boltSize).toBe('5/8" (M16)');
      expect(result.raisedFaceDiameter).toBeCloseTo(157.2, 1);
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should return 2" Class 150 WN flange specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '2',
      });
      expect(result.outerDiameter).toBeCloseTo(152.4, 1);
      expect(result.boltHoles).toBe(4);
    });

    it('should return 8" Class 150 WN flange specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '8',
      });
      expect(result.outerDiameter).toBeCloseTo(342.9, 1);
      expect(result.boltHoles).toBe(8);
    });
  });

  describe('ASME B16.5 Class 300', () => {
    it('should return 4" Class 300 with larger OD and more bolts', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '300',
        nominalSize: '4',
      });
      expect(result.outerDiameter).toBeCloseTo(254.0, 1);
      expect(result.thickness).toBeCloseTo(30.2, 1);
      expect(result.boltHoles).toBe(8);
      expect(result.boltSize).toBe('3/4" (M20)');
    });
  });

  describe('ASME B16.5 Class 600', () => {
    it('should return 6" Class 600 specs', () => {
      const result = flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '600',
        nominalSize: '6',
      });
      expect(result.outerDiameter).toBeCloseTo(355.6, 1);
      expect(result.thickness).toBeCloseTo(47.8, 1);
      expect(result.boltHoles).toBe(12);
    });
  });

  describe('pressure class comparison', () => {
    it('higher class should have thicker flange', () => {
      const cl150 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '150', nominalSize: '4' });
      const cl300 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '300', nominalSize: '4' });
      const cl600 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '600', nominalSize: '4' });
      expect(cl300.thickness).toBeGreaterThan(cl150.thickness);
      expect(cl600.thickness).toBeGreaterThan(cl300.thickness);
    });

    it('higher class should have heavier flange', () => {
      const cl150 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '150', nominalSize: '8' });
      const cl600 = flangeSpec({ standard: 'ASME_B16_5', pressureClass: '600', nominalSize: '8' });
      expect(cl600.weight).toBeGreaterThan(cl150.weight);
    });
  });

  describe('error handling', () => {
    it('should throw for unknown size', () => {
      expect(() => flangeSpec({
        standard: 'ASME_B16_5',
        pressureClass: '150',
        nominalSize: '99',
      })).toThrow();
    });

    it('should throw for EN_1092_1 (not implemented)', () => {
      expect(() => flangeSpec({
        standard: 'EN_1092_1',
        pressureClass: '150',
        nominalSize: '4',
      })).toThrow('EN 1092-1');
    });
  });
});

describe('flangeSpec ASME B16.5 table — row invariants', () => {
  const SIZES = ['1', '2', '3', '4', '6', '8', '10', '12'];
  const CLASSES = ['150', '300', '600'] as const;
  const rows = SIZES.flatMap(nominalSize => CLASSES.map(pressureClass => ({
    nominalSize, pressureClass, r: flangeSpec({ standard: 'ASME_B16_5', pressureClass, nominalSize }),
  })));

  it('raised face lies inside the bolt holes, which lie inside the flange', () => {
    for (const { r } of rows) {
      expect(r.raisedFaceDiameter).toBeLessThan(r.boltCircleDiameter);
      expect(r.boltCircleDiameter).toBeLessThan(r.outerDiameter);
    }
  });

  it('bolt hole counts are multiples of 4', () => {
    for (const { r } of rows) expect(r.boltHoles % 4).toBe(0);
  });

  it('within a size, a higher class never has a smaller OD, bolt circle or thickness', () => {
    for (const nominalSize of SIZES) {
      const [a, b, c] = CLASSES.map(pressureClass => rows.find(x => x.nominalSize === nominalSize && x.pressureClass === pressureClass)!.r);
      for (const [lo, hi] of [[a, b], [b, c]]) {
        expect(hi.outerDiameter).toBeGreaterThanOrEqual(lo.outerDiameter);
        expect(hi.boltCircleDiameter).toBeGreaterThanOrEqual(lo.boltCircleDiameter);
        expect(hi.thickness).toBeGreaterThanOrEqual(lo.thickness);
      }
    }
  });

  it('the raised face is not the pipe OD — B16.5 raised faces are well larger than the pipe (NPS 6+)', () => {
    const PIPE_OD: Record<string, number> = { '6': 168.3, '8': 219.1, '10': 273.1, '12': 323.9 };
    for (const { nominalSize, r } of rows) {
      if (PIPE_OD[nominalSize]) expect(r.raisedFaceDiameter).toBeGreaterThan(PIPE_OD[nominalSize] + 20);
    }
  });
});

// Golden rows cross-checked 2026-09-15 against public ASME B16.5 weld-neck tables that agree with each
// other (apiint.com Class 150/300 · texasflange.com Class 150/300/600 · wermac.org Class 150/300/600 ·
// zzsteels.com B16.5 catalog · hardhatengineer.com). Inches as published, mm = inch × 25.4. Thickness is
// the minimum flange thickness excluding the raised face. Bolt sizes are the B16.5 inch sizes with the
// ISO stud equivalent in brackets.
describe('flangeSpec ASME B16.5 — golden rows from public tables', () => {
  const cases: [string, '150' | '300' | '600', { od: number; t: number; bcd: number; holes: number; bolt: string; rf: number }][] = [
    ['1', '150', { od: 108.0, t: 12.7, bcd: 79.4, holes: 4, bolt: '1/2" (M14)', rf: 50.8 }],
    ['4', '150', { od: 228.6, t: 22.4, bcd: 190.5, holes: 8, bolt: '5/8" (M16)', rf: 157.2 }],
    ['12', '150', { od: 482.6, t: 30.2, bcd: 431.8, holes: 12, bolt: '7/8" (M24)', rf: 381.0 }],
    ['3', '300', { od: 209.6, t: 26.9, bcd: 168.3, holes: 8, bolt: '3/4" (M20)', rf: 127.0 }],
    ['12', '300', { od: 520.7, t: 49.3, bcd: 450.9, holes: 16, bolt: '1-1/8" (M30)', rf: 381.0 }],
    ['6', '600', { od: 355.6, t: 47.8, bcd: 292.1, holes: 12, bolt: '1" (M27)', rf: 215.9 }],
    ['12', '600', { od: 558.8, t: 66.5, bcd: 489.0, holes: 20, bolt: '1-1/4" (M33)', rf: 381.0 }],
  ];
  for (const [nominalSize, pressureClass, e] of cases) {
    it(`NPS ${nominalSize} Class ${pressureClass}`, () => {
      const r = flangeSpec({ standard: 'ASME_B16_5', pressureClass, nominalSize });
      expect(r.outerDiameter).toBeCloseTo(e.od, 1);
      expect(r.thickness).toBeCloseTo(e.t, 1);
      expect(r.boltCircleDiameter).toBeCloseTo(e.bcd, 1);
      expect(r.boltHoles).toBe(e.holes);
      expect(r.boltSize).toBe(e.bolt);
      expect(r.raisedFaceDiameter).toBeCloseTo(e.rf, 1);
    });
  }
});
