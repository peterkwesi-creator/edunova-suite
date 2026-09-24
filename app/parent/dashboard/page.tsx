import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export default async function ParentDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      parent: {
        include: {
          children: {
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
                  submissions: true,
                  attendance: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.parent) {
    redirect("/login");
  }

  const parent = user.parent;
  const children = parent.children.map((item) => item.student);

  const totalChildren = children.length;

  const totalResults = children.reduce(
    (total, child) => total + child.results.length,
    0
  );

  const totalAssignments = children.reduce(
    (total, child) => total + child.submissions.length,
    0
  );

  const totalAttendanceRecords = children.reduce(
    (total, child) => total + child.attendance.length,
    0
  );

  const passedResults = children.reduce(
    (total, child) =>
      total +
      child.results.filter(
        (result) =>
          result.totalScore !== null &&
          result.totalScore >= 50
      ).length,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            Parent Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome, {parent.firstName}
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor your children&apos;s academic progress,
            results, assignments and attendance.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Children
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalChildren}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Results Available
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalResults}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Assignments
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalAssignments}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Attendance Records
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {totalAttendanceRecords}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Passed Results
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {passedResults}
            </p>
          </div>
        </div>

        {/* Children */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              My Children
            </h2>

            <p className="mt-1 text-gray-500">
              Select a child to view their school information.
            </p>
          </div>

          {children.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                No children linked yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Your school administrator has not linked a
                student to your parent account yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => {
                const average =
                  child.results.length > 0
                    ? child.results.reduce(
                        (sum, result) =>
                          sum +
                          (result.totalScore ?? 0),
                        0
                      ) / child.results.length
                    : 0;

                return (
                  <div
                    key={child.id}
                    className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {child.firstName}{" "}
                          {child.lastName}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {child.studentNumber}
                        </p>
                      </div>

                      <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                        <p className="text-xs text-blue-600">
                          Average
                        </p>

                        <p className="font-bold text-blue-700">
                          {average.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">
                          Class
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {child.class?.name ||
                            "Not assigned"}
                        </span>
                      </div>

                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">
                          Results
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {child.results.length}
                        </span>
                      </div>

                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">
                          Assignments
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {child.submissions.length}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Attendance
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {child.attendance.length} records
                        </span>
                      </div>
                    </div>

                    {/* Child Quick Links */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <a
                        href={`/parent/results?studentId=${child.id}`}
                        className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Results
                      </a>

                      <a
                        href={`/parent/assignments?studentId=${child.id}`}
                        className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Assignments
                      </a>

                      <a
                        href={`/parent/attendance?studentId=${child.id}`}
                        className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Attendance
                      </a>

                      <a
                        href={`/parent/fees?studentId=${child.id}`}
                        className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Fees
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Navigation */}
        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-bold text-gray-900">
            Parent Portal
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <a
              href="/parent/children"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">👨‍👩‍👧</div>

              <h3 className="mt-3 font-bold text-gray-900">
                My Children
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View and switch between your children.
              </p>
            </a>

            <a
              href="/parent/results"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">📊</div>

              <h3 className="mt-3 font-bold text-gray-900">
                Results
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View your children&apos;s academic results.
              </p>
            </a>

            <a
              href="/parent/assignments"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">📝</div>

              <h3 className="mt-3 font-bold text-gray-900">
                Assignments
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Monitor assignments and submissions.
              </p>
            </a>

            <a
              href="/parent/fees"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">💰</div>

              <h3 className="mt-3 font-bold text-gray-900">
                School Fees
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View fees, balances and payment information.
              </p>
            </a>

            <a
              href="/parent/attendance"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">📅</div>

              <h3 className="mt-3 font-bold text-gray-900">
                Attendance
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Monitor your children&apos;s attendance history.
              </p>
            </a>
          </div>
        </section>

        {/* Account Information */}
        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Account Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Parent Name
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {parent.firstName} {parent.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {parent.email || user.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Phone
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {parent.phone || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Address
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {parent.address || "Not provided"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}