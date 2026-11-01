import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { BrowserWindow, type BrowserHandle, type WindowState } from "@/components/BrowserWindow";
import { Prompt, Replay, Transcript } from "@/components/Transcript";
import StarsBackground, { type StarsHandle } from "@/components/StarsBackground";
import {
  Dock,
  TitleBarWallpaperButton,
  TrafficLights,
  type Wallpaper,
} from "@/components/WindowControls";
import type { BlackHole } from "@/lib/wallpaper/black-hole";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useWindowDrag } from "@/hooks/use-window-drag";
import { SITE_URL } from "@/lib/site";
import {
  addToHistory,
  blocks,
  commandText,
  complete,
  displayPath,
  HOME,
  navigateHistory,
  runCommand,
  THEMES,
  type HistoryNav,
  type ThemeName,
} from "@/lib/terminal";

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

const PROMPT = (
  <>
    <span className="text-term-green">matteus@legat</span>
    <span className="text-term-dim">:</span>
    <span className="text-term-cyan">~</span>
    <span className="text-term-dim">$ </span>
  </>
);

type HistoryEntry = { id: number; cmd: string; output: ReactNode; path: string };

function Index() {
  // The intro has typed everything out on its own
  const [introTyped, setIntroTyped] = useState(false);
  // The `replay` command is typing: the prompt waits, like while a script runs
  const [replaying, setReplaying] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("green");
  const [cwd, setCwd] = useState(HOME);
  const reducedMotion = useReducedMotion();
  const [windowState, setWindowState] = useState<"open" | "minimized" | "closed">("open");
  const [zoomed, setZoomed] = useState(false);
  const [loginLine, setLoginLine] = useState<string | null>(null);
  const dockButtonRef = useRef<HTMLButtonElement>(null);
  // The browser window from the dock, and which window is on top
  const [browserState, setBrowserState] = useState<WindowState>("closed");
  const [browserZoomed, setBrowserZoomed] = useState(false);
  const [front, setFront] = useState<"terminal" | "browser">("terminal");
  const browserButtonRef = useRef<HTMLButtonElement>(null);
  const browserRef = useRef<BrowserHandle>(null);
  const sessionStart = useRef<Date | null>(null);
  const starsRef = useRef<StarsHandle>(null);
  const [wallpaper, setWallpaper] = useState<Wallpaper>("stars");
  const [wallpaperBusy, setWallpaperBusy] = useState(false);
  const [wallpaperStatus, setWallpaperStatus] = useState("");
  const wallpaperBusyRef = useRef(false);
  const blackHoleRef = useRef<BlackHole | null>(null);
  const [toast, setToast] = useState({ text: "", visible: false });
  const toastTimer = useRef(0);
  const [showBanner, setShowBanner] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showCv, setShowCv] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [caretIndex, setCaretIndex] = useState(0);
  const [caretOffset, setCaretOffset] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Dragging the terminal by its title bar (desktop only)
  const terminalShellRef = useRef<HTMLDivElement>(null);
  const terminalFrameRef = useRef<HTMLDivElement>(null);
  const terminalBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorMarkerRef = useRef<HTMLSpanElement>(null);
  const historyId = useRef(0);
  // Submitted commands for ↑/↓ recall, seeded with the intro's commands. Kept across `clear`, like a shell.
  const cmdHistory = useRef<string[]>(blocks.map(commandText));
  const historyNav = useRef<HistoryNav>({ index: null, draft: "" });
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
    if (history.length === 0) return;
    scrollToBottom(reducedMotion ? "auto" : "smooth");
  }, [history, reducedMotion]);

  // skip intro on key
  useEffect(() => {
    const skip = (e: KeyboardEvent) => {
      if (allDoneRef.current || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Enter/Space on a link or button should activate it, not skip
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, [contenteditable]")) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        setSkipped(true);
      }
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
        input?.focus({ preventScroll: true });
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
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [allDone, skipped]);

  function cycleTheme() {
    setTheme((current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]);
  }

  // The fake cursor sits where the text before the caret ends in a hidden copy of the input,
  // shifted by how far the input has scrolled sideways
  const measureCaret = useCallback(() => {
    const inputEl = inputRef.current;
    const markerEl = mirrorMarkerRef.current;
    if (!inputEl || !markerEl) return;
    // Keep the caret in view, e.g. after the window gets narrower; scrolling re-measures
    const caretX = markerEl.offsetLeft;
    const cursorWidth = 10;
    if (caretX - inputEl.scrollLeft > inputEl.clientWidth - cursorWidth) {
      inputEl.scrollLeft = caretX - inputEl.clientWidth + cursorWidth;
    } else if (caretX < inputEl.scrollLeft) {
      inputEl.scrollLeft = caretX;
    }
    setCaretOffset(Math.max(0, caretX - inputEl.scrollLeft));
  }, []);

  useLayoutEffect(() => {
    if (allDone) measureCaret();
  }, [allDone, input, caretIndex, measureCaret]);

  // Clicks, key releases and selections update the caret index via the input's own handlers.
  // These cover what they miss: held-down keys, sideways scrolling and resizes.
  useEffect(() => {
    const inputEl = inputRef.current;
    if (!allDone || !inputEl) return;

    const syncSoon = () =>
      requestAnimationFrame(() => {
        setCaretIndex(inputEl.selectionStart ?? 0);
        measureCaret();
      });

    inputEl.addEventListener("keydown", syncSoon);
    inputEl.addEventListener("scroll", measureCaret);
    window.addEventListener("resize", syncSoon);
    return () => {
      inputEl.removeEventListener("keydown", syncSoon);
      inputEl.removeEventListener("scroll", measureCaret);
      window.removeEventListener("resize", syncSoon);
    };
  }, [allDone, measureCaret]);

  function pushHistory(cmd: string, output: ReactNode, path = displayPath(cwd)) {
    // Taken now: the update below runs later, after any other entries pushed in the same go
    const id = ++historyId.current;
    setHistory((h) => [...h, { id, cmd, output, path }]);
  }

  function clearScreen() {
    setHistory([]);
    setShowBanner(false);
    setShowIntro(false);
    setShowCv(false);
    setLoginLine(null);
  }

  // --- Window buttons -------------------------------------------------------

  useEffect(() => {
    sessionStart.current = new Date();
  }, []);

  /** Reopening after close starts over, like a new Terminal window. */
  function startNewSession() {
    clearScreen();
    setSkipped(true);
    setCwd(HOME);
    setInputValue("");
    historyNav.current = { index: null, draft: "" };
    setZoomed(false);
    setLoginLine(`Last login: ${formatLoginDate(sessionStart.current ?? new Date())} on ttys000`);
    sessionStart.current = new Date();
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

  function showToast(text: string) {
    setToast({ text, visible: true });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  }
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function setBusy(busy: boolean) {
    wallpaperBusyRef.current = busy;
    setWallpaperBusy(busy);
  }

  async function toggleWallpaper() {
    const stars = starsRef.current;
    if (wallpaperBusyRef.current || !stars?.layer) return;
    setBusy(true);

    if (wallpaper === "stars") {
      // The effect's code and styles are downloaded only now, on first use
      let createBlackHole: typeof import("@/lib/wallpaper/black-hole").createBlackHole;
      try {
        ({ createBlackHole } = await import("@/lib/wallpaper/black-hole"));
      } catch {
        setWallpaperStatus("Couldn't load the black hole wallpaper. Try again.");
        setBusy(false);
        return;
      }
      // The page may have gone away while downloading
      if (starsRef.current !== stars || !stars.layer?.isConnected) return;
      const hole = createBlackHole({ layer: stars.layer, stars: stars.takeControl() });
      blackHoleRef.current = hole;
      hole.consume();
      setWallpaper("black-hole");
      setWallpaperStatus("Black hole wallpaper on");
      setBusy(false);
      return;
    }

    const done = () => {
      stars.releaseControl();
      blackHoleRef.current = null;
      setWallpaper("stars");
      setWallpaperStatus("Star wallpaper on. Hint: click on any star");
      showToast("Hint: click on any star");
      setBusy(false);
    };
    if (blackHoleRef.current) blackHoleRef.current.release(done);
    else done();
  }

  useEffect(() => () => blackHoleRef.current?.destroy(), []);

  // Both wallpaper buttons first minimize every open window, so the change is in full view
  const dockWallpaperRef = useRef<HTMLButtonElement>(null);
  function switchWallpaper(keepFocus?: RefObject<HTMLButtonElement | null>) {
    if (windowState === "open") hideWindow("minimized");
    if (browserState === "open") setBrowserState("minimized");
    // Minimizing moves focus to the dock's app icons; keep it on the button that was pressed
    if (keepFocus) requestAnimationFrame(() => keepFocus.current?.focus({ preventScroll: true }));
    return toggleWallpaper();
  }

  function openFromDock() {
    window.clearTimeout(hideTimer.current);
    setHideAnimationDone(false);
    if (windowState === "closed") startNewSession();
    setWindowState("open");
    setFront("terminal");
    // Already open: just bring it forward and back to the prompt
    if (windowState === "open") inputRef.current?.focus({ preventScroll: true });
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
    else if (windowState === "open") inputRef.current?.focus({ preventScroll: true });
    else browserButtonRef.current?.focus({ preventScroll: true });
  }, [browserState, windowState]);

  // Keep keyboard focus with whatever is on screen: the dock while hidden, the prompt after
  const previousWindowState = useRef(windowState);
  useEffect(() => {
    const previous = previousWindowState.current;
    previousWindowState.current = windowState;
    if (previous === windowState) return;
    if (windowState === "open") inputRef.current?.focus({ preventScroll: true });
    else dockButtonRef.current?.focus();
  }, [windowState]);

  function setInputValue(value: string, caret = value.length) {
    setInput(value);
    setCaretIndex(caret);
    const el = inputRef.current;
    requestAnimationFrame(() => el?.setSelectionRange(caret, caret));
  }

  function submitCommand(raw: string) {
    const result = runCommand(raw, { theme, cwd, history: cmdHistory.current });
    if (result.clear) {
      clearScreen();
      return;
    }
    if (result.theme) setTheme(result.theme);
    if (result.replay) {
      setReplaying(true);
      pushHistory(raw.trim(), <Replay onDone={() => setReplaying(false)} />);
    } else {
      pushHistory(raw.trim(), result.output);
    }
    if (result.cwd) setCwd(result.cwd);
  }

  function handleShellKey(e: ReactKeyboardEvent<HTMLInputElement>) {
    // Keys pick IME candidates while composing (e.g. Japanese input)
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const el = e.currentTarget;
    // Ctrl+<letter>, by character or, on non-Latin layouts (e.g. Russian), by physical key
    const ctrl = (letter: string) =>
      e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      (e.key.toLowerCase() === letter ||
        (!/^[a-z]$/i.test(e.key) && e.code === `Key${letter.toUpperCase()}`));

    // Ctrl+C cancels the line, unless there's a selection to copy
    if (ctrl("c")) {
      const inputSelected = el.selectionStart !== el.selectionEnd;
      if (inputSelected || window.getSelection()?.toString()) return;
      e.preventDefault();
      pushHistory(`${input}^C`, null);
      historyNav.current = { index: null, draft: "" };
      setInputValue("");
      return;
    }

    // Ctrl+L clears the screen and keeps the line, like bash
    if (ctrl("l")) {
      e.preventDefault();
      clearScreen();
      return;
    }

    // Tab completes; on an empty line it still moves focus, so keyboard users aren't trapped
    if (e.key === "Tab" && !e.shiftKey && input.trim()) {
      e.preventDefault();
      const { value, caret, options } = complete(input, cwd, el.selectionStart ?? input.length);
      if (value !== input) setInputValue(value, caret);
      else if (options.length > 1) {
        pushHistory(input, <div style={{ whiteSpace: "pre-wrap" }}>{options.join("  ")}</div>);
      }
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const moved = navigateHistory(
        cmdHistory.current,
        historyNav.current,
        input,
        e.key === "ArrowUp" ? "up" : "down",
      );
      if (!moved) return;
      e.preventDefault();
      const { value, ...nav } = moved;
      historyNav.current = nav;
      setInputValue(value);
    }
  }

  const name = ` __  __       _   _                  
|  \\/  | __ _| |_| |_ ___ _   _ ___   
| |\\/| |/ _\` | __| __/ _ \\ | | / __|  
| |  | | (_| | |_| ||  __/ |_| \\__ \\  
|_|  |_|\\__,_|\\__|\\__\\___|\\__,_|___/  `;

  const surname = ` _                   _   
| |    ___  __ _  __| |_ 
| |   / _ \\/ _\` |/ _\` __|
| |__|  __/ (_| | (_| |_ 
|_____\\___|\\__,_|\\__,_\\_|
           |___/        `;

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
        className={`terminal-page box-border h-dvh overflow-hidden p-3 pb-0! text-foreground sm:p-6 md:p-10 ${THEME_CLASS[theme]}`}
        // Full-screen layout while the window shows and while it animates away; then the footer is back
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
                <div className="flex items-center gap-3">
                  <TitleBarWallpaperButton
                    wallpaper={wallpaper}
                    busy={wallpaperBusy}
                    // Minimized, so the black hole and the explosion aren't behind the window
                    onToggle={() => void switchWallpaper()}
                  />
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
                {showBanner && (
                  <div
                    className="flex items-start flex-col mb-4 sm:gap-2 sm:flex-row"
                    aria-hidden="true"
                  >
                    <pre
                      className="whitespace-pre-wrap m-0 mb-0 text-xs sm:text-sm"
                      style={{ color: "var(--term-prompt)" }}
                    >
                      {name}
                    </pre>
                    <pre
                      className="whitespace-pre-wrap m-0 mb-0 text-xs sm:text-sm"
                      style={{ color: "var(--term-prompt)" }}
                    >
                      {surname}
                    </pre>
                  </div>
                )}
                {showIntro && (
                  <div className="text-term-dim mb-6 text-xs">
                    // press enter/space to skip · type{" "}
                    <span className="text-term-yellow">help</span> when prompt appears
                  </div>
                )}

                {/* The intro, typed out. Its plain copy is in the server HTML for crawlers and
                    read by screen readers, then shown in place once typing is done or skipped. */}
                {showCv && (
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
                  {history.map((h) => (
                    <div key={h.id} className="mb-4">
                      <div>
                        <Prompt path={h.path} />
                        <span style={{ whiteSpace: "pre-wrap" }}>{h.cmd}</span>
                      </div>
                      {h.output && <div className="mt-1">{h.output}</div>}
                    </div>
                  ))}
                </div>

                {allDone && (
                  <form
                    hidden={replaying}
                    onSubmit={(e) => {
                      e.preventDefault();
                      cmdHistory.current = addToHistory(cmdHistory.current, input);
                      historyNav.current = { index: null, draft: "" };
                      submitCommand(input);
                      setInput("");
                      setCaretIndex(0);
                    }}
                    className="flex items-center"
                  >
                    <Prompt path={displayPath(cwd)} />
                    <div className="terminal-input-shell ml-2 flex-1">
                      <div className="terminal-input-mirror" aria-hidden>
                        <span>{input.slice(0, caretIndex) || "\u200b"}</span>
                        <span ref={mirrorMarkerRef} className="terminal-input-marker" />
                      </div>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          setCaretIndex(e.target.selectionStart ?? e.target.value.length);
                          // Focus doesn't scroll, so bring the prompt back into view when typing
                          e.target.scrollIntoView({ block: "nearest" });
                        }}
                        onKeyDown={handleShellKey}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        onKeyUp={(e) => setCaretIndex(e.currentTarget.selectionStart ?? 0)}
                        onClick={(e) => setCaretIndex(e.currentTarget.selectionStart ?? 0)}
                        onSelect={(e) => setCaretIndex(e.currentTarget.selectionStart ?? 0)}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label="terminal input"
                        className="terminal-input-field"
                      />
                      {inputFocused && (
                        <span
                          className="cursor-block terminal-input-cursor"
                          style={{ left: `${caretOffset}px` }}
                          aria-hidden
                        />
                      )}
                    </div>
                  </form>
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
          onToggleWallpaper={() => void switchWallpaper(dockWallpaperRef)}
          wallpaperButtonRef={dockWallpaperRef}
        />
      </div>
    </>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `Sat Oct 31 21:05:16`, as in macOS Terminal's "Last login" line. */
function formatLoginDate(d: Date) {
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()} ${time}`;
}
