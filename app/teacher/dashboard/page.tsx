import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export default async function TeacherDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!session || session.role !== "TEACHER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Access Denied
          </h1>

          <p className="mt-2 text-slate-500">
            You do not have permission to access the teacher portal.
          </p>

          <Link
            href="/login"
            className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      schoolId: true,
      teacherId: true,
    },
  });

  if (!user || !user.schoolId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-red-900">
            Account Error
          </h1>

          <p className="mt-2 text-red-800">
            Your account could not be loaded correctly. Please contact the
            school administrator.
          </p>
        </div>
      </div>
    );
  }

  let teacher = user.teacherId
    ? await prisma.teacher.findFirst({
        where: {
          id: user.teacherId,
          schoolId: user.schoolId,
        },
      })
    : null;

  if (!teacher && user.email) {
    teacher = await prisma.teacher.findFirst({
      where: {
        email: user.email,
        schoolId: user.schoolId,
      },
    });

    if (teacher) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          teacherId: teacher.id,
        },
      });
    }
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-2xl font-bold text-amber-900">
            Teacher profile not found
          </h1>

          <p className="mt-2 text-amber-800">
            Your account exists, but no teacher profile could be found using
            your login email.
          </p>

          <p className="mt-4 text-sm text-amber-700">
            Make sure the email on your Teacher profile matches the email you
            use to log in.
          </p>
        </div>
      </div>
    );
  }

  const [subjects, assignments, resultsEntered, tasks, studentNotes] =
    await Promise.all([
      prisma.classSubject.findMany({
        where: {
          teacherId: teacher.id,
          class: {
            schoolId: user.schoolId,
          },
          subject: {
            schoolId: user.schoolId,
          },
        },
        include: {
          class: true,
          subject: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.assignment.findMany({
        where: {
          teacherId: teacher.id,
          class: {
            schoolId: user.schoolId,
          },
          subject: {
            schoolId: user.schoolId,
          },
        },
        include: {
          class: true,
          subject: true,
          submissions: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),

      prisma.result.count({
        where: {
          teacherId: teacher.id,
          student: {
            schoolId: user.schoolId,
          },
        },
      }),

      prisma.staffTask.findMany({
        where: {
          schoolId: user.schoolId,
          userId: user.id,
        },
        orderBy: [
          {
            completed: "asc",
          },
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 6,
      }),

      prisma.studentNote.findMany({
        where: {
          schoolId: user.schoolId,
          authorId: user.id,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
    ]);

  const classIds = [...new Set(subjects.map((item) => item.classId))];

  const studentCount =
    classIds.length > 0
      ? await prisma.student.count({
          where: {
            schoolId: user.schoolId,
            classId: {
              in: classIds,
            },
          },
        })
      : 0;

  const pendingSubmissions = assignments.reduce(
    (total, assignment) =>
      total +
      assignment.submissions.filter(
        (submission) => submission.status === "SUBMITTED"
      ).length,
    0
  );

  const incompleteTasks = tasks.filter(
    (task) => !task.completed
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
          <div>
            <p className="text-sm font-medium text-blue-600">
              EduNova Suite
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Teacher Portal
            </h1>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        {/* HERO */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-7 text-white shadow-lg md:p-9">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-100">
              Welcome back
            </p>

            <h2 className="mt-1 text-3xl font-bold md:text-4xl">
              {teacher.firstName} {teacher.lastName}
            </h2>

            <p className="mt-3 text-blue-100">
              Manage your classes, assignments, results, tasks and student
              notes from one place.
            </p>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Classes</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {classIds.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Subjects</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {subjects.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Students</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {studentCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Results Entered
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {resultsEntered}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Tasks Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {incompleteTasks}
            </p>
          </div>
        </section>

        {/* WORKSPACE */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* TASKS */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My Tasks
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Keep track of work you need to complete.
                </p>
              </div>

              <Link
                href="/teacher/tasks"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Manage
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  You have no tasks yet.
                </p>

                <Link
                  href="/teacher/tasks"
                  className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Create your first task →
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            task.completed
                              ? "bg-green-500"
                              : "bg-orange-500"
                          }`}
                        />

                        <p
                          className={`font-semibold ${
                            task.completed
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>

                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {task.description}
                        </p>
                      )}

                      {task.dueDate && (
                        <p className="mt-2 text-xs font-medium text-slate-400">
                          Due{" "}
                          {new Date(
                            task.dueDate
                          ).toLocaleDateString("en-GH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        task.completed
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {task.completed
                        ? "Done"
                        : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STUDENT NOTES */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Student Notes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Notes you have written for your students.
                </p>
              </div>

              <Link
                href="/teacher/notes"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Manage
              </Link>
            </div>

            {studentNotes.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  You have not written any student notes yet.
                </p>

                <Link
                  href="/teacher/notes"
                  className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Write a student note →
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {studentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {note.title}
                        </p>

                        <p className="mt-1 text-sm font-medium text-indigo-600">
                          {note.student.firstName}{" "}
                          {note.student.lastName}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(
                          note.createdAt
                        ).toLocaleDateString("en-GH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CLASSES + QUICK ACTIONS */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              My Classes & Subjects
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Classes and subjects assigned to you.
            </p>

            {subjects.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No classes or subjects have been assigned to you yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {subjects.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.subject.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.class.name}
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        {item.subject.code}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h2>

            <div className="mt-5 grid gap-3">
              <Link
                href="/teacher/assignments"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="font-semibold text-slate-900">
                  Assignments
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create assignments and review submissions.
                </p>
              </Link>

              <Link
                href="/teacher/results"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="font-semibold text-slate-900">
                  Enter Results
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Enter assessments and examination scores.
                </p>
              </Link>

              <Link
                href="/teacher/notes"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <p className="font-semibold text-slate-900">
                  Student Notes
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Write notes and feedback for individual students.
                </p>
              </Link>

              <Link
                href="/teacher/tasks"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 hover:bg-orange-50"
              >
                <p className="font-semibold text-slate-900">
                  My Tasks
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Organize your own teaching tasks and deadlines.
                </p>
              </Link>

              <Link
                href="/teacher/students"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-green-200 hover:bg-green-50"
              >
                <p className="font-semibold text-slate-900">
                  My Students
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  View students in your assigned classes.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* RECENT ASSIGNMENTS */}
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest assignments and submission activity.
              </p>
            </div>

            <span className="text-sm font-medium text-orange-600">
              {pendingSubmissions} pending submissions
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              You have not created any assignments yet.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3 font-medium">
                      Assignment
                    </th>

                    <th className="pb-3 font-medium">
                      Subject
                    </th>

                    <th className="pb-3 font-medium">
                      Class
                    </th>

                    <th className="pb-3 font-medium">
                      Submissions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="border-b last:border-0"
                    >
                      <td className="py-4 font-medium text-slate-900">
                        {assignment.title}
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {assignment.subject.name}
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {assignment.class.name}
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {assignment.submissions.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}