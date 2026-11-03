// After a deploy, a page that was left open (or restored by the browser, as iOS Safari does)
// still points at the previous deploy's script files, which are gone. Loading one later fails
// and the router shows its error page. Reloading fetches the new page and its new files.

const KEY = "reloaded-for-stale-files-at";
// A second failure this soon after reloading isn't a stale page: let the error show
const MIN_INTERVAL_MS = 10_000;

/** Reloads the page once when Vite fails to load a script file. Call once, in the browser. */
export function reloadOnStaleFiles() {
  window.addEventListener("vite:preloadError", (event) => {
    const now = Date.now();
    try {
      const last = Number(sessionStorage.getItem(KEY)) || 0;
      if (now - last < MIN_INTERVAL_MS) return;
      sessionStorage.setItem(KEY, String(now));
    } catch {
      // Storage blocked: without a way to tell a second failure apart, reloading could loop
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
}
