import { useEffect } from "react";

/**
 * Keeps the page exactly as tall as what's visible, so only the windows' own content scrolls.
 *
 * Android Chrome shrinks the page above the on-screen keyboard (viewport meta
 * `interactive-widget=resizes-content`), but iOS Safari doesn't: it covers the page with the
 * keyboard and pans the whole page up to show the focused field. This follows the visible
 * height (`--app-height`, which the CSS uses in place of 100dvh) and undoes that pan.
 *
 * The wallpaper (`--wallpaper-height`) follows the visible height too, but not the keyboard:
 * the stars and the black hole stay put while it opens and closes.
 */
export function useFitVisibleViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const touch = window.matchMedia("(pointer: coarse)");

    let lastHeight = vv.height;
    let lastWidth = vv.width;
    let wallpaperHeight = vv.height;
    let settleTimer = 0;
    const setWallpaperHeight = (height: number) => {
      wallpaperHeight = height;
      root.style.setProperty("--wallpaper-height", `${Math.round(height)}px`);
    };
    // On touch screens, shrinking while typing, or by more than browser bars do, is the
    // on-screen keyboard: the wallpaper ignores it
    const isTyping = () => {
      const field = document.activeElement;
      return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement;
    };
    const isKeyboard = () =>
      touch.matches && (isTyping() || vv.height < wallpaperHeight - KEYBOARD_MIN_HEIGHT);

    const sync = () => {
      // Pinch-zoomed in: the visible area is smaller on purpose, leave the page alone
      if (Math.abs(vv.scale - 1) > 0.01) return;
      root.style.setProperty("--app-height", `${Math.round(vv.height)}px`);
      window.clearTimeout(settleTimer);
      if (Math.abs(vv.width - lastWidth) > 1 || vv.height >= wallpaperHeight || !touch.matches) {
        // Taller, or a new width (rotation, resized window): follow right away
        setWallpaperHeight(vv.height);
      } else if (!isKeyboard()) {
        // A bit shorter: browser bars, or the last steps of the keyboard sliding away. Wait
        // for it to settle, so the wallpaper doesn't twitch as the keyboard closes.
        settleTimer = window.setTimeout(() => {
          if (!isKeyboard()) setWallpaperHeight(vv.height);
        }, 300);
      }
      lastWidth = vv.width;
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
      // The keyboard just took space: bring the field being typed in back into view, as it
      // may now sit below the fold of its window's scrolling content
      const shrank = vv.height < lastHeight - 1;
      lastHeight = vv.height;
      const field = document.activeElement;
      if (shrank && isTyping() && field instanceof HTMLElement) {
        requestAnimationFrame(() => field.scrollIntoView({ block: "nearest" }));
      }
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.clearTimeout(settleTimer);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("scroll", sync);
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--wallpaper-height");
    };
  }, []);
}

// Browser bars showing or hiding change the height by less than this; a keyboard by more
const KEYBOARD_MIN_HEIGHT = 150;
