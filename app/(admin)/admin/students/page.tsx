"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  className: string;
  guardianName: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/students", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load students");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid student data received");
      }

      setStudents(data);
    } catch (error) {
      console.error("Load students error:", error);
      setError("Unable to load students. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function deleteStudent(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(id);

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      setStudents((current) =>
        current.filter((student) => student.id !== id)
      );

      window.alert("Student deleted successfully.");
    } catch (error) {
      console.error("Delete student error:", error);
      window.alert("Failed to delete student.");
    } finally {
      setDeleting(null);
    }
  }

  const filteredStudents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.firstName.toLowerCase().includes(searchTerm) ||
        student.lastName.toLowerCase().includes(searchTerm) ||
        student.admissionNumber.toLowerCase().includes(searchTerm) ||
        student.className.toLowerCase().includes(searchTerm) ||
        student.guardianName.toLowerCase().includes(searchTerm)
      );
    });
  }, [students, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Students
          </h1>

          <p className="mt-1 text-gray-500">
            Manage all registered students
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/students/import"
            className="rounded-lg border border-indigo-600 bg-white px-5 py-3 text-center font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            Import Students
          </Link>

          <Link
            href="/admin/students/new"
            className="rounded-lg bg-blue-600 px-5 py-3 text-center font-medium text-white transition hover:bg-blue-700"
          >
            + Add Student
          </Link>
        </div>
      </div>

      {/* Import Quick Action */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-indigo-900">
              Import existing students
            </h2>

            <p className="mt-1 text-sm text-indigo-700">
              Add many students at once instead of entering them
              individually.
            </p>
          </div>

          <Link
            href="/admin/students/import"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Open Import
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm font-medium text-gray-500">
            Total Students
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {students.length}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm font-medium text-gray-500">
            Male Students
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {
              students.filter(
                (student) =>
                  student.gender.toLowerCase() === "male"
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm font-medium text-gray-500">
            Female Students
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {
              students.filter(
                (student) =>
                  student.gender.toLowerCase() === "female"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl bg-white p-5 shadow">
        <label
          htmlFor="student-search"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Search Students
        </label>

        <input
          id="student-search"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, admission number, class or guardian..."
          className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />

        {search && (
          <p className="mt-2 text-sm text-gray-500">
            Found {filteredStudents.length} student
            {filteredStudents.length === 1 ? "" : "s"} matching "
            {search}"
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">{error}</p>

          <button
            onClick={loadStudents}
            className="mt-2 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Students Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Admission No.
                </th>

                <th className="p-4 text-left font-semibold">
                  Name
                </th>

                <th className="p-4 text-left font-semibold">
                  Gender
                </th>

                <th className="p-4 text-left font-semibold">
                  Class
                </th>

                <th className="p-4 text-left font-semibold">
                  Guardian
                </th>

                <th className="p-4 text-left font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    {search
                      ? "No students match your search."
                      : "No students found."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {student.admissionNumber}
                    </td>

                    <td className="p-4 text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>

                    <td className="p-4 text-gray-600">
                      {student.gender}
                    </td>

                    <td className="p-4 text-gray-600">
                      {student.className}
                    </td>

                    <td className="p-4 text-gray-600">
                      {student.guardianName}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="font-medium text-green-600 hover:text-green-800"
                        >
                          View
                        </Link>

                        <Link
                          href={`/admin/students/${student.id}/edit`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() =>
                            deleteStudent(student.id)
                          }
                          disabled={deleting === student.id}
                          className="font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          {deleting === student.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Count */}
      {!loading && (
        <div className="flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:justify-between">
          <p>
            Showing {filteredStudents.length} of{" "}
            {students.length} students
          </p>

          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-left font-medium text-blue-600 hover:text-blue-800 sm:text-right"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}