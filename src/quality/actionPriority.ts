import type {
  ActionPriorityInput,
  ActionPriorityResult,
  ActionPriorityLevel,
  ApRatingBand,
} from './types.js';

/**
 * AIAG-VDA 2019 Action Priority (AP) Matrix
 *
 * Replaces the traditional RPN-based prioritization with a structured
 * S × O × D matrix lookup that better reflects risk relationships.
 *
 * @formula AP = lookup(severityGroup, occurrenceGroup, detectionGroup)
 *   - RPN = S × O × D (still computed for reference)
 *
 * @reference AIAG & VDA (2019). "FMEA Handbook", 1st Edition — Action Priority table.
 *   Band structure and cell values cross-checked against the Relyence FMEA
 *   user guide reproduction (https://relyence.com/help/user-guide/fmea-ap.html).
 *
 * Rating bands (group index in result):
 *   - Severity:   {1}=0, {2-3}=1, {4-6}=2, {7-8}=3, {9-10}=4
 *   - Occurrence: {1}=0, {2-3}=1, {4-5}=2, {6-7}=3, {8-10}=4
 *   - Detection:  {1}=0, {2-4}=1, {5-6}=2, {7-10}=3
 *
 * Handbook invariants: S=1 → AP is always L; O=1 → AP is always L
 * (failure prevented/eliminated needs no action regardless of S or D).
 *
 * @throws {RangeError} Severity must be between 1 and 10
 * @throws {RangeError} Occurrence must be between 1 and 10
 * @throws {RangeError} Detection must be between 1 and 10
 */
export function actionPriority(input: ActionPriorityInput): ActionPriorityResult {
  const { severity, occurrence, detection } = input;

  if (!Number.isFinite(severity) || severity < 1 || severity > 10) {
    throw new RangeError('Severity must be between 1 and 10');
  }
  if (!Number.isFinite(occurrence) || occurrence < 1 || occurrence > 10) {
    throw new RangeError('Occurrence must be between 1 and 10');
  }
  if (!Number.isFinite(detection) || detection < 1 || detection > 10) {
    throw new RangeError('Detection must be between 1 and 10');
  }

  const s = Math.round(severity);
  const o = Math.round(occurrence);
  const d = Math.round(detection);

  const sGroup = getGroup(s, AP_SEVERITY_BANDS);
  const oGroup = getGroup(o, AP_OCCURRENCE_BANDS);
  const dGroup = getGroup(d, AP_DETECTION_BANDS);

  const ap = AP_TABLE[sGroup][oGroup][dGroup];
  const rpn = s * o * d;

  return {
    actionPriority: ap,
    rpn,
    severityGroup: sGroup,
    occurrenceGroup: oGroup,
    detectionGroup: dGroup,
  };
}

/** AIAG-VDA 2019 severity rating bands; array index = `severityGroup`. */
export const AP_SEVERITY_BANDS: readonly ApRatingBand[] = [
  { min: 1, max: 1 },
  { min: 2, max: 3 },
  { min: 4, max: 6 },
  { min: 7, max: 8 },
  { min: 9, max: 10 },
];

/** AIAG-VDA 2019 occurrence rating bands; array index = `occurrenceGroup`. */
export const AP_OCCURRENCE_BANDS: readonly ApRatingBand[] = [
  { min: 1, max: 1 },
  { min: 2, max: 3 },
  { min: 4, max: 5 },
  { min: 6, max: 7 },
  { min: 8, max: 10 },
];

/** AIAG-VDA 2019 detection rating bands; array index = `detectionGroup`. */
export const AP_DETECTION_BANDS: readonly ApRatingBand[] = [
  { min: 1, max: 1 },
  { min: 2, max: 4 },
  { min: 5, max: 6 },
  { min: 7, max: 10 },
];

function getGroup(value: number, bands: readonly ApRatingBand[]): number {
  for (let i = 0; i < bands.length; i++) {
    if (value <= bands[i].max) return i;
  }
  return bands.length - 1;
}

type AP = ActionPriorityLevel;
const H: AP = 'H';
const M: AP = 'M';
const L: AP = 'L';

/**
 * AP lookup table: `AP_TABLE[severityGroup][occurrenceGroup][detectionGroup]`.
 * Group indices follow `AP_SEVERITY_BANDS` / `AP_OCCURRENCE_BANDS` / `AP_DETECTION_BANDS`.
 * Rows are O groups ascending {1}, {2-3}, {4-5}, {6-7}, {8-10};
 * columns are D groups ascending {1}, {2-4}, {5-6}, {7-10}.
 */
export const AP_TABLE: readonly (readonly (readonly ActionPriorityLevel[])[])[] = [
  // S=1 (sGroup=0) — always L regardless of O/D
  [
    /* O=1    */ [L, L, L, L],
    /* O=2-3  */ [L, L, L, L],
    /* O=4-5  */ [L, L, L, L],
    /* O=6-7  */ [L, L, L, L],
    /* O=8-10 */ [L, L, L, L],
  ],
  // S=2-3 (sGroup=1)
  [
    /* O=1    */ [L, L, L, L],
    /* O=2-3  */ [L, L, L, L],
    /* O=4-5  */ [L, L, L, L],
    /* O=6-7  */ [L, L, L, L],
    /* O=8-10 */ [L, L, M, M],
  ],
  // S=4-6 (sGroup=2)
  [
    /* O=1    */ [L, L, L, L],
    /* O=2-3  */ [L, L, L, L],
    /* O=4-5  */ [L, L, L, M],
    /* O=6-7  */ [L, M, M, M],
    /* O=8-10 */ [M, M, H, H],
  ],
  // S=7-8 (sGroup=3)
  [
    /* O=1    */ [L, L, L, L],
    /* O=2-3  */ [L, L, M, M],
    /* O=4-5  */ [M, M, M, H],
    /* O=6-7  */ [M, H, H, H],
    /* O=8-10 */ [H, H, H, H],
  ],
  // S=9-10 (sGroup=4)
  [
    /* O=1    */ [L, L, L, L],
    /* O=2-3  */ [L, L, M, H],
    /* O=4-5  */ [M, H, H, H],
    /* O=6-7  */ [H, H, H, H],
    /* O=8-10 */ [H, H, H, H],
  ],
];
