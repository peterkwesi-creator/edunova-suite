"use client";

import { useEffect, useMemo, useState } from "react";

type Term = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type AcademicYear = {
  id: string;
  name: string;
  isCurrent: boolean;
  terms: Term[];
};

type TimetableEntry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  notes: string | null;

  class: {
    id: string;
    name: string;
  };

  subject: {
    id: string;
    name: string;
    code: string;
  };

  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;

  academicYear: {
    id: string;
    name: string;
  };

  term: {
    id: string;
    name: string;
  };
};

const days = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
];

export default function TeacherTimetablePage() {
  const [entries, setEntries] = useState<
    TimetableEntry[]
  >([]);

  const [years, setYears] = useState<
    AcademicYear[]
  >([]);

  const [selectedYear, setSelectedYear] =
    useState("");

  const [selectedTerm, setSelectedTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadYears() {
    try {
      const response = await fetch(
        "/api/admin/academic-years"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load academic years"
        );
      }

      setYears(data);

      const currentYear =
        data.find(
          (year: AcademicYear) =>
            year.isCurrent
        ) ?? data[0];

      if (!currentYear) {
        return;
      }

      setSelectedYear(currentYear.id);

      const currentTerm =
        currentYear.terms.find(
          (term: Term) =>
            term.isCurrent
        ) ?? currentYear.terms[0];

      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load academic years."
      );
    }
  }

  async function loadTimetable() {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (selectedYear) {
        params.set(
          "academicYearId",
          selectedYear
        );
      }

      if (selectedTerm) {
        params.set(
          "termId",
          selectedTerm
        );
      }

      const response = await fetch(
        `/api/timetable?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load timetable"
        );
      }

      setEntries(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load timetable."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYear && selectedTerm) {
      loadTimetable();
    }
  }, [selectedYear, selectedTerm]);

  const currentYear =
    years.find(
      (year) =>
        year.id === selectedYear
    );

  const terms =
    currentYear?.terms ?? [];

  const grouped = useMemo(() => {
    const result: Record<
      number,
      TimetableEntry[]
    > = {};

    for (const day of days) {
      result[day.id] = [];
    }

    for (const entry of entries) {
      if (!result[entry.dayOfWeek]) {
        result[entry.dayOfWeek] = [];
      }

      result[entry.dayOfWeek].push(
        entry
      );
    }

    return result;
  }, [entries]);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            My Timetable
          </h1>

          <p className="mt-2 text-gray-500">
            View your teaching schedule for
            the selected academic period.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2">

          {/* Academic Year */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Academic Year
            </label>

            <select
              value={selectedYear}
              onChange={(event) => {
                const yearId =
                  event.target.value;

                setSelectedYear(yearId);

                const year =
                  years.find(
                    (item) =>
                      item.id === yearId
                  );

                const term =
                  year?.terms.find(
                    (item: Term) =>
                      item.isCurrent
                  ) ??
                  year?.terms[0];

                setSelectedTerm(
                  term?.id ?? ""
                );
              }}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">
                Select academic year
              </option>

              {years.map((year) => (
                <option
                  key={year.id}
                  value={year.id}
                >
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Term
            </label>

            <select
              value={selectedTerm}
              onChange={(event) =>
                setSelectedTerm(
                  event.target.value
                )
              }
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">
                Select term
              </option>

              {terms.map(
                (term: Term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-gray-500">
            Loading timetable...
          </div>
        ) : entries.length === 0 ? (
          /* Empty */
          <div className="rounded-2xl border bg-white p-12 text-center">
            <div className="text-4xl">
              🗓️
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No timetable entries
            </h2>

            <p className="mt-2 text-gray-500">
              No teaching periods have been
              assigned for this academic
              period.
            </p>
          </div>
        ) : (
          /* Timetable */
          <div className="space-y-6">
            {days.map((day) => (
              <section
                key={day.id}
                className="overflow-hidden rounded-2xl border bg-white"
              >
                <div className="border-b bg-gray-50 px-5 py-4">
                  <h2 className="font-black text-gray-900">
                    {day.name}
                  </h2>
                </div>

                <div className="divide-y">
                  {grouped[day.id]?.length ? (
                    grouped[day.id].map(
                      (entry) => (
                        <div
                          key={entry.id}
                          className="grid gap-4 p-5 md:grid-cols-[140px_1fr_auto]"
                        >
                          {/* Time */}
                          <div>
                            <p className="font-black text-blue-600">
                              {
                                entry.startTime
                              }
                            </p>

                            <p className="text-sm text-gray-400">
                              {
                                entry.endTime
                              }
                            </p>
                          </div>

                          {/* Subject */}
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {
                                entry
                                  .subject
                                  .name
                              }
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {
                                entry
                                  .subject
                                  .code
                              }
                            </p>

                            <p className="mt-2 text-sm font-semibold text-gray-700">
                              Class:{" "}
                              {
                                entry
                                  .class
                                  .name
                              }
                            </p>
                          </div>

                          {/* Room */}
                          <div className="text-left md:text-right">
                            {entry.room && (
                              <p className="text-sm font-semibold text-gray-700">
                                Room{" "}
                                {entry.room}
                              </p>
                            )}

                            {entry.notes && (
                              <p className="mt-1 text-xs text-gray-400">
                                {
                                  entry.notes
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="p-5 text-sm text-gray-400">
                      No classes scheduled.
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}