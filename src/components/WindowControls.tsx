import { useId, type ReactNode, type Ref } from "react";

type LightProps = {
  label: string;
  color: string;
  iconColor: string;
  onClick: () => void;
  pressed?: boolean;
  children: ReactNode;
};

function Light({ label, color, iconColor, onClick, pressed, children }: LightProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      // The ::before widens the click target beyond the 12px dot
      className={`relative grid h-3 w-3 cursor-default place-items-center rounded-full before:absolute before:-inset-1 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--term-prompt)] ${color} ${iconColor}`}
    >
      <svg
        viewBox="0 0 12 12"
        className="h-2.5 w-2.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

type TrafficLightsProps = {
  /** which window, for the button labels */
  name?: string;
  zoomed: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onZoom: () => void;
};

/** macOS-style close / minimize / zoom buttons; icons show while hovering the group. */
export function TrafficLights({
  name = "terminal",
  zoomed,
  onClose,
  onMinimize,
  onZoom,
}: TrafficLightsProps) {
  return (
    <div className="group flex items-center gap-2">
      <Light
        label={`Close ${name}`}
        color="bg-[#ff5f57]"
        iconColor="text-[#4d0000]"
        onClick={onClose}
      >
        <path
          d="M3.5 3.5l5 5M8.5 3.5l-5 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </Light>
      <Light
        label={`Minimize ${name}`}
        color="bg-[#febc2e]"
        iconColor="text-[#995700]"
        onClick={onMinimize}
      >
        <path d="M2.75 6h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </Light>
      <Light
        label={`${zoomed ? "Exit" : "Enter"} full screen${name === "terminal" ? "" : ` (${name})`}`}
        color="bg-[#28c840]"
        iconColor="text-[#006500]"
        onClick={onZoom}
        pressed={zoomed}
      >
        {zoomed ? (
          // Arrows pointing in
          <path d="M5.5 5.5V2.5L2.5 5.5ZM6.5 6.5V9.5L9.5 6.5Z" fill="currentColor" />
        ) : (
          // Arrows pointing out
          <path d="M3 3H6.5L3 6.5ZM9 9H5.5L9 5.5Z" fill="currentColor" />
        )}
      </Light>
    </div>
  );
}

export type Wallpaper = "stars" | "black-hole";

/** Label for the wallpaper toggle, saying what it switches to. */
function wallpaperLabel(wallpaper: Wallpaper) {
  return wallpaper === "stars" ? "Switch to black hole wallpaper" : "Switch to star wallpaper";
}

/** A tiny black hole: dark core with a tilted glowing ring. */
function BlackHoleGlyph({ className }: { className?: string }) {
  // Unique per copy: the dock and the title bar can both be on the page
  const ring = `bh-glyph-ring-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={ring} x1="0" x2="1">
          <stop offset="0" stopColor="#ffd9a6" />
          <stop offset="0.5" stopColor="#ff7442" />
          <stop offset="1" stopColor="#ffd9a6" />
        </linearGradient>
      </defs>
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="3.4"
        transform="rotate(-14 12 12)"
        fill="none"
        stroke={`url(#${ring})`}
        strokeWidth="2"
      />
      {/* light bent over the top of the hole: what makes it read as a black hole */}
      <path
        d="M5.4 12 A6.6 6.6 0 0 1 18.6 12"
        transform="rotate(-14 12 12)"
        fill="none"
        stroke="#ffd9a6"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="4.4" fill="#000" stroke="#ffe2b4" strokeWidth="0.8" />
      {/* front of the ring passes in front of the core */}
      <path
        d="M2.3 14.4 A10 3.4 -14 0 0 21.7 9.6"
        fill="none"
        stroke={`url(#${ring})`}
        strokeWidth="2"
      />
    </svg>
  );
}

type WallpaperButtonProps = {
  wallpaper: Wallpaper;
  busy: boolean;
  onToggle: () => void;
};

/** Small wallpaper toggle for the terminal's title bar. */
export function TitleBarWallpaperButton({ wallpaper, busy, onToggle }: WallpaperButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={wallpaperLabel(wallpaper)}
      aria-pressed={wallpaper === "black-hole"}
      aria-disabled={busy || undefined}
      title={wallpaperLabel(wallpaper)}
      className={`grid h-6 w-6 cursor-pointer place-items-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--term-prompt)] ${busy ? "cursor-wait" : ""}`}
    >
      <BlackHoleGlyph className="h-4 w-4" />
    </button>
  );
}

