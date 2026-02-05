import type { LineBalancingInput, LineBalancingResult, WorkStation, PositionalWeight, BalancingTask } from './types.js';

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

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
 * @returns Line balancing result or null if infeasible
 */
export function lineBalancing(input: LineBalancingInput): LineBalancingResult | null {
  const { tasks, cycleTime } = input;

  if (tasks.length === 0 || cycleTime <= 0) return null;

  // Check if any task exceeds cycle time
  if (tasks.some(t => t.time > cycleTime)) return null;

  // Detect cycle
  if (detectCycle(tasks)) return null;

  // Topological sort
  const sorted = topologicalSort(tasks);
  if (!sorted) return null;

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
    }

    station.idleTime = cycleTime - station.totalTime;

    // Mark all assigned tasks as completed for next station
    for (const t of station.tasks) {
      completedPreds.add(t.id);
    }

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
