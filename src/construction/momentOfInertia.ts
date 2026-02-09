import { roundTo } from '../utils.js';
import type { MomentOfInertiaInput, MomentOfInertiaResult } from './types.js';

/**
 * Moment of Inertia (Section Properties) Calculator
 *
 * Calculates area, second moment of area (Ix, Iy), section modulus (Sx, Sy),
 * and radius of gyration (rx, ry) for common structural cross-sections.
 *
 * All dimensions in mm; results in mm², mm⁴, mm³, mm.
 *
 * Formulas from: Timoshenko "Mechanics of Materials", AISC Steel Manual,
 * Roark's "Formulas for Stress and Strain"
 *
 * @throws {RangeError} Dimensions must be positive
 * @throws {RangeError} Diameter must be positive
 * @throws {RangeError} Diameters must be positive
 * @throws {RangeError} Inner dimensions must be smaller than outer
 * @throws {RangeError} Inner diameter must be smaller than outer
 * @throws {RangeError} Web thickness must be less than flange width
 * @throws {RangeError} 2 x flange thickness must be less than total height
 * @param input - discriminated union by `shape`
 * @returns section properties
 */
export function momentOfInertia(input: MomentOfInertiaInput): MomentOfInertiaResult {
  switch (input.shape) {
    case 'rectangle':
      return calcRectangle(input.width, input.height);
    case 'circle':
      return calcCircle(input.diameter);
    case 'hollowRectangle':
      return calcHollowRectangle(input.outerWidth, input.outerHeight, input.innerWidth, input.innerHeight);
    case 'hollowCircle':
      return calcHollowCircle(input.outerDiameter, input.innerDiameter);
    case 'iBeam':
      return calcIBeam(input.flangeWidth, input.totalHeight, input.webThickness, input.flangeThickness);
    case 'tSection':
      return calcTSection(input.flangeWidth, input.flangeThickness, input.webThickness, input.webHeight);
    case 'cChannel':
      return calcCChannel(input.flangeWidth, input.totalHeight, input.webThickness, input.flangeThickness);
  }
}

function roundResult(r: MomentOfInertiaResult): MomentOfInertiaResult {
  return {
    area: roundTo(r.area, 2),
    Ix: roundTo(r.Ix, 2),
    Iy: roundTo(r.Iy, 2),
    Sx: roundTo(r.Sx, 2),
    Sy: roundTo(r.Sy, 2),
    rx: roundTo(r.rx, 2),
    ry: roundTo(r.ry, 2),
    centroidY: roundTo(r.centroidY, 2),
  };
}

/** Solid Rectangle: I_x = bh³/12, I_y = hb³/12 */
function calcRectangle(b: number, h: number): MomentOfInertiaResult {
  if (b <= 0 || h <= 0) throw new RangeError('Dimensions must be positive');
  const area = b * h;
  const Ix = (b * h * h * h) / 12;
  const Iy = (h * b * b * b) / 12;
  const Sx = (b * h * h) / 6;
  const Sy = (h * b * b) / 6;
  return roundResult({
    area, Ix, Iy, Sx, Sy,
    rx: Math.sqrt(Ix / area),
    ry: Math.sqrt(Iy / area),
    centroidY: h / 2,
  });
}

/** Solid Circle: I = πd⁴/64 */
function calcCircle(d: number): MomentOfInertiaResult {
  if (d <= 0) throw new RangeError('Diameter must be positive');
  const area = (Math.PI * d * d) / 4;
  const I = (Math.PI * d * d * d * d) / 64;
  const S = (Math.PI * d * d * d) / 32;
  return roundResult({
    area, Ix: I, Iy: I, Sx: S, Sy: S,
    rx: d / 4,
    ry: d / 4,
    centroidY: d / 2,
  });
}

/** Hollow Rectangle (Box): I_x = (BH³ - bh³)/12 */
function calcHollowRectangle(B: number, H: number, b: number, h: number): MomentOfInertiaResult {
  if (B <= 0 || H <= 0 || b <= 0 || h <= 0) throw new RangeError('Dimensions must be positive');
  if (b >= B || h >= H) throw new RangeError('Inner dimensions must be smaller than outer');
  const area = B * H - b * h;
  const Ix = (B * H * H * H - b * h * h * h) / 12;
  const Iy = (H * B * B * B - h * b * b * b) / 12;
  const Sx = Ix / (H / 2);
  const Sy = Iy / (B / 2);
  return roundResult({
    area, Ix, Iy, Sx, Sy,
    rx: Math.sqrt(Ix / area),
    ry: Math.sqrt(Iy / area),
    centroidY: H / 2,
  });
}

/** Hollow Circle (Pipe): I = π(D⁴-d⁴)/64 */
function calcHollowCircle(D: number, d: number): MomentOfInertiaResult {
  if (D <= 0 || d <= 0) throw new RangeError('Diameters must be positive');
  if (d >= D) throw new RangeError('Inner diameter must be smaller than outer');
  const area = (Math.PI * (D * D - d * d)) / 4;
  const I = (Math.PI * (D * D * D * D - d * d * d * d)) / 64;
  const S = I / (D / 2);
  return roundResult({
    area, Ix: I, Iy: I, Sx: S, Sy: S,
    rx: Math.sqrt((D * D + d * d) / 16),
    ry: Math.sqrt((D * D + d * d) / 16),
    centroidY: D / 2,
  });
}

