import { describe, it, expect } from 'vitest';
import { materialGradeConverter } from './materialGradeConverter.js';

describe('materialGradeConverter', () => {
  describe('structural steel', () => {
    it('should convert ASTM A36 to equivalents', () => {
      const result = materialGradeConverter({ standard: 'ASTM', grade: 'A36' });
      expect(result.astm).toBe('A36');
      expect(result.en).toBe('S235JR');
      expect(result.jis).toBe('SS400');
      expect(result.gb).toBe('Q235B');
      expect(result.ks).toBe('SS400');
      expect(result.category).toBe('structural_steel');
    });

    it('should convert EN S235JR to equivalents', () => {
      const result = materialGradeConverter({ standard: 'EN', grade: 'S235JR' });
      expect(result.astm).toBe('A36');
      expect(result.jis).toBe('SS400');
    });

    it('should convert JIS SS400 to equivalents', () => {
      const result = materialGradeConverter({ standard: 'JIS', grade: 'SS400' });
      expect(result.astm).toBe('A36');
      expect(result.en).toBe('S235JR');
    });

    it('should convert KS SS400 to equivalents', () => {
      const result = materialGradeConverter({ standard: 'KS', grade: 'SS400' });
      expect(result.astm).toBe('A36');
    });

    it('should convert GB Q235B to equivalents', () => {
      const result = materialGradeConverter({ standard: 'GB', grade: 'Q235B' });
      expect(result.astm).toBe('A36');
    });
  });

  describe('stainless steel', () => {
    it('should convert ASTM A240 304 to equivalents', () => {
      const result = materialGradeConverter({ standard: 'ASTM', grade: 'A240 304' });
      expect(result.en).toBe('1.4301');
      expect(result.jis).toBe('SUS304');
      expect(result.gb).toBe('06Cr19Ni10');
      expect(result.ks).toBe('STS304');
      expect(result.category).toBe('stainless');
    });

    it('should convert JIS SUS316 to equivalents', () => {
      const result = materialGradeConverter({ standard: 'JIS', grade: 'SUS316' });
      expect(result.astm).toBe('A240 316');
      expect(result.en).toBe('1.4401');
    });

    it('should convert EN 1.4404 to equivalents', () => {
      const result = materialGradeConverter({ standard: 'EN', grade: '1.4404' });
      expect(result.astm).toBe('A240 316L');
      expect(result.jis).toBe('SUS316L');
    });
  });

  describe('machine structural steel', () => {
    it('should convert ASTM A29 1045 → S45C → C45E', () => {
      const result = materialGradeConverter({ standard: 'ASTM', grade: 'A29 1045' });
      expect(result.jis).toBe('S45C');
      expect(result.en).toBe('C45E');
      expect(result.gb).toBe('45');
      expect(result.ks).toBe('SM45C');
      expect(result.category).toBe('machine_structural');
    });

    it('should convert JIS SCM440 to equivalents', () => {
      const result = materialGradeConverter({ standard: 'JIS', grade: 'SCM440' });
      expect(result.astm).toBe('A29 4140');
      expect(result.en).toBe('42CrMo4');
    });
  });

  describe('tool steel', () => {
    it('should convert ASTM A681 D2 → SKD11', () => {
      const result = materialGradeConverter({ standard: 'ASTM', grade: 'A681 D2' });
      expect(result.jis).toBe('SKD11');
      expect(result.en).toBe('1.2379');
      expect(result.category).toBe('tool_steel');
    });

    it('should convert JIS SKD61 → H13', () => {
      const result = materialGradeConverter({ standard: 'JIS', grade: 'SKD61' });
      expect(result.astm).toBe('A681 H13');
    });
  });

  describe('case insensitive', () => {
    it('should handle lowercase input', () => {
      const result = materialGradeConverter({ standard: 'ASTM', grade: 'a36' });
      expect(result.en).toBe('S235JR');
    });

    it('should handle mixed case', () => {
      const result = materialGradeConverter({ standard: 'JIS', grade: 'sus304' });
      expect(result.astm).toBe('A240 304');
    });
  });

  describe('not found', () => {
    it('should return nulls for unknown grade', () => {
      const result = materialGradeConverter({ standard: 'ASTM', grade: 'UNKNOWN123' });
      expect(result.astm).toBeNull();
      expect(result.en).toBeNull();
      expect(result.category).toBe('unknown');
    });
  });
});
