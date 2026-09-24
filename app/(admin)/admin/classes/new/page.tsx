"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  userId: string;
  email: string;
  role: string;
  schoolId: string;
};

export default function NewClassPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data?.user) {
          throw new Error("Unable to identify the current school.");
        }

        const user = data.user as CurrentUser;

        if (!user.schoolId) {
          throw new Error("Your account is not connected to a school.");
        }

        setSchoolId(user.schoolId);
      } catch (error) {
        console.error("Load current user error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to identify the current school."
        );
      } finally {
        setLoadingUser(false);
      }
    }

    loadCurrentUser();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter a class name.");
      return;
    }

    if (!schoolId) {
      setError("School information is missing. Please log in again.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          schoolId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to create class."
        );
      }

      router.push("/admin/classes");
      router.refresh();
    } catch (error) {
      console.error("Create class error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create class."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/classes"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Classes
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Add Class
        </h1>

        <p className="mt-1 text-gray-500">
          Create a new class for the school.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              Class Name *
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. JHS 2"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={saving || loadingUser}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Optional description for this class..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={saving || loadingUser}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/classes"
              className="rounded-lg border border-gray-300 px-5 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || loadingUser || !schoolId}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loadingUser
                ? "Loading..."
                : saving
                  ? "Creating..."
                  : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}