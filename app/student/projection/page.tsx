"use client";

import { useEffect, useState } from "react";

type Result = {
  id: string;
  assessmentScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
  };
};

type ProjectionData = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
    class: {
      id: string;
      name: string;
    } | null;
  };
  results: Result[];
};

async function fetchJson(url: string) {
  const response = await fetch(url);

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `${url} returned HTML instead of JSON. Status: ${response.status}`
    );
  }

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `${url} returned invalid JSON. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    const errorData = data as { error?: string };

    throw new Error(
      errorData?.error || `${url} failed with status ${response.status}`
    );
  }

  return data;
}

function getGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  if (score >= 40) return "E";
  return "F";
}

function getRemark(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 50) return "Pass";
  if (score >= 40) return "Needs Improvement";
  return "Fail";
}

export default function StudentProjectionPage() {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [targetScore, setTargetScore] = useState("70");

  useEffect(() => {
    async function loadProjection() {
      try {
        setLoading(true);
        setError("");

        const results = await fetchJson("/api/student/results");

        if (!results || typeof results !== "object") {
          throw new Error("Invalid results data received.");
        }

        const resultData = results as {
          student?: ProjectionData["student"];
          results?: Result[];
        };

        setData({
          student: resultData.student || {
            id: "",
            firstName: "",
            lastName: "",
            studentNumber: "",
            class: null,
          },
          results: Array.isArray(resultData.results)
            ? resultData.results
            : [],
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load projection data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjection();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-500">
              Loading projection...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-800">
              Projection Error
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const results = data.results;

  const completedResults = results.filter(
    (result) =>
      result.assessmentScore !== null ||
      result.examScore !== null
  );

  const average =
    completedResults.length > 0
      ? completedResults.reduce(
          (sum, result) =>
            sum + (result.totalScore ?? 0),
          0
        ) / completedResults.length
      : 0;

  const target = Math.min(
    100,
    Math.max(0, Number(targetScore) || 0)
  );

  const projectionRows = results.map((result) => {
    const assessment =
      result.assessmentScore ?? 0;

    const exam =
      result.examScore ?? 0;

    const currentTotal =
      result.totalScore ??
      assessment + exam;

    /*
     * The system uses:
     * Assessment = 50%
     * Exam = 50%
     *
     * Projection assumes the student is aiming for
     * the selected target total score.
     */

    const requiredExam = Math.max(
      0,
      Math.min(50, target - assessment)
    );

    const projectedTotal =
      assessment + requiredExam;

    return {
      ...result,
      assessment,
      exam,
      currentTotal,
      requiredExam,
      projectedTotal,
      projectedGrade: getGrade(projectedTotal),
      projectedRemark: getRemark(projectedTotal),
    };
  });

  const averageGrade = getGrade(average);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Result Projection
          </h1>

          <p className="mt-1 text-slate-500">
            See your current performance and the exam score
            needed to reach your target.
          </p>
        </div>

        {/* STUDENT INFO */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {data.student.firstName}{" "}
                {data.student.lastName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Student Number:{" "}
                <span className="font-semibold text-slate-700">
                  {data.student.studentNumber}
                </span>
              </p>

              {data.student.class && (
                <p className="mt-1 text-sm text-slate-500">
                  Class:{" "}
                  <span className="font-semibold text-slate-700">
                    {data.student.class.name}
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-xl bg-blue-50 px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Current Average
              </p>

              <p className="mt-1 text-3xl font-bold text-blue-700">
                {average.toFixed(1)}%
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-600">
                Grade {averageGrade}
              </p>
            </div>
          </div>
        </section>

        {/* TARGET */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-6 md:grid-cols-2 md:items-end">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Set Your Target
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose the final score you want to achieve.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Target Total Score
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={targetScore}
                onChange={(event) =>
                  setTargetScore(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Assessment contributes 50 marks and the exam
                contributes 50 marks.
              </p>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Subjects With Results
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {completedResults.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Current Average
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {average.toFixed(1)}%
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Target
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {target.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* PROJECTION TABLE */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Subject Projection
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The table shows the exam mark needed to reach
              your selected target.
            </p>
          </div>

          {projectionRows.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">📊</div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No results available
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your projection will appear once your teacher
                enters results.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assessment / 50
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Exam / 50
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Total
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Exam Needed
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Projected Total
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Grade
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {projectionRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {row.subject.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {row.subject.code}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {row.assessment.toFixed(1)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {row.exam.toFixed(1)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {row.currentTotal.toFixed(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            row.requiredExam >= 45
                              ? "bg-red-100 text-red-700"
                              : row.requiredExam >= 30
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {row.requiredExam.toFixed(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-700">
                          {row.projectedTotal.toFixed(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-slate-900">
                            {row.projectedGrade}
                          </span>

                          <p className="text-xs text-slate-500">
                            {row.projectedRemark}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* GRADING GUIDE */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Grading Guide
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["A", "80–100", "Excellent"],
              ["B", "70–79", "Very Good"],
              ["C", "60–69", "Good"],
              ["D", "50–59", "Pass"],
              ["E", "40–49", "Needs Improvement"],
              ["F", "0–39", "Fail"],
            ].map(([grade, range, remark]) => (
              <div
                key={grade}
                className="rounded-xl bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-900">
                    {grade}
                  </span>

                  <span className="text-sm font-semibold text-blue-600">
                    {range}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {remark}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}