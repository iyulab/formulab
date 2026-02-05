import { describe, it, expect } from 'vitest';
import { pert } from './pert.js';

describe('pert', () => {
  describe('expected duration calculation', () => {
    it('should calculate te = (O + 4M + P) / 6', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
        ],
      });

      expect(result).not.toBeNull();
      // te = (2 + 4×4 + 6) / 6 = 24/6 = 4
      expect(result!.tasks[0].duration).toBe(4);
    });

    it('should handle asymmetric estimates', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 1, mostLikely: 3, pessimistic: 11, predecessors: [] },
        ],
      });

      expect(result).not.toBeNull();
      // te = (1 + 12 + 11) / 6 = 24/6 = 4
      expect(result!.tasks[0].duration).toBe(4);
    });
  });

  describe('variance calculation', () => {
    it('should calculate variance = ((P - O) / 6)²', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 8, predecessors: [] },
        ],
      });

      expect(result).not.toBeNull();
      // Variance = ((8-2)/6)² = 1²= 1
      expect(result!.tasks[0].variance).toBe(1);
    });
  });

  describe('forward pass (ES, EF)', () => {
    it('should calculate early start and finish', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 3, mostLikely: 6, pessimistic: 9, predecessors: ['A'] },
        ],
      });

      expect(result).not.toBeNull();
      // Task A: ES=0, EF=4
      expect(result!.tasks[0].es).toBe(0);
      expect(result!.tasks[0].ef).toBe(4);
      // Task B: ES=4, EF=4+6=10
      expect(result!.tasks[1].es).toBe(4);
      expect(result!.tasks[1].ef).toBe(10);
    });

    it('should use max EF of predecessors', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 4, mostLikely: 8, pessimistic: 12, predecessors: [] },
          { id: 'C', name: 'Task C', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: ['A', 'B'] },
        ],
      });

      expect(result).not.toBeNull();
      // A duration = 4, B duration = 8
      // C ES = max(4, 8) = 8
      expect(result!.tasks[2].es).toBe(8);
    });
  });

  describe('backward pass (LS, LF)', () => {
    it('should calculate late start and finish', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 3, mostLikely: 6, pessimistic: 9, predecessors: ['A'] },
        ],
      });

      expect(result).not.toBeNull();
      // Task B: LF=10, LS=10-6=4
      expect(result!.tasks[1].lf).toBe(10);
      expect(result!.tasks[1].ls).toBe(4);
      // Task A: LF=4, LS=4-4=0
      expect(result!.tasks[0].lf).toBe(4);
      expect(result!.tasks[0].ls).toBe(0);
    });
  });

  describe('total float', () => {
    it('should calculate total float = LS - ES', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: [] },
          { id: 'C', name: 'Task C', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: ['A', 'B'] },
        ],
      });

      expect(result).not.toBeNull();
      // A: ES=0, LS=0, float=0 (critical)
      expect(result!.tasks[0].totalFloat).toBe(0);
      // B: ES=0, duration=2, C needs to wait for A (4), so B has float
      // B: LF = C.LS = 4, LS = 4-2 = 2, float = 2-0 = 2
      expect(result!.tasks[1].totalFloat).toBe(2);
    });
  });

  describe('critical path', () => {
    it('should identify critical tasks (float = 0)', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: [] },
          { id: 'C', name: 'Task C', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: ['A', 'B'] },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.tasks[0].isCritical).toBe(true);
      expect(result!.tasks[1].isCritical).toBe(false);
      expect(result!.tasks[2].isCritical).toBe(true);
    });

    it('should return critical path as array of IDs', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: [] },
          { id: 'C', name: 'Task C', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: ['A', 'B'] },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.criticalPath).toContain('A');
      expect(result!.criticalPath).toContain('C');
      expect(result!.criticalPath).not.toContain('B');
    });
  });

  describe('project duration', () => {
    it('should calculate project duration as max EF', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 3, mostLikely: 6, pessimistic: 9, predecessors: ['A'] },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.projectDuration).toBe(10);
    });
  });

  describe('project variance and standard deviation', () => {
    it('should sum critical path variances', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 8, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 1, mostLikely: 3, pessimistic: 5, predecessors: ['A'] },
        ],
      });

      expect(result).not.toBeNull();
      // A variance = 1, B variance = ((5-1)/6)² = 0.444
      // Project variance = 1 + 0.444 = 1.444
      expect(result!.projectVariance).toBeCloseTo(1.444, 2);
    });

    it('should calculate standard deviation', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 8, predecessors: [] },
          { id: 'B', name: 'Task B', optimistic: 1, mostLikely: 3, pessimistic: 5, predecessors: ['A'] },
        ],
      });

      expect(result).not.toBeNull();
      // StdDev = sqrt(1.444) = 1.20
      expect(result!.projectStdDev).toBeCloseTo(1.20, 1);
    });
  });

  describe('deadline probability', () => {
    it('should calculate Z-score', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 8, mostLikely: 10, pessimistic: 18, predecessors: [] },
        ],
        deadline: 15,
      });

      expect(result).not.toBeNull();
      // Duration = (8 + 40 + 18) / 6 = 11
      // Variance = ((18-8)/6)² = 2.78
      // StdDev = 1.67
      // Z = (15 - 11) / 1.67 = 2.4
      expect(result!.zScore).toBeCloseTo(2.4, 1);
    });

    it('should calculate completion probability', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 8, mostLikely: 10, pessimistic: 18, predecessors: [] },
        ],
        deadline: 15,
      });

      expect(result).not.toBeNull();
      // Z = 2.4 → probability ≈ 99.2%
      expect(result!.completionProbability).toBeGreaterThan(99);
    });

    it('should handle tight deadline', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 8, mostLikely: 10, pessimistic: 18, predecessors: [] },
        ],
        deadline: 10, // Less than expected 11
      });

      expect(result).not.toBeNull();
      // Z < 0, probability < 50%
      expect(result!.completionProbability).toBeLessThan(50);
    });
  });

  describe('error handling', () => {
    it('should return null for empty tasks', () => {
      const result = pert({ tasks: [] });
      expect(result).toBeNull();
    });

    it('should return null for cyclic dependencies', () => {
      const result = pert({
        tasks: [
          { id: 'A', name: 'Task A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: ['B'] },
          { id: 'B', name: 'Task B', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: ['A'] },
        ],
      });

      expect(result).toBeNull();
    });
  });

  describe('real-world scenarios', () => {
    it('should analyze software project', () => {
      const result = pert({
        tasks: [
          { id: 'REQ', name: 'Requirements', optimistic: 5, mostLikely: 10, pessimistic: 20, predecessors: [] },
          { id: 'DES', name: 'Design', optimistic: 10, mostLikely: 15, pessimistic: 25, predecessors: ['REQ'] },
          { id: 'DEV', name: 'Development', optimistic: 20, mostLikely: 30, pessimistic: 50, predecessors: ['DES'] },
          { id: 'TEST', name: 'Testing', optimistic: 10, mostLikely: 15, pessimistic: 25, predecessors: ['DEV'] },
          { id: 'DOC', name: 'Documentation', optimistic: 5, mostLikely: 8, pessimistic: 15, predecessors: ['DES'] },
          { id: 'DEPLOY', name: 'Deployment', optimistic: 2, mostLikely: 3, pessimistic: 5, predecessors: ['TEST', 'DOC'] },
        ],
        deadline: 80,
      });

      expect(result).not.toBeNull();
      expect(result!.criticalPath).toContain('REQ');
      expect(result!.criticalPath).toContain('DES');
      expect(result!.criticalPath).toContain('DEV');
      expect(result!.criticalPath).toContain('TEST');
    });

    it('should analyze construction project', () => {
      const result = pert({
        tasks: [
          { id: 'EXC', name: 'Excavation', optimistic: 3, mostLikely: 5, pessimistic: 10, predecessors: [] },
          { id: 'FND', name: 'Foundation', optimistic: 5, mostLikely: 7, pessimistic: 12, predecessors: ['EXC'] },
          { id: 'FRM', name: 'Framing', optimistic: 10, mostLikely: 14, pessimistic: 21, predecessors: ['FND'] },
          { id: 'PLM', name: 'Plumbing', optimistic: 3, mostLikely: 5, pessimistic: 8, predecessors: ['FRM'] },
          { id: 'ELC', name: 'Electrical', optimistic: 3, mostLikely: 5, pessimistic: 8, predecessors: ['FRM'] },
          { id: 'FIN', name: 'Finishing', optimistic: 7, mostLikely: 10, pessimistic: 15, predecessors: ['PLM', 'ELC'] },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.projectDuration).toBeGreaterThan(40);
    });
  });
});
