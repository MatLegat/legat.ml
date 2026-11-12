// The fake home directory the shell commands browse.

import type { Segment } from "@/components/Typewriter";
import { blockOutput, CONTACTS, LANGUAGES, SKILLS, STATUS } from "./content";

export const HOME = "/home/matteus";
export const USER = "matteus";
export const FILE_DATE = "Jun  3 22:58";

export type FsDir = { type: "dir"; children: Record<string, FsNode>; listing?: Segment[] };
export type FsFile = { type: "file"; content: Segment[]; executable?: boolean; run?: Segment[] };
export type FsNode = FsDir | FsFile;

function dir(children: Record<string, FsNode>, listing?: Segment[]): FsDir {
  return { type: "dir", children, listing };
}

// What `cat contact.sh` shows; running it prints the contact block.
const CONTACT_SCRIPT: Segment[] = [
  { text: "\n" },
  { text: "#!/usr/bin/env bash\n", className: "text-term-dim" },
  { text: "echo ", className: "text-term-cyan" },
  { text: '"> Booting contact channel..."\n', className: "text-term-green" },
  { text: "echo ", className: "text-term-cyan" },
  { text: '"> Channel ready."\n', className: "text-term-green" },
  { text: "echo\n", className: "text-term-cyan" },
  ...[
    ...CONTACTS.map(([label, text]) => [label, text]),
    ["languages", LANGUAGES],
    ["status", STATUS],
  ].flatMap(([label, text]): Segment[] => [
    { text: "printf ", className: "text-term-cyan" },
    { text: '"  %-9s %s\\n" ', className: "text-term-green" },
    { text: `${label} ` },
    { text: `"${text}"\n`, className: "text-term-green" },
  ]),
];

const FS: FsDir = dir({
  home: dir({
    [USER]: dir({
      "about.md": { type: "file", content: blockOutput("about") },
      "contact.sh": {
        type: "file",
        content: CONTACT_SCRIPT,
        executable: true,
        run: blockOutput("contact"),
      },
      "education.txt": { type: "file", content: blockOutput("education") },
      skills: dir(
        Object.fromEntries(
          SKILLS.map(([name, techs]) => [name, dir({}, [{ text: `${techs}\n` }])]),
        ),
        blockOutput("skills"),
      ),
    }),
  }),
});

/** Turns a path typed by the user into an absolute, normalized path. */
export function resolvePath(cwd: string, path: string): string {
  let p = path;
  if (p === "~" || p.startsWith("~/")) p = HOME + p.slice(1);
  const parts = p.startsWith("/") ? [] : cwd.split("/").filter(Boolean);
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return `/${parts.join("/")}`;
}

export function getNode(abs: string): FsNode | undefined {
  let node: FsNode = FS;
  for (const part of abs.split("/").filter(Boolean)) {
    if (node.type !== "dir") return undefined;
    // Own entries only, so names like `constructor` or `__proto__` aren't found on the prototype
    if (!Object.hasOwn(node.children, part)) return undefined;
    const next: FsNode = node.children[part];
    node = next;
  }
  return node;
}

type Lookup =
  | { kind: "missing"; abs: string }
  | { kind: "notDir"; abs: string }
  | { kind: "dir"; abs: string; node: FsDir }
  | { kind: "file"; abs: string; node: FsFile };

export function lookup(cwd: string, path: string): Lookup {
  const abs = resolvePath(cwd, path);
  const node = getNode(abs);
  if (!node) return { kind: "missing", abs };
  if (node.type === "file") {
    return path.endsWith("/") ? { kind: "notDir", abs } : { kind: "file", abs, node };
  }
  return { kind: "dir", abs, node };
}

/** Path as the prompt shows it: home becomes `~`. */
export function displayPath(abs: string) {
  if (abs === HOME) return "~";
  if (abs.startsWith(`${HOME}/`)) return `~${abs.slice(HOME.length)}`;
  return abs;
}

/** A folder's entries, sorted by name. */
export function sortedChildren(node: FsDir): [string, FsNode][] {
  return Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b));
}
