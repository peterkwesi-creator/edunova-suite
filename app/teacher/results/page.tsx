"use client";

import { useEffect, useState } from "react";

type StudentResult = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  result: {
    assessmentScore: number | null;
    examScore: number | null;
    totalScore: number | null;
    grade: string | null;
    remark: string | null;
  } | null;
};

type TeacherClass = {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  students: StudentResult[];
};

type Scores = {
  assessment: string;
  exam: string;
};

export default function TeacherResultsPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [scores, setScores] = useState<Record<string, Scores>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teacher/results", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load results");
      }

      const loadedClasses: TeacherClass[] = data.classes ?? [];

      setClasses(loadedClasses);

      const initialScores: Record<string, Scores> = {};

      loadedClasses.forEach((teacherClass) => {
        teacherClass.students.forEach((student) => {
          initialScores[student.id] = {
            assessment:
              student.result?.assessmentScore !== null &&
              student.result?.assessmentScore !== undefined
                ? String(student.result.assessmentScore)
                : "",
            exam:
              student.result?.examScore !== null &&
              student.result?.examScore !== undefined
                ? String(student.result.examScore)
                : "",
          };
        });
      });

      setScores(initialScores);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load teacher results."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateScore(
    studentId: string,
    field: "assessment" | "exam",
    value: string
  ) {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setScores((current) => ({
      ...current,
      [studentId]: {
        assessment: current[studentId]?.assessment ?? "",
        exam: current[studentId]?.exam ?? "",
        [field]: value,
      },
    }));

    setMessage("");
  }

  function calculateTotal(studentId: string) {
    const studentScores = scores[studentId];

    if (!studentScores) {
      return null;
    }

    const assessment = Number(studentScores.assessment);
    const exam = Number(studentScores.exam);

    if (
      studentScores.assessment === "" ||
      studentScores.exam === "" ||
      Number.isNaN(assessment) ||
      Number.isNaN(exam)
    ) {
      return null;
    }

    return assessment + exam;
  }

  function calculateGrade(total: number | null) {
    if (total === null) {
      return "";
    }

    if (total >= 80) return "A";
    if (total >= 70) return "B";
    if (total >= 60) return "C";
    if (total >= 50) return "D";
    if (total >= 40) return "E";
    return "F";
  }

  async function saveResult(
    teacherClass: TeacherClass,
    student: StudentResult
  ) {
    const studentScores = scores[student.id];

    if (!studentScores) {
      setError("Please enter the student's scores.");
      return;
    }

    const assessment = Number(studentScores.assessment);
    const exam = Number(studentScores.exam);

    if (
      studentScores.assessment === "" ||
      studentScores.exam === ""
    ) {
      setError(
        `Please enter both Assessment and Exam scores for ${student.firstName} ${student.lastName}.`
      );
      return;
    }

    if (
      Number.isNaN(assessment) ||
      Number.isNaN(exam) ||
      assessment < 0 ||
      assessment > 50 ||
      exam < 0 ||
      exam > 50
    ) {
      setError(
        "Assessment and Exam scores must each be between 0 and 50."
      );
      return;
    }

    try {
      setSaving(student.id);
      setError("");
      setMessage("");

      const response = await fetch("/api/teacher/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.id,
          classId: teacherClass.classId,
          subjectId: teacherClass.subjectId,
          assessmentScore: assessment,
          examScore: exam,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save result");
      }

      setMessage(
        `Result saved for ${student.firstName} ${student.lastName}.`
      );

      await loadResults();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save result."
      );
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <a
            href="/teacher/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Teacher Dashboard
          </a>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Student Results
          </h1>

          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-600">
              Loading students and results...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <a
          href="/teacher/dashboard"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Teacher Dashboard
        </a>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Teacher Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Student Results
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Enter General Class Assessment and Examination scores.
            Each contributes 50% to the final result.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="font-medium text-green-700">{message}</p>
          </div>
        )}

        {classes.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              No assigned classes
            </h2>

            <p className="mt-2 text-gray-500">
              You have not been assigned any classes and subjects yet.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {classes.map((teacherClass) => (
              <section
                key={`${teacherClass.classId}-${teacherClass.subjectId}`}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                {/* Class header */}
                <div className="border-b bg-white px-6 py-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {teacherClass.className}
                      </h2>

                      <p className="mt-1 text-gray-600">
                        {teacherClass.subjectName} (
                        {teacherClass.subjectCode})
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Students
                      </p>

                      <p className="mt-1 text-xl font-bold text-blue-900">
                        {teacherClass.students.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results table */}
                {teacherClass.students.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="font-medium text-gray-700">
                      No students found in this class.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Student
                          </th>

                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                            Assessment / 50
                          </th>

                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                            Exam / 50
                          </th>

                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                            Total / 100
                          </th>

                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                            Grade
                          </th>

                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {teacherClass.students.map((student) => {
                          const total = calculateTotal(student.id);
                          const grade = calculateGrade(total);

                          return (
                            <tr
                              key={student.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-5">
                                <p className="font-semibold text-gray-900">
                                  {student.firstName} {student.lastName}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {student.studentNumber}
                                </p>
                              </td>

                              <td className="px-4 py-5">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  step="0.01"
                                  value={
                                    scores[student.id]?.assessment ?? ""
                                  }
                                  onChange={(event) =>
                                    updateScore(
                                      student.id,
                                      "assessment",
                                      event.target.value
                                    )
                                  }
                                  placeholder="0–50"
                                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </td>

                              <td className="px-4 py-5">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  step="0.01"
                                  value={
                                    scores[student.id]?.exam ?? ""
                                  }
                                  onChange={(event) =>
                                    updateScore(
                                      student.id,
                                      "exam",
                                      event.target.value
                                    )
                                  }
                                  placeholder="0–50"
                                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </td>

                              <td className="px-4 py-5">
                                <span className="font-bold text-gray-900">
                                  {total !== null ? total : "—"}
                                </span>
                              </td>

                              <td className="px-4 py-5">
                                <span className="font-bold text-blue-700">
                                  {grade || "—"}
                                </span>
                              </td>

                              <td className="px-6 py-5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    saveResult(teacherClass, student)
                                  }
                                  disabled={saving === student.id}
                                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {saving === student.id
                                    ? "Saving..."
                                    : "Save Result"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Grading guide */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Grading Guide
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-green-50 p-4">
              <p className="font-bold text-green-700">A — Excellent</p>
              <p className="text-sm text-gray-600">80–100</p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="font-bold text-blue-700">B — Very Good</p>
              <p className="text-sm text-gray-600">70–79</p>
            </div>

            <div className="rounded-xl bg-yellow-50 p-4">
              <p className="font-bold text-yellow-700">C — Good</p>
              <p className="text-sm text-gray-600">60–69</p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <p className="font-bold text-orange-700">D — Pass</p>
              <p className="text-sm text-gray-600">50–59</p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="font-bold text-red-700">E — Needs Improvement</p>
              <p className="text-sm text-gray-600">40–49</p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="font-bold text-red-700">F — Fail</p>
              <p className="text-sm text-gray-600">0–39</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}