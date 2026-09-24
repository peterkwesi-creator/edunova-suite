export default function TeacherPortalPage() {
  const cards = [
    {
      title: "My Classes",
      value: "—",
      description: "Classes assigned to you",
    },
    {
      title: "Subjects",
      value: "—",
      description: "Subjects you teach",
    },
    {
      title: "Assignments",
      value: "—",
      description: "Assignments you have created",
    },
    {
      title: "Results",
      value: "—",
      description: "Student results awaiting entry",
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
              Teacher Portal
            </h1>
          </div>

          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            Teacher
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-2xl bg-blue-600 p-8 text-white shadow-sm">
          <p className="text-sm font-medium text-blue-100">
            Welcome back
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Teacher Dashboard
          </h2>

          <p className="mt-3 max-w-2xl text-blue-100">
            Manage your classes, assignments, students and academic
            results from one place.
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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                Create Assignment
              </button>

              <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Enter Results
              </button>

              <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                View Classes
              </button>

              <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                View Students
              </button>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Recent Activity
            </h3>

            <div className="mt-5 rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-slate-500">
                Your recent teaching activity will appear here.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}