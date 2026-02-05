import type { AssignmentInput, AssignmentResult, AssignmentPair } from './types.js';

/**
 * Round to specified decimal places
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Hungarian algorithm (Jonker-Volgenant variant)
 * Solves the assignment problem in O(n^3).
 * Handles rectangular matrices by padding with zeros.
 *
 * @param input - Assignment problem input with cost matrix and labels
 * @returns Assignment result with optimal assignments or null if invalid
 */
export function solveAssignment(input: AssignmentInput): AssignmentResult | null {
  const { matrix, rowLabels, colLabels, objective } = input;

  if (matrix.length === 0 || matrix[0].length === 0) return null;

  const nRows = matrix.length;
  const nCols = matrix[0].length;
  const n = Math.max(nRows, nCols);

  // Build square cost matrix, pad with zeros for rectangular
  const cost: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i < nRows && j < nCols) {
        return objective === 'maximize' ? -matrix[i][j] : matrix[i][j];
      }
      return 0; // dummy
    })
  );

  // Hungarian algorithm (potential-based)
  const INF = 1e18;
  const u = new Float64Array(n + 1); // row potentials
  const v = new Float64Array(n + 1); // col potentials
  const p = new Int32Array(n + 1);   // col -> row assignment
  const way = new Int32Array(n + 1); // augmenting path

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(n + 1).fill(INF);
    const used = new Uint8Array(n + 1);

    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = INF;
      let j1 = -1;

      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }

  // Extract assignments
  const assignments: AssignmentPair[] = [];
  const assignedRows = new Set<number>();
  const assignedCols = new Set<number>();

  for (let j = 1; j <= n; j++) {
    const row = p[j] - 1;
    const col = j - 1;
    if (row < nRows && col < nCols) {
      assignments.push({
        row,
        col,
        rowLabel: rowLabels[row] ?? `R${row + 1}`,
        colLabel: colLabels[col] ?? `C${col + 1}`,
        cost: matrix[row][col],
      });
      assignedRows.add(row);
      assignedCols.add(col);
    }
  }

  const totalCost = assignments.reduce((s, a) => s + a.cost, 0);

  const unassignedRows: string[] = [];
  for (let i = 0; i < nRows; i++) {
    if (!assignedRows.has(i)) unassignedRows.push(rowLabels[i] ?? `R${i + 1}`);
  }

  const unassignedCols: string[] = [];
  for (let j = 0; j < nCols; j++) {
    if (!assignedCols.has(j)) unassignedCols.push(colLabels[j] ?? `C${j + 1}`);
  }

  return {
    totalCost: roundTo(totalCost, 2),
    assignments: assignments.sort((a, b) => a.row - b.row),
    unassignedRows,
    unassignedCols,
  };
}
