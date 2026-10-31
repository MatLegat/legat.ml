import type { ReactNode } from "react";
import { StaticOutput, type Segment } from "@/components/Typewriter";

export type ThemeName = "green" | "amber" | "solarized" | "solarized-light";
export const THEMES: ThemeName[] = ["green", "amber", "solarized", "solarized-light"];

export type Block = {
  id: string;
  /** the command typed after the prompt */
  command: Segment[];
  /** output rendered after command finishes */
  output: Segment[];
  /** speed for command typing */
  cmdSpeed?: number;
  /** speed for output typing */
  outSpeed?: number;
};

export const FAST = 600;
const MED = 220;

const SKILLS = [
  ["frontend", "Next.js, React, Vue.js, Tailwind CSS, SASS, Emotion CSS"],
  ["backend", "Node.js, Express, Elysia, Ruby on Rails, PHP"],
  ["testing", "Vitest, Jest, Jasmine"],
  ["tools", "Git, REST APIs, Bash, MeshCentral, CI/CD, Vercel, GCP"],
] as const;

export const blocks: Block[] = [
  {
    id: "whoami",
    command: [{ text: "whoami" }],
    cmdSpeed: 20,
    output: [
      { text: "\n" },
      { text: "Matteus Legat", className: "text-term-yellow crt-glow", speed: FAST },
      { text: "\n" },
      { text: "Full Stack Web Developer · Florianópolis, BR\n", className: "text-term-dim" },
      { text: "matteus@legat.ml", className: "text-term-cyan", href: "mailto:matteus@legat.ml" },
      { text: "\n" },
    ],
  },
  {
    id: "cat",
    command: [{ text: "cat about.md" }],
    cmdSpeed: 20,
    output: [
      { text: "\n" },
      { text: "# About\n", className: "text-term-magenta", speed: FAST },
      {
        text:
          "Full-stack web developer with 10+ years building and maintaining scalable\n" +
          "web applications across ecommerce, enterprise, and platform-based products.\n" +
          "Strong focus on modern frontend (React, Next.js) with solid backend chops\n" +
          "in Node.js. Production-ready solutions, architecture decisions, cross-team\n" +
          "collaboration.\n",
        speed: FAST,
      },
    ],
  },
  {
    id: "skills",
    command: [{ text: "ls ./skills" }],
    cmdSpeed: 20,
    output: skillsOutput(),
  },
  {
    id: "exp",
    command: [{ text: "git log --oneline experience" }],
    cmdSpeed: 20,
    output: [{ text: "\n" }, ...experienceOutput()],
  },
  {
    id: "edu",
    command: [{ text: "cat education.txt" }],
    cmdSpeed: 20,
    output: [
      { text: "\n" },
      { text: "[2014–2018] ", className: "text-term-yellow", speed: FAST },
      { text: "Bachelor in Computer Science\n", speed: FAST },
      {
        text: "            Federal University of Santa Catarina — UFSC\n",
        className: "text-term-dim",
        speed: FAST,
      },
    ],
  },
  {
    id: "contact",
    command: [{ text: "./contact.sh" }],
    cmdSpeed: 20,
    output: [
      { text: "\n" },
      { text: "> ", className: "text-term-green", speed: MED },
      { text: "Booting contact channel...\n", className: "text-term-dim", speed: MED },
      { text: "> ", className: "text-term-green", speed: MED },
      { text: "Channel ready.\n\n", className: "text-term-dim", speed: MED },
      { text: "  email   ", className: "text-term-yellow", speed: FAST },
      {
        text: "matteus@legat.ml",
        className: "text-term-cyan",
        speed: FAST,
        href: "mailto:matteus@legat.ml",
      },
      { text: "\n" },
      { text: "  status  ", className: "text-term-yellow", speed: FAST },
      { text: "open to opportunities\n", className: "text-term-green", speed: FAST },
    ],
  },
];

function skillsOutput(): Segment[] {
  const segs: Segment[] = [{ text: "\n" }];
  SKILLS.forEach(([name], i) => {
    const last = i === SKILLS.length - 1;
    const text = last ? `${name}/\n\n` : `${name}/`.padEnd(11);
    segs.push({ text, className: "text-term-cyan", speed: FAST });
  });
  for (const [name, techs] of SKILLS) {
    segs.push({ text: `${name.padEnd(10)}→ `, className: "text-term-yellow", speed: FAST });
    segs.push({ text: `${techs}\n`, speed: FAST });
  }
  return segs;
}

