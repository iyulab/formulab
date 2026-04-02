import type { NelsonRulesInput, NelsonRulesResult, NelsonViolation } from './types.js';

/**
 * Nelson Rules for SPC Control Chart Analysis
 *
 * Eight rules to detect non-random patterns in control chart data,
 * indicating special cause variation.
 *
 * @reference Nelson, L.S. (1984). "The Shewhart Control Chart — Tests for Special Causes".
 *            Journal of Quality Technology, 16(4), 237-239.
 * @reference Western Electric (1956). "Statistical Quality Control Handbook".
 *
 * @throws {RangeError} Values array must have at least 1 element
 * @throws {RangeError} Sigma must be a positive number
 */
export function nelsonRules(input: NelsonRulesInput): NelsonRulesResult {
  const { values, centerLine, sigma, rules = [1, 2, 3, 4, 5, 6, 7, 8] } = input;

  if (!Array.isArray(values) || values.length < 1) {
    throw new RangeError('Values array must have at least 1 element');
  }
  if (!Number.isFinite(sigma) || sigma <= 0) {
    throw new RangeError('Sigma must be a positive number');
  }
  if (!Number.isFinite(centerLine)) {
    throw new RangeError('Center line must be a finite number');
  }

  const violations: NelsonViolation[] = [];

  const ruleCheckers: Record<number, () => NelsonViolation | null> = {
    1: () => checkRule1(values, centerLine, sigma),
    2: () => checkRule2(values, centerLine),
    3: () => checkRule3(values),
    4: () => checkRule4(values),
    5: () => checkRule5(values, centerLine, sigma),
    6: () => checkRule6(values, centerLine, sigma),
    7: () => checkRule7(values, centerLine, sigma),
    8: () => checkRule8(values, centerLine, sigma),
  };

  for (const rule of rules) {
    if (rule >= 1 && rule <= 8) {
      const result = ruleCheckers[rule]();
      if (result) violations.push(result);
    }
  }

  return {
    violations,
    hasViolation: violations.length > 0,
  };
}

const RULE_DESCRIPTIONS: Record<number, string> = {
  1: 'One point beyond 3σ from center line',
  2: 'Nine consecutive points on same side of center line',
  3: 'Six consecutive points steadily increasing or decreasing',
  4: 'Fourteen consecutive points alternating up and down',
  5: 'Two of three consecutive points beyond 2σ (same side)',
  6: 'Four of five consecutive points beyond 1σ (same side)',
  7: 'Fifteen consecutive points within ±1σ (stratification)',
  8: 'Eight consecutive points beyond ±1σ on both sides (mixture)',
};

// Rule 1: One point > 3σ from CL
function checkRule1(values: number[], cl: number, sigma: number): NelsonViolation | null {
  const indices: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (Math.abs(values[i] - cl) > 3 * sigma) {
      indices.push(i);
    }
  }
  return indices.length > 0 ? { rule: 1, description: RULE_DESCRIPTIONS[1], indices } : null;
}

// Rule 2: Nine consecutive points on same side of CL
function checkRule2(values: number[], cl: number): NelsonViolation | null {
  const indices: number[] = [];
  const n = values.length;
  if (n < 9) return null;

  for (let i = 0; i <= n - 9; i++) {
    const above = values.slice(i, i + 9).every(v => v > cl);
    const below = values.slice(i, i + 9).every(v => v < cl);
    if (above || below) {
      for (let j = i; j < i + 9; j++) {
        if (!indices.includes(j)) indices.push(j);
      }
    }
  }
  return indices.length > 0 ? { rule: 2, description: RULE_DESCRIPTIONS[2], indices } : null;
}

// Rule 3: Six consecutive points steadily increasing or decreasing
function checkRule3(values: number[]): NelsonViolation | null {
  const indices: number[] = [];
  const n = values.length;
  if (n < 6) return null;

  for (let i = 0; i <= n - 6; i++) {
    let increasing = true;
    let decreasing = true;
    for (let j = i; j < i + 5; j++) {
      if (values[j + 1] <= values[j]) increasing = false;
      if (values[j + 1] >= values[j]) decreasing = false;
    }
    if (increasing || decreasing) {
      for (let j = i; j < i + 6; j++) {
        if (!indices.includes(j)) indices.push(j);
      }
    }
  }
  return indices.length > 0 ? { rule: 3, description: RULE_DESCRIPTIONS[3], indices } : null;
}

