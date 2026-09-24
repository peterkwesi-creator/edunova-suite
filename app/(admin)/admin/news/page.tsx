"use client";

import { FormEvent, useEffect, useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";

type NewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  published: boolean;
  publishedAt: string;
};

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  published: true,
};

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadNews() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/news");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load news."
        );
      }

      setNews(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load news."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  function updateField(
    field: keyof typeof emptyForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(item: NewsItem) {
    setEditingId(item.id);

    setForm({
      title: item.title,
      excerpt: item.excerpt || "",
      content: item.content,
      imageUrl: item.imageUrl || "",
      published: item.published,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const url = editingId
        ? `/api/admin/news/${editingId}`
        : "/api/admin/news";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save news."
        );
      }

      setMessage(
        editingId
          ? "News article updated successfully."
          : "News article created successfully."
      );

      cancelEditing();
      await loadNews();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save news."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteNews(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this news article?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/news/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete news."
        );
      }

      setMessage(
        "News article deleted successfully."
      );

      await loadNews();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete news."
      );
    }
  }

  async function togglePublished(item: NewsItem) {
    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/news/${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: item.title,
            excerpt: item.excerpt || "",
            content: item.content,
            imageUrl: item.imageUrl || "",
            published: !item.published,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update publication status."
        );
      }

      setMessage(
        !item.published
          ? "News article published."
          : "News article unpublished."
      );

      await loadNews();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update publication status."
      );
    }
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          News & Updates
        </h1>

        <p className="mt-2 text-slate-600">
          Publish school news, events, announcements and important
          updates on the public website.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">
            {editingId
              ? "Edit News Article"
              : "Create News Article"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Everything entered here can appear on the school's
            public News page.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Title *
            </label>

            <input
              value={form.title}
              onChange={(e) =>
                updateField(
                  "title",
                  e.target.value
                )
              }
              required
              placeholder="e.g. Students Visit the National Museum"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Short Description
            </label>

            <textarea
              value={form.excerpt}
              onChange={(e) =>
                updateField(
                  "excerpt",
                  e.target.value
                )
              }
              rows={3}
              placeholder="A short summary shown on news cards..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Article *
            </label>

            <textarea
              value={form.content}
              onChange={(e) =>
                updateField(
                  "content",
                  e.target.value
                )
              }
              required
              rows={10}
              placeholder="Write the full news article here..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <ImageUpload
              value={form.imageUrl || null}
              onChange={(url) =>
                updateField(
                  "imageUrl",
                  url || ""
                )
              }
              uploadFolder="news"
              label="News Article Image"
              description="Drag & drop the article image here, click to browse, or paste an image with Ctrl + V"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                updateField(
                  "published",
                  e.target.checked
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-semibold text-slate-700">
              Publish this article publicly
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Article"
                  : "Publish Article"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Published & Draft Articles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {news.length} article
              {news.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading news...
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="font-bold text-slate-900">
              No news articles yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first school news article above.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {news.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col md:flex-row">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-52 w-full object-cover md:h-auto md:w-64"
                    />
                  ) : (
                    <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-slate-400 md:h-auto md:w-64">
                      No Image
                    </div>
                  )}

                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.published
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.published
                          ? "PUBLISHED"
                          : "DRAFT"}
                      </span>

                      <span className="text-xs text-slate-400">
                        {new Date(
                          item.publishedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black text-slate-900">
                      {item.title}
                    </h3>

                    {item.excerpt && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          startEditing(item)
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          togglePublished(item)
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {item.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        onClick={() =>
                          deleteNews(item.id)
                        }
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}