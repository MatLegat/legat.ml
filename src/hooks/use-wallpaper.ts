import { useEffect, useRef, useState } from "react";
import type { StarsHandle } from "@/components/StarsBackground";
import type { Wallpaper } from "@/components/WindowControls";
import type { BlackHole } from "@/lib/wallpaper/black-hole";

/**
 * The desktop wallpaper: the stars, or the black hole that swallows them. Give `starsRef` to
 * the star background. `status` is for screen readers, `toast` is the visible hint.
 */
export function useWallpaper() {
  const starsRef = useRef<StarsHandle>(null);
  const [wallpaper, setWallpaper] = useState<Wallpaper>("stars");
  // Switching takes a while (download, animations): a second toggle meanwhile is ignored
  const [busy, setBusyState] = useState(false);
  const busyRef = useRef(false);
  const [status, setStatus] = useState("");
  const blackHoleRef = useRef<BlackHole | null>(null);
  const [toast, setToast] = useState({ text: "", visible: false });
  const toastTimer = useRef(0);

  function showToast(text: string) {
    setToast({ text, visible: true });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  }
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function setBusy(value: boolean) {
    busyRef.current = value;
    setBusyState(value);
  }

  async function toggle() {
    const stars = starsRef.current;
    if (busyRef.current || !stars?.layer) return;
    setBusy(true);

    if (wallpaper === "stars") {
      // The effect's code and styles are downloaded only now, on first use
      let createBlackHole: typeof import("@/lib/wallpaper/black-hole").createBlackHole;
      try {
        ({ createBlackHole } = await import("@/lib/wallpaper/black-hole"));
      } catch {
        setStatus("Couldn't load the black hole wallpaper. Try again.");
        setBusy(false);
        return;
      }
      // The page may have gone away while downloading
      if (starsRef.current !== stars || !stars.layer?.isConnected) return;
      const hole = createBlackHole({ layer: stars.layer, stars: stars.takeControl() });
      blackHoleRef.current = hole;
      hole.consume();
      setWallpaper("black-hole");
      setStatus("Black hole wallpaper on");
      setBusy(false);
      return;
    }

    const done = () => {
      stars.releaseControl();
      blackHoleRef.current = null;
      setWallpaper("stars");
      setStatus("Star wallpaper on. Hint: click on any star");
      showToast("Hint: click on any star");
      setBusy(false);
    };
    if (blackHoleRef.current) blackHoleRef.current.release(done);
    else done();
  }

  useEffect(() => () => blackHoleRef.current?.destroy(), []);

  return { starsRef, wallpaper, busy, status, toast, toggle };
}
