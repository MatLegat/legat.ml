import { useEffect } from "react";

/**
 * Keeps the page exactly as tall as what's visible, so only the windows' own content scrolls.
 *
 * Android Chrome shrinks the page above the on-screen keyboard (viewport meta
 * `interactive-widget=resizes-content`), but iOS Safari doesn't: it covers the page with the
 * keyboard and pans the whole page up to show the focused field. This follows the visible
 * height (`--app-height`, which the CSS uses in place of 100dvh) and undoes that pan.
 */
export function useFitVisibleViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;

    let lastHeight = vv.height;
    const sync = () => {
      // Pinch-zoomed in: the visible area is smaller on purpose, leave the page alone
      if (Math.abs(vv.scale - 1) > 0.01) return;
      root.style.setProperty("--app-height", `${Math.round(vv.height)}px`);
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
      // The keyboard just took space: bring the field being typed in back into view, as it
      // may now sit below the fold of its window's scrolling content
      const shrank = vv.height < lastHeight - 1;
      lastHeight = vv.height;
      const field = document.activeElement;
      if (shrank && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
        requestAnimationFrame(() => field.scrollIntoView({ block: "nearest" }));
      }
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("scroll", sync);
      root.style.removeProperty("--app-height");
    };
  }, []);
}
