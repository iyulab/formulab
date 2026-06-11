import { roundTo } from '../utils.js';
import type { RoiInput, RoiResult } from './types.js';

/**
 * Return on investment (ROI) calculation
 *
 * @param input - ROI input with investment, annual return and years
 * @returns Total/annualized ROI, payback period, total return and net profit
 * @throws RangeError if investment, annualReturn or years is not > 0
 */
export function roi(input: RoiInput): RoiResult {
  const { investment, annualReturn, years } = input;
  if (investment <= 0) {
    throw new RangeError(`investment must be > 0, got ${investment}`);
  }
  if (annualReturn <= 0) {
    throw new RangeError(`annualReturn must be > 0, got ${annualReturn}`);
  }
  if (years <= 0) {
    throw new RangeError(`years must be > 0, got ${years}`);
  }

  const totalReturn = annualReturn * years;
  const netProfit = totalReturn - investment;
  const roiPercent = (netProfit / investment) * 100;
  const annualRoi = ((1 + netProfit / investment) ** (1 / years) - 1) * 100;
  const paybackPeriod = investment / annualReturn;

  return {
    roi: roundTo(roiPercent, 6),
    annualRoi: roundTo(annualRoi, 6),
    paybackPeriod: roundTo(paybackPeriod, 6),
    totalReturn: roundTo(totalReturn, 6),
    netProfit: roundTo(netProfit, 6),
  };
}
