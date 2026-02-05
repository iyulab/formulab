import { describe, it, expect } from 'vitest';
import { solderPaste } from './solder.js';

describe('solderPaste', () => {
  describe('volume per board calculation', () => {
    it('should calculate volume correctly', () => {
      const result = solderPaste({
        padCount: 100,
        avgPadArea: 0.5, // mm²
        stencilThickness: 0.12, // mm
        transferEfficiency: 0.85,
        density: 7.4, // g/cm³ for SAC305
        boardsPerPanel: 1,
        panelCount: 1,
      });

      // Volume = 100 × 0.5 × 0.12 × 0.85 = 5.1 mm³
      expect(result.volumePerBoard).toBeCloseTo(5.1, 1);
    });

    it('should account for transfer efficiency', () => {
      const full = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 1.0,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      const partial = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 0.80,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(partial.volumePerBoard).toBeCloseTo(full.volumePerBoard * 0.8, 4);
    });
  });

  describe('weight per board calculation', () => {
    it('should calculate weight correctly', () => {
      const result = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 7.4, // g/cm³
        boardsPerPanel: 1,
        panelCount: 1,
      });

      // Weight = volume × density / 1000 = 5.1 × 7.4 / 1000 = 0.0377 g
      expect(result.weightPerBoard).toBeCloseTo(0.0377, 3);
    });

    it('should increase with higher density paste', () => {
      const lowDensity = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 5.0,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      const highDensity = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 8.0,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(highDensity.weightPerBoard).toBeGreaterThan(lowDensity.weightPerBoard);
    });
  });

  describe('total volume and weight', () => {
    it('should multiply by boards per panel', () => {
      const result = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 4,
        panelCount: 1,
      });

      expect(result.totalVolume).toBeCloseTo(result.volumePerBoard * 4, 3);
      expect(result.totalWeight).toBeCloseTo(result.weightPerBoard * 4, 3);
    });

    it('should multiply by panel count', () => {
      const result = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 100,
      });

      expect(result.totalVolume).toBeCloseTo(result.volumePerBoard * 100, 2);
    });

    it('should calculate total weight in kg', () => {
      const result = solderPaste({
        padCount: 500,
        avgPadArea: 1.0,
        stencilThickness: 0.15,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 4,
        panelCount: 1000,
      });

      expect(result.totalWeightKg).toBeCloseTo(result.totalWeight / 1000, 3);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero pad count', () => {
      const result = solderPaste({
        padCount: 0,
        avgPadArea: 0.5,
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(result.volumePerBoard).toBe(0);
      expect(result.weightPerBoard).toBe(0);
    });

    it('should return zeros for zero stencil thickness', () => {
      const result = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(result.volumePerBoard).toBe(0);
    });

    it('should handle very small pads', () => {
      const result = solderPaste({
        padCount: 500,
        avgPadArea: 0.1, // 0201 components
        stencilThickness: 0.08,
        transferEfficiency: 0.80,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(result.volumePerBoard).toBeGreaterThan(0);
      expect(result.volumePerBoard).toBeLessThan(10);
    });
  });

  describe('stencil thickness variations', () => {
    it('should calculate for thin stencil (0.08mm)', () => {
      const result = solderPaste({
        padCount: 200,
        avgPadArea: 0.3,
        stencilThickness: 0.08,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(result.volumePerBoard).toBeGreaterThan(0);
    });

    it('should calculate for thick stencil (0.20mm)', () => {
      const result = solderPaste({
        padCount: 50,
        avgPadArea: 2.0,
        stencilThickness: 0.20,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(result.volumePerBoard).toBeGreaterThan(0);
    });

    it('should show thicker stencil uses more paste', () => {
      const thin = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.10,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      const thick = solderPaste({
        padCount: 100,
        avgPadArea: 0.5,
        stencilThickness: 0.15,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 1,
      });

      expect(thick.volumePerBoard).toBeGreaterThan(thin.volumePerBoard);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for simple PCB (50 components)', () => {
      const result = solderPaste({
        padCount: 150, // ~3 pads per component
        avgPadArea: 0.6,
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 500,
      });

      expect(result.totalWeightKg).toBeLessThan(1);
    });

    it('should calculate for complex PCB (500 components)', () => {
      const result = solderPaste({
        padCount: 1500,
        avgPadArea: 0.4,
        stencilThickness: 0.10,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 2,
        panelCount: 1000,
      });

      expect(result.totalWeightKg).toBeGreaterThan(0.5);
    });

    it('should calculate for BGA-heavy board', () => {
      const result = solderPaste({
        padCount: 800, // Multiple BGAs
        avgPadArea: 0.25, // Small BGA balls
        stencilThickness: 0.12,
        transferEfficiency: 0.85,
        density: 7.4,
        boardsPerPanel: 1,
        panelCount: 100,
      });

      // 800 × 0.25 × 0.12 × 0.85 = 20.4 mm³/board × 7.4 / 1000 = 0.151 g/board
      // Total = 0.151 × 100 = 15.1 g
      expect(result.totalWeight).toBeGreaterThan(10);
    });
  });
});
