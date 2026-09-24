import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageContent = {
  subtitle?: string;
  body?: string;
  sectionOneTitle?: string;
  sectionOneText?: string;
  sectionTwoTitle?: string;
  sectionTwoText?: string;
};

export default async function AcademicsPage() {
  const school = await prisma.school.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!school) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-black">
            Academics
          </h1>
          <p className="mt-4 text-gray-600">
            Academic information is currently unavailable.
          </p>
        </div>
      </main>
    );
  }

  const page = await prisma.websitePage.findUnique({
    where: {
      schoolId_slug: {
        schoolId: school.id,
        slug: "academics",
      },
    },
  });

  const content = (page?.content || {}) as PageContent;

  const subjects = await prisma.subject.findMany({
    where: {
      schoolId: school.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section
        className="px-6 py-24 text-white md:py-32"
        style={{
          background: `linear-gradient(135deg, ${
            school.primaryColor || "#2563eb"
          }, ${
            school.secondaryColor || "#0f172a"
          })`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">
            Academic Excellence
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black md:text-6xl">
            {page?.title || "Academics"}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85 md:text-xl">
            {content.subtitle ||
              "Building knowledge, confidence, creativity and the skills students need for the future."}
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{
                color:
                  school.primaryColor || "#2563eb",
              }}
            >
              Our Academic Programme
            </p>

            <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">
              Learning that prepares students for tomorrow
            </h2>

            <p className="mx-auto mt-6 max-w-3xl whitespace-pre-line text-lg leading-8 text-gray-600">
              {content.body ||
                "Our academic programme combines strong foundational knowledge with practical learning, critical thinking and personal development."}
            </p>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{
                color:
                  school.primaryColor || "#2563eb",
              }}
            >
              Subjects
            </p>

            <h2 className="mt-2 text-3xl font-black text-gray-900">
              What students can study
            </h2>
          </div>

          {subjects.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white"
                    style={{
                      backgroundColor:
                        school.primaryColor ||
                        "#2563eb",
                    }}
                  >
                    {subject.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h3 className="text-xl font-black text-gray-900">
                    {subject.name}
                  </h3>

                  <p className="mt-2 text-sm font-semibold text-gray-400">
                    {subject.code}
                  </p>

                  {subject.description && (
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                      {subject.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              Academic subjects will be displayed
              here once they are added by the school.
            </div>
          )}
        </div>
      </section>

      {/* TWO SECTIONS */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-gray-900 p-8 text-white md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">
              Learning
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {content.sectionOneTitle ||
                "A strong foundation"}
            </h2>

            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/70">
              {content.sectionOneText ||
                "Students are encouraged to ask questions, explore ideas and develop a strong understanding of the subjects they study."}
            </p>
          </div>

          <div
            className="rounded-3xl p-8 text-white md:p-10"
            style={{
              backgroundColor:
                school.primaryColor || "#2563eb",
            }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
              Development
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {content.sectionTwoTitle ||
                "Beyond the classroom"}
            </h2>

            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/85">
              {content.sectionTwoText ||
                "Education is more than examinations. We encourage students to build confidence, character, communication skills and leadership qualities."}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black text-gray-900 md:text-4xl">
            Interested in joining our school?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Learn more about our admissions process
            or speak with the school directly.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/admissions"
              className="rounded-xl px-7 py-3.5 font-bold text-white"
              style={{
                backgroundColor:
                  school.primaryColor || "#2563eb",
              }}
            >
              Admissions
            </Link>

            <Link
              href="/contact"
              className="rounded-xl border border-gray-300 px-7 py-3.5 font-bold text-gray-900"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}