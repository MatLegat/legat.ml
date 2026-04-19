import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Typewriter, type Segment } from "@/components/Typewriter";

type ThemeName = "green" | "amber" | "solarized";
const THEME_CLASS: Record<ThemeName, string> = {
  green: "",
  amber: "theme-amber",
  solarized: "theme-solarized",
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "matteus@legat:~ — Full Stack Developer" },
      {
        name: "description",
        content:
          "Terminal-style CV of Matteus Legat — full-stack web developer with 10+ years building scalable web apps with React, Next.js, and Node.js.",
      },
      { property: "og:title", content: "matteus@legat:~ — Full Stack Developer" },
      {
        property: "og:description",
        content: "10+ years building scalable web apps with React, Next.js, and Node.js.",
      },
    ],
  }),
});

const PROMPT = (
  <>
    <span className="text-term-green">matteus@legat</span>
    <span className="text-term-dim">:</span>
    <span className="text-term-cyan">~</span>
    <span className="text-term-dim">$ </span>
  </>
);

type Block = {
  id: string;
  /** the command typed after the prompt */
  command: Segment[];
  /** output rendered after command finishes */
  output: Segment[];
  /** speed for command typing */
  cmdSpeed?: number;
  /** speed for output typing */
  outSpeed?: number;
};

const FAST = 600;
const MED = 220;

const blocks: Block[] = [
  {
    id: "whoami",
    command: [{ text: "whoami" }],
    cmdSpeed: 28,
    output: [
      { text: "\n" },
      { text: "Matteus Legat", className: "text-term-yellow crt-glow", speed: FAST },
      { text: "\n" },
      { text: "Full Stack Web Developer · Florianópolis, BR\n", className: "text-term-dim" },
      { text: "matteus@legat.ml\n", className: "text-term-cyan" },
    ],
  },
  {
    id: "cat",
    command: [{ text: "cat about.md" }],
    cmdSpeed: 28,
    output: [
      { text: "\n" },
      { text: "# About\n", className: "text-term-magenta", speed: FAST },
      {
        text:
          "Full-stack web developer with 10+ years building and maintaining scalable\n" +
          "web applications across ecommerce, enterprise, and platform-based products.\n" +
          "Strong focus on modern frontend (React, Next.js) with solid backend chops\n" +
          "in Node.js. Production-ready solutions, architecture decisions, cross-team\n" +
          "collaboration.\n",
        speed: FAST,
      },
    ],
  },
  {
    id: "skills",
    command: [{ text: "ls ./skills" }],
    cmdSpeed: 28,
    output: [
      { text: "\n" },
      { text: "frontend/  ", className: "text-term-cyan", speed: FAST },
      { text: "backend/   ", className: "text-term-cyan", speed: FAST },
      { text: "testing/   ", className: "text-term-cyan", speed: FAST },
      { text: "tools/\n\n", className: "text-term-cyan", speed: FAST },
      { text: "frontend  → ", className: "text-term-yellow", speed: FAST },
      { text: "Next.js, React, Vue.js, Tailwind CSS, SASS, Emotion CSS\n", speed: FAST },
      { text: "backend   → ", className: "text-term-yellow", speed: FAST },
      { text: "Node.js, Express, Elysia, Ruby on Rails, PHP\n", speed: FAST },
      { text: "testing   → ", className: "text-term-yellow", speed: FAST },
      { text: "Vitest, Jest, Jasmine\n", speed: FAST },
      { text: "tools     → ", className: "text-term-yellow", speed: FAST },
      { text: "Git, REST APIs, Bash, MeshCentral, CI/CD, Vercel, GCP\n", speed: FAST },
    ],
  },
  {
    id: "exp",
    command: [{ text: "git log --oneline experience" }],
    cmdSpeed: 24,
    output: [
      { text: "\n" },
      ...experienceOutput(),
    ],
  },
  {
    id: "edu",
    command: [{ text: "cat education.txt" }],
    cmdSpeed: 28,
    output: [
      { text: "\n" },
      { text: "[2014–2018] ", className: "text-term-yellow", speed: FAST },
      { text: "Bachelor in Computer Science\n", speed: FAST },
      { text: "            Federal University of Santa Catarina — UFSC\n", className: "text-term-dim", speed: FAST },
    ],
  },
  {
    id: "contact",
    command: [{ text: "./contact.sh" }],
    cmdSpeed: 28,
    output: [
      { text: "\n" },
      { text: "> ", className: "text-term-green", speed: MED },
      { text: "Booting contact channel...\n", className: "text-term-dim", speed: MED },
      { text: "> ", className: "text-term-green", speed: MED },
      { text: "Channel ready.\n\n", className: "text-term-dim", speed: MED },
      { text: "  email   ", className: "text-term-yellow", speed: FAST },
      { text: "matteus@legat.ml\n", className: "text-term-cyan", speed: FAST },
      { text: "  status  ", className: "text-term-yellow", speed: FAST },
      { text: "open to opportunities\n", className: "text-term-green", speed: FAST },
    ],
  },
];

