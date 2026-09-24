"use client";

import { useEffect, useMemo, useState } from "react";

type Submission = {
  status: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
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
    firstName: string;
    lastName: string;
  } | null;
  submission: Submission | null;
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
  assignments: Assignment[];
};

type ParentAssignmentsResponse = {
  parent: {
    firstName: string;
    lastName: string;
  };
  children: Child[];
};

function formatDate(date: string | null) {
  if (!date) return "No due date";

  return new Date(date).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(date: string | null) {
  if (!date) return false;

  return new Date(date).getTime() < Date.now();
}

function getStatusLabel(submission: Submission | null, dueDate: string | null) {
  if (submission?.status) {
    return submission.status;
  }

  if (isOverdue(dueDate)) {
    return "OVERDUE";
  }

  return "NOT SUBMITTED";
}

function getStatusClass(status: string) {
  switch (status.toUpperCase()) {
    case "SUBMITTED":
    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "GRADED":
      return "bg-blue-100 text-blue-700";

    case "OVERDUE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function ParentAssignmentsPage() {
  const [data, setData] = useState<ParentAssignmentsResponse | null>(null);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAssignments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/parent/assignments");

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Failed to load assignments."
          );
        }

        setData(result);

        if (result.children?.length > 0) {
          setSelectedChildId(result.children[0].id);
        }
      } catch (err) {
        console.error("PARENT ASSIGNMENTS PAGE ERROR:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load assignments."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  const selectedChild = useMemo(() => {
    if (!data || !selectedChildId) return null;

    return (
      data.children.find(
        (child) => child.id === selectedChildId
      ) || null
    );
  }, [data, selectedChildId]);

  const assignments = selectedChild?.assignments || [];

  const totalAssignments = assignments.length;

  const submittedAssignments = assignments.filter(
    (assignment) =>
      assignment.submission?.status?.toUpperCase() === "SUBMITTED" ||
      assignment.submission?.status?.toUpperCase() === "COMPLETED" ||
      assignment.submission?.status?.toUpperCase() === "GRADED"
  ).length;

  const overdueAssignments = assignments.filter(
    (assignment) =>
      !assignment.submission &&
      isOverdue(assignment.dueDate)
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="text-gray-600">
              Loading assignments...
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
              Unable to load assignments
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
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
              Assignments
            </h1>
          </div>

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
              📚
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              No children found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              Your parent account is not currently connected to any
              students.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            Parent Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Assignments
          </h1>

          <p className="mt-2 text-gray-500">
            View assignments given to your child and track their
            submission status.
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
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
                {child.class
                  ? ` — ${child.class.name}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Child Information */}
        {selectedChild && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-blue-100">
                  Student
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {selectedChild.firstName}{" "}
                  {selectedChild.lastName}
                </h2>

                <div className="mt-2 flex flex-wrap gap-3 text-sm text-blue-100">
                  <span>
                    Student No: {selectedChild.studentNumber}
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

              <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-xs text-blue-100">
                  Total Assignments
                </p>

                <p className="text-3xl font-bold">
                  {totalAssignments}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Assignments
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalAssignments}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Submitted
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {submittedAssignments}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Overdue
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {overdueAssignments}
            </p>
          </div>
        </div>

        {/* Assignments */}
        {assignments.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
              📝
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              No assignments yet
            </h2>

            <p className="mt-2 text-gray-500">
              There are currently no assignments for{" "}
              {selectedChild?.firstName}.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {assignments.map((assignment) => {
              const status = getStatusLabel(
                assignment.submission,
                assignment.dueDate
              );

              return (
                <div
                  key={assignment.id}
                  className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main Assignment Information */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">
                          {assignment.title}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                          {assignment.subject.name}
                        </span>

                        <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {assignment.subject.code}
                        </span>

                        <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {assignment.class.name}
                        </span>
                      </div>

                      {assignment.description && (
                        <div className="mt-5">
                          <p className="mb-1 text-sm font-semibold text-gray-700">
                            Description
                          </p>

                          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                            {assignment.description}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Teacher
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-800">
                            {assignment.teacher
                              ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
                              : "Not assigned"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Due Date
                          </p>

                          <p
                            className={`mt-1 text-sm font-medium ${
                              isOverdue(
                                assignment.dueDate
                              ) &&
                              !assignment.submission
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {formatDate(
                              assignment.dueDate
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submission Information */}
                    <div className="w-full rounded-xl border border-gray-100 bg-gray-50 p-5 lg:w-72">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Submission
                      </h3>

                      {assignment.submission ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-xs text-gray-400">
                              Status
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {assignment.submission.status}
                            </p>
                          </div>

                          {assignment.submission.grade !==
                            null && (
                            <div>
                              <p className="text-xs text-gray-400">
                                Grade
                              </p>

                              <p className="mt-1 text-2xl font-bold text-blue-600">
                                {assignment.submission.grade}
                              </p>
                            </div>
                          )}

                          {assignment.submission.submittedAt && (
                            <div>
                              <p className="text-xs text-gray-400">
                                Submitted
                              </p>

                              <p className="mt-1 text-sm text-gray-700">
                                {formatDate(
                                  assignment.submission
                                    .submittedAt
                                )}
                              </p>
                            </div>
                          )}

                          {assignment.submission.feedback && (
                            <div>
                              <p className="text-xs text-gray-400">
                                Teacher Feedback
                              </p>

                              <p className="mt-1 text-sm leading-5 text-gray-700">
                                {
                                  assignment.submission
                                    .feedback
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">
                            No submission has been recorded for
                            this assignment.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}