/**
 * 3D Pallet Loading Calculator
 * Uses BLF (Bottom-Left-Fill) algorithm with FFD (First Fit Decreasing) heuristic
 */
import type {
  BoxType3D,
  Pallet3DInput,
  Pallet3DResult,
  PlacedBox3D,
  PalletStandard,
  PalletSpec,
} from './types.js';

/** Standard pallet dimensions by region */
const PALLET_SPECS: Record<Exclude<PalletStandard, 'custom'>, PalletSpec> = {
  eur: {
    name: 'EUR/EPAL (European)',
    length: 1200,  // mm
    width: 800,    // mm
  },
  us: {
    name: 'GMA (North American)',
    length: 1219,  // mm (48 inches)
    width: 1016,   // mm (40 inches)
  },
  cn: {
    name: 'CN (Chinese Standard)',
    length: 1100,  // mm
    width: 1100,   // mm
  },
  jp: {
    name: 'JIS (Japanese Standard)',
    length: 1100,  // mm
    width: 1100,   // mm
  },
};

/** Default maximum stack height (mm) */
const DEFAULT_MAX_STACK_HEIGHT = 1500;

/** Default maximum payload (kg) */
const DEFAULT_MAX_PAYLOAD = 1200;

/** Minimum support ratio for stability (80%) */
const MIN_SUPPORT_RATIO = 0.8;

/** Default box colors for visualization */
const DEFAULT_BOX_COLORS = [
  '#3b82f6',  // blue
  '#10b981',  // green
  '#f59e0b',  // amber
  '#ef4444',  // red
  '#8b5cf6',  // violet
];

/**
 * Get pallet dimensions based on standard or custom input
 */
function getPalletDimensions(
  standard: PalletStandard,
  customLength?: number,
  customWidth?: number
): { length: number; width: number } {
  if (standard === 'custom') {
    return {
      length: customLength ?? 1200,
      width: customWidth ?? 800,
    };
  }
  return {
    length: PALLET_SPECS[standard].length,
    width: PALLET_SPECS[standard].width,
  };
}

/**
 * Check AABB collision between two boxes
 */
function checkCollision(
  box1: { x: number; y: number; z: number; l: number; w: number; h: number },
  box2: { x: number; y: number; z: number; l: number; w: number; h: number }
): boolean {
  const tolerance = 0.1; // 0.1mm tolerance for floating point

  return (
    box1.x < box2.x + box2.l - tolerance &&
    box1.x + box1.l > box2.x + tolerance &&
    box1.y < box2.y + box2.w - tolerance &&
    box1.y + box1.w > box2.y + tolerance &&
    box1.z < box2.z + box2.h - tolerance &&
    box1.z + box1.h > box2.z + tolerance
  );
}

/**
 * Check if a box at given position is stable (has adequate support)
 */
function isBoxStable(
  box: { x: number; y: number; z: number; l: number; w: number; h: number },
  placedBoxes: PlacedBox3D[],
  _palletLength: number,
  _palletWidth: number
): boolean {
  // Ground level is always stable
  if (box.z === 0) {
    return true;
  }

  // Calculate box footprint area
  const boxArea = box.l * box.w;

  // Find supporting area from boxes below
  let supportArea = 0;
  const tolerance = 1; // 1mm tolerance

  for (const placed of placedBoxes) {
    // Check if placed box is directly below (z + height = box.z)
    const placedTop = placed.position.z + placed.dimensions.h;
    if (Math.abs(placedTop - box.z) > tolerance) {
      continue;
    }

    // Calculate overlap area
    const overlapL = Math.max(0,
      Math.min(box.x + box.l, placed.position.x + placed.dimensions.l) -
      Math.max(box.x, placed.position.x)
    );
    const overlapW = Math.max(0,
      Math.min(box.y + box.w, placed.position.y + placed.dimensions.w) -
      Math.max(box.y, placed.position.y)
    );

    supportArea += overlapL * overlapW;
  }

  // Check if support ratio meets minimum requirement
  return (supportArea / boxArea) >= MIN_SUPPORT_RATIO;
}

/**
 * Calculate center of gravity for placed boxes
 */
function calculateCenterOfGravity(
  placedBoxes: PlacedBox3D[],
  palletLength: number,
  palletWidth: number
): { x: number; y: number; z: number; isBalanced: boolean } {
  if (placedBoxes.length === 0) {
    return {
      x: palletLength / 2,
      y: palletWidth / 2,
      z: 0,
      isBalanced: true,
    };
  }

  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let weightedZ = 0;

  for (const box of placedBoxes) {
    const centerX = box.position.x + box.dimensions.l / 2;
    const centerY = box.position.y + box.dimensions.w / 2;
    const centerZ = box.position.z + box.dimensions.h / 2;

    weightedX += centerX * box.weight;
    weightedY += centerY * box.weight;
    weightedZ += centerZ * box.weight;
    totalWeight += box.weight;
  }

  const cgX = weightedX / totalWeight;
  const cgY = weightedY / totalWeight;
  const cgZ = weightedZ / totalWeight;

  // Check if CG is within acceptable bounds (center 50% of pallet)
  const palletCenterX = palletLength / 2;
  const palletCenterY = palletWidth / 2;
  const toleranceX = palletLength * 0.25;
  const toleranceY = palletWidth * 0.25;

  const isBalanced =
    Math.abs(cgX - palletCenterX) <= toleranceX &&
    Math.abs(cgY - palletCenterY) <= toleranceY;

  return {
    x: cgX,
    y: cgY,
    z: cgZ,
    isBalanced,
  };
}