/** I-Beam (symmetric): I_x = (B×H³ - (B-tw)×(H-2tf)³) / 12 */
function calcIBeam(B: number, H: number, tw: number, tf: number): MomentOfInertiaResult {
  if (B <= 0 || H <= 0 || tw <= 0 || tf <= 0) throw new RangeError('Dimensions must be positive');
  if (tw >= B) throw new RangeError('Web thickness must be less than flange width');
  if (2 * tf >= H) throw new RangeError('2 × flange thickness must be less than total height');

  const hw = H - 2 * tf; // clear web height
  const area = 2 * B * tf + tw * hw;
  const Ix = (B * H * H * H - (B - tw) * hw * hw * hw) / 12;
  const Iy = (2 * tf * B * B * B + hw * tw * tw * tw) / 12;
  const Sx = Ix / (H / 2);
  const Sy = Iy / (B / 2);

  return roundResult({
    area, Ix, Iy, Sx, Sy,
    rx: Math.sqrt(Ix / area),
    ry: Math.sqrt(Iy / area),
    centroidY: H / 2,
  });
}

/**
 * T-Section: asymmetric, requires centroid calculation + parallel axis theorem
 *
 * hw = web height (web only, excluding flange)
 * Total height H = tf + hw
 * Centroid measured from bottom of web
 */
function calcTSection(bf: number, tf: number, tw: number, hw: number): MomentOfInertiaResult {
  if (bf <= 0 || tf <= 0 || tw <= 0 || hw <= 0) throw new RangeError('Dimensions must be positive');

  const H = tf + hw; // total height
  const aFlange = bf * tf;
  const aWeb = tw * hw;
  const area = aFlange + aWeb;

  // Centroid from bottom of web
  const yBar = (aWeb * hw / 2 + aFlange * (hw + tf / 2)) / area;

  // Parallel axis theorem
  const dWeb = yBar - hw / 2;
  const dFlange = (hw + tf / 2) - yBar;

  const Ix = (tw * hw * hw * hw / 12 + aWeb * dWeb * dWeb)
    + (bf * tf * tf * tf / 12 + aFlange * dFlange * dFlange);

  const Iy = (hw * tw * tw * tw + tf * bf * bf * bf) / 12;

  const yTop = H - yBar;
  const yBot = yBar;
  const Sx = Ix / Math.max(yTop, yBot); // governing section modulus
  const Sy = Iy / (bf / 2);

  return roundResult({
    area, Ix, Iy, Sx, Sy,
    rx: Math.sqrt(Ix / area),
    ry: Math.sqrt(Iy / area),
    centroidY: yBar,
  });
}

/**
 * C-Channel: symmetric about x-axis, asymmetric about y-axis
 *
 * Flanges extend on one side only (like a U).
 * Strong axis (Ix) uses component method.
 */
function calcCChannel(bf: number, H: number, tw: number, tf: number): MomentOfInertiaResult {
  if (bf <= 0 || H <= 0 || tw <= 0 || tf <= 0) throw new RangeError('Dimensions must be positive');
  if (2 * tf >= H) throw new RangeError('2 × flange thickness must be less than total height');

  const hw = H - 2 * tf; // clear web height
  const area = 2 * bf * tf + hw * tw;

  // Strong axis (Ix) — symmetric about x-axis
  // Web contribution
  const IxWeb = (tw * hw * hw * hw) / 12;
  // Each flange: parallel axis theorem
  const dFlange = (H - tf) / 2;
  const IxFlange = bf * tf * tf * tf / 12 + bf * tf * dFlange * dFlange;
  const Ix = IxWeb + 2 * IxFlange;

  // Weak axis (Iy) — asymmetric, centroid shifts toward web
  // Centroid from back of web
  const xBar = (hw * tw * tw / 2 + 2 * bf * tf * (tw + bf / 2)) / area;

  // Web: centered at tw/2
  const dWebY = xBar - tw / 2;
  const IyWeb = (hw * tw * tw * tw) / 12 + hw * tw * dWebY * dWebY;

  // Each flange: centered at tw + bf/2
  const dFlangeY = (tw + bf / 2) - xBar;
  const IyFlange = tf * bf * bf * bf / 12 + bf * tf * dFlangeY * dFlangeY;
  const Iy = IyWeb + 2 * IyFlange;

  const Sx = Ix / (H / 2);
  const xMax = Math.max(xBar, tw + bf - xBar);
  const Sy = Iy / xMax;

  return roundResult({
    area, Ix, Iy, Sx, Sy,
    rx: Math.sqrt(Ix / area),
    ry: Math.sqrt(Iy / area),
    centroidY: H / 2, // symmetric about x-axis
  });
}
