// Utility domain formulas
export { solveAssignment } from './assignment.js';
export { calculateUnit, getUnitCategories, getUnitsForCategory } from './unit.js';

// Note: QR code generation requires the 'qrcode' npm package.
// Types are exported here, but the actual implementation should be
// done in your application using the qrcode library directly.
// See qrcode.ts for example usage.

// Types
export type {
  // Assignment types
  AssignmentObjective,
  AssignmentInput,
  AssignmentPair,
  AssignmentResult,
  // QR Code types
  ErrorCorrectionLevel,
  QrcodeInput,
  QrcodeResult,
  // Unit conversion types
  UnitCategory,
  UnitDef,
  UnitInput,
  ConversionEntry,
  UnitResult,
} from './types.js';
