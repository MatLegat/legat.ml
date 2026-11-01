import { describe, expect, it } from "vitest";
import { clampWindowOffset, DOCK_GAP, MIN_VISIBLE, type DragGeometry } from "./window-drag";

// A 1000px-wide window at (200, 40) on a 1400px-wide screen, dock top at 800
const g: DragGeometry = {
  base: { left: 200, top: 40, width: 1000 },
  barHeight: 36,
  viewportWidth: 1400,
  dockTop: 800,
};

describe("clampWindowOffset", () => {
  it("leaves offsets that keep the title bar reachable alone", () => {
    expect(clampWindowOffset({ x: 0, y: 0 }, g)).toEqual({ x: 0, y: 0 });
    expect(clampWindowOffset({ x: -150, y: 300 }, g)).toEqual({ x: -150, y: 300 });
  });

  it("never lets the title bar go above the top of the screen", () => {
    expect(clampWindowOffset({ x: 0, y: -500 }, g)).toEqual({ x: 0, y: -40 });
  });

  it("keeps the whole title bar above the dock", () => {
    const { y } = clampWindowOffset({ x: 0, y: 5000 }, g)!;
    expect(g.base.top + y + g.barHeight).toBe(g.dockTop - DOCK_GAP);
  });

  it("lets the window go partly off-screen sideways, keeping a strip to grab", () => {
    const left = clampWindowOffset({ x: -5000, y: 0 }, g)!;
    expect(g.base.left + left.x + g.base.width).toBe(MIN_VISIBLE);
    const right = clampWindowOffset({ x: 5000, y: 0 }, g)!;
    expect(g.base.left + right.x).toBe(g.viewportWidth - MIN_VISIBLE);
  });

  it("gives up when there's no room for the title bar above the dock", () => {
    expect(clampWindowOffset({ x: 0, y: 0 }, { ...g, dockTop: 40 })).toBeNull();
  });
});
