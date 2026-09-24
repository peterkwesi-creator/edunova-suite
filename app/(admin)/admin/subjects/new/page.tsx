"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthUser = {
  schoolId: string;
};

export default function NewSubjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load your account."
          );
        }

        if (!data.user?.schoolId) {
          throw new Error(
            "Your account is not connected to a school."
          );
        }
      } catch (error) {
        console.error("LOAD USER ERROR:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load your account."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    setSaving(true);

    try {
      const meResponse = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const meData = await meResponse.json();

      if (!meResponse.ok || !meData.user?.schoolId) {
        throw new Error(
          meData.error ||
            "Could not determine your school."
        );
      }

      const schoolId = meData.user.schoolId;

      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          schoolId,
        }),
      });

      const text = await response.text();

      let data: {
        error?: string;
        message?: string;
      } = {};

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
          data.error || "Failed to create subject."
        );
      }

      router.push("/admin/subjects");
      router.refresh();
    } catch (error) {
      console.error("CREATE SUBJECT ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create subject."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/subjects"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Subjects
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Add Subject
        </h1>

        <p className="mt-1 text-gray-500">
          Add a new subject to the school's curriculum.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Subject Name *
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Mathematics"
              disabled={saving}
              required
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Subject Code
            </label>

            <input
              id="code"
              name="code"
              type="text"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.toUpperCase())
              }
              placeholder="e.g. MATH"
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="mt-2 text-sm text-gray-500">
              Optional. This can be used on report cards
              and academic records.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/subjects"
              className="rounded-lg border border-gray-300 px-5 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving
                ? "Creating..."
                : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}