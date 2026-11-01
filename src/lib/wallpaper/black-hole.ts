// Black-hole wallpaper: pulls the existing stars in, keeps a slow trickle of new ones
// falling, and flings them back out when switched off. Loaded only on first use.
import "./black-hole.css";
import { fromPolar, infall, burst, seededRandom, toPolar, type Point, type Polar } from "./orbits";

/** A star handed over by the star background: the slot that positions it. */
export type ControlledStar = {
  el: HTMLElement;
  /** where it was on screen when handed over */
  start: Point;
  /** its resting position (without any transform); depends on the viewport size */
  home: () => Point;
  /** opacity to return to */
  opacity: number;
  /** already gone (exploded by a click): starts out swallowed, not pulled in */
  hidden: boolean;
};

export type BlackHole = {
  /** Start pulling the stars in. */
  consume(): void;
  /** Collapse the hole and fling the stars back home; `onDone` runs once they're there. */
  release(onDone: () => void): void;
  /** Stop everything and remove the hole immediately. */
  destroy(): void;
};

type Mode = "infall" | "absorbed" | "burst" | "home";

type Body = {
  star: ControlledStar;
  random: () => number;
  mode: Mode;
  /** current position */
  pos: Polar;
  /** where the current path started */
  from: Polar;
  /** time on the current path, delay before moving, and path duration (seconds) */
  t: number;
  delay: number;
  duration: number;
  /** fade in at the start of the path (respawned or returning from inside the hole) */
  fadeIn: boolean;
};

// All matter orbits the same way, like a real accretion disk
const DIR = 1;
// How long the hole implodes before it explodes
const IMPLODE_MS = 260;

