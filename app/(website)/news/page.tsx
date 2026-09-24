import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function NewsPage() {
  const school = await prisma.school.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900">
            School News
          </h1>
          <p className="mt-3 text-slate-600">
            School information is not available yet.
          </p>
        </div>
      </main>
    );
  }

  const [websitePage, news] = await Promise.all([
    prisma.websitePage.findUnique({
      where: {
        schoolId_slug: {
          schoolId: school.id,
          slug: "news",
        },
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
    }),
  ]);

  const content =
    (websitePage?.content || {}) as Record<string, unknown>;

  const primaryColor = school.primaryColor || "#2563eb";
  const secondaryColor = school.secondaryColor || "#0f172a";

  const subtitle =
    typeof content.subtitle === "string" &&
    content.subtitle.trim()
      ? content.subtitle
      : "Stay up to date with the latest news, activities, achievements and events happening at our school.";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section
        className="relative overflow-hidden px-6 py-20 text-white lg:px-8 lg:py-28"
        style={{
          background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
        }}
      >
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">
            Latest Updates
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
            School News
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            {subtitle}
          </p>
        </div>
      </section>

      {/* NEWS */}
      <section className="px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          {news.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                N
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-900">
                No news published yet
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-slate-500">
                School announcements, events, excursions and other
                updates will appear here.
              </p>

              <Link
                href="/contact"
                className="mt-7 inline-flex rounded-xl px-5 py-3 font-bold text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                Contact the School
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="flex h-56 items-center justify-center text-5xl font-black text-white"
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
                      }}
                    >
                      {school.name.charAt(0)}
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{
                          color: primaryColor,
                        }}
                      >
                        School Update
                      </span>

                      <span className="text-xs text-slate-400">
                        {new Date(
                          item.publishedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-black leading-tight text-slate-900">
                      {item.title}
                    </h2>

                    {item.excerpt && (
                      <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-6">
                      <Link
                        href={`/news/${item.id}`}
                        className="font-bold"
                        style={{
                          color: primaryColor,
                        }}
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section
        className="px-6 py-16 text-white lg:px-8"
        style={{
          backgroundColor: secondaryColor,
        }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black sm:text-4xl">
            Want to learn more about {school.name}?
          </h2>

          <p className="mt-4 leading-7 text-white/70">
            Explore our school, academics and admissions information,
            or get in touch with our team.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/about"
              className="rounded-xl bg-white px-5 py-3 font-bold"
              style={{
                color: secondaryColor,
              }}
            >
              About Us
            </Link>

            <Link
              href="/contact"
              className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white hover:bg-white/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}