import { roundTo } from '../utils.js';
import type { RoiInput, RoiResult } from './types.js';

export function roi(input: RoiInput): RoiResult | null {
  const { investment, annualReturn, years } = input;
  if (investment <= 0 || annualReturn <= 0 || years <= 0) return null;

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
