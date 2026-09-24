"use client";

import { useEffect, useMemo, useState } from "react";

type Term = {
  id: string;
  name: string;
  order: number;
  isCurrent: boolean;
};

type AcademicYear = {
  id: string;
  name: string;
  isCurrent: boolean;
  terms: Term[];
};

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  class?: {
    id: string;
    name: string;
  } | null;
};

type Result = {
  id: string;
  assessmentScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
  position: number | null;
  subject: {
    id: string;
    name: string;
    code: string;
  };
};

type ApiResponse = {
  children: Child[];
  selectedStudent: Child | null;
  academicYear: AcademicYear | null;
  term: Term | null;
  results: Result[];
  summary: {
    totalSubjects: number;
    average: number;
    passed: number;
    failed: number;
    position: number | null;
    classSize: number;
  };
};

export default function ParentResultsPage() {
  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>([]);

  const [selectedYearId, setSelectedYearId] =
    useState("");

  const [selectedTermId, setSelectedTermId] =
    useState("");

  const [children, setChildren] =
    useState<Child[]>([]);

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadPeriods() {
      try {
        const response = await fetch(
          "/api/academic-periods"
        );

        const json =
          await response.json();

        if (!response.ok) {
          throw new Error(
            json.error ||
              "Failed to load academic periods"
          );
        }

        setAcademicYears(
          json.academicYears ?? []
        );

        if (json.currentYearId) {
          setSelectedYearId(
            json.currentYearId
          );
        }

        if (json.currentTermId) {
          setSelectedTermId(
            json.currentTermId
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load academic periods"
        );
      }
    }

    loadPeriods();
  }, []);

  const selectedYear = useMemo(
    () =>
      academicYears.find(
        (year) =>
          year.id === selectedYearId
      ) ?? null,
    [academicYears, selectedYearId]
  );

  useEffect(() => {
    if (!selectedYear) return;

    const exists =
      selectedYear.terms.some(
        (term) =>
          term.id === selectedTermId
      );

    if (!exists) {
      const currentTerm =
        selectedYear.terms.find(
          (term) => term.isCurrent
        ) ??
        selectedYear.terms[0];

      setSelectedTermId(
        currentTerm?.id ?? ""
      );
    }
  }, [
    selectedYear,
    selectedTermId,
  ]);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams();

        if (selectedStudentId) {
          params.set(
            "studentId",
            selectedStudentId
          );
        }

        if (selectedYearId) {
          params.set(
            "academicYearId",
            selectedYearId
          );
        }

        if (selectedTermId) {
          params.set(
            "termId",
            selectedTermId
          );
        }

        const response = await fetch(
          `/api/parent/results?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const json =
          await response.json();

        if (!response.ok) {
          throw new Error(
            json.error ||
              "Failed to load results"
          );
        }

        setData(json);

        setChildren(
          json.children ?? []
        );

        if (
          !selectedStudentId &&
          json.selectedStudent?.id
        ) {
          setSelectedStudentId(
            json.selectedStudent.id
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load results"
        );
      } finally {
        setLoading(false);
      }
    }

    if (
      selectedYearId &&
      selectedTermId
    ) {
      loadResults();
    }
  }, [
    selectedStudentId,
    selectedYearId,
    selectedTermId,
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-semibold text-blue-600">
          Parent Portal
        </p>

        <h1 className="mt-1 text-3xl font-black text-gray-900">
          Academic Results
        </h1>

        <p className="mt-2 text-gray-500">
          View the academic performance of
          your children.
        </p>
      </div>

      <div className="mb-8 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Child
          </label>

          <select
            value={selectedStudentId}
            onChange={(event) =>
              setSelectedStudentId(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            {children.length === 0 ? (
              <option value="">
                No children found
              </option>
            ) : (
              children.map((child) => (
                <option
                  key={child.id}
                  value={child.id}
                >
                  {child.firstName}{" "}
                  {child.lastName}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Academic Year
          </label>

          <select
            value={selectedYearId}
            onChange={(event) =>
              setSelectedYearId(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">
              Select academic year
            </option>

            {academicYears.map((year) => (
              <option
                key={year.id}
                value={year.id}
              >
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Term
          </label>

          <select
            value={selectedTermId}
            onChange={(event) =>
              setSelectedTermId(
                event.target.value
              )
            }
            disabled={!selectedYear}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">
              Select term
            </option>

            {selectedYear?.terms.map(
              (term) => (
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

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading results...
        </div>
      ) : data?.selectedStudent ? (
        <>
          <div className="mb-8 rounded-2xl bg-gray-900 p-6 text-white">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black">
                  {data.selectedStudent.firstName}{" "}
                  {data.selectedStudent.lastName}
                </h2>

                <p className="mt-1 text-sm text-gray-300">
                  Student No:{" "}
                  {
                    data.selectedStudent
                      .studentNumber
                  }
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Class:{" "}
                  {data.selectedStudent
                    .class?.name ?? "—"}
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  {data.academicYear?.name} •{" "}
                  {data.term?.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">
                  Class Position
                </p>

                <p className="text-4xl font-black">
                  {data.summary.position
                    ? `${data.summary.position} / ${data.summary.classSize}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Subjects"
              value={
                data.summary.totalSubjects
              }
            />

            <StatCard
              label="Average"
              value={`${data.summary.average.toFixed(
                1
              )}%`}
            />

            <StatCard
              label="Passed"
              value={data.summary.passed}
            />

            <StatCard
              label="Failed"
              value={data.summary.failed}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-black text-gray-900">
                Subject Results
              </h2>
            </div>

            {data.results.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No results have been entered
                for this term yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-4">
                        Subject
                      </th>

                      <th className="px-5 py-4 text-center">
                        Assessment
                      </th>

                      <th className="px-5 py-4 text-center">
                        Exam
                      </th>

                      <th className="px-5 py-4 text-center">
                        Total
                      </th>

                      <th className="px-5 py-4 text-center">
                        Position
                      </th>

                      <th className="px-5 py-4 text-center">
                        Grade
                      </th>

                      <th className="px-5 py-4">
                        Remark
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {data.results.map(
                      (result) => (
                        <tr
                          key={result.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-900">
                              {
                                result.subject
                                  .name
                              }
                            </p>

                            <p className="text-xs text-gray-400">
                              {
                                result.subject
                                  .code
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4 text-center">
                            {result.assessmentScore ??
                              "—"}{" "}
                            / 50
                          </td>

                          <td className="px-5 py-4 text-center">
                            {result.examScore ??
                              "—"}{" "}
                            / 50
                          </td>

                          <td className="px-5 py-4 text-center font-black">
                            {result.totalScore ??
                              "—"}{" "}
                            / 100
                          </td>

                          <td className="px-5 py-4 text-center font-bold">
                            {result.position ??
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">
                              {result.grade ??
                                "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {result.remark ??
                              "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          No child account is currently linked
          to this parent account.
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-gray-900">
        {value}
      </p>
    </div>
  );
}