import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BrowserWindow, type BrowserHandle } from "@/components/BrowserWindow";
import { CommandLine, type CommandLineHandle } from "@/components/CommandLine";
import { Prompt } from "@/components/Prompt";
import { Transcript } from "@/components/Transcript";
import StarsBackground from "@/components/StarsBackground";
import { Dock, TrafficLights } from "@/components/WindowControls";
import { useFitVisibleViewport } from "@/hooks/use-fit-visible-viewport";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTerminalSession } from "@/hooks/use-terminal-session";
import { useWallpaper } from "@/hooks/use-wallpaper";
import { consumeSkipKey } from "@/lib/skip-key";
import { useWindowDrag } from "@/hooks/use-window-drag";
import { SITE_URL } from "@/lib/site";
import type { WindowState } from "@/lib/window-state";
import { blocks } from "@/lib/terminal/content";
import { displayPath } from "@/lib/terminal/filesystem";
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
      { title: "matteus@legat:~ — Full Stack Developer" },
      {
        name: "description",
        content:
          "Terminal-style CV of Matteus Legat — full-stack web developer with 10+ years building scalable web apps with React, Next.js, and Node.js.",
      },
      { property: "og:title", content: "matteus@legat:~ — Full Stack Developer" },
      { property: "og:url", content: `${SITE_URL}/` },
      {
        property: "og:description",
        content: "10+ years building scalable web apps with React, Next.js, and Node.js.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
});

// The name in big letters at the top of the terminal
const FIRST_NAME_BANNER = ` __  __       _   _                  
|  \\/  | __ _| |_| |_ ___ _   _ ___   
| |\\/| |/ _\` | __| __/ _ \\ | | / __|  
| |  | | (_| | |_| ||  __/ |_| \\__ \\  
|_|  |_|\\__,_|\\__|\\__\\___|\\__,_|___/  `;

