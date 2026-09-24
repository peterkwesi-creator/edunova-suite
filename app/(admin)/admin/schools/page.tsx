"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  description: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  websiteEnabled: boolean;
  admissionsEnabled: boolean;
};

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSchools() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/schools");

      if (!response.ok) {
        throw new Error("Failed to load schools");
      }

      const data = await response.json();

      setSchools(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load schools.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  return (
    <div className="p-6">
      {/* HEADER */}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Schools
          </h1>

          <p className="mt-1 text-gray-500">
            Manage all schools using EduNova Suite.
          </p>
        </div>

        <Link
          href="/admin/schools/new"
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          + Add School
        </Link>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="rounded-xl border bg-white p-8 text-gray-500">
          Loading schools...
        </div>
      )}

      {/* EMPTY */}

      {!loading && schools.length === 0 && !error && (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold">
            No schools yet
          </h2>

          <p className="mt-2 text-gray-500">
            Create your first school to begin using
            EduNova Suite.
          </p>

          <Link
            href="/admin/schools/new"
            className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Create First School
          </Link>
        </div>
      )}

      {/* SCHOOL CARDS */}

      {!loading && schools.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((school) => (
            <div
              key={school.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              {/* SCHOOL BRAND */}

              <div
                className="h-2"
                style={{
                  backgroundColor:
                    school.primaryColor || "#2563eb",
                }}
              />

              <div className="p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {school.logo ? (
                      <img
                        src={school.logo}
                        alt={`${school.name} logo`}
                        className="h-12 w-12 rounded-lg border object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-white"
                        style={{
                          backgroundColor:
                            school.primaryColor ||
                            "#2563eb",
                        }}
                      >
                        {school.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h2 className="text-xl font-bold">
                        {school.name}
                      </h2>

                      <p className="text-sm text-gray-500">
                        /{school.slug}
                      </p>
                    </div>
                  </div>
                </div>

                {/* INFORMATION */}

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">
                      Email:
                    </span>{" "}
                    {school.email || "Not provided"}
                  </p>

                  <p>
                    <span className="font-semibold">
                      Phone:
                    </span>{" "}
                    {school.phone || "Not provided"}
                  </p>

                  <p>
                    <span className="font-semibold">
                      Address:
                    </span>{" "}
                    {school.address || "Not provided"}
                  </p>
                </div>

                {/* STATUS */}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      school.websiteEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Website{" "}
                    {school.websiteEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      school.admissionsEnabled
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Admissions{" "}
                    {school.admissionsEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>

                {/* ACTIONS */}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    href={`/admin/schools/${school.id}/settings`}
                    className="rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition hover:bg-gray-50"
                  >
                    Manage School
                  </Link>

                  <Link
                    href={`/admin/schools/${school.id}/settings`}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Customize
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}