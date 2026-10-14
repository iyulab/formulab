import { describe, it, expect } from 'vitest';
import { boilerEfficiency } from './boilerEfficiency.js';
import { heatPump } from './heatPump.js';
import { insulationRoi } from './insulationRoi.js';
import { ledRoi } from './ledRoi.js';
import { motorEfficiency } from './motorEfficiency.js';
import { pfCorrection } from './pfCorrection.js';
import { powerCost } from './powerCost.js';
import { transformerLoss } from './transformerLoss.js';
import { vfdSavings } from './vfdSavings.js';
import { windOutput } from './windOutput.js';
import { carbonFootprint } from './carbonFootprint.js';

// A negative cost, rate, duration, power or heat value used to come back as a sign-flipped
// "result" (or, for a few functions, an all-zero sentinel). Each is now refused, and the
// zero/one boundary that the formula still supports is accepted.

describe('boilerEfficiency refuses negative physical inputs', () => {
  it('throws for a negative fuel rate, steam output or fuel cost', () => {
    expect(() => boilerEfficiency({ fuelRate: -1000, fuelHeatValue: 42000, steamOutput: 10000, steamEnthalpy: 2760, feedwaterEnthalpy: 420 })).toThrow(RangeError);
    expect(() => boilerEfficiency({ fuelRate: 1000, fuelHeatValue: 42000, steamOutput: -10000, steamEnthalpy: 2760, feedwaterEnthalpy: 420 })).toThrow(RangeError);
    expect(() => boilerEfficiency({ fuelRate: 1000, fuelHeatValue: 42000, steamOutput: 10000, steamEnthalpy: 2760, feedwaterEnthalpy: 420, operatingHours: 8000, fuelCost: -0.5 })).toThrow(RangeError);
  });
  it('accepts zero steam output (all input heat is lost)', () => {
    const r = boilerEfficiency({ fuelRate: 1000, fuelHeatValue: 36000, steamOutput: 0, steamEnthalpy: 2760, feedwaterEnthalpy: 420 });
    expect(r.efficiency).toBe(0);
    expect(r.heatLoss).toBe(10000);
  });
});

describe('heatPump refuses negative physical inputs', () => {
  it('throws for a negative capacity, auxiliary power or rate, and a boiler efficiency above 1', () => {
    expect(() => heatPump({ sourceTemp: 5, sinkTemp: 35, heatingCapacity: -10, compressorPower: 2.5 })).toThrow(RangeError);
    expect(() => heatPump({ sourceTemp: 5, sinkTemp: 35, heatingCapacity: 10, compressorPower: 2.5, auxiliaryPower: -0.5 })).toThrow(RangeError);
    expect(() => heatPump({ sourceTemp: 5, sinkTemp: 35, heatingCapacity: 10, compressorPower: 2.5, operatingHours: 2000, electricityRate: -0.15 })).toThrow(RangeError);
    expect(() => heatPump({ sourceTemp: 5, sinkTemp: 35, heatingCapacity: 10, compressorPower: 2.5, operatingHours: 2000, electricityRate: 0.15, boilerEfficiency: 85, fuelCost: 0.06 })).toThrow(RangeError);
  });
  it('accepts a boiler efficiency of exactly 1', () => {
    const r = heatPump({ sourceTemp: 5, sinkTemp: 35, heatingCapacity: 10, compressorPower: 2.5, operatingHours: 2000, electricityRate: 0.15, boilerEfficiency: 1, fuelCost: 0.06 });
    expect(r.cop).toBe(4);
    // 10 kW × 2000 h / 1.0 × 0.06 = 1200
    expect(r.annualFuelCost).toBe(1200);
  });
});

