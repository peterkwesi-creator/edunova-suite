import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageContent = {
  subtitle?: string;
  body?: string;
  sectionOneTitle?: string;
  sectionOneText?: string;
  sectionTwoTitle?: string;
  sectionTwoText?: string;
  founderName?: string;
  founderMessage?: string;
};

export default async function AboutPage() {
  const school = await prisma.school.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!school) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-black text-gray-900">
            About Our School
          </h1>
          <p className="mt-4 text-gray-600">
            School information is currently unavailable.
          </p>
        </div>
      </main>
    );
  }

  const page = await prisma.websitePage.findUnique({
    where: {
      schoolId_slug: {
        schoolId: school.id,
        slug: "about",
      },
    },
  });

  const content = (page?.content || {}) as PageContent;

  const title = page?.title || `About ${school.name}`;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section
        className="relative overflow-hidden px-6 py-24 text-white md:py-32"
        style={{
          background: `linear-gradient(135deg, ${
            school.primaryColor || "#2563eb"
          }, ${
            school.secondaryColor || "#0f172a"
          })`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-white/80">
            About Our School
          </p>

          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            {title}
          </h1>

          {content.subtitle && (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85 md:text-xl">
              {content.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-gray-50 p-8 md:p-12">
            <h2 className="text-3xl font-black text-gray-900">
              Our Story
            </h2>

            <div className="mt-6 whitespace-pre-line text-lg leading-8 text-gray-600">
              {content.body ||
                school.description ||
                `${school.name} is committed to providing quality education and preparing students for a successful future.`}
            </div>
          </div>
        </div>
      </section>

      {/* MISSION + VISION */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div
            className="rounded-3xl p-8 text-white md:p-10"
            style={{
              backgroundColor:
                school.primaryColor || "#2563eb",
            }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
              Our Mission
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {content.sectionOneTitle ||
                "Our Mission"}
            </h2>

            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/85">
              {content.sectionOneText ||
                "To provide a supportive, inspiring and high-quality learning environment where every student can develop academically, socially and personally."}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
            <p
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{
                color:
                  school.primaryColor || "#2563eb",
              }}
            >
              Our Vision
            </p>

            <h2 className="mt-3 text-3xl font-black text-gray-900">
              {content.sectionTwoTitle ||
                "Our Vision"}
            </h2>

            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-gray-600">
              {content.sectionTwoText ||
                "To develop confident, responsible and capable young people who are prepared to make a positive impact in their communities and the wider world."}
            </p>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      {(content.founderName ||
        content.founderMessage) && (
        <section className="bg-gray-50 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
              <p
                className="text-sm font-bold uppercase tracking-[0.2em]"
                style={{
                  color:
                    school.primaryColor ||
                    "#2563eb",
                }}
              >
                A Word From Our Founder
              </p>

              <blockquote className="mt-6 text-2xl font-semibold leading-10 text-gray-800 md:text-3xl">
                “
                {content.founderMessage ||
                  "Education is the foundation upon which a better future is built."}
                ”
              </blockquote>

              {content.founderName && (
                <p className="mt-6 font-black text-gray-900">
                  — {content.founderName}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20">
        <div
          className="mx-auto max-w-6xl rounded-3xl p-8 text-white md:p-12"
          style={{
            background: `linear-gradient(135deg, ${
              school.primaryColor || "#2563eb"
            }, ${
              school.secondaryColor || "#0f172a"
            })`,
          }}
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black">
                Discover more about our school
              </h2>

              <p className="mt-3 max-w-2xl text-white/80">
                Explore our academic programmes or
                get in touch with our admissions team.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/academics"
                className="rounded-xl bg-white px-6 py-3 font-bold text-gray-900"
              >
                Academics
              </Link>

              <Link
                href="/contact"
                className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}