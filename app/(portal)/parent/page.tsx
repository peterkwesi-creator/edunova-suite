export default function ParentPortalPage() {
  const children = [
    {
      name: "Ward 1",
      className: "Class —",
      average: "—",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              EduNova Suite
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Parent Portal
            </h1>
          </div>

          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            Parent
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white shadow-sm">
          <p className="text-sm font-medium text-blue-100">
            Family Dashboard
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Parent Portal
          </h2>

          <p className="mt-3 max-w-2xl text-blue-100">
            Stay connected with your children&apos;s academic
            performance, assignments, fees and school updates.
          </p>
        </div>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              My Children
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Select a child to view their school information.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <button
                key={child.name}
                className="rounded-2xl border p-6 text-left transition hover:border-blue-500 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                  W
                </div>

                <h4 className="mt-4 font-bold text-slate-900">
                  {child.name}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  {child.className}
                </p>

                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Current Average
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {child.average}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Results
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View your children&apos;s academic results.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Assignments
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Monitor assignments and submissions.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              School Fees
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View fees and installment plans.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Notifications
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Receive important school announcements.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}