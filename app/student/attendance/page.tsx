"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AttendanceRecord = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  remarks: string | null;
  className: string;
};

type AttendanceResponse = {
  student: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    className: string;
  };
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  };
  records: AttendanceRecord[];
};

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentAttendancePage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance(selectedMonth: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/student/attendance?month=${selectedMonth}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load attendance"
        );
      }

      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load attendance"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance(month);
  }, [month]);

  const groupedRecords = useMemo(() => {
    if (!data?.records) return [];

    return [...data.records].sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );
  }, [data]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/student/dashboard"
              className="mb-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-gray-900">
              My Attendance
            </h1>

            <p className="mt-1 text-gray-600">
              View your attendance records and attendance rate.
            </p>
          </div>

          <div>
            <label
              htmlFor="month"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Select Month
            </label>

            <input
              id="month"
              type="month"
              value={month}
              onChange={(event) =>
                setMonth(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="text-gray-600">
              Loading attendance...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-800">
              Unable to load attendance
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={() => loadAttendance(month)}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* Student Information */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {data.student.firstName}{" "}
                    {data.student.lastName}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Student Number:{" "}
                    <span className="font-medium text-gray-700">
                      {data.student.studentNumber}
                    </span>
                  </p>

                  <p className="text-sm text-gray-500">
                    Class:{" "}
                    <span className="font-medium text-gray-700">
                      {data.student.className}
                    </span>
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 px-5 py-3 text-center">
                  <p className="text-sm text-blue-700">
                    Attendance Rate
                  </p>

                  <p className="text-3xl font-bold text-blue-700">
                    {data.summary.attendanceRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Days
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data.summary.total}
                </p>
              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm text-green-700">
                  Present
                </p>

                <p className="mt-2 text-3xl font-bold text-green-700">
                  {data.summary.present}
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm text-red-700">
                  Absent
                </p>

                <p className="mt-2 text-3xl font-bold text-red-700">
                  {data.summary.absent}
                </p>
              </div>

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                <p className="text-sm text-yellow-700">
                  Late
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-700">
                  {data.summary.late}
                </p>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Attendance Records
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Attendance records for{" "}
                  {new Date(`${month}-01`).toLocaleDateString(
                    "en-GH",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              {groupedRecords.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                    📅
                  </div>

                  <h3 className="font-semibold text-gray-900">
                    No attendance records
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    There are no attendance records for this
                    month yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Date
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Class
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Status
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Remarks
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {groupedRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatDate(record.date)}
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-600">
                              {record.className}
                            </td>

                            <td className="px-6 py-4">
                              <StatusBadge
                                status={record.status}
                              />
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-600">
                              {record.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="divide-y divide-gray-100 md:hidden">
                    {groupedRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatDate(record.date)}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {record.className}
                            </p>
                          </div>

                          <StatusBadge
                            status={record.status}
                          />
                        </div>

                        {record.remarks && (
                          <p className="mt-3 text-sm text-gray-600">
                            <span className="font-medium">
                              Remarks:
                            </span>{" "}
                            {record.remarks}
                          </p>
                        )}
                      </div>
                    ))}
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

function StatusBadge({
  status,
}: {
  status: "PRESENT" | "ABSENT" | "LATE";
}) {
  const styles = {
    PRESENT:
      "bg-green-100 text-green-800 border-green-200",
    ABSENT:
      "bg-red-100 text-red-800 border-red-200",
    LATE:
      "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const labels = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LATE: "Late",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}