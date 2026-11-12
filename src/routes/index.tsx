import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BrowserWindow, type BrowserHandle } from "@/components/BrowserWindow";
import type { CommandLineHandle } from "@/components/CommandLine";
import StarsBackground from "@/components/StarsBackground";
import { TerminalWindow } from "@/components/TerminalWindow";
import { Dock } from "@/components/WindowControls";
import { useFitVisibleViewport } from "@/hooks/use-fit-visible-viewport";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTerminalSession } from "@/hooks/use-terminal-session";
import { useWallpaper } from "@/hooks/use-wallpaper";
import { consumeSkipKey } from "@/lib/skip-key";
import { SITE_URL } from "@/lib/site";
import type { WindowState } from "@/lib/window-state";
import type { ThemeName } from "@/lib/terminal/shell";

const THEME_CLASS: Record<ThemeName, string> = {
  green: "",
  amber: "theme-amber",
  solarized: "theme-solarized",
  "solarized-light": "theme-solarized-light",
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "matteus@legat:~ — Senior Full Stack Engineer" },
      {
        name: "description",
        content:
          "Terminal-style CV of Matteus Legat — frontend-focused full-stack engineer with 10+ years building ecommerce platforms and enterprise applications with React, Next.js, TypeScript, and Node.js.",
      },
      { property: "og:title", content: "matteus@legat:~ — Senior Full Stack Engineer" },
      { property: "og:url", content: `${SITE_URL}/` },
      {
        property: "og:description",
        content:
          "10+ years building ecommerce platforms and enterprise applications with React, Next.js, TypeScript, and Node.js.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
});

