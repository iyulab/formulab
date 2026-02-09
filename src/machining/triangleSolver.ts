import { roundTo } from '../utils.js';
import type { TriangleSolverInput, TriangleSolverResult } from './types.js';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/**
 * Solve a triangle given at least 3 known values (sides/angles).
 *
 * Supported cases:
 * - SSS: three sides → law of cosines
 * - SAS: two sides + included angle → law of cosines
 * - ASA/AAS: two angles + one side → law of sines
 * - SSA: two sides + non-included angle → law of sines (ambiguous case)
 *
 * @formula
 *   Law of cosines: c² = a² + b² − 2ab·cos(C)
 *   Law of sines: a/sin(A) = b/sin(B) = c/sin(C)
 *   Area (Heron): √(s(s−a)(s−b)(s−c)), s = (a+b+c)/2
 *
 * @throws {RangeError} No valid triangle exists
 * @throws {RangeError} Insufficient data to solve triangle
 * @param input - Triangle sides and/or angles (degrees)
 * @returns TriangleSolverResult with all sides, angles, area, and perimeter
 */
export function triangleSolver(input: TriangleSolverInput): TriangleSolverResult {
  let { a, b, c, A, B, C } = input;

  // Count known values
  const knownSides = [a, b, c].filter(v => v !== undefined).length;
  const knownAngles = [A, B, C].filter(v => v !== undefined).length;

  // If two angles known, compute the third
  if (knownAngles === 2) {
    if (A === undefined) A = 180 - B! - C!;
    else if (B === undefined) B = 180 - A - C!;
    else if (C === undefined) C = 180 - A - B;
  }

  // SSS: three sides known
  if (knownSides === 3 && a !== undefined && b !== undefined && c !== undefined) {
    A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * RAD;
    B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * RAD;
    C = 180 - A - B;
  }
  // SAS: two sides + included angle
  else if (knownSides === 2 && knownAngles >= 1) {
    if (a !== undefined && b !== undefined && C !== undefined) {
      c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * DEG));
      A = Math.asin((a * Math.sin(C * DEG)) / c) * RAD;
      B = 180 - A - C;
    } else if (a !== undefined && c !== undefined && B !== undefined) {
      b = Math.sqrt(a * a + c * c - 2 * a * c * Math.cos(B * DEG));
      A = Math.asin((a * Math.sin(B * DEG)) / b) * RAD;
      C = 180 - A - B;
    } else if (b !== undefined && c !== undefined && A !== undefined) {
      a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A * DEG));
      B = Math.asin((b * Math.sin(A * DEG)) / a) * RAD;
      C = 180 - A - B;
    }
    // SSA (ambiguous): two sides + non-included angle
    else if (a !== undefined && b !== undefined && A !== undefined) {
      const sinB = (b * Math.sin(A * DEG)) / a;
      if (sinB > 1) throw new Error('No valid triangle exists');
      B = Math.asin(sinB) * RAD;
      C = 180 - A - B;
      c = (a * Math.sin(C * DEG)) / Math.sin(A * DEG);
    } else if (a !== undefined && c !== undefined && A !== undefined) {
      const sinC = (c * Math.sin(A * DEG)) / a;
      if (sinC > 1) throw new Error('No valid triangle exists');
      C = Math.asin(sinC) * RAD;
      B = 180 - A - C;
      b = (a * Math.sin(B * DEG)) / Math.sin(A * DEG);
    } else if (b !== undefined && c !== undefined && B !== undefined) {
      const sinC = (c * Math.sin(B * DEG)) / b;
      if (sinC > 1) throw new Error('No valid triangle exists');
      C = Math.asin(sinC) * RAD;
      A = 180 - B - C;
      a = (b * Math.sin(A * DEG)) / Math.sin(B * DEG);
    }
  }
  // ASA/AAS: two angles + one side (third angle already computed above)
  else if (knownSides === 1 && knownAngles >= 2) {
    if (A !== undefined && B !== undefined && C !== undefined) {
      if (a !== undefined) {
        b = (a * Math.sin(B * DEG)) / Math.sin(A * DEG);
        c = (a * Math.sin(C * DEG)) / Math.sin(A * DEG);
      } else if (b !== undefined) {
        a = (b * Math.sin(A * DEG)) / Math.sin(B * DEG);
        c = (b * Math.sin(C * DEG)) / Math.sin(B * DEG);
      } else if (c !== undefined) {
        a = (c * Math.sin(A * DEG)) / Math.sin(C * DEG);
        b = (c * Math.sin(B * DEG)) / Math.sin(C * DEG);
      }
    }
  }

  if (a === undefined || b === undefined || c === undefined ||
      A === undefined || B === undefined || C === undefined) {
    throw new Error('Insufficient data to solve triangle');
  }

  // Heron's formula for area
  const s = (a + b + c) / 2;
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

  return {
    a: roundTo(a, 4),
    b: roundTo(b, 4),
    c: roundTo(c, 4),
    A: roundTo(A, 4),
    B: roundTo(B, 4),
    C: roundTo(C, 4),
    area: roundTo(area, 4),
    perimeter: roundTo(a + b + c, 4),
  };
}
