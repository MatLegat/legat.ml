import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { ControlledStar } from "@/lib/wallpaper/black-hole";

/** Lets a wallpaper effect take over the stars and give them back. */
export type StarsHandle = {
  /** Freezes every star where it is on screen and hands it over; stops hover and clicks. */
  takeControl(): ControlledStar[];
  /** Clears the effect's styles and resumes the normal floating stars. */
  releaseControl(): void;
  /** An empty layer behind the stars for the effect's own elements. */
  layer: HTMLDivElement | null;
};

const STAR_COLOR_ORDERS = [
  ["#ffffff", "#93c5fd", "#a5b4fc", "#f472b6", "#5eead4"],
  ["#5eead4", "#ffffff", "#f472b6", "#93c5fd", "#a5b4fc"],
  ["#a5b4fc", "#5eead4", "#ffffff", "#93c5fd", "#f472b6"],
  ["#f472b6", "#a5b4fc", "#5eead4", "#ffffff", "#93c5fd"],
  ["#93c5fd", "#f472b6", "#ffffff", "#5eead4", "#a5b4fc"],
  ["#5eead4", "#93c5fd", "#a5b4fc", "#ffffff", "#f472b6"],
] as const;

type StarStyle = CSSProperties & {
  "--star-color-1": string;
  "--star-color-2": string;
  "--star-color-3": string;
  "--star-color-4": string;
  "--star-color-5": string;
  "--star-offset-x": string;
  "--star-offset-y": string;
};

type ShardStyle = CSSProperties & {
  "--shard-color": string;
  "--shard-delay": string;
  "--shard-duration": string;
  "--shard-x": string;
  "--shard-y": string;
};

type StarLayer = "near" | "far";

type StarDefinition = {
  left: string;
  top: string;
  size: string;
  duration: string;
  delay: string;
  layer: StarLayer;
};

type ExplosionPosition = {
  left: string;
  top: string;
};

const REPULSION_RADIUS = 250;
const REPULSION_STRENGTH = 3.5;
// Within this distance the push fades out, so a star holds still under the cursor
const REPULSION_CALM_RADIUS = 40;
const POINTER_LERP = 0.18;
const STAR_RESPAWN_DELAY = 20000;
const STAR_RESPAWN_FADE_DURATION = 900;

const EXPLOSION_SHARDS = [
  { x: 19, y: -30, size: 2.5, delay: 0, duration: 560 },
  { x: 34, y: -10, size: 1.5, delay: 20, duration: 640 },
  { x: 27, y: 21, size: 2, delay: 45, duration: 600 },
  { x: 4, y: 34, size: 1.5, delay: 35, duration: 680 },
  { x: -24, y: 25, size: 2.5, delay: 10, duration: 620 },
  { x: -36, y: 1, size: 1.5, delay: 50, duration: 700 },
  { x: -18, y: -28, size: 2, delay: 25, duration: 580 },
  { x: 3, y: -40, size: 1.5, delay: 60, duration: 720 },
] as const;

const STAR_COUNT = 40;
const STAR_SEED = 7349;

