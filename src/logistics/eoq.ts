import { roundTo } from '../utils.js';
import type { EoqInput, EoqResult } from './types.js';

/**
 * Calculate Economic Order Quantity (EOQ)
 *
 * EOQ is the optimal order quantity that minimizes total inventory costs,
 * balancing ordering costs and holding costs.
 *
 * Formula: EOQ = sqrt(2 × D × S / H)
 * Where:
 *   D = Annual demand (units/year)
 *   S = Order cost per order ($)
 *   H = Holding cost per unit per year ($/unit/year)
 *
 * @param input - Annual demand, order cost, and holding cost
 * @returns EOQ and related metrics
 */
export function eoq(input: EoqInput): EoqResult {
  const { annualDemand, orderCost, holdingCost } = input;

  // Input validation
  if (annualDemand <= 0 || orderCost <= 0 || holdingCost <= 0) {
    return {
      eoq: 0,
      ordersPerYear: 0,
      orderCycleDays: 0,
      annualOrderingCost: 0,
      annualHoldingCost: 0,
      totalAnnualCost: 0,
    };
  }

  // Calculate EOQ using the classic formula
  // EOQ = sqrt(2DS/H)
  const eoqValue = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);

  // Orders per year = D / EOQ
  const ordersPerYear = annualDemand / eoqValue;

  // Order cycle time in days = 365 / orders per year
  const orderCycleDays = 365 / ordersPerYear;

  // Annual ordering cost = (D / EOQ) × S
  const annualOrderingCost = ordersPerYear * orderCost;

  // Annual holding cost = (EOQ / 2) × H
  // Average inventory = EOQ / 2 (assuming constant demand and instant replenishment)
  const annualHoldingCost = (eoqValue / 2) * holdingCost;

  // Total annual cost = Annual ordering cost + Annual holding cost
  const totalAnnualCost = annualOrderingCost + annualHoldingCost;

  return {
    eoq: roundTo(eoqValue, 4),
    ordersPerYear: roundTo(ordersPerYear, 4),
    orderCycleDays: roundTo(orderCycleDays, 4),
    annualOrderingCost: roundTo(annualOrderingCost, 4),
    annualHoldingCost: roundTo(annualHoldingCost, 4),
    totalAnnualCost: roundTo(totalAnnualCost, 4),
  };
}
