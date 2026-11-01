import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";

import StarsBackground from "../components/StarsBackground";
import faviconSvg from "../assets/favicon.svg?url";
import portraitJpg from "../assets/matteus-portrait.jpg?url";
import { SITE_URL } from "../lib/site";
import appCss from "../styles.css?url";

/** The missing path, typed at the prompt as if it were a command. */
function NotFoundComponent() {
  const pathname = useLocation({ select: (l) => l.pathname });
  let command = pathname.replace(/^\/+|\/+$/g, "");
  try {
    command = decodeURIComponent(command);
  } catch {
    // Malformed escapes: show the path as it is
  }
  const prompt = (
    <span aria-hidden="true">
      <span style={{ color: "var(--term-prompt)" }}>matteus@legat</span>
      <span className="text-term-dim">:</span>
      <span className="text-term-cyan">~</span>
      <span className="text-term-dim">$ </span>
    </span>
  );

  return (
    <>
      <StarsBackground />
      <main className="relative z-10 flex h-[var(--app-height)] items-center justify-center p-4">
        <div
          className="w-full max-w-2xl rounded-[12px] border border-border p-6 text-sm leading-relaxed text-foreground shadow-2xl backdrop-blur-md crt-glow sm:text-[15px]"
          style={{ backgroundColor: "color-mix(in oklab, var(--terminal-bg) 82.5%, transparent)" }}
        >
          <h1 className="sr-only">Page not found</h1>
          <div className="break-all" style={{ whiteSpace: "pre-wrap" }}>
            {prompt}
            {command}
          </div>
          <div className="break-all text-term-red" style={{ whiteSpace: "pre-wrap" }}>
            bash: {command}: command not found
          </div>
          <div className="mt-4 text-term-dim">
            // 404 · page not found · run{" "}
            <Link to="/" className="text-term-yellow underline underline-offset-4">
              cd ~
            </Link>{" "}
            to go home
          </div>
          <div className="mt-4">
            {prompt}
            <span className="cursor-block" aria-hidden="true" />
          </div>
        </div>
      </main>
    </>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        // The on-screen keyboard shrinks the page instead of covering it (Android Chrome)
        content: "width=device-width, initial-scale=1, interactive-widget=resizes-content",
      },
      { title: "Matteus Legat" },
      { name: "description", content: "Full Stack Web Developer" },
      { name: "author", content: "Matteus Legat" },
      { property: "og:title", content: "Matteus Legat" },
      { property: "og:description", content: "Full Stack Web Developer" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Matteus Legat" },
      { property: "og:image", content: `${SITE_URL}${portraitJpg}` },
      { property: "og:image:width", content: "512" },
      { property: "og:image:height", content: "512" },
      { property: "og:image:alt", content: "Portrait of Matteus Legat" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      // Loaded here, not via CSS @import: Tailwind drops an @import that follows its own
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..700&display=swap",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: faviconSvg,
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

const NO_SCRIPT_CSS = `
.transcript-plain.sr-only {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  clip-path: none;
  white-space: normal;
}
.intro-hint { display: none; }
`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Without JavaScript nothing types the CV out: show its plain copy instead, and drop
            the hint about skipping and typing */}
        <noscript>
          <style>{NO_SCRIPT_CSS}</style>
        </noscript>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
