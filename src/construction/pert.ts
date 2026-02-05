import type { PertInput, PertResult, PertTaskResult, PertTask } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Standard normal cumulative distribution function
 * Uses Abramowitz and Stegun approximation
 */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Detect cycle in task dependencies using DFS
 */
function detectCycle(tasks: PertTask[]): boolean {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    inStack.add(id);
    for (const t of tasks) {
      if (t.predecessors.includes(id)) {
        if (dfs(t.id)) return true;
      }
    }
    inStack.delete(id);
    return false;
  }

  for (const t of tasks) {
    if (dfs(t.id)) return true;
  }
  return false;
}

/**
 * Topological sort of tasks
 */
function topologicalSort(tasks: PertTask[]): PertTask[] | null {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, t.predecessors.filter(p => taskMap.has(p)).length);
    if (!adj.has(t.id)) adj.set(t.id, []);
  }

  for (const t of tasks) {
    for (const pred of t.predecessors) {
      if (taskMap.has(pred)) {
        if (!adj.has(pred)) adj.set(pred, []);
        adj.get(pred)!.push(t.id);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: PertTask[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(taskMap.get(id)!);
    for (const succ of (adj.get(id) ?? [])) {
      const newDeg = inDegree.get(succ)! - 1;
      inDegree.set(succ, newDeg);
      if (newDeg === 0) queue.push(succ);
    }
  }

  return sorted.length === tasks.length ? sorted : null;
}

/**
 * Calculate PERT (Program Evaluation and Review Technique) analysis
 *
 * Formulas:
 * - Expected duration (te) = (O + 4M + P) / 6
 * - Variance = ((P - O) / 6)²
 * - Project variance = sum of critical path variances
 * - Z-score = (deadline - project duration) / √(project variance)
 *
 * @param input - PERT input with tasks and optional deadline
 * @returns PERT analysis result or null if cycle detected
 */
export function pert(input: PertInput): PertResult | null {
  const { tasks, deadline } = input;
  if (tasks.length === 0) return null;

  // Cycle detection
  if (detectCycle(tasks)) return null;

  // Topological sort
  const sorted = topologicalSort(tasks);
  if (!sorted) return null;

  // Calculate expected duration and variance
  const te = new Map<string, number>();
  const variance = new Map<string, number>();
  for (const t of tasks) {
    const d = (t.optimistic + 4 * t.mostLikely + t.pessimistic) / 6;
    te.set(t.id, d);
    variance.set(t.id, ((t.pessimistic - t.optimistic) / 6) ** 2);
  }

  // Build successors map
  const successors = new Map<string, string[]>();
  for (const t of tasks) {
    successors.set(t.id, []);
  }
  for (const t of tasks) {
    for (const pred of t.predecessors) {
      if (successors.has(pred)) {
        successors.get(pred)!.push(t.id);
      }
    }
  }

  // Forward pass: ES, EF
  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  for (const t of sorted) {
    let maxEF = 0;
    for (const pred of t.predecessors) {
      if (ef.has(pred)) {
        maxEF = Math.max(maxEF, ef.get(pred)!);
      }
    }
    es.set(t.id, maxEF);
    ef.set(t.id, maxEF + te.get(t.id)!);
  }

  // Project duration
  const projectDuration = Math.max(...Array.from(ef.values()));

  // Backward pass: LS, LF
  const ls = new Map<string, number>();
  const lf = new Map<string, number>();
  const reversed = [...sorted].reverse();
  for (const t of reversed) {
    const succs = successors.get(t.id) ?? [];
    if (succs.length === 0) {
      lf.set(t.id, projectDuration);
    } else {
      let minLS = Infinity;
      for (const s of succs) {
        minLS = Math.min(minLS, ls.get(s)!);
      }
      lf.set(t.id, minLS);
    }
    ls.set(t.id, lf.get(t.id)! - te.get(t.id)!);
  }

  // Calculate results
  const results: PertTaskResult[] = sorted.map(t => {
    const totalFloat = ls.get(t.id)! - es.get(t.id)!;

    // Free float: min(ES of successors) - EF of this task
    const succs = successors.get(t.id) ?? [];
    let freeFloat = 0;
    if (succs.length > 0) {
      const minSuccES = Math.min(...succs.map(s => es.get(s)!));
      freeFloat = minSuccES - ef.get(t.id)!;
    }

    return {
      id: t.id,
      name: t.name,
      duration: roundTo(te.get(t.id)!, 2),
      variance: roundTo(variance.get(t.id)!, 4),
      es: roundTo(es.get(t.id)!, 2),
      ef: roundTo(ef.get(t.id)!, 2),
      ls: roundTo(ls.get(t.id)!, 2),
      lf: roundTo(lf.get(t.id)!, 2),
      totalFloat: roundTo(totalFloat, 2),
      freeFloat: roundTo(Math.max(0, freeFloat), 2),
      isCritical: Math.abs(totalFloat) < 0.001,
    };
  });

  const criticalPath = results.filter(t => t.isCritical).map(t => t.id);

  // Project variance = sum of critical path variances
  const projectVariance = results
    .filter(t => t.isCritical)
    .reduce((s, t) => s + t.variance, 0);
  const projectStdDev = Math.sqrt(projectVariance);

  const result: PertResult = {
    tasks: results,
    criticalPath,
    projectDuration: roundTo(projectDuration, 2),
    projectVariance: roundTo(projectVariance, 4),
    projectStdDev: roundTo(projectStdDev, 2),
  };

  // Deadline probability
  if (deadline !== undefined && projectStdDev > 0) {
    const z = (deadline - projectDuration) / projectStdDev;
    result.zScore = roundTo(z, 4);
    result.completionProbability = roundTo(normalCDF(z) * 100, 2);
  }

  return result;
}
