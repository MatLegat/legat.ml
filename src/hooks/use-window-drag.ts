import { useEffect, useRef, type RefObject } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { clampWindowOffset, type DragGeometry, type Offset } from "@/lib/window-drag";

// Desktop only: a mouse or trackpad and room to move. Touch keeps the fixed layout.
const DRAG_QUERY = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
// Pressing these in the title bar does what they do; it never starts a drag
const NOT_A_HANDLE = "button, a, input, textarea, select, [contenteditable]";
// Movement before a press becomes a drag, so clicks and double-click zoom still work
const DRAG_THRESHOLD = 4;

type Options = {
  /** element that moves: gets the --window-x / --window-y offset */
  shell: RefObject<HTMLElement | null>;
  /** the visible window, measured to keep it reachable */
  frame: RefObject<HTMLElement | null>;
  /** the title bar to grab */
  handle: RefObject<HTMLElement | null>;
  state: "open" | "minimized" | "closed";
  zoomed: boolean;
  /** called when a press starts on the handle (to bring the window forward) */
  onStart?: () => void;
};

/**
 * Lets a window be dragged by its title bar, keeping the title bar reachable. Full screen
 * ignores the offset (CSS) and brings it back after; reopening after a close re-centers.
 * The cursor stays the normal arrow, as on macOS.
 */
export function useWindowDrag({ shell, frame, handle, state, zoomed, onStart }: Options) {
  const canDrag = useMediaQuery(DRAG_QUERY);
  const enabled = canDrag && state === "open" && !zoomed;
  const offset = useRef<Offset>({ x: 0, y: 0 });
  const onStartRef = useRef(onStart);
  useEffect(() => {
    onStartRef.current = onStart;
  });

  // Every helper below reads the refs when called, so they're defined inside each effect

  // Reopened after a close, or dragging no longer possible (small screen, touch): center
  const previousState = useRef(state);
  useEffect(() => {
    const reopened = previousState.current === "closed" && state === "open";
    previousState.current = state;
    if (reopened || !canDrag) setOffset(shell.current, offset, { x: 0, y: 0 });
  }, [state, canDrag, shell]);

  // Keep it reachable when it becomes draggable again (restored, unzoomed) and on resize
  useEffect(() => {
    if (!enabled) return;
    const fit = () => {
      const g = measure(frame.current, handle.current);
      setOffset(shell.current, offset, g ? (clampWindowOffset(offset.current, g) ?? ZERO) : ZERO);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [enabled, shell, frame, handle]);

  // The drag itself
  useEffect(() => {
    const bar = handle.current;
    if (!enabled || !bar) return;

    let press: { x: number; y: number; from: Offset; id: number } | null = null;
    let geometry: DragGeometry | null = null;
    let moving = false;
    let pending: Offset | null = null;
    let frameId = 0;

    const write = () => {
      frameId = 0;
      if (pending) setOffset(shell.current, offset, pending);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as Element | null)?.closest(NOT_A_HANDLE)) return;
      press = { x: e.clientX, y: e.clientY, from: { ...offset.current }, id: e.pointerId };
      moving = false;
      // Follow the pointer from the start, even once it leaves the (short) title bar
      bar.setPointerCapture(e.pointerId);
      // No text selection while dragging across the page
      e.preventDefault();
      onStartRef.current?.();
    };

    const onMove = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.x;
      const dy = e.clientY - press.y;
      if (!moving) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        geometry = measure(frame.current, bar);
        if (!geometry) return;
        moving = true;
      }
      pending = clampWindowOffset({ x: press.from.x + dx, y: press.from.y + dy }, geometry!);
      if (pending && !frameId) frameId = requestAnimationFrame(write);
    };

    const end = (cancel: boolean) => {
      if (moving && press) {
        cancelAnimationFrame(frameId);
        frameId = 0;
        setOffset(shell.current, offset, cancel ? press.from : (pending ?? offset.current));
        // The release after a drag isn't a click on whatever is under the pointer. Only that
        // release: if no click follows, the guard is gone before the next real one.
        bar.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => bar.removeEventListener("click", swallow, { capture: true }), 0);
      }
      press = null;
      moving = false;
      pending = null;
    };
    const onUp = () => end(false);
    const onLost = () => end(false);
    const onKey = (e: KeyboardEvent) => {
      if (moving && e.key === "Escape") end(true);
    };

    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onLost);
    bar.addEventListener("lostpointercapture", onLost);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onLost);
    return () => {
      end(false);
      bar.removeEventListener("pointerdown", onDown);
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onLost);
      bar.removeEventListener("lostpointercapture", onLost);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onLost);
    };
  }, [enabled, shell, frame, handle]);
}

const ZERO: Offset = { x: 0, y: 0 };

function swallow(e: Event) {
  e.stopPropagation();
  e.preventDefault();
}

function setOffset(el: HTMLElement | null, store: { current: Offset }, next: Offset) {
  store.current = next;
  el?.style.setProperty("--window-x", `${Math.round(next.x)}px`);
  el?.style.setProperty("--window-y", `${Math.round(next.y)}px`);
}

/**
 * Where the window sits with no offset, its title bar, and the space above the dock.
 * Uses layout offsets, which ignore transforms: the window may be mid-animation (e.g.
 * growing back from the dock) when this runs, and its on-screen box would be wrong then.
 */
function measure(frame: HTMLElement | null, bar: HTMLElement | null): DragGeometry | null {
  if (!frame || !bar) return null;
  let left = 0;
  let top = 0;
  for (let el: HTMLElement | null = frame; el; el = el.offsetParent as HTMLElement | null) {
    left += el.offsetLeft;
    top += el.offsetTop;
  }
  const dock = document.querySelector<HTMLElement>(".dock");
  const style = dock && getComputedStyle(dock);
  const dockShown = style && style.visibility === "visible" && style.display !== "none";
  const dockTop = dockShown
    ? (dock!.firstElementChild?.getBoundingClientRect().top ?? window.innerHeight)
    : window.innerHeight;
  return {
    base: { left, top, width: frame.offsetWidth },
    barHeight: bar.offsetHeight,
    viewportWidth: window.innerWidth,
    dockTop,
  };
}
