// The shell: splits a command line into words and runs it against the fake filesystem.

import type { ReactNode } from "react";
import { StaticOutput } from "@/components/Typewriter";
import { blockOutput } from "./content";
import {
  FILE_DATE,
  getNode,
  HOME,
  lookup,
  resolvePath,
  sortedChildren,
  USER,
  type FsDir,
  type FsNode,
} from "./filesystem";

export type ThemeName = "green" | "amber" | "solarized" | "solarized-light";
export const THEMES: ThemeName[] = ["green", "amber", "solarized", "solarized-light"];

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** The variables `$NAME` expands to. */
export function shellEnv(cwd: string): Record<string, string> {
  return { USER, LOGNAME: USER, HOME, PWD: cwd, SHELL: "/bin/bash" };
}

/** Splits a command line into words, handling quotes, backslashes, `~` and `$VARS`. */
export function tokenize(line: string, env: Record<string, string>): string[] {
  const tokens: string[] = [];
  let cur = "";
  let inToken = false;
  let quote: '"' | "'" | null = null;

  // Length of a `$NAME` reference at i (0 if none); its value is appended to the word.
  const expandVar = (i: number) => {
    const m = /^\$(\w+)/.exec(line.slice(i));
    if (!m) return 0;
    cur += env[m[1]] ?? "";
    return m[0].length;
  };

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (quote === '"' && c === "\\" && i + 1 < line.length) cur += line[++i];
      else if (quote === '"' && c === "$" && /\w/.test(line[i + 1] ?? "")) i += expandVar(i) - 1;
      else cur += c;
      continue;
    }
    if (/\s/.test(c)) {
      if (inToken) tokens.push(cur);
      cur = "";
      inToken = false;
      continue;
    }
    const tokenStart = !inToken;
    inToken = true;
    if (c === '"' || c === "'") quote = c;
    else if (c === "\\" && i + 1 < line.length) cur += line[++i];
    else if (c === "$" && /\w/.test(line[i + 1] ?? "")) i += expandVar(i) - 1;
    else if (c === "~" && tokenStart && (i + 1 === line.length || /[\s/]/.test(line[i + 1])))
      cur += HOME;
    else cur += c;
  }
  if (inToken) tokens.push(cur);
  return tokens;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

export type ShellContext = {
  theme: ThemeName;
  /** absolute path of the current directory */
  cwd: string;
  /** submitted commands, oldest first */
  history: string[];
};

export type CommandResult = {
  /** what to print under the command; null prints nothing */
  output: ReactNode;
  /** `clear`: wipe the screen instead of printing */
  clear?: boolean;
  /** `theme <name>`: switch to this theme */
  theme?: ThemeName;
  /** `cd`: the new current directory */
  cwd?: string;
  /** `replay`: run the intro's commands again, each as its own entry */
  replay?: boolean;
};

const PRE = { whiteSpace: "pre-wrap" } as const;

function errorLine(message: ReactNode, key?: number) {
  return (
    <div key={key} className="text-sm text-term-red" style={PRE}>
      {message}
    </div>
  );
}

function hintLine(message: ReactNode) {
  return <div className="text-sm text-term-dim">{message}</div>;
}

function error(message: ReactNode): CommandResult {
  return { output: errorLine(message) };
}

function print(text: string): CommandResult {
  // A non-breaking space keeps an empty line (e.g. bare `echo`) one line tall
  return { output: <div style={PRE}>{text || "\u00a0"}</div> };
}

function block(id: string): CommandResult {
  return { output: <StaticOutput segments={blockOutput(id)} /> };
}

function entryName(name: string, node: FsNode) {
  if (node.type === "dir") return <span className="text-term-cyan">{name}/</span>;
  if (node.executable) return <span className="text-term-green">{name}*</span>;
  return <span>{name}</span>;
}

function sizeOf(node: FsNode) {
  return node.type === "dir" ? 4096 : node.content.map((s) => s.text).join("").length;
}

function shortListing(entries: [string, FsNode][], onePerLine: boolean) {
  if (entries.length === 0) return null;
  return (
    <div style={PRE}>
      {entries.map(([name, node], i) => (
        <span key={`${i}-${name}`}>
          {i > 0 && (onePerLine ? "\n" : "  ")}
          {entryName(name, node)}
        </span>
      ))}
    </div>
  );
}