export function createBlackHole({
  layer,
  stars,
}: {
  layer: HTMLElement;
  stars: ControlledStar[];
}): BlackHole {
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hole = document.createElement("div");
  hole.className = "bh";
  hole.innerHTML = BLACK_HOLE_SVG;
  layer.appendChild(hole);

  // Geometry, refreshed on resize: hole center, horizon and disk radii, star homes
  let center: Point = { x: 0, y: 0 };
  let horizonR = 0;
  let diskR = 0;
  let maxR = 1;
  let homes: Point[] = [];
  const measure = () => {
    const oldCenter = center;
    center = { x: layer.clientWidth / 2, y: layer.clientHeight / 2 };
    rebase(oldCenter);
    // In the SVG's 24-unit box: horizon radius 4.4, disk reaches about 9
    horizonR = hole.offsetWidth * (4.4 / 24);
    diskR = hole.offsetWidth * (9 / 24);
    maxR = Math.hypot(center.x, center.y);
    homes = stars.map((s) => s.home());
  };
  // After a resize the center moves: restart moving stars' paths from where they are now,
  // so they don't jump by the shift (returning ones then head for their new homes)
  function rebase(oldCenter: Point) {
    for (const body of bodies) {
      if (body.mode === "absorbed" || body.mode === "home") continue;
      const u = (body.t - body.delay) / body.duration;
      const here = toPolar(fromPolar(body.pos, oldCenter), center);
      if (u <= 0) {
        body.from = toPolar(fromPolar(body.from, oldCenter), center);
        body.pos = body.from;
        continue;
      }
      body.fadeIn = body.fadeIn && u < 0.15;
      body.from = here;
      body.pos = here;
      body.t = 0;
      body.delay = 0;
      body.duration = Math.max(0.3, body.duration * (1 - Math.min(u, 1)));
    }
  }
  // Filled in right after the first measure, which needs no rebasing
  let bodies: Body[] = [];
  measure();

  bodies = stars.map((star, i) => {
    const pos = toPolar(star.start, center);
    return {
      star,
      random: seededRandom(7349 + i * 97),
      mode: "home",
      pos,
      from: pos,
      t: 0,
      delay: 0,
      duration: 1,
      fadeIn: false,
    };
  });

  let frameId = 0;
  let lastTime = 0;
  let respawnTimer = 0;
  let explodeTimer = 0;
  // Flash and shockwaves of the explosion, removed when done
  const effects: HTMLElement[] = [];
  let releasing = false;
  let onReleased: (() => void) | null = null;

  const render = (
    body: Body,
    index: number,
    stretch: number,
    opacity: number,
    // Direction of travel, to stretch along: by default the orbit's tangent
    angle = body.pos.theta + (DIR * Math.PI) / 2,
  ) => {
    const p = fromPolar(body.pos, center);
    const home = homes[index];
    const el = body.star.el;
    el.style.transform =
      `translate(${(p.x - home.x).toFixed(1)}px, ${(p.y - home.y).toFixed(1)}px) ` +
      `rotate(${angle.toFixed(3)}rad) scale(${(1 + 2.4 * stretch).toFixed(3)}, ${(1 - 0.45 * stretch).toFixed(3)}) ` +
      `rotate(${(-angle).toFixed(3)}rad)`;
    el.style.opacity = opacity.toFixed(3);
  };

  const step = (body: Body, index: number, dt: number) => {
    body.t += dt;
    const u = (body.t - body.delay) / body.duration;
    if (u < 0) return true;

    if (body.mode === "infall") {
      body.pos = infall(u, body.from, DIR, horizonR * 0.6);
      const closeness = 1 - body.pos.r / body.from.r;
      // Fade out while crossing the disk toward the horizon
      const visible = Math.min(1, Math.max(0, (body.pos.r - horizonR) / (diskR - horizonR)));
      const fade = body.fadeIn ? Math.min(1, u / 0.15) : 1;
      render(body, index, closeness ** 2, body.star.opacity * visible * fade);
      if (u >= 1 || body.pos.r <= horizonR) {
        body.mode = "absorbed";
        body.star.el.style.opacity = "0";
        return false;
      }
      return true;
    }

    if (body.mode === "burst") {
      const homePolar = toPolar(homes[index], center);
      const { pos, stretch } = burst(u, body.from.r, homePolar);
      body.pos = pos;
      // Streaks straight out from the center, popping into view right away
      render(body, index, stretch, body.star.opacity * Math.min(1, u / 0.05), homePolar.theta);
      if (u >= 1) {
        body.mode = "home";
        return false;
      }
      return true;
    }
    return false;
  };

  const frame = (now: number) => {
    // Clamped, so a paused tab doesn't make everything jump on return
    const dt = Math.min(now - lastTime, 50) / 1000;
    lastTime = now;
    let moving = false;
    bodies.forEach((body, i) => {
      if (body.mode === "infall" || body.mode === "burst") {
        if (step(body, i, dt)) moving = true;
      }
    });

    if (releasing && bodies.every((b) => b.mode === "home")) {
      frameId = 0;
      finishRelease();
      return;
    }
    frameId = moving ? requestAnimationFrame(frame) : 0;
  };

  const wake = () => {
    if (frameId) return;
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
  };

  // --- Ongoing activity: about once a second a consumed star falls in again ---------

  const scheduleRespawn = () => {
    window.clearTimeout(respawnTimer);
    if (releasing || reducedMotion() || document.hidden) return;
    respawnTimer = window.setTimeout(
      () => {
        const absorbed = bodies.filter((b) => b.mode === "absorbed");
        if (absorbed.length) {
          const body = absorbed[Math.floor(Math.random() * absorbed.length)];
          const theta = Math.random() * 2 * Math.PI;
          body.from = { r: maxR * (0.8 + 0.25 * Math.random()), theta };
          body.pos = body.from;
          body.mode = "infall";
          body.fadeIn = true;
          body.t = 0;
          body.delay = 0;
          body.duration = 5 + 2 * Math.random();
          wake();
        }
        scheduleRespawn();
      },
      625 + 500 * Math.random(),
    );
  };

  const onVisibility = () => (document.hidden ? clearTimeout(respawnTimer) : scheduleRespawn());
  const onResize = () => measure();
  // Reduced motion switched on mid-effect: finish instantly instead of animating
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMotionChange = () => {
    if (!motionQuery.matches) {
      scheduleRespawn();
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = 0;
    window.clearTimeout(respawnTimer);
    if (releasing) {
      bodies.forEach((b) => (b.mode = "home"));
      finishRelease();
      return;
    }
    bodies.forEach((b) => {
      b.mode = "absorbed";
      b.star.el.style.opacity = "0";
    });
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize);
  motionQuery.addEventListener("change", onMotionChange);

  // --- Switching back ------------------------------------------------------------

  const explosionEffects = () => {
    const add = (className: string) => {
      const el = document.createElement("div");
      el.className = className;
      layer.appendChild(el);
      effects.push(el);
      return el;
    };
    const play = (el: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) =>
      el.animate(frames, { fill: "both", ...options }).finished.then(
        () => el.remove(),
        () => {},
      );

    const flash = add("bh-flash");
    play(
      flash,
      [
        { transform: "scale(0.2)", opacity: 1 },
        { transform: "scale(1.7)", opacity: 0 },
      ],
      { duration: 750, easing: "cubic-bezier(0.1, 0.8, 0.3, 1)" },
    );

    // Shockwaves reach past the corners of the screen
    const reach = (el: HTMLElement) => (2.2 * maxR) / (el.offsetWidth || 1);
    const ring = add("bh-shock");
    play(
      ring,
      [
        { transform: "scale(0.1)", opacity: 1 },
        { transform: `scale(${reach(ring)})`, opacity: 0 },
      ],
      { duration: 1200, easing: "cubic-bezier(0.1, 0.7, 0.3, 1)" },
    );
    // A second, flatter wave along the tilted disk
    const disk = add("bh-shock bh-shock--disk");
    const s = reach(disk);
    play(
      disk,
      [
        { transform: "rotate(-14deg) scale(0.1, 0.03)", opacity: 0.9 },
        { transform: `rotate(-14deg) scale(${s}, ${s * 0.28})`, opacity: 0 },
      ],
      { duration: 1000, delay: 60, easing: "cubic-bezier(0.1, 0.7, 0.3, 1)" },
    );
  };

  const finishRelease = () => {
    cleanup();
    const done = onReleased;
    onReleased = null;
    done?.();
  };

  const cleanup = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    window.clearTimeout(respawnTimer);
    window.clearTimeout(explodeTimer);
    effects.forEach((el) => el.remove());
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", onResize);
    motionQuery.removeEventListener("change", onMotionChange);
    hole.remove();
  };

  return {
    consume() {
      if (reducedMotion()) {
        // No spiral: the stars are simply gone and the hole sits still
        bodies.forEach((b) => {
          b.mode = "absorbed";
          b.star.el.style.opacity = "0";
        });
        return;
      }
      bodies.forEach((body) => {
        if (body.star.hidden) {
          body.mode = "absorbed";
          body.star.el.style.opacity = "0";
          return;
        }
        const reach = body.from.r / maxR;
        body.mode = "infall";
        body.fadeIn = false;
        body.t = 0;
        // Nearer stars go first; the whole show takes about three seconds
        body.delay = 0.2 + reach * 0.9 + body.random() * 0.3;
        body.duration = 1.3 + reach * 1.3 + body.random() * 0.3;
      });
      wake();
      scheduleRespawn();
    },

    release(onDone) {
      releasing = true;
      onReleased = onDone;
      window.clearTimeout(respawnTimer);
      if (reducedMotion()) {
        finishRelease();
        return;
      }

      // 1. Implosion: the hole shrinks and flares; anything still falling is swallowed
      hole.animate(
        [
          { transform: "scale(1)", filter: "brightness(1)" },
          { transform: "scale(0.22)", filter: "brightness(2.6)" },
        ],
        { duration: IMPLODE_MS, easing: "cubic-bezier(0.6, 0, 1, 0.6)", fill: "forwards" },
      );
      bodies.forEach((body) => {
        if (body.mode === "absorbed") return;
        body.mode = "absorbed";
        const el = body.star.el;
        el.animate([{ opacity: el.style.opacity || 1 }, { opacity: 0 }], {
          duration: IMPLODE_MS * 0.8,
          easing: "ease-in",
        });
        el.style.opacity = "0";
      });

      // 2. Explosion: flash, shockwaves, and every star blasted back out to its place
      explodeTimer = window.setTimeout(() => {
        hole.animate(
          [
            { transform: "scale(0.22)", opacity: 1 },
            { transform: "scale(0)", opacity: 0 },
          ],
          {
            duration: 120,
            fill: "forwards",
          },
        );
        explosionEffects();
        bodies.forEach((body) => {
          body.mode = "burst";
          body.from = { r: horizonR * 0.15, theta: 0 };
          body.t = 0;
          body.delay = body.random() * 0.08;
          body.duration = 0.9 + body.random() * 0.6;
        });
        wake();
      }, IMPLODE_MS);
    },

    destroy() {
      releasing = true;
      onReleased = null;
      cleanup();
    },
  };
}

