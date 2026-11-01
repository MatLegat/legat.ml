import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  addToHistory,
  blocks,
  commandText,
  complete,
  displayPath,
  HOME,
  navigateHistory,
  resolvePath,
  runCommand,
  tokenize,
  type HistoryNav,
  type ShellContext,
} from "./terminal";

const ctx = (over: Partial<ShellContext> = {}): ShellContext => ({
  theme: "green",
  cwd: HOME,
  history: [],
  ...over,
});

function toText(node: React.ReactNode) {
  return renderToStaticMarkup(<>{node}</>)
    .replace(/<\/div>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trimEnd();
}

function run(raw: string, over: Partial<ShellContext> = {}) {
  return toText(runCommand(raw, ctx(over)).output);
}

function blockText(id: string) {
  return blocks
    .find((b) => b.id === id)!
    .output.map((s) => s.text)
    .join("")
    .trimEnd();
}

describe("intro commands", () => {
  it.each(blocks.map((b) => [commandText(b), b.id]))("`%s` prints its block", (cmd, id) => {
    expect(run(cmd)).toBe(blockText(id));
  });

  it("supports the shortcut commands", () => {
    expect(run("about")).toBe(blockText("cat"));
    expect(run("skills")).toBe(blockText("skills"));
    expect(run("experience")).toBe(blockText("exp"));
    expect(run("education")).toBe(blockText("edu"));
    expect(run("contact")).toBe(blockText("contact"));
  });

  it("prints nothing for an empty line", () => {
    expect(runCommand("   ", ctx())).toEqual({ output: null });
  });
});

describe("tokenize", () => {
  const env = { HOME, USER: "matteus" };

  it("splits on whitespace and handles quotes and escapes", () => {
    expect(tokenize(`cat  "about.md" 'a b' c\\ d ""`, env)).toEqual([
      "cat",
      "about.md",
      "a b",
      "c d",
      "",
    ]);
  });

  it("expands variables and ~ outside single quotes", () => {
    expect(tokenize(`echo $USER "$HOME" '$USER' ~ ~/x a~`, env)).toEqual([
      "echo",
      "matteus",
      HOME,
      "$USER",
      HOME,
      `${HOME}/x`,
      "a~",
    ]);
  });
});

describe("paths", () => {
  it("resolves relative, home and parent paths", () => {
    expect(resolvePath(HOME, "skills/")).toBe(`${HOME}/skills`);
    expect(resolvePath(HOME, "./skills/../about.md")).toBe(`${HOME}/about.md`);
    expect(resolvePath(`${HOME}/skills`, "~")).toBe(HOME);
    expect(resolvePath(HOME, "..")).toBe("/home");
    expect(resolvePath("/", "..")).toBe("/");
  });

  it("shows home as ~", () => {
    expect(displayPath(HOME)).toBe("~");
    expect(displayPath(`${HOME}/skills`)).toBe("~/skills");
    expect(displayPath("/home")).toBe("/home");
  });
});

describe("cat", () => {
  it.each(["cat about.md", "cat ./about.md", "cat ~/about.md", 'cat "about.md"'])(
    "`%s` reads the file",
    (cmd) => {
      expect(run(cmd)).toBe(blockText("cat"));
    },
  );

  it("concatenates several files", () => {
    expect(run("cat about.md education.txt")).toBe(
      `${blockText("cat")}\n${blockText("edu")}`.replace(/\n+$/, ""),
    );
  });

  it("prints the contact script", () => {
    const out = run("cat contact.sh");
    expect(out).toContain("#!/usr/bin/env bash");
    expect(out).toContain('printf "  %-7s %s\\n" email "matteus@legat.ml"');
  });

  it("reports directories and missing files, and keeps going", () => {
    expect(run("cat skills")).toBe("cat: skills: Is a directory");
    expect(run("cat nope.txt about.md")).toBe(
      `cat: nope.txt: No such file or directory\n${blockText("cat")}`,
    );
    expect(run("cat about.md/")).toBe("cat: about.md/: Not a directory");
  });

  it("explains that stdin isn't supported", () => {
    expect(run("cat")).toContain("reading from standard input");
  });
});

describe("ls", () => {
  const home = "about.md  contact.sh*  education.txt  skills/";

  it.each(["ls", "ls .", "ls ./", "ls ~", "ls ~/", "ls -F"])(
    "`%s` lists the home directory",
    (cmd) => {
      expect(run(cmd)).toBe(home);
    },
  );

  it.each(["ls skills", "ls ./skills", "ls skills/", "ls ~/skills"])("`%s` lists skills", (cmd) => {
    expect(run(cmd)).toBe(blockText("skills"));
  });

  it("lists a file by name", () => {
    expect(run("ls about.md")).toBe("about.md");
  });

  it("lists the root and other directories", () => {
    expect(run("ls /")).toBe("home/");
    expect(run("ls /home")).toBe("matteus/");
    expect(run("ls skills/frontend")).toContain("Next.js");
  });

  it("supports -1, -a and -l", () => {
    expect(run("ls -1")).toBe("about.md\ncontact.sh*\neducation.txt\nskills/");
    expect(run("ls -a")).toBe(`./  ../  ${home}`);
    const long = run("ls -la");
    expect(long).toMatch(/^total \d+/);
    expect(long).toMatch(/-rwxr-xr-x 1 matteus matteus +\d+ .* contact\.sh\*/);
    expect(long).toMatch(/drwxr-xr-x 2 matteus matteus 4096 .* skills\//);
    expect(run("ls -l skills")).toContain("frontend/");
  });

  it("honors -1 on directories with a custom listing", () => {
    expect(run("ls -1 skills")).toBe("backend/\nfrontend/\ntesting/\ntools/");
  });

  it("lists the same file twice", () => {
    expect(run("ls about.md about.md")).toBe("about.md  about.md");
    expect(run("ls -l about.md about.md").match(/about\.md/g)).toHaveLength(2);
  });

  it("lists several targets with headers", () => {
    const out = run("ls about.md skills/frontend");
    expect(out).toMatch(/^about\.md\n+skills\/frontend:\nNext\.js, React/);
  });

  it("reports missing paths and keeps going", () => {
    expect(run("ls nope")).toBe("ls: cannot access 'nope': No such file or directory");
    expect(run("ls skills nope")).toContain("ls: cannot access 'nope'");
    expect(run("ls skills nope")).toContain("frontend/");
  });

  it("rejects unknown options", () => {
    expect(run("ls -z")).toBe("ls: invalid option -- 'z'\nTry 'ls --help' for more information.");
    expect(run("ls --nonsense")).toBe(
      "ls: unrecognized option '--nonsense'\nTry 'ls --help' for more information.",
    );
  });
});

describe("cd and pwd", () => {
  it("changes directory", () => {
    expect(runCommand("cd skills", ctx()).cwd).toBe(`${HOME}/skills`);
    expect(runCommand("cd ..", ctx({ cwd: `${HOME}/skills` })).cwd).toBe(HOME);
    expect(runCommand("cd", ctx({ cwd: "/" })).cwd).toBe(HOME);
    expect(runCommand("cd /", ctx()).cwd).toBe("/");
  });

  it("resolves other commands from the current directory", () => {
    const inSkills = { cwd: `${HOME}/skills` };
    expect(run("ls", inSkills)).toBe(blockText("skills"));
    expect(run("cat ../about.md", inSkills)).toBe(blockText("cat"));
    expect(run("pwd", inSkills)).toBe(`${HOME}/skills`);
  });

  it("reports bad targets", () => {
    expect(run("cd nope")).toBe("bash: cd: nope: No such file or directory");
    expect(run("cd about.md")).toBe("bash: cd: about.md: Not a directory");
    expect(run("cd a b")).toBe("bash: cd: too many arguments");
    expect(runCommand("cd nope", ctx()).cwd).toBeUndefined();
  });
});

describe("running files", () => {
  it.each([
    "./contact.sh",
    "~/contact.sh",
    `${HOME}/contact.sh`,
    "bash contact.sh",
    "sh contact.sh",
  ])("`%s` runs the script", (cmd) => {
    expect(run(cmd)).toBe(blockText("contact"));
  });

  it("refuses files that aren't scripts", () => {
    expect(run("./about.md")).toBe("bash: ./about.md: Permission denied");
    expect(run("./skills")).toBe("bash: ./skills: Is a directory");
    expect(run("./nope")).toBe("bash: ./nope: No such file or directory");
    expect(run("bash about.md")).toBe("bash: about.md: not a shell script");
  });

  it("needs a path like a real shell", () => {
    expect(run("contact.sh")).toContain("bash: contact.sh: command not found");
  });
});

describe("other commands", () => {
  it("git only supports log", () => {
    expect(run("git log")).toBe(blockText("exp"));
    expect(run("git status")).toContain("git: 'status' is not available here");
    expect(run("git")).toContain("usage: git log");
  });

  it("echo prints its arguments, or an empty line", () => {
    expect(runCommand("echo", ctx()).output).toBeTruthy();
    expect(renderToStaticMarkup(<>{runCommand("echo", ctx()).output}</>)).toContain("\u00a0");
    expect(run('echo hello   "big  world"')).toBe("hello big  world");
    expect(run("echo $PWD", { cwd: `${HOME}/skills` })).toBe(`${HOME}/skills`);
  });

  it("history lists submitted commands", () => {
    expect(run("history", { history: ["ls", "history"] })).toBe("    1  ls\n    2  history");
  });

  it("sudo and exit have jokes", () => {
    expect(run("sudo rm -rf /")).toContain("matteus is not in the sudoers file");
    expect(run("exit")).toContain("logout");
  });

  it("theme switches, case-insensitively, and rejects unknown names", () => {
    expect(runCommand("theme AMBER", ctx()).theme).toBe("amber");
    expect(run("theme", { theme: "amber" })).toContain("current theme: amber");
    expect(runCommand("theme pink", ctx()).theme).toBeUndefined();
    expect(run("theme pink")).toContain("unknown palette 'pink'");
  });

  it("replay asks to run the intro again", () => {
    expect(runCommand("replay", ctx())).toEqual({ output: null, replay: true });
    expect(complete("rep", HOME).value).toBe("replay ");
  });

  it("clear wipes the screen", () => {
    expect(runCommand("clear", ctx()).clear).toBe(true);
    expect(runCommand("cls", ctx()).clear).toBe(true);
  });

  it("reports unknown commands like bash", () => {
    expect(run("foo bar")).toBe("bash: foo: command not found\ntype help to list commands");
    expect(run("WHOAMI")).toContain("command not found");
  });
});

describe("complete", () => {
  const value = (input: string, caret?: number) => complete(input, HOME, caret).value;

  it("completes commands", () => {
    expect(complete("wh", HOME)).toEqual({ value: "whoami ", caret: 7, options: [] });
    expect(complete("e", HOME)).toEqual({
      value: "e",
      caret: 1,
      options: ["echo", "education", "exit", "experience"],
    });
    expect(complete("ex", HOME).options).toEqual(["exit", "experience"]);
    expect(value("exp")).toBe("experience ");
  });

  it("completes paths", () => {
    expect(value("cat ab")).toBe("cat about.md ");
    expect(value("cat ./ed")).toBe("cat ./education.txt ");
    expect(value("ls sk")).toBe("ls skills/");
    expect(value("ls skills/fr")).toBe("ls skills/frontend/");
    expect(value("cat ~/con")).toBe("cat ~/contact.sh ");
  });

  it("understands quotes and variables like the parser", () => {
    expect(value('cat "ab')).toBe('cat "about.md" ');
    expect(value("cat 'sk")).toBe("cat 'skills/");
    expect(value("cat $HOME/ab")).toBe("cat $HOME/about.md ");
    expect(value('cat "$HOME/ab')).toBe('cat "$HOME/about.md" ');
  });

  it("completes the word at the caret and keeps the rest", () => {
    const input = "cat ab education.txt";
    expect(complete(input, HOME, 6)).toEqual({
      value: "cat about.md education.txt",
      caret: 12,
      options: [],
    });
  });

  it("only offers directories to cd and runnable files as commands", () => {
    expect(value("cd ")).toBe("cd skills/");
    expect(complete("./", HOME).options).toEqual(["contact.sh", "skills/"]);
  });

  it("leaves the input alone when nothing matches", () => {
    expect(complete("cat zz", HOME)).toEqual({ value: "cat zz", caret: 6, options: [] });
    expect(value("ls constructor/")).toBe("ls constructor/");
  });
});

describe("names that exist on every JS object", () => {
  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
    "`%s` is just a missing file",
    (name) => {
      expect(run(`ls ${name}`)).toBe(`ls: cannot access '${name}': No such file or directory`);
      expect(run(`cat ${name}/`)).toBe(`cat: ${name}/: No such file or directory`);
      expect(run(`cd ${name}`)).toBe(`bash: cd: ${name}: No such file or directory`);
      expect(run(`./${name}`)).toBe(`bash: ./${name}: No such file or directory`);
    },
  );
});

describe("addToHistory", () => {
  it("appends trimmed commands", () => {
    expect(addToHistory(["a"], "  b ")).toEqual(["a", "b"]);
  });

  it("skips blanks and repeats of the last command", () => {
    expect(addToHistory(["a"], "   ")).toEqual(["a"]);
    expect(addToHistory(["a"], "a")).toEqual(["a"]);
    expect(addToHistory(["a", "b"], "a")).toEqual(["a", "b", "a"]);
  });
});

describe("navigateHistory", () => {
  const list = ["one", "two", "three"];
  const fresh: HistoryNav = { index: null, draft: "" };

  it("does nothing with an empty history", () => {
    expect(navigateHistory([], fresh, "typed", "up")).toBeNull();
  });

  it("does nothing on down while editing a new line", () => {
    expect(navigateHistory(list, fresh, "typed", "down")).toBeNull();
  });

  it("walks back and stops at the oldest entry", () => {
    let nav = navigateHistory(list, fresh, "typed", "up")!;
    expect(nav).toEqual({ index: 2, draft: "typed", value: "three" });
    nav = navigateHistory(list, nav, nav.value, "up")!;
    nav = navigateHistory(list, nav, nav.value, "up")!;
    expect(nav.value).toBe("one");
    nav = navigateHistory(list, nav, nav.value, "up")!;
    expect(nav).toEqual({ index: 0, draft: "typed", value: "one" });
  });

  it("walks forward and restores the unsent line", () => {
    let nav = navigateHistory(list, { index: 1, draft: "typed" }, "two", "down")!;
    expect(nav).toEqual({ index: 2, draft: "typed", value: "three" });
    nav = navigateHistory(list, nav, nav.value, "down")!;
    expect(nav).toEqual({ index: null, draft: "typed", value: "typed" });
  });

  it("starts with the intro commands, newest last", () => {
    const seeded = blocks.map(commandText);
    expect(navigateHistory(seeded, fresh, "", "up")!.value).toBe("./contact.sh");
  });
});