// Rule 4: Fourteen consecutive points alternating up and down
function checkRule4(values: number[]): NelsonViolation | null {
  const indices: number[] = [];
  const n = values.length;
  if (n < 14) return null;

  for (let i = 0; i <= n - 14; i++) {
    let alternating = true;
    for (let j = i; j < i + 13; j++) {
      const dir1 = values[j + 1] - values[j];
      const dir2 = j + 2 < values.length ? values[j + 2] - values[j + 1] : 0;
      if (j < i + 12 && dir1 * dir2 >= 0) {
        alternating = false;
        break;
      }
    }
    if (alternating) {
      for (let j = i; j < i + 14; j++) {
        if (!indices.includes(j)) indices.push(j);
      }
    }
  }
  return indices.length > 0 ? { rule: 4, description: RULE_DESCRIPTIONS[4], indices } : null;
}

// Rule 5: Two of three consecutive points > 2σ from CL (same side)
function checkRule5(values: number[], cl: number, sigma: number): NelsonViolation | null {
  const indices: number[] = [];
  const n = values.length;
  if (n < 3) return null;

  for (let i = 0; i <= n - 3; i++) {
    const window = values.slice(i, i + 3);
    const aboveCount = window.filter(v => v > cl + 2 * sigma).length;
    const belowCount = window.filter(v => v < cl - 2 * sigma).length;
    if (aboveCount >= 2 || belowCount >= 2) {
      for (let j = i; j < i + 3; j++) {
        if (!indices.includes(j)) indices.push(j);
      }
    }
  }
  return indices.length > 0 ? { rule: 5, description: RULE_DESCRIPTIONS[5], indices } : null;
}

// Rule 6: Four of five consecutive points > 1σ from CL (same side)
function checkRule6(values: number[], cl: number, sigma: number): NelsonViolation | null {
  const indices: number[] = [];
  const n = values.length;
  if (n < 5) return null;

  for (let i = 0; i <= n - 5; i++) {
    const window = values.slice(i, i + 5);
    const aboveCount = window.filter(v => v > cl + sigma).length;
    const belowCount = window.filter(v => v < cl - sigma).length;
    if (aboveCount >= 4 || belowCount >= 4) {
      for (let j = i; j < i + 5; j++) {
        if (!indices.includes(j)) indices.push(j);
      }
    }
  }
  return indices.length > 0 ? { rule: 6, description: RULE_DESCRIPTIONS[6], indices } : null;
}

// Rule 7: Fifteen consecutive points within ±1σ (stratification)
function checkRule7(values: number[], cl: number, sigma: number): NelsonViolation | null {
  const indices: number[] = [];
  const n = values.length;
  if (n < 15) return null;

  for (let i = 0; i <= n - 15; i++) {
    const allWithin = values.slice(i, i + 15).every(v =>
      Math.abs(v - cl) < sigma
    );
    if (allWithin) {
      for (let j = i; j < i + 15; j++) {
        if (!indices.includes(j)) indices.push(j);
      }
    }
  }
  return indices.length > 0 ? { rule: 7, description: RULE_DESCRIPTIONS[7], indices } : null;
}

// Rule 8: Eight consecutive points beyond ±1σ on both sides (mixture)
function checkRule8(values: number[], cl: number, sigma: number): NelsonViolation | null {
  const indices: number[] = [];
  const n = values.length;
  if (n < 8) return null;

  for (let i = 0; i <= n - 8; i++) {
    const window = values.slice(i, i + 8);
    const allBeyond = window.every(v => Math.abs(v - cl) > sigma);
    if (!allBeyond) continue;
    // Must have points on both sides
    const hasAbove = window.some(v => v > cl + sigma);
    const hasBelow = window.some(v => v < cl - sigma);
    if (hasAbove && hasBelow) {
      for (let j = i; j < i + 8; j++) {
        if (!indices.includes(j)) indices.push(j);
      }
    }
  }
  return indices.length > 0 ? { rule: 8, description: RULE_DESCRIPTIONS[8], indices } : null;
}
