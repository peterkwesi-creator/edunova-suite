"use client";

import { useEffect, useState } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    role: string;
  };
};

export default function StudentNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotes() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch("/api/student/notes");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load notes."
        );
      }

      setNotes(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load notes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            My Notes
          </h1>

          <p className="mt-2 text-slate-600">
            Important notes and feedback from your
            school staff.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Loading your notes...
            </p>
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              📝
            </div>

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              No notes yet
            </h2>

            <p className="mt-2 text-slate-500">
              Your teachers or school administrators
              haven't added any notes for you yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {notes.map((note) => (
              <article
                key={note.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {note.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      From{" "}
                      <span className="font-medium">
                        {note.author.firstName}{" "}
                        {note.author.lastName}
                      </span>
                    </p>
                  </div>

                  <span className="text-sm text-slate-400">
                    {formatDate(note.createdAt)}
                  </span>
                </div>

                <div className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">
                  {note.content}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}