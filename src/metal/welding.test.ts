import { describe, it, expect } from 'vitest';
import { welding } from './welding.js';

describe('welding', () => {
  describe('mild steel electrodes', () => {
    it('should recommend electrodes for mild steel', () => {
      const result = welding({
        baseMetal: 'mildSteel',
        position: 'flat',
        thickness: 6,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.designation === 'E7018')).toBe(true);
    });

    it('should include E6010 and E6013 for mild steel', () => {
      const result = welding({
        baseMetal: 'mildSteel',
        position: 'flat',
        thickness: 6,
      });

      const designations = result.recommendations.map(r => r.designation);
      expect(designations).toContain('E6010');
      expect(designations).toContain('E6013');
    });
  });

  describe('stainless steel electrodes', () => {
    it('should recommend electrodes for stainless steel', () => {
      const result = welding({
        baseMetal: 'stainlessSteel',
        position: 'flat',
        thickness: 5,
      });

      expect(result.recommendations.some(r => r.designation === 'E308L-16')).toBe(true);
      expect(result.recommendations.some(r => r.designation === 'E316L-16')).toBe(true);
    });

    it('should include note about heat input', () => {
      const result = welding({
        baseMetal: 'stainlessSteel',
        position: 'flat',
        thickness: 5,
      });

      expect(result.notes.some(n => n.includes('heat input'))).toBe(true);
    });
  });

  describe('cast iron electrodes', () => {
    it('should recommend nickel electrodes for cast iron', () => {
      const result = welding({
        baseMetal: 'castIron',
        position: 'flat',
        thickness: 10,
      });

      expect(result.recommendations.some(r => r.designation === 'ENi-CI')).toBe(true);
    });

    it('should include preheat note for cast iron', () => {
      const result = welding({
        baseMetal: 'castIron',
        position: 'flat',
        thickness: 10,
      });

      expect(result.notes.some(n => n.includes('Preheat'))).toBe(true);
    });
  });

  describe('aluminum electrodes', () => {
    it('should recommend electrodes for aluminum', () => {
      const result = welding({
        baseMetal: 'aluminum',
        position: 'flat',
        thickness: 5,
      });

      expect(result.recommendations.some(r => r.designation === 'E4043')).toBe(true);
    });

    /**
     * AWS A5.3 (SMAW aluminum electrodes) classifies exactly three designations: E1100,
     * E3003, E4043 — verified against the standard's own scope (ANSI/AWS bookstore listing;
     * cross-checked against two independent sources). "E5356" does not exist under A5.3: 5356
     * is a real aluminum filler alloy, but only as GTAW/GMAW wire under AWS A5.10's "ER5356"
     * designation — a different process than the rod-diameter/current-range SMAW parameters
     * this function returns. Pins the correction against reintroducing that mismatch.
     */
    it('should only recommend real AWS A5.3 SMAW designations, not the A5.10 GTAW/GMAW "ER5356" filler wire', () => {
      const result = welding({
        baseMetal: 'aluminum',
        position: 'flat',
        thickness: 5,
      });

      const designations = result.recommendations.map(r => r.designation);
      const AWS_A5_3_DESIGNATIONS = ['E1100', 'E3003', 'E4043'];
      for (const d of designations) {
        expect(AWS_A5_3_DESIGNATIONS).toContain(d);
      }
      expect(designations).not.toContain('E5356');
      expect(designations).not.toContain('ER5356');
    });

    it('should include polarity note for aluminum', () => {
      const result = welding({
        baseMetal: 'aluminum',
        position: 'flat',
        thickness: 5,
      });

      expect(result.notes.some(n => n.includes('AC') || n.includes('DCEP'))).toBe(true);
    });
  });

  describe('low alloy steel electrodes', () => {
    it('should recommend low hydrogen electrodes for low alloy steel', () => {
      const result = welding({
        baseMetal: 'lowAlloySteel',
        position: 'flat',
        thickness: 10,
      });

      expect(result.recommendations.some(r => r.designation.includes('7018'))).toBe(true);
    });
  });

  describe('rod diameter recommendation', () => {
    it('should recommend smaller rod for thin material', () => {
      const result = welding({
        baseMetal: 'mildSteel',
        position: 'flat',
        thickness: 2,
      });

      expect(result.rodDiameter).toBeLessThanOrEqual(3.2);
    });

    it('should recommend larger rod for thick material', () => {
      const result = welding({
        baseMetal: 'mildSteel',
        position: 'flat',
        thickness: 15,
      });

      expect(result.rodDiameter).toBeGreaterThanOrEqual(4.0);
    });

    it('should scale rod diameter with thickness', () => {
      const thin = welding({ baseMetal: 'mildSteel', position: 'flat', thickness: 3 });
      const thick = welding({ baseMetal: 'mildSteel', position: 'flat', thickness: 20 });

      expect(thick.rodDiameter).toBeGreaterThan(thin.rodDiameter);
    });
  });

  describe('current range', () => {
    it('should provide current range based on rod diameter', () => {
      const result = welding({
        baseMetal: 'mildSteel',
        position: 'flat',
        thickness: 6,
      });

      expect(result.currentRange.min).toBeGreaterThan(0);
      expect(result.currentRange.max).toBeGreaterThan(result.currentRange.min);
    });

    it('should scale current with rod diameter', () => {
      const thin = welding({ baseMetal: 'mildSteel', position: 'flat', thickness: 3 });
      const thick = welding({ baseMetal: 'mildSteel', position: 'flat', thickness: 20 });

      expect(thick.currentRange.max).toBeGreaterThan(thin.currentRange.max);
    });
  });

  describe('position filtering', () => {
    it('should return all electrodes for flat position', () => {
      const result = welding({
        baseMetal: 'mildSteel',
        position: 'flat',
        thickness: 6,
      });

      expect(result.recommendations.some(r => r.designation === 'E7024')).toBe(true);
    });

    it('should filter out non-all-position electrodes for vertical', () => {
      const result = welding({
        baseMetal: 'mildSteel',
        position: 'vertical',
        thickness: 6,
      });

      // E7024 is flat/horizontal only
      expect(result.recommendations.some(r => r.designation === 'E7024')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should throw for zero thickness', () => {
      expect(() => welding({
        baseMetal: 'mildSteel',
        position: 'flat',
        thickness: 0,
      })).toThrow();
    });
  });

  /**
   * Structural invariant: every electrode's awsClass matches the AWS specification that
   * actually classifies its designation family (mild steel → A5.1, low-alloy suffix → A5.5,
   * stainless -L-16 → A5.4, cast-iron Ni/NiFe/St → A5.15, aluminum → A5.3). Catches a
   * designation being added under the wrong specification, the same class of defect this
   * cycle found and fixed for the aluminum entries.
   */
  describe('AWS specification consistency', () => {
    const ALL_BASE_METALS: Array<Parameters<typeof welding>[0]['baseMetal']> = [
      'mildSteel', 'lowAlloySteel', 'stainlessSteel', 'castIron', 'aluminum',
    ];
    const EXPECTED_AWS_CLASS: Record<string, string> = {
      mildSteel: 'AWS A5.1',
      lowAlloySteel: 'AWS A5.5',
      stainlessSteel: 'AWS A5.4',
      castIron: 'AWS A5.15',
      aluminum: 'AWS A5.3',
    };

    it('assigns every electrode the AWS specification matching its base metal', () => {
      for (const baseMetal of ALL_BASE_METALS) {
        const result = welding({ baseMetal, position: 'flat', thickness: 6 });
        for (const rod of result.recommendations) {
          expect(rod.awsClass).toBe(EXPECTED_AWS_CLASS[baseMetal]);
        }
      }
    });
  });
});