describe('insulationRoi refuses negative physical inputs', () => {
  it('throws for negative operating hours, energy cost or installation cost, and a boiler efficiency above 1', () => {
    expect(() => insulationRoi({ surfaceArea: 50, tempDifference: 150, insulationK: 0.04, insulationThickness: 50, operatingHours: -8000, energyCost: 0.05 })).toThrow(RangeError);
    expect(() => insulationRoi({ surfaceArea: 50, tempDifference: 150, insulationK: 0.04, insulationThickness: 50, operatingHours: 8000, energyCost: -0.05 })).toThrow(RangeError);
    expect(() => insulationRoi({ surfaceArea: 50, tempDifference: 150, insulationK: 0.04, insulationThickness: 50, operatingHours: 8000, energyCost: 0.05, installationCost: -5000 })).toThrow(RangeError);
    expect(() => insulationRoi({ surfaceArea: 50, tempDifference: 150, insulationK: 0.04, insulationThickness: 50, operatingHours: 8000, energyCost: 0.05, boilerEfficiency: 80 })).toThrow(RangeError);
  });
  it('accepts zero operating hours (no annual saving)', () => {
    const r = insulationRoi({ surfaceArea: 50, tempDifference: 150, insulationK: 0.04, insulationThickness: 50, operatingHours: 0, energyCost: 0.05 });
    expect(r.bareHeatLoss).toBe(75000);
    expect(r.annualEnergySaved).toBe(0);
  });
});

describe('ledRoi refuses negative physical inputs', () => {
  it('throws for a negative fixture count, wattage, rate or cost', () => {
    expect(() => ledRoi({ fixtureCount: -100, oldWatts: 250, newWatts: 100, operatingHours: 4000, electricityRate: 0.12 })).toThrow(RangeError);
    expect(() => ledRoi({ fixtureCount: 100, oldWatts: 250, newWatts: -100, operatingHours: 4000, electricityRate: 0.12 })).toThrow(RangeError);
    expect(() => ledRoi({ fixtureCount: 100, oldWatts: 250, newWatts: 100, operatingHours: 4000, electricityRate: -0.12 })).toThrow(RangeError);
    expect(() => ledRoi({ fixtureCount: 100, oldWatts: 250, newWatts: 100, operatingHours: 4000, electricityRate: 0.12, fixtureCost: -50 })).toThrow(RangeError);
  });
  it('accepts a single fixture at a zero rate', () => {
    const r = ledRoi({ fixtureCount: 1, oldWatts: 250, newWatts: 100, operatingHours: 4000, electricityRate: 0 });
    // (250 − 100) W × 4000 h / 1000 = 600 kWh
    expect(r.annualEnergySaved).toBe(600);
    expect(r.annualCostSaved).toBe(0);
  });
});

describe('motorEfficiency refuses negative physical inputs', () => {
  it('throws for a negative power, hours or rate, and an efficiency or load factor above 1', () => {
    expect(() => motorEfficiency({ motorPower: -100, runningHours: 6000, currentEfficiency: 0.9, newEfficiency: 0.95, electricityRate: 0.1, loadFactor: 0.75 })).toThrow(RangeError);
    expect(() => motorEfficiency({ motorPower: 100, runningHours: -6000, currentEfficiency: 0.9, newEfficiency: 0.95, electricityRate: 0.1, loadFactor: 0.75 })).toThrow(RangeError);
    expect(() => motorEfficiency({ motorPower: 100, runningHours: 6000, currentEfficiency: 0.9, newEfficiency: 0.95, electricityRate: -0.1, loadFactor: 0.75 })).toThrow(RangeError);
    expect(() => motorEfficiency({ motorPower: 100, runningHours: 6000, currentEfficiency: 90, newEfficiency: 0.95, electricityRate: 0.1, loadFactor: 0.75 })).toThrow(RangeError);
    expect(() => motorEfficiency({ motorPower: 100, runningHours: 6000, currentEfficiency: 0.9, newEfficiency: 0.95, electricityRate: 0.1, loadFactor: 1.5 })).toThrow(RangeError);
  });
  it('accepts a new efficiency of exactly 1 at full load', () => {
    const r = motorEfficiency({ motorPower: 100, runningHours: 1000, currentEfficiency: 0.8, newEfficiency: 1, electricityRate: 0.1, loadFactor: 1 });
    // current: 100 × 1000 / 0.8 × 0.1 = 12500; new: 100 × 1000 / 1 × 0.1 = 10000
    expect(r.currentAnnualCost).toBe(12500);
    expect(r.annualSavings).toBe(2500);
  });
});

