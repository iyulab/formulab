import { roundTo } from '../utils.js';
import type { NpvInput, NpvResult } from './types.js';

/**
 * Calculate net present value (NPV), IRR, and profitability index
 *
 * @param input - Initial investment, cash flow series, and discount rate
 * @returns NPV result (irr is null when the IRR iteration does not converge)
 * @throws RangeError if initialInvestment is negative, cashFlows is empty,
 *   or discountRate is outside [0, 1)
 */
export function npv(input: NpvInput): NpvResult {
  const { initialInvestment, cashFlows, discountRate } = input;
  if (initialInvestment < 0) {
    throw new RangeError(`initialInvestment must be >= 0, got ${initialInvestment}`);
  }
  if (!cashFlows || cashFlows.length === 0) {
    throw new RangeError('cashFlows must contain at least one value');
  }
  if (discountRate < 0 || discountRate >= 1) {
    throw new RangeError(`discountRate must be in [0, 1), got ${discountRate}`);
  }

  const pvCashFlows = cashFlows.reduce((acc, cf, i) => {
    return acc + cf / (1 + discountRate) ** (i + 1);
  }, 0);

  const npvValue = pvCashFlows - initialInvestment;

  const pvTotal = pvCashFlows;
  const profitabilityIndex = initialInvestment === 0 ? 0 : pvTotal / initialInvestment;

  const irr = calculateIrr(initialInvestment, cashFlows);

  return {
    npv: roundTo(npvValue, 6),
    irr: irr !== null ? roundTo(irr, 6) : null,
    profitabilityIndex: roundTo(profitabilityIndex, 6),
  };
}

function calculateIrr(investment: number, cashFlows: number[]): number | null {
  // Newton-Raphson method to find IRR
  let rate = 0.1; // initial guess
  const maxIter = 100;
  const tolerance = 1e-8;

  for (let iter = 0; iter < maxIter; iter++) {
    let npvVal = -investment;
    let derivative = 0;

    for (let i = 0; i < cashFlows.length; i++) {
      const t = i + 1;
      const discounted = cashFlows[i] / (1 + rate) ** t;
      npvVal += discounted;
      derivative -= t * cashFlows[i] / (1 + rate) ** (t + 1);
    }

    if (Math.abs(npvVal) < tolerance) return rate;
    if (derivative === 0) return null;

    rate = rate - npvVal / derivative;

    if (rate <= -1) return null; // diverged
  }

  return null; // did not converge
}
