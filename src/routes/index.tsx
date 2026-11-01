import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import cvPdfUrl from "@/assets/CV_MatteusLegat.pdf?url";
import { StaticOutput, Typewriter } from "@/components/Typewriter";
import StarsBackground, { type StarsHandle } from "@/components/StarsBackground";
import {
  Dock,
  TitleBarWallpaperButton,
  TrafficLights,
  type Wallpaper,
} from "@/components/WindowControls";
import type { BlackHole } from "@/lib/wallpaper/black-hole";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE_URL } from "@/lib/site";
import {
  addToHistory,
  blocks,
  commandText,
  complete,
  displayPath,
  FAST,
  HOME,
  navigateHistory,
  runCommand,
  THEMES,
  type Block,
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
  const [activeIdx, setActiveIdx] = useState(0);
  const [cmdDone, setCmdDone] = useState<boolean[]>(() => blocks.map(() => false));
  const [outDone, setOutDone] = useState<boolean[]>(() => blocks.map(() => false));
  const [skipped, setSkipped] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("green");
  const [cwd, setCwd] = useState(HOME);
  const reducedMotion = useReducedMotion();
  const [windowState, setWindowState] = useState<"open" | "minimized" | "closed">("open");
  const [zoomed, setZoomed] = useState(false);
  const [loginLine, setLoginLine] = useState<string | null>(null);
  const dockButtonRef = useRef<HTMLButtonElement>(null);
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
  const allDone = skipped || reducedMotion || activeIdx >= blocks.length;
  const introDone = allDone;
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

  function pushHistory(cmd: string, output: ReactNode) {
    historyId.current += 1;
    const path = displayPath(cwd);
    setHistory((h) => [...h, { id: historyId.current, cmd, output, path }]);
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

  function openFromDock() {
    window.clearTimeout(hideTimer.current);
    setHideAnimationDone(false);
    if (windowState === "closed") startNewSession();
    setWindowState("open");
  }

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
    pushHistory(raw.trim(), result.output);
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
        <div className="terminal-shell" data-state={windowState} inert={windowState !== "open"}>
          <div className="terminal-window-blur mx-auto flex terminal-frame max-w-5xl flex-col overflow-hidden rounded-md backdrop-blur-xs">
            <div
              className="terminal-window mx-auto flex terminal-frame w-full flex-col overflow-hidden rounded-md border border-border shadow-2xl backdrop-blur-md"
              style={{ backgroundColor: "var(--terminal-bg)" }}
            >
              <div
                className="terminal-window-bar flex shrink-0 select-none items-center justify-between border-b border-border px-4 py-2"
                style={{ backgroundColor: "var(--terminal-header)" }}
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
                <div className="text-xs text-term-dim">— matteus@legat: {displayPath(cwd)} —</div>
                <div className="flex items-center gap-3">
                  <TitleBarWallpaperButton
                    wallpaper={wallpaper}
                    busy={wallpaperBusy}
                    // Minimized, so the black hole and the explosion aren't behind the window
                    onToggle={() => {
                      hideWindow("minimized");
                      void toggleWallpaper();
                    }}
                  />
                  <button
                    type="button"
                    onClick={cycleTheme}
                    className="hidden sm:block text-xs text-term-dim cursor-pointer hover:text-foreground transition-colors"
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

                {/* Full CV as plain text: in the server HTML for crawlers, read by screen readers
                  while the animated copy types, then shown in its place once done or skipped */}
                {showCv && (
                  <div className={introDone ? undefined : "sr-only"}>
                    {blocks.map((b) => (
                      <StaticBlock key={b.id} block={b} />
                    ))}
                  </div>
                )}

                {!introDone && (
                  <div aria-hidden="true">
                    {blocks.map((b, i) => {
                      if (i > activeIdx) return null;
                      const isActive = i === activeIdx;
                      return (
                        <div key={b.id} className="mb-6">
                          <div>
                            <Prompt />
                            <Typewriter
                              segments={b.command}
                              speed={b.cmdSpeed ?? 28}
                              cursor={isActive && !cmdDone[i]}
                              start={i === activeIdx}
                              onDone={() =>
                                setCmdDone((prev) => {
                                  if (prev[i]) return prev;
                                  const next = [...prev];
                                  next[i] = true;
                                  return next;
                                })
                              }
                            />
                          </div>
                          {(cmdDone[i] || !isActive) && (
                            <div>
                              <Typewriter
                                segments={b.output}
                                speed={b.outSpeed ?? FAST}
                                cursor={isActive && !outDone[i]}
                                start={cmdDone[i]}
                                onDone={() => {
                                  setOutDone((prev) => {
                                    if (prev[i]) return prev;
                                    const next = [...prev];
                                    next[i] = true;
                                    return next;
                                  });
                                  setActiveIdx((idx) => Math.max(idx, i + 1));
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

        {windowState !== "open" && (
          <Dock
            minimized={windowState === "minimized"}
            onOpen={openFromDock}
            buttonRef={dockButtonRef}
            wallpaper={wallpaper}
            busy={wallpaperBusy}
            onToggleWallpaper={() => void toggleWallpaper()}
          />
        )}

        <div className="hide-on-short-height hide-when-zoomed fixed inset-x-0 bottom-5 z-10 flex flex-col gap-1 px-2 md:bottom-3 text-shadow-md text-shadow-black/50">
          <p className="mx-auto mt-4 max-w-5xl text-center text-xs text-term-dim">
            <a
              href="mailto:matteus@legat.ml"
              className="text-term-dim underline-offset-4 hover:text-foreground hover:underline transition-colors"
            >
              matteus@legat.ml
            </a>
            {" · theme: "}
            <button
              type="button"
              onClick={cycleTheme}
              className="cursor-pointer text-term-dim underline-offset-4 hover:text-foreground hover:underline transition-colors text-shadow-md text-shadow-black/50"
              aria-label={`Current theme: ${theme}. Click to switch theme.`}
              title="Click to cycle theme"
            >
              {theme}
            </button>
          </p>
          <p className="mx-auto max-w-5xl text-center text-xs text-term-dim">
            <a
              href={cvPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-term-dim underline-offset-4 hover:text-foreground hover:underline transition-colors"
            >
              Download CV as PDF
            </a>
            {` · ${new Date().getFullYear()}`}
          </p>
        </div>
      </div>
    </>
  );
}

// Hidden from screen readers: repeating "matteus@legat:~$" before every line is noise
function Prompt({ path = "~" }: { path?: string }) {
  return (
    <span aria-hidden="true">
      <span style={{ color: "var(--term-prompt)" }}>matteus@legat</span>
      <span className="text-term-dim">:</span>
      <span className="text-term-cyan">{path}</span>
      <span className="text-term-dim">$ </span>
    </span>
  );
}

function StaticBlock({ block }: { block: Block }) {
  return (
    <div className="mb-6">
      <div>
        <Prompt />
        <StaticOutput segments={block.command} />
      </div>
      <div>
        <StaticOutput segments={block.output} />
      </div>
    </div>
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
