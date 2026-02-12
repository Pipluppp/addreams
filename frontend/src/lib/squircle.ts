export const SQUIRCLE_RADIUS = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 42,
} as const;

export const SQUIRCLE_SMOOTH = {
  sm: 0.82,
  md: 0.88,
  lg: 0.94,
  xl: 0.98,
} as const;

export type SquircleRadius = keyof typeof SQUIRCLE_RADIUS;
export type SquircleSmooth = keyof typeof SQUIRCLE_SMOOTH;
