import { describe, expect, it } from "vitest";
import { displayPath, HOME, resolvePath } from "./filesystem";

describe("resolvePath", () => {
  it.each([
    [HOME, "skills/", `${HOME}/skills`],
    [HOME, "./skills/../about.md", `${HOME}/about.md`],
    [`${HOME}/skills`, "~", HOME],
    [HOME, "..", "/home"],
    ["/", "..", "/"],
  ])("from %s, `%s` is %s", (cwd, path, expected) => {
    expect(resolvePath(cwd, path)).toBe(expected);
  });
});

describe("displayPath", () => {
  it.each([
    [HOME, "~"],
    [`${HOME}/skills`, "~/skills"],
    ["/home", "/home"],
  ])("shows %s as %s", (abs, expected) => {
    expect(displayPath(abs)).toBe(expected);
  });
});
