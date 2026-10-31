import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  addToHistory,
  blocks,
  commandText,
  navigateHistory,
  runCommand,
  type HistoryNav,
} from "./terminal";

function text(raw: string) {
  const { output } = runCommand(raw, "green");
  return renderToStaticMarkup(<>{output}</>)
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function blockText(id: string) {
  const block = blocks.find((b) => b.id === id)!;
  return block.output.map((s) => s.text).join("");
}

describe("runCommand", () => {
  it.each(blocks.map((b) => [commandText(b), b.id]))("runs intro command `%s`", (cmd, id) => {
    expect(text(cmd)).toBe(blockText(id));
  });

  it("ignores extra whitespace", () => {
    expect(text("  cat   education.txt ")).toBe(blockText("edu"));
  });

  it("prints nothing for an empty line", () => {
    expect(runCommand("   ", "green")).toEqual({ output: null });
  });

  it("supports the shortcut commands", () => {
    expect(text("whoami")).toBe(blockText("whoami"));
    expect(text("about")).toBe(blockText("cat"));
    expect(text("skills")).toBe(blockText("skills"));
    expect(text("experience")).toBe(blockText("exp"));
    expect(text("education")).toBe(blockText("edu"));
    expect(text("contact")).toBe(blockText("contact"));
  });

  describe("cat", () => {
    it("prints about with no file", () => {
      expect(text("cat")).toBe(blockText("cat"));
    });

    it("denies reading contact.sh", () => {
      expect(text("cat contact.sh")).toContain("cat: contact.sh: Permission denied");
      expect(text("cat ./contact.sh")).toContain("Permission denied");
    });

    it("errors on unknown files", () => {
      expect(text("cat nope.txt")).toBe("cat: nope.txt: No such file or directory");
    });
  });

  describe("ls", () => {
    const home = "about.md contact.sh* education.txt skills/";

    it.each(["ls", "ls .", "ls ./", "ls ~", "ls -la"])("`%s` lists the home directory", (cmd) => {
      expect(text(cmd)).toBe(home);
    });

    it.each(["ls skills", "ls ./skills", "ls skills/"])("`%s` lists skills", (cmd) => {
      expect(text(cmd)).toBe(blockText("skills"));
    });

    it("errors on unknown paths", () => {
      expect(text("ls nope")).toBe("ls: cannot access 'nope': No such file or directory");
    });
  });

  describe("theme", () => {
    it("shows the current theme", () => {
      const { output } = runCommand("theme", "amber");
      expect(renderToStaticMarkup(<>{output}</>)).toContain("amber");
    });

    it("switches theme, case-insensitively", () => {
      expect(runCommand("theme AMBER", "green").theme).toBe("amber");
    });

    it("rejects unknown themes", () => {
      const result = runCommand("theme pink", "green");
      expect(result.theme).toBeUndefined();
      expect(text("theme pink")).toContain("unknown palette 'pink'");
    });
  });

  it("clears the screen", () => {
    expect(runCommand("clear", "green").clear).toBe(true);
    expect(runCommand("cls", "green").clear).toBe(true);
  });

  it("reports unknown commands", () => {
    expect(text("foo bar")).toBe("command not found: foo — type help");
  });

  it("is case-sensitive like a shell", () => {
    expect(text("WHOAMI")).toContain("command not found");
  });
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
