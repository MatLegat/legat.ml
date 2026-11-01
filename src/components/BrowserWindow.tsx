import { ChevronLeft, ChevronRight, Lock, Mail, Plus, Search, Share } from "lucide-react";
import { useRef, useState, type MouseEvent, type ReactNode, type Ref } from "react";
import cvPdfUrl from "@/assets/CV_MatteusLegat.pdf?url";
import { TrafficLights } from "@/components/WindowControls";
import { SITE_URL } from "@/lib/site";

export type WindowState = "open" | "minimized" | "closed";

type Favorite = {
  name: string;
  url: string;
  tile: string;
  icon: ReactNode;
  /** opens inside this window (where the browser can show it) instead of a new tab */
  inline?: boolean;
};

const FAVORITES: Favorite[] = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/matlegat/",
    tile: "bg-[#0a66c2]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
        <path
          fill="#fff"
          d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"
        />
      </svg>
    ),
  },
  {
    name: "GitHub",
    url: "https://github.com/matlegat",
    tile: "bg-[#24292f]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
        <path
          fill="#fff"
          d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"
        />
      </svg>
    ),
  },
  {
    name: "Curriculum",
    url: cvPdfUrl,
    tile: "bg-[#e8e8ea]",
    inline: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
        <path fill="#fff" stroke="#b9b9bf" strokeWidth="0.8" d="M6 2.5h8.5L19 7v14.5H6z" />
        <path fill="#d9d9de" d="M14.5 2.5V7H19z" />
        <rect x="4" y="12" width="12" height="6" rx="1.2" fill="#e5322d" />
        <text
          x="10"
          y="16.6"
          textAnchor="middle"
          fontSize="4.3"
          fontWeight="700"
          fill="#fff"
          fontFamily="-apple-system, system-ui, sans-serif"
        >
          PDF
        </text>
      </svg>
    ),
  },
  {
    name: "Email",
    url: "mailto:matteus@legat.ml",
    tile: "bg-gradient-to-b from-[#45b1ff] to-[#1a6dff]",
    icon: <Mail className="h-8 w-8 text-white" strokeWidth={1.75} aria-hidden="true" />,
  },
];

type BrowserWindowProps = {
  state: WindowState;
  zoomed: boolean;
  /** on top of the terminal */
  front: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onZoom: () => void;
  onFocus: () => void;
  /** first favorite, focused when the window opens */
  firstLinkRef?: Ref<HTMLAnchorElement>;
};

/** A Safari-style browser window showing a new tab page with favorites. */
export function BrowserWindow({
  state,
  zoomed,
  front,
  onClose,
  onMinimize,
  onZoom,
  onFocus,
  firstLinkRef,
}: BrowserWindowProps) {
  // Two pages: the favorites, and the CV opened from them. `visited` enables forward.
  const [page, setPage] = useState<"start" | "cv">("start");
  const [visited, setVisited] = useState(false);
  const backRef = useRef<HTMLButtonElement>(null);

  // A window opened again after closing starts on the favorites, like a new window
  const [previousState, setPreviousState] = useState(state);
  if (state !== previousState) {
    setPreviousState(state);
    if (previousState === "closed" && state === "open") {
      setPage("start");
      setVisited(false);
    }
  }

  const openInline = (e: MouseEvent<HTMLAnchorElement>) => {
    // Browsers that can't show a PDF inside a page (e.g. Android Chrome) keep the link's
    // default: a new tab
    if (!navigator.pdfViewerEnabled) return;
    e.preventDefault();
    setPage("cv");
    setVisited(true);
    requestAnimationFrame(() => backRef.current?.focus());
  };

  const navButton =
    "grid h-7 w-7 place-items-center rounded-md text-white/70 enabled:hover:bg-white/10 disabled:text-white/25";

  return (
    <section
      aria-label="Browser"
      className="browser-shell"
      data-state={state}
      data-zoomed={zoomed || undefined}
      data-front={front || undefined}
      inert={state !== "open"}
      onPointerDown={onFocus}
    >
      <div
        className="flex shrink-0 select-none items-center gap-3 border-b border-white/10 bg-[#2b2b2d] px-4 py-2.5"
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest("button, a")) onZoom();
        }}
      >
        <TrafficLights
          name="browser"
          zoomed={zoomed}
          onClose={onClose}
          onMinimize={onMinimize}
          onZoom={onZoom}
        />
        <div className="flex items-center gap-0.5">
          <button
            ref={backRef}
            type="button"
            aria-label="Back"
            disabled={page === "start"}
            onClick={() => setPage("start")}
            className={navButton}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Forward"
            disabled={page === "cv" || !visited}
            onClick={() => setPage("cv")}
            className={navButton}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div
          className="mx-auto flex h-8 w-full max-w-md items-center justify-center gap-2 rounded-lg bg-white/10 px-3 text-sm text-white/45"
          aria-hidden="true"
        >
          {page === "start" ? (
            <>
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Search or enter website name</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 shrink-0" />
              <span className="truncate text-white/80">{new URL(SITE_URL).host}</span>
            </>
          )}
        </div>
        <div className="hidden items-center gap-3 text-white/45 sm:flex">
          {page === "cv" ? (
            <a
              href={cvPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the curriculum in a new tab"
              title="Open in a new tab"
              className="hover:text-white/80"
            >
              <Share className="h-4 w-4" />
            </a>
          ) : (
            <Share className="h-4 w-4" aria-hidden="true" />
          )}
          <Plus className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      {page === "cv" ? (
        <iframe
          src={cvPdfUrl}
          title="Curriculum (PDF)"
          className="min-h-0 w-full flex-1 border-0 bg-[#525659]"
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#1e1e1e] px-6 py-10 sm:px-12">
          <h2 className="mx-auto max-w-xl text-lg font-semibold text-white/90">Favorites</h2>
          <ul className="mx-auto mt-5 flex max-w-xl flex-wrap gap-6">
            {FAVORITES.map((fav, i) => (
              <li key={fav.name}>
                <a
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={fav.url}
                  // Web pages open in a new tab; email opens the mail app, no tab needed
                  {...(fav.url.startsWith("mailto:")
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  onClick={fav.inline ? openInline : undefined}
                  className="group flex w-20 flex-col items-center gap-2 rounded-xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <span
                    className={`grid h-16 w-16 place-items-center rounded-2xl shadow-lg transition-transform group-hover:scale-105 ${fav.tile}`}
                  >
                    {fav.icon}
                  </span>
                  <span className="text-xs text-white/80">{fav.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
