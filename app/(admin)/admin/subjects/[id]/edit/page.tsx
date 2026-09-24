"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Subject = {
  id: string;
  name: string;
  code: string;
  description: string | null;
};

export default function EditSubjectPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
            data.error || "Failed to load subject."
          );
        }

        setName(data.name || "");
        setCode(data.code || "");
        setDescription(data.description || "");
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    if (!code.trim()) {
      setError("Please enter a subject code.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || null,
        }),
      });

      const text = await response.text();

      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "The server returned an invalid response while saving."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update subject."
        );
      }

      setSuccess(
        data.message ||
          "Subject updated successfully."
      );

      setTimeout(() => {
        router.push(`/admin/subjects/${id}`);
        router.refresh();
      }, 800);
    } catch (error) {
      console.error("UPDATE SUBJECT ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update subject."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading subject...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href={`/admin/subjects/${id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Subject
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Edit Subject
        </h1>

        <p className="mt-1 text-gray-500">
          Update subject information.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Subject Name *
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
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
              Subject Code *
            </label>

            <input
              id="code"
              type="text"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value.toUpperCase()
                )
              }
              disabled={saving}
              required
              className="w-full rounded-lg border border-gray-300 p-3 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
              disabled={saving}
              rows={4}
              placeholder="Optional subject description"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/admin/subjects/${id}`}
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
                ? "Saving..."
                : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}