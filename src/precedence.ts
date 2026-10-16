import { inputRangeError } from './errors.js';

/**
 * Precedence-graph input checks shared by `lineBalancing()` and `pert()` — internal, not part of the
 * public API.
 *
 * Both build a graph from `{ id, predecessors }`. A predecessor that names no task made
 * `lineBalancing()` loop forever (the station filler waits for a task that never completes) and made
 * `pert()` drop the dependency silently; a repeated id was reported as a circular dependency.
 *
 * @throws {RangeError} two tasks share an id, or a predecessor names no task
 */
export function validatePrecedence(tasks: readonly { id: string; predecessors: readonly string[] }[]): void {
  const ids = new Set<string>();
  for (const t of tasks) {
    if (ids.has(t.id)) {
      throw new RangeError(`task id ${t.id} is used more than once`);
    }
    ids.add(t.id);
  }
  tasks.forEach((t, i) => {
    for (const p of t.predecessors) {
      if (!ids.has(p)) {
        throw inputRangeError(`task ${t.id} has predecessor ${p}, which is not a task`, {
          code: 'unknown_option', parameter: `tasks[${i}].predecessors`, got: String(p),
        });
      }
    }
  });
}
