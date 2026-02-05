import { describe, it, expect } from 'vitest';
import { haccp, getCategories } from './haccp.js';

describe('haccp', () => {
  describe('getCategories', () => {
    it('should return all 6 HACCP categories', () => {
      const categories = getCategories();

      expect(categories).toHaveLength(6);
      expect(categories).toContain('receiving');
      expect(categories).toContain('storage');
      expect(categories).toContain('preparation');
      expect(categories).toContain('cooking');
      expect(categories).toContain('cooling');
      expect(categories).toContain('serving');
    });

    it('should return categories in process order', () => {
      const categories = getCategories();

      expect(categories[0]).toBe('receiving');
      expect(categories[5]).toBe('serving');
    });
  });

  describe('receiving category', () => {
    it('should return receiving checklist items', () => {
      const result = haccp({ category: 'receiving' });

      expect(result).not.toBeNull();
      expect(result!.category).toBe('receiving');
      expect(result!.items.length).toBeGreaterThan(0);
    });

    it('should have cold food temperature check as critical', () => {
      const result = haccp({ category: 'receiving' });

      const coldFoodCheck = result!.items.find(i => i.id === 'RCV-01');
      expect(coldFoodCheck).toBeDefined();
      expect(coldFoodCheck!.critical).toBe(true);
      expect(coldFoodCheck!.standard).toContain('5°C');
    });

    it('should have expiry date check as critical', () => {
      const result = haccp({ category: 'receiving' });

      const expiryCheck = result!.items.find(i => i.id === 'RCV-05');
      expect(expiryCheck).toBeDefined();
      expect(expiryCheck!.critical).toBe(true);
    });
  });

  describe('storage category', () => {
    it('should return storage checklist items', () => {
      const result = haccp({ category: 'storage' });

      expect(result).not.toBeNull();
      expect(result!.category).toBe('storage');
      expect(result!.items.length).toBe(5);
    });

    it('should have temperature monitoring as critical', () => {
      const result = haccp({ category: 'storage' });

      const tempCheck = result!.items.find(i => i.id === 'STR-02');
      expect(tempCheck!.critical).toBe(true);
    });

    it('should have cross-contamination as critical', () => {
      const result = haccp({ category: 'storage' });

      const crossCheck = result!.items.find(i => i.id === 'STR-03');
      expect(crossCheck!.critical).toBe(true);
    });
  });

  describe('preparation category', () => {
    it('should return preparation checklist items', () => {
      const result = haccp({ category: 'preparation' });

      expect(result).not.toBeNull();
      expect(result!.items.length).toBe(4);
    });

    it('should have hand washing as critical', () => {
      const result = haccp({ category: 'preparation' });

      const handWash = result!.items.find(i => i.id === 'PRP-01');
      expect(handWash!.critical).toBe(true);
      expect(handWash!.standard).toContain('20 sec');
    });
  });

  describe('cooking category', () => {
    it('should return cooking checklist items', () => {
      const result = haccp({ category: 'cooking' });

      expect(result).not.toBeNull();
      expect(result!.items.length).toBe(5);
    });

    it('should have correct poultry temperature', () => {
      const result = haccp({ category: 'cooking' });

      const poultryCheck = result!.items.find(i => i.id === 'CK-01');
      expect(poultryCheck!.standard).toContain('74°C');
      expect(poultryCheck!.critical).toBe(true);
    });

    it('should have correct ground meat temperature', () => {
      const result = haccp({ category: 'cooking' });

      const meatCheck = result!.items.find(i => i.id === 'CK-02');
      expect(meatCheck!.standard).toContain('71°C');
    });

    it('should have correct fish temperature', () => {
      const result = haccp({ category: 'cooking' });

      const fishCheck = result!.items.find(i => i.id === 'CK-03');
      expect(fishCheck!.standard).toContain('63°C');
    });
  });

  describe('cooling category', () => {
    it('should return cooling checklist items', () => {
      const result = haccp({ category: 'cooling' });

      expect(result).not.toBeNull();
      expect(result!.items.length).toBe(4);
    });

    it('should have 2-stage cooling requirements', () => {
      const result = haccp({ category: 'cooling' });

      const stage1 = result!.items.find(i => i.id === 'CL-01');
      const stage2 = result!.items.find(i => i.id === 'CL-02');

      expect(stage1!.standard).toContain('2 hours');
      expect(stage2!.standard).toContain('4 hours');
    });
  });

  describe('serving category', () => {
    it('should return serving checklist items', () => {
      const result = haccp({ category: 'serving' });

      expect(result).not.toBeNull();
      expect(result!.items.length).toBe(5);
    });

    it('should have correct hot holding temperature', () => {
      const result = haccp({ category: 'serving' });

      const hotHold = result!.items.find(i => i.id === 'SRV-01');
      expect(hotHold!.standard).toContain('60°C');
    });

    it('should have 4-hour rule as critical', () => {
      const result = haccp({ category: 'serving' });

      const fourHour = result!.items.find(i => i.id === 'SRV-03');
      expect(fourHour!.critical).toBe(true);
      expect(fourHour!.standard).toContain('4 hours');
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid category', () => {
      // @ts-expect-error testing invalid input
      const result = haccp({ category: 'invalid' });

      expect(result).toBeNull();
    });
  });
});
