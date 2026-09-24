"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Teacher = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  qualification: string | null;
  specialization: string | null;
  position: string | null;
  schoolId: string;
};

export default function TeachersPage() {
  const [teachers, setTeachers] =
    useState<Teacher[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [positionFilter, setPositionFilter] =
    useState("ALL");

  async function loadTeachers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/teachers"
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load teachers."
        );
      }

      setTeachers(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load teachers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  const positions = useMemo(() => {
    const values = teachers
      .map(
        (teacher) =>
          teacher.position?.trim()
      )
      .filter(
        (position): position is string =>
          Boolean(position)
      );

    return Array.from(
      new Set(values)
    ).sort();
  }, [teachers]);

  const filteredTeachers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return teachers.filter(
        (teacher) => {
          const matchesSearch =
            !query ||
            `${teacher.firstName} ${teacher.lastName}`
              .toLowerCase()
              .includes(query) ||
            teacher.employeeNumber
              .toLowerCase()
              .includes(query) ||
            teacher.email
              ?.toLowerCase()
              .includes(query) ||
            teacher.phone
              .toLowerCase()
              .includes(query) ||
            teacher.position
              ?.toLowerCase()
              .includes(query);

          const matchesPosition =
            positionFilter === "ALL" ||
            teacher.position ===
              positionFilter;

          return (
            matchesSearch &&
            matchesPosition
          );
        }
      );
    }, [
      teachers,
      search,
      positionFilter,
    ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border bg-white p-12 text-center text-gray-500">
            Loading teachers...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Academic
            </p>

            <h1 className="mt-1 text-3xl font-black text-gray-900">
              Teachers
            </h1>

            <p className="mt-2 text-gray-500">
              Manage teaching staff and their
              professional information.
            </p>
          </div>

          <Link
            href="/admin/teachers/new"
            className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Teacher
          </Link>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total Teachers
            </p>

            <p className="mt-2 text-3xl font-black text-gray-900">
              {teachers.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Male
            </p>

            <p className="mt-2 text-3xl font-black text-gray-900">
              {
                teachers.filter(
                  (teacher) =>
                    teacher.gender
                      ?.toLowerCase() ===
                    "male"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Female
            </p>

            <p className="mt-2 text-3xl font-black text-gray-900">
              {
                teachers.filter(
                  (teacher) =>
                    teacher.gender
                      ?.toLowerCase() ===
                    "female"
                ).length
              }
            </p>
          </div>
        </div>

        {/* FILTERS */}

        <div className="mb-6 rounded-2xl border bg-white p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Search teachers
              </label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Name, employee number, phone, email or position..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Position
              </label>

              <select
                value={positionFilter}
                onChange={(event) =>
                  setPositionFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option value="ALL">
                  All positions
                </option>

                {positions.map(
                  (position) => (
                    <option
                      key={position}
                      value={position}
                    >
                      {position}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-black text-gray-900">
              Staff Directory
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredTeachers.length} teacher
              {filteredTeachers.length === 1
                ? ""
                : "s"} displayed
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">
                    Teacher
                  </th>

                  <th className="px-6 py-4">
                    Employee No.
                  </th>

                  <th className="px-6 py-4">
                    Position
                  </th>

                  <th className="px-6 py-4">
                    Gender
                  </th>

                  <th className="px-6 py-4">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredTeachers.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <div className="text-4xl">
                        👨‍🏫
                      </div>

                      <p className="mt-3 font-bold text-gray-900">
                        No teachers found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search
                        or position filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(
                    (teacher) => (
                      <tr
                        key={teacher.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-blue-50">
                              {teacher.photoUrl ? (
                                <img
                                  src={
                                    teacher.photoUrl
                                  }
                                  alt={`${teacher.firstName} ${teacher.lastName}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center font-black text-blue-700">
                                  {teacher.firstName
                                    .charAt(0)
                                    .toUpperCase()}
                                  {teacher.lastName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-bold text-gray-900">
                                {
                                  teacher.firstName
                                }{" "}
                                {
                                  teacher.lastName
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {teacher.email ||
                                  "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 font-semibold text-gray-700">
                          {
                            teacher.employeeNumber
                          }
                        </td>

                        <td className="px-6 py-5">
                          {teacher.position ? (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {
                                teacher.position
                              }
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Not specified
                            </span>
                          )}

                          {teacher.specialization && (
                            <p className="mt-2 text-xs text-gray-400">
                              {
                                teacher.specialization
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 capitalize text-gray-700">
                          {teacher.gender ||
                            "—"}
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-gray-700">
                            {teacher.phone}
                          </p>

                          {teacher.qualification && (
                            <p className="mt-1 text-xs text-gray-400">
                              {
                                teacher.qualification
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/admin/teachers/${teacher.id}`}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-bold text-blue-900">
            GES reporting
          </p>

          <p className="mt-1 text-sm text-blue-700">
            Keep teacher gender and position
            information accurate. These records are
            used by the GES reporting section to
            summarize active school staff.
          </p>
        </div>
      </div>
    </main>
  );
}