import { describe, it, expect } from 'vitest';
import { momentOfInertia } from './momentOfInertia.js';

describe('momentOfInertia', () => {
  describe('rectangle', () => {
    it('should calculate for 100×200mm rectangle', () => {
      const result = momentOfInertia({ shape: 'rectangle', width: 100, height: 200 });
      expect(result.area).toBe(20000);
      // Ix = 100*200^3/12 = 66,666,667
      expect(result.Ix).toBeCloseTo(66666666.67, 0);
      // Iy = 200*100^3/12 = 16,666,667
      expect(result.Iy).toBeCloseTo(16666666.67, 0);
      // Sx = 100*200^2/6 = 666,667
      expect(result.Sx).toBeCloseTo(666666.67, 0);
      // rx = 200/sqrt(12) = 57.74
      expect(result.rx).toBeCloseTo(57.74, 1);
      expect(result.centroidY).toBe(100);
    });
  });

  describe('circle', () => {
    it('should calculate for 200mm diameter circle', () => {
      const result = momentOfInertia({ shape: 'circle', diameter: 200 });
      // A = π*200²/4 ≈ 31,415.93
      expect(result.area).toBeCloseTo(31415.93, 0);
      // I = π*200⁴/64 ≈ 78,539,816
      expect(result.Ix).toBeCloseTo(78539816.34, -1);
      expect(result.Iy).toBe(result.Ix); // symmetric
      // S = π*200³/32 ≈ 785,398
      expect(result.Sx).toBeCloseTo(785398.16, -1);
      // r = 200/4 = 50
      expect(result.rx).toBe(50);
    });
  });

  describe('hollowRectangle', () => {
    it('should calculate for box section', () => {
      // Outer: 200×300, Inner: 180×280
      const result = momentOfInertia({
        shape: 'hollowRectangle',
        outerWidth: 200, outerHeight: 300,
        innerWidth: 180, innerHeight: 280,
      });
      // A = 200*300 - 180*280 = 60000 - 50400 = 9600
      expect(result.area).toBe(9600);
      // Ix = (200*300³ - 180*280³)/12
      expect(result.Ix).toBeCloseTo((200 * 300 ** 3 - 180 * 280 ** 3) / 12, 0);
      expect(result.centroidY).toBe(150);
    });

    it('should throw if inner >= outer', () => {
      expect(() => momentOfInertia({
        shape: 'hollowRectangle',
        outerWidth: 100, outerHeight: 100,
        innerWidth: 100, innerHeight: 80,
      })).toThrow();
    });
  });

  describe('hollowCircle', () => {
    it('should calculate for pipe section', () => {
      // D=100mm, d=80mm
      const result = momentOfInertia({
        shape: 'hollowCircle',
        outerDiameter: 100, innerDiameter: 80,
      });
      // A = π*(100²-80²)/4 = π*3600/4 ≈ 2827.43
      expect(result.area).toBeCloseTo(2827.43, 0);
      // I = π*(100⁴-80⁴)/64
      const expectedI = Math.PI * (100 ** 4 - 80 ** 4) / 64;
      expect(result.Ix).toBeCloseTo(expectedI, -1);
      // r = sqrt((D²+d²)/16) = sqrt((10000+6400)/16) = sqrt(1025) ≈ 32.02
      expect(result.rx).toBeCloseTo(32.02, 1);
    });

    it('should throw if inner >= outer', () => {
      expect(() => momentOfInertia({
        shape: 'hollowCircle', outerDiameter: 80, innerDiameter: 100,
      })).toThrow();
    });
  });

  describe('iBeam', () => {
    it('should calculate for W200×100×5.5×8', () => {
      // B=100, H=200, tw=5.5, tf=8
      const result = momentOfInertia({
        shape: 'iBeam',
        flangeWidth: 100, totalHeight: 200,
        webThickness: 5.5, flangeThickness: 8,
      });
      // hw = 200 - 16 = 184
      // A = 2*100*8 + 5.5*184 = 1600 + 1012 = 2612
      expect(result.area).toBe(2612);
      // Ix = (100*200³ - 94.5*184³) / 12
      const expectedIx = (100 * 200 ** 3 - 94.5 * 184 ** 3) / 12;
      expect(result.Ix).toBeCloseTo(expectedIx, 0);
      // Symmetric: centroid at H/2
      expect(result.centroidY).toBe(100);
    });

    it('should throw if 2*tf >= H', () => {
      expect(() => momentOfInertia({
        shape: 'iBeam', flangeWidth: 100, totalHeight: 20,
        webThickness: 5, flangeThickness: 12,
      })).toThrow();
    });
  });

  describe('tSection', () => {
    it('should calculate T-section properties', () => {
      // bf=100, tf=10, tw=8, hw=90
      const result = momentOfInertia({
        shape: 'tSection',
        flangeWidth: 100, flangeThickness: 10,
        webThickness: 8, webHeight: 90,
      });
      // Total H = 100mm
      // A_flange = 100*10 = 1000, A_web = 8*90 = 720
      // A = 1720
      expect(result.area).toBe(1720);
      // Centroid from bottom: y_bar = (720*45 + 1000*95) / 1720
      // = (32400 + 95000) / 1720 = 127400 / 1720 ≈ 74.07
      expect(result.centroidY).toBeCloseTo(74.07, 1);
      // Ix should be positive
      expect(result.Ix).toBeGreaterThan(0);
      expect(result.Sx).toBeGreaterThan(0);
    });
  });

  describe('cChannel', () => {
    it('should calculate C-channel properties', () => {
      // bf=50, H=200, tw=6, tf=10
      const result = momentOfInertia({
        shape: 'cChannel',
        flangeWidth: 50, totalHeight: 200,
        webThickness: 6, flangeThickness: 10,
      });
      // hw = 200 - 20 = 180
      // A = 2*50*10 + 180*6 = 1000 + 1080 = 2080
      expect(result.area).toBe(2080);
      // Centroid Y = H/2 = 100 (symmetric about x-axis)
      expect(result.centroidY).toBe(100);
      expect(result.Ix).toBeGreaterThan(0);
      expect(result.Iy).toBeGreaterThan(0);
      // Ix should be much larger than Iy for C-channel
      expect(result.Ix).toBeGreaterThan(result.Iy);
    });
  });

  describe('validation', () => {
    it('should throw on negative dimensions', () => {
      expect(() => momentOfInertia({ shape: 'rectangle', width: -100, height: 200 })).toThrow();
    });

    it('should throw on zero diameter', () => {
      expect(() => momentOfInertia({ shape: 'circle', diameter: 0 })).toThrow();
    });
  });
});
