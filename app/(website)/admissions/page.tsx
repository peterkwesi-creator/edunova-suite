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

export default async function AdmissionsPage() {
  const school = await prisma.school.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!school) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-black">
            Admissions
          </h1>
          <p className="mt-4 text-gray-600">
            Admissions information is currently unavailable.
          </p>
        </div>
      </main>
    );
  }

  const page = await prisma.websitePage.findUnique({
    where: {
      schoolId_slug: {
        schoolId: school.id,
        slug: "admissions",
      },
    },
  });

  const content = (page?.content || {}) as PageContent;

  const admissionsEnabled =
    school.admissionsEnabled;

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
            Join Our School
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black md:text-6xl">
            {page?.title || "Admissions"}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85 md:text-xl">
            {content.subtitle ||
              "Take the first step towards becoming part of our school community."}
          </p>

          {admissionsEnabled && (
            <Link
              href="/admissions/dashboard"
              className="mt-8 inline-flex rounded-xl bg-white px-7 py-3.5 font-bold text-gray-900 shadow-lg transition hover:-translate-y-1"
            >
              Start Application
            </Link>
          )}
        </div>
      </section>

      {!admissionsEnabled ? (
        <section className="px-6 py-24">
          <div className="mx-auto max-w-3xl rounded-3xl border border-yellow-200 bg-yellow-50 p-10 text-center">
            <h2 className="text-2xl font-black text-gray-900">
              Admissions are currently closed
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Please contact the school for more
              information about the next admissions
              period.
            </p>

            <Link
              href="/contact"
              className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 font-bold text-white"
            >
              Contact the School
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* INTRO */}
          <section className="px-6 py-20">
            <div className="mx-auto max-w-5xl text-center">
              <p
                className="text-sm font-bold uppercase tracking-[0.2em]"
                style={{
                  color:
                    school.primaryColor ||
                    "#2563eb",
                }}
              >
                Begin Your Journey
              </p>

              <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">
                Welcome to {school.name}
              </h2>

              <p className="mx-auto mt-6 max-w-3xl whitespace-pre-line text-lg leading-8 text-gray-600">
                {content.body ||
                  "We welcome families who are looking for a supportive, inspiring and academically focused environment for their children."}
              </p>
            </div>
          </section>

          {/* PROCESS */}
          <section className="bg-gray-50 px-6 py-20">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10">
                <p
                  className="text-sm font-bold uppercase tracking-[0.2em]"
                  style={{
                    color:
                      school.primaryColor ||
                      "#2563eb",
                  }}
                >
                  How It Works
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-900">
                  Simple admissions process
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {[
                  {
                    number: "01",
                    title: "Submit an Application",
                    text: "Complete the online application form with the required student and guardian information.",
                  },
                  {
                    number: "02",
                    title: "School Review",
                    text: "The school reviews the application and contacts the family with the next steps.",
                  },
                  {
                    number: "03",
                    title: "Admission",
                    text: "Successful applicants receive further instructions for completing enrolment.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="rounded-3xl bg-white p-7 shadow-sm"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black text-white"
                      style={{
                        backgroundColor:
                          school.primaryColor ||
                          "#2563eb",
                      }}
                    >
                      {step.number}
                    </div>

                    <h3 className="mt-6 text-xl font-black text-gray-900">
                      {step.title}
                    </h3>

                    <p className="mt-3 leading-7 text-gray-600">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* REQUIREMENTS */}
          <section className="px-6 py-20">
            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 p-8 md:p-10">
                <p
                  className="text-sm font-bold uppercase tracking-[0.2em]"
                  style={{
                    color:
                      school.primaryColor ||
                      "#2563eb",
                  }}
                >
                  Requirements
                </p>

                <h2 className="mt-3 text-3xl font-black text-gray-900">
                  {content.sectionOneTitle ||
                    "What you may need"}
                </h2>

                <p className="mt-5 whitespace-pre-line text-lg leading-8 text-gray-600">
                  {content.sectionOneText ||
                    "Applicants may be asked to provide previous school records, identification documents, birth certificate information and guardian contact details. The school will provide specific requirements during the application process."}
                </p>
              </div>

              <div
                className="rounded-3xl p-8 text-white md:p-10"
                style={{
                  backgroundColor:
                    school.primaryColor ||
                    "#2563eb",
                }}
              >
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                  Important Information
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  {content.sectionTwoTitle ||
                    "Need help?"}
                </h2>

                <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/85">
                  {content.sectionTwoText ||
                    "If you have questions about admissions, fees, classes or requirements, contact the school directly and our team will assist you."}
                </p>

                <Link
                  href="/contact"
                  className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-gray-900"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="px-6 pb-20">
            <div className="mx-auto max-w-5xl rounded-3xl bg-gray-900 p-8 text-center text-white md:p-12">
              <h2 className="text-3xl font-black md:text-4xl">
                Ready to apply?
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-white/70">
                Begin your application today and take
                the next step towards joining our school.
              </p>

              <Link
                href="/admissions/dashboard"
                className="mt-8 inline-flex rounded-xl px-7 py-3.5 font-bold text-white"
                style={{
                  backgroundColor:
                    school.primaryColor ||
                    "#2563eb",
                }}
              >
                Apply Now
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}