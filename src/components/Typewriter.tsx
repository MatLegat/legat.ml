import { useEffect, useRef, useState } from "react";

export type Segment = {
  text: string;
  className?: string;
  /** chars per second override */
  speed?: number;
  /** render as a link */
  href?: string;
};

function SegmentText({ seg, text }: { seg: Segment; text: string }) {
  const style = { whiteSpace: "pre-wrap" } as const;
  if (seg.href) {
    // Everything but email opens in a new tab, so the terminal session isn't lost
    const newTab = !seg.href.startsWith("mailto:");
    return (
      <a
        href={seg.href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        className={`${seg.className ?? ""} underline-offset-4 hover:underline`}
        style={style}
      >
        {text}
      </a>
    );
  }
  return (
    <span className={seg.className} style={style}>
      {text}
    </span>
  );
}

type Props = {
  segments: Segment[];
  /** default chars per second */
  speed?: number;
  /** show blinking cursor at the end while/after typing */
  cursor?: boolean;
  /** called when fully done */
  onDone?: () => void;
  /** start typing only when true */
  start?: boolean;
};

/** Moves past finished and empty segments to the next character to type. */
function settle(segments: Segment[], segIndex: number, charIndex: number) {
  while (segIndex < segments.length && charIndex >= segments[segIndex].text.length) {
    segIndex += 1;
    charIndex = 0;
  }
  return { segIndex, charIndex };
}

export function Typewriter({ segments, speed = 90, cursor = true, onDone, start = true }: Props) {
  // Position of the next character to type. It always points at a character still to be
  // typed, or past the last segment once everything is shown.
  const [{ segIndex, charIndex }, setPosition] = useState(() => settle(segments, 0, 0));
  const done = segIndex >= segments.length;

  // Report completion once
  const reported = useRef(false);
  useEffect(() => {
    if (!start || !done || reported.current) return;
    reported.current = true;
    onDone?.();
  }, [start, done, onDone]);

  // Type the next character at this segment's speed
  useEffect(() => {
    if (!start || done) return;
    const seg = segments[segIndex];
    const wait = 1000 / (seg.speed ?? speed);
    const t = setTimeout(() => setPosition(settle(segments, segIndex, charIndex + 1)), wait);
    return () => clearTimeout(t);
  }, [start, done, segments, segIndex, charIndex, speed]);

  return (
    <span>
      {segments.map((seg, i) => {
        let visible = "";
        if (i < segIndex) visible = seg.text;
        else if (i === segIndex) visible = seg.text.slice(0, charIndex);
        if (!visible) return null;
        return <SegmentText key={i} seg={seg} text={visible} />;
      })}
      {cursor && !done && <span className="cursor-block" aria-hidden />}
    </span>
  );
}

/** Renders segments fully, without typing. */
export function StaticOutput({ segments }: { segments: Segment[] }) {
  return (
    <span>
      {segments.map((s, i) => (
        <SegmentText key={i} seg={s} text={s.text} />
      ))}
    </span>
  );
}
