import Link from "next/link";

const school = {
  name: "EduNova Academy",
  shortName: "ENA",
  tagline: "Building bright minds. Shaping tomorrow.",
  description:
    "A modern learning community committed to academic excellence, character development, creativity, and preparing students for a changing world.",
  phone: "+233 20 000 0000",
  email: "info@edunovaacademy.com",
  address: "Accra, Ghana",
};

const programs = [
  {
    number: "01",
    title: "Academic Excellence",
    description:
      "A structured learning environment designed to help every student develop strong academic foundations and confidence.",
  },
  {
    number: "02",
    title: "Character & Leadership",
    description:
      "We help students develop responsibility, discipline, teamwork, integrity, and leadership skills.",
  },
  {
    number: "03",
    title: "Technology & Innovation",
    description:
      "Students are encouraged to explore technology, creativity, problem-solving, and the skills needed for tomorrow.",
  },
];

const achievements = [
  {
    value: "95%",
    label: "Academic Progress",
  },
  {
    value: "20+",
    label: "Years of Excellence",
  },
  {
    value: "1,000+",
    label: "Students Guided",
  },
  {
    value: "50+",
    label: "Dedicated Teachers",
  },
];

const values = [
  "Excellence",
  "Integrity",
  "Discipline",
  "Creativity",
  "Respect",
  "Leadership",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* NAVIGATION */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 font-black text-white shadow-lg">
              {school.shortName}
            </div>

            <div>
              <div className="text-sm font-black tracking-wide text-white">
                {school.name}
              </div>
              <div className="text-xs text-slate-400">
                Excellence • Character • Future
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#about"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              About
            </Link>

            <Link
              href="#programs"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Programs
            </Link>

            <Link
              href="#achievements"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Achievements
            </Link>

            <Link
              href="#contact"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Contact
            </Link>
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Portal Login
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950 pt-28">
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-2 lg:px-8 lg:pb-32 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Welcome to {school.name}
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {school.tagline}
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              {school.description}
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#about"
                className="rounded-full bg-emerald-500 px-7 py-3.5 text-center font-bold text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                Discover Our School
              </Link>

              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-center font-bold text-white transition hover:bg-white/10"
              >
                Student & Parent Portal
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
              <span>✓ Qualified educators</span>
              <span>✓ Student-centered learning</span>
              <span>✓ Modern technology</span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2rem] bg-emerald-500/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-3 shadow-2xl">
              <div className="flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 p-8">
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                    <div className="text-xs font-semibold uppercase tracking-widest text-white/70">
                      Since
                    </div>
                    <div className="text-2xl font-black text-white">2004</div>
                  </div>

                  <div className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur">
                    LEARNING • GROWTH • SUCCESS
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-emerald-100">
                    A place to learn
                  </div>

                  <div className="max-w-sm text-4xl font-black leading-tight text-white">
                    Where every student gets the opportunity to shine.
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-white p-5 shadow-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Our Mission
              </div>
              <div className="mt-1 font-black text-slate-900">
                Educate. Inspire. Empower.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-6 py-10 lg:grid-cols-4 lg:px-8">
          {achievements.map((item) => (
            <div
              key={item.label}
              className="border-slate-200 px-5 py-5 text-center first:border-l-0 lg:border-l"
            >
              <div className="text-3xl font-black text-slate-950">
                {item.value}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-24 bg-slate-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              About our school
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Education that prepares students for life.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              At {school.name}, we believe education is more than grades. It
              is about developing confident young people who can think
              independently, work with others, solve problems, and contribute
              positively to their communities.
            </p>

            <p className="mt-5 leading-7 text-slate-600">
              Our learning environment combines academic structure with
              creativity, technology, discipline, and personal development.
              Every student deserves to be seen, supported, and challenged to
              reach their potential.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {values.map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
              <div className="text-4xl">🎓</div>
              <h3 className="mt-7 text-xl font-black">Student Success</h3>
              <p className="mt-3 leading-7 text-slate-300">
                We create an environment where students can build confidence
                and pursue meaningful academic goals.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-200">
              <div className="text-4xl">💡</div>
              <h3 className="mt-7 text-xl font-black">Innovation</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Technology and creativity are integrated into the modern
                learning experience.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-200">
              <div className="text-4xl">🤝</div>
              <h3 className="mt-7 text-xl font-black">Community</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Teachers, parents, and students work together to create a
                supportive school community.
              </p>
            </div>

            <div className="rounded-3xl bg-emerald-500 p-7 text-white shadow-xl">
              <div className="text-4xl">🌱</div>
              <h3 className="mt-7 text-xl font-black">Future Ready</h3>
              <p className="mt-3 leading-7 text-emerald-50">
                We help students develop skills that extend beyond the
                classroom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" className="scroll-mt-24 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              What we offer
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              More than a classroom.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Our approach brings together academic development, character,
              creativity, and technology.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {programs.map((program) => (
              <article
                key={program.number}
                className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="text-sm font-black text-emerald-500">
                  {program.number}
                </div>

                <h3 className="mt-10 text-2xl font-black text-slate-950">
                  {program.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {program.description}
                </p>

                <div className="mt-8 h-1 w-12 rounded-full bg-emerald-500 transition-all group-hover:w-20" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PORTAL CTA */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center lg:flex-row lg:px-8 lg:text-left">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">
              EduNova School Portal
            </div>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Everything your school community needs in one place.
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-slate-400">
              Students, parents, teachers, and administrators can access the
              tools they need through a secure digital school environment.
            </p>
          </div>

          <Link
            href="/login"
            className="shrink-0 rounded-full bg-emerald-500 px-7 py-4 font-black text-white transition hover:bg-emerald-400"
          >
            Access Portal →
          </Link>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-24 bg-slate-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              Get in touch
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              We would love to hear from you.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Whether you are a prospective parent, current family, student,
              or member of our community, our team is here to help.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <div className="space-y-6">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Address
                </div>
                <div className="mt-2 font-bold text-slate-900">
                  {school.address}
                </div>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Phone
                </div>
                <div className="mt-2 font-bold text-slate-900">
                  {school.phone}
                </div>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Email
                </div>
                <div className="mt-2 font-bold text-slate-900">
                  {school.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="font-black text-white">{school.name}</div>
            <div className="mt-1 text-sm text-slate-500">
              {school.tagline}
            </div>
          </div>

          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} {school.name}. All rights reserved.
          </div>

          <div className="text-sm font-semibold text-emerald-400">
            Powered by EduNova Suite
          </div>
        </div>
      </footer>
    </main>
  );
}