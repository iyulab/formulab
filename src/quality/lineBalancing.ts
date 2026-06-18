import { roundTo } from '../utils.js';
import type { LineBalancingInput, LineBalancingResult, WorkStation, PositionalWeight, BalancingTask } from './types.js';

function detectCycle(tasks: BalancingTask[]): boolean {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    inStack.add(id);
    const task = taskMap.get(id);
    if (task) {
      // Find successors: tasks that have this id as predecessor
      for (const t of tasks) {
        if (t.predecessors.includes(id)) {
          if (dfs(t.id)) return true;
        }
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

function topologicalSort(tasks: BalancingTask[]): BalancingTask[] | null {
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

  const sorted: BalancingTask[] = [];
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

function calculatePositionalWeights(tasks: BalancingTask[]): Map<string, number> {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  // Build adjacency: task -> successors
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

  const memo = new Map<string, number>();

  function pw(id: string): number {
    if (memo.has(id)) return memo.get(id)!;
    const task = taskMap.get(id)!;
    let maxSuccWeight = 0;
    for (const succ of (successors.get(id) ?? [])) {
      maxSuccWeight = Math.max(maxSuccWeight, pw(succ));
    }
    const w = task.time + maxSuccWeight;
    memo.set(id, w);
    return w;
  }

  const weights = new Map<string, number>();
  for (const t of tasks) {
    weights.set(t.id, pw(t.id));
  }
  return weights;
}

/**
 * Calculate line balancing using Ranked Positional Weight (RPW) heuristic
 *
 * @param input - Line balancing input parameters
 * @returns Line balancing result
 * @throws RangeError if tasks is empty, cycleTime is not positive, a task's
 *   time exceeds cycleTime (infeasible), or the precedence graph is cyclic
 */
export function lineBalancing(input: LineBalancingInput): LineBalancingResult {
  const { tasks, cycleTime } = input;

  if (tasks.length === 0) {
    throw new RangeError('tasks must not be empty');
  }
  if (cycleTime <= 0) {
    throw new RangeError('cycleTime must be greater than 0');
  }

  // Check if any task exceeds cycle time
  if (tasks.some(t => t.time > cycleTime)) {
    throw new RangeError('cycleTime must be at least the maximum task time');
  }

  // Detect cycle
  if (detectCycle(tasks)) {
    throw new RangeError('tasks contain a circular dependency');
  }

  // Topological sort
  const sorted = topologicalSort(tasks);
  if (!sorted) {
    throw new RangeError('tasks contain a circular dependency');
  }

  // Calculate positional weights
  const pwMap = calculatePositionalWeights(tasks);

  // Sort by positional weight descending
  const tasksByPW = [...tasks].sort((a, b) => (pwMap.get(b.id) ?? 0) - (pwMap.get(a.id) ?? 0));

  // Assign to stations using RPW heuristic
  const assigned = new Set<string>();
  const completedPreds = new Set<string>();
  const stations: WorkStation[] = [];

  while (assigned.size < tasks.length) {
    const station: WorkStation = {
      id: stations.length + 1,
      tasks: [],
      totalTime: 0,
      idleTime: 0,
    };

    let remainingTime = cycleTime;

    // Try to assign tasks in PW order
    for (const task of tasksByPW) {
      if (assigned.has(task.id)) continue;
      if (task.time > remainingTime) continue;

      // Check all predecessors are completed
      const predsOk = task.predecessors.every(p => completedPreds.has(p));
      if (!predsOk) continue;

      station.tasks.push({ id: task.id, name: task.name, time: task.time });
      station.totalTime += task.time;
      remainingTime -= task.time;
      assigned.add(task.id);
      // Mark completed immediately: a successor may share this station, since the
      // within-station sequence (assignment order) preserves precedence. Deferring
      // this to station close forced every successor into a later station, inflating
      // the station count to the precedence-chain depth (standard RPW allows same-station).
      completedPreds.add(task.id);
    }

    station.idleTime = cycleTime - station.totalTime;

    stations.push(station);
  }

  const totalTaskTime = tasks.reduce((s, t) => s + t.time, 0);
  const theoreticalMin = Math.ceil(totalTaskTime / cycleTime);
  const lineEfficiency = (totalTaskTime / (stations.length * cycleTime)) * 100;
  const balanceDelay = 100 - lineEfficiency;

  // Smoothness index
  const maxStationTime = Math.max(...stations.map(s => s.totalTime));
  const smoothnessIndex = Math.sqrt(
    stations.reduce((s, st) => s + (maxStationTime - st.totalTime) ** 2, 0)
  );

  const positionalWeights: PositionalWeight[] = tasksByPW.map(t => ({
    id: t.id,
    name: t.name,
    time: t.time,
    weight: pwMap.get(t.id) ?? 0,
  }));

  return {
    stations,
    numStations: stations.length,
    theoreticalMin,
    lineEfficiency: roundTo(lineEfficiency, 1),
    balanceDelay: roundTo(balanceDelay, 1),
    smoothnessIndex: roundTo(smoothnessIndex, 2),
    positionalWeights,
  };
}
