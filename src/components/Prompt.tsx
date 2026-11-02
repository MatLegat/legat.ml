/**
 * The shell prompt, `matteus@legat:~$`. Hidden from screen readers: repeating it before every
 * line is noise.
 */
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
