import { roundTo, requireFinite } from '../utils.js';
import type { CuttingStockInput, CuttingStockResult, CuttingPattern } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate optimal cutting layout for 1D cutting stock problem.
 *
 * Uses First Fit Decreasing (FFD) or Best Fit Decreasing (BFD) algorithm.
 *
 * @throws RangeError if stockLength is not positive, kerf is negative, pieces is empty, a piece
 *   length is not positive, a piece quantity is not a whole number greater than 0, or any piece
 *   length exceeds stockLength
 */
export function cuttingStock(input: CuttingStockInput): CuttingStockResult {
  requireFinite('cuttingStock', input);
  const { stockLength, kerf, pieces, algorithm } = input;
  if (!(stockLength > 0)) {
    throw inputRangeError('stockLength must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'stockLength', exclusive_min: 0, got: stockLength,
    });
  }
  if (!(kerf >= 0)) {
    throw inputRangeError('kerf must not be negative', {
      code: 'parameter_out_of_range', parameter: 'kerf', min: 0, got: kerf,
    });
  }
  if (pieces.length === 0) {
    throw inputRangeError('pieces must not be empty', { code: 'empty_input', parameter: 'pieces' });
  }
  pieces.forEach((p, i) => {
    if (!(p.length > 0)) {
      throw inputRangeError(`pieces[${i}].length must be greater than 0`, { code: 'empty_input', parameter: 'p' });
    }
    // A count of pieces: 0 or a negative one was silently dropped from the plan, 2.5 cut as 3.
    if (!(Number.isInteger(p.quantity) && p.quantity > 0)) {
      throw new RangeError(`pieces[${i}].quantity must be a whole number greater than 0`);
    }
  });

  // Expand quantities
  const expanded: { length: number; label: string }[] = [];
  for (const p of pieces) {
    for (let i = 0; i < p.quantity; i++) {
      expanded.push({ length: p.length, label: p.label ?? `${p.length}` });
    }
  }

  // Check if any piece exceeds stock length
  if (expanded.some(p => p.length > stockLength)) {
    throw new RangeError('piece length must not exceed stockLength');
  }

  // Sort descending by length
  expanded.sort((a, b) => b.length - a.length);

  // Bins: each bin tracks its pieces and remaining space
  const bins: { pieces: { length: number; label: string }[]; remaining: number }[] = [];

  for (const piece of expanded) {
    let bestBinIdx = -1;

    if (algorithm === 'ffd') {
      // First Fit Decreasing: find first bin where piece fits
      for (let i = 0; i < bins.length; i++) {
        const kerfNeeded = bins[i].pieces.length > 0 ? kerf : 0;
        if (bins[i].remaining - kerfNeeded >= piece.length) {
          bestBinIdx = i;
          break;
        }
      }
    } else {
      // Best Fit Decreasing: find bin with least remaining space after placing
      let bestRemaining = Infinity;
      for (let i = 0; i < bins.length; i++) {
        const kerfNeeded = bins[i].pieces.length > 0 ? kerf : 0;
        const newRemaining = bins[i].remaining - kerfNeeded - piece.length;
        if (newRemaining >= 0 && newRemaining < bestRemaining) {
          bestRemaining = newRemaining;
          bestBinIdx = i;
        }
      }
    }

    if (bestBinIdx === -1) {
      // Open new bin
      bins.push({ pieces: [piece], remaining: stockLength - piece.length });
    } else {
      const kerfNeeded = bins[bestBinIdx].pieces.length > 0 ? kerf : 0;
      bins[bestBinIdx].pieces.push(piece);
      bins[bestBinIdx].remaining -= (piece.length + kerfNeeded);
    }
  }

  // Build patterns
  let totalKerfLoss = 0;
  const patterns: CuttingPattern[] = bins.map(bin => {
    const kerfLoss = (bin.pieces.length - 1) * kerf;
    totalKerfLoss += kerfLoss;
    const usedLength = bin.pieces.reduce((s, p) => s + p.length, 0) + kerfLoss;
    const waste = stockLength - usedLength;
    return {
      pieces: bin.pieces,
      usedLength: roundTo(usedLength, 1),
      waste: roundTo(waste, 1),
      wastePercent: roundTo((waste / stockLength) * 100, 1),
    };
  });

  const totalMaterial = stockLength * bins.length;
  const totalWaste = patterns.reduce((s, p) => s + p.waste, 0);

  return {
    stocksUsed: bins.length,
    totalWaste: roundTo(totalWaste, 1),
    totalKerfLoss: roundTo(totalKerfLoss, 1),
    wastePercent: roundTo((totalWaste / totalMaterial) * 100, 1),
    utilizationPercent: roundTo(((totalMaterial - totalWaste) / totalMaterial) * 100, 1),
    patterns,
  };
}
