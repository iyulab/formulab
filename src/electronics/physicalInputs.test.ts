import { describe, it, expect } from 'vitest';
import { solderPaste } from './solder.js';

// A negative physical quantity has no meaning; returning a sign-flipped "result" for it presents
// garbage as a calculation. Each function refuses it, and accepts the domain boundary.
describe('electronics: physical input domains', () => {
  it('solderPaste refuses any input that is not greater than 0', () => {
    expect(() => solderPaste({ padCount: 500, avgPadArea: 1.2, stencilThickness: 0.12, transferEfficiency: 0.85, density: -7.4, boardsPerPanel: 1, panelCount: 100 })).toThrow(RangeError);
    expect(() => solderPaste({ padCount: 500, avgPadArea: -1.2, stencilThickness: 0.12, transferEfficiency: 0.85, density: 7.4, boardsPerPanel: 1, panelCount: 100 })).toThrow(RangeError);
    expect(() => solderPaste({ padCount: 500, avgPadArea: 1.2, stencilThickness: 0.12, transferEfficiency: 0, density: 7.4, boardsPerPanel: 1, panelCount: 100 })).toThrow(RangeError);
    expect(() => solderPaste({ padCount: 500, avgPadArea: 1.2, stencilThickness: 0.12, transferEfficiency: 0.85, density: 7.4, boardsPerPanel: 1, panelCount: -100 })).toThrow(RangeError);
    // 1 pad × 1 mm² × 0.1 mm × 1 = 0.1 mm³; × 8 g/cm³ / 1000 = 0.0008 g
    const r = solderPaste({ padCount: 1, avgPadArea: 1, stencilThickness: 0.1, transferEfficiency: 1, density: 8, boardsPerPanel: 1, panelCount: 1 });
    expect(r.volumePerBoard).toBe(0.1);
    expect(r.weightPerBoard).toBe(0.0008);
  });
});
