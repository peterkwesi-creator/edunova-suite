"use client";

import { useEffect, useState } from "react";

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
    code: string | null;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

type Student = {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  className: string;
};

type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  answer: string;
  status: string;
  grade: number | null;
  feedback: string | null;
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        assignmentsResponse,
        studentsResponse,
        submissionsResponse,
      ] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/students"),
        fetch("/api/submissions"),
      ]);

      if (
        !assignmentsResponse.ok ||
        !studentsResponse.ok ||
        !submissionsResponse.ok
      ) {
        throw new Error("Failed to load student assignment data.");
      }

      const [
        assignmentsData,
        studentsData,
        submissionsData,
      ] = await Promise.all([
        assignmentsResponse.json(),
        studentsResponse.json(),
        submissionsResponse.json(),
      ]);

      setAssignments(assignmentsData);
      setStudents(studentsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAssignment(assignment: Assignment) {
    setSelectedAssignment(assignment);
    setSuccess("");
    setError("");

    if (selectedStudent) {
      const existingSubmission = submissions.find(
        (submission) =>
          submission.assignmentId === assignment.id &&
          submission.studentId === selectedStudent
      );

      setAnswer(existingSubmission?.answer || "");
    } else {
      setAnswer("");
    }
  }

  function handleStudentChange(studentId: string) {
    setSelectedStudent(studentId);
    setSuccess("");
    setError("");

    if (selectedAssignment) {
      const existingSubmission = submissions.find(
        (submission) =>
          submission.assignmentId === selectedAssignment.id &&
          submission.studentId === studentId
      );

      setAnswer(existingSubmission?.answer || "");
    }
  }

  async function submitAssignment() {
    if (!selectedAssignment) {
      setError("Please select an assignment.");
      return;
    }

    if (!selectedStudent) {
      setError("Please select a student.");
      return;
    }

    if (!answer.trim()) {
      setError("Please enter an answer.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          studentId: selectedStudent,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to submit assignment."
        );
      }

      setSubmissions((current) => {
        const withoutCurrent = current.filter(
          (submission) =>
            !(
              submission.assignmentId ===
                data.assignmentId &&
              submission.studentId === data.studentId
            )
        );

        return [data, ...withoutCurrent];
      });

      setSuccess("Assignment submitted successfully.");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit assignment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "No due date";
    }

    return new Date(date).toLocaleDateString();
  }

  function hasSubmission(assignmentId: string) {
    if (!selectedStudent) {
      return false;
    }

    return submissions.some(
      (submission) =>
        submission.assignmentId === assignmentId &&
        submission.studentId === selectedStudent
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Student Assignments
        </h1>

        <p className="mt-1 text-gray-500">
          View assignments and submit student work.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="rounded-xl bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* STUDENT SELECTOR */}
      <div className="rounded-2xl bg-white p-6 shadow">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Select Student
        </label>

        <select
          value={selectedStudent}
          onChange={(event) =>
            handleStudentChange(event.target.value)
          }
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Select a student</option>

          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName} —{" "}
              {student.admissionNumber} — {student.className}
            </option>
          ))}
        </select>
      </div>

      {/* ASSIGNMENTS */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-gray-500 shadow">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-gray-500 shadow">
            No assignments available.
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-2xl bg-white p-6 shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {assignment.title}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {assignment.subject.name}
                  </p>
                </div>

                {hasSubmission(assignment.id) && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Submitted
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Class:</strong>{" "}
                  {assignment.class.name}
                </p>

                <p>
                  <strong>Teacher:</strong>{" "}
                  {assignment.teacher.firstName}{" "}
                  {assignment.teacher.lastName}
                </p>

                <p>
                  <strong>Due:</strong>{" "}
                  {formatDate(assignment.dueDate)}
                </p>
              </div>

              {assignment.description && (
                <p className="mt-4 line-clamp-3 text-sm text-gray-500">
                  {assignment.description}
                </p>
              )}

              <button
                onClick={() => openAssignment(assignment)}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
              >
                {hasSubmission(assignment.id)
                  ? "View / Update Submission"
                  : "Open Assignment"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* SUBMISSION AREA */}
      {selectedAssignment && (
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="border-b pb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedAssignment.title}
            </h2>

            <p className="mt-1 text-blue-600">
              {selectedAssignment.subject.name}
            </p>
          </div>

          <div className="mt-5">
            <h3 className="font-semibold text-gray-800">
              Instructions
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-gray-600">
              {selectedAssignment.description ||
                "No additional instructions provided."}
            </p>
          </div>

          <div className="mt-6">
            <label className="mb-2 block font-semibold text-gray-800">
              Student Answer
            </label>

            <textarea
              value={answer}
              onChange={(event) =>
                setAnswer(event.target.value)
              }
              rows={10}
              placeholder="Enter the student's answer here..."
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={submitAssignment}
              disabled={submitting || !selectedStudent}
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {submitting
                ? "Submitting..."
                : "Submit Assignment"}
            </button>

            <button
              onClick={() => {
                setSelectedAssignment(null);
                setAnswer("");
                setError("");
                setSuccess("");
              }}
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}