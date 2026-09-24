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

type ClassSubject = {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string | null;
  class: ClassItem;
  subject: Subject;
  teacher: Teacher | null;
};

export default function ClassSubjectsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<ClassSubject[]>([]);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");

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
        fetch("/api/class-subjects"),
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

  async function handleAssign(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!classId || !subjectId) {
      setError("Please select a class and subject.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/class-subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          subjectId,
          teacherId: teacherId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to assign subject."
        );
      }

      setAssignments((current) => [data, ...current]);

      setClassId("");
      setSubjectId("");
      setTeacherId("");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to assign subject."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Class Subjects
        </h1>

        <p className="mt-1 text-gray-500">
          Assign subjects and teachers to school classes.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Assignment Form */}
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gray-900">
          Assign Subject
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Connect a subject and teacher to a class.
        </p>

        <form
          onSubmit={handleAssign}
          className="mt-6 grid gap-5 md:grid-cols-3"
        >
          {/* Class */}
          <div>
            <label
              htmlFor="class"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Class *
            </label>

            <select
              id="class"
              value={classId}
              onChange={(event) =>
                setClassId(event.target.value)
              }
              disabled={loading || saving}
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

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Subject *
            </label>

            <select
              id="subject"
              value={subjectId}
              onChange={(event) =>
                setSubjectId(event.target.value)
              }
              disabled={loading || saving}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select subject</option>

              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                  {subject.code
                    ? ` (${subject.code})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label
              htmlFor="teacher"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Teacher
            </label>

            <select
              id="teacher"
              value={teacherId}
              onChange={(event) =>
                setTeacherId(event.target.value)
              }
              disabled={loading || saving}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">No teacher assigned</option>

              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName}
                  {" — "}
                  {teacher.employeeNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving ? "Assigning..." : "Assign Subject"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Assignments */}
      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold text-gray-900">
            Current Assignments
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Subjects currently assigned to classes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Class
                </th>

                <th className="p-4 text-left font-semibold">
                  Subject
                </th>

                <th className="p-4 text-left font-semibold">
                  Teacher
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-12 text-center text-gray-500"
                  >
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-12 text-center text-gray-500"
                  >
                    No class subjects assigned yet.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">
                      {assignment.class.name}
                    </td>

                    <td className="p-4">
                      {assignment.subject.name}

                      {assignment.subject.code && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({assignment.subject.code})
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {assignment.teacher ? (
                        <>
                          {assignment.teacher.firstName}{" "}
                          {assignment.teacher.lastName}
                        </>
                      ) : (
                        <span className="text-gray-400">
                          Not assigned
                        </span>
                      )}
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