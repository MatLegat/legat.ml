import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import cvPdfUrl from "@/assets/CV_MatteusLegat.pdf?url";
import { StaticOutput, Typewriter } from "@/components/Typewriter";
import StarsBackground from "@/components/StarsBackground";
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

  const allDone = activeIdx >= blocks.length;
  allDoneRef.current = allDone;
  const introDone = allDone || skipped;

  // auto-scroll
  useEffect(() => {
    scrollToBottom(allDone ? "smooth" : "auto");
  }, [activeIdx, allDone, cmdDone, outDone, history, theme]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || allDone) return;

    const syncScroll = () => {
      el.scrollTop = el.scrollHeight;
    };

    const mutationObserver = new MutationObserver(syncScroll);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const resizeObserver = new ResizeObserver(syncScroll);
    resizeObserver.observe(el);

    syncScroll();

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [allDone]);

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

  useEffect(() => {
    if (skipped) {
      setActiveIdx(blocks.length);
      setCmdDone(blocks.map(() => true));
      setOutDone(blocks.map(() => true));
    }
  }, [skipped]);

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

  useLayoutEffect(() => {
    const inputEl = inputRef.current;
    const markerEl = mirrorMarkerRef.current;

    if (!allDone || !inputEl || !markerEl) return;

    const nextOffset = Math.max(0, markerEl.offsetLeft - inputEl.scrollLeft);
    setCaretOffset(nextOffset);
  }, [allDone, input, caretIndex]);

  useEffect(() => {
    const inputEl = inputRef.current;
    if (!allDone || !inputEl) return;

    const syncCaret = () => {
      setCaretIndex(inputEl.selectionStart ?? 0);
      setCaretOffset((current) => Math.max(0, current));
    };

    const syncCaretWithFrame = () => {
      requestAnimationFrame(syncCaret);
    };

    syncCaret();
    inputEl.addEventListener("keyup", syncCaret);
    inputEl.addEventListener("click", syncCaret);
    inputEl.addEventListener("select", syncCaret);
    inputEl.addEventListener("scroll", syncCaret);
    window.addEventListener("resize", syncCaretWithFrame);

    return () => {
      inputEl.removeEventListener("keyup", syncCaret);
      inputEl.removeEventListener("click", syncCaret);
      inputEl.removeEventListener("select", syncCaret);
      inputEl.removeEventListener("scroll", syncCaret);
      window.removeEventListener("resize", syncCaretWithFrame);
    };
  }, [allDone]);

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
  }

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
      <StarsBackground />
      <div
        className={`box-border h-dvh overflow-hidden p-3 pb-0! text-foreground sm:p-6 md:p-10 ${THEME_CLASS[theme]}`}
      >
        <div className="terminal-window-blur mx-auto flex h-[calc(100dvh-5.25rem)] sm:h-[calc(100dvh-6rem)] min-h-[16rem] max-w-5xl flex-col overflow-hidden rounded-md backdrop-blur-xs">
          <div
            className="terminal-window mx-auto flex h-[calc(100dvh-5.25rem)] sm:h-[calc(100dvh-6rem)] min-h-[16rem] w-full flex-col overflow-hidden rounded-md border border-border shadow-2xl backdrop-blur-md"
            style={{ backgroundColor: "var(--terminal-bg)" }}
          >
            <div
              className="terminal-window-bar flex shrink-0 items-center justify-between border-b border-border px-4 py-2"
              style={{ backgroundColor: "var(--terminal-header)" }}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[oklch(0.65_0.2_25)]" />
                <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_85)]" />
                <span className="h-3 w-3 rounded-full bg-[oklch(0.72_0.16_145)]" />
              </div>
              <div className="text-xs text-term-dim">— matteus@legat: {displayPath(cwd)} —</div>
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
                  // press enter/space to skip · type <span className="text-term-yellow">help</span>{" "}
                  when prompt appears
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

              {history.map((h) => (
                <div key={h.id} className="mb-4">
                  <div>
                    <Prompt path={h.path} />
                    <span style={{ whiteSpace: "pre-wrap" }}>{h.cmd}</span>
                  </div>
                  {h.output && <div className="mt-1">{h.output}</div>}
                </div>
              ))}

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

        <div className="hide-on-short-height fixed inset-x-0 bottom-5 z-10 flex flex-col gap-1 px-2 md:bottom-3 text-shadow-md text-shadow-black/50">
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

function Prompt({ path = "~" }: { path?: string }) {
  return (
    <>
      <span style={{ color: "var(--term-prompt)" }}>matteus@legat</span>
      <span className="text-term-dim">:</span>
      <span className="text-term-cyan">{path}</span>
      <span className="text-term-dim">$ </span>
    </>
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
