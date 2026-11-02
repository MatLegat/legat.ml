import { describe, expect, it } from "vitest";
import { fromPolar, infall, burst, seededRandom, toPolar, type Polar } from "./orbits";

const center = { x: 500, y: 300 };

describe("polar helpers", () => {
  it("round-trips points", () => {
    const p = { x: 812.5, y: 41 };
    const back = fromPolar(toPolar(p, center), center);
    expect(back.x).toBeCloseTo(p.x);
    expect(back.y).toBeCloseTo(p.y);
  });
});

describe("infall", () => {
  const start: Polar = { r: 400, theta: 1 };

  it("starts where the star is", () => {
    const p = infall(0, start, 1, 20);
    expect(p.r).toBeCloseTo(400);
    expect(p.theta).toBeCloseTo(1);
  });

  it("falls ever closer, faster, winding one way", () => {
    let prev = infall(0, start, 1, 20);
    let prevStep = 0;
    for (let i = 1; i <= 10; i++) {
      const p = infall(i / 10, start, 1, 20);
      expect(p.r).toBeLessThan(prev.r);
      expect(p.theta).toBeGreaterThanOrEqual(prev.theta);
      // accelerating: each step covers more distance than the last
      const step = prev.r - p.r;
      expect(step).toBeGreaterThan(prevStep);
      prevStep = step;
      prev = p;
    }
    expect(prev.r).toBeCloseTo(0);
  });

  it("winds the other way with dir -1, and caps the winding", () => {
    expect(infall(0.5, start, -1, 20).theta).toBeLessThan(1);
    const end = infall(1, start, 1, 20);
    expect(Number.isFinite(end.theta)).toBe(true);
    expect(end.theta).toBeCloseTo(1 + 1.9 * Math.log(400 / 20));
  });

  it("clamps progress outside 0..1", () => {
    expect(infall(-1, start, 1, 20)).toEqual(infall(0, start, 1, 20));
    expect(infall(2, start, 1, 20)).toEqual(infall(1, start, 1, 20));
  });
});

describe("burst", () => {
  const home: Polar = { r: 350, theta: -2 };

  it("starts near the center on the way home and ends exactly at home", () => {
    const start = burst(0, 5, home);
    expect(start.pos.r).toBeCloseTo(5);
    expect(start.pos.theta).toBeCloseTo(home.theta);
    const end = burst(1, 5, home);
    expect(end.pos.r).toBeCloseTo(home.r);
    expect(end.pos.theta).toBeCloseTo(home.theta);
    expect(end.stretch).toBeCloseTo(0);
  });

  it("flies straight out, fastest at launch, streak fading as it slows", () => {
    let prev = burst(0, 5, home);
    let prevStep = Infinity;
    for (let i = 1; i <= 10; i++) {
      const next = burst(i / 10, 5, home);
      expect(next.pos.theta).toBeCloseTo(home.theta);
      const step = next.pos.r - prev.pos.r;
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThanOrEqual(prevStep);
      expect(next.stretch).toBeLessThanOrEqual(prev.stretch);
      prevStep = step;
      prev = next;
    }
    expect(burst(0, 5, home).stretch).toBe(1);
  });
});

describe("seededRandom", () => {
  it("repeats for the same seed and stays in [0, 1)", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
