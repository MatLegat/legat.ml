import type { ReactNode } from "react";
import { StaticOutput, type Segment } from "@/components/Typewriter";

export type ThemeName = "green" | "amber" | "solarized" | "solarized-light";
export const THEMES: ThemeName[] = ["green", "amber", "solarized", "solarized-light"];

export type Block = {
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

export const FAST = 600;
const MED = 220;

export const blocks: Block[] = [
  {
    id: "whoami",
    command: [{ text: "whoami" }],
    cmdSpeed: 20,
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
    cmdSpeed: 20,
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
    cmdSpeed: 20,
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
    cmdSpeed: 20,
    output: [{ text: "\n" }, ...experienceOutput()],
  },
  {
    id: "edu",
    command: [{ text: "cat education.txt" }],
    cmdSpeed: 20,
    output: [
      { text: "\n" },
      { text: "[2014–2018] ", className: "text-term-yellow", speed: FAST },
      { text: "Bachelor in Computer Science\n", speed: FAST },
      {
        text: "            Federal University of Santa Catarina — UFSC\n",
        className: "text-term-dim",
        speed: FAST,
      },
    ],
  },
  {
    id: "contact",
    command: [{ text: "./contact.sh" }],
    cmdSpeed: 20,
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
      bullets: ["Social crowdfunding platform", "Ruby on Rails, Mithril.js, PostgreSQL APIs"],
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
      segs.push({ text: `        └─ ${b}\n`, speed: FAST });
    }
    segs.push({ text: "\n" });
  }
  return segs;
}

export function commandText(block: Block) {
  return block.command.map((s) => s.text).join("");
}

export type CommandResult = {
  /** what to print under the command; null prints nothing */
  output: ReactNode;
  /** `clear`: wipe the screen instead of printing */
  clear?: boolean;
  /** `theme <name>`: switch to this theme */
  theme?: ThemeName;
};

function error(message: ReactNode): CommandResult {
  return { output: <div className="text-sm text-term-red">{message}</div> };
}

function block(index: number): CommandResult {
  return { output: <StaticOutput segments={blocks[index].output} /> };
}

export function runCommand(raw: string, currentTheme: ThemeName): CommandResult {
  const cmd = raw.trim();
  if (!cmd) return { output: null };
  const [name, ...args] = cmd.split(/\s+/);

  // Commands typed in the intro (e.g. `cat education.txt`, `./contact.sh`) print their block
  const normalized = [name, ...args].join(" ");
  const scripted = blocks.findIndex((b) => commandText(b) === normalized);
  if (scripted !== -1) return block(scripted);

  switch (name) {
    case "help":
      return {
        output: (
          <div className="text-sm">
            <div>
              <span className="text-term-yellow">help</span> list commands
            </div>
            <div>
              <span className="text-term-yellow">theme</span>{" "}
              <span className="text-term-dim">&lt;name&gt;</span> palette:{" "}
              <span className="text-term-green">green</span> ·{" "}
              <span className="text-term-yellow">amber</span> ·{" "}
              <span className="text-term-cyan">solarized</span> ·{" "}
              <span className="text-term-magenta">solarized-light</span>
            </div>
            <div>
              <span className="text-term-yellow">theme</span> show current theme
            </div>
            <div>
              <span className="text-term-yellow">whoami</span> ·{" "}
              <span className="text-term-yellow">about</span> ·{" "}
              <span className="text-term-yellow">skills</span> ·{" "}
              <span className="text-term-yellow">experience</span> ·{" "}
              <span className="text-term-yellow">education</span> ·{" "}
              <span className="text-term-yellow">contact</span>
            </div>
            <div className="text-term-dim">
              commands from the intro work too, e.g.{" "}
              <span className="text-term-yellow">cat education.txt</span> ·{" "}
              <span className="text-term-yellow">./contact.sh</span>
            </div>
            <div>
              <span className="text-term-yellow">clear</span> clear the screen
            </div>
          </div>
        ),
      };
    case "theme": {
      if (args.length === 0) {
        return {
          output: (
            <div className="text-sm">
              <div>
                current theme: <span className="text-term-yellow">{currentTheme}</span>
              </div>
              <div className="text-term-dim">
                available: green · amber · solarized · solarized-light
              </div>
            </div>
          ),
        };
      }
      const t = args[0].toLowerCase() as ThemeName;
      if (!THEMES.includes(t)) {
        return error(
          <>
            theme: unknown palette &apos;{args[0]}&apos; — try green, amber, solarized, or
            solarized-light
          </>,
        );
      }
      return {
        theme: t,
        output: (
          <div className="text-sm">
            <span className="text-term-green">✓</span> theme switched to{" "}
            <span className="text-term-yellow">{t}</span>
          </div>
        ),
      };
    }
    case "clear":
    case "cls":
      return { output: null, clear: true };
    case "whoami":
      return block(0);
    case "cat":
      if (args[0]?.replace(/^\.\//, "") === "contact.sh") {
        return {
          output: (
            <div className="text-sm">
              <div className="text-term-red">cat: {args[0]}: Permission denied</div>
              <div className="text-term-dim">
                it&apos;s execute-only — try <span className="text-term-yellow">./contact.sh</span>
              </div>
            </div>
          ),
        };
      }
      if (args.length > 0) return error(<>cat: {args[0]}: No such file or directory</>);
      return block(1);
    case "about":
      return block(1);
    case "skills":
      return block(2);
    case "ls": {
      const path = args.find((a) => !a.startsWith("-")) ?? ".";
      const dir = path.replace(/^\.\//, "").replace(/\/+$/, "");
      if (dir === "" || dir === "." || dir === "~") {
        return {
          output: (
            <div>
              <span>about.md </span>
              <span className="text-term-green">contact.sh* </span>
              <span>education.txt </span>
              <span className="text-term-cyan">skills/</span>
            </div>
          ),
        };
      }
      if (dir === "skills") return block(2);
      return error(<>ls: cannot access &apos;{path}&apos;: No such file or directory</>);
    }
    case "experience":
    case "git":
      return block(3);
    case "education":
      return block(4);
    case "contact":
      return block(5);
    default:
      return error(
        <>
          command not found: {name} — type <span className="text-term-yellow">help</span>
        </>,
      );
  }
}

/** Adds a submitted command to the ↑/↓ history, skipping blanks and repeats of the last one. */
export function addToHistory(list: string[], raw: string): string[] {
  const cmd = raw.trim();
  if (!cmd || list.at(-1) === cmd) return list;
  return [...list, cmd];
}

export type HistoryNav = {
  /** position in the history list; null while editing a new line */
  index: number | null;
  /** the unsent line, restored when stepping past the newest entry */
  draft: string;
};

/** Moves through command history like a shell's ↑/↓. Returns null when nothing changes. */
export function navigateHistory(
  list: string[],
  nav: HistoryNav,
  input: string,
  direction: "up" | "down",
): (HistoryNav & { value: string }) | null {
  if (direction === "up") {
    if (list.length === 0) return null;
    const index = nav.index === null ? list.length - 1 : Math.max(0, nav.index - 1);
    const draft = nav.index === null ? input : nav.draft;
    return { index, draft, value: list[index] };
  }
  if (nav.index === null) return null;
  if (nav.index + 1 >= list.length) return { index: null, draft: nav.draft, value: nav.draft };
  return { index: nav.index + 1, draft: nav.draft, value: list[nav.index + 1] };
}
