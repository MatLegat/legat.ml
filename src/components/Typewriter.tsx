import { useEffect, useState, type ReactNode } from "react";

export type Segment = {
  text: string;
  className?: string;
  /** chars per second override */
  speed?: number;
  /** delay (ms) before this segment starts typing */
  delay?: number;
  /** render text but don't animate */
  instant?: boolean;
  /** render as a link */
  href?: string;
};

function SegmentText({ seg, text }: { seg: Segment; text: string }) {
  const style = { whiteSpace: "pre-wrap" } as const;
  if (seg.href) {
    return (
      <a
        href={seg.href}
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
  className?: string;
  /** content rendered after typing completes */
  trailing?: ReactNode;
};

export function Typewriter({
  segments,
  speed = 90,
  cursor = true,
  onDone,
  start = true,
  className,
  trailing,
}: Props) {
  const [segIndex, setSegIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start || done) return;
    if (segIndex >= segments.length) {
      setDone(true);
      onDone?.();
      return;
    }
    const seg = segments[segIndex];
    const charSpeed = 1000 / (seg.speed ?? speed);

    if (charIndex === 0 && seg.delay) {
      const t = setTimeout(() => setCharIndex(1), seg.delay);
      return () => clearTimeout(t);
    }

    if (seg.instant) {
      setSegIndex((s) => s + 1);
      setCharIndex(0);
      return;
    }

    if (charIndex >= seg.text.length) {
      setSegIndex((s) => s + 1);
      setCharIndex(0);
      return;
    }

    const t = setTimeout(() => setCharIndex((c) => c + 1), charSpeed);
    return () => clearTimeout(t);
  }, [start, segIndex, charIndex, done, segments, speed, onDone]);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        let visible = "";
        if (i < segIndex) visible = seg.text;
        else if (i === segIndex) visible = seg.text.slice(0, charIndex);
        if (!visible) return null;
        return <SegmentText key={i} seg={seg} text={visible} />;
      })}
      {cursor && !done && <span className="cursor-block" aria-hidden />}
      {done && trailing}
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
