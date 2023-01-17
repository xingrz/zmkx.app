export const PI2 = Math.PI * 2;

export function radNorm(rad: number): number {
  rad = rad % PI2;
  return rad >= 0 ? rad : rad + PI2;
}

export function radToDeg(rad: number): number {
  return 360 * (rad / PI2);
}
