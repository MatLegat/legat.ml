import { describe, expect, it } from "vitest";
import { blocks, commandText } from "./content";
import { addToHistory, navigateHistory, type HistoryNav } from "./history";

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
