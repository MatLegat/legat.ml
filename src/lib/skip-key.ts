/**
 * Whether a key press skips the typing: Enter, Space or Escape, unless it's meant for a link,
 * button or field. A skip key is stopped here: the prompt takes focus right away, so the same
 * Enter would otherwise submit an empty line and the same Space type into it.
 */
export function consumeSkipKey(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return false;
  const target = e.target as HTMLElement | null;
  if (target?.closest("a, button, input, textarea, select, [contenteditable]")) return false;
  if (e.key !== "Enter" && e.key !== " " && e.key !== "Escape") return false;
  e.preventDefault();
  return true;
}
