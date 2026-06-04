import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

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
const REPULSION_STRENGTH = 5;
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

const STARS: StarDefinition[] = Array.from({ length: STAR_COUNT }, (_, index) => {
  const random = createSeededRandom(STAR_SEED + index * 97);
  const column = index % 10;
  const row = Math.floor(index / 10);
  const left = column * 10 + randomBetween(random, 4, 9);
  const top = row * 24 + randomBetween(random, 6, 18);
  const layer: StarLayer = random() > 0.42 ? "near" : "far";

  return {
    left: left.toFixed(1) + "%",
    top: Math.min(top, 94).toFixed(1) + "%",
    size:
      (layer === "near" ? randomBetween(random, 4, 5.5) : randomBetween(random, 2.5, 3.8)).toFixed(
        1,
      ) + "px",
    duration: Math.round(randomBetween(random, 12, 22)) + "s",
    delay: "-" + Math.round(randomBetween(random, 1, 14)) + "s",
    layer,
  };
});

export default function StarsBackground() {
  const starRefs = useRef<Array<HTMLSpanElement | null>>([]);
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const pointerTarget = { x: -9999, y: -9999, active: false };
    const pointerCurrent = { x: -9999, y: -9999 };

    const handlePointerMove = (event: PointerEvent) => {
      pointerTarget.x = event.clientX;
      pointerTarget.y = event.clientY;
      pointerTarget.active = true;
    };

    const resetPointer = () => {
      pointerTarget.x = -9999;
      pointerTarget.y = -9999;
      pointerTarget.active = false;
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

      const force = (1 - distance / REPULSION_RADIUS) ** 2;
      const layerStrength = star.layer === "near" ? 1 : 0.6;
      const magnitude = force * REPULSION_STRENGTH * layerStrength;
      const offsetX = (dx / distance) * magnitude;
      const offsetY = (dy / distance) * magnitude;

      element.style.setProperty("--star-offset-x", `${offsetX.toFixed(2)}px`);
      element.style.setProperty("--star-offset-y", `${offsetY.toFixed(2)}px`);
    };

    let frameId = 0;

    const animate = () => {
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * POINTER_LERP;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * POINTER_LERP;

      starRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        updateStarOffset(element, STARS[index], index);
      });

      frameId = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", resetPointer);
    window.addEventListener("blur", resetPointer);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const onStarClick = (index: number) => (event: ReactPointerEvent<HTMLSpanElement>) => {
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
    <div className="stars-bg" aria-hidden="true">
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
                starRefs.current[index] = element;
              }}
              className={`stars-bg__star stars-bg__star--${star.layer} ${exploded ? "exploded" : ""} ${respawning ? "respawning" : ""}`}
              onClick={onStarClick(index)}
              style={
                {
                  left: exploded && explosionPosition ? explosionPosition.left : star.left,
                  top: exploded && explosionPosition ? explosionPosition.top : star.top,
                  width: star.size,
                  height: star.size,
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
          );
        })(),
      )}
    </div>
  );
}
