"use client";

import { FormEvent, useEffect, useState } from "react";

type ClassItem = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  class: ClassItem;
  subject: Subject;
  teacher: Teacher;
};

export default function AssignmentsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        classesResponse,
        subjectsResponse,
        teachersResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/subjects"),
        fetch("/api/teachers"),
        fetch("/api/assignments"),
      ]);

      if (
        !classesResponse.ok ||
        !subjectsResponse.ok ||
        !teachersResponse.ok ||
        !assignmentsResponse.ok
      ) {
        throw new Error("Failed to load assignment data.");
      }

      const [
        classesData,
        subjectsData,
        teachersData,
        assignmentsData,
      ] = await Promise.all([
        classesResponse.json(),
        subjectsResponse.json(),
        teachersResponse.json(),
        assignmentsResponse.json(),
      ]);

      setClasses(classesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setAssignments(assignmentsData);
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter an assignment title.");
      return;
    }

    if (!classId) {
      setError("Please select a class.");
      return;
    }

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    if (!teacherId) {
      setError("Please select a teacher.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          classId,
          subjectId,
          teacherId,
          dueDate: dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create assignment."
        );
      }

      setAssignments((current) => [data, ...current]);

      setTitle("");
      setDescription("");
      setClassId("");
      setSubjectId("");
      setTeacherId("");
      setDueDate("");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "No due date";
    }

    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Assignments
        </h1>

        <p className="mt-1 text-gray-500">
          Create and manage assignments for students.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CREATE ASSIGNMENT */}
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gray-900">
          Create Assignment
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Send an assignment to students in a specific class.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          {/* TITLE */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Assignment Title *
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Mathematics Homework 1"
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Instructions / Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Write the assignment instructions here..."
              rows={5}
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* SELECTORS */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Class *
              </label>

              <select
                value={classId}
                onChange={(event) =>
                  setClassId(event.target.value)
                }
                disabled={saving || loading}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select class</option>

                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBJECT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Subject *
              </label>

              <select
                value={subjectId}
                onChange={(event) =>
                  setSubjectId(event.target.value)
                }
                disabled={saving || loading}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select subject</option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                    {subject.code
                      ? ` (${subject.code})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* TEACHER */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Teacher *
              </label>

              <select
                value={teacherId}
                onChange={(event) =>
                  setTeacherId(event.target.value)
                }
                disabled={saving || loading}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select teacher</option>

                {teachers.map((teacher) => (
                  <option
                    key={teacher.id}
                    value={teacher.id}
                  >
                    {teacher.firstName}{" "}
                    {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DUE DATE */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Due Date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              disabled={saving}
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving
              ? "Creating Assignment..."
              : "Create Assignment"}
          </button>
        </form>
      </div>

      {/* ASSIGNMENT LIST */}
      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold text-gray-900">
            Published Assignments
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Assignments currently available in the system.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Assignment
                </th>

                <th className="p-4 text-left font-semibold">
                  Class
                </th>

                <th className="p-4 text-left font-semibold">
                  Subject
                </th>

                <th className="p-4 text-left font-semibold">
                  Teacher
                </th>

                <th className="p-4 text-left font-semibold">
                  Due Date
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-gray-500"
                  >
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-gray-500"
                  >
                    No assignments have been created yet.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="font-semibold">
                        {assignment.title}
                      </div>

                      {assignment.description && (
                        <div className="mt-1 max-w-xs text-sm text-gray-500">
                          {assignment.description}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {assignment.class.name}
                    </td>

                    <td className="p-4">
                      {assignment.subject.name}
                    </td>

                    <td className="p-4">
                      {assignment.teacher.firstName}{" "}
                      {assignment.teacher.lastName}
                    </td>

                    <td className="p-4">
                      {formatDate(assignment.dueDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}