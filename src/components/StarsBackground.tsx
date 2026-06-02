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

type StarDefinition = (typeof STARS)[number];

type ExplosionPosition = {
  left: string;
  top: string;
};

const REPULSION_RADIUS = 250;
const REPULSION_STRENGTH = 7;
const POINTER_LERP = 0.18;

const STARS = [
  {
    left: "6%",
    top: "10%",
    size: "4px",
    duration: "14s",
    delay: "-2s",
    layer: "near",
  },
  {
    left: "12%",
    top: "22%",
    size: "3px",
    duration: "18s",
    delay: "-6s",
    layer: "far",
  },
  {
    left: "18%",
    top: "8%",
    size: "5px",
    duration: "12s",
    delay: "-4s",
    layer: "near",
  },
  {
    left: "24%",
    top: "30%",
    size: "3px",
    duration: "20s",
    delay: "-8s",
    layer: "far",
  },
  {
    left: "31%",
    top: "14%",
    size: "4px",
    duration: "16s",
    delay: "-3s",
    layer: "near",
  },
  {
    left: "38%",
    top: "26%",
    size: "3px",
    duration: "19s",
    delay: "-10s",
    layer: "far",
  },
  {
    left: "44%",
    top: "9%",
    size: "5px",
    duration: "13s",
    delay: "-7s",
    layer: "near",
  },
  {
    left: "49%",
    top: "34%",
    size: "4px",
    duration: "17s",
    delay: "-5s",
    layer: "far",
  },
  {
    left: "56%",
    top: "16%",
    size: "4px",
    duration: "15s",
    delay: "-11s",
    layer: "near",
  },
  {
    left: "62%",
    top: "28%",
    size: "3px",
    duration: "21s",
    delay: "-1s",
    layer: "far",
  },
  {
    left: "69%",
    top: "12%",
    size: "5px",
    duration: "12s",
    delay: "-9s",
    layer: "near",
  },
  {
    left: "75%",
    top: "24%",
    size: "4px",
    duration: "18s",
    delay: "-12s",
    layer: "far",
  },
  {
    left: "82%",
    top: "7%",
    size: "4px",
    duration: "14s",
    delay: "-4s",
    layer: "near",
  },
  {
    left: "88%",
    top: "20%",
    size: "3px",
    duration: "20s",
    delay: "-13s",
    layer: "far",
  },
  {
    left: "94%",
    top: "11%",
    size: "5px",
    duration: "13s",
    delay: "-6s",
    layer: "near",
  },
  {
    left: "9%",
    top: "38%",
    size: "3px",
    duration: "19s",
    delay: "-5s",
    layer: "far",
  },
  {
    left: "21%",
    top: "42%",
    size: "4px",
    duration: "16s",
    delay: "-8s",
    layer: "near",
  },
  {
    left: "34%",
    top: "39%",
    size: "3px",
    duration: "22s",
    delay: "-2s",
    layer: "far",
  },
  {
    left: "47%",
    top: "44%",
    size: "5px",
    duration: "14s",
    delay: "-10s",
    layer: "near",
  },
  {
    left: "59%",
    top: "40%",
    size: "3px",
    duration: "18s",
    delay: "-14s",
    layer: "far",
  },
  {
    left: "71%",
    top: "36%",
    size: "4px",
    duration: "15s",
    delay: "-7s",
    layer: "near",
  },
  {
    left: "83%",
    top: "43%",
    size: "3px",
    duration: "20s",
    delay: "-3s",
    layer: "far",
  },
  {
    left: "91%",
    top: "35%",
    size: "4px",
    duration: "17s",
    delay: "-9s",
    layer: "near",
  },
  {
    left: "5%",
    top: "56%",
    size: "3px",
    duration: "18s",
    delay: "-4s",
    layer: "far",
  },
  {
    left: "14%",
    top: "62%",
    size: "4px",
    duration: "15s",
    delay: "-9s",
    layer: "near",
  },
  {
    left: "22%",
    top: "54%",
    size: "3px",
    duration: "21s",
    delay: "-6s",
    layer: "far",
  },
  {
    left: "29%",
    top: "68%",
    size: "5px",
    duration: "13s",
    delay: "-11s",
    layer: "near",
  },
  {
    left: "37%",
    top: "58%",
    size: "3px",
    duration: "20s",
    delay: "-2s",
    layer: "far",
  },
  {
    left: "45%",
    top: "72%",
    size: "4px",
    duration: "16s",
    delay: "-8s",
    layer: "near",
  },
  {
    left: "53%",
    top: "61%",
    size: "3px",
    duration: "19s",
    delay: "-12s",
    layer: "far",
  },
  {
    left: "61%",
    top: "78%",
    size: "5px",
    duration: "14s",
    delay: "-5s",
    layer: "near",
  },
  {
    left: "69%",
    top: "57%",
    size: "3px",
    duration: "22s",
    delay: "-7s",
    layer: "far",
  },
  {
    left: "76%",
    top: "70%",
    size: "4px",
    duration: "17s",
    delay: "-10s",
    layer: "near",
  },
  {
    left: "84%",
    top: "60%",
    size: "3px",
    duration: "20s",
    delay: "-3s",
    layer: "far",
  },
  {
    left: "92%",
    top: "75%",
    size: "4px",
    duration: "15s",
    delay: "-13s",
    layer: "near",
  },
  {
    left: "10%",
    top: "86%",
    size: "3px",
    duration: "21s",
    delay: "-1s",
    layer: "far",
  },
  {
    left: "26%",
    top: "90%",
    size: "4px",
    duration: "16s",
    delay: "-6s",
    layer: "near",
  },
  {
    left: "41%",
    top: "84%",
    size: "3px",
    duration: "18s",
    delay: "-9s",
    layer: "far",
  },
  {
    left: "58%",
    top: "92%",
    size: "5px",
    duration: "14s",
    delay: "-4s",
    layer: "near",
  },
  {
    left: "73%",
    top: "87%",
    size: "3px",
    duration: "19s",
    delay: "-12s",
    layer: "far",
  },
  {
    left: "89%",
    top: "91%",
    size: "4px",
    duration: "15s",
    delay: "-7s",
    layer: "near",
  },
];

