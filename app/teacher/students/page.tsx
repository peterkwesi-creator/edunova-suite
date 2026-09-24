"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  class: {
    id: string;
    name: string;
  };
};

async function fetchStudents(): Promise<Student[]> {
  const response = await fetch("/api/teacher/students", {
    cache: "no-store",
  });

  const contentType =
    response.headers.get("content-type") || "";

  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `The students API returned an unexpected response. Status: ${response.status}`
    );
  }

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "The students API returned invalid JSON."
    );
  }

  if (!response.ok) {
    const errorData = data as {
      error?: string;
    };

    throw new Error(
      errorData?.error ||
        `Failed to load students. Status: ${response.status}`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "The students API returned an invalid student list."
    );
  }

  return data as Student[];
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>(
    []
  );

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchStudents();

      setStudents(data);
    } catch (err) {
      console.error(
        "Teacher students page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const classes = useMemo(() => {
    const classMap = new Map<string, string>();

    students.forEach((student) => {
      if (student.class) {
        classMap.set(
          student.class.id,
          student.class.name
        );
      }
    });

    return Array.from(classMap.entries())
      .map(([id, name]) => ({
        id,
        name,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const fullName =
        `${student.firstName} ${student.lastName}`.toLowerCase();

      const matchesSearch =
        !query ||
        student.firstName
          .toLowerCase()
          .includes(query) ||
        student.lastName
          .toLowerCase()
          .includes(query) ||
        fullName.includes(query) ||
        student.studentNumber
          .toLowerCase()
          .includes(query);

      const matchesClass =
        !classFilter ||
        student.class.id === classFilter;

      return (
        matchesSearch && matchesClass
      );
    });
  }, [
    students,
    search,
    classFilter,
  ]);

  function clearFilters() {
    setSearch("");
    setClassFilter("");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              EduNova Suite
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              My Students
            </h1>

            <p className="mt-2 text-slate-500">
              View and manage students in your
              assigned classes.
            </p>
          </div>

          <Link
            href="/teacher/dashboard"
            className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-red-900">
                Unable to load students
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadStudents}
              className="w-fit rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* CONTENT */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* TOOLBAR */}
          <div className="border-b border-slate-200 p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Student Directory
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Loading students..."
                    : `${filteredStudents.length} of ${students.length} students shown`}
                </p>
              </div>

              {!loading &&
                students.length > 0 && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {/* SEARCH */}
                    <div className="relative">
                      <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                          setSearch(
                            event.target.value
                          )
                        }
                        placeholder="Search students..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
                      />
                    </div>

                    {/* CLASS FILTER */}
                    <select
                      value={classFilter}
                      onChange={(event) =>
                        setClassFilter(
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        All Classes
                      </option>

                      {classes.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="p-10">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="mt-4 font-medium text-slate-700">
                  Loading your students...
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Please wait.
                </p>
              </div>
            </div>
          ) : students.length === 0 ? (
            /* NO STUDENTS */
            <div className="p-10 text-center md:p-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                👨‍🎓
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No students found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                You currently have no students in
                your assigned classes. Ask the school
                administrator to check your class and
                subject assignments.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            /* NO SEARCH RESULTS */
            <div className="p-10 text-center md:p-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                🔎
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No matching students
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or class
                filter.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-sm text-slate-500">
                      <th className="px-6 py-4 font-semibold">
                        Student
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Student Number
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Class
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map(
                      (student) => (
                        <tr
                          key={student.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                {student.firstName
                                  .charAt(0)
                                  .toUpperCase()}
                                {student.lastName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {student.firstName}{" "}
                                  {student.lastName}
                                </p>

                                <p className="text-xs text-slate-500">
                                  Student
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {student.studentNumber}
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                              {student.class.name}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/teacher/students/${student.id}`}
                              className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              View Student
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredStudents.map(
                  (student) => (
                    <div
                      key={student.id}
                      className="p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {student.firstName
                            .charAt(0)
                            .toUpperCase()}
                          {student.lastName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {student.firstName}{" "}
                            {student.lastName}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {student.studentNumber}
                          </p>

                          <span className="mt-2 inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                            {student.class.name}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/teacher/students/${student.id}`}
                        className="mt-4 block rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        View Student
                      </Link>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}