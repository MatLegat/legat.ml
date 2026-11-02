// The CV itself: what the intro types out, and what the commands and files show.

import cvPdfUrl from "@/assets/CV_MatteusLegat.pdf?url";
import type { Segment } from "@/components/Typewriter";

export type Block = {
  id: string;
  /** the command typed after the prompt */
  command: Segment[];
  /** output rendered after command finishes */
  output: Segment[];
};

// Typing speeds of the intro, in characters per second
export const COMMAND_SPEED = 20;
export const FAST = 600;
const MED = 220;

export const SKILLS = [
  ["frontend", "TypeScript, Next.js, React, Vue.js, Tailwind CSS, SASS, Emotion CSS"],
  ["backend", "Node.js, Express, Elysia, Ruby on Rails, PHP"],
  ["testing", "Vitest, Jest, Jasmine"],
  ["tools", "Git, REST APIs, Bash, MeshCentral, CI/CD, Vercel, GCP"],
] as const;

// [label, text shown, link] for the contact block
export const CONTACTS = [
  ["email", "matteus@legat.ml", "mailto:matteus@legat.ml"],
  ["github", "github.com/matlegat", "https://github.com/matlegat"],
  ["linkedin", "linkedin.com/in/matlegat", "https://www.linkedin.com/in/matlegat/"],
  ["cv", "CV_MatteusLegat.pdf", cvPdfUrl],
] as const;

export const blocks: Block[] = [
  {
    id: "whoami",
    command: [{ text: "whoami" }],
    output: [
      { text: "\n" },
      { text: "Matteus Legat", className: "text-term-yellow crt-glow", speed: FAST },
      { text: "\n" },
      { text: "Full Stack Web Developer · Florianópolis, BR\n", className: "text-term-dim" },
      { text: "matteus@legat.ml", className: "text-term-cyan", href: "mailto:matteus@legat.ml" },
      { text: "\n" },
    ],
  },
  {
    id: "about",
    command: [{ text: "cat about.md" }],
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
    output: skillsOutput(),
  },
  {
    id: "experience",
    command: [{ text: "git log --oneline experience" }],
    output: [{ text: "\n" }, ...experienceOutput()],
  },
  {
    id: "education",
    command: [{ text: "cat education.txt" }],
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
    output: [
      { text: "\n" },
      { text: "> ", className: "text-term-green", speed: MED },
      { text: "Booting contact channel...\n", className: "text-term-dim", speed: MED },
      { text: "> ", className: "text-term-green", speed: MED },
      { text: "Channel ready.\n\n", className: "text-term-dim", speed: MED },
      ...CONTACTS.flatMap(([label, text, href]): Segment[] => [
        { text: `  ${label.padEnd(9)} `, className: "text-term-yellow", speed: FAST },
        { text, className: "text-term-cyan", speed: FAST, href },
        { text: "\n" },
      ]),
      { text: "  status    ", className: "text-term-yellow", speed: FAST },
      { text: "open to opportunities\n", className: "text-term-green", speed: FAST },
    ],
  },
];

function skillsOutput(): Segment[] {
  const segs: Segment[] = [{ text: "\n" }];
  SKILLS.forEach(([name], i) => {
    const last = i === SKILLS.length - 1;
    const text = last ? `${name}/\n\n` : `${name}/`.padEnd(11);
    segs.push({ text, className: "text-term-cyan", speed: FAST });
  });
  for (const [name, techs] of SKILLS) {
    segs.push({ text: `${name.padEnd(10)}→ `, className: "text-term-yellow", speed: FAST });
    segs.push({ text: `${techs}\n`, speed: FAST });
  }
  return segs;
}

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

/** The output of the intro block with this id. */
export function blockOutput(id: string) {
  return blocks.find((b) => b.id === id)!.output;
}
