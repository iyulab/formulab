import { roundTo, requireFinite } from '../utils.js';
import type { EoqInput, EoqResult, EoqCostCurveInput, EoqCostPoint } from './types.js';
import { inputRangeError } from '../errors.js';

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
 * @throws {RangeError} annualDemand, orderCost or holdingCost is not greater than 0
 */
export function eoq(input: EoqInput): EoqResult {
  requireFinite('eoq', input);
  const { annualDemand, orderCost, holdingCost } = input;

  // EOQ = √(2DS/H) needs all three positive: a zero demand or order cost gives no orders to
  // cycle, a zero holding cost an unbounded lot. An all-zero result would read as «order 0».
  if (!(annualDemand > 0)) {
    throw inputRangeError('annualDemand must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'annualDemand', exclusive_min: 0, got: annualDemand,
    });
  }
  if (!(orderCost > 0)) {
    throw inputRangeError('orderCost must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'orderCost', exclusive_min: 0, got: orderCost,
    });
  }
  if (!(holdingCost > 0)) {
    throw inputRangeError('holdingCost must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'holdingCost', exclusive_min: 0, got: holdingCost,
    });
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

/**
 * The annual cost of ordering Q units at a time, across a range of Q — the U-shaped curve whose
 * minimum is the EOQ: ordering cost (D/Q)·S falls, holding cost (Q/2)·H rises.
 *
 * @formula ordering = (D / Q) × S; holding = (Q / 2) × H; total = ordering + holding
 *
 * @param input - `eoq()`'s input, plus the Q range (default 0.25× to 2.5× the EOQ) and point count
 *   (default 25)
 * @returns Evenly spaced points from `minQuantity` to `maxQuantity`
 * @throws {RangeError} an `eoq()` input is invalid, minQuantity is not greater than 0, maxQuantity is
 *   not greater than minQuantity, or points is not a whole number of at least 2
 */
export function eoqCostCurve(input: EoqCostCurveInput): EoqCostPoint[] {
  requireFinite('eoqCostCurve', input);
  const { annualDemand, orderCost, holdingCost, points = 25 } = input;
  const optimum = eoq({ annualDemand, orderCost, holdingCost }).eoq;
  const minQuantity = input.minQuantity ?? optimum * 0.25;
  const maxQuantity = input.maxQuantity ?? optimum * 2.5;
  if (!(minQuantity > 0)) {
    throw inputRangeError('minQuantity must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'minQuantity', exclusive_min: 0, got: minQuantity,
    });
  }
  if (!(maxQuantity > minQuantity)) {
    throw inputRangeError('maxQuantity must be greater than minQuantity', {
      code: 'parameter_out_of_range', parameter: 'maxQuantity', exclusive_min: minQuantity, got: maxQuantity,
    });
  }
  if (!Number.isInteger(points) || points < 2) throw new RangeError('points must be a whole number of at least 2');

  const out: EoqCostPoint[] = [];
  for (let i = 0; i < points; i++) {
    const q = minQuantity + ((maxQuantity - minQuantity) * i) / (points - 1);
    const orderingCost = (annualDemand / q) * orderCost;
    const holdingCostPerYear = (q / 2) * holdingCost;
    out.push({
      orderQuantity: roundTo(q, 4),
      orderingCost: roundTo(orderingCost, 4),
      holdingCost: roundTo(holdingCostPerYear, 4),
      totalCost: roundTo(orderingCost + holdingCostPerYear, 4),
    });
  }
  return out;
}
