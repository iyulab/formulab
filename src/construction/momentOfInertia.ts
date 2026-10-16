import { roundTo, requireFinite } from '../utils.js';
import type { MomentOfInertiaInput, MomentOfInertiaResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Moment of Inertia (Section Properties) Calculator
 *
 * Calculates area, second moment of area (Ix, Iy), section modulus (Sx, Sy),
 * and radius of gyration (rx, ry) for common structural cross-sections.
 *
 * All dimensions in mm; results in mm², mm⁴, mm³, mm.
 *
 * @reference Timoshenko, S. "Mechanics of Materials" — rectangle, circle, hollow-section formulas.
 * @reference Young, W.C. & Budynas, R.G. "Roark's Formulas for Stress and Strain", 7th Ed. —
 *            I-beam, T-section, C-channel component-method (parallel-axis) derivations.
 * @reference AISC Steel Construction Manual — section property naming convention (Ix, Sx, rx, etc.).
 * These are closed-form section-property formulas, not a table lookup: every shape's Ix/Sx/rx
 * is independently re-derivable from the definitions above, and the golden tests in
 * momentOfInertia.test.ts pin hand-computed values for every shape, not just the simple ones.
 *
 * @throws {RangeError} {field} must be positive (each dimension named by its input field)
 * @throws {RangeError} Diameter must be positive
 * @throws {RangeError} Inner width/height must be smaller than outer width/height
 * @throws {RangeError} Inner diameter must be smaller than outer
 * @throws {RangeError} Web thickness must be less than flange width
 * @throws {RangeError} 2 x flange thickness must be less than total height
 * @param input - discriminated union by `shape`
 * @returns section properties
 */
export function momentOfInertia(input: MomentOfInertiaInput): MomentOfInertiaResult {
  requireFinite('momentOfInertia', input);
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

/** Refuses a dimension that is not positive, naming it as the caller's input field. */
function requirePositive(parameter: string, value: number): void {
  if (value <= 0) {
    throw inputRangeError(`${parameter} must be positive`, {
      code: 'parameter_out_of_range', parameter, exclusive_min: 0, got: value,
    });
  }
}

/** Refuses a flange thickness whose two flanges would leave no web. */
function requireFlangesBelowHeight(tf: number, H: number): void {
  if (2 * tf >= H) {
    throw inputRangeError('2 × flange thickness must be less than total height', {
      code: 'parameter_out_of_range', parameter: 'flangeThickness', exclusive_max: H / 2, got: tf,
    });
  }
}

/** Solid Rectangle: I_x = bh³/12, I_y = hb³/12 */
function calcRectangle(b: number, h: number): MomentOfInertiaResult {
  requirePositive('width', b);
  requirePositive('height', h);
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
  if (d <= 0) {
    throw inputRangeError('Diameter must be positive', {
      code: 'parameter_out_of_range', parameter: 'diameter', exclusive_min: 0, got: d,
    });
  }
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
  requirePositive('outerWidth', B);
  requirePositive('outerHeight', H);
  requirePositive('innerWidth', b);
  requirePositive('innerHeight', h);
  if (b >= B) {
    throw inputRangeError('Inner width must be smaller than outer width', {
      code: 'parameter_out_of_range', parameter: 'innerWidth', exclusive_max: B, got: b,
    });
  }
  if (h >= H) {
    throw inputRangeError('Inner height must be smaller than outer height', {
      code: 'parameter_out_of_range', parameter: 'innerHeight', exclusive_max: H, got: h,
    });
  }
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
  requirePositive('outerDiameter', D);
  requirePositive('innerDiameter', d);
  if (d >= D) {
    throw inputRangeError('Inner diameter must be smaller than outer', {
      code: 'parameter_out_of_range', parameter: 'innerDiameter', exclusive_max: D, got: d,
    });
  }
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
  requirePositive('flangeWidth', B);
  requirePositive('totalHeight', H);
  requirePositive('webThickness', tw);
  requirePositive('flangeThickness', tf);
  if (tw >= B) {
    throw inputRangeError('Web thickness must be less than flange width', {
      code: 'parameter_out_of_range', parameter: 'webThickness', exclusive_max: B, got: tw,
    });
  }
  requireFlangesBelowHeight(tf, H);

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
  requirePositive('flangeWidth', bf);
  requirePositive('flangeThickness', tf);
  requirePositive('webThickness', tw);
  requirePositive('webHeight', hw);

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
  requirePositive('flangeWidth', bf);
  requirePositive('totalHeight', H);
  requirePositive('webThickness', tw);
  requirePositive('flangeThickness', tf);
  requireFlangesBelowHeight(tf, H);

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
