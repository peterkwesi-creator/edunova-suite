export default function StudentPortalPage() {
  const cards = [
    {
      title: "Overall Average",
      value: "—",
      description: "Your current academic average",
    },
    {
      title: "Assignments",
      value: "—",
      description: "Assignments waiting for you",
    },
    {
      title: "Subjects",
      value: "—",
      description: "Subjects enrolled",
    },
    {
      title: "Class Position",
      value: "—",
      description: "Current class position",
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
              Student Portal
            </h1>
          </div>

          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            Student
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-sm">
          <p className="text-sm font-medium text-blue-100">
            Welcome back
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Student Dashboard
          </h2>

          <p className="mt-3 max-w-2xl text-blue-100">
            Track your academic performance, assignments, results and
            progress throughout the school year.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {card.value}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              My Results
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View your assessment and examination results.
            </p>

            <button className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              View Results
            </button>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Assignments
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View and submit assignments from your teachers.
            </p>

            <button className="mt-5 w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              View Assignments
            </button>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Result Projection
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              See how your future scores could affect your overall
              result.
            </p>

            <button className="mt-5 w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Open Projection
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}