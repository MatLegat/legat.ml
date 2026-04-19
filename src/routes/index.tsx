import { createFileRoute } from "@tanstack/react-router";
import portrait from "@/assets/matteus-portrait.png";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Matteus Legat — Full Stack Web Developer" },
      {
        name: "description",
        content:
          "Full-stack web developer with 10+ years building scalable web applications across ecommerce, enterprise, and platform-based products.",
      },
      { property: "og:title", content: "Matteus Legat — Full Stack Web Developer" },
      {
        property: "og:description",
        content: "10+ years crafting scalable web applications with React, Next.js, and Node.js.",
      },
    ],
  }),
});

const skills = {
  Frontend: ["Next.js", "React", "Vue.js", "Tailwind CSS", "SASS", "Emotion CSS"],
  Backend: ["Node.js", "Express", "Elysia", "Ruby on Rails", "PHP"],
  Testing: ["Vitest", "Jest", "Jasmine"],
  Tools: ["Git", "REST APIs", "Bash", "MeshCentral", "CI/CD", "Vercel", "GCP"],
};

const experience = [
  {
    period: "2020 — Present",
    role: "Full Stack Developer",
    company: "Binamik Tecnologia",
    bullets: [
      "Develop and maintain multiple applications within a tourism ecosystem, including a white-label ecommerce platform, self-service kiosks, and payment/booking systems.",
      "Build scalable and reusable frontend architectures using React and Next.js.",
      "Contribute to backend integrations using Node.js and Express.",
      "Collaborate with product and design teams to improve usability and user experience.",
      "Support testing and code quality practices using Jest.",
    ],
  },
  {
    period: "2018 — 2020",
    role: "Front End Developer",
    company: "Valtech Brazil",
    bullets: [
      "Developed enterprise-grade web interfaces and applications using Vue.js and SASS.",
      "Delivered projects for international clients including Bayer, L'Oréal, and Sam's Club.",
      "Built responsive interfaces and component-based systems aligned with design standards and accessibility best practices.",
      "Collaborated in multidisciplinary teams within agile environments.",
    ],
  },
  {
    period: "2018 — 2019",
    role: "Full-Stack Web Developer",
    company: "Incentiv.me · Part-time",
    bullets: [
      "Contributed to the development of a social crowdfunding platform.",
      "Worked across the stack using Ruby on Rails, Mithril.js, and PostgreSQL-based APIs.",
      "Implemented features supporting user engagement and platform functionality.",
    ],
  },
  {
    period: "2017 — 2018",
    role: "C++ Software-Hardware Integration / IoT Trainee",
    company: "LabSEC — UFSC",
    bullets: [
      "Participated in the modernization of access control systems for a university restaurant.",
      "Developed software for hardware device integration using C++ and embedded systems concepts.",
      "Worked with RFID communication, secure gateways, and Node.js services.",
    ],
  },
  {
    period: "2015 — 2017",
    role: "Full-Stack Web Developer Trainee",
    company: "LabSEC — UFSC",
    bullets: [
      "Contributed to the development of a public key infrastructure platform (ICPEdu – RNP).",
      "Built features for digital certificate issuance using PHP (Zend Framework) and JavaScript.",
    ],
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground grain">
      {/* Top bar */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-xl font-medium tracking-tight">M·L</span>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#skills" className="hover:text-foreground transition-colors">Skills</a>
            <a href="#experience" className="hover:text-foreground transition-colors">Experience</a>
            <a href="#education" className="hover:text-foreground transition-colors">Education</a>
          </nav>
          <a
            href="mailto:matteus@legat.ml"
            className="rounded-full border border-foreground/80 px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors hover:bg-foreground hover:text-background"
          >
            Get in touch
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-8">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Full Stack Web Developer · Florianópolis, BR
            </p>
            <h1 className="mt-6 font-display text-6xl font-light leading-[0.95] tracking-tight md:text-8xl">
              Matteus
              <br />
              <span className="italic text-[color:var(--rust)]">Legat.</span>
            </h1>
            <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              A decade of building and shipping scalable web applications across ecommerce,
              enterprise, and platform products — with a sharp focus on{" "}
              <span className="text-foreground">React</span>,{" "}
              <span className="text-foreground">Next.js</span>, and{" "}
              <span className="text-foreground">Node.js</span>.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="mailto:matteus@legat.ml"
                className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
              >
                matteus@legat.ml
              </a>
              <a href="#experience" className="text-sm underline underline-offset-4 hover:text-[color:var(--rust)]">
                See experience ↓
              </a>
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-[color:var(--ochre)]/30 -rotate-2" />
              <img
                src={portrait}
                alt="Portrait of Matteus Legat"
                className="relative aspect-[4/5] w-full rounded-[1.75rem] object-cover shadow-xl rotate-1"
              />
              <div className="mt-4 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span>10+ yrs</span>
                <span>est. 2014</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-y border-border/60 bg-secondary/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              01 / About
            </p>
            <h2 className="mt-4 font-display text-4xl font-normal md:text-5xl">
              Production-ready, end to end.
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="text-lg leading-relaxed text-foreground/90">
              Full-stack web developer with{" "}
              <span className="font-display italic text-[color:var(--rust)]">10+ years</span> of
              experience building and maintaining scalable web applications across ecommerce,
              enterprise, and platform-based products. Strong focus on modern frontend development
              using React and Next.js, with solid backend experience in Node.js.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Proven ability to deliver production-ready solutions, contribute to architecture
              decisions, and collaborate across multidisciplinary teams.
            </p>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              02 / Core skills
            </p>
            <h2 className="mt-4 font-display text-4xl font-normal md:text-5xl">
              The toolkit.
            </h2>
          </div>
          <div className="md:col-span-8 space-y-8">
            {Object.entries(skills).map(([group, items]) => (
              <div key={group} className="border-t border-border pt-6">
                <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-[color:var(--rust)]">
                  {group}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-foreground/20 px-3 py-1 text-sm transition-colors hover:bg-foreground hover:text-background"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="pt-2 text-sm text-muted-foreground">
              Concepts: responsive design, UI/UX collaboration, component-based architecture.
            </p>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section id="experience" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                03 / Experience
              </p>
              <h2 className="mt-4 font-display text-4xl font-normal md:text-5xl">
                A decade of shipping.
              </h2>
            </div>
            <div className="md:col-span-8">
              <div className="space-y-12">
                {experience.map((job) => (
                  <article
                    key={job.role + job.period}
                    className="group grid grid-cols-1 gap-4 border-t border-border pt-8 md:grid-cols-[140px_1fr]"
                  >
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {job.period}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-medium leading-snug">
                        {job.role}
                      </h3>
                      <p className="mt-1 text-sm text-[color:var(--rust)]">{job.company}</p>
                      <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-foreground/85">
                        {job.bullets.map((b, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[color:var(--rust)]" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section id="education" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              04 / Education
            </p>
            <h2 className="mt-4 font-display text-4xl font-normal md:text-5xl">Foundations.</h2>
          </div>
          <div className="md:col-span-8 border-t border-border pt-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                2014 — 2018
              </div>
              <div>
                <h3 className="font-display text-2xl font-medium">
                  Bachelor in Computer Science
                </h3>
                <p className="mt-1 text-sm text-[color:var(--rust)]">
                  Federal University of Santa Catarina — UFSC
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-background/60">
            05 / Let's build
          </p>
          <h2 className="mt-6 max-w-3xl font-display text-5xl font-light leading-[1.05] md:text-7xl">
            Have a product worth <span className="italic text-[color:var(--ochre)]">building?</span>
          </h2>
          <a
            href="mailto:matteus@legat.ml"
            className="mt-10 inline-flex items-center gap-3 border-b border-background/40 pb-2 text-lg transition-colors hover:border-[color:var(--ochre)] hover:text-[color:var(--ochre)]"
          >
            matteus@legat.ml
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <span className="font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} Matteus Legat
          </span>
          <span className="font-mono uppercase tracking-widest">Full Stack Web Developer</span>
        </div>
      </footer>
    </div>
  );
}