const createSeededRandom = (seed: number) => {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const randomBetween = (random: () => number, min: number, max: number) =>
  min + random() * (max - min);

// Where the stars go, as percentages of the screen. "Best candidate" placement: each star
// tries a few random spots and keeps the one farthest from the stars placed so far. It looks
// random (no grid) without clumps or big empty patches. Seeded, so server and browser agree.
const STAR_CANDIDATES = 8;
// Horizontal distances count more, as screens are wider than tall: spacing then looks even
const SCREEN_ASPECT = 1.7;

const STAR_POSITIONS = (() => {
  const random = createSeededRandom(STAR_SEED);
  const placed: { x: number; y: number }[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    let best = { x: 50, y: 50 };
    let bestDistance = -1;
    for (let c = 0; c < STAR_CANDIDATES; c++) {
      const candidate = { x: randomBetween(random, 2, 98), y: randomBetween(random, 3, 95) };
      const distance = Math.min(
        Infinity,
        ...placed.map((p) => Math.hypot((p.x - candidate.x) * SCREEN_ASPECT, p.y - candidate.y)),
      );
      if (distance > bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    placed.push(best);
  }
  return placed;
})();

const STARS: StarDefinition[] = STAR_POSITIONS.map(({ x, y }, index) => {
  const random = createSeededRandom(STAR_SEED + index * 97);
  const layer: StarLayer = random() > 0.42 ? "near" : "far";

  return {
    left: x.toFixed(1) + "%",
    top: y.toFixed(1) + "%",
    size:
      (layer === "near" ? randomBetween(random, 4, 5.5) : randomBetween(random, 2.5, 3.8)).toFixed(
        1,
      ) + "px",
    duration: Math.round(randomBetween(random, 12, 22)) + "s",
    delay: "-" + Math.round(randomBetween(random, 1, 14)) + "s",
    layer,
  };
});

export default function StarsBackground({ ref }: { ref?: Ref<StarsHandle> }) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  // While an effect controls the stars, repulsion and explosions are off
  const controlledRef = useRef(false);
  const starRefs = useRef<Array<HTMLSpanElement | null>>([]);
  // Each star sits in a slot: effects move the slot, the star inside keeps floating
  const slotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const explodedStarsRef = useRef<Set<number>>(new Set());
  const respawnTimeoutsRef = useRef<Map<number, number>>(new Map());
  const respawnFadeTimeoutsRef = useRef<Map<number, number>>(new Map());
  const [explodedStars, setExplodedStars] = useState<Set<number>>(new Set());
  const [respawningStars, setRespawningStars] = useState<Set<number>>(new Set());
  const [explosionPositions, setExplosionPositions] = useState<Map<number, ExplosionPosition>>(
    new Map(),
  );

  useEffect(() => {
    explodedStarsRef.current = explodedStars;
  }, [explodedStars]);

  useEffect(
    () => () => {
      respawnTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      respawnFadeTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    },
    [],
  );

  // Pointer repulsion; off with reduced motion (the stars don't float then either)
  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) {
      return;
    }

    const pointerTarget = { x: -9999, y: -9999, active: false };
    const pointerCurrent = { x: -9999, y: -9999 };

    // The loop only runs while something moves: it starts on pointer activity and stops
    // once the stars have settled, so an idle page does no per-frame work
    let frameId = 0;
    const wake = () => {
      if (controlledRef.current) return;
      if (!frameId) frameId = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerTarget.x = event.clientX;
      pointerTarget.y = event.clientY;
      pointerTarget.active = true;
      wake();
    };

    const resetPointer = () => {
      pointerTarget.x = -9999;
      pointerTarget.y = -9999;
      pointerTarget.active = false;
      wake();
    };

    const updateStarOffset = (element: HTMLSpanElement, star: StarDefinition, index: number) => {
      if (explodedStarsRef.current.has(index)) {
        element.style.setProperty("--star-offset-x", "0px");
        element.style.setProperty("--star-offset-y", "0px");
        return;
      }

      const baseX = (Number.parseFloat(star.left) / 100) * window.innerWidth;
      const baseY = (Number.parseFloat(star.top) / 100) * window.innerHeight;
      const dx = baseX - pointerCurrent.x;
      const dy = baseY - pointerCurrent.y;
      const distance = Math.hypot(dx, dy);

      if (!pointerTarget.active || distance >= REPULSION_RADIUS || distance === 0) {
        element.style.setProperty("--star-offset-x", "0px");
        element.style.setProperty("--star-offset-y", "0px");
        return;
      }

      const calm = Math.min(1, distance / REPULSION_CALM_RADIUS);
      const force = (1 - distance / REPULSION_RADIUS) ** 2 * calm;
      const layerStrength = star.layer === "near" ? 1 : 0.6;
      const magnitude = force * REPULSION_STRENGTH * layerStrength;
      const offsetX = (dx / distance) * magnitude;
      const offsetY = (dy / distance) * magnitude;

      element.style.setProperty("--star-offset-x", `${offsetX.toFixed(2)}px`);
      element.style.setProperty("--star-offset-y", `${offsetY.toFixed(2)}px`);
    };

    function animate() {
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * POINTER_LERP;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * POINTER_LERP;

      starRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        updateStarOffset(element, STARS[index], index);
      });

      // Settled: the pointer is gone (offsets were just reset), or the eased position has
      // caught up with a pointer that stopped moving
      const caughtUp =
        Math.abs(pointerTarget.x - pointerCurrent.x) < 0.5 &&
        Math.abs(pointerTarget.y - pointerCurrent.y) < 0.5;
      if (!pointerTarget.active || caughtUp) {
        frameId = 0;
        return;
      }
      frameId = window.requestAnimationFrame(animate);
    }

    // Leaving the window: `pointerout` with no element to go to (window gets no `pointerleave`)
    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) resetPointer();
    };
    // A finger lifting off has no hover, so let the stars settle back
    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") resetPointer();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", resetPointer);
    window.addEventListener("blur", resetPointer);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", resetPointer);
      window.removeEventListener("blur", resetPointer);
      window.cancelAnimationFrame(frameId);
    };
  }, [reducedMotion]);

  useImperativeHandle(
    ref,
    () => ({
      takeControl() {
        controlledRef.current = true;
        // No explosion or respawn may run while an effect owns the stars
        respawnTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
        respawnFadeTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
        respawnTimeoutsRef.current.clear();
        respawnFadeTimeoutsRef.current.clear();
        explodedStarsRef.current = new Set();
        flushSync(() => {
          setExplodedStars(new Set());
          setRespawningStars(new Set());
          setExplosionPositions(new Map());
        });
        // Mouse-push offsets are cleared so they don't linger once control comes back
        starRefs.current.forEach((el) => {
          el?.style.setProperty("--star-offset-x", "0px");
          el?.style.setProperty("--star-offset-y", "0px");
        });
        containerRef.current!.classList.add("stars-bg--controlled");

        // The effect moves the slots; the stars inside keep floating and twinkling, so
        // nothing has to stop now or restart later (which is what made stars jump)
        const container = containerRef.current!;
        return slotRefs.current.flatMap((el, index) => {
          if (!el) return [];
          const star = STARS[index];
          const size = Number.parseFloat(star.size);
          const home = () => ({
            x: (Number.parseFloat(star.left) / 100) * container.clientWidth + size / 2,
            y: (Number.parseFloat(star.top) / 100) * container.clientHeight + size / 2,
          });
          return [{ el, start: home(), home, opacity: 1 }];
        });
      },

      releaseControl() {
        slotRefs.current.forEach((el) => {
          el?.style.removeProperty("transform");
          el?.style.removeProperty("opacity");
        });
        containerRef.current?.classList.remove("stars-bg--controlled");
        controlledRef.current = false;
      },

      get layer() {
        return layerRef.current;
      },
    }),
    [],
  );

  const onStarClick = (index: number) => (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (controlledRef.current) return;
    const existingTimeout = respawnTimeoutsRef.current.get(index);
    const existingFadeTimeout = respawnFadeTimeoutsRef.current.get(index);

    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    if (existingFadeTimeout) {
      window.clearTimeout(existingFadeTimeout);
    }

    setRespawningStars((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    const size = Number.parseFloat(STARS[index].size);
    const lockedLeft = `${event.clientX - size / 2}px`;
    const lockedTop = `${event.clientY - size / 2}px`;

    setExplosionPositions((prev) => {
      const next = new Map(prev);
      next.set(index, { left: lockedLeft, top: lockedTop });
      return next;
    });

    setExplodedStars((prev) => new Set(prev).add(index));

    const timeoutId = window.setTimeout(() => {
      setExplodedStars((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });

      setExplosionPositions((prev) => {
        const next = new Map(prev);
        next.delete(index);
        return next;
      });

      respawnTimeoutsRef.current.delete(index);

      setRespawningStars((prev) => new Set(prev).add(index));

      const fadeTimeoutId = window.setTimeout(() => {
        setRespawningStars((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });

        respawnFadeTimeoutsRef.current.delete(index);
      }, STAR_RESPAWN_FADE_DURATION);

      respawnFadeTimeoutsRef.current.set(index, fadeTimeoutId);
    }, STAR_RESPAWN_DELAY);

    respawnTimeoutsRef.current.set(index, timeoutId);
  };

  return (
    <div ref={containerRef} className="stars-bg" aria-hidden="true">
      <div ref={layerRef} className="stars-bg__layer" />
      {STARS.map((star, index) =>
        (() => {
          const colorDuration = `${9 + (index % 5) * 2}s`;
          const colorDelay = `-${(index * 3) % 11}s`;
          const colorOrder = STAR_COLOR_ORDERS[index % STAR_COLOR_ORDERS.length];
          const exploded = explodedStars.has(index);
          const respawning = respawningStars.has(index);
          const explosionPosition = explosionPositions.get(index);
          const shardScale = star.layer === "near" ? 1.15 : 0.9;

          return (
            <span
              key={`${star.left}-${star.top}-${index}`}
              ref={(element) => {
                slotRefs.current[index] = element;
              }}
              className="stars-bg__slot"
              style={{
                left: exploded && explosionPosition ? explosionPosition.left : star.left,
                top: exploded && explosionPosition ? explosionPosition.top : star.top,
                width: star.size,
                height: star.size,
              }}
            >
              <span
                ref={(element) => {
                  starRefs.current[index] = element;
                }}
                className={`stars-bg__star stars-bg__star--${star.layer} ${exploded ? "exploded" : ""} ${respawning ? "respawning" : ""}`}
                onClick={onStarClick(index)}
                style={
                  {
                    animationDuration: respawning
                      ? `${star.duration}, ${colorDuration}, ${STAR_RESPAWN_FADE_DURATION}ms`
                      : `${star.duration}, ${colorDuration}`,
                    animationDelay: respawning
                      ? `${star.delay}, ${colorDelay}, 0ms`
                      : `${star.delay}, ${colorDelay}`,
                    "--star-color-1": colorOrder[0],
                    "--star-color-2": colorOrder[1],
                    "--star-color-3": colorOrder[2],
                    "--star-color-4": colorOrder[3],
                    "--star-color-5": colorOrder[4],
                    "--star-offset-x": "0px",
                    "--star-offset-y": "0px",
                  } as StarStyle
                }
              >
                {exploded
                  ? EXPLOSION_SHARDS.map((shard, shardIndex) => (
                      <span
                        key={shardIndex}
                        className="stars-bg__shard"
                        style={
                          {
                            width: `${shard.size}px`,
                            height: `${shard.size}px`,
                            "--shard-color": colorOrder[shardIndex % colorOrder.length],
                            "--shard-delay": `${shard.delay}ms`,
                            "--shard-duration": `${shard.duration}ms`,
                            "--shard-x": `${(shard.x * shardScale).toFixed(1)}px`,
                            "--shard-y": `${(shard.y * shardScale).toFixed(1)}px`,
                          } as ShardStyle
                        }
                      />
                    ))
                  : null}
              </span>
            </span>
          );
        })(),
      )}
    </div>
  );
}
