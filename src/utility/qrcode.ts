/**
 * QR code generation is not included in formulab
 * because it requires external dependencies (qrcode library).
 *
 * This module only exports the type definitions.
 * For actual QR code generation, use the qrcode npm package
 * directly in your application.
 *
 * Example usage:
 * ```typescript
 * import QRCode from 'qrcode';
 * import type { QrcodeInput, QrcodeResult } from 'formulab/utility';
 *
 * async function generateQrcode(input: QrcodeInput): Promise<QrcodeResult | null> {
 *   const { text, errorCorrection, size, margin, darkColor, lightColor } = input;
 *   if (!text) return null;
 *
 *   const dataUrl = await QRCode.toDataURL(text, {
 *     errorCorrectionLevel: errorCorrection,
 *     width: size,
 *     margin,
 *     color: { dark: darkColor, light: lightColor },
 *   });
 *
 *   return { dataUrl, characterCount: text.length };
 * }
 * ```
 */

// Re-export types for convenience
export type { QrcodeInput, QrcodeResult, ErrorCorrectionLevel } from './types.js';
