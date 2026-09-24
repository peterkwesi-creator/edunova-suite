"use client";

import { useEffect, useState } from "react";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
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
    id: string;
    firstName: string;
    lastName: string;
  };
  submissions: Submission[];
};

type Submission = {
  id: string;
  answer: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  updatedAt: string;
};

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
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
      errorData?.error ||
        `${url} failed with status ${response.status}`
    );
  }

  return data;
}

function formatDate(date: string | null) {
  if (!date) return "No deadline";

  return new Date(date).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isPastDue(date: string | null) {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchJson("/api/student/assignments");

      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load assignments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  function openAssignment(assignment: Assignment) {
    setSelectedAssignment(assignment);
    setSuccess("");

    const submission = assignment.submissions?.[0];

    setAnswer(submission?.answer || "");
  }

  async function submitAssignment() {
    if (!selectedAssignment) return;

    if (!answer.trim()) {
      setError("Please write an answer before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const data = await fetchJson(
        `/api/student/assignments/${selectedAssignment.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answer,
          }),
        }
      );

      setSuccess("Assignment submitted successfully.");

      const updatedSubmission = data as Submission;

      setSelectedAssignment({
        ...selectedAssignment,
        submissions: [updatedSubmission],
      });

      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === selectedAssignment.id
            ? {
                ...assignment,
                submissions: [updatedSubmission],
              }
            : assignment
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit assignment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-500">
              Loading assignments...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            My Assignments
          </h1>

          <p className="mt-1 text-slate-500">
            View your assignments, submit your answers and check
            your feedback.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Assignment list */}
        {assignments.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">📚</div>

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              No assignments yet
            </h2>

            <p className="mt-2 text-slate-500">
              Your teachers have not posted any assignments for
              your class yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {assignments.map((assignment) => {
              const submission = assignment.submissions?.[0];
              const pastDue = isPastDue(assignment.dueDate);

              return (
                <div
                  key={assignment.id}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {assignment.title}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-blue-600">
                        {assignment.subject.name}
                      </p>
                    </div>

                    {submission ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {submission.grade !== null
                          ? "Graded"
                          : "Submitted"}
                      </span>
                    ) : pastDue ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Overdue
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm text-slate-600">
                    {assignment.description ||
                      "No description provided."}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-slate-500">
                    <p>
                      <span className="font-semibold text-slate-700">
                        Teacher:
                      </span>{" "}
                      {assignment.teacher.firstName}{" "}
                      {assignment.teacher.lastName}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-700">
                        Due:
                      </span>{" "}
                      {formatDate(assignment.dueDate)}
                    </p>
                  </div>

                  <button
                    onClick={() => openAssignment(assignment)}
                    className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    {submission
                      ? "View Submission"
                      : "Open Assignment"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Assignment details */}
        {selectedAssignment && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  {selectedAssignment.subject.name}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedAssignment.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedAssignment(null)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">
                Assignment Instructions
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-slate-700">
                {selectedAssignment.description ||
                  "No instructions provided."}
              </p>
            </div>

            <div className="mt-5 text-sm text-slate-500">
              Due:{" "}
              <span className="font-semibold text-slate-700">
                {formatDate(selectedAssignment.dueDate)}
              </span>
            </div>

            {selectedAssignment.submissions?.[0]?.grade !== null &&
              selectedAssignment.submissions?.[0]?.grade !==
                undefined && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
                  <p className="text-sm font-semibold text-green-800">
                    Your Grade
                  </p>

                  <p className="mt-1 text-3xl font-bold text-green-700">
                    {selectedAssignment.submissions[0].grade}/100
                  </p>

                  {selectedAssignment.submissions[0].feedback && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-green-800">
                        Teacher Feedback
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-green-700">
                        {selectedAssignment.submissions[0].feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Your Answer
              </label>

              <textarea
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                rows={10}
                disabled={
                  !!selectedAssignment.dueDate &&
                  isPastDue(selectedAssignment.dueDate)
                }
                placeholder="Write your answer here..."
                className="w-full rounded-xl border border-slate-300 p-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            {selectedAssignment.dueDate &&
              isPastDue(selectedAssignment.dueDate) && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  This assignment is past its deadline and can no
                  longer be submitted.
                </p>
              )}

            <button
              onClick={submitAssignment}
              disabled={
                submitting ||
                (!!selectedAssignment.dueDate &&
                  isPastDue(selectedAssignment.dueDate))
              }
              className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting
                ? "Submitting..."
                : selectedAssignment.submissions?.length
                ? "Update Submission"
                : "Submit Assignment"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}