import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  /*
   * Only administrators can access the admin dashboard.
   */
  if (
    !session ||
    (session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN")
  ) {
    redirect("/login");
  }

  /*
   * Re-check the authenticated user against the database.
   *
   * This is important because the session cookie contains the
   * schoolId, but we still want to verify that:
   * - the user still exists
   * - the user is still active
   * - the user still belongs to that school
   */
  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      active: true,
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    select: {
      id: true,
      schoolId: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  /*
   * IMPORTANT:
   * Always load the school from the authenticated user's schoolId.
   *
   * Never use findFirst() here because that could load another
   * school's data in a multi-school system.
   */
  const school = await prisma.school.findUnique({
    where: {
      id: user.schoolId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!school) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            School account not found.
          </h2>

          <p className="mt-2 text-sm text-red-800">
            Your administrator account is not currently connected to
            a valid school. Please contact the system administrator.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Every statistic below is explicitly scoped to the
   * authenticated administrator's school.
   */
  const [
    studentCount,
    teacherCount,
    classCount,
    subjectCount,
    assignmentCount,
    resultCount,
    userCount,
  ] = await Promise.all([
    prisma.student.count({
      where: {
        schoolId: school.id,
      },
    }),

    prisma.teacher.count({
      where: {
        schoolId: school.id,
      },
    }),

    prisma.schoolClass.count({
      where: {
        schoolId: school.id,
      },
    }),

    prisma.subject.count({
      where: {
        schoolId: school.id,
      },
    }),

    prisma.assignment.count({
      where: {
        class: {
          schoolId: school.id,
        },
      },
    }),

    prisma.result.count({
      where: {
        class: {
          schoolId: school.id,
        },
      },
    }),

    prisma.user.count({
      where: {
        schoolId: school.id,
      },
    }),
  ]);

  const cards = [
    {
      title: "Students",
      value: studentCount,
      href: "/admin/students",
      description: "Manage enrolled students",
    },
    {
      title: "Teachers",
      value: teacherCount,
      href: "/admin/teachers",
      description: "Manage teaching staff",
    },
    {
      title: "Classes",
      value: classCount,
      href: "/admin/classes",
      description: "Manage school classes",
    },
    {
      title: "Subjects",
      value: subjectCount,
      href: "/admin/subjects",
      description: "Manage academic subjects",
    },
    {
      title: "Assignments",
      value: assignmentCount,
      href: "/admin/assignments",
      description: "View teacher assignments",
    },
    {
      title: "Results",
      value: resultCount,
      href: "/admin/results",
      description: "Manage student results",
    },
    {
      title: "Users",
      value: userCount,
      href: "/admin/settings",
      description: "Manage system accounts",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            EduNova Suite
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Welcome back. Here is an overview of {school.name}.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-3 py-2 text-blue-600">
                  →
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                {card.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/students/new"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <p className="font-semibold text-slate-900">
                  Add Student
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Register a new student
                </p>
              </Link>

              <Link
                href="/admin/teachers/new"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <p className="font-semibold text-slate-900">
                  Add Teacher
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Register a teacher
                </p>
              </Link>

              <Link
                href="/admin/classes/new"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <p className="font-semibold text-slate-900">
                  Add Class
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new class
                </p>
              </Link>

              <Link
                href="/admin/subjects/new"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <p className="font-semibold text-slate-900">
                  Add Subject
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create an academic subject
                </p>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              School Management
            </h2>

            <div className="mt-5 space-y-3">
              <Link
                href="/admin/schools"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">
                  School Information
                </span>

                <span className="text-slate-400">
                  →
                </span>
              </Link>

              <Link
                href="/admin/website"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">
                  Website Customization
                </span>

                <span className="text-slate-400">
                  →
                </span>
              </Link>

              <Link
                href="/admin/class-subjects"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">
                  Class & Subject Assignments
                </span>

                <span className="text-slate-400">
                  →
                </span>
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">
                  System Settings
                </span>

                <span className="text-slate-400">
                  →
                </span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}