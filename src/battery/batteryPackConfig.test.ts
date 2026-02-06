import { describe, it, expect } from 'vitest';
import { batteryPackConfig } from './batteryPackConfig.js';

describe('batteryPackConfig', () => {
  it('should calculate basic pack config: 48V/100Ah from 3.2V/50Ah LFP cells', () => {
    // S = ceil(48/3.2) = 15, P = ceil(100/50) = 2
    const result = batteryPackConfig({
      cellVoltage: 3.2,
      cellCapacityAh: 50,
      targetVoltage: 48,
      targetCapacityAh: 100,
    });
    expect(result.seriesCells).toBe(15);
    expect(result.parallelCells).toBe(2);
    expect(result.totalCells).toBe(30);
    expect(result.actualVoltage).toBeCloseTo(48, 1);
    expect(result.actualCapacityAh).toBeCloseTo(100, 1);
    expect(result.totalEnergyWh).toBeCloseTo(4800, 0);
    expect(result.totalEnergyKWh).toBeCloseTo(4.8, 2);
  });

  it('should round up series cells: 400V from 3.7V NMC', () => {
    // S = ceil(400/3.7) = ceil(108.11) = 109
    const result = batteryPackConfig({
      cellVoltage: 3.7,
      cellCapacityAh: 50,
      targetVoltage: 400,
      targetCapacityAh: 50,
    });
    expect(result.seriesCells).toBe(109);
    expect(result.parallelCells).toBe(1);
    expect(result.actualVoltage).toBeCloseTo(403.3, 1);
  });

  it('should round up parallel cells: 200Ah from 60Ah cells', () => {
    // P = ceil(200/60) = ceil(3.33) = 4
    const result = batteryPackConfig({
      cellVoltage: 3.6,
      cellCapacityAh: 60,
      targetVoltage: 36,
      targetCapacityAh: 200,
    });
    expect(result.seriesCells).toBe(10);
    expect(result.parallelCells).toBe(4);
    expect(result.totalCells).toBe(40);
    expect(result.actualCapacityAh).toBeCloseTo(240, 1);
  });

  it('should handle exact division: 12V/100Ah from 3V/100Ah cells', () => {
    const result = batteryPackConfig({
      cellVoltage: 3,
      cellCapacityAh: 100,
      targetVoltage: 12,
      targetCapacityAh: 100,
    });
    expect(result.seriesCells).toBe(4);
    expect(result.parallelCells).toBe(1);
    expect(result.totalCells).toBe(4);
  });

  it('should calculate EV pack: 400V/75kWh from 3.7V/5Ah 21700 cells', () => {
    // S = ceil(400/3.7) = 109, need 75000Wh / (109*3.7) = ~186Ah, P = ceil(186/5) = 38
    const result = batteryPackConfig({
      cellVoltage: 3.7,
      cellCapacityAh: 5,
      targetVoltage: 400,
      targetCapacityAh: 186,
    });
    expect(result.seriesCells).toBe(109);
    expect(result.parallelCells).toBe(38);
    expect(result.totalCells).toBe(4142);
  });
});
