import { describe, expect, it } from "vitest";
import { complete } from "./completion";
import { HOME } from "./filesystem";

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
    expect(value("rep")).toBe("replay ");
  });

  it.each([
    ["cat ab", "cat about.md "],
    ["cat ./ed", "cat ./education.txt "],
    ["ls sk", "ls skills/"],
    ["ls skills/fr", "ls skills/frontend/"],
    ["cat ~/con", "cat ~/contact.sh "],
  ])("completes the path in `%s`", (input, expected) => {
    expect(value(input)).toBe(expected);
  });

  // Quotes and variables are understood the same way as when the command runs
  it.each([
    ['cat "ab', 'cat "about.md" '],
    ["cat 'sk", "cat 'skills/"],
    ["cat $HOME/ab", "cat $HOME/about.md "],
    ['cat "$HOME/ab', 'cat "$HOME/about.md" '],
  ])("completes `%s` like the parser reads it", (input, expected) => {
    expect(value(input)).toBe(expected);
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
