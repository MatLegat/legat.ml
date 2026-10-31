import type { ReactNode, Ref } from "react";

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
  zoomed: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onZoom: () => void;
};

/** macOS-style close / minimize / zoom buttons; icons show while hovering the group. */
export function TrafficLights({ zoomed, onClose, onMinimize, onZoom }: TrafficLightsProps) {
  return (
    <div className="group flex items-center gap-2">
      <Light
        label="Close terminal"
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
        label="Minimize terminal"
        color="bg-[#febc2e]"
        iconColor="text-[#995700]"
        onClick={onMinimize}
      >
        <path d="M2.75 6h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </Light>
      <Light
        label={zoomed ? "Exit full screen" : "Enter full screen"}
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

type DockProps = {
  /** minimized: the window still exists (dot under the icon); closed: a new window opens */
  minimized: boolean;
  onOpen: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
};

/** A one-icon dock, shown while the terminal is minimized or closed. */
export function Dock({ minimized, onOpen, buttonRef }: DockProps) {
  return (
    <div className="dock fixed inset-x-0 bottom-20 z-20 flex justify-center [@media(max-height:324px)]:bottom-3">
      <div className="rounded-2xl border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-md">
        <button
          ref={buttonRef}
          type="button"
          onClick={onOpen}
          aria-label={minimized ? "Restore terminal" : "Open terminal"}
          className="group relative flex flex-col items-center focus-visible:outline-none"
        >
          <span className="pointer-events-none absolute -top-9 rounded-md bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Terminal
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] font-mono text-sm text-[var(--term-green)] shadow-lg transition-transform group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-[var(--term-prompt)]">
            &gt;_
          </span>
          <span
            className={`mt-1 h-1 w-1 rounded-full bg-white/80 ${minimized ? "" : "invisible"}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