describe('pfCorrection refuses negative physical inputs', () => {
  it('throws for a negative power, hours or cost, and a penalty threshold above 1', () => {
    expect(() => pfCorrection({ kW: -100, currentPf: 0.8, targetPf: 0.95, electricityRate: 0.12, monthlyUsageHours: 720, pfPenaltyRate: 0.05, pfPenaltyThreshold: 0.9, capacitorCostPerKvar: 40 })).toThrow(RangeError);
    expect(() => pfCorrection({ kW: 100, currentPf: 0.8, targetPf: 0.95, electricityRate: 0.12, monthlyUsageHours: -720, pfPenaltyRate: 0.05, pfPenaltyThreshold: 0.9, capacitorCostPerKvar: 40 })).toThrow(RangeError);
    expect(() => pfCorrection({ kW: 100, currentPf: 0.8, targetPf: 0.95, electricityRate: 0.12, monthlyUsageHours: 720, pfPenaltyRate: 0.05, pfPenaltyThreshold: 0.9, capacitorCostPerKvar: -40 })).toThrow(RangeError);
    expect(() => pfCorrection({ kW: 100, currentPf: 0.8, targetPf: 0.95, electricityRate: 0.12, monthlyUsageHours: 720, pfPenaltyRate: 0.05, pfPenaltyThreshold: 90, capacitorCostPerKvar: 40 })).toThrow(RangeError);
  });
  it('accepts a target power factor of exactly 1', () => {
    const r = pfCorrection({ kW: 100, currentPf: 0.8, targetPf: 1, electricityRate: 0.12, monthlyUsageHours: 720, pfPenaltyRate: 0.05, pfPenaltyThreshold: 0.9, capacitorCostPerKvar: 40 });
    // kVAR = 100 × (tan(acos 0.8) − tan(acos 1)) = 100 × 0.75 = 75
    expect(r.kvarRequired).toBeCloseTo(75, 6);
    expect(r.targetKva).toBe(100);
  });
});

describe('powerCost refuses negative physical inputs', () => {
  it('throws for a negative consumption, peak or charge, and a power factor above 1', () => {
    expect(() => powerCost({ energyConsumption: -10000, energyRate: 0.12, demandPeak: 100, demandRate: 10, powerFactor: 0.95, pfPenaltyThreshold: 0.9, pfPenaltyRate: 0.01, fixedCharges: 100 })).toThrow(RangeError);
    expect(() => powerCost({ energyConsumption: 10000, energyRate: 0.12, demandPeak: -100, demandRate: 10, powerFactor: 0.95, pfPenaltyThreshold: 0.9, pfPenaltyRate: 0.01, fixedCharges: 100 })).toThrow(RangeError);
    expect(() => powerCost({ energyConsumption: 10000, energyRate: 0.12, demandPeak: 100, demandRate: 10, powerFactor: 0.95, pfPenaltyThreshold: 0.9, pfPenaltyRate: 0.01, fixedCharges: -100 })).toThrow(RangeError);
    expect(() => powerCost({ energyConsumption: 10000, energyRate: 0.12, demandPeak: 100, demandRate: 10, powerFactor: 95, pfPenaltyThreshold: 0.9, pfPenaltyRate: 0.01, fixedCharges: 100 })).toThrow(RangeError);
  });
  it('accepts a power factor of exactly 1', () => {
    const r = powerCost({ energyConsumption: 10000, energyRate: 0.12, demandPeak: 100, demandRate: 10, powerFactor: 1, pfPenaltyThreshold: 0.9, pfPenaltyRate: 0.01, fixedCharges: 100 });
    // 10000 × 0.12 + 100 × 10 + 0 + 100 = 2300
    expect(r.pfPenalty).toBe(0);
    expect(r.totalCost).toBeCloseTo(2300, 6);
  });
});

describe('transformerLoss refuses negative physical inputs', () => {
  it('throws for a negative capacity, loss or cost, and a load fraction or power factor above 1', () => {
    expect(() => transformerLoss({ ratedCapacity: -1000, coreLoss: 1800, copperLoss: 10500, loadFraction: 0.75 })).toThrow(RangeError);
    expect(() => transformerLoss({ ratedCapacity: 1000, coreLoss: -1800, copperLoss: 10500, loadFraction: 0.75 })).toThrow(RangeError);
    expect(() => transformerLoss({ ratedCapacity: 1000, coreLoss: 1800, copperLoss: 10500, loadFraction: 75 })).toThrow(RangeError);
    expect(() => transformerLoss({ ratedCapacity: 1000, coreLoss: 1800, copperLoss: 10500, loadFraction: 0.75, powerFactor: 85 })).toThrow(RangeError);
    expect(() => transformerLoss({ ratedCapacity: 1000, coreLoss: 1800, copperLoss: 10500, loadFraction: 0.75, operatingHours: 8760, energyCost: -0.1 })).toThrow(RangeError);
  });
  it('accepts a load fraction of exactly 1', () => {
    const r = transformerLoss({ ratedCapacity: 1000, coreLoss: 1800, copperLoss: 10500, loadFraction: 1, powerFactor: 1 });
    // output 1,000,000 W, losses 1800 + 10500 = 12300 W
    expect(r.outputPower).toBe(1000000);
    expect(r.totalLoss).toBe(12300);
  });
});

