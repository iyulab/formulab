import { describe, it, expect } from 'vitest';
import { productCarbonFootprint } from './productCarbonFootprint.js';

describe('productCarbonFootprint', () => {
  it('should calculate total and per-unit footprint', () => {
    const result = productCarbonFootprint({
      stages: [
        { name: 'rawMaterials', co2Kg: 500 },
        { name: 'manufacturing', co2Kg: 300 },
        { name: 'transport', co2Kg: 100 },
        { name: 'endOfLife', co2Kg: 100 },
      ],
      productionQuantity: 1000,
    });
    expect(result.totalCo2Kg).toBeCloseTo(1000, 0);
    expect(result.perUnitCo2Kg).toBeCloseTo(1.0, 2);
  });

  it('should identify dominant stage', () => {
    const result = productCarbonFootprint({
      stages: [
        { name: 'materials', co2Kg: 200 },
        { name: 'production', co2Kg: 800 },
        { name: 'distribution', co2Kg: 50 },
      ],
      productionQuantity: 100,
    });
    expect(result.dominantStage).toBe('production');
  });

  it('should calculate percentage breakdown', () => {
    const result = productCarbonFootprint({
      stages: [
        { name: 'raw', co2Kg: 400 },
        { name: 'mfg', co2Kg: 600 },
      ],
      productionQuantity: 50,
    });
    expect(result.stageBreakdown[0].percent).toBeCloseTo(40, 0);
    expect(result.stageBreakdown[1].percent).toBeCloseTo(60, 0);
  });

  it('should handle single stage', () => {
    const result = productCarbonFootprint({
      stages: [{ name: 'total', co2Kg: 5000 }],
      productionQuantity: 500,
    });
    expect(result.perUnitCo2Kg).toBeCloseTo(10, 2);
    expect(result.stageBreakdown[0].percent).toBeCloseTo(100, 0);
    expect(result.dominantStage).toBe('total');
  });

  it('should handle EV battery lifecycle', () => {
    const result = productCarbonFootprint({
      stages: [
        { name: 'mining', co2Kg: 3000 },
        { name: 'cellProduction', co2Kg: 5000 },
        { name: 'packAssembly', co2Kg: 1000 },
        { name: 'transport', co2Kg: 500 },
        { name: 'recycling', co2Kg: -200 }, // credit
      ],
      productionQuantity: 100,
    });
    // Total = 3000 + 5000 + 1000 + 500 - 200 = 9300
    expect(result.totalCo2Kg).toBeCloseTo(9300, 0);
    expect(result.perUnitCo2Kg).toBeCloseTo(93, 0);
  });
});
