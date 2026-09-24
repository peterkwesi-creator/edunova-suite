"use client";

import { useEffect, useMemo, useState } from "react";

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  remarks: string | null;
};

type Child = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  relationship: string | null;
  class: {
    id: string;
    name: string;
  } | null;
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendancePercentage: number;
  };
  attendance: AttendanceRecord[];
};

type ParentAttendanceResponse = {
  parent: {
    firstName: string;
    lastName: string;
  };
  children: Child[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status: string) {
  switch (status.toUpperCase()) {
    case "PRESENT":
      return "bg-green-100 text-green-700";

    case "ABSENT":
      return "bg-red-100 text-red-700";

    case "LATE":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function ParentAttendancePage() {
  const [data, setData] =
    useState<ParentAttendanceResponse | null>(null);

  const [selectedChildId, setSelectedChildId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/parent/attendance"
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load attendance."
          );
        }

        setData(result);

        if (result.children?.length > 0) {
          setSelectedChildId(result.children[0].id);
        }
      } catch (err) {
        console.error(
          "PARENT ATTENDANCE PAGE ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load attendance."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  const selectedChild = useMemo(() => {
    if (!data || !selectedChildId) {
      return null;
    }

    return (
      data.children.find(
        (child) => child.id === selectedChildId
      ) || null
    );
  }, [data, selectedChildId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="text-gray-600">
              Loading attendance...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-700">
              Unable to load attendance
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data || data.children.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-600">
              Parent Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Attendance
            </h1>
          </div>

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
              📅
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              No children found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              Your parent account is not currently connected
              to any students.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const summary = selectedChild?.summary;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            Parent Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Attendance
          </h1>

          <p className="mt-2 text-gray-500">
            Monitor your child's school attendance and
            attendance history.
          </p>
        </div>

        {/* Child Selector */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <label
            htmlFor="child"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Select Child
          </label>

          <select
            id="child"
            value={selectedChildId}
            onChange={(event) =>
              setSelectedChildId(event.target.value)
            }
            className="w-full max-w-md rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {data.children.map((child) => (
              <option
                key={child.id}
                value={child.id}
              >
                {child.firstName} {child.lastName}
                {child.class
                  ? ` — ${child.class.name}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedChild && summary && (
          <>
            {/* Student Card */}
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
              <p className="text-sm text-blue-100">
                Student
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {selectedChild.firstName}{" "}
                {selectedChild.lastName}
              </h2>

              <div className="mt-2 flex flex-wrap gap-3 text-sm text-blue-100">
                <span>
                  Student No:{" "}
                  {selectedChild.studentNumber}
                </span>

                {selectedChild.class && (
                  <span>
                    Class: {selectedChild.class.name}
                  </span>
                )}

                {selectedChild.relationship && (
                  <span>
                    Relationship:{" "}
                    {selectedChild.relationship}
                  </span>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Attendance Rate
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {summary.attendancePercentage.toFixed(
                    1
                  )}
                  %
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Present
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {summary.presentDays}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Days present
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Absent
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {summary.absentDays}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Days absent
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Late
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {summary.lateDays}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Late arrivals
                </p>
              </div>
            </div>

            {/* Attendance Progress */}
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Overall Attendance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {summary.presentDays} of{" "}
                    {summary.totalDays} recorded days
                    present
                  </p>
                </div>

                <span className="text-lg font-bold text-blue-600">
                  {summary.attendancePercentage.toFixed(
                    1
                  )}
                  %
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(
                      summary.attendancePercentage,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Attendance History */}
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Attendance History
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Most recent attendance records are shown
                  first.
                </p>
              </div>

              {selectedChild.attendance.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
                    📅
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">
                    No attendance records
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    There are currently no attendance
                    records for this student.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                          <th className="px-6 py-4">
                            Date
                          </th>

                          <th className="px-6 py-4">
                            Status
                          </th>

                          <th className="px-6 py-4">
                            Remarks
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedChild.attendance.map(
                          (record) => (
                            <tr
                              key={record.id}
                              className="border-b border-gray-100 last:border-0"
                            >
                              <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                {formatDate(
                                  record.date
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                    record.status
                                  )}`}
                                >
                                  {record.status}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-500">
                                {record.remarks || "—"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="space-y-3 p-4 md:hidden">
                    {selectedChild.attendance.map(
                      (record) => (
                        <div
                          key={record.id}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-800">
                              {formatDate(record.date)}
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                record.status
                              )}`}
                            >
                              {record.status}
                            </span>
                          </div>

                          {record.remarks && (
                            <p className="mt-3 text-sm text-gray-500">
                              {record.remarks}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}