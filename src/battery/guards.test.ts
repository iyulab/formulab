import { describe, it, expect } from 'vitest';
import { isCRateInput } from './guards.js';

describe('isCRateInput', () => {
  it('accepts valid currentToRate input', () => {
    expect(isCRateInput({ mode: 'currentToRate', capacityAh: 100, currentA: 50 })).toBe(true);
  });

  it('accepts valid rateToCurrent input', () => {
    expect(isCRateInput({ mode: 'rateToCurrent', capacityAh: 100, cRate: 0.5 })).toBe(true);
  });

  it('rejects null', () => {
    expect(isCRateInput(null)).toBe(false);
  });

  it('rejects primitive values', () => {
    expect(isCRateInput('string')).toBe(false);
    expect(isCRateInput(42)).toBe(false);
    expect(isCRateInput(undefined)).toBe(false);
  });

  it('rejects invalid mode', () => {
    expect(isCRateInput({ mode: 'invalid', capacityAh: 100, currentA: 50 })).toBe(false);
  });

  it('rejects missing mode', () => {
    expect(isCRateInput({ capacityAh: 100, currentA: 50 })).toBe(false);
  });

  it('rejects missing capacityAh', () => {
    expect(isCRateInput({ mode: 'currentToRate', currentA: 50 })).toBe(false);
  });

  it('rejects non-number capacityAh', () => {
    expect(isCRateInput({ mode: 'currentToRate', capacityAh: '100', currentA: 50 })).toBe(false);
  });

  it('rejects currentToRate missing currentA', () => {
    expect(isCRateInput({ mode: 'currentToRate', capacityAh: 100 })).toBe(false);
  });

  it('rejects rateToCurrent missing cRate', () => {
    expect(isCRateInput({ mode: 'rateToCurrent', capacityAh: 100 })).toBe(false);
  });

  it('accepts zero values', () => {
    expect(isCRateInput({ mode: 'currentToRate', capacityAh: 0, currentA: 0 })).toBe(true);
  });

  it('rejects empty object', () => {
    expect(isCRateInput({})).toBe(false);
  });
});
