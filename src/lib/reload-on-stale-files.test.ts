import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reloadOnStaleFiles } from "./reload-on-stale-files";

describe("reloadOnStaleFiles", () => {
  let listener: ((event: Event) => void) | undefined;
  let stored: Record<string, string>;
  const reload = vi.fn();

  beforeEach(() => {
    listener = undefined;
    stored = {};
    reload.mockClear();
    vi.useFakeTimers({ now: 1_000_000 });
    vi.stubGlobal("window", {
      addEventListener: (type: string, fn: (event: Event) => void) => {
        if (type === "vite:preloadError") listener = fn;
      },
      location: { reload },
    });
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => stored[key] ?? null,
      setItem: (key: string, value: string) => {
        stored[key] = value;
      },
    });
    reloadOnStaleFiles();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** A failed load, as Vite reports it; returns whether the error was stopped. */
  function failLoad() {
    const event = new Event("vite:preloadError", { cancelable: true });
    listener!(event);
    return event.defaultPrevented;
  }

  it("reloads once instead of showing the error", () => {
    expect(failLoad()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("lets a second failure soon after show the error, so it can't loop", () => {
    failLoad();
    vi.advanceTimersByTime(5_000);
    expect(failLoad()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again for a failure much later (another deploy)", () => {
    failLoad();
    vi.advanceTimersByTime(60_000);
    expect(failLoad()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("never reloads when storage is blocked", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(failLoad()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
