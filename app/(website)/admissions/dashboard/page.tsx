import Link from "next/link";

export default function AdmissionsPage() {
  return (
    <main className="bg-white">
      <section className="bg-blue-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
            Admissions
          </p>

          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Start Your Journey With Us
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
            Learn about our admission process and take the first step
            toward joining our school community.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <AdmissionStep
            number="01"
            title="Submit an Enquiry"
            text="Contact the school and provide the required student information."
          />

          <AdmissionStep
            number="02"
            title="Application Review"
            text="The school reviews the application and contacts the parent or guardian."
          />

          <AdmissionStep
            number="03"
            title="Admission"
            text="Successful applicants receive admission information and enrollment instructions."
          />
        </div>

        <div className="mt-16 rounded-2xl bg-gray-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Ready to apply?
          </h2>

          <p className="mt-3 text-gray-600">
            Contact the school administration for admission enquiries.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

function AdmissionStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
        {number}
      </div>

      <h2 className="mt-5 text-xl font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-3 leading-7 text-gray-600">
        {text}
      </p>
    </div>
  );
}