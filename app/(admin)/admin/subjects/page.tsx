"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  _count?: {
    classes: number;
    assignments: number;
    results: number;
  };
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSubjects() {
    try {
      const response = await fetch("/api/subjects");

      if (!response.ok) {
        throw new Error("Failed to load subjects");
      }

      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = subjects.filter((subject) => {
    const searchTerm = search.toLowerCase();

    return (
      subject.name.toLowerCase().includes(searchTerm) ||
      (subject.code ?? "").toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Subjects
          </h1>

          <p className="mt-1 text-gray-500">
            Manage all subjects offered by the school.
          </p>
        </div>

        <Link
          href="/admin/subjects/new"
          className="rounded-lg bg-blue-600 px-5 py-3 text-center font-medium text-white transition hover:bg-blue-700"
        >
          + Add Subject
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-xl bg-white p-5 shadow">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Search Subjects
        </label>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by subject name or code..."
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Subject
                </th>

                <th className="p-4 text-left font-semibold">
                  Code
                </th>

                <th className="p-4 text-left font-semibold">
                  Classes
                </th>

                <th className="p-4 text-left font-semibold">
                  Assignments
                </th>

                <th className="p-4 text-left font-semibold">
                  Results
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
                    Loading subjects...
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    {search
                      ? "No subjects match your search."
                      : "No subjects found."}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">
                      {subject.name}
                    </td>

                    <td className="p-4">
                      {subject.code || "—"}
                    </td>

                    <td className="p-4">
                      {subject._count?.classes ?? 0}
                    </td>

                    <td className="p-4">
                      {subject._count?.assignments ?? 0}
                    </td>

                    <td className="p-4">
                      {subject._count?.results ?? 0}
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/admin/subjects/${subject.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          Showing {filteredSubjects.length} of {subjects.length}{" "}
          subjects
        </p>
      )}
    </div>
  );
}