/**
 * The black hole, in the style of the dock icon: a thin tilted ring of hot gas whose near
 * side passes in front of the hole, a ring of bent light hugging the hole (brightest on
 * top), and a dark core, with clumps of light orbiting in the disk. Drawn in a 24-unit box
 * so it stays crisp at any size.
 */
// The far half goes behind the hole, the near half in front; they meet at the ends without
// overlapping, so the see-through rings don't show a brighter band or a seam
const FAR_SIDE = "M-8.2 0 A8.2 2.5 0 0 1 8.2 0";
const NEAR_SIDE = "M-8.2 0 A8.2 2.5 0 0 0 8.2 0";
// The whole disk as one loop, for the clumps of light that travel around it
const LOOP = "M-8.2 0 A8.2 2.5 0 1 0 8.2 0 A8.2 2.5 0 1 0 -8.2 0";
const BLACK_HOLE_SVG = `
<svg viewBox="-12 -12 24 24" aria-hidden="true">
  <defs>
    <linearGradient id="bh-gas" gradientUnits="userSpaceOnUse" x1="-8.2" y1="0" x2="8.2" y2="0">
      <stop offset="0" stop-color="#f2b07a"/>
      <stop offset="0.35" stop-color="#c8653a"/>
      <stop offset="0.5" stop-color="#9c3a26"/>
      <stop offset="0.65" stop-color="#c8653a"/>
      <stop offset="1" stop-color="#f2b07a"/>
    </linearGradient>
    <linearGradient id="bh-lens" gradientUnits="userSpaceOnUse" x1="0" y1="-5.4" x2="0" y2="5.4">
      <stop offset="0" stop-color="#f6c896"/>
      <stop offset="0.55" stop-color="#d98a58" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#c8653a" stop-opacity="0.15"/>
    </linearGradient>
    <radialGradient id="bh-glow">
      <stop offset="0.35" stop-color="#e07a46" stop-opacity="0.12"/>
      <stop offset="0.7" stop-color="#e07a46" stop-opacity="0.03"/>
      <stop offset="1" stop-color="#e07a46" stop-opacity="0"/>
    </radialGradient>
    <!-- Hides the part of the loop that passes behind the hole (its far half) -->
    <mask id="bh-behind" maskUnits="userSpaceOnUse" x="-12" y="-12" width="24" height="24">
      <rect x="-12" y="-12" width="24" height="24" fill="#fff"/>
      <path d="M-4.55 0 A4.55 4.55 0 0 1 4.55 0 Z" fill="#000"/>
    </mask>
    <filter id="bh-haze" filterUnits="userSpaceOnUse" x="-12" y="-12" width="24" height="24">
      <feGaussianBlur stdDeviation="0.55"/>
    </filter>
  </defs>
  <circle r="12" fill="url(#bh-glow)"/>
  <g transform="rotate(-14)" fill="none" opacity="0.9">
    <path d="${FAR_SIDE}" stroke="url(#bh-gas)" stroke-width="3.2" opacity="0.4" filter="url(#bh-haze)"/>
    <path d="${FAR_SIDE}" stroke="url(#bh-gas)" stroke-width="1.3"/>
  </g>
  <g opacity="0.9">
    <circle r="5.3" fill="none" stroke="url(#bh-lens)" stroke-width="1.4" opacity="0.4" filter="url(#bh-haze)"/>
    <circle r="5.3" fill="none" stroke="url(#bh-lens)" stroke-width="0.45"/>
  </g>
  <circle r="4.4" fill="#000" stroke="#e8b98c" stroke-width="0.15"/>
  <g transform="rotate(-14)" fill="none" opacity="0.9">
    <path d="${NEAR_SIDE}" stroke="url(#bh-gas)" stroke-width="3.2" opacity="0.4" filter="url(#bh-haze)"/>
    <path d="${NEAR_SIDE}" stroke="url(#bh-gas)" stroke-width="1.3"/>
  </g>
  <g transform="rotate(-14)" mask="url(#bh-behind)" opacity="0.9">
    <path class="bh__orbit" d="${LOOP}" pathLength="100" fill="none" stroke="#ffd2a2"
      stroke-width="1.3" stroke-linecap="round" stroke-dasharray="2 6 1 5 3 8" opacity="0.16"/>
    <path class="bh__orbit" d="${LOOP}" pathLength="100" fill="none" stroke="#ffe6c6"
      stroke-width="0.45" stroke-linecap="round" stroke-dasharray="2 6 1 5 3 8" opacity="0.5"/>
  </g>
</svg>`;
