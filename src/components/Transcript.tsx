import { useEffect, useRef, useState } from "react";
import { StaticOutput, Typewriter } from "@/components/Typewriter";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { blocks as introBlocks, COMMAND_SPEED, FAST, type Block } from "@/lib/terminal/content";

// Hidden from screen readers: repeating "matteus@legat:~$" before every line is noise
export function Prompt({ path = "~" }: { path?: string }) {
  return (
    <span aria-hidden="true">
      <span style={{ color: "var(--term-prompt)" }}>matteus@legat</span>
      <span className="text-term-dim">:</span>
      <span className="text-term-cyan">{path}</span>
      <span className="text-term-dim">$ </span>
    </span>
  );
}

export function StaticBlock({ block }: { block: Block }) {
  return (
    <div className="mb-6">
      <div>
        <Prompt />
        <StaticOutput segments={block.command} />
      </div>
      <div>
        <StaticOutput segments={block.output} />
      </div>
    </div>
  );
}

type TranscriptProps = {
  blocks: Block[];
  /** show everything at once instead of typing */
  skipped: boolean;
  /** called once, when typing finishes or is skipped */
  onDone?: () => void;
};

/**
 * Commands and their output typed out one after another, like a terminal session.
 * A plain copy is always there for screen readers (and the server HTML); it takes the
 * typed copy's place once typing finishes or is skipped.
 */
export function Transcript({ blocks, skipped, onDone }: TranscriptProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [cmdDone, setCmdDone] = useState<boolean[]>(() => blocks.map(() => false));
  const [outDone, setOutDone] = useState<boolean[]>(() => blocks.map(() => false));
  const finished = skipped || activeIdx >= blocks.length;

  const reported = useRef(false);
  useEffect(() => {
    if (!finished || reported.current) return;
    reported.current = true;
    onDone?.();
  }, [finished, onDone]);

  const markDone = (setter: typeof setCmdDone, i: number) =>
    setter((prev) => {
      if (prev[i]) return prev;
      const next = [...prev];
      next[i] = true;
      return next;
    });

  return (
    <>
      <div className={finished ? "transcript-plain" : "transcript-plain sr-only"}>
        {blocks.map((b) => (
          <StaticBlock key={b.id} block={b} />
        ))}
      </div>

      {!finished && (
        <div aria-hidden="true">
          {blocks.map((b, i) => {
            if (i > activeIdx) return null;
            const isActive = i === activeIdx;
            return (
              <div key={b.id} className="mb-6">
                <div>
                  <Prompt />
                  <Typewriter
                    segments={b.command}
                    speed={COMMAND_SPEED}
                    cursor={isActive && !cmdDone[i]}
                    start={isActive}
                    onDone={() => markDone(setCmdDone, i)}
                  />
                </div>
                {(cmdDone[i] || !isActive) && (
                  <div>
                    <Typewriter
                      segments={b.output}
                      speed={FAST}
                      cursor={isActive && !outDone[i]}
                      start={cmdDone[i]}
                      onDone={() => {
                        markDone(setOutDone, i);
                        setActiveIdx((idx) => Math.max(idx, i + 1));
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * The `replay` command: the intro typed out again. Enter, Space, Escape or a click shows it
 * all at once, like skipping the intro.
 */
export function Replay({ onDone }: { onDone: () => void }) {
  const reducedMotion = useReducedMotion();
  const [skipped, setSkipped] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, [contenteditable]")) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        // Keeps the key from reaching the prompt once it's back (see the intro's skip)
        e.preventDefault();
        setSkipped(true);
      }
    };
    // Clicks in the terminal skip it; clicks elsewhere (dock, browser) don't
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest(".terminal-shell")) setSkipped(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [finished]);

  return (
    <Transcript
      blocks={introBlocks}
      skipped={skipped || reducedMotion}
      onDone={() => {
        setFinished(true);
        onDone();
      }}
    />
  );
}
