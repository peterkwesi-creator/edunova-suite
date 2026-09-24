import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export default async function ParentChildrenPage() {
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
                  },
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

  if (user.schoolId !== session.schoolId) {
    redirect("/login");
  }

  const parent = user.parent;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/parent/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </a>

          <p className="mt-6 text-sm font-medium text-blue-600">
            Parent Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            My Children
          </h1>

          <p className="mt-2 text-gray-600">
            View and manage information for each child linked to your
            account.
          </p>
        </div>

        {/* Children */}
        {parent.children.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              No children linked
            </h2>

            <p className="mt-2 text-gray-500">
              No students are currently connected to your parent
              account.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {parent.children.map((relationship) => {
              const child = relationship.student;

              const completedResults = child.results.filter(
                (result) => result.totalScore !== null
              );

              const average =
                completedResults.length > 0
                  ? completedResults.reduce(
                      (sum, result) =>
                        sum + (result.totalScore ?? 0),
                      0
                    ) / completedResults.length
                  : 0;

              const passed = completedResults.filter(
                (result) => (result.totalScore ?? 0) >= 50
              ).length;

              return (
                <div
                  key={relationship.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  {/* Card header */}
                  <div className="bg-blue-600 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          {child.firstName} {child.lastName}
                        </h2>

                        <p className="mt-1 text-sm text-blue-100">
                          {child.studentNumber}
                        </p>
                      </div>

                      {relationship.isPrimary && (
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          Relationship
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {relationship.relationship ||
                            "Parent / Guardian"}
                        </span>
                      </div>

                      <div className="flex justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          Class
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {child.class?.name || "Not assigned"}
                        </span>
                      </div>

                      <div className="flex justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          Results
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {completedResults.length}
                        </span>
                      </div>

                      <div className="flex justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          Passed
                        </span>

                        <span className="text-sm font-semibold text-green-600">
                          {passed}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Average
                        </span>

                        <span className="text-sm font-bold text-blue-600">
                          {average.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-3">
                      <a
                        href={`/parent/results?studentId=${child.id}`}
                        className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        View Results
                      </a>

                      <a
                        href={`/parent/assignments?studentId=${child.id}`}
                        className="block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        View Assignments
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Parent information */}
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Parent Account
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>

              <p className="mt-1 font-semibold text-gray-900">
                {parent.firstName} {parent.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>

              <p className="mt-1 font-semibold text-gray-900">
                {parent.email || user.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Phone</p>

              <p className="mt-1 font-semibold text-gray-900">
                {parent.phone || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}