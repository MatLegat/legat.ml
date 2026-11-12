import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";

type PdfViewerProps = {
  url: string;
  title: string;
};

/**
 * Renders a PDF with pdf.js: each page is a canvas in a plain scrolling div, with its text
 * (transparent, for selecting, searching and screen readers) and links laid over it. Chrome's built-in viewer scrolls with jank while the wallpaper animates.
 * pdf.js loads only when the viewer mounts. If it fails, the browser's viewer is used.
 */
export function PdfViewer({ url, title }: PdfViewerProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = pagesRef.current;
    if (!container) return;
    let cancelled = false;
    let doc: PDFDocumentProxy | undefined;
    let task: PDFDocumentLoadingTask | undefined;
    // A newer render (after a resize) makes older ones stop
    let generation = 0;
    let resizeTimer = 0;
    const observer = new ResizeObserver(() => {
      updateScale();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => void render(), 150);
    });

    // The text layer sizes its text by this, so it follows the sheet without being rebuilt
    function updateScale() {
      for (const sheet of container!.querySelectorAll<HTMLDivElement>("[data-page]")) {
        const scale = sheet.clientWidth / Number(sheet.dataset.width);
        sheet.style.setProperty("--total-scale-factor", String(scale));
      }
    }

    async function render() {
      if (!doc || !container) return;
      const current = ++generation;
      const sheets = [...container.querySelectorAll<HTMLDivElement>("[data-page]")];
      for (const sheet of sheets) {
        const page = await doc.getPage(Number(sheet.dataset.page));
        if (cancelled || current !== generation) return;
        const base = page.getViewport({ scale: 1 });
        const scale = (sheet.clientWidth / base.width) * window.devicePixelRatio;
        const viewport = page.getViewport({ scale });
        // Drawn off screen, then swapped in, so a resize doesn't flash a blank page
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.className = "absolute inset-0 h-full w-full";
        canvas.setAttribute("aria-hidden", "true");
        await page.render({ canvas, viewport }).promise;
        if (cancelled || current !== generation) return;
        sheet.querySelector("canvas")?.remove();
        sheet.prepend(canvas);
      }
    }

    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        task = pdfjs.getDocument({ url });
        doc = await task.promise;
        if (cancelled) return;

        // One sheet per page, sized by its aspect ratio, with its links as percentages so
        // they follow the sheet's size without redrawing
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const [annotations, textContent] = await Promise.all([
            page.getAnnotations(),
            page.getTextContent(),
          ]);
          if (cancelled) return;
          const sheet = document.createElement("div");
          sheet.dataset.page = String(n);
          sheet.dataset.width = String(base.width);
          sheet.className = "relative mx-auto w-full max-w-[820px] bg-white shadow-lg";
          sheet.style.aspectRatio = `${base.width} / ${base.height}`;
          const text = document.createElement("div");
          text.className = "pdf-text";
          sheet.append(text);
          await new pdfjs.TextLayer({
            textContentSource: textContent,
            container: text,
            viewport: base,
          }).render();
          if (cancelled) return;
          for (const annotation of annotations) {
            if (annotation.subtype !== "Link" || !annotation.url) continue;
            const [rx1, ry1, rx2, ry2] = annotation.rect as number[];
            const [x1, y1] = base.convertToViewportPoint(rx1, ry1) as number[];
            const [x2, y2] = base.convertToViewportPoint(rx2, ry2) as number[];
            const link = document.createElement("a");
            link.href = annotation.url;
            if (!annotation.url.startsWith("mailto:")) {
              link.target = "_blank";
              link.rel = "noopener noreferrer";
            }
            link.className = "absolute z-10";
            link.setAttribute("aria-label", annotation.url.replace(/^mailto:/, ""));
            link.style.left = `${(Math.min(x1, x2) / base.width) * 100}%`;
            link.style.top = `${(Math.min(y1, y2) / base.height) * 100}%`;
            link.style.width = `${(Math.abs(x2 - x1) / base.width) * 100}%`;
            link.style.height = `${(Math.abs(y2 - y1) / base.height) * 100}%`;
            sheet.append(link);
          }
          container.append(sheet);
        }
        updateScale();
        await render();
        observer.observe(container);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      container.replaceChildren();
      void task?.destroy();
    };
  }, [url]);

  if (failed) {
    return (
      <iframe src={url} title={title} className="min-h-0 w-full flex-1 border-0 bg-[#525659]" />
    );
  }

  return (
    <div
      role="document"
      aria-label={title}
      tabIndex={0}
      className="min-h-0 w-full flex-1 overflow-y-auto bg-[#525659] p-3 outline-none sm:p-6"
    >
      <div ref={pagesRef} className="flex flex-col gap-4" />
    </div>
  );
}
