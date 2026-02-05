import { roundTo } from '../utils.js';
import type { CuttingStockInput, CuttingStockResult, CuttingPattern } from './types.js';

/**
 * Calculate optimal cutting layout for 1D cutting stock problem.
 *
 * Uses First Fit Decreasing (FFD) or Best Fit Decreasing (BFD) algorithm.
 */
export function cuttingStock(input: CuttingStockInput): CuttingStockResult | null {
  const { stockLength, kerf, pieces, algorithm } = input;
  if (pieces.length === 0) return null;

  // Expand quantities
  const expanded: { length: number; label: string }[] = [];
  for (const p of pieces) {
    for (let i = 0; i < p.quantity; i++) {
      expanded.push({ length: p.length, label: p.label ?? `${p.length}` });
    }
  }

  // Check if any piece exceeds stock length
  if (expanded.some(p => p.length > stockLength)) return null;
  if (expanded.length === 0) return null;

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
