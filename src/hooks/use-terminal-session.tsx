import { useEffect, useRef, useState, type ReactNode } from "react";
import { Replay } from "@/components/Transcript";
import { complete } from "@/lib/terminal/completion";
import { blocks, commandText } from "@/lib/terminal/content";
import { displayPath, HOME } from "@/lib/terminal/filesystem";
import { addToHistory, navigateHistory, type HistoryNav } from "@/lib/terminal/history";
import { runCommand, THEMES, type ThemeName } from "@/lib/terminal/shell";

export type ScreenEntry = { id: number; cmd: string; output: ReactNode; path: string };

/**
 * What the shell remembers: the screen (entries, the intro, the login line), the current
 * folder, the theme and the ↑/↓ history. The handlers are what the prompt calls.
 */
export function useTerminalSession() {
  const [theme, setTheme] = useState<ThemeName>("green");
  const [cwd, setCwd] = useState(HOME);
  // The name banner, the hint line and the intro, until the screen is cleared
  const [showInitialContent, setShowInitialContent] = useState(true);
  // "Last login: …", shown when a closed terminal is opened again
  const [loginLine, setLoginLine] = useState<string | null>(null);
  // What has been run since the screen was last cleared, with its output
  const [entries, setEntries] = useState<ScreenEntry[]>([]);
  const entryId = useRef(0);
  // The `replay` command is typing: the prompt waits, like while a script runs
  const [replaying, setReplaying] = useState(false);
  // Submitted commands for ↑/↓ recall, seeded with the intro's commands. Kept across `clear`, like a shell.
  const commandHistory = useRef<string[]>(blocks.map(commandText));
  const historyNav = useRef<HistoryNav>({ index: null, draft: "" });
  const sessionStart = useRef<Date | null>(null);

  useEffect(() => {
    sessionStart.current = new Date();
  }, []);

  function cycleTheme() {
    setTheme((current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]);
  }

  function addEntry(cmd: string, output: ReactNode, path = displayPath(cwd)) {
    // Taken now: the update below runs later, after any other entries pushed in the same go
    const id = ++entryId.current;
    setEntries((list) => [...list, { id, cmd, output, path }]);
  }

  function clearScreen() {
    setEntries([]);
    setShowInitialContent(false);
    setLoginLine(null);
  }

  /** A fresh session, as when the terminal is opened again after closing. */
  function startNewSession() {
    clearScreen();
    setCwd(HOME);
    historyNav.current = { index: null, draft: "" };
    setLoginLine(`Last login: ${formatLoginDate(sessionStart.current ?? new Date())} on ttys000`);
    sessionStart.current = new Date();
  }

  function submitCommand(raw: string) {
    const result = runCommand(raw, { theme, cwd, history: commandHistory.current });
    if (result.clear) {
      clearScreen();
      return;
    }
    if (result.theme) setTheme(result.theme);
    if (result.replay) {
      setReplaying(true);
      addEntry(raw.trim(), <Replay onDone={() => setReplaying(false)} />);
    } else {
      addEntry(raw.trim(), result.output);
    }
    if (result.cwd) setCwd(result.cwd);
  }

  // --- What the prompt calls ---------------------------------------------------------

  function submitLine(line: string) {
    commandHistory.current = addToHistory(commandHistory.current, line);
    historyNav.current = { index: null, draft: "" };
    submitCommand(line);
  }

  function cancelLine(line: string) {
    addEntry(`${line}^C`, null);
    historyNav.current = { index: null, draft: "" };
  }

  function completeLine(line: string, caretAt: number) {
    const { value, caret, options } = complete(line, cwd, caretAt);
    if (value !== line) return { value, caret };
    if (options.length > 1) {
      addEntry(line, <div style={{ whiteSpace: "pre-wrap" }}>{options.join("  ")}</div>);
    }
    return null;
  }

  function moveInHistory(direction: "up" | "down", line: string) {
    const moved = navigateHistory(commandHistory.current, historyNav.current, line, direction);
    if (!moved) return null;
    const { value, ...nav } = moved;
    historyNav.current = nav;
    return value;
  }

  return {
    theme,
    cycleTheme,
    cwd,
    entries,
    showInitialContent,
    loginLine,
    replaying,
    clearScreen,
    startNewSession,
    submitLine,
    cancelLine,
    completeLine,
    moveInHistory,
  };
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
