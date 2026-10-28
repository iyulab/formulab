import type { BoxGridLayoutInput, BoxGridLayoutResult, BoxGridPlacement } from './types.js';
import { requireFinite, roundTo } from '../utils.js';
import { gridCounts, requirePositiveDimensions } from './containerFit.js';

/** Placements listed at most — a plan with more boxes than this cannot be told apart in any drawing. */
const MAX_PLACEMENTS = 5000;

/**
 * Where the boxes of one layer sit: an axis-aligned grid of identical boxes from one corner of the
 * floor, the arrangement `palletStack()` and `containerFit()` count (`columns × rows`). Boxes run along
 * the length first; `x` is measured along the area's length and `y` along its width, from the corner
 * the grid starts in. The strips left over along the far length and far width are reported
 * (`unusedLength`, `unusedWidth`) — what the pattern does not cover.
 *
 * A box larger than the area on either side gives `columns` or `rows` 0 and no placements. Above
 * 5,000 boxes the placements are left out (`placementsOmitted: true`) while `columns`, `rows` and the
 * unused strips stay exact — a drawing of that many boxes shows nothing a count does not.
 *
 * @formula columns = ⌊area.length / box.length⌋, rows = ⌊area.width / box.width⌋
 * @units any one length unit for all four dimensions (mm for pallets and containers)
 * @param input - The floor (pallet deck or container floor) and one box's footprint in the orientation to draw
 * @returns Grid size, the box placements and the unused strips
 * @throws RangeError if any area or box dimension is not greater than 0 (`parameter_out_of_range`,
 *   `parameter` `area.length` … `box.width`)
 */
export function boxGridLayout(input: BoxGridLayoutInput): BoxGridLayoutResult {
  requireFinite('boxGridLayout', input);
  const { area, box } = input;
  requirePositiveDimensions('area', area, ['length', 'width'], 'area length and width must be greater than 0');
  requirePositiveDimensions('box', box, ['length', 'width'], 'box length and width must be greater than 0');

  const { columns, rows } = gridCounts(area.length, area.width, box.length, box.width);
  const placementsOmitted = columns * rows > MAX_PLACEMENTS;
  const boxes: BoxGridPlacement[] = [];
  if (!placementsOmitted) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        boxes.push({ x: roundTo(col * box.length, 4), y: roundTo(row * box.width, 4), length: box.length, width: box.width });
      }
    }
  }

  return {
    columns,
    rows,
    boxes,
    unusedLength: roundTo(area.length - columns * box.length, 4),
    unusedWidth: roundTo(area.width - rows * box.width, 4),
    placementsOmitted,
  };
}

