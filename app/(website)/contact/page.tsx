import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/website/ContactForm";

export default async function ContactPage() {
  const school = await prisma.school.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900">
            Contact Us
          </h1>
          <p className="mt-3 text-slate-600">
            School information is not available yet.
          </p>
        </div>
      </main>
    );
  }

  const websitePage = await prisma.websitePage.findUnique({
    where: {
      schoolId_slug: {
        schoolId: school.id,
        slug: "contact",
      },
    },
  });

  const content =
    (websitePage?.content || {}) as Record<string, unknown>;

  const primaryColor = school.primaryColor || "#2563eb";
  const secondaryColor = school.secondaryColor || "#0f172a";

  const intro =
    typeof content.body === "string" && content.body.trim()
      ? content.body
      : "We would love to hear from you. Send us an enquiry, suggestion, complaint or any other message and our school team will get back to you.";

  const email =
    typeof content.email === "string" && content.email.trim()
      ? content.email
      : school.email || "";

  const phone =
    typeof content.phone === "string" && content.phone.trim()
      ? content.phone
      : school.phone || "";

  const whatsapp =
    typeof content.whatsapp === "string" && content.whatsapp.trim()
      ? content.whatsapp
      : phone;

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
            Get In Touch
          </p>

          <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            Contact {school.name}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            {intro}
          </p>
        </div>
      </section>

      {/* CONTACT CONTENT */}
      <section className="px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          {/* CONTACT INFO */}
          <div>
            <h2 className="text-3xl font-black text-slate-900">
              Let&apos;s talk
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Whether you are a parent, student, prospective student or
              member of our community, you can reach the school through
              any of the options below.
            </p>

            <div className="mt-8 space-y-4">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    Email
                  </div>

                  <div className="mt-2 break-all font-semibold text-slate-900">
                    {email}
                  </div>
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    Phone / SMS
                  </div>

                  <div className="mt-2 font-semibold text-slate-900">
                    {phone}
                  </div>
                </a>
              )}

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(
                    /[^0-9]/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    WhatsApp
                  </div>

                  <div className="mt-2 font-semibold text-slate-900">
                    Message us on WhatsApp
                  </div>
                </a>
              )}

              {school.address && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    Address
                  </div>

                  <div className="mt-2 font-semibold leading-7 text-slate-900">
                    {school.address}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/admissions"
              className="mt-8 inline-flex rounded-xl px-5 py-3 font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              View Admissions
            </Link>
          </div>

          {/* FORM */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900">
                Send us a message
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use this form for enquiries, complaints, suggestions,
                feedback or other school-related matters.
              </p>
            </div>

            <ContactForm
              schoolId={school.id}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </section>
    </main>
  );
}