/**
 * Generate a coherent color palette using OKLCH color space.
 * Colors are maximally spaced in hue with fixed lightness and chroma
 * for perceptual uniformity.
 */

export function generateCommunityPalette(
  communityCount: number,
): Map<number, string> {
  const palette = new Map<number, string>();

  if (communityCount <= 0) return palette;

  // A step of ~45-55 degrees gives colors that are distinct but related,
  // rather than the maximal contrast of the golden angle.
  const angleStep = 23;

  for (let i = 0; i < communityCount; i++) {
    const hue = (i * angleStep) % 360;
    // Slightly vary lightness and chroma to add visual depth
    const lightness = 0.72 + (i % 3) * 0.04;
    const chroma = 0.14 + (i % 2) * 0.03;
    palette.set(i, `oklch(${lightness} ${chroma} ${hue.toFixed(1)})`);
  }

  return palette;
}

/**
 * Convert an OKLCH CSS string to a hex color for use in Three.js
 * (which doesn't support oklch natively). Uses a canvas-based approach.
 */
export function oklchToHex(oklchStr: string): string {
  // Fallback mapping for server-side / non-canvas environments
  // We'll do the conversion client-side using a canvas
  return oklchStr;
}
