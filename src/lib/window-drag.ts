// Where a dragged window may go. Pure math, so it can be unit tested.

export type Offset = { x: number; y: number };

export type DragGeometry = {
  /** the window's frame where it sits with no offset (viewport pixels) */
  base: { left: number; top: number; width: number };
  /** height of its title bar */
  barHeight: number;
  viewportWidth: number;
  /** top of the dock, or the bottom of the viewport when there's no dock */
  dockTop: number;
};

/** How much of the title bar must stay on screen horizontally, to grab it again */
export const MIN_VISIBLE = 120;
/** Space kept between the title bar and the dock */
export const DOCK_GAP = 8;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Keeps a window reachable, like macOS: it may go partly off-screen, but its whole title
 * bar stays between the top of the screen and the dock, with at least MIN_VISIBLE pixels
 * of it on screen sideways. Returns null when there's no room for the title bar at all.
 */
export function clampWindowOffset(offset: Offset, g: DragGeometry): Offset | null {
  const minX = MIN_VISIBLE - g.base.left - g.base.width;
  const maxX = g.viewportWidth - MIN_VISIBLE - g.base.left;
  const minY = -g.base.top;
  const maxY = g.dockTop - DOCK_GAP - g.barHeight - g.base.top;
  if (minX > maxX || minY > maxY) return null;
  return { x: clamp(offset.x, minX, maxX), y: clamp(offset.y, minY, maxY) };
}
