"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SchoolClass = {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    students?: number;
    subjects?: number;
  };
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/classes", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to load classes"
        );
      }

      const classList = Array.isArray(data)
        ? data
        : Array.isArray(data?.classes)
          ? data.classes
          : [];

      setClasses(classList);
    } catch (error) {
      console.error("Load classes error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load classes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Classes
          </h1>

          <p className="mt-1 text-gray-500">
            Manage the school's classes.
          </p>
        </div>

        <Link
          href="/admin/classes/new"
          className="rounded-lg bg-blue-600 px-5 py-3 text-center font-medium text-white hover:bg-blue-700"
        >
          + Add Class
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Unable to load classes</p>
          <p className="mt-1 text-sm">{error}</p>

          <button
            onClick={loadClasses}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Class
                </th>

                <th className="p-4 text-left font-semibold">
                  Description
                </th>

                <th className="p-4 text-left font-semibold">
                  Students
                </th>

                <th className="p-4 text-left font-semibold">
                  Subjects
                </th>

                <th className="p-4 text-left font-semibold">
                  Action
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
                    Loading classes...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-gray-500"
                  >
                    No classes have been created yet.
                  </td>
                </tr>
              ) : (
                classes.map((schoolClass) => (
                  <tr
                    key={schoolClass.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-semibold">
                      {schoolClass.name}
                    </td>

                    <td className="p-4 text-gray-600">
                      {schoolClass.description ||
                        "No description"}
                    </td>

                    <td className="p-4">
                      {schoolClass._count?.students ?? 0}
                    </td>

                    <td className="p-4">
                      {schoolClass._count?.subjects ?? 0}
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/admin/classes/${schoolClass.id}`}
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
    </div>
  );
}