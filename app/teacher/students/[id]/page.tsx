"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  class: {
    id: string;
    name: string;
  };
};

type Result = {
  id: string;
  assessmentScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  createdAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
};

type Submission = {
  id: string;
  answer: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  submissions: Submission[];
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type StudentProfileResponse = {
  student: Student;
  results: Result[];
  assignments: Assignment[];
  notes: Note[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(
  firstName: string,
  lastName: string
) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

async function fetchStudent(
  studentId: string
): Promise<StudentProfileResponse> {
  const response = await fetch(
    `/api/teacher/students/${studentId}`,
    {
      cache: "no-store",
    }
  );

  const contentType =
    response.headers.get("content-type") || "";

  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `The student API returned an unexpected response. Status: ${response.status}`
    );
  }

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "The student API returned invalid JSON."
    );
  }

  if (!response.ok) {
    const errorData = data as {
      error?: string;
    };

    throw new Error(
      errorData?.error ||
        "Failed to load student profile."
    );
  }

  return data as StudentProfileResponse;
}

export default function TeacherStudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [studentId, setStudentId] = useState("");

  const [data, setData] =
    useState<StudentProfileResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      try {
        setLoading(true);
        setError("");

        const resolvedParams = await params;

        if (!resolvedParams.id) {
          throw new Error(
            "Student ID is missing."
          );
        }

        if (active) {
          setStudentId(resolvedParams.id);
        }

        const result = await fetchStudent(
          resolvedParams.id
        );

        if (active) {
          setData(result);
        }
      } catch (err) {
        console.error(
          "Teacher student profile error:",
          err
        );

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load student profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-9 w-64 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />

            <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm lg:col-span-2" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Unable to load student
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "The student profile could not be loaded."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/teacher/students"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Students
            </Link>

            {studentId && (
              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const {
    student,
    results,
    assignments,
    notes,
  } = data;

  const totalResults = results.length;

  const averageScore =
    totalResults > 0
      ? results.reduce(
          (total, result) =>
            total +
            (result.totalScore ?? 0),
          0
        ) / totalResults
      : null;

  const submittedAssignments =
    assignments.filter(
      (assignment) =>
        assignment.submissions.length > 0
    ).length;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6">
          <Link
            href="/teacher/students"
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to My Students
          </Link>

          <div className="mt-4">
            <p className="text-sm font-medium text-blue-600">
              EduNova Suite
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Student Profile
            </h1>

            <p className="mt-2 text-slate-500">
              View this student's information,
              results, assignments and notes.
            </p>
          </div>
        </div>

        {/* PROFILE HERO */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-7 text-white shadow-lg md:p-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold ring-4 ring-white/10">
                {getInitials(
                  student.firstName,
                  student.lastName
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-blue-100">
                  Student
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {student.firstName}{" "}
                  {student.lastName}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {student.studentNumber}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {student.class.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-100">
                Results Average
              </p>

              <p className="mt-1 text-3xl font-bold">
                {averageScore !== null
                  ? averageScore.toFixed(1)
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Results
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {results.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Assignments
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {assignments.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Submitted
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {submittedAssignments}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              My Notes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {notes.length}
            </p>
          </div>
        </section>

        {/* PERSONAL INFORMATION */}
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Student Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Basic information for this student.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Full Name
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {student.firstName}{" "}
                {student.lastName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Student Number
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {student.studentNumber}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Class
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {student.class.name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 break-all font-medium text-slate-900">
                {student.email ||
                  "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {student.phone ||
                  "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Date of Birth
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {formatDate(
                  student.dateOfBirth
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Gender
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {student.gender ||
                  "Not provided"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Address
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {student.address ||
                  "Not provided"}
              </p>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Results
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Results recorded for this student.
              </p>
            </div>

            <span className="text-sm font-semibold text-blue-600">
              {results.length} records
            </span>
          </div>

          {results.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No results have been entered for
              this student yet.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="pb-3 font-semibold">
                      Subject
                    </th>

                    <th className="pb-3 font-semibold">
                      Assessment
                    </th>

                    <th className="pb-3 font-semibold">
                      Exam
                    </th>

                    <th className="pb-3 font-semibold">
                      Total
                    </th>

                    <th className="pb-3 font-semibold">
                      Grade
                    </th>

                    <th className="pb-3 font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4">
                        <p className="font-semibold text-slate-900">
                          {result.subject.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {result.subject.code}
                        </p>
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {result.assessmentScore ??
                          "—"}
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {result.examScore ?? "—"}
                      </td>

                      <td className="py-4 font-semibold text-slate-900">
                        {result.totalScore ??
                          "—"}
                      </td>

                      <td className="py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {result.grade || "—"}
                        </span>
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {formatDate(
                          result.createdAt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ASSIGNMENTS */}
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Assignments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assignments given to this student
              through your classes.
            </p>
          </div>

          {assignments.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No assignments found for this
              student.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {assignments.map((assignment) => {
                const submission =
                  assignment.submissions[0];

                return (
                  <div
                    key={assignment.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {assignment.title}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-blue-600">
                          {assignment.subject.name}
                        </p>

                        {assignment.description && (
                          <p className="mt-3 text-sm leading-6 text-slate-500">
                            {assignment.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {submission ? (
                          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                            {submission.status}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            Not Submitted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Due Date
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(
                            assignment.dueDate
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Grade
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {submission?.grade ??
                            "Not graded"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Submitted
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {submission?.submittedAt
                            ? formatDate(
                                submission.submittedAt
                              )
                            : "Not submitted"}
                        </p>
                      </div>
                    </div>

                    {submission?.feedback && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Feedback
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* NOTES */}
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                My Notes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Notes you have written about this
                student.
              </p>
            </div>

            <Link
              href="/teacher/notes"
              className="inline-flex w-fit rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Manage Notes
            </Link>
          </div>

          {notes.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                You have not written any notes for
                this student yet.
              </p>

              <Link
                href="/teacher/notes"
                className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Write a note →
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <h3 className="font-semibold text-slate-900">
                      {note.title}
                    </h3>

                    <span className="text-xs text-slate-400">
                      {formatDate(
                        note.createdAt
                      )}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}