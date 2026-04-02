import type { ActionPriorityInput, ActionPriorityResult, ActionPriorityLevel } from './types.js';

/**
 * AIAG-VDA 2019 Action Priority (AP) Matrix
 *
 * Replaces the traditional RPN-based prioritization with a structured
 * S × O × D matrix lookup that better reflects risk relationships.
 *
 * @formula AP = lookup(severityGroup, occurrenceGroup, detectionGroup)
 *   - RPN = S × O × D (still computed for reference)
 *
 * @reference AIAG & VDA (2019). "FMEA Handbook", 1st Edition.
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

  const sGroup = getGroup(s, S_GROUPS);
  const oGroup = getGroup(o, O_GROUPS);
  const dGroup = getGroup(d, D_GROUPS);

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

// Group mapping: value → group index (0-4)
const S_GROUPS: [number, number][] = [[1, 0], [3, 1], [6, 2], [8, 3], [10, 4]];
const O_GROUPS: [number, number][] = [[1, 0], [3, 1], [6, 2], [8, 3], [10, 4]];
const D_GROUPS: [number, number][] = [[1, 0], [4, 1], [6, 2], [8, 3], [10, 4]];

function getGroup(value: number, groups: [number, number][]): number {
  for (const [max, group] of groups) {
    if (value <= max) return group;
  }
  return groups[groups.length - 1][1];
}

type AP = ActionPriorityLevel;
const H: AP = 'H';
const M: AP = 'M';
const L: AP = 'L';

/**
 * AP lookup table: AP_TABLE[sGroup][oGroup][dGroup]
 * S groups: {1}=0, {2-3}=1, {4-6}=2, {7-8}=3, {9-10}=4
 * O groups: {1}=0, {2-3}=1, {4-6}=2, {7-8}=3, {9-10}=4
 * D groups: {1}=0, {2-4}=1, {5-6}=2, {7-8}=3, {9-10}=4
 *
 * Table columns are D in order: {9-10}, {7-8}, {5-6}, {2-4}, {1}
 * So dGroup 4→col0, 3→col1, 2→col2, 1→col3, 0→col4
 */
const AP_TABLE: AP[][][] = buildApTable();

function buildApTable(): AP[][][] {
  // Raw table: [sGroup][oGroup] → [D={9-10}, D={7-8}, D={5-6}, D={2-4}, D={1}]
  const raw: AP[][][] = [
    // S=1 (sGroup=0)
    [
      /* O=1    */ [L, L, L, L, L],
      /* O=2-3  */ [L, L, L, L, L],
      /* O=4-6  */ [M, L, L, L, L],
      /* O=7-8  */ [M, M, L, L, L],
      /* O=9-10 */ [H, M, M, L, L],
    ],
    // S=2-3 (sGroup=1)
    [
      /* O=1    */ [L, L, L, L, L],
      /* O=2-3  */ [M, L, L, L, L],
      /* O=4-6  */ [M, M, L, L, L],
      /* O=7-8  */ [H, M, M, L, L],
      /* O=9-10 */ [H, H, M, M, L],
    ],
    // S=4-6 (sGroup=2)
    [
      /* O=1    */ [M, L, L, L, L],
      /* O=2-3  */ [M, M, L, L, L],
      /* O=4-6  */ [H, M, M, L, L],
      /* O=7-8  */ [H, H, M, M, L],
      /* O=9-10 */ [H, H, H, M, M],
    ],
    // S=7-8 (sGroup=3)
    [
      /* O=1    */ [M, M, L, L, L],
      /* O=2-3  */ [H, M, M, L, L],
      /* O=4-6  */ [H, H, M, M, L],
      /* O=7-8  */ [H, H, H, M, M],
      /* O=9-10 */ [H, H, H, H, H],
    ],
    // S=9-10 (sGroup=4)
    [
      /* O=1    */ [H, M, M, L, L],
      /* O=2-3  */ [H, H, M, M, L],
      /* O=4-6  */ [H, H, H, M, M],
      /* O=7-8  */ [H, H, H, H, H],
      /* O=9-10 */ [H, H, H, H, H],
    ],
  ];

  // Convert raw table: columns are D={9-10}(4), D={7-8}(3), D={5-6}(2), D={2-4}(1), D={1}(0)
  // We need AP_TABLE[s][o][dGroup] where dGroup 0={1}, 1={2-4}, 2={5-6}, 3={7-8}, 4={9-10}
  const table: AP[][][] = [];
  for (let s = 0; s < 5; s++) {
    table[s] = [];
    for (let o = 0; o < 5; o++) {
      table[s][o] = [
        raw[s][o][4], // dGroup 0 ({1})    ← col 4
        raw[s][o][3], // dGroup 1 ({2-4})   ← col 3
        raw[s][o][2], // dGroup 2 ({5-6})   ← col 2
        raw[s][o][1], // dGroup 3 ({7-8})   ← col 1
        raw[s][o][0], // dGroup 4 ({9-10})  ← col 0
      ];
    }
  }
  return table;
}
