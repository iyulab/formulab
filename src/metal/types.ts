/**
 * Metal Weight Types
 */
export type MetalShape = 'plate' | 'round' | 'pipe' | 'angle';

export interface MetalWeightInput {
  shape: MetalShape;
  length: number;           // mm
  materialName: string;     // density key (steel, aluminum, etc.)
  // Plate
  width?: number;           // mm
  thickness?: number;       // mm
  // Round
  diameter?: number;        // mm
  // Pipe
  outerDiameter?: number;   // mm
  innerDiameter?: number;   // mm
  // Angle
  height?: number;          // mm
}

export interface MetalWeightResult {
  weight: number;           // kg
  volume: number;           // cm3
  density: number;          // g/cm3
}

/**
 * Bending Types
 */
export type BendingMaterial = 'mildSteel' | 'stainless304' | 'aluminum5052' | 'aluminum6061' | 'custom';
export type ShapeType = 'lShape' | 'uShape';

export interface BendAllowanceInput {
  thickness: number;        // mm
  bendAngle: number;        // degrees (0-180)
  insideRadius: number;     // mm
  kFactor?: number;         // 0.3-0.5 (optional)
  material?: BendingMaterial;
}

export interface BendAllowanceResult {
  bendAllowance: number;    // mm
  bendDeduction: number;    // mm
  outsideSetback: number;   // mm
  kFactor: number;          // used or default
  recommendedVDie: number;  // mm (8 x thickness)
  minBendRadius: number;    // mm
  warnings: string[];
}

export interface FlatPatternInput {
  shapeType: ShapeType;
  thickness: number;        // mm
  bendAngle: number;        // degrees
  insideRadius: number;     // mm
  kFactor?: number;         // optional
  material?: BendingMaterial;
  flangeA: number;          // mm
  flangeB: number;          // mm
  flangeC?: number;         // mm (for U-shape)
}

export interface FlatPatternResult {
  flatLength: number;       // mm
  bendAllowance: number;    // mm
  bendDeduction: number;    // mm
  kFactor: number;
}

export interface KFactorReverseInput {
  thickness: number;        // mm
  bendAngle: number;        // degrees
  insideRadius: number;     // mm
  measuredFlatLength: number; // mm
  legA: number;             // mm
  legB: number;             // mm
}

export interface KFactorReverseResult {
  kFactor: number;
}

/**
 * Press Tonnage Types
 */
export type PressOperation = 'blanking' | 'bending' | 'drawing' | 'combined';
export type BendType = 'air' | 'bottoming' | 'coining';

export interface PressTonnageInput {
  operation: PressOperation;
  thickness: number;        // mm
  tensileStrength: number;  // MPa
  shearStrength: number;    // MPa
  safetyFactor?: number;    // 1.1-1.5, default 1.25
  // Blanking/Piercing
  cuttingPerimeter?: number; // mm
  // Bending
  bendLength?: number;      // mm
  dieOpening?: number;      // mm (V-die width)
  bendType?: BendType;
  // Drawing
  punchDiameter?: number;   // mm
  drawRatio?: number;       // 0.6-1.2
  // Combined (array of operations)
  operations?: PressOperation[];
}

export interface PressTonnageResult {
  blankingForce: number;    // kN
  bendingForce: number;     // kN
  drawingForce: number;     // kN
  totalForce: number;       // kN
  recommendedPress: number; // tons (with safety factor)
  breakdown: {
    operation: string;
    force: number;
  }[];
}
