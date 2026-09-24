"use client";

import { useEffect, useState } from "react";

type ClassSubject = {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string | null;
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
  student: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    class?: {
      id: string;
      name: string;
    } | null;
  };
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
      errorData?.error || `${url} failed with status ${response.status}`
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

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classSubjectId, setClassSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [grading, setGrading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [assignmentData, classSubjectData] = await Promise.all([
        fetchJson("/api/teacher/assignments"),
        fetchJson("/api/teacher/class-subjects"),
      ]);

      setAssignments(
        Array.isArray(assignmentData) ? assignmentData : []
      );

      setClassSubjects(
        Array.isArray(classSubjectData) ? classSubjectData : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load assignment data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createAssignment(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter an assignment title.");
      return;
    }

    if (!classSubjectId) {
      setError("Please select a class and subject.");
      return;
    }

    const selected = classSubjects.find(
      (item) => item.id === classSubjectId
    );

    if (!selected) {
      setError("Selected class and subject could not be found.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const data = await fetchJson("/api/teacher/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          classId: selected.classId,
          subjectId: selected.subjectId,
          dueDate: dueDate || null,
        }),
      });

      setAssignments((current) => [data as Assignment, ...current]);

      setTitle("");
      setDescription("");
      setClassSubjectId("");
      setDueDate("");

      setSuccess("Assignment created successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create assignment."
      );
    } finally {
      setCreating(false);
    }
  }

  async function openSubmissions(assignment: Assignment) {
    try {
      setSelectedAssignment(assignment);
      setSelectedSubmission(null);
      setSubmissions([]);
      setError("");
      setSuccess("");
      setLoadingSubmissions(true);

      const data = await fetchJson(
        `/api/teacher/assignments/submissions?assignmentId=${assignment.id}`
      );

      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load submissions."
      );
    } finally {
      setLoadingSubmissions(false);
    }
  }

  function selectSubmission(submission: Submission) {
    setSelectedSubmission(submission);
    setGrade(
      submission.grade !== null ? String(submission.grade) : ""
    );
    setFeedback(submission.feedback || "");
    setError("");
    setSuccess("");
  }

  async function saveGrade() {
    if (!selectedAssignment || !selectedSubmission) return;

    const numericGrade = Number(grade);

    if (!Number.isFinite(numericGrade)) {
      setError("Please enter a valid grade.");
      return;
    }

    if (numericGrade < 0 || numericGrade > 100) {
      setError("Grade must be between 0 and 100.");
      return;
    }

    try {
      setGrading(true);
      setError("");
      setSuccess("");

      const data = await fetchJson(
        "/api/teacher/assignments/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentId: selectedAssignment.id,
            submissionId: selectedSubmission.id,
            grade: numericGrade,
            feedback,
          }),
        }
      );

      const updatedSubmission = data as Submission;

      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === updatedSubmission.id
            ? updatedSubmission
            : submission
        )
      );

      setSelectedSubmission(updatedSubmission);

      setSuccess("Grade and feedback saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save grade."
      );
    } finally {
      setGrading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
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
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Teacher Assignments
          </h1>

          <p className="mt-1 text-slate-500">
            Create assignments, review student submissions, grade work
            and provide feedback.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* CREATE ASSIGNMENT */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Create Assignment
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create an assignment for one of your assigned classes and
            subjects.
          </p>

          <form
            onSubmit={createAssignment}
            className="mt-6 space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assignment Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Algebra Homework"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Class & Subject
                </label>

                <select
                  value={classSubjectId}
                  onChange={(event) =>
                    setClassSubjectId(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select class and subject
                  </option>

                  {classSubjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.class.name} — {item.subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Instructions
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={5}
                placeholder="Write the assignment instructions..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="max-w-md">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Due Date
              </label>

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {creating
                ? "Creating..."
                : "Create Assignment"}
            </button>
          </form>
        </section>

        {/* ASSIGNMENT LIST */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review assignments you have created.
              </p>
            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {assignments.length}{" "}
              {assignments.length === 1
                ? "Assignment"
                : "Assignments"}
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
              <div className="text-4xl">📝</div>

              <h3 className="mt-3 font-semibold text-slate-900">
                No assignments yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first assignment above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {assignment.title}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-blue-600">
                        {assignment.subject.name}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {assignment.class.name}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm text-slate-600">
                    {assignment.description ||
                      "No instructions provided."}
                  </p>

                  <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p>
                      <span className="font-semibold text-slate-700">
                        Due:
                      </span>{" "}
                      {formatDate(assignment.dueDate)}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-700">
                        Created:
                      </span>{" "}
                      {formatDateTime(assignment.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      openSubmissions(assignment)
                    }
                    className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                  >
                    View Student Submissions
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SUBMISSIONS */}
        {selectedAssignment && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  {selectedAssignment.subject.name}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedAssignment.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedAssignment.class.name}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedAssignment(null);
                  setSelectedSubmission(null);
                  setSubmissions([]);
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
                <p className="text-slate-500">
                  Loading student submissions...
                </p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
                <div className="text-4xl">📭</div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  No submissions yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Students have not submitted answers for this
                  assignment yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* SUBMISSION LIST */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">
                    Student Submissions
                  </h3>

                  {submissions.map((submission) => (
                    <button
                      key={submission.id}
                      onClick={() =>
                        selectSubmission(submission)
                      }
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedSubmission?.id ===
                        submission.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {submission.student.firstName}{" "}
                            {submission.student.lastName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {submission.student.studentNumber}
                          </p>
                        </div>

                        {submission.grade !== null ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            {submission.grade}/100
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Needs grading
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Submitted{" "}
                        {formatDateTime(
                          submission.submittedAt
                        )}
                      </p>
                    </button>
                  ))}
                </div>

                {/* SELECTED SUBMISSION */}
                <div>
                  {!selectedSubmission ? (
                    <div className="rounded-xl bg-slate-50 p-8 text-center">
                      <div className="text-4xl">👈</div>

                      <p className="mt-3 text-sm text-slate-500">
                        Select a student submission to review
                        and grade it.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {selectedSubmission.student.firstName}{" "}
                          {selectedSubmission.student.lastName}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {
                            selectedSubmission.student
                              .studentNumber
                          }
                        </p>
                      </div>

                      <div className="mt-5 rounded-xl bg-slate-50 p-5">
                        <p className="text-sm font-semibold text-slate-700">
                          Student Answer
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                          {selectedSubmission.answer}
                        </p>
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Grade / 100
                        </label>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grade}
                          onChange={(event) =>
                            setGrade(event.target.value)
                          }
                          placeholder="Enter grade"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Feedback
                        </label>

                        <textarea
                          value={feedback}
                          onChange={(event) =>
                            setFeedback(event.target.value)
                          }
                          rows={5}
                          placeholder="Write feedback for the student..."
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <button
                        onClick={saveGrade}
                        disabled={grading}
                        className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {grading
                          ? "Saving..."
                          : selectedSubmission.grade !==
                            null
                          ? "Update Grade & Feedback"
                          : "Grade Submission"}
                      </button>

                      {selectedSubmission.grade !== null && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                          <p className="text-sm font-semibold text-green-800">
                            Current Grade
                          </p>

                          <p className="mt-1 text-2xl font-bold text-green-700">
                            {selectedSubmission.grade}/100
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}