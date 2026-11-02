// ↑/↓ command history for the prompt.

/** Adds a submitted command to the ↑/↓ history, skipping blanks and repeats of the last one. */
export function addToHistory(list: string[], raw: string): string[] {
  const cmd = raw.trim();
  if (!cmd || list.at(-1) === cmd) return list;
  return [...list, cmd];
}

export type HistoryNav = {
  /** position in the history list; null while editing a new line */
  index: number | null;
  /** the unsent line, restored when stepping past the newest entry */
  draft: string;
};

/** Moves through command history like a shell's ↑/↓. Returns null when nothing changes. */
export function navigateHistory(
  list: string[],
  nav: HistoryNav,
  input: string,
  direction: "up" | "down",
): (HistoryNav & { value: string }) | null {
  if (direction === "up") {
    if (list.length === 0) return null;
    const index = nav.index === null ? list.length - 1 : Math.max(0, nav.index - 1);
    const draft = nav.index === null ? input : nav.draft;
    return { index, draft, value: list[index] };
  }
  if (nav.index === null) return null;
  if (nav.index + 1 >= list.length) return { index: null, draft: nav.draft, value: nav.draft };
  return { index: nav.index + 1, draft: nav.draft, value: list[nav.index + 1] };
}
