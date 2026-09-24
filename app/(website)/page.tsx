import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageContent = {
  heroTitle?: string;
  heroSubtitle?: string;
  welcomeTitle?: string;
  welcomeText?: string;
  sectionOneTitle?: string;
  sectionOneText?: string;
  sectionTwoTitle?: string;
  sectionTwoText?: string;
  ctaTitle?: string;
  ctaText?: string;
};

export default async function HomePage() {
  const school = await prisma.school.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!school) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900">
              Welcome to EduNova Suite
            </h1>
            <p className="mt-4 text-slate-600">
              Your school website is being prepared.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const [websitePage, gallery, socialLinks, news] = await Promise.all([
    prisma.websitePage.findUnique({
      where: {
        schoolId_slug: {
          schoolId: school.id,
          slug: "home",
        },
      },
    }),

    prisma.galleryItem.findMany({
      where: {
        schoolId: school.id,
        published: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      take: 6,
    }),

    prisma.socialLink.findMany({
      where: {
        schoolId: school.id,
        enabled: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),

    prisma.newsItem.findMany({
      where: {
        schoolId: school.id,
        published: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 3,
    }),
  ]);

  const content = (websitePage?.content || {}) as PageContent;

  const primaryColor = school.primaryColor || "#2563eb";
  const secondaryColor = school.secondaryColor || "#0f172a";

  const heroTitle =
    content.heroTitle ||
    `Welcome to ${school.name}`;

  const heroSubtitle =
    content.heroSubtitle ||
    school.description ||
    "Building a brighter future through quality education, character and excellence.";

  const welcomeTitle =
    content.welcomeTitle ||
    "A place to learn, grow and succeed";

  const welcomeText =
    content.welcomeText ||
    `Welcome to ${school.name}. We are committed to providing an inspiring learning environment where students are encouraged to discover their potential, develop strong character and prepare for the future.`;

  const sectionOneTitle =
    content.sectionOneTitle || "Excellence in Education";

  const sectionOneText =
    content.sectionOneText ||
    "Our academic environment is designed to encourage curiosity, critical thinking, creativity and a lifelong love of learning.";

  const sectionTwoTitle =
    content.sectionTwoTitle || "More Than the Classroom";

  const sectionTwoText =
    content.sectionTwoText ||
    "We believe education is about developing the whole student. Through activities, leadership, teamwork and personal development, we help students become confident and responsible individuals.";

  const ctaTitle =
    content.ctaTitle ||
    "Ready to become part of our school community?";

  const ctaText =
    content.ctaText ||
    "Discover our admissions process and take the next step toward joining our school.";

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div className="text-white">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              {school.name}
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl">
              {heroSubtitle}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              {school.admissionsEnabled && (
                <Link
                  href="/admissions"
                  className="rounded-xl bg-white px-6 py-3.5 font-bold shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
                  style={{ color: primaryColor }}
                >
                  Apply Now
                </Link>
              )}

              <Link
                href="/about"
                className="rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Discover Our School
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-white/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <img
                src="/images/hero.jpg"
                alt={`${school.name} school`}
                className="h-[360px] w-full rounded-[1.5rem] object-cover sm:h-[430px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME */}
      <section className="bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.2em]"
                style={{ color: primaryColor }}
              >
                Welcome
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                {welcomeTitle}
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                {welcomeText}
              </p>

              <Link
                href="/about"
                className="mt-8 inline-flex rounded-xl px-5 py-3 font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Learn More About Us
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-6">
                <div
                  className="text-3xl font-black"
                  style={{ color: primaryColor }}
                >
                  01
                </div>
                <h3 className="mt-3 font-bold text-slate-900">
                  Quality Learning
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Focused on strong academic foundations.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <div
                  className="text-3xl font-black"
                  style={{ color: primaryColor }}
                >
                  02
                </div>
                <h3 className="mt-3 font-bold text-slate-900">
                  Character
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Developing responsible and confident students.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <div
                  className="text-3xl font-black"
                  style={{ color: primaryColor }}
                >
                  03
                </div>
                <h3 className="mt-3 font-bold text-slate-900">
                  Innovation
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Encouraging creativity and critical thinking.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <div
                  className="text-3xl font-black"
                  style={{ color: primaryColor }}
                >
                  04
                </div>
                <h3 className="mt-3 font-bold text-slate-900">
                  Community
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Building strong relationships between school and families.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMICS */}
      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                A
              </div>

              <h2 className="text-3xl font-black text-slate-900">
                {sectionOneTitle}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {sectionOneText}
              </p>

              <Link
                href="/academics"
                className="mt-6 inline-block font-bold"
                style={{ color: primaryColor }}
              >
                Explore Academics →
              </Link>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                +
              </div>

              <h2 className="text-3xl font-black text-slate-900">
                {sectionTwoTitle}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {sectionTwoText}
              </p>

              <Link
                href="/about"
                className="mt-6 inline-block font-bold"
                style={{ color: primaryColor }}
              >
                Learn About Our Approach →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEWS */}
      {news.length > 0 && (
        <section className="px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p
                  className="text-sm font-bold uppercase tracking-[0.2em]"
                  style={{ color: primaryColor }}
                >
                  Latest Updates
                </p>

                <h2 className="mt-2 text-4xl font-black text-slate-900">
                  What&apos;s happening at school
                </h2>
              </div>

              <Link
                href="/news"
                className="font-bold"
                style={{ color: primaryColor }}
              >
                View All News →
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {news.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-48"
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
                      }}
                    />
                  )}

                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {item.title}
                    </h3>

                    {item.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="bg-slate-950 px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">
                  School Life
                </p>

                <h2 className="mt-2 text-4xl font-black text-white">
                  Moments from our school
                </h2>
              </div>

              <Link
                href="/gallery"
                className="font-bold text-white"
              >
                View Full Gallery →
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
              {gallery.map((item) => (
                <Link
                  href="/gallery"
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title || "School gallery image"}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 text-sm font-bold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                      {item.title}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SOCIAL */}
      {socialLinks.length > 0 && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{ color: primaryColor }}
            >
              Stay Connected
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              Follow {school.name}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Keep up with our latest news, activities and school events.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow"
                >
                  {social.label || social.platform}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        className="px-6 py-20 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <div className="mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl font-black sm:text-5xl">
            {ctaTitle}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/80">
            {ctaText}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {school.admissionsEnabled && (
              <Link
                href="/admissions"
                className="rounded-xl bg-white px-6 py-3.5 font-bold transition hover:bg-slate-100"
                style={{ color: primaryColor }}
              >
                Start Your Application
              </Link>
            )}

            <Link
              href="/contact"
              className="rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 font-bold backdrop-blur transition hover:bg-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}