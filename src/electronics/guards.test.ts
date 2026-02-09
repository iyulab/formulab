import { describe, it, expect } from 'vitest';
import { isOhmsLawInput } from './guards.js';

describe('isOhmsLawInput', () => {
  it('accepts solveFor=voltage', () => {
    expect(isOhmsLawInput({ solveFor: 'voltage', current: 2, resistance: 5 })).toBe(true);
  });

  it('accepts solveFor=current', () => {
    expect(isOhmsLawInput({ solveFor: 'current', voltage: 12, resistance: 5 })).toBe(true);
  });

  it('accepts solveFor=resistance', () => {
    expect(isOhmsLawInput({ solveFor: 'resistance', voltage: 12, current: 2 })).toBe(true);
  });

  it('accepts solveFor=power', () => {
    expect(isOhmsLawInput({ solveFor: 'power', voltage: 12, current: 2 })).toBe(true);
  });

  it('rejects null', () => {
    expect(isOhmsLawInput(null)).toBe(false);
  });

  it('rejects invalid solveFor', () => {
    expect(isOhmsLawInput({ solveFor: 'impedance', voltage: 12 })).toBe(false);
  });

  it('rejects voltage missing current', () => {
    expect(isOhmsLawInput({ solveFor: 'voltage', resistance: 5 })).toBe(false);
  });

  it('rejects voltage missing resistance', () => {
    expect(isOhmsLawInput({ solveFor: 'voltage', current: 2 })).toBe(false);
  });

  it('rejects non-number field', () => {
    expect(isOhmsLawInput({ solveFor: 'voltage', current: '2', resistance: 5 })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(isOhmsLawInput({})).toBe(false);
  });

  it('accepts zero values', () => {
    expect(isOhmsLawInput({ solveFor: 'power', voltage: 0, current: 0 })).toBe(true);
  });
});