function experienceOutput(): Segment[] {
  const jobs = [
    {
      hash: "a1f0c2e",
      period: "2020–now",
      role: "Full Stack Developer",
      company: "Binamik Tecnologia",
      bullets: [
        "Tourism ecosystem: white-label ecommerce, kiosks, payments/booking",
        "Scalable React + Next.js frontends, Node/Express integrations",
        "Testing & code quality with Jest; cross-team product/design work",
      ],
    },
    {
      hash: "9d3b71a",
      period: "2018–2020",
      role: "Front End Developer",
      company: "Valtech Brazil",
      bullets: [
        "Enterprise web apps with Vue.js + SASS",
        "Clients: Bayer, L'Oréal, Sam's Club",
        "Responsive, accessible, component-based systems · agile teams",
      ],
    },
    {
      hash: "5cc04e8",
      period: "2018–2019",
      role: "Full-Stack Web Developer (Part-time)",
      company: "Incentiv.me",
      bullets: [
        "Social crowdfunding platform",
        "Ruby on Rails, Mithril.js, PostgreSQL APIs",
      ],
    },
    {
      hash: "27ab9d1",
      period: "2017–2018",
      role: "C++ / IoT Trainee",
      company: "LabSEC — UFSC",
      bullets: [
        "Modernized restaurant access control systems",
        "RFID, secure gateways, embedded C++ + Node.js",
      ],
    },
    {
      hash: "0001a3f",
      period: "2015–2017",
      role: "Full-Stack Trainee",
      company: "LabSEC — UFSC",
      bullets: [
        "Public Key Infrastructure platform (ICPEdu — RNP)",
        "Digital certificate issuance · PHP (Zend) + JavaScript",
      ],
    },
  ];

  const segs: Segment[] = [];
  for (const j of jobs) {
    segs.push({ text: j.hash + " ", className: "text-term-magenta", speed: FAST });
    segs.push({ text: `(${j.period}) `, className: "text-term-dim", speed: FAST });
    segs.push({ text: j.role, className: "text-term-yellow", speed: FAST });
    segs.push({ text: ` @ ${j.company}\n`, className: "text-term-cyan", speed: FAST });
    for (const b of j.bullets) {
      segs.push({ text: `         └─ ${b}\n`, speed: FAST });
    }
    segs.push({ text: "\n" });
  }
  return segs;
}

type HistoryEntry = { id: number; cmd: string; output: ReactNode };

