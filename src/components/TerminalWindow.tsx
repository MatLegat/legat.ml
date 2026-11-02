import { useRef, type Ref, type RefObject } from "react";
import { CommandLine, type CommandLineHandle } from "@/components/CommandLine";
import { Prompt } from "@/components/Prompt";
import { Transcript } from "@/components/Transcript";
import { TrafficLights } from "@/components/WindowControls";
import type { TerminalSession } from "@/hooks/use-terminal-session";
import { useWindowDrag } from "@/hooks/use-window-drag";
import { blocks } from "@/lib/terminal/content";
import { displayPath } from "@/lib/terminal/filesystem";
import type { WindowState } from "@/lib/window-state";

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

type TerminalWindowProps = {
  state: WindowState;
  zoomed: boolean;
  /** clicked or tabbed into: bring it to the front */
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onZoom: () => void;
  session: TerminalSession;
  /** the intro has finished typing (or was skipped): the prompt shows */
  introDone: boolean;
  /** show the intro all at once instead of typing it */
  introSkipped: boolean;
  onSkipIntro: () => void;
  onIntroTyped: () => void;
  /** the scrolling content, the prompt's input, and the prompt itself */
  scrollRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  commandLineRef: Ref<CommandLineHandle>;
};

/** The Terminal window: title bar, the intro, what has been run, and the prompt. */
export function TerminalWindow({
  state,
  zoomed,
  onFocus,
  onClose,
  onMinimize,
  onZoom,
  session,
  introDone,
  introSkipped,
  onSkipIntro,
  onIntroTyped,
  scrollRef,
  inputRef,
  commandLineRef,
}: TerminalWindowProps) {
  const {
    theme,
    cycleTheme,
    cwd,
    entries,
    showInitialContent,
    loginLine,
    replaying,
    clearScreen,
    submitLine,
    cancelLine,
    completeLine,
    moveInHistory,
  } = session;

  // Dragging the window by its title bar (desktop only)
  const shellRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useWindowDrag({
    shell: shellRef,
    frame: frameRef,
    handle: barRef,
    state,
    zoomed,
    onStart: onFocus,
  });

  return (
    <div
      ref={shellRef}
      className="terminal-shell"
      data-state={state}
      inert={state !== "open"}
      // Clicking or tabbing into a window brings it to the front
      onPointerDown={onFocus}
      onFocus={onFocus}
    >
      <div
        ref={frameRef}
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
            ref={barRef}
            className="terminal-window-bar flex shrink-0 select-none items-center justify-between border-b border-border px-4 py-2"
            style={{
              backgroundColor: "color-mix(in oklab, var(--terminal-header) 82.5%, transparent)",
            }}
            // Double-clicking the title bar zooms, as on macOS
            onDoubleClick={(e) => {
              if (!(e.target as HTMLElement).closest("button")) onZoom();
            }}
          >
            <TrafficLights
              zoomed={zoomed}
              onClose={onClose}
              onMinimize={onMinimize}
              onZoom={onZoom}
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
              if (!introDone) {
                onSkipIntro();
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
                // press enter/space to skip · type <span className="text-term-yellow">help</span>{" "}
                when prompt appears
              </div>
            )}

            {/* The intro, typed out. Its plain copy is in the server HTML for crawlers and
                  read by screen readers, then shown in place once typing is done or skipped. */}
            {showInitialContent && (
              <Transcript blocks={blocks} skipped={introSkipped} onDone={onIntroTyped} />
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

            {introDone && (
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
  );
}
