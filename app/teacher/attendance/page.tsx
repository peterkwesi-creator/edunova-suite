"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
};

type ClassSubject = {
  id: string;
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
};

type AttendanceRecord = {
  studentId: string;
  status: string;
  remarks?: string | null;
};

const STATUS_OPTIONS = [
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

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<ClassSubject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});

  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      setLoadingClasses(true);
      setError("");

      const response = await fetch(
        "/api/teacher/class-subjects",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load classes."
        );
      }

      setClasses(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        setClassId(data[0].class.id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load classes."
      );
    } finally {
      setLoadingClasses(false);
    }
  }

  useEffect(() => {
    if (!classId || !date) return;

    loadAttendance();
  }, [classId, date]);

  async function loadAttendance() {
    try {
      setLoadingAttendance(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/teacher/attendance?classId=${encodeURIComponent(
          classId
        )}&date=${encodeURIComponent(date)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load attendance."
        );
      }

      const loadedStudents: Student[] =
        Array.isArray(data.students)
          ? data.students
          : [];

      const loadedAttendance: AttendanceRecord[] =
        Array.isArray(data.attendance)
          ? data.attendance
          : [];

      setStudents(loadedStudents);

      const attendanceMap: Record<
        string,
        AttendanceRecord
      > = {};

      for (const student of loadedStudents) {
        attendanceMap[student.id] = {
          studentId: student.id,
          status: "PRESENT",
          remarks: "",
        };
      }

      for (const record of loadedAttendance) {
        attendanceMap[record.studentId] = {
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks || "",
        };
      }

      setAttendance(attendanceMap);
    } catch (err) {
      console.error(err);

      setStudents([]);
      setAttendance({});

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load attendance."
      );
    } finally {
      setLoadingAttendance(false);
    }
  }

  function updateStatus(
    studentId: string,
    status: string
  ) {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        studentId,
        status,
      },
    }));
  }

  function updateRemarks(
    studentId: string,
    remarks: string
  ) {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        studentId,
        remarks,
      },
    }));
  }

  function markAll(status: string) {
    const updated: Record<
      string,
      AttendanceRecord
    > = {};

    for (const student of students) {
      updated[student.id] = {
        ...attendance[student.id],
        studentId: student.id,
        status,
      };
    }

    setAttendance(updated);
  }

  async function saveAttendance() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!classId) {
        setError("Please select a class.");
        return;
      }

      if (!date) {
        setError("Please select a date.");
        return;
      }

      const records = students.map((student) => ({
        studentId: student.id,
        status:
          attendance[student.id]?.status ||
          "PRESENT",
        remarks:
          attendance[student.id]?.remarks || "",
      }));

      const response = await fetch(
        "/api/teacher/attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId,
            date,
            records,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save attendance."
        );
      }

      setSuccess(
        "Attendance saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedClass = classes.find(
    (item) => item.class.id === classId
  );

  const summary = useMemo(() => {
    const counts = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    for (const student of students) {
      const status =
        attendance[student.id]?.status ||
        "PRESENT";

      if (
        status in counts
      ) {
        counts[
          status as keyof typeof counts
        ]++;
      }
    }

    return counts;
  }, [students, attendance]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Teacher Portal
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">
          Attendance
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Record and manage daily attendance for
          your assigned classes.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Class
            </label>

            <select
              value={classId}
              onChange={(event) =>
                setClassId(event.target.value)
              }
              disabled={loadingClasses}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                {loadingClasses
                  ? "Loading classes..."
                  : "Select a class"}
              </option>

              {classes.map((item) => (
                <option
                  key={item.class.id}
                  value={item.class.id}
                >
                  {item.class.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {classId && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                Present
              </p>

              <p className="mt-2 text-3xl font-black text-green-700">
                {summary.PRESENT}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                Absent
              </p>

              <p className="mt-2 text-3xl font-black text-red-700">
                {summary.ABSENT}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-600">
                Late
              </p>

              <p className="mt-2 text-3xl font-black text-yellow-700">
                {summary.LATE}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Excused
              </p>

              <p className="mt-2 text-3xl font-black text-blue-700">
                {summary.EXCUSED}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  {selectedClass?.class.name ||
                    "Class"}{" "}
                  Attendance
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {date}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    markAll("PRESENT")
                  }
                  className="rounded-lg bg-green-100 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-200"
                >
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() =>
                    markAll("ABSENT")
                  }
                  className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {loadingAttendance ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Loading attendance...
                </p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  No students found in this
                  class.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add students to the class from
                  the administrator portal.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        #
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Student
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Student Number
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (student, index) => {
                        const current =
                          attendance[
                            student.id
                          ] || {
                            studentId:
                              student.id,
                            status: "PRESENT",
                            remarks: "",
                          };

                        return (
                          <tr
                            key={student.id}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                          >
                            <td className="px-5 py-4 text-sm font-semibold text-gray-500">
                              {index + 1}
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-gray-900">
                                {
                                  student.firstName
                                }{" "}
                                {
                                  student.lastName
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {student.gender}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-gray-600">
                              {
                                student.studentNumber
                              }
                            </td>

                            <td className="px-5 py-4">
                              <select
                                value={
                                  current.status
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateStatus(
                                    student.id,
                                    event.target
                                      .value
                                  )
                                }
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                {STATUS_OPTIONS.map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {
                                        option.label
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="px-5 py-4">
                              <input
                                type="text"
                                value={
                                  current.remarks ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateRemarks(
                                    student.id,
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Optional"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {students.length > 0 && (
              <div className="flex justify-end border-t border-gray-200 p-5">
                <button
                  type="button"
                  onClick={saveAttendance}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save Attendance"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}