import { createRouter, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// TEMP DEBUG: the error's details, shown in production too, to find a crash on iOS 26.2
function debugReport(error: unknown, componentStack?: string) {
  const err = error instanceof Error ? error : null;
  return [
    `${err?.name ?? typeof error}: ${err?.message ?? String(error)}`,
    "",
    `url: ${typeof location === "undefined" ? "(server)" : location.href}`,
    `browser: ${typeof navigator === "undefined" ? "(server)" : navigator.userAgent}`,
    `time: ${new Date().toISOString()}`,
    "",
    "stack:",
    err?.stack ?? "(none)",
    ...(componentStack ? ["", "component stack:", componentStack.trim()] : []),
  ].join("\n");
}

function DefaultErrorComponent({ error, reset, info }: ErrorComponentProps) {
  const router = useRouter();
  // TEMP DEBUG
  const report = debugReport(error, info?.componentStack);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        {/* TEMP DEBUG: always show the details, with a way to copy them off the phone */}
        <pre className="mt-4 max-h-[45vh] select-text overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-left font-mono text-xs text-destructive">
          {report}
        </pre>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(report)}
          className="mt-2 text-xs text-muted-foreground underline underline-offset-4"
        >
          Copy error details
        </button>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
