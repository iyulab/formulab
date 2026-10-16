import { describe, it, expect } from 'vitest';
import { capabilityIndices } from './capability.js';

describe('capabilityIndices refusal codes', () => {
  it('codes each non-finite limit on its own', () => {
    expect(() => capabilityIndices(Infinity, 0, 5, 1))
      .toThrow(expect.objectContaining({ code: 'value_not_finite', parameter: 'usl' }));
    expect(() => capabilityIndices(10, NaN, 5, 1))
      .toThrow(expect.objectContaining({ code: 'value_not_finite', parameter: 'lsl' }));
  });
  it('codes a non-finite mean', () => {
    expect(() => capabilityIndices(10, 0, -Infinity, 1))
      .toThrow(expect.objectContaining({ code: 'value_not_finite', parameter: 'mean', got: -Infinity }));
  });
});
