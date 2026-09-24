"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Subject = {
  id: string;
  name: string;
  code: string;
  description: string | null;
};

export default function SubjectPage() {
  const params = useParams();
  const id = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubject() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/subjects/${id}`, {
          cache: "no-store",
        });

        const text = await response.text();

        let data: any = {};

        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error(
              "The server returned an invalid response."
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              `Failed to load subject. Server status: ${response.status}`
          );
        }

        if (!data?.id) {
          throw new Error(
            "The server did not return valid subject information."
          );
        }

        setSubject(data);
      } catch (error) {
        console.error("LOAD SUBJECT ERROR:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load subject."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadSubject();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading subject...
        </p>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">
            Failed to load subject
          </p>

          <p className="mt-2 text-sm">
            {error || "Subject not found."}
          </p>
        </div>

        <Link
          href="/admin/subjects"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          ← Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {subject.name}
          </h1>

          <p className="mt-1 text-gray-500">
            Subject Details
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/subjects"
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>

          <Link
            href={`/admin/subjects/${subject.id}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Edit Subject
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
            {subject.name.charAt(0).toUpperCase()}
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            {subject.name}
          </h2>

          <p className="mt-1 text-gray-500">
            {subject.code || "No code"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow md:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">
            Subject Information
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Subject Name
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {subject.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Subject Code
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {subject.code || "Not provided"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">
                Description
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {subject.description ||
                  "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-blue-900">
          Class & Teacher Assignments
        </h2>

        <p className="mt-2 text-blue-800">
          Classes and teachers assigned to this subject
          will appear here.
        </p>
      </div>
    </div>
  );
}