interface BoxCandidate {
  boxType: BoxType3D;
  remainingQty: number;
}

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Orientation {
  l: number;
  w: number;
  h: number;
  rotationId: number;
}

/**
 * Generate possible orientations for a box based on rotation constraint
 */
function getOrientations(box: BoxType3D): Orientation[] {
  const { length: l, width: w, height: h } = box;

  if (box.canRotate === 'fixed') {
    return [{ l, w, h, rotationId: 0 }];
  }

  if (box.canRotate === 'layered') {
    // Only rotate in horizontal plane (keep height fixed)
    const orientations: Orientation[] = [
      { l, w, h, rotationId: 0 },
    ];
    if (l !== w) {
      orientations.push({ l: w, w: l, h, rotationId: 1 });
    }
    return orientations;
  }

  // Full rotation - all 6 orientations (deduplicated)
  const seen = new Set<string>();
  const orientations: Orientation[] = [];
  const allRotations: [number, number, number, number][] = [
    [l, w, h, 0],
    [l, h, w, 1],
    [w, l, h, 2],
    [w, h, l, 3],
    [h, l, w, 4],
    [h, w, l, 5],
  ];

  for (const [ol, ow, oh, rid] of allRotations) {
    const key = `${ol}-${ow}-${oh}`;
    if (!seen.has(key)) {
      seen.add(key);
      orientations.push({ l: ol, w: ow, h: oh, rotationId: rid });
    }
  }

  return orientations;
}

/**
 * Find the best position for a box using BLF heuristic
 */
function findBestPosition(
  orientation: Orientation,
  placedBoxes: PlacedBox3D[],
  palletLength: number,
  palletWidth: number,
  maxHeight: number,
): Position | null {
  // Generate candidate positions (corners of placed boxes + origin)
  const candidatePositions: Position[] = [{ x: 0, y: 0, z: 0 }];

  for (const placed of placedBoxes) {
    // Corner positions from placed boxes
    candidatePositions.push(
      { x: placed.position.x + placed.dimensions.l, y: placed.position.y, z: placed.position.z },
      { x: placed.position.x, y: placed.position.y + placed.dimensions.w, z: placed.position.z },
      { x: placed.position.x, y: placed.position.y, z: placed.position.z + placed.dimensions.h },
    );
  }

  // Sort by BLF priority: z (bottom), x (left), y (front)
  candidatePositions.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  // Remove duplicates
  const uniquePositions = candidatePositions.filter((pos, idx, arr) => {
    if (idx === 0) return true;
    const prev = arr[idx - 1];
    return pos.x !== prev.x || pos.y !== prev.y || pos.z !== prev.z;
  });

  for (const pos of uniquePositions) {
    const box = {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      l: orientation.l,
      w: orientation.w,
      h: orientation.h,
    };

    // Check bounds
    if (box.x + box.l > palletLength) continue;
    if (box.y + box.w > palletWidth) continue;
    if (box.z + box.h > maxHeight) continue;

    // Check collisions
    let hasCollision = false;
    for (const placed of placedBoxes) {
      if (checkCollision(box, {
        x: placed.position.x,
        y: placed.position.y,
        z: placed.position.z,
        l: placed.dimensions.l,
        w: placed.dimensions.w,
        h: placed.dimensions.h,
      })) {
        hasCollision = true;
        break;
      }
    }
    if (hasCollision) continue;

    // Check stability
    if (!isBoxStable(box, placedBoxes, palletLength, palletWidth)) continue;

    return pos;
  }

  return null;
}

/**
 * Calculate floor coverage by projecting boxes to XY plane
 */
function calculateFloorCoverage(placedBoxes: PlacedBox3D[]): number {
  if (placedBoxes.length === 0) return 0;

  // Use a grid-based approximation for floor coverage
  const groundBoxes = placedBoxes.filter(b => b.position.z === 0);

  if (groundBoxes.length === 0) return 0;

  // Sum of individual floor areas (may overcount overlaps but good approximation)
  return groundBoxes.reduce(
    (sum, box) => sum + box.dimensions.l * box.dimensions.w,
    0
  );
}

/**
 * Calculate 3D pallet loading
 *
 * Uses Bottom-Left-Fill (BLF) algorithm with First Fit Decreasing (FFD) heuristic
 * to efficiently pack boxes onto a pallet.
 *
 * @param input - Pallet specifications and box types
 * @returns Placement results with metrics
 */