export default function StarsBackground() {
  const starRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const explodedStarsRef = useRef<Set<number>>(new Set());
  const [explodedStars, setExplodedStars] = useState<Set<number>>(new Set());
  const [explosionPositions, setExplosionPositions] = useState<Map<number, ExplosionPosition>>(
    new Map(),
  );

  useEffect(() => {
    explodedStarsRef.current = explodedStars;
  }, [explodedStars]);

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
    const size = Number.parseFloat(STARS[index].size);
    const lockedLeft = `${event.clientX - size / 2}px`;
    const lockedTop = `${event.clientY - size / 2}px`;

    setExplosionPositions((prev) => {
      const next = new Map(prev);
      next.set(index, { left: lockedLeft, top: lockedTop });
      return next;
    });

    setExplodedStars((prev) => new Set(prev).add(index));
  };

  return (
    <div className="stars-bg" aria-hidden="true">
      {STARS.map((star, index) =>
        (() => {
          const colorDuration = `${9 + (index % 5) * 2}s`;
          const colorDelay = `-${(index * 3) % 11}s`;
          const colorOrder = STAR_COLOR_ORDERS[index % STAR_COLOR_ORDERS.length];
          const exploded = explodedStars.has(index);
          const explosionPosition = explosionPositions.get(index);

          return (
            <span
              key={`${star.left}-${star.top}-${index}`}
              ref={(element) => {
                starRefs.current[index] = element;
              }}
              className={`stars-bg__star stars-bg__star--${star.layer} ${exploded ? "exploded" : ""}`}
              onClick={onStarClick(index)}
              style={
                {
                  left: exploded && explosionPosition ? explosionPosition.left : star.left,
                  top: exploded && explosionPosition ? explosionPosition.top : star.top,
                  width: star.size,
                  height: star.size,
                  animationDuration: `${star.duration}, ${colorDuration}`,
                  animationDelay: `${star.delay}, ${colorDelay}`,
                  "--star-color-1": colorOrder[0],
                  "--star-color-2": colorOrder[1],
                  "--star-color-3": colorOrder[2],
                  "--star-color-4": colorOrder[3],
                  "--star-color-5": colorOrder[4],
                  "--star-offset-x": "0px",
                  "--star-offset-y": "0px",
                } as StarStyle
              }
            />
          );
        })(),
      )}
    </div>
  );
}