function experienceOutput(): Segment[] {
  const jobs = [
    {
      hash: "a1f0c2e",
      period: "2020–now",
      role: "Full Stack Developer",
      company: "Binamik Tecnologia",
      bullets: [
        "Tourism ecosystem: white-label ecommerce, kiosks, payments/booking",
        "Scalable React + Next.js frontends, Node/Express integrations",
        "Testing & code quality with Jest; cross-team product/design work",
      ],
    },
    {
      hash: "9d3b71a",
      period: "2018–2020",
      role: "Front End Developer",
      company: "Valtech Brazil",
      bullets: [
        "Enterprise web apps with Vue.js + SASS",
        "Clients: Bayer, L'Oréal, Sam's Club",
        "Responsive, accessible, component-based systems · agile teams",
      ],
    },
    {
      hash: "5cc04e8",
      period: "2018–2019",
      role: "Full-Stack Web Developer (Part-time)",
      company: "Incentiv.me",
      bullets: ["Social crowdfunding platform", "Ruby on Rails, Mithril.js, PostgreSQL APIs"],
    },
    {
      hash: "27ab9d1",
      period: "2017–2018",
      role: "C++ / IoT Trainee",
      company: "LabSEC — UFSC",
      bullets: [
        "Modernized restaurant access control systems",
        "RFID, secure gateways, embedded C++ + Node.js",
      ],
    },
    {
      hash: "0001a3f",
      period: "2015–2017",
      role: "Full-Stack Trainee",
      company: "LabSEC — UFSC",
      bullets: [
        "Public Key Infrastructure platform (ICPEdu — RNP)",
        "Digital certificate issuance · PHP (Zend) + JavaScript",
      ],
    },
  ];

  const segs: Segment[] = [];
  for (const j of jobs) {
    segs.push({ text: j.hash + " ", className: "text-term-magenta", speed: FAST });
    segs.push({ text: `(${j.period}) `, className: "text-term-dim", speed: FAST });
    segs.push({ text: j.role, className: "text-term-yellow", speed: FAST });
    segs.push({ text: ` @ ${j.company}\n`, className: "text-term-cyan", speed: FAST });
    for (const b of j.bullets) {
      segs.push({ text: `        └─ ${b}\n`, speed: FAST });
    }
    segs.push({ text: "\n" });
  }
  return segs;
}

export function commandText(block: Block) {
  return block.command.map((s) => s.text).join("");
}

// ---------------------------------------------------------------------------
// Fake filesystem
// ---------------------------------------------------------------------------

export const HOME = "/home/matteus";
const USER = "matteus";
const FILE_DATE = "Jun  3 22:58";

type FsDir = { type: "dir"; children: Record<string, FsNode>; listing?: Segment[] };
type FsFile = { type: "file"; content: Segment[]; executable?: boolean; run?: Segment[] };
type FsNode = FsDir | FsFile;

function dir(children: Record<string, FsNode>, listing?: Segment[]): FsDir {
  return { type: "dir", children, listing };
}

function blockOutput(id: string) {
  return blocks.find((b) => b.id === id)!.output;
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
  { text: "printf ", className: "text-term-cyan" },
  { text: '"  %-7s %s\\n" ', className: "text-term-green" },
  { text: "email " },
  { text: '"matteus@legat.ml"\n', className: "text-term-green" },
  { text: "printf ", className: "text-term-cyan" },
  { text: '"  %-7s %s\\n" ', className: "text-term-green" },
  { text: "status " },
  { text: '"open to opportunities"\n', className: "text-term-green" },
];

const FS: FsDir = dir({
  home: dir({
    [USER]: dir({
      "about.md": { type: "file", content: blockOutput("cat") },
      "contact.sh": {
        type: "file",
        content: CONTACT_SCRIPT,
        executable: true,
        run: blockOutput("contact"),
      },
      "education.txt": { type: "file", content: blockOutput("edu") },
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

function getNode(abs: string): FsNode | undefined {
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

function lookup(cwd: string, path: string): Lookup {
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

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Splits a command line into words, handling quotes, backslashes, `~` and `$VARS`. */
function shellEnv(cwd: string): Record<string, string> {
  return { USER, LOGNAME: USER, HOME, PWD: cwd, SHELL: "/bin/bash" };
}

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

function sortedChildren(node: FsDir): [string, FsNode][] {
  return Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b));
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function ls(args: string[], cwd: string): CommandResult {
  const flags = new Set<string>();
  const paths: string[] = [];
  let endOfOptions = false;
  for (const arg of args) {
    if (endOfOptions || arg === "-" || !arg.startsWith("-")) paths.push(arg);
    else if (arg === "--") endOfOptions = true;
    else if (arg === "--all") flags.add("a");
    else if (arg === "--help") return print("Usage: ls [-1alA] [FILE]...");
    else if (arg.startsWith("--")) {
      return {
        output: (
          <>
            {errorLine(`ls: unrecognized option '${arg}'`)}
            {hintLine("Try 'ls --help' for more information.")}
          </>
        ),
      };
    } else {
      for (const flag of arg.slice(1)) {
        if (!"1alAFh".includes(flag)) {
          return {
            output: (
              <>
                {errorLine(`ls: invalid option -- '${flag}'`)}
                {hintLine("Try 'ls --help' for more information.")}
              </>
            ),
          };
        }
        flags.add(flag);
      }
    }
  }

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
  if (sub === "log") return block("exp");
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
          {cmd("clear")} clear the screen · {cmd("help")} this list
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
    case "whoami":
      return block("whoami");
    case "about":
      return block("cat");
    case "skills":
      return block("skills");
    case "experience":
      return block("exp");
    case "education":
      return block("edu");
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

// ---------------------------------------------------------------------------
// Tab completion
// ---------------------------------------------------------------------------

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
