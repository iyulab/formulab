import type { ContainerFitInput, ContainerFitResult, BoxOrientation, RotationConstraint, LoadLimit } from './types.js';
import { requireFinite, roundTo } from '../utils.js';
import { inputRangeError } from '../errors.js';

/**
 * The orientations a unit may take: `fixed` — as given; `layered` — upright, turned on the floor;
 * `full` — onto any face. The given orientation comes first, so it wins a tie.
 */
export function cargoOrientations(l: number, w: number, h: number, rotation: RotationConstraint): BoxOrientation[] {
  const candidates: [number, number, number][] =
    rotation === 'fixed' ? [[l, w, h]]
      : rotation === 'layered' ? [[l, w, h], [w, l, h]]
        : [[l, w, h], [w, l, h], [l, h, w], [h, l, w], [w, h, l], [h, w, l]];
  const seen = new Set<string>();
  const out: BoxOrientation[] = [];
  for (const [length, width, height] of candidates) {
    const key = `${length}|${width}|${height}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ length, width, height });
  }
  return out;
}

/**
 * The boxes of one layer in a row-and-column grid: how many fit along each side. The single source of
 * `unitsPerLayer` / `boxesPerLayer` — `containerFit()` and `palletStack()` count with it and
 * `boxGridLayout()` places boxes with it, so a drawn layer and the reported count cannot disagree.
 */
export function gridCounts(areaLength: number, areaWidth: number, boxLength: number, boxWidth: number): { columns: number; rows: number } {
  return { columns: Math.floor(areaLength / boxLength), rows: Math.floor(areaWidth / boxWidth) };
}

/**
 * Every listed dimension must be greater than 0 — the layout divides by it. The refusal names the first
 * one that is not (`cargo.height`, `pallet.width`, …); the message names the group.
 */
export function requirePositiveDimensions<T extends object>(
  owner: string, dims: T, keys: readonly (keyof T & string)[], message: string,
): void {
  for (const key of keys) {
    const value = dims[key] as number;
    if (!(value > 0)) {
      throw inputRangeError(message, { code: 'parameter_out_of_range', parameter: `${owner}.${key}`, exclusive_min: 0, got: value });
    }
  }
}

/** A weight limit of 0 or more must be met; absent means no limit. */
function requireWeightLimit(name: 'maxPayload' | 'maxStackWeight', value: number | undefined): void {
  if (value !== undefined && value < 0) {
    throw inputRangeError(`${name} must be 0 or more`, { code: 'parameter_out_of_range', parameter: name, min: 0, got: value });
  }
}

/**
 * Calculate how many units fit in a container — by space, then by the weight a column may carry and the
 * weight the container may carry.
 *
 * Each orientation the rotation allows is laid out as a grid (`⌊L/l⌋ × ⌊W/w⌋` per layer, `⌊H/h⌋` layers);
 * a column is cut to `maxLayers` and to `⌊maxStackWeight / weight⌋` layers, and the load to `⌊maxPayload / weight⌋` units. The
 * orientation that loads the most units after the limits wins (the given orientation on a tie) — under a
 * column limit it need not be the one that fits the most by space.
 *
 * @formula unitsPerLayer = ⌊L/l⌋·⌊W/w⌋; layers = min(⌊H/h⌋, maxLayers, ⌊maxStackWeight/weight⌋); totalUnits = min(unitsPerLayer·layers, ⌊maxPayload/weight⌋)
 * @units mm, kg, %
 * @param input - Container inside dimensions, the unit, how it may be turned and the weight limits
 * @returns The layout, what limited it, and how much of the container it uses
 * @throws RangeError if any cargo or container dimension is not greater than 0 (`parameter_out_of_range`,
 *   `parameter` `cargo.length` … `container.height`), or a weight (`cargo.weight`, `maxPayload`,
 *   `maxStackWeight`) is below 0, or `maxLayers` is not a whole number ≥ 1 (`parameter_out_of_range`)
 */
export function containerFit(input: ContainerFitInput): ContainerFitResult {
  requireFinite('containerFit', input);
  const { container, cargo, rotation, maxPayload, maxStackWeight, maxLayers } = input;

  // Each container dimension is divided by a cargo dimension.
  requirePositiveDimensions('cargo', cargo, ['length', 'width', 'height'], 'cargo length, width and height must be greater than 0');
  // A container with no inside length, width or height holds nothing — 0 units is not a fit result.
  requirePositiveDimensions('container', container, ['length', 'width', 'height'], 'container length, width and height must be greater than 0');
  const weight = cargo.weight ?? 0;
  if (weight < 0) {
    throw inputRangeError('cargo weight must be 0 or more', { code: 'parameter_out_of_range', parameter: 'cargo.weight', min: 0, got: weight });
  }
  requireWeightLimit('maxPayload', maxPayload);
  requireWeightLimit('maxStackWeight', maxStackWeight);
  if (maxLayers !== undefined && !(Number.isInteger(maxLayers) && maxLayers >= 1)) {
    throw inputRangeError('maxLayers must be a whole number of 1 or more', { code: 'parameter_out_of_range', parameter: 'maxLayers', min: 1, got: maxLayers });
  }

  // A weightless unit meets every weight limit.
  const layersByWeight = maxStackWeight !== undefined && weight > 0 ? Math.floor(maxStackWeight / weight) : Infinity;
  const unitsByPayload = maxPayload !== undefined && weight > 0 ? Math.floor(maxPayload / weight) : Infinity;

  type Layout = { orient: BoxOrientation; unitsPerLayer: number; layers: number; totalUnits: number; limitedBy: LoadLimit };
  // The first orientation that fits is kept even when a weight limit leaves it empty, so the result
  // says which limit emptied it; nothing fitting at all is a space limit.
  let best: Layout | null = null;

  for (const orient of cargoOrientations(cargo.length, cargo.width, cargo.height, rotation)) {
    if (orient.length > container.length || orient.width > container.width || orient.height > container.height) continue;

    const grid = gridCounts(container.length, container.width, orient.length, orient.width);
    const unitsPerLayer = grid.columns * grid.rows;
    const layersBySpace = Math.floor(container.height / orient.height);
    const layersByCount = Math.min(layersBySpace, maxLayers ?? Infinity);
    const layers = Math.min(layersByCount, layersByWeight);
    const stacked = unitsPerLayer * layers;
    const totalUnits = Math.min(stacked, unitsByPayload);
    const limitedBy: LoadLimit = totalUnits < stacked ? 'payload'
      : layers < layersByCount ? 'stack_weight'
        : layersByCount < layersBySpace ? 'max_layers' : 'space';

    if (best === null || totalUnits > best.totalUnits) best = { orient, unitsPerLayer, layers, totalUnits, limitedBy };
  }

  const { orient, unitsPerLayer, layers, totalUnits, limitedBy } = best ?? {
    orient: { length: cargo.length, width: cargo.width, height: cargo.height },
    unitsPerLayer: 0, layers: 0, totalUnits: 0, limitedBy: 'space' as const,
  };
  const unitVolume = orient.length * orient.width * orient.height;
  const containerVolume = container.length * container.width * container.height;

  return {
    unitsPerLayer,
    layers,
    totalUnits,
    loadedLayers: unitsPerLayer > 0 ? Math.ceil(totalUnits / unitsPerLayer) : 0,
    bestOrientation: orient,
    totalWeight: roundTo(totalUnits * weight, 3),
    limitedBy,
    volumeUtilization: roundTo((totalUnits * unitVolume / containerVolume) * 100, 2),
    floorUtilization: roundTo((unitsPerLayer * orient.length * orient.width / (container.length * container.width)) * 100, 2),
  };
}
