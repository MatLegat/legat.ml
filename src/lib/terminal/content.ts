// The CV itself: what the intro types out, and what the commands and files show.

import cvPdfUrl from "@/assets/Matteus_Legat_CV.pdf?url";
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
  ["frontend", "TypeScript, Next.js, React, Zustand, Vue.js, Tailwind CSS, SASS, Emotion CSS"],
  ["backend", "Node.js, Express, Elysia, Ruby on Rails, PHP"],
  ["data", "PostgreSQL, Drizzle"],
  ["testing", "Vitest, Jest, Jasmine"],
  ["tools", "Git, REST APIs, Bash, MeshCentral, CI/CD (GitHub Actions, CircleCI), Vercel, GCP"],
] as const;

// [label, text shown, link] for the contact block
export const CONTACTS = [
  ["email", "matteus@legat.ml", "mailto:matteus@legat.ml"],
  ["github", "github.com/matlegat", "https://github.com/matlegat"],
  ["linkedin", "linkedin.com/in/matlegat", "https://www.linkedin.com/in/matlegat/"],
  ["cv", "Matteus_Legat_CV.pdf", cvPdfUrl],
] as const;

export const LANGUAGES = "English: C1 · Portuguese: Native";
export const STATUS = "Open to remote frontend and full-stack opportunities · UTC−3";

export const blocks: Block[] = [
  {
    id: "whoami",
    command: [{ text: "whoami" }],
    output: [
      { text: "\n" },
      { text: "Matteus Legat", className: "text-term-yellow crt-glow", speed: FAST },
      { text: "\n" },
      {
        text: "Senior Full Stack Engineer (Frontend-focused) · Florianópolis, BR\n",
        className: "text-term-dim",
      },
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
          "Frontend-focused full-stack engineer with 10+ years of experience\n" +
          "building ecommerce platforms and enterprise applications.\n" +
          "Combines interface design with React, Next.js, TypeScript and Node.js\n" +
          "development to deliver booking systems, payment flows, dashboards\n" +
          "and self-service kiosks.\n",
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
      { text: "Bachelor’s degree in Computer Science\n", speed: FAST },
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
      { text: "  languages ", className: "text-term-yellow", speed: FAST },
      { text: `${LANGUAGES}\n`, speed: FAST },
      { text: "  status    ", className: "text-term-yellow", speed: FAST },
      { text: `${STATUS}\n`, className: "text-term-green", speed: FAST },
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
      role: "Senior Full Stack Engineer",
      company: "Binamik Tecnologia",
      bullets: [
        "Tourism ecommerce, booking systems and self-service kiosks",
        "Designed and built React/Next.js checkout with Pix and card payments",
        "Payment gateway integrations and Twilio booking notifications",
        "Ecommerce dashboards with TypeScript, Node.js, Elysia and Drizzle",
        "Kiosk fleet management with MeshCentral",
        "CI/CD with GitHub Actions and CircleCI; GCP, Vercel and DB migrations",
        "Video-enabled product cards: UI, storage, compression and delivery",
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
      role: "Research Trainee · C++ / IoT",
      company: "LabSEC — UFSC",
      bullets: [
        "Modernized restaurant access control systems",
        "RFID, secure gateways, embedded C++ + Node.js",
      ],
    },
    {
      hash: "0001a3f",
      period: "2015–2017",
      role: "Research Trainee · Full Stack",
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
