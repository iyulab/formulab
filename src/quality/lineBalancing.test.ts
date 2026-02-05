import { describe, it, expect } from 'vitest';
import { lineBalancing } from './lineBalancing.js';

describe('lineBalancing', () => {
  describe('basic operation', () => {
    it('should balance simple sequential tasks', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 3, predecessors: ['A'] },
          { id: 'C', name: 'Task C', time: 4, predecessors: ['B'] },
        ],
        cycleTime: 6,
      });

      expect(result).not.toBeNull();
      expect(result!.numStations).toBeGreaterThan(0);
    });

    it('should calculate theoretical minimum stations', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 3, predecessors: [] },
          { id: 'C', name: 'Task C', time: 4, predecessors: [] },
        ],
        cycleTime: 6,
      });

      // Total time = 12, cycle = 6, theoretical min = ceil(12/6) = 2
      expect(result).not.toBeNull();
      expect(result!.theoreticalMin).toBe(2);
    });

    it('should calculate line efficiency', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 5, predecessors: [] },
        ],
        cycleTime: 5,
      });

      expect(result).not.toBeNull();
      // Total time = 10, 2 stations * 5 = 10, efficiency = 100%
      expect(result!.lineEfficiency).toBe(100);
    });

    it('should calculate balance delay', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 3, predecessors: [] },
        ],
        cycleTime: 5,
      });

      expect(result).not.toBeNull();
      // Balance delay = 100 - efficiency
      expect(result!.balanceDelay).toBe(100 - result!.lineEfficiency);
    });
  });

  describe('positional weights', () => {
    it('should calculate positional weights correctly', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 3, predecessors: ['A'] },
          { id: 'C', name: 'Task C', time: 4, predecessors: ['A'] },
          { id: 'D', name: 'Task D', time: 2, predecessors: ['B', 'C'] },
        ],
        cycleTime: 10,
      });

      expect(result).not.toBeNull();
      expect(result!.positionalWeights.length).toBe(4);

      // A's weight = 5 + max(B path, C path)
      // B path = 3 + 2 = 5
      // C path = 4 + 2 = 6
      // A's weight = 5 + 6 = 11
      const weightA = result!.positionalWeights.find(p => p.id === 'A');
      expect(weightA?.weight).toBe(11);
    });
  });

  describe('predecessor constraints', () => {
    it('should respect predecessor constraints', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 3, predecessors: [] },
          { id: 'B', name: 'Task B', time: 3, predecessors: ['A'] },
        ],
        cycleTime: 5,
      });

      expect(result).not.toBeNull();
      // B cannot be in same station as A if combined time > cycle time is prevented by predecessors
      const stations = result!.stations;

      // Find which station has A and B
      const stationWithA = stations.find(s => s.tasks.some(t => t.id === 'A'));
      const stationWithB = stations.find(s => s.tasks.some(t => t.id === 'B'));

      // If they're in same station, total time should be 6 which exceeds cycle time 5
      // So they should be in different stations
      expect(stationWithA).not.toBe(stationWithB);
    });
  });

  describe('error handling', () => {
    it('should return null for empty tasks', () => {
      const result = lineBalancing({
        tasks: [],
        cycleTime: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null for zero cycle time', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
        ],
        cycleTime: 0,
      });

      expect(result).toBeNull();
    });

    it('should return null when task time exceeds cycle time', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 15, predecessors: [] },
        ],
        cycleTime: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null for cyclic dependencies', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 3, predecessors: ['C'] },
          { id: 'B', name: 'Task B', time: 3, predecessors: ['A'] },
          { id: 'C', name: 'Task C', time: 3, predecessors: ['B'] },
        ],
        cycleTime: 10,
      });

      expect(result).toBeNull();
    });
  });

  describe('station assignment', () => {
    it('should assign tasks to stations without exceeding cycle time', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 4, predecessors: [] },
          { id: 'C', name: 'Task C', time: 3, predecessors: [] },
        ],
        cycleTime: 6,
      });

      expect(result).not.toBeNull();
      for (const station of result!.stations) {
        expect(station.totalTime).toBeLessThanOrEqual(6);
      }
    });

    it('should calculate idle time for each station', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 4, predecessors: [] },
          { id: 'B', name: 'Task B', time: 3, predecessors: [] },
        ],
        cycleTime: 5,
      });

      expect(result).not.toBeNull();
      for (const station of result!.stations) {
        expect(station.idleTime).toBe(5 - station.totalTime);
      }
    });
  });

  describe('smoothness index', () => {
    it('should calculate smoothness index', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 3, predecessors: [] },
          { id: 'C', name: 'Task C', time: 4, predecessors: [] },
        ],
        cycleTime: 6,
      });

      expect(result).not.toBeNull();
      expect(result!.smoothnessIndex).toBeGreaterThanOrEqual(0);
    });

    it('should have zero smoothness index for perfectly balanced line', () => {
      const result = lineBalancing({
        tasks: [
          { id: 'A', name: 'Task A', time: 5, predecessors: [] },
          { id: 'B', name: 'Task B', time: 5, predecessors: [] },
        ],
        cycleTime: 5,
      });

      expect(result).not.toBeNull();
      expect(result!.smoothnessIndex).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should balance assembly line with complex dependencies', () => {
      const result = lineBalancing({
        tasks: [
          { id: '1', name: 'Receive parts', time: 2, predecessors: [] },
          { id: '2', name: 'Inspect parts', time: 3, predecessors: ['1'] },
          { id: '3', name: 'Prep A', time: 4, predecessors: ['2'] },
          { id: '4', name: 'Prep B', time: 3, predecessors: ['2'] },
          { id: '5', name: 'Assembly', time: 5, predecessors: ['3', '4'] },
          { id: '6', name: 'Test', time: 4, predecessors: ['5'] },
          { id: '7', name: 'Package', time: 3, predecessors: ['6'] },
        ],
        cycleTime: 8,
      });

      expect(result).not.toBeNull();
      expect(result!.numStations).toBeGreaterThan(0);
      expect(result!.lineEfficiency).toBeGreaterThan(0);
    });
  });
});
