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

type Student = {
  firstName: string;
  lastName: string;
  studentNumber: string;
};

type ApiResponse = {
  student: Student;
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

export default function StudentResultsPage() {
  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>([]);

  const [selectedYearId, setSelectedYearId] =
    useState("");

  const [selectedTermId, setSelectedTermId] =
    useState("");

  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [loadingPeriods, setLoadingPeriods] =
    useState(true);

  const [loadingResults, setLoadingResults] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadPeriods() {
      try {
        const response = await fetch(
          "/api/academic-periods"
        );

        const json = await response.json();

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
      } finally {
        setLoadingPeriods(false);
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

    const termExists =
      selectedYear.terms.some(
        (term) =>
          term.id === selectedTermId
      );

    if (!termExists) {
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
    if (
      !selectedYearId ||
      !selectedTermId
    ) {
      return;
    }

    async function loadResults() {
      setLoadingResults(true);
      setError("");

      try {
        const params =
          new URLSearchParams({
            academicYearId:
              selectedYearId,
            termId: selectedTermId,
          });

        const response = await fetch(
          `/api/student/results?${params.toString()}`,
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
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load results"
        );
      } finally {
        setLoadingResults(false);
      }
    }

    loadResults();
  }, [
    selectedYearId,
    selectedTermId,
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-semibold text-blue-600">
          Academic Portal
        </p>

        <h1 className="mt-1 text-3xl font-black text-gray-900">
          My Results
        </h1>

        <p className="mt-2 text-gray-500">
          View your academic performance by
          academic year and term.
        </p>
      </div>

      <div className="mb-8 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Academic Year
          </label>

          <select
            value={selectedYearId}
            onChange={(event) => {
              setSelectedYearId(
                event.target.value
              );
            }}
            disabled={loadingPeriods}
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
                {year.isCurrent
                  ? " — Current"
                  : ""}
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
            onChange={(event) => {
              setSelectedTermId(
                event.target.value
              );
            }}
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
                  {term.isCurrent
                    ? " — Current"
                    : ""}
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

      {loadingResults && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading results...
        </div>
      )}

      {!loadingResults && data && (
        <>
          <div className="mb-8 rounded-2xl bg-gray-900 p-6 text-white">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black">
                  {data.student.firstName}{" "}
                  {data.student.lastName}
                </h2>

                <p className="mt-1 text-sm text-gray-300">
                  Student No:{" "}
                  {data.student.studentNumber}
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  {data.academicYear?.name} •{" "}
                  {data.term?.name}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-gray-400">
                  Class Position
                </p>

                <p className="text-4xl font-black">
                  {data.summary.position
                    ? `${data.summary.position}${
                        data.summary.classSize
                          ? ` / ${data.summary.classSize}`
                          : ""
                      }`
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
                No results have been entered for
                this term yet.
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