"use client";

import { useEffect, useState } from "react";

type EnrolmentRow = {
  classId: string;
  className: string;
  male: number;
  female: number;
  other: number;
  total: number;
};

type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

type BecePerformance = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  subject: string;
  subjectCode: string;
  assessmentScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
};

type BeceReport = {
  jhs3Students: number;
  resultsEntered: number;
  performance: BecePerformance[];
};

type StaffRow = {
  position: string;
  male: number;
  female: number;
  other: number;
  total: number;
};

type GesReport = {
  enrolment: EnrolmentRow[];
  attendance: AttendanceSummary;
  bece: BeceReport;
  staff: StaffRow[];
  totals: {
    students: number;
    studentsMale: number;
    studentsFemale: number;
    staff: number;
    staffMale: number;
    staffFemale: number;
  };
};

export default function GesReportPage() {
  const [report, setReport] =
    useState<GesReport | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/ges-report"
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load GES report."
        );
      }

      setReport(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load GES report."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  function printReport() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <div className="rounded-2xl border bg-white p-12 text-center text-gray-500">
            Loading GES report...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6 md:p-8">

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center print:hidden">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-black text-gray-900">
              GES Report
            </h1>

            <p className="mt-2 text-gray-500">
              School inspection and statutory
              reporting summary.
            </p>
          </div>

          <button
            onClick={printReport}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            🖨 Print Report
          </button>
        </div>

        <div className="mb-8 hidden print:block">
          <h1 className="text-3xl font-black">
            GES School Report
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Generated from EduNova Suite
          </p>
        </div>

        {/* SUMMARY */}

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total Enrolment
            </p>

            <p className="mt-2 text-3xl font-black text-gray-900">
              {report.totals.students}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {report.totals.studentsMale} male ·{" "}
              {report.totals.studentsFemale} female
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Attendance Records
            </p>

            <p className="mt-2 text-3xl font-black text-gray-900">
              {report.attendance.total}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Present: {report.attendance.present}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              JHS 3 Students
            </p>

            <p className="mt-2 text-3xl font-black text-gray-900">
              {report.bece.jhs3Students}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Result records:{" "}
              {report.bece.resultsEntered}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Active Staff
            </p>

            <p className="mt-2 text-3xl font-black text-gray-900">
              {report.totals.staff}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {report.totals.staffMale} male ·{" "}
              {report.totals.staffFemale} female
            </p>
          </div>
        </section>

        {/* ENROLMENT */}

        <section className="mb-8 rounded-2xl border bg-white">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-black text-gray-900">
              1. Enrolment by Class and Gender
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current student enrolment grouped by
              class and gender.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">
                    Class
                  </th>

                  <th className="px-6 py-4">
                    Male
                  </th>

                  <th className="px-6 py-4">
                    Female
                  </th>

                  <th className="px-6 py-4">
                    Other
                  </th>

                  <th className="px-6 py-4">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {report.enrolment.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No enrolment data available.
                    </td>
                  </tr>
                ) : (
                  report.enrolment.map(
                    (row) => (
                      <tr
                        key={row.classId}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {row.className}
                        </td>

                        <td className="px-6 py-4">
                          {row.male}
                        </td>

                        <td className="px-6 py-4">
                          {row.female}
                        </td>

                        <td className="px-6 py-4">
                          {row.other}
                        </td>

                        <td className="px-6 py-4 font-black">
                          {row.total}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>

              <tfoot className="border-t bg-gray-50 font-black">
                <tr>
                  <td className="px-6 py-4">
                    TOTAL
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.studentsMale}
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.studentsFemale}
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.students -
                      report.totals.studentsMale -
                      report.totals.studentsFemale}
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.students}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ATTENDANCE */}

        <section className="mb-8 rounded-2xl border bg-white">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-black text-gray-900">
              2. Attendance Summary
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Attendance records currently stored in
              EduNova.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-4">
            <div className="rounded-xl bg-green-50 p-5">
              <p className="text-sm font-semibold text-green-700">
                Present
              </p>

              <p className="mt-2 text-3xl font-black text-green-900">
                {report.attendance.present}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">
                Absent
              </p>

              <p className="mt-2 text-3xl font-black text-red-900">
                {report.attendance.absent}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 p-5">
              <p className="text-sm font-semibold text-yellow-700">
                Late
              </p>

              <p className="mt-2 text-3xl font-black text-yellow-900">
                {report.attendance.late}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-700">
                Excused
              </p>

              <p className="mt-2 text-3xl font-black text-blue-900">
                {report.attendance.excused}
              </p>
            </div>
          </div>
        </section>

        {/* BECE */}

        <section className="mb-8 rounded-2xl border bg-white">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-black text-gray-900">
              3. JHS 3 BECE Performance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              JHS 3 result information entered into the
              system.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">
                    Student
                  </th>

                  <th className="px-6 py-4">
                    Student No.
                  </th>

                  <th className="px-6 py-4">
                    Subject
                  </th>

                  <th className="px-6 py-4">
                    Assessment
                  </th>

                  <th className="px-6 py-4">
                    Exam
                  </th>

                  <th className="px-6 py-4">
                    Total
                  </th>

                  <th className="px-6 py-4">
                    Grade
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {report.bece.performance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No JHS 3 results have been
                      entered yet.
                    </td>
                  </tr>
                ) : (
                  report.bece.performance.map(
                    (row, index) => (
                      <tr
                        key={`${row.studentId}-${row.subjectCode}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {row.studentName}
                        </td>

                        <td className="px-6 py-4 text-gray-500">
                          {row.studentNumber}
                        </td>

                        <td className="px-6 py-4">
                          {row.subject}
                        </td>

                        <td className="px-6 py-4">
                          {row.assessmentScore ??
                            "—"}
                        </td>

                        <td className="px-6 py-4">
                          {row.examScore ??
                            "—"}
                        </td>

                        <td className="px-6 py-4 font-bold">
                          {row.totalScore ??
                            "—"}
                        </td>

                        <td className="px-6 py-4 font-black">
                          {row.grade ??
                            "—"}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* STAFF */}

        <section className="rounded-2xl border bg-white">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-black text-gray-900">
              4. Active Staff by Position and Gender
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Active teaching staff grouped by their
              recorded position and gender.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">
                    Position
                  </th>

                  <th className="px-6 py-4">
                    Male
                  </th>

                  <th className="px-6 py-4">
                    Female
                  </th>

                  <th className="px-6 py-4">
                    Other
                  </th>

                  <th className="px-6 py-4">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {report.staff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No staff data available.
                    </td>
                  </tr>
                ) : (
                  report.staff.map(
                    (row) => (
                      <tr
                        key={row.position}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {row.position}
                        </td>

                        <td className="px-6 py-4">
                          {row.male}
                        </td>

                        <td className="px-6 py-4">
                          {row.female}
                        </td>

                        <td className="px-6 py-4">
                          {row.other}
                        </td>

                        <td className="px-6 py-4 font-black">
                          {row.total}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>

              <tfoot className="border-t bg-gray-50 font-black">
                <tr>
                  <td className="px-6 py-4">
                    TOTAL
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.staffMale}
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.staffFemale}
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.staff -
                      report.totals.staffMale -
                      report.totals.staffFemale}
                  </td>

                  <td className="px-6 py-4">
                    {report.totals.staff}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="mt-8 text-center text-xs text-gray-400 print:mt-12">
          EduNova Suite · GES Reporting Module
        </div>
      </div>
    </main>
  );
}