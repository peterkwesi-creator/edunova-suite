import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const prisma = new PrismaClient();

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      student: {
        include: {
          class: true,
          results: {
            include: {
              subject: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
          wards: true,
        },
      },
    },
  });

  if (!user || !user.student) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Student profile not connected
          </h1>

          <p className="mt-2 text-gray-600">
            Your student account exists, but it has not been connected to a
            student record yet.
          </p>
        </div>
      </div>
    );
  }

  const student = user.student;

  const results = student.results;

  const totalScores = results
    .map((result) => result.totalScore ?? 0)
    .filter((score) => typeof score === "number");

  const average =
    totalScores.length > 0
      ? totalScores.reduce((sum, score) => sum + score, 0) /
        totalScores.length
      : 0;

  const passedSubjects = results.filter(
    (result) => (result.totalScore ?? 0) >= 50
  ).length;

  const failedSubjects = results.filter(
    (result) => (result.totalScore ?? 0) < 50
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Student Portal
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Welcome, {student.firstName}
              </h1>

              <p className="mt-1 text-gray-500">
                Here&apos;s an overview of your academic activity.
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Student ID
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {student.studentNumber}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Student information */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Student Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Full name</p>
              <p className="mt-1 font-semibold text-gray-900">
                {student.firstName} {student.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Class</p>
              <p className="mt-1 font-semibold text-gray-900">
                {student.class?.name ?? "Not assigned"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="mt-1 font-semibold text-gray-900">
                {student.gender}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 break-all font-semibold text-gray-900">
                {student.email ?? user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Subjects with results
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {results.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Average score
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {average.toFixed(1)}%
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Passed subjects
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {passedSubjects}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Subjects needing attention
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {failedSubjects}
            </p>
          </div>
        </div>

        {/* Recent results */}
        <div className="mt-8 rounded-2xl bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              Recent Results
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your latest recorded subject results.
            </p>
          </div>

          {results.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-medium text-gray-700">
                No results available yet.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Your results will appear here when your teacher publishes them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Assessment
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Exam
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Total
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Grade
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {results.slice(0, 5).map((result) => (
                    <tr key={result.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {result.subject.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {result.assessmentScore ?? "-"} / 50
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {result.examScore ?? "-"} / 50
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {result.totalScore ?? "-"} / 100
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                          {result.grade ?? "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Portal navigation */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/student/results"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="font-bold text-gray-900">My Results</h3>

            <p className="mt-2 text-sm text-gray-500">
              View your complete academic results and grades.
            </p>
          </a>

          <a
            href="/student/assignments"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="font-bold text-gray-900">Assignments</h3>

            <p className="mt-2 text-sm text-gray-500">
              View assignments from your teachers and submit your work.
            </p>
          </a>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-900">Results Projection</h3>

            <p className="mt-2 text-sm text-gray-500">
              Estimate possible final results based on your current scores.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}