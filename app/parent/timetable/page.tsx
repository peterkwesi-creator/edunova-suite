"use client";

import { useEffect, useMemo, useState } from "react";

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

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  class: {
    id: string;
    name: string;
  } | null;
};

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export default function ParentTimetablePage() {
  const [children, setChildren] = useState<Child[]>(
    []
  );

  const [selectedChildId, setSelectedChildId] =
    useState("");

  const [entries, setEntries] = useState<
    TimetableEntry[]
  >([]);

  const [loadingChildren, setLoadingChildren] =
    useState(true);

  const [loadingTimetable, setLoadingTimetable] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadChildren();
  }, []);

  async function loadChildren() {
    try {
      setLoadingChildren(true);
      setError("");

      const response = await fetch(
        "/api/parent/children",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load your children."
        );
      }

      const loadedChildren: Child[] =
        Array.isArray(data) ? data : [];

      setChildren(loadedChildren);

      if (loadedChildren.length > 0) {
        setSelectedChildId(
          loadedChildren[0].id
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load children."
      );
    } finally {
      setLoadingChildren(false);
    }
  }

  useEffect(() => {
    if (!selectedChildId) return;

    loadTimetable(selectedChildId);
  }, [selectedChildId]);

  async function loadTimetable(
    studentId: string
  ) {
    try {
      setLoadingTimetable(true);
      setError("");

      const response = await fetch(
        `/api/timetable?studentId=${encodeURIComponent(
          studentId
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load timetable."
        );
      }

      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setEntries([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable."
      );
    } finally {
      setLoadingTimetable(false);
    }
  }

  const selectedChild = children.find(
    (child) => child.id === selectedChildId
  );

  const groupedEntries = useMemo(() => {
    const grouped: Record<number, TimetableEntry[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    for (const entry of entries) {
      if (grouped[entry.dayOfWeek]) {
        grouped[entry.dayOfWeek].push(entry);
      }
    }

    return grouped;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Parent Portal
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">
          Timetable
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          View your child&apos;s weekly school
          timetable.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loadingChildren ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Loading children...
          </p>
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">👨‍👩‍👧</div>

          <h2 className="mt-4 text-lg font-black text-gray-900">
            No children linked
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            No student accounts are currently
            linked to your parent account.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Select Child
            </label>

            <select
              value={selectedChildId}
              onChange={(event) =>
                setSelectedChildId(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:max-w-md"
            >
              {children.map((child) => (
                <option
                  key={child.id}
                  value={child.id}
                >
                  {child.firstName}{" "}
                  {child.lastName}
                  {child.class
                    ? ` — ${child.class.name}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedChild && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                Selected Student
              </p>

              <h2 className="mt-1 text-xl font-black text-blue-900">
                {selectedChild.firstName}{" "}
                {selectedChild.lastName}
              </h2>

              <p className="mt-1 text-sm font-medium text-blue-700">
                {selectedChild.class?.name ||
                  "Class not assigned"}
              </p>
            </div>
          )}

          {loadingTimetable ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Loading timetable...
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">🗓️</div>

              <h2 className="mt-4 text-lg font-black text-gray-900">
                No timetable available
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                There is currently no timetable
                published for this child&apos;s
                class.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Academic Year
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {entries[0]
                        ?.academicYear
                        ?.name ||
                        "Current Academic Year"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Term
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {entries[0]?.term?.name ||
                        "Current Term"}
                    </p>
                  </div>

                  <div className="ml-auto rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                    {entries.length} periods
                  </div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-5">
                {DAYS.map((day) => {
                  const dayEntries =
                    groupedEntries[
                      day.value
                    ];

                  return (
                    <div
                      key={day.value}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">
                        <h2 className="font-black text-gray-900">
                          {day.label}
                        </h2>

                        <p className="mt-1 text-xs font-medium text-gray-500">
                          {dayEntries.length}{" "}
                          {dayEntries.length === 1
                            ? "period"
                            : "periods"}
                        </p>
                      </div>

                      <div className="space-y-3 p-3">
                        {dayEntries.length ===
                        0 ? (
                          <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                            <p className="text-xs font-medium text-gray-400">
                              No classes
                            </p>
                          </div>
                        ) : (
                          dayEntries.map(
                            (entry) => (
                              <div
                                key={entry.id}
                                className="rounded-xl border border-gray-100 p-4 shadow-sm"
                              >
                                <p className="text-xs font-bold text-blue-600">
                                  {
                                    entry.startTime
                                  }{" "}
                                  –{" "}
                                  {
                                    entry.endTime
                                  }
                                </p>

                                <h3 className="mt-2 font-black text-gray-900">
                                  {
                                    entry
                                      .subject
                                      .name
                                  }
                                </h3>

                                <p className="mt-1 text-xs font-semibold text-gray-500">
                                  {
                                    entry
                                      .subject
                                      .code
                                  }
                                </p>

                                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                                  <p className="text-xs text-gray-600">
                                    👨‍🏫{" "}
                                    {entry.teacher
                                      ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
                                      : "Teacher not assigned"}
                                  </p>

                                  {entry.room && (
                                    <p className="text-xs text-gray-600">
                                      📍{" "}
                                      {
                                        entry.room
                                      }
                                    </p>
                                  )}

                                  {entry.notes && (
                                    <p className="text-xs text-gray-500">
                                      {
                                        entry.notes
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}