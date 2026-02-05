import { describe, it, expect } from 'vitest';
import { rpn } from './rpn.js';

describe('rpn', () => {
  describe('basic RPN calculation', () => {
    it('should calculate RPN correctly', () => {
      // RPN = S × O × D = 5 × 4 × 3 = 60
      const result = rpn({
        severity: 5,
        occurrence: 4,
        detection: 3,
      });

      expect(result.rpn).toBe(60);
    });

    it('should return the input scores', () => {
      const result = rpn({
        severity: 7,
        occurrence: 5,
        detection: 6,
      });

      expect(result.severityScore).toBe(7);
      expect(result.occurrenceScore).toBe(5);
      expect(result.detectionScore).toBe(6);
      expect(result.rpn).toBe(210);
    });
  });

  describe('risk level classification', () => {
    it('should classify as low risk (RPN <= 50)', () => {
      const result = rpn({
        severity: 3,
        occurrence: 3,
        detection: 5,
      });

      expect(result.rpn).toBe(45);
      expect(result.riskLevel).toBe('low');
    });

    it('should classify as medium risk (50 < RPN <= 100)', () => {
      const result = rpn({
        severity: 5,
        occurrence: 4,
        detection: 4,
      });

      expect(result.rpn).toBe(80);
      expect(result.riskLevel).toBe('medium');
    });

    it('should classify as high risk (100 < RPN <= 200)', () => {
      const result = rpn({
        severity: 7,
        occurrence: 5,
        detection: 4,
      });

      expect(result.rpn).toBe(140);
      expect(result.riskLevel).toBe('high');
    });

    it('should classify as critical risk (RPN > 200)', () => {
      const result = rpn({
        severity: 9,
        occurrence: 6,
        detection: 5,
      });

      expect(result.rpn).toBe(270);
      expect(result.riskLevel).toBe('critical');
    });
  });

  describe('input clamping', () => {
    it('should clamp values below 1 to 1', () => {
      const result = rpn({
        severity: 0,
        occurrence: -5,
        detection: 0.5,
      });

      expect(result.severityScore).toBe(1);
      expect(result.occurrenceScore).toBe(1);
      expect(result.detectionScore).toBe(1);
      expect(result.rpn).toBe(1);
    });

    it('should clamp values above 10 to 10', () => {
      const result = rpn({
        severity: 15,
        occurrence: 12,
        detection: 100,
      });

      expect(result.severityScore).toBe(10);
      expect(result.occurrenceScore).toBe(10);
      expect(result.detectionScore).toBe(10);
      expect(result.rpn).toBe(1000);
    });

    it('should round decimal values', () => {
      const result = rpn({
        severity: 5.6,
        occurrence: 4.4,
        detection: 3.5,
      });

      expect(result.severityScore).toBe(6);
      expect(result.occurrenceScore).toBe(4);
      expect(result.detectionScore).toBe(4);
    });
  });

  describe('boundary values', () => {
    it('should calculate minimum RPN (1)', () => {
      const result = rpn({
        severity: 1,
        occurrence: 1,
        detection: 1,
      });

      expect(result.rpn).toBe(1);
      expect(result.riskLevel).toBe('low');
    });

    it('should calculate maximum RPN (1000)', () => {
      const result = rpn({
        severity: 10,
        occurrence: 10,
        detection: 10,
      });

      expect(result.rpn).toBe(1000);
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle boundary at 50', () => {
      const result = rpn({
        severity: 5,
        occurrence: 5,
        detection: 2,
      });

      expect(result.rpn).toBe(50);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle boundary at 100', () => {
      const result = rpn({
        severity: 5,
        occurrence: 5,
        detection: 4,
      });

      expect(result.rpn).toBe(100);
      expect(result.riskLevel).toBe('medium');
    });

    it('should handle boundary at 200', () => {
      const result = rpn({
        severity: 5,
        occurrence: 5,
        detection: 8,
      });

      expect(result.rpn).toBe(200);
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('real-world FMEA examples', () => {
    it('should evaluate critical safety issue', () => {
      // Brake failure - high severity, moderate occurrence, hard to detect
      const result = rpn({
        severity: 10,
        occurrence: 3,
        detection: 7,
      });

      expect(result.rpn).toBe(210);
      expect(result.riskLevel).toBe('critical');
    });

    it('should evaluate cosmetic defect', () => {
      // Minor scratch - low severity, common, easy to detect
      const result = rpn({
        severity: 2,
        occurrence: 6,
        detection: 2,
      });

      expect(result.rpn).toBe(24);
      expect(result.riskLevel).toBe('low');
    });
  });
});
