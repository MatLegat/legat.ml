import { describe, expect, it } from "vitest";
import { wallpaperHeight } from "./wallpaper-height";

const portrait = { width: 390, height: 844 };

describe("wallpaperHeight", () => {
  it("follows the visible height when there's no keyboard", () => {
    // Browser bars showing, split screen, a shorter window
    expect(wallpaperHeight(portrait, { width: 390, height: 780 }, false, 0)).toBe(780);
    expect(wallpaperHeight(portrait, { width: 390, height: 400 }, false, 0)).toBe(400);
    expect(wallpaperHeight(portrait, { width: 390, height: 900 }, false, 0)).toBe(900);
  });

  it("doesn't shrink while the keyboard may be open", () => {
    expect(wallpaperHeight(portrait, { width: 390, height: 420 }, true, 0)).toBe(844);
    // Closing in steps
    expect(wallpaperHeight(portrait, { width: 390, height: 800 }, true, 0)).toBe(844);
  });

  it("still grows while the keyboard may be open", () => {
    expect(wallpaperHeight(portrait, { width: 390, height: 870 }, true, 0)).toBe(870);
  });

  it("after rotating with the keyboard open, uses the height without the keyboard", () => {
    const landscape = { width: 844, height: 150 };
    expect(wallpaperHeight(portrait, landscape, true, 340)).toBe(340);
    // No better guess than what's visible
    expect(wallpaperHeight(portrait, landscape, true, 0)).toBe(150);
  });

  it("after rotating without the keyboard, follows the new height", () => {
    expect(wallpaperHeight(portrait, { width: 844, height: 340 }, false, 0)).toBe(340);
  });
});
