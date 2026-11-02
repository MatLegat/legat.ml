import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
  type RefObject,
} from "react";
import { Prompt } from "@/components/Prompt";

export type CommandLineHandle = {
  /** Replaces the line, putting the caret at the end */
  setValue(value: string): void;
};

type Props = {
  ref?: Ref<CommandLineHandle>;
  inputRef: RefObject<HTMLInputElement | null>;
  /** shown in the prompt, e.g. `~/skills` */
  path: string;
  /** hidden while something else runs (e.g. `replay`), like a busy shell */
  hidden: boolean;
  onSubmit(line: string): void;
  /** Ctrl+C */
  onCancel(line: string): void;
  /** Ctrl+L */
  onClearScreen(): void;
  /** Tab: the completed line, or null when there's nothing to fill in */
  onComplete(line: string, caret: number): { value: string; caret: number } | null;
  /** ↑/↓: the line to show, or null to leave it */
  onHistory(direction: "up" | "down", line: string): string | null;
};

/**
 * The terminal's prompt and input line. It owns the typed text and the fake block cursor, so
 * typing only re-renders this, not the whole page.
 */
export function CommandLine({
  ref,
  inputRef,
  path,
  hidden,
  onSubmit,
  onCancel,
  onClearScreen,
  onComplete,
  onHistory,
}: Props) {
  const [input, setInput] = useState("");
  const [caretIndex, setCaretIndex] = useState(0);
  const [caretOffset, setCaretOffset] = useState(0);
  const [focused, setFocused] = useState(false);
  const markerRef = useRef<HTMLSpanElement>(null);

  const setValue = useCallback(
    (value: string, caret = value.length) => {
      setInput(value);
      setCaretIndex(caret);
      const el = inputRef.current;
      requestAnimationFrame(() => el?.setSelectionRange(caret, caret));
    },
    [inputRef],
  );
  useImperativeHandle(ref, () => ({ setValue: (value) => setValue(value) }), [setValue]);

  // The fake cursor sits where the text before the caret ends in a hidden copy of the input,
  // shifted by how far the input has scrolled sideways
  const measureCaret = useCallback(() => {
    const inputEl = inputRef.current;
    const markerEl = markerRef.current;
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
  }, [inputRef]);

  useLayoutEffect(() => {
    measureCaret();
  }, [input, caretIndex, measureCaret]);

  // Clicks, key releases and selections update the caret index via the input's own handlers.
  // These cover what they miss: held-down keys, sideways scrolling and resizes.
  useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;
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
  }, [inputRef, measureCaret]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
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
      onCancel(input);
      setValue("");
      return;
    }

    // Ctrl+L clears the screen and keeps the line, like bash
    if (ctrl("l")) {
      e.preventDefault();
      onClearScreen();
      return;
    }

    // Tab completes; on an empty line it still moves focus, so keyboard users aren't trapped
    if (e.key === "Tab" && !e.shiftKey && input.trim()) {
      e.preventDefault();
      const done = onComplete(input, el.selectionStart ?? input.length);
      if (done) setValue(done.value, done.caret);
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const next = onHistory(e.key === "ArrowUp" ? "up" : "down", input);
      if (next === null) return;
      e.preventDefault();
      setValue(next);
    }
  }

  const syncCaret = (e: { currentTarget: HTMLInputElement }) =>
    setCaretIndex(e.currentTarget.selectionStart ?? 0);

  return (
    <form
      hidden={hidden}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(input);
        setInput("");
        setCaretIndex(0);
      }}
      className="flex items-center"
    >
      <Prompt path={path} />
      <div className="terminal-input-shell ml-2 flex-1">
        <div className="terminal-input-mirror" aria-hidden>
          <span>{input.slice(0, caretIndex) || "​"}</span>
          <span ref={markerRef} className="terminal-input-marker" />
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
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onSelect={syncCaret}
          // Commands are lowercase: no auto-capitalizing or correcting on phones
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          aria-label="terminal input"
          className="terminal-input-field"
        />
        {focused && (
          <span
            className="cursor-block terminal-input-cursor"
            style={{ left: `${caretOffset}px` }}
            aria-hidden
          />
        )}
      </div>
    </form>
  );
}
