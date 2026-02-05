import { describe, it, expect } from 'vitest';
import { mtbf } from './mtbf.js';

describe('mtbf', () => {
  describe('basic calculations', () => {
    it('should calculate MTBF and MTTR', () => {
      const result = mtbf({
        totalOperatingTime: 10000,  // hours
        totalRepairTime: 200,       // hours
        numberOfFailures: 10,
      });

      // MTBF = 10000 / 10 = 1000 hours
      expect(result.mtbf).toBe(1000);
      // MTTR = 200 / 10 = 20 hours
      expect(result.mttr).toBe(20);
    });

    it('should calculate availability', () => {
      const result = mtbf({
        totalOperatingTime: 1000,
        totalRepairTime: 100,
        numberOfFailures: 10,
      });

      // MTBF = 100, MTTR = 10
      // Availability = 100 / (100 + 10) = 90.91%
      expect(result.availability).toBeCloseTo(90.91, 1);
    });

    it('should calculate failure rate', () => {
      const result = mtbf({
        totalOperatingTime: 5000,
        totalRepairTime: 50,
        numberOfFailures: 5,
      });

      // MTBF = 1000
      // Failure rate = 1/1000 = 0.001
      expect(result.mtbf).toBe(1000);
      expect(result.failureRate).toBe(0.001);
    });

    it('should calculate reliability at MTBF', () => {
      const result = mtbf({
        totalOperatingTime: 1000,
        totalRepairTime: 100,
        numberOfFailures: 10,
      });

      // Reliability at T=MTBF is always e^(-1) = 36.79%
      expect(result.reliabilityAtMtbf).toBeCloseTo(36.79, 1);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for industrial equipment', () => {
      // Machine operated for 8760 hours (1 year), 4 failures, 40 hours total repair
      const result = mtbf({
        totalOperatingTime: 8760,
        totalRepairTime: 40,
        numberOfFailures: 4,
      });

      // MTBF = 8760 / 4 = 2190 hours
      expect(result.mtbf).toBe(2190);
      // MTTR = 40 / 4 = 10 hours
      expect(result.mttr).toBe(10);
      // Availability = 2190 / (2190 + 10) = 99.54%
      expect(result.availability).toBeCloseTo(99.55, 0);
    });

    it('should calculate for server uptime', () => {
      // Server running for 2 years (17520 hours), 2 outages, 4 hours total downtime
      const result = mtbf({
        totalOperatingTime: 17520,
        totalRepairTime: 4,
        numberOfFailures: 2,
      });

      // MTBF = 17520 / 2 = 8760 hours (1 year between failures)
      expect(result.mtbf).toBe(8760);
      // MTTR = 4 / 2 = 2 hours
      expect(result.mttr).toBe(2);
      // Very high availability
      expect(result.availability).toBeGreaterThan(99.9);
    });
  });

  describe('high reliability', () => {
    it('should handle single failure over long period', () => {
      const result = mtbf({
        totalOperatingTime: 100000,  // 100k hours
        totalRepairTime: 8,
        numberOfFailures: 1,
      });

      expect(result.mtbf).toBe(100000);
      expect(result.mttr).toBe(8);
      expect(result.failureRate).toBe(0.00001);
      expect(result.availability).toBeGreaterThanOrEqual(99.99);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero operating time', () => {
      const result = mtbf({
        totalOperatingTime: 0,
        totalRepairTime: 10,
        numberOfFailures: 5,
      });

      expect(result.mtbf).toBe(0);
      expect(result.mttr).toBe(0);
      expect(result.availability).toBe(0);
      expect(result.failureRate).toBe(0);
    });

    it('should return zeros for zero failures', () => {
      const result = mtbf({
        totalOperatingTime: 1000,
        totalRepairTime: 0,
        numberOfFailures: 0,
      });

      expect(result.mtbf).toBe(0);
      expect(result.mttr).toBe(0);
    });

    it('should return zeros for negative operating time', () => {
      const result = mtbf({
        totalOperatingTime: -1000,
        totalRepairTime: 100,
        numberOfFailures: 10,
      });

      expect(result.mtbf).toBe(0);
    });

    it('should handle zero repair time', () => {
      const result = mtbf({
        totalOperatingTime: 1000,
        totalRepairTime: 0,
        numberOfFailures: 5,
      });

      // MTBF = 200, MTTR = 0
      // Availability = 200 / (200 + 0) = 100%
      expect(result.mtbf).toBe(200);
      expect(result.mttr).toBe(0);
      expect(result.availability).toBe(100);
    });
  });

  describe('availability benchmarks', () => {
    it('should calculate 99% availability (two nines)', () => {
      // To achieve 99% availability: MTBF / (MTBF + MTTR) = 0.99
      // If MTTR = 1, then MTBF = 99
      const result = mtbf({
        totalOperatingTime: 9900,
        totalRepairTime: 100,
        numberOfFailures: 100,
      });

      // MTBF = 99, MTTR = 1
      expect(result.availability).toBe(99);
    });

    it('should calculate 99.9% availability (three nines)', () => {
      // MTBF / (MTBF + MTTR) = 0.999
      // If MTTR = 1, then MTBF = 999
      const result = mtbf({
        totalOperatingTime: 999,
        totalRepairTime: 1,
        numberOfFailures: 1,
      });

      expect(result.availability).toBeCloseTo(99.9, 0);
    });
  });
});
