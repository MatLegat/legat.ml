import { useEffect } from "react";
import { wallpaperHeight } from "@/lib/wallpaper-height";

/**
 * Keeps the page exactly as tall as what's visible, so only the windows' own content scrolls.
 *
 * Android Chrome shrinks the page above the on-screen keyboard (viewport meta
 * `interactive-widget=resizes-content`), but iOS Safari doesn't: it covers the page with the
 * keyboard and pans the whole page up to show the focused field. This follows the visible
 * height (`--app-height`, which the CSS uses in place of 100dvh) and undoes that pan.
 *
 * `data-short` on <html> marks a short visible area, for the short-screen layout. On iOS a
 * `max-height` media query doesn't see the keyboard, as the page itself keeps its height.
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
    let wallpaper = { width: vv.width, height: vv.height };
    // Height of the browser's own bars, from the last time there was no keyboard
    let browserBars: number | null = null;
    // When the visitor last left a text field: the keyboard is still closing for a moment
    let leftFieldAt = -Infinity;
    let graceTimer = 0;

    const isTyping = () => {
      const field = document.activeElement;
      return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement;
    };

    const sync = () => {
      // Pinch-zoomed in: the visible area is smaller on purpose, leave the page alone
      if (Math.abs(vv.scale - 1) > 0.01) return;
      root.style.setProperty("--app-height", `${Math.round(vv.height)}px`);
      root.toggleAttribute("data-short", vv.height <= SHORT_HEIGHT);

      const keyboard =
        touch.matches && (isTyping() || performance.now() - leftFieldAt < KEYBOARD_CLOSING_MS);
      if (!keyboard && window.outerHeight > 0) browserBars = window.outerHeight - vv.height;
      // Without the keyboard: the layout height (iOS keeps it), or the window minus the
      // browser's bars (where the keyboard doesn't shrink the window)
      const fullHeight = Math.max(
        window.innerHeight,
        browserBars === null ? 0 : window.outerHeight - browserBars,
      );
      const visible = { width: vv.width, height: vv.height };
      wallpaper = {
        width: vv.width,
        height: wallpaperHeight(wallpaper, visible, keyboard, fullHeight),
      };
      root.style.setProperty("--wallpaper-height", `${Math.round(wallpaper.height)}px`);

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

    // Leaving a text field: the keyboard slides away over a moment. Once that's over, catch
    // up with whatever the height is then (it may also have shrunk for another reason).
    const onFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      leftFieldAt = performance.now();
      window.clearTimeout(graceTimer);
      graceTimer = window.setTimeout(sync, KEYBOARD_CLOSING_MS + 50);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("scroll", sync, { passive: true });
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.clearTimeout(graceTimer);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("scroll", sync);
      document.removeEventListener("focusout", onFocusOut);
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--wallpaper-height");
      root.removeAttribute("data-short");
    };
  }, []);
}

// Same as the short-screen `max-height` media queries in styles.css
const SHORT_HEIGHT = 324;
// How long the keyboard may take to slide away after leaving a text field
const KEYBOARD_CLOSING_MS = 1000;
