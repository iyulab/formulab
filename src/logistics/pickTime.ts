import { roundTo } from '../utils.js';
import type { PickTimeInput, PickTimeResult } from './types.js';

/**
 * Calculate warehouse pick time per order
 *
 * Pick time is a key metric for warehouse productivity. It includes:
 * - Travel time: walking between pick locations
 * - Search time: locating items at the pick face
 * - Pick time: physically retrieving items
 * - Documentation time: scanning, confirming, paperwork
 *
 * Batch picking can reduce travel time by combining multiple orders.
 *
 * @param input - Pick time parameters
 * @returns Pick time breakdown and productivity metrics
 */
export function pickTime(input: PickTimeInput): PickTimeResult {
  const {
    mode,
    distance,
    speed,
    itemsPerOrder,
    searchTimePerItem,
    pickTimePerItem,
    documentationTime,
    batchSize = 1,
  } = input;

  // Handle zero/invalid inputs
  if (speed <= 0 || itemsPerOrder <= 0) {
    return {
      travelTime: 0,
      searchTime: 0,
      pickTime: 0,
      documentationTime: 0,
      totalTime: 0,
      totalTimeMinutes: 0,
      ordersPerHour: 0,
    };
  }

  // Calculate base times
  // Travel time = distance / speed, convert to seconds (speed is per minute)
  const baseTravelTime = (distance / speed) * 60;

  // Search and pick times scale with items
  const baseSearchTime = itemsPerOrder * searchTimePerItem;
  const basePickTime = itemsPerOrder * pickTimePerItem;

  let travelTime: number;
  let searchTime: number;
  let pick: number;
  let docTime: number;

  if (mode === 'batch' && batchSize > 1) {
    // Batch picking: share travel time across orders in batch
    // Assume travel time is shared but search/pick is per order
    // Documentation is per order
    travelTime = baseTravelTime / batchSize;
    searchTime = baseSearchTime; // Per order
    pick = basePickTime; // Per order
    docTime = documentationTime; // Per order
  } else {
    // Single order picking
    travelTime = baseTravelTime;
    searchTime = baseSearchTime;
    pick = basePickTime;
    docTime = documentationTime;
  }

  const totalTime = travelTime + searchTime + pick + docTime;
  const totalTimeMinutes = totalTime / 60;

  // Orders per hour calculation
  const ordersPerHour = totalTime > 0 ? 3600 / totalTime : 0;

  return {
    travelTime: roundTo(travelTime, 1),
    searchTime: roundTo(searchTime, 1),
    pickTime: roundTo(pick, 1),
    documentationTime: roundTo(docTime, 1),
    totalTime: roundTo(totalTime, 1),
    totalTimeMinutes: roundTo(totalTimeMinutes, 2),
    ordersPerHour: roundTo(ordersPerHour, 1),
  };
}
