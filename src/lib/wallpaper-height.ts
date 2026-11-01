// How tall the wallpaper (stars, black hole) should be. Pure, so it can be unit tested.

export type Size = { width: number; height: number };

/**
 * The wallpaper follows the visible height, except that it never shrinks for the on-screen
 * keyboard, so the stars and the black hole stay put while it opens and closes.
 *
 * @param keyboard whether the keyboard may be open (typing on a touch screen, or just
 *   stopped). Anything else that makes the screen shorter (browser bars, split screen) is
 *   followed.
 * @param fullHeight best guess of the height without the keyboard, for after a rotation,
 *   when the previous height no longer applies
 */
export function wallpaperHeight(
  previous: Size,
  visible: Size,
  keyboard: boolean,
  fullHeight: number,
): number {
  if (!keyboard) return visible.height;
  const rotated = Math.abs(visible.width - previous.width) > 1;
  if (rotated) return Math.max(visible.height, fullHeight);
  return Math.max(previous.height, visible.height);
}