describe('vfdSavings refuses negative physical inputs', () => {
  it('throws for a negative speed, hours, rate or cost, and an efficiency or load factor above 1', () => {
    expect(() => vfdSavings({ motorKw: 75, fullSpeedRpm: 1800, newSpeedRpm: -1200, runningHoursPerYear: 6000, electricityRate: 0.12, loadFactor: 0.85, vfdCost: 8000, vfdEfficiency: 0.97 })).toThrow(RangeError);
    expect(() => vfdSavings({ motorKw: 75, fullSpeedRpm: 1800, newSpeedRpm: 1200, runningHoursPerYear: -6000, electricityRate: 0.12, loadFactor: 0.85, vfdCost: 8000, vfdEfficiency: 0.97 })).toThrow(RangeError);
    expect(() => vfdSavings({ motorKw: 75, fullSpeedRpm: 1800, newSpeedRpm: 1200, runningHoursPerYear: 6000, electricityRate: 0.12, loadFactor: 0.85, vfdCost: -8000, vfdEfficiency: 0.97 })).toThrow(RangeError);
    expect(() => vfdSavings({ motorKw: 75, fullSpeedRpm: 1800, newSpeedRpm: 1200, runningHoursPerYear: 6000, electricityRate: 0.12, loadFactor: 0.85, vfdCost: 8000, vfdEfficiency: 97 })).toThrow(RangeError);
  });
  it('accepts a stopped motor (zero new speed)', () => {
    const r = vfdSavings({ motorKw: 100, fullSpeedRpm: 1800, newSpeedRpm: 0, runningHoursPerYear: 1000, electricityRate: 0.1, loadFactor: 1, vfdCost: 5000, vfdEfficiency: 1 });
    expect(r.newPowerKw).toBe(0);
    // 100 kW × 1000 h × 0.1 = 10000
    expect(r.annualSavings).toBe(10000);
  });
});

describe('windOutput refuses negative physical inputs', () => {
  it('throws for a negative rating, wind speed, rotor diameter, and a zero rated speed', () => {
    expect(() => windOutput({ ratedPower: -2000, hubHeight: 80, averageWindSpeed: 7.5 })).toThrow(RangeError);
    expect(() => windOutput({ ratedPower: 2000, hubHeight: 80, averageWindSpeed: -7.5 })).toThrow(RangeError);
    expect(() => windOutput({ ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7.5, rotorDiameter: -90 })).toThrow(RangeError);
    expect(() => windOutput({ ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7.5, ratedSpeed: 0 })).toThrow(RangeError);
    expect(() => windOutput({ ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7.5, cutInSpeed: -3 })).toThrow(RangeError);
  });
  it('accepts a zero roughness exponent (no wind shear)', () => {
    const r = windOutput({ ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7.5, terrainRoughness: 0 });
    expect(r.adjustedWindSpeed).toBe(7.5);
  });
});

describe('carbonFootprint refuses negative physical inputs', () => {
  it('throws for a negative emission factor', () => {
    expect(() => carbonFootprint({ electricityUsage: 1000, emissionFactor: -500 })).toThrow(RangeError);
  });
  it('accepts a zero emission factor', () => {
    const r = carbonFootprint({ electricityUsage: 1000, emissionFactor: 0 });
    expect(r.co2Kg).toBe(0);
  });
});

describe('boilerEfficiency — a heat balance that cannot close', () => {
  it('throws when the steam carries more heat than the fuel supplies, or the steam enthalpy is below the feedwater', () => {
    expect(() => boilerEfficiency({ fuelRate: 100, fuelHeatValue: 40000, steamOutput: 2000, steamEnthalpy: 2800, feedwaterEnthalpy: 420 })).toThrow(RangeError);
    expect(() => boilerEfficiency({ fuelRate: 100, fuelHeatValue: 40000, steamOutput: 1000, steamEnthalpy: 400, feedwaterEnthalpy: 420 })).toThrow(RangeError);
  });
});
