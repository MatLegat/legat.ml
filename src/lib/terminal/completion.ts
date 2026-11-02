// Tab completion for the prompt: command names for the first word, paths after it.

import { lookup, sortedChildren } from "./filesystem";
import { shellEnv, tokenize } from "./shell";

const COMMANDS = [
  "about",
  "bash",
  "cat",
  "cd",
  "clear",
  "contact",
  "echo",
  "education",
  "exit",
  "experience",
  "git",
  "help",
  "history",
  "logout",
  "ls",
  "pwd",
  "replay",
  "sh",
  "skills",
  "sudo",
  "theme",
  "whoami",
];

function commonPrefix(words: string[]) {
  let prefix = words[0] ?? "";
  for (const word of words) while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

/** Where the word at the end of `text` starts, and the quote left open in it (if any). */
function lastWord(text: string): { start: number; quote: '"' | "'" | null } {
  let start = 0;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (quote === '"' && c === "\\") i++;
    } else if (c === "\\") i++;
    else if (c === '"' || c === "'") quote = c;
    else if (/\s/.test(c)) start = i + 1;
  }
  return { start, quote };
}

export type Completion = {
  value: string;
  /** caret position after completing */
  caret: number;
  /** candidates to list when there is more than one */
  options: string[];
};

/**
 * Completes the word at the caret like a shell's Tab: commands for the first word, paths after.
 * Quotes, `~` and `$VARS` in the word are understood the same way as when the command runs.
 */
export function complete(input: string, cwd: string, caret = input.length): Completion {
  const head = input.slice(0, caret);
  const tail = input.slice(caret);
  const unchanged: Completion = { value: input, caret, options: [] };

  const env = shellEnv(cwd);
  const { start, quote } = lastWord(head);
  const beforeWords = tokenize(head.slice(0, start), env);
  const word = tokenize(head.slice(start), env)[0] ?? "";
  const first = beforeWords.length === 0;

  let base = word;
  let candidates: { name: string; isDir: boolean }[];
  if (first && !word.includes("/")) {
    candidates = COMMANDS.map((name) => ({ name, isDir: false }));
  } else {
    const slash = word.lastIndexOf("/");
    base = word.slice(slash + 1);
    const found = lookup(cwd, word.slice(0, slash + 1) || ".");
    if (found.kind !== "dir") return unchanged;
    candidates = sortedChildren(found.node)
      .filter(([, node]) => {
        if (beforeWords[0] === "cd") return node.type === "dir";
        if (first) return node.type === "dir" || node.executable;
        return true;
      })
      .map(([name, node]) => ({ name, isDir: node.type === "dir" }));
  }

  const matches = candidates.filter((c) => c.name.startsWith(base));
  if (matches.length === 0) return unchanged;

  let added: string;
  let options: string[] = [];
  if (matches.length === 1) {
    const [match] = matches;
    // A finished word closes its quote and gets a space; folders stay open for more typing
    const end = match.isDir ? "/" : `${quote ?? ""}${/^\s/.test(tail) ? "" : " "}`;
    added = match.name.slice(base.length) + end;
  } else {
    added = commonPrefix(matches.map((m) => m.name)).slice(base.length);
    options = matches.map((m) => m.name + (m.isDir ? "/" : ""));
  }
  const newHead = head + added;
  return { value: newHead + tail, caret: newHead.length, options };
}
