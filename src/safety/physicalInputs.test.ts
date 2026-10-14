import { describe, it, expect } from 'vitest';
import { nioshLifting } from './nioshLifting.js';
import { fallClearance } from './fallClearance.js';
import { lel } from './lel.js';

// A negative physical quantity used to come back as a sign-flipped "result"; each is refused now.
describe('safety physical-input domains', () => {
  describe('nioshLifting', () => {
    it('refuses a negative or NaN distance, travel or frequency', () => {
      expect(() => nioshLifting({ horizontalDistance: -25, verticalDistance: 75, verticalTravel: 25, asymmetryAngle: 0, frequency: 0.2, duration: 'short', coupling: 'good', loadWeight: 23 })).toThrow(RangeError);
      expect(() => nioshLifting({ horizontalDistance: 25, verticalDistance: -75, verticalTravel: 25, asymmetryAngle: 0, frequency: 0.2, duration: 'short', coupling: 'good', loadWeight: 23 })).toThrow(RangeError);
      expect(() => nioshLifting({ horizontalDistance: 25, verticalDistance: 75, verticalTravel: -25, asymmetryAngle: 0, frequency: 0.2, duration: 'short', coupling: 'good', loadWeight: 23 })).toThrow(RangeError);
      expect(() => nioshLifting({ horizontalDistance: 25, verticalDistance: 75, verticalTravel: 25, asymmetryAngle: 0, frequency: -1, duration: 'short', coupling: 'good', loadWeight: 23 })).toThrow(RangeError);
      expect(() => nioshLifting({ horizontalDistance: NaN, verticalDistance: 75, verticalTravel: 25, asymmetryAngle: 0, frequency: 0.2, duration: 'short', coupling: 'good', loadWeight: 23 })).toThrow(RangeError);
    });

    it('accepts zero frequency under ideal geometry: RWL = LC = 23 kg', () => {
      const result = nioshLifting({ horizontalDistance: 25, verticalDistance: 75, verticalTravel: 25, asymmetryAngle: 0, frequency: 0, duration: 'short', coupling: 'good', loadWeight: 23 });
      expect(result.rwl).toBe(23);
      expect(result.liftingIndex).toBe(1);
    });
  });

  describe('fallClearance', () => {
    it('refuses a negative length or safety factor', () => {
      expect(() => fallClearance({ lanyardLength: -1.8, decelerationDistance: 1.07, harnessStretch: 0.3, dRingHeight: 1.8, anchorAboveFeet: 0.15, safetyFactor: 0.6 })).toThrow(RangeError);
      expect(() => fallClearance({ lanyardLength: 1.8, decelerationDistance: 1.07, harnessStretch: 0.3, dRingHeight: 1.8, anchorAboveFeet: 0.15, safetyFactor: -0.6 })).toThrow(RangeError);
      expect(() => fallClearance({ lanyardLength: 1.8, decelerationDistance: 1.07, harnessStretch: 0.3, dRingHeight: 1.8, anchorAboveFeet: 0.15, safetyFactor: 0.6, workingHeight: -10 })).toThrow(RangeError);
      expect(() => fallClearance({ lanyardLength: 1.8, decelerationDistance: NaN, harnessStretch: 0.3, dRingHeight: 1.8, anchorAboveFeet: 0.15, safetyFactor: 0.6 })).toThrow(RangeError);
    });

    it('accepts a zero safety factor: required clearance = 1.8 + 1.07 + 0.3 + 1.8 − 0.15 = 4.82 m', () => {
      expect(fallClearance({ lanyardLength: 1.8, decelerationDistance: 1.07, harnessStretch: 0.3, dRingHeight: 1.8, anchorAboveFeet: 0.15, safetyFactor: 0 }).requiredClearance).toBe(4.82);
    });
  });

  describe('lel', () => {
    it('refuses a negative or NaN gas concentration', () => {
      expect(() => lel({ gases: [{ name: 'Methane', concentration: -1, lel: 5 }] })).toThrow(RangeError);
      expect(() => lel({ gases: [{ name: 'Methane', concentration: NaN, lel: 5 }] })).toThrow(RangeError);
    });

    it('accepts a zero component: 1% methane alone is 20% of its 5% LEL', () => {
      const result = lel({ gases: [{ name: 'Methane', concentration: 1, lel: 5 }, { name: 'Propane', concentration: 0, lel: 2.1 }] });
      expect(result.mixtureLel).toBe(5);
      expect(result.percentOfLel).toBe(20);
    });
  });
});