export function pallet3d(input: Pallet3DInput): Pallet3DResult {
  const warnings: string[] = [];

  // Validate input
  if (!input.boxes || input.boxes.length === 0) {
    return {
      placed: [],
      unplaced: [],
      utilization: { volumePercent: 0, weightPercent: 0, floorPercent: 0 },
      centerOfGravity: { x: 0, y: 0, z: 0, isBalanced: true },
      metrics: { totalWeight: 0, totalBoxes: 0, totalLayers: 0, maxHeight: 0, wastedVolume: 0 },
      palletDimensions: { length: 0, width: 0, height: 0 },
      warnings: ['No boxes provided'],
    };
  }

  if (input.boxes.length > 5) {
    warnings.push('Maximum 5 box types supported, extra types ignored');
  }

  // Get pallet dimensions
  const { length: palletLength, width: palletWidth } = getPalletDimensions(
    input.palletStandard,
    input.customLength,
    input.customWidth
  );
  const maxHeight = input.maxStackHeight || DEFAULT_MAX_STACK_HEIGHT;
  const maxPayload = input.maxPayload || DEFAULT_MAX_PAYLOAD;

  // Prepare box candidates sorted by volume (FFD - First Fit Decreasing)
  const candidates: BoxCandidate[] = input.boxes
    .slice(0, 5)
    .map((box, idx) => ({
      boxType: {
        ...box,
        color: box.color || DEFAULT_BOX_COLORS[idx % DEFAULT_BOX_COLORS.length],
      },
      remainingQty: box.quantity,
    }))
    .sort((a, b) => {
      const volA = a.boxType.length * a.boxType.width * a.boxType.height;
      const volB = b.boxType.length * b.boxType.width * b.boxType.height;
      return volB - volA; // Descending
    });

  const placedBoxes: PlacedBox3D[] = [];
  let totalWeight = 0;

  // BLF packing loop
  let progress = true;
  while (progress) {
    progress = false;

    for (const candidate of candidates) {
      if (candidate.remainingQty <= 0) continue;

      // Check weight limit
      if (totalWeight + candidate.boxType.weight > maxPayload) continue;

      const orientations = getOrientations(candidate.boxType);

      for (const orientation of orientations) {
        const position = findBestPosition(
          orientation,
          placedBoxes,
          palletLength,
          palletWidth,
          maxHeight
        );

        if (position) {
          placedBoxes.push({
            boxTypeId: candidate.boxType.id,
            position,
            dimensions: { l: orientation.l, w: orientation.w, h: orientation.h },
            rotationId: orientation.rotationId,
            color: candidate.boxType.color!,
            weight: candidate.boxType.weight,
          });

          totalWeight += candidate.boxType.weight;
          candidate.remainingQty--;
          progress = true;
          break;
        }
      }

      if (progress) break;
    }
  }

  // Calculate unplaced boxes
  const unplaced = candidates
    .filter(c => c.remainingQty > 0)
    .map(c => ({ boxTypeId: c.boxType.id, count: c.remainingQty }));

  // Calculate metrics
  const palletVolume = palletLength * palletWidth * maxHeight;
  const placedVolume = placedBoxes.reduce(
    (sum, box) => sum + box.dimensions.l * box.dimensions.w * box.dimensions.h,
    0
  );
  const placedFloorArea = calculateFloorCoverage(placedBoxes);
  const palletFloorArea = palletLength * palletWidth;

  // Find max height and number of layers
  const maxUsedHeight = placedBoxes.reduce(
    (max, box) => Math.max(max, box.position.z + box.dimensions.h),
    0
  );
  const uniqueZLevels = new Set(placedBoxes.map(b => b.position.z));

  // Calculate center of gravity
  const cg = calculateCenterOfGravity(placedBoxes, palletLength, palletWidth);

  // Add warnings
  if (unplaced.length > 0) {
    const totalUnplaced = unplaced.reduce((sum, u) => sum + u.count, 0);
    warnings.push(`${totalUnplaced} boxes could not be placed`);
  }
  if (!cg.isBalanced) {
    warnings.push('Center of gravity is off-center, load may be unstable');
  }
  if (totalWeight > maxPayload * 0.9) {
    warnings.push('Load is near maximum payload capacity');
  }

  return {
    placed: placedBoxes,
    unplaced,
    utilization: {
      volumePercent: palletVolume > 0 ? (placedVolume / palletVolume) * 100 : 0,
      weightPercent: maxPayload > 0 ? (totalWeight / maxPayload) * 100 : 0,
      floorPercent: palletFloorArea > 0 ? (placedFloorArea / palletFloorArea) * 100 : 0,
    },
    centerOfGravity: cg,
    metrics: {
      totalWeight,
      totalBoxes: placedBoxes.length,
      totalLayers: uniqueZLevels.size,
      maxHeight: maxUsedHeight,
      wastedVolume: palletVolume - placedVolume,
    },
    palletDimensions: {
      length: palletLength,
      width: palletWidth,
      height: maxHeight,
    },
    warnings,
  };
}
