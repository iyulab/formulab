import type { SolderInput, SolderResult } from './types.js';
import { roundTo, requireFinite } from '../utils.js';

/**
 * Calculate solder paste consumption for SMT production
 * @param input - Solder paste parameters
 * @returns Solder paste volume and weight calculations
 * @throws {RangeError} padCount, avgPadArea, stencilThickness, transferEfficiency, density,
 *   boardsPerPanel or panelCount is not greater than 0
 */
export function solderPaste(input: SolderInput): SolderResult {
  requireFinite('solderPaste', input);
  const {
    padCount,
    avgPadArea,
    stencilThickness,
    transferEfficiency,
    density,
    boardsPerPanel,
    panelCount,
  } = input;

  // Every quantity is a count or a physical magnitude; zero or negative has no meaning.
  const fields = {
    padCount, avgPadArea, stencilThickness, transferEfficiency, density, boardsPerPanel, panelCount,
  };
  for (const [name, value] of Object.entries(fields)) {
    if (!(value > 0)) {
      throw new RangeError(`${name} must be greater than 0`);
    }
  }

  // Volume per board (mm3)
  // Volume = padCount * avgPadArea * stencilThickness * transferEfficiency
  const volumePerBoard = roundTo(
    padCount * avgPadArea * stencilThickness * transferEfficiency,
    4
  );

  // Weight per board (g)
  // Weight = volume * density / 1000 (density is g/cm3, volume is mm3)
  // 1 cm3 = 1000 mm3, so divide by 1000
  const weightPerBoard = roundTo(volumePerBoard * density / 1000, 4);

  // Total boards = boardsPerPanel * panelCount
  const totalBoards = boardsPerPanel * panelCount;

  // Total volume and weight
  const totalVolume = roundTo(volumePerBoard * totalBoards, 4);
  const totalWeight = roundTo(weightPerBoard * totalBoards, 4);
  const totalWeightKg = roundTo(totalWeight / 1000, 4);

  return {
    volumePerBoard,
    weightPerBoard,
    totalVolume,
    totalWeight,
    totalWeightKg,
  };
}
