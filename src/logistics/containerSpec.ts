import type { ContainerSpec, ContainerType } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Typical inside dimensions and payload of standard steel dry freight containers.
 *
 * ISO 668 fixes the outside dimensions (20 ft = 6058 × 2438 × 2591 mm, 40 ft = 12192 × 2438 × 2591 mm,
 * high cube 2896 mm tall) and the maximum gross mass; the inside dimensions and the tare — and so the
 * payload — vary a little by builder. These are the commonly published figures for each type; the
 * container's own CSC plate is authoritative for a given box.
 */
const SPECS: Readonly<Record<ContainerType, ContainerSpec>> = {
  '20ft': { type: '20ft', interior: { length: 5898, width: 2352, height: 2393 }, maxPayload: 28200 },
  '40ft': { type: '40ft', interior: { length: 12032, width: 2352, height: 2393 }, maxPayload: 26680 },
  '40hc': { type: '40hc', interior: { length: 12032, width: 2352, height: 2698 }, maxPayload: 26460 },
};

/**
 * Inside dimensions and typical payload of a standard dry freight container — the `container` and
 * `maxPayload` a `containerFit()` call takes.
 *
 * @reference ISO 668:2020 (outside dimensions, ratings); inside dimensions and tare as commonly published for steel dry vans
 * @units mm, kg
 * @param type - `20ft`, `40ft` or `40hc` (40 ft high cube)
 * @returns A copy of the spec
 * @throws RangeError for an unknown type
 */
export function getContainerSpec(type: ContainerType): ContainerSpec {
  if (!Object.hasOwn(SPECS, type)) {
    throw inputRangeError(`unknown container type: ${String(type)}`, {
      code: 'unknown_option', parameter: 'type', got: String(type),
    });
  }
  const spec = SPECS[type];
  return { type: spec.type, interior: { ...spec.interior }, maxPayload: spec.maxPayload };
}

/** The container types `getContainerSpec()` knows, smallest first. */
export function getContainerTypes(): ContainerType[] {
  return Object.keys(SPECS) as ContainerType[];
}