const dockTile =
  "grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] shadow-lg transition-transform group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-[var(--term-prompt)]";
const dockTooltip =
  "pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

type DockProps = {
  /** terminal window state: a dot shows while it's running (open or minimized) */
  terminal: "open" | "minimized" | "closed";
  onOpen: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  /** browser window state: a dot shows while it's open or minimized */
  browser: "open" | "minimized" | "closed";
  onOpenBrowser: () => void;
  browserButtonRef?: Ref<HTMLButtonElement>;
  wallpaperButtonRef?: Ref<HTMLButtonElement>;
  /** out of the way: on-screen keyboard open, or a window is full screen */
  hidden?: boolean;
} & Omit<WallpaperButtonProps, "onToggle"> & { onToggleWallpaper: () => void };

const openLabel = (app: string, state: "open" | "minimized" | "closed") =>
  `${state === "minimized" ? "Restore" : state === "open" ? "Show" : "Open"} ${app}`;

/** A compass, like a browser's icon */
function CompassGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#2f8cf0" />
      <circle
        cx="16"
        cy="16"
        r="12.2"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="0.8"
        strokeDasharray="0.6 2.6"
      />
      <path d="M21.5 10.5 17.2 17.2 10.5 21.5 14.8 14.8Z" fill="#fff" />
      <path d="M21.5 10.5 17.2 17.2 14.8 14.8Z" fill="#ff4b3a" />
    </svg>
  );
}

const dockDot = (on: boolean) => `mt-1 h-1 w-1 rounded-full bg-white/80 ${on ? "" : "invisible"}`;

/** The dock at the bottom of the screen: Terminal, Browser, Wallpaper. */
export function Dock({
  terminal,
  onOpen,
  buttonRef,
  browser,
  onOpenBrowser,
  browserButtonRef,
  wallpaperButtonRef,
  wallpaper,
  busy,
  onToggleWallpaper,
  hidden = false,
}: DockProps) {
  return (
    <div
      className={`dock fixed inset-x-0 bottom-2 z-20 flex justify-center ${hidden ? "dock--hidden" : ""} ${terminal === "open" ? "dock--terminal-open" : ""}`}
      inert={hidden}
    >
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-md">
        <button
          ref={buttonRef}
          type="button"
          onClick={onOpen}
          aria-label={openLabel("terminal", terminal)}
          className="group relative flex flex-col items-center focus-visible:outline-none"
        >
          <span className={dockTooltip}>Terminal</span>
          <span className={`${dockTile} font-mono text-sm text-[var(--term-green)]`}>&gt;_</span>
          <span className={dockDot(terminal !== "closed")} aria-hidden="true" />
        </button>
        <button
          ref={browserButtonRef}
          type="button"
          onClick={onOpenBrowser}
          aria-label={openLabel("browser", browser)}
          className="group relative flex flex-col items-center focus-visible:outline-none"
        >
          <span className={dockTooltip}>Browser</span>
          <span className={dockTile}>
            <CompassGlyph className="h-9 w-9" />
          </span>
          <span className={dockDot(browser !== "closed")} aria-hidden="true" />
        </button>
        <button
          type="button"
          ref={wallpaperButtonRef}
          onClick={onToggleWallpaper}
          aria-label={wallpaperLabel(wallpaper)}
          aria-pressed={wallpaper === "black-hole"}
          aria-disabled={busy || undefined}
          className={`group relative flex flex-col items-center focus-visible:outline-none ${busy ? "cursor-wait" : ""}`}
        >
          <span className={dockTooltip}>Wallpaper</span>
          <span className={dockTile}>
            <BlackHoleGlyph className="h-8 w-8" />
          </span>
          <span className={dockDot(wallpaper === "black-hole")} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
