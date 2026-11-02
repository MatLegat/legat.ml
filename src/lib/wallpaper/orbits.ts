// Spiral paths for the black-hole wallpaper. Pure math, so it can be unit tested.

export type Point = { x: number; y: number };
/** Polar position around the black hole: distance and angle (radians). */
export type Polar = { r: number; theta: number };

/** How much the angle grows as the radius shrinks: radians per e-fold of distance. */
export const SPIN = 1.9;

const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

export function toPolar(p: Point, center: Point): Polar {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return { r: Math.hypot(dx, dy), theta: Math.atan2(dy, dx) };
}

export function fromPolar(p: Polar, center: Point): Point {
  return { x: center.x + p.r * Math.cos(p.theta), y: center.y + p.r * Math.sin(p.theta) };
}

/**
 * Position on the inward spiral at progress `u` (0..1). The fall accelerates, and the
 * angle winds faster as the star gets closer (logarithmic spiral), capped at `minR`.
 */
export function infall(u: number, start: Polar, dir: 1 | -1, minR: number): Polar {
  const k = clamp01(u);
  const r = start.r * (1 - k * k);
  const theta = start.theta + dir * SPIN * Math.log(start.r / Math.max(r, minR, 1e-6));
  return { r, theta };
}

/**
 * A star blasted out of the collapsing hole at progress `u` (0..1): straight out along its
 * home direction from `startR`, fast at first and slowing down (ease-out), ending exactly at
 * `home`. `stretch` (0..1) follows the speed, for a motion streak.
 */
export function burst(u: number, startR: number, home: Polar): { pos: Polar; stretch: number } {
  const k = clamp01(u);
  const eased = 1 - (1 - k) ** 4;
  const speed = 4 * (1 - k) ** 3; // derivative of the easing: 4 at launch, 0 on arrival
  return {
    pos: { r: startR + (home.r - startR) * eased, theta: home.theta },
    stretch: Math.min(1, speed * 0.3),
  };
}

/** Small seeded random generator, so each star gets the same timings every time. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