function Index() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [cmdDone, setCmdDone] = useState<boolean[]>(() => blocks.map(() => false));
  const [outDone, setOutDone] = useState<boolean[]>(() => blocks.map(() => false));
  const [skipped, setSkipped] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("green");
  const [showBanner, setShowBanner] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyId = useRef(0);
  const allDoneRef = useRef(false);

  // auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activeIdx, cmdDone, outDone, history, theme]);

  // skip intro on key
  useEffect(() => {
    const skip = (e: KeyboardEvent) => {
      if (allDoneRef.current) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        setSkipped(true);
      }
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);

  const allDone = activeIdx >= blocks.length;
  allDoneRef.current = allDone;

  useEffect(() => {
    if (skipped) {
      setActiveIdx(blocks.length);
      setCmdDone(blocks.map(() => true));
      setOutDone(blocks.map(() => true));
    }
  }, [skipped]);

  useEffect(() => {
    if (allDone) inputRef.current?.focus();
  }, [allDone]);

  function pushHistory(cmd: string, output: ReactNode) {
    historyId.current += 1;
    setHistory((h) => [...h, { id: historyId.current, cmd, output }]);
  }

  function runCommand(raw: string) {
    const cmd = raw.trim();
    if (!cmd) {
      pushHistory("", null);
      return;
    }
    const [name, ...args] = cmd.split(/\s+/);

    switch (name) {
      case "help":
        pushHistory(
          cmd,
          <div className="text-sm">
            <div><span className="text-term-yellow">help</span>                    list commands</div>
            <div><span className="text-term-yellow">theme</span> <span className="text-term-dim">&lt;name&gt;</span>           palette: <span className="text-term-green">green</span> · <span className="text-term-yellow">amber</span> · <span className="text-term-cyan">solarized</span></div>
            <div><span className="text-term-yellow">theme</span>                   show current theme</div>
            <div><span className="text-term-yellow">whoami</span> · <span className="text-term-yellow">about</span> · <span className="text-term-yellow">skills</span> · <span className="text-term-yellow">experience</span> · <span className="text-term-yellow">education</span> · <span className="text-term-yellow">contact</span></div>
            <div><span className="text-term-yellow">clear</span>                   clear the screen</div>
          </div>,
        );
        break;
      case "theme": {
        if (args.length === 0) {
          pushHistory(
            cmd,
            <div className="text-sm">
              <div>current theme: <span className="text-term-yellow">{theme}</span></div>
              <div className="text-term-dim">available: green · amber · solarized</div>
            </div>,
          );
          break;
        }
        const t = args[0].toLowerCase() as ThemeName;
        if (t === "green" || t === "amber" || t === "solarized") {
          setTheme(t);
          pushHistory(
            cmd,
            <div className="text-sm">
              <span className="text-term-green">✓</span> theme switched to{" "}
              <span className="text-term-yellow">{t}</span>
            </div>,
          );
        } else {
          pushHistory(
            cmd,
            <div className="text-sm text-term-red">
              theme: unknown palette '{args[0]}' — try green, amber, or solarized
            </div>,
          );
        }
        break;
      }
      case "clear":
      case "cls":
        setHistory([]);
        setShowBanner(false);
        setShowIntro(false);
        break;
      case "whoami":
        pushHistory(cmd, <StaticOutput segments={blocks[0].output} />);
        break;
      case "about":
      case "cat":
        pushHistory(cmd, <StaticOutput segments={blocks[1].output} />);
        break;
      case "skills":
      case "ls":
        pushHistory(cmd, <StaticOutput segments={blocks[2].output} />);
        break;
      case "experience":
      case "git":
        pushHistory(cmd, <StaticOutput segments={blocks[3].output} />);
        break;
      case "education":
        pushHistory(cmd, <StaticOutput segments={blocks[4].output} />);
        break;
      case "contact":
        pushHistory(cmd, <StaticOutput segments={blocks[5].output} />);
        break;
      default:
        pushHistory(
          cmd,
          <div className="text-sm text-term-red">
            command not found: {name} — type{" "}
            <span className="text-term-yellow">help</span>
          </div>,
        );
    }
  }

  return (
    <div
      className={`min-h-screen bg-background text-foreground p-3 sm:p-6 md:p-10 ${THEME_CLASS[theme]}`}
    >
      <div
        className="mx-auto max-w-5xl rounded-md border border-border shadow-2xl overflow-hidden scanlines"
        style={{ backgroundColor: "var(--terminal-bg)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-border"
          style={{ backgroundColor: "var(--terminal-header)" }}
        >
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[oklch(0.65_0.2_25)]" />
            <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_85)]" />
            <span className="h-3 w-3 rounded-full bg-[oklch(0.72_0.16_145)]" />
          </div>
          <div className="text-xs text-term-dim">— matteus@legat: ~/cv —</div>
          <div className="text-xs text-term-dim hidden sm:block">{theme}</div>
        </div>

        <div
          ref={scrollRef}
          onClick={() => {
            if (!allDone) setSkipped(true);
            else inputRef.current?.focus();
          }}
          className="relative z-0 p-4 sm:p-6 md:p-8 text-sm sm:text-[15px] leading-relaxed max-h-[80vh] overflow-y-auto crt-glow"
        >
          {showBanner && (
            <pre
              className="whitespace-pre-wrap m-0 mb-4 text-xs sm:text-sm"
              style={{ color: "var(--term-prompt)" }}
            >
{`  __  __       _   _                    _                  _   
 |  \\/  | __ _| |_| |_ ___ _   _ ___   | |    ___  __ _ __| |_ 
 | |\\/| |/ _\` | __| __/ _ \\ | | / __|  | |   / _ \\/ _\` |/ _\` __|
 | |  | | (_| | |_| ||  __/ |_| \\__ \\  | |__|  __/ (_| | (_| |_ 
 |_|  |_|\\__,_|\\__|\\__\\___|\\__,_|___/  |_____\\___|\\__, |\\__,_\\_|
                                                  |___/        `}
            </pre>
          )}
          {showIntro && (
            <div className="text-term-dim mb-6 text-xs">
              // press enter/space to skip · type{" "}
              <span className="text-term-yellow">help</span> when prompt appears
            </div>
          )}

          {blocks.map((b, i) => {
            if (i > activeIdx) return null;
            const isActive = i === activeIdx;
            return (
              <div key={b.id} className="mb-6">
                <div>
                  <Prompt />
                  <Typewriter
                    segments={b.command}
                    speed={b.cmdSpeed ?? 28}
                    cursor={isActive && !cmdDone[i]}
                    start={i === activeIdx}
                    onDone={() =>
                      setCmdDone((prev) => {
                        if (prev[i]) return prev;
                        const next = [...prev];
                        next[i] = true;
                        return next;
                      })
                    }
                  />
                </div>
                {(cmdDone[i] || !isActive) && (
                  <div>
                    <Typewriter
                      segments={b.output}
                      speed={b.outSpeed ?? FAST}
                      cursor={isActive && !outDone[i]}
                      start={cmdDone[i]}
                      onDone={() => {
                        setOutDone((prev) => {
                          if (prev[i]) return prev;
                          const next = [...prev];
                          next[i] = true;
                          return next;
                        });
                        setActiveIdx((idx) => Math.max(idx, i + 1));
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {history.map((h) => (
            <div key={h.id} className="mb-4">
              <div>
                <Prompt />
                <span>{h.cmd}</span>
              </div>
              {h.output && <div className="mt-1">{h.output}</div>}
            </div>
          ))}

          {allDone && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runCommand(input);
                setInput("");
              }}
              className="flex items-center"
            >
              <Prompt />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                aria-label="terminal input"
                className="flex-1 bg-transparent outline-none border-none caret-transparent text-foreground"
              />
              <span className="cursor-block" aria-hidden />
            </form>
          )}
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-5xl text-center text-xs text-term-dim">
        matteus@legat.ml · theme: {theme} · {new Date().getFullYear()}
      </p>
    </div>
  );
}

function Prompt() {
  return (
    <>
      <span style={{ color: "var(--term-prompt)" }}>matteus@legat</span>
      <span className="text-term-dim">:</span>
      <span className="text-term-cyan">~</span>
      <span className="text-term-dim">$ </span>
    </>
  );
}

function StaticOutput({ segments }: { segments: Segment[] }) {
  return (
    <span>
      {segments.map((s, i) => (
        <span key={i} className={s.className} style={{ whiteSpace: "pre-wrap" }}>
          {s.text}
        </span>
      ))}
    </span>
  );
}