function Index() {
  // The intro has typed everything out on its own
  const [introTyped, setIntroTyped] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const reducedMotion = useReducedMotion();
  useFitVisibleViewport();
  const [windowState, setWindowState] = useState<WindowState>("open");
  const [zoomed, setZoomed] = useState(false);
  const dockButtonRef = useRef<HTMLButtonElement>(null);
  // The browser window from the dock, and which window is on top
  const [browserState, setBrowserState] = useState<WindowState>("closed");
  const [browserZoomed, setBrowserZoomed] = useState(false);
  const [front, setFront] = useState<"terminal" | "browser">("terminal");
  const browserButtonRef = useRef<HTMLButtonElement>(null);
  const browserRef = useRef<BrowserHandle>(null);
  const {
    starsRef,
    wallpaper,
    busy: wallpaperBusy,
    status: wallpaperStatus,
    toast,
    toggle: toggleWallpaper,
  } = useWallpaper();
  const session = useTerminalSession();
  const { theme, entries, replaying } = session;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandLineRef = useRef<CommandLineHandle>(null);
  const allDoneRef = useRef(false);

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // The intro is finished once it has typed everything, was skipped, or isn't animated at all
  const allDone = skipped || reducedMotion || introTyped;
  useEffect(() => {
    allDoneRef.current = allDone;
  }, [allDone]);

  // Only output from commands the visitor runs scrolls into view; the intro never scrolls
  useEffect(() => {
    if (entries.length === 0) return;
    scrollToBottom(reducedMotion ? "auto" : "smooth");
  }, [entries, reducedMotion]);

  // A key pressed outside a text field can only come from a hardware keyboard (an on-screen
  // one is only up while typing in one). From then on the prompt may take focus by itself,
  // e.g. on an iPad with a keyboard attached.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      hardwareKeyboard = true;
      window.removeEventListener("keydown", onKey, { capture: true });
    };
    // Capture: noted before the skip below, which focuses the prompt
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  // skip intro on key
  useEffect(() => {
    const skip = (e: KeyboardEvent) => {
      if (!allDoneRef.current && consumeSkipKey(e)) setSkipped(true);
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);

  // While `replay` types: keep the newest line in view if the reader is at the bottom,
  // and hand the prompt back when it's done
  useEffect(() => {
    const el = scrollRef.current;
    // The prompt stays mounted (only hidden) during a replay, so this is the one to refocus
    const input = inputRef.current;
    if (!replaying || !el) return;
    const follow = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTop = el.scrollHeight;
    };
    const observer = new MutationObserver(follow);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      // Back to the prompt, unless focus has moved elsewhere meanwhile (e.g. the browser)
      const active = document.activeElement;
      if (!active || active === document.body || el.contains(active)) {
        autoFocusPrompt(input);
      }
      follow();
    };
  }, [replaying]);

  // Focus the prompt once it appears: always after a skip (the visitor asked for it),
  // otherwise only if nothing else has focus, so it doesn't pull them off a link or button
  useEffect(() => {
    if (!allDone) return;
    const active = document.activeElement;
    if (skipped || !active || active === document.body) {
      autoFocusPrompt(inputRef.current);
    }
  }, [allDone, skipped]);

  // --- Window buttons -------------------------------------------------------

  /** Reopening after close starts over, like a new Terminal window. */
  function startNewSession() {
    session.startNewSession();
    setSkipped(true);
    commandLineRef.current?.setValue("");
    setZoomed(false);
  }

  // Becomes true once the minimize/close animation has finished
  const [hideAnimationDone, setHideAnimationDone] = useState(false);
  const hideTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  function hideWindow(state: "minimized" | "closed") {
    setWindowState(state);
    setHideAnimationDone(false);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setHideAnimationDone(true),
      reducedMotion ? 0 : 400,
    );
  }

  // --- Wallpaper -------------------------------------------------------------------

  // The dock's wallpaper button first minimizes every open window, so the change is in full view
  const dockWallpaperRef = useRef<HTMLButtonElement>(null);
  function switchWallpaper() {
    if (windowState === "open") hideWindow("minimized");
    if (browserState === "open") setBrowserState("minimized");
    // Minimizing moves focus to the dock's app icons; keep it on the wallpaper button
    requestAnimationFrame(() => dockWallpaperRef.current?.focus({ preventScroll: true }));
    return toggleWallpaper();
  }

  function openFromDock() {
    window.clearTimeout(hideTimer.current);
    setHideAnimationDone(false);
    if (windowState === "closed") startNewSession();
    setWindowState("open");
    setFront("terminal");
    // Already open: just bring it forward and back to the prompt
    if (windowState === "open") autoFocusPrompt(inputRef.current);
  }

  function openBrowser() {
    // A closed browser opens as a new, normal-sized window
    if (browserState === "closed") setBrowserZoomed(false);
    setBrowserState("open");
    setFront("browser");
    // Already open: just bring it forward and move focus into it
    if (browserState === "open") browserRef.current?.focus();
  }

  // Focus follows the browser: its first favorite when it opens; when it hides, back to
  // the dock (or the prompt, if the terminal is up and the dock isn't shown)
  const previousBrowserState = useRef(browserState);
  useEffect(() => {
    const previous = previousBrowserState.current;
    previousBrowserState.current = browserState;
    if (previous === browserState) return;
    if (browserState === "open") browserRef.current?.focus();
    else if (windowState === "open") autoFocusPrompt(inputRef.current);
    else browserButtonRef.current?.focus({ preventScroll: true });
  }, [browserState, windowState]);

  // Keep keyboard focus with whatever is on screen: the dock while hidden, the prompt after
  const previousWindowState = useRef(windowState);
  useEffect(() => {
    const previous = previousWindowState.current;
    previousWindowState.current = windowState;
    if (previous === windowState) return;
    if (windowState === "open") autoFocusPrompt(inputRef.current);
    else dockButtonRef.current?.focus();
  }, [windowState]);

  return (
    <>
      <StarsBackground ref={starsRef} />
      <div role="status" className="sr-only">
        {wallpaperStatus}
      </div>
      {/* Visual only: screen readers get the same hint from the status line above */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed left-1/2 top-2 z-30 w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-md border border-white/10 bg-black/70 px-3 py-1.5 font-mono text-xs text-white/90 shadow-lg backdrop-blur-md transition duration-300 motion-reduce:transition-none ${toast.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
      >
        {toast.text}
      </div>
      <div
        className={`terminal-page box-border h-[var(--app-height)] overflow-hidden p-3 pb-0! text-foreground sm:p-6 md:p-10 ${THEME_CLASS[theme]}`}
        // Full-screen layout while the window shows and while it animates away; then the normal layout is back
        data-zoomed={(zoomed && (windowState === "open" || !hideAnimationDone)) || undefined}
      >
        <TerminalWindow
          state={windowState}
          zoomed={zoomed}
          onFocus={() => setFront("terminal")}
          onClose={() => hideWindow("closed")}
          onMinimize={() => hideWindow("minimized")}
          onZoom={() => setZoomed((z) => !z)}
          session={session}
          introDone={allDone}
          introSkipped={skipped || reducedMotion}
          onSkipIntro={() => setSkipped(true)}
          onIntroTyped={() => setIntroTyped(true)}
          scrollRef={scrollRef}
          inputRef={inputRef}
          commandLineRef={commandLineRef}
        />

        <BrowserWindow
          state={browserState}
          zoomed={browserZoomed}
          front={front === "browser"}
          onClose={() => setBrowserState("closed")}
          onMinimize={() => setBrowserState("minimized")}
          onZoom={() => setBrowserZoomed((z) => !z)}
          onFocus={() => setFront("browser")}
          ref={browserRef}
        />

        <Dock
          terminal={windowState}
          // Out of the way only while a window is full screen
          hidden={(zoomed && windowState === "open") || (browserZoomed && browserState === "open")}
          onOpen={openFromDock}
          buttonRef={dockButtonRef}
          browser={browserState}
          onOpenBrowser={openBrowser}
          browserButtonRef={browserButtonRef}
          wallpaper={wallpaper}
          busy={wallpaperBusy}
          onToggleWallpaper={() => void switchWallpaper()}
          wallpaperButtonRef={dockWallpaperRef}
        />
      </div>
    </>
  );
}

// Set once a hardware keyboard has been used (see the listener in Index)
let hardwareKeyboard = false;

/**
 * Focuses the prompt without the visitor asking (intro done, window restored, …). Skipped on
 * touch screens, where focusing would pop the on-screen keyboard open: there only a tap on
 * the terminal does that. Unless they've been typing on a hardware keyboard.
 */
function autoFocusPrompt(input: HTMLInputElement | null) {
  if (!hardwareKeyboard && window.matchMedia("(pointer: coarse)").matches) return;
  input?.focus({ preventScroll: true });
}
