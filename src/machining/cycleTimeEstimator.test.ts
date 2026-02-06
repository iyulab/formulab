import { describe, it, expect } from 'vitest';
import { cycleTimeEstimator } from './cycleTimeEstimator.js';

describe('cycleTimeEstimator', () => {
  it('should calculate simple cutting time', () => {
    const result = cycleTimeEstimator({
      operations: [
        { type: 'cutting', distance: 100, feedRate: 200 }, // 100mm at 200mm/min = 0.5min = 30s
      ],
    });

    expect(result.cuttingTime).toBe(30);
    expect(result.cycleTime).toBe(30);
    expect(result.utilization).toBe(100);
  });

  it('should calculate rapid traverse time', () => {
    const result = cycleTimeEstimator({
      operations: [
        { type: 'rapid', distance: 500 }, // 500mm at 10000mm/min = 0.05min = 3s
      ],
    });

    expect(result.rapidTime).toBe(3);
    expect(result.cuttingTime).toBe(0);
    expect(result.utilization).toBe(0);
  });

  it('should calculate mixed operations', () => {
    const result = cycleTimeEstimator({
      operations: [
        { type: 'rapid', distance: 200 },                  // 200/10000*60 = 1.2s
        { type: 'cutting', distance: 150, feedRate: 300 },  // 150/300*60 = 30s
        { type: 'toolChange', time: 5 },                    // 5s
        { type: 'cutting', distance: 100, feedRate: 200 },  // 100/200*60 = 30s
        { type: 'rapid', distance: 300 },                   // 300/10000*60 = 1.8s
        { type: 'dwell', time: 2 },                         // 2s
      ],
    });

    expect(result.cuttingTime).toBe(60);
    expect(result.rapidTime).toBe(3);
    expect(result.toolChangeTime).toBe(5);
    expect(result.dwellTime).toBe(2);
    expect(result.cycleTime).toBe(70);
  });

  it('should account for setup time and part count', () => {
    const result = cycleTimeEstimator({
      operations: [
        { type: 'cutting', distance: 100, feedRate: 600 }, // 100/600*60 = 10s
      ],
      setupTime: 300,  // 5 minutes
      partCount: 10,
    });

    expect(result.cycleTime).toBe(10);
    // total = 300 + 10 × 10 = 400s
    expect(result.totalTime).toBe(400);
  });

  it('should handle custom rapid rate', () => {
    const result = cycleTimeEstimator({
      operations: [
        { type: 'rapid', distance: 500, rapidRate: 5000 }, // 500/5000*60 = 6s
      ],
    });

    expect(result.rapidTime).toBe(6);
  });

  it('should calculate utilization percentage', () => {
    const result = cycleTimeEstimator({
      operations: [
        { type: 'cutting', distance: 100, feedRate: 100 },  // 60s
        { type: 'rapid', distance: 1000 },                   // 6s
        { type: 'toolChange', time: 4 },                     // 4s
      ],
    });

    // utilization = 60 / 70 × 100 = 85.71%
    expect(result.utilization).toBeCloseTo(85.71, 1);
  });

  it('should default partCount to 1', () => {
    const result = cycleTimeEstimator({
      operations: [
        { type: 'cutting', distance: 100, feedRate: 600 },
      ],
    });

    expect(result.totalTime).toBe(result.cycleTime);
  });
});