const SURNAME_BANNER = ` _                   _   
| |    ___  __ _  __| |_ 
| |   / _ \\/ _\` |/ _\` __|
| |__|  __/ (_| | (_| |_ 
|_____\\___|\\__,_|\\__,_\\_|
           |___/        `;

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
  const {
    theme,
    cycleTheme,
    cwd,
    entries,
    showInitialContent,
    loginLine,
    replaying,
    clearScreen,
    startNewSession: startNewShellSession,
    submitLine,
    cancelLine,
    completeLine,
    moveInHistory,
  } = useTerminalSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  // Dragging the terminal by its title bar (desktop only)
  const terminalShellRef = useRef<HTMLDivElement>(null);
  const terminalFrameRef = useRef<HTMLDivElement>(null);
  const terminalBarRef = useRef<HTMLDivElement>(null);
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
    startNewShellSession();
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

  useWindowDrag({
    shell: terminalShellRef,
    frame: terminalFrameRef,
    handle: terminalBarRef,
    state: windowState,
    zoomed,
    onStart: () => setFront("terminal"),
  });

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
        <div
          ref={terminalShellRef}
          className="terminal-shell"
          data-state={windowState}
          inert={windowState !== "open"}
          // Clicking or tabbing into a window brings it to the front
          onPointerDown={() => setFront("terminal")}
          onFocus={() => setFront("terminal")}
        >
          <div
            ref={terminalFrameRef}
            className="terminal-window-blur mx-auto flex terminal-frame max-w-5xl flex-col overflow-hidden rounded-[12px] backdrop-blur-xs"
          >
            <div
              className="terminal-window mx-auto flex terminal-frame w-full flex-col overflow-hidden rounded-[12px] border border-border shadow-2xl backdrop-blur-md"
              // See-through background rather than a see-through window, so the text and the
              // window buttons keep their real colors (as macOS does)
              style={{
                backgroundColor: "color-mix(in oklab, var(--terminal-bg) 82.5%, transparent)",
              }}
            >
              <div
                ref={terminalBarRef}
                className="terminal-window-bar flex shrink-0 select-none items-center justify-between border-b border-border px-4 py-2"
                style={{
                  backgroundColor: "color-mix(in oklab, var(--terminal-header) 82.5%, transparent)",
                }}
                // Double-clicking the title bar zooms, as on macOS
                onDoubleClick={(e) => {
                  if (!(e.target as HTMLElement).closest("button")) setZoomed((z) => !z);
                }}
              >
                <TrafficLights
                  zoomed={zoomed}
                  onClose={() => hideWindow("closed")}
                  onMinimize={() => hideWindow("minimized")}
                  onZoom={() => setZoomed((z) => !z)}
                />
                <div className="min-w-0 truncate px-2 text-xs text-term-dim">
                  — matteus@legat: {displayPath(cwd)} —
                </div>
                <button
                  type="button"
                  onClick={cycleTheme}
                  className="text-xs text-term-dim cursor-pointer hover:text-foreground transition-colors"
                  aria-label={`Current theme: ${theme}. Click to switch theme.`}
                  title="Click to cycle theme"
                >
                  {theme}
                </button>
              </div>

              <div
                ref={scrollRef}
                onClick={(e) => {
                  if (!allDone) {
                    setSkipped(true);
                    return;
                  }
                  // Leave focus alone after selecting text or clicking a link/button
                  if (window.getSelection()?.toString()) return;
                  if ((e.target as HTMLElement).closest("a, button")) return;
                  inputRef.current?.focus({ preventScroll: true });
                }}
                className="terminal-window-content relative z-0 min-h-0 flex-1 overflow-y-auto p-4 text-sm leading-relaxed crt-glow sm:p-6 sm:text-[15px] md:p-8"
              >
                {showInitialContent && (
                  <div
                    className="flex items-start flex-col mb-4 sm:gap-2 sm:flex-row"
                    aria-hidden="true"
                  >
                    <pre
                      className="whitespace-pre-wrap m-0 mb-0 text-xs sm:text-sm"
                      style={{ color: "var(--term-prompt)" }}
                    >
                      {FIRST_NAME_BANNER}
                    </pre>
                    <pre
                      className="whitespace-pre-wrap m-0 mb-0 text-xs sm:text-sm"
                      style={{ color: "var(--term-prompt)" }}
                    >
                      {SURNAME_BANNER}
                    </pre>
                  </div>
                )}
                {showInitialContent && (
                  <div className="intro-hint text-term-dim mb-6 text-xs">
                    // press enter/space to skip · type{" "}
                    <span className="text-term-yellow">help</span> when prompt appears
                  </div>
                )}

                {/* The intro, typed out. Its plain copy is in the server HTML for crawlers and
                    read by screen readers, then shown in place once typing is done or skipped. */}
                {showInitialContent && (
                  <Transcript
                    blocks={blocks}
                    skipped={skipped || reducedMotion}
                    onDone={() => setIntroTyped(true)}
                  />
                )}

                {loginLine && (
                  <div className="mb-4">
                    <div>{loginLine}</div>
                    <div className="text-xs text-term-dim">
                      // type <span className="text-term-yellow">help</span> to list commands
                    </div>
                  </div>
                )}

                {/* New results are read out by screen readers without moving focus */}
                <div role="log" aria-live="polite" aria-label="Command output">
                  {entries.map((entry) => (
                    <div key={entry.id} className="mb-4">
                      <div>
                        <Prompt path={entry.path} />
                        <span style={{ whiteSpace: "pre-wrap" }}>{entry.cmd}</span>
                      </div>
                      {entry.output && <div className="mt-1">{entry.output}</div>}
                    </div>
                  ))}
                </div>

                {allDone && (
                  <CommandLine
                    ref={commandLineRef}
                    inputRef={inputRef}
                    path={displayPath(cwd)}
                    hidden={replaying}
                    onSubmit={submitLine}
                    onCancel={cancelLine}
                    onClearScreen={clearScreen}
                    onComplete={completeLine}
                    onHistory={moveInHistory}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

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
