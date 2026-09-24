"use client";

import { useEffect, useMemo, useState } from "react";

type SchoolClass = {
  id: string;
  name: string;
};

type AttendanceStudent = {
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  status: string;
  remarks: string;
  attendanceId: string | null;
};

const statuses = [
  {
    value: "PRESENT",
    label: "Present",
  },
  {
    value: "ABSENT",
    label: "Absent",
  },
  {
    value: "LATE",
    label: "Late",
  },
  {
    value: "EXCUSED",
    label: "Excused",
  },
];

export default function AdminAttendancePage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [students, setStudents] = useState<
    AttendanceStudent[]
  >([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    return {
      present: students.filter(
        (student) => student.status === "PRESENT"
      ).length,
      absent: students.filter(
        (student) => student.status === "ABSENT"
      ).length,
      late: students.filter(
        (student) => student.status === "LATE"
      ).length,
      excused: students.filter(
        (student) => student.status === "EXCUSED"
      ).length,
    };
  }, [students]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (classId && date) {
      loadAttendance();
    }
  }, [classId, date]);

  async function loadClasses() {
    try {
      setLoadingClasses(true);
      setError("");

      const response = await fetch("/api/classes");

      if (!response.ok) {
        throw new Error("Failed to load classes");
      }

      const data = await response.json();

      const loadedClasses = Array.isArray(data)
        ? data
        : Array.isArray(data.classes)
        ? data.classes
        : [];

      setClasses(loadedClasses);

      if (loadedClasses.length > 0) {
        setClassId(loadedClasses[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  }

  async function loadAttendance() {
    try {
      setLoadingAttendance(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/attendance?classId=${encodeURIComponent(
          classId
        )}&date=${encodeURIComponent(date)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load attendance"
        );
      }

      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
      setStudents([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance."
      );
    } finally {
      setLoadingAttendance(false);
    }
  }

  function updateStudent(
    studentId: string,
    field: "status" | "remarks",
    value: string
  ) {
    setStudents((current) =>
      current.map((student) =>
        student.studentId === studentId
          ? {
              ...student,
              [field]: value,
            }
          : student
      )
    );
  }

  function markAll(status: string) {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        status,
      }))
    );
  }

  async function saveAttendance() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId,
            date,
            records: students.map((student) => ({
              studentId: student.studentId,
              status: student.status,
              remarks: student.remarks,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save attendance"
        );
      }

      setMessage(
        data.message ||
          "Attendance saved successfully."
      );

      await loadAttendance();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Attendance
        </h1>

        <p className="mt-2 text-gray-600">
          Record and manage daily student attendance.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Class
            </label>

            <select
              value={classId}
              onChange={(event) =>
                setClassId(event.target.value)
              }
              disabled={loadingClasses}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {loadingClasses ? (
                <option>Loading classes...</option>
              ) : classes.length === 0 ? (
                <option value="">
                  No classes available
                </option>
              ) : (
                classes.map((schoolClass) => (
                  <option
                    key={schoolClass.id}
                    value={schoolClass.id}
                  >
                    {schoolClass.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {students.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Present
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {summary.present}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Absent
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {summary.absent}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Late
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {summary.late}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Excused
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {summary.excused}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => markAll("PRESENT")}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Mark All Present
            </button>

            <button
              type="button"
              onClick={() => markAll("ABSENT")}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Mark All Absent
            </button>

            <button
              type="button"
              onClick={() => markAll("LATE")}
              className="rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yellow-600"
            >
              Mark All Late
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Admission No.
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr
                      key={student.studentId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">
                          {student.firstName}{" "}
                          {student.lastName}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.studentNumber}
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={student.status}
                          onChange={(event) =>
                            updateStudent(
                              student.studentId,
                              "status",
                              event.target.value
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:border-blue-500"
                        >
                          {statuses.map((status) => (
                            <option
                              key={status.value}
                              value={status.value}
                            >
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <input
                          type="text"
                          value={student.remarks}
                          onChange={(event) =>
                            updateStudent(
                              student.studentId,
                              "remarks",
                              event.target.value
                            )
                          }
                          placeholder="Optional"
                          className="w-full min-w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={saveAttendance}
                disabled={saving || loadingAttendance}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save Attendance"}
              </button>
            </div>
          </div>
        </>
      )}

      {loadingAttendance && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          Loading attendance...
        </div>
      )}

      {!loadingAttendance &&
        !loadingClasses &&
        classId &&
        students.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              No students found
            </h2>

            <p className="mt-2 text-gray-500">
              There are no students assigned to this
              class yet.
            </p>
          </div>
        )}
    </div>
  );
}