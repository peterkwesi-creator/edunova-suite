"use client";

import { useEffect, useMemo, useState } from "react";

type ContactMessage = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] =
    useState<ContactMessage | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadMessages() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/contact-messages"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load messages."
        );
      }

      setMessages(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load messages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    if (filter === "ALL") {
      return messages;
    }

    return messages.filter(
      (message) => message.status === filter
    );
  }, [messages, filter]);

  const newCount = messages.filter(
    (message) => message.status === "NEW"
  ).length;

  const resolvedCount = messages.filter(
    (message) => message.status === "RESOLVED"
  ).length;

  async function updateStatus(
    id: string,
    status: string
  ) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/contact-messages",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update message."
        );
      }

      setSuccess("Message status updated.");
      setSelected(null);

      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update message."
      );
    }
  }

  async function deleteMessage(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/contact-messages",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete message."
        );
      }

      setSuccess("Message deleted.");
      setSelected(null);

      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete message."
      );
    }
  }

  return (
    <main className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Contact Messages
        </h1>

        <p className="mt-2 text-slate-600">
          Manage enquiries, complaints, suggestions and feedback
          submitted through your public website.
        </p>
      </div>

      {/* ALERTS */}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Messages
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {messages.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-700">
            New Messages
          </p>

          <p className="mt-2 text-3xl font-black text-amber-900">
            {newCount}
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="text-sm font-semibold text-green-700">
            Resolved
          </p>

          <p className="mt-2 text-3xl font-black text-green-900">
            {resolvedCount}
          </p>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "NEW", "IN_PROGRESS", "RESOLVED"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                filter === status
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status === "ALL"
                ? "All"
                : status.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {/* MESSAGES */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading messages...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-bold text-slate-900">
            No messages found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Messages submitted through the website will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <article
              key={message.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <button
                  onClick={() => setSelected(message)}
                  className="text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {message.type}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        message.status === "NEW"
                          ? "bg-amber-100 text-amber-700"
                          : message.status === "RESOLVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {message.status.replace("_", " ")}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-black text-slate-900">
                    {message.subject || "No subject"}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {message.name}
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {message.message}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(
                      message.createdAt
                    ).toLocaleString()}
                  </p>
                </button>

                <div className="flex flex-wrap gap-2">
                  {message.email && (
                    <a
                      href={`mailto:${message.email}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Email
                    </a>
                  )}

                  {message.phone && (
                    <a
                      href={`tel:${message.phone}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Call
                    </a>
                  )}

                  <button
                    onClick={() =>
                      updateStatus(
                        message.id,
                        message.status === "RESOLVED"
                          ? "NEW"
                          : "RESOLVED"
                      )
                    }
                    className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
                  >
                    {message.status === "RESOLVED"
                      ? "Reopen"
                      : "Resolve"}
                  </button>

                  <button
                    onClick={() =>
                      deleteMessage(message.id)
                    }
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MESSAGE MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {selected.type}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {selected.status.replace("_", " ")}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-900">
                  {selected.subject || "No subject"}
                </h2>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Name
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selected.name}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Date
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {new Date(
                    selected.createdAt
                  ).toLocaleString()}
                </p>
              </div>

              {selected.email && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </p>

                  <a
                    href={`mailto:${selected.email}`}
                    className="mt-1 block break-all font-semibold text-blue-600"
                  >
                    {selected.email}
                  </a>
                </div>
              )}

              {selected.phone && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Phone
                  </p>

                  <a
                    href={`tel:${selected.phone}`}
                    className="mt-1 block font-semibold text-blue-600"
                  >
                    {selected.phone}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Message
              </p>

              <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {selected.message}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  updateStatus(selected.id, "IN_PROGRESS")
                }
                className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Mark In Progress
              </button>

              <button
                onClick={() =>
                  updateStatus(selected.id, "RESOLVED")
                }
                className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
              >
                Mark Resolved
              </button>

              <button
                onClick={() =>
                  deleteMessage(selected.id)
                }
                className="rounded-xl bg-red-50 px-5 py-3 font-bold text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}