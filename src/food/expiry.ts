import { roundTo } from '../utils.js';
import type { ExpiryInput, ExpiryResult } from './types.js';

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  const dateA = new Date(a + 'T00:00:00Z');
  const dateB = new Date(b + 'T00:00:00Z');
  return Math.round((dateB.getTime() - dateA.getTime()) / msPerDay);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate product expiry date and remaining shelf life
 *
 * Supports two modes:
 * - calculateExpiry: Given production date + shelf life days, calculate expiry date
 * - calculateRemaining: Given production date + expiry date, calculate remaining days
 *
 * @param input - Expiry input parameters
 * @returns Expiry result with dates and remaining time
 */
export function expiry(input: ExpiryInput): ExpiryResult {
  const { mode, productionDate, shelfLifeDays, expiryDate, today } = input;

  if (mode === 'calculateExpiry') {
    // Given production date + shelf life → calculate expiry
    const calculatedExpiry = addDays(productionDate, shelfLifeDays);
    const remaining = daysBetween(today, calculatedExpiry);
    const isExpired = remaining < 0;
    const percentUsed = shelfLifeDays > 0
      ? roundTo(((shelfLifeDays - remaining) / shelfLifeDays) * 100, 1)
      : 100;

    return {
      expiryDate: calculatedExpiry,
      remainingDays: remaining,
      shelfLifeDays,
      isExpired,
      percentUsed: Math.min(100, Math.max(0, percentUsed)),
    };
  } else {
    // Given production date + expiry date → calculate remaining
    const totalShelfLife = daysBetween(productionDate, expiryDate);
    const remaining = daysBetween(today, expiryDate);
    const isExpired = remaining < 0;
    const percentUsed = totalShelfLife > 0
      ? roundTo(((totalShelfLife - remaining) / totalShelfLife) * 100, 1)
      : 100;

    return {
      expiryDate,
      remainingDays: remaining,
      shelfLifeDays: totalShelfLife,
      isExpired,
      percentUsed: Math.min(100, Math.max(0, percentUsed)),
    };
  }
}