function longListing(entries: [string, FsNode][]) {
  const total = entries.reduce((sum, [, node]) => sum + Math.ceil(sizeOf(node) / 4096) * 4, 0);
  const width = Math.max(0, ...entries.map(([, node]) => String(sizeOf(node)).length));
  return (
    <div style={PRE}>
      {`total ${total}`}
      {entries.map(([name, node], i) => {
        const mode =
          node.type === "dir" ? "drwxr-xr-x" : node.executable ? "-rwxr-xr-x" : "-rw-r--r--";
        const links = node.type === "dir" ? 2 : 1;
        const size = String(sizeOf(node)).padStart(width);
        return (
          <span key={`${i}-${name}`}>
            {"\n"}
            <span className="text-term-dim">
              {`${mode} ${links} ${USER} ${USER} ${size} ${FILE_DATE} `}
            </span>
            {entryName(name, node)}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function lsError(message: string): CommandResult {
  return {
    output: (
      <>
        {errorLine(message)}
        {hintLine("Try 'ls --help' for more information.")}
      </>
    ),
  };
}

/** The flags and paths given to `ls`, or what to print right away (help or a bad option). */
function parseLsArgs(args: string[]): { flags: Set<string>; paths: string[] } | CommandResult {
  const flags = new Set<string>();
  const paths: string[] = [];
  let endOfOptions = false;
  for (const arg of args) {
    if (endOfOptions || arg === "-" || !arg.startsWith("-")) paths.push(arg);
    else if (arg === "--") endOfOptions = true;
    else if (arg === "--all") flags.add("a");
    else if (arg === "--help") return print("Usage: ls [-1alA] [FILE]...");
    else if (arg.startsWith("--")) return lsError(`ls: unrecognized option '${arg}'`);
    else {
      for (const flag of arg.slice(1)) {
        if (!"1alAFh".includes(flag)) return lsError(`ls: invalid option -- '${flag}'`);
        flags.add(flag);
      }
    }
  }
  return { flags, paths };
}

function ls(args: string[], cwd: string): CommandResult {
  const parsed = parseLsArgs(args);
  if ("output" in parsed) return parsed;
  const { flags, paths } = parsed;

  const long = flags.has("l");
  const all = flags.has("a");
  const listEntries = (entries: [string, FsNode][]) =>
    long ? longListing(entries) : shortListing(entries, flags.has("1"));

  const targets = paths.length ? paths : ["."];
  const errors: ReactNode[] = [];
  const files: [string, FsNode][] = [];
  const dirs: { path: string; abs: string; node: FsDir }[] = [];
  targets.forEach((path, i) => {
    const found = lookup(cwd, path);
    if (found.kind === "missing" || found.kind === "notDir") {
      const reason = found.kind === "missing" ? "No such file or directory" : "Not a directory";
      errors.push(errorLine(`ls: cannot access '${path}': ${reason}`, i));
    } else if (found.kind === "file") files.push([path, found.node]);
    else dirs.push({ path, abs: found.abs, node: found.node });
  });

  const sections: ReactNode[] = [];
  if (files.length) sections.push(listEntries(files));
  for (const { path, abs, node } of dirs) {
    let body: ReactNode;
    if (node.listing && !long && !all && !flags.has("1")) {
      body = <StaticOutput segments={node.listing} />;
    } else {
      const entries = sortedChildren(node);
      if (all) {
        const parent = getNode(resolvePath(abs, "..")) ?? node;
        entries.unshift([".", node], ["..", parent]);
      }
      body = listEntries(entries);
    }
    sections.push(
      targets.length > 1 ? (
        <div style={PRE}>
          {`${path}:\n`}
          {body}
        </div>
      ) : (
        body
      ),
    );
  }

  return {
    output: (
      <>
        {errors}
        {sections.map((section, i) => (
          <div key={i} className={i > 0 ? "mt-4" : undefined}>
            {section}
          </div>
        ))}
      </>
    ),
  };
}

function cat(args: string[], cwd: string): CommandResult {
  const paths = args.filter((a) => a === "-" || !a.startsWith("-"));
  if (paths.length === 0) {
    return {
      output: hintLine(
        <>
          cat: reading from standard input isn&apos;t supported here — try{" "}
          <span className="text-term-yellow">cat about.md</span>
        </>,
      ),
    };
  }
  return {
    output: (
      <>
        {paths.map((path, i) => {
          const found = lookup(cwd, path);
          if (found.kind === "missing")
            return errorLine(`cat: ${path}: No such file or directory`, i);
          if (found.kind === "notDir") return errorLine(`cat: ${path}: Not a directory`, i);
          if (found.kind === "dir") return errorLine(`cat: ${path}: Is a directory`, i);
          return <StaticOutput key={i} segments={found.node.content} />;
        })}
      </>
    ),
  };
}

function cd(args: string[], cwd: string): CommandResult {
  if (args.length > 1) return error("bash: cd: too many arguments");
  const path = args[0] ?? HOME;
  if (path === "-") return error("bash: cd: OLDPWD not set");
  const found = lookup(cwd, path);
  if (found.kind === "missing") return error(`bash: cd: ${path}: No such file or directory`);
  if (found.kind !== "dir") return error(`bash: cd: ${path}: Not a directory`);
  return { output: null, cwd: found.abs };
}

/** Runs a file, as `./contact.sh` or `bash contact.sh` would. */
function execute(path: string, cwd: string, shell: string | null): CommandResult {
  const prefix = shell ?? "bash";
  const found = lookup(cwd, path);
  if (found.kind === "missing") return error(`${prefix}: ${path}: No such file or directory`);
  if (found.kind === "notDir") return error(`${prefix}: ${path}: Not a directory`);
  if (found.kind === "dir") return error(`${prefix}: ${path}: Is a directory`);
  const file = found.node;
  if (!file.run) {
    // Without a shell, a non-executable file is refused. Through `bash file` it isn't a script.
    if (!shell) return error(`bash: ${path}: Permission denied`);
    return error(`${shell}: ${path}: not a shell script`);
  }
  if (!shell && !file.executable) return error(`bash: ${path}: Permission denied`);
  return { output: <StaticOutput segments={file.run} /> };
}

function git(args: string[]): CommandResult {
  const sub = args[0];
  if (sub === "log") return block("experience");
  if (!sub || sub === "--help" || sub === "help") {
    return print("usage: git log [--oneline] experience");
  }
  return {
    output: (
      <>
        {errorLine(`git: '${sub}' is not available here`)}
        {hintLine(
          <>
            try <span className="text-term-yellow">git log</span>
          </>,
        )}
      </>
    ),
  };
}

function help(): CommandResult {
  const cmd = (name: string) => <span className="text-term-yellow">{name}</span>;
  return {
    output: (
      <div className="text-sm">
        <div>
          {cmd("whoami")} · {cmd("about")} · {cmd("skills")} · {cmd("experience")} ·{" "}
          {cmd("education")} · {cmd("contact")}
        </div>
        <div>
          {cmd("ls")} · {cmd("cat")} · {cmd("cd")} · {cmd("pwd")} · {cmd("echo")} · {cmd("history")}{" "}
          · {cmd("git log")} · {cmd("./contact.sh")}
        </div>
        <div>
          {cmd("theme")} <span className="text-term-dim">&lt;name&gt;</span> palette:{" "}
          <span className="text-term-green">green</span> ·{" "}
          <span className="text-term-yellow">amber</span> ·{" "}
          <span className="text-term-cyan">solarized</span> ·{" "}
          <span className="text-term-magenta">solarized-light</span>
        </div>
        <div>
          {cmd("replay")} run the intro again · {cmd("clear")} clear the screen · {cmd("help")} this
          list
        </div>
        <div className="text-term-dim">
          keys: ↑/↓ history · Tab complete · Ctrl+C cancel · Ctrl+L clear
        </div>
      </div>
    ),
  };
}

function theme(args: string[], currentTheme: ThemeName): CommandResult {
  if (args.length === 0) {
    return {
      output: (
        <div className="text-sm">
          <div>
            current theme: <span className="text-term-yellow">{currentTheme}</span>
          </div>
          <div className="text-term-dim">
            available: green · amber · solarized · solarized-light
          </div>
        </div>
      ),
    };
  }
  const t = args[0].toLowerCase() as ThemeName;
  if (!THEMES.includes(t)) {
    return error(
      `theme: unknown palette '${args[0]}' — try green, amber, solarized, or solarized-light`,
    );
  }
  return {
    theme: t,
    output: (
      <div className="text-sm">
        <span className="text-term-green">✓</span> theme switched to{" "}
        <span className="text-term-yellow">{t}</span>
      </div>
    ),
  };
}

export function runCommand(raw: string, ctx: ShellContext): CommandResult {
  const env = shellEnv(ctx.cwd);
  const [name, ...args] = tokenize(raw.trim(), env);
  if (name === undefined) return { output: null };

  if (name.includes("/")) return execute(name, ctx.cwd, null);

  switch (name) {
    case "help":
      return help();
    case "theme":
      return theme(args, ctx.theme);
    case "clear":
    case "cls":
      return { output: null, clear: true };
    case "ls":
      return ls(args, ctx.cwd);
    case "cat":
      return cat(args, ctx.cwd);
    case "cd":
      return cd(args, ctx.cwd);
    case "pwd":
      return print(ctx.cwd);
    case "echo":
      return print(args.join(" "));
    case "git":
      return git(args);
    case "bash":
    case "sh":
      if (args.length === 0) return { output: hintLine("nested shells aren't supported here") };
      return execute(args[0], ctx.cwd, name);
    case "history":
      return print(ctx.history.map((cmd, i) => `${String(i + 1).padStart(5)}  ${cmd}`).join("\n"));
    case "sudo":
      if (args.length === 0) return print("usage: sudo command");
      return {
        output: (
          <>
            <div>[sudo] password for {USER}:</div>
            {errorLine(`${USER} is not in the sudoers file. This incident will be reported.`)}
          </>
        ),
      };
    case "exit":
    case "logout":
      return {
        output: (
          <>
            <div>logout</div>
            {hintLine("nice try — close the tab to leave")}
          </>
        ),
      };
    case "replay":
      return { output: null, replay: true };
    case "whoami":
      return block("whoami");
    case "about":
      return block("about");
    case "skills":
      return block("skills");
    case "experience":
      return block("experience");
    case "education":
      return block("education");
    case "contact":
      return block("contact");
    default:
      return {
        output: (
          <>
            {errorLine(`bash: ${name}: command not found`)}
            {hintLine(
              <>
                type <span className="text-term-yellow">help</span> to list commands
              </>,
            )}
          </>
        ),
      };
  }
}
