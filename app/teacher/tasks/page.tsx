"use client";

import { FormEvent, useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

async function fetchJson(
  url: string,
  options?: RequestInit
) {
  const response = await fetch(url, options);

  const contentType =
    response.headers.get("content-type") || "";

  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `${url} returned HTML instead of JSON. Status: ${response.status}`
    );
  }

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `${url} returned invalid JSON. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    const errorData = data as {
      error?: string;
    };

    throw new Error(
      errorData?.error ||
        `${url} failed with status ${response.status}`
    );
  }

  return data;
}

function formatDate(date: string | null) {
  if (!date) {
    return "No deadline";
  }

  return new Date(date).toLocaleDateString(
    "en-GH",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(date: string | null) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString(
    "en-GH",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getDateStatus(task: Task) {
  if (!task.dueDate || task.completed) {
    return null;
  }

  const due = new Date(task.dueDate);
  const now = new Date();

  if (due.getTime() < now.getTime()) {
    return "overdue";
  }

  return null;
}

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [dueDate, setDueDate] = useState("");

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [editTitle, setEditTitle] =
    useState("");
  const [editDescription, setEditDescription] =
    useState("");
  const [editDueDate, setEditDueDate] =
    useState("");

  const [loading, setLoading] =
    useState(true);
  const [creating, setCreating] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);
  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchJson(
        "/api/staff/tasks"
      );

      setTasks(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tasks."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function createTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (!title.trim()) {
      setError(
        "Please enter a task title."
      );
      return;
    }

    try {
      setCreating(true);

      const data = await fetchJson(
        "/api/staff/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description:
              description.trim() || null,
            dueDate:
              dueDate || null,
          }),
        }
      );

      const newTask = data as Task;

      setTasks((current) => [
        newTask,
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setDueDate("");

      setSuccess(
        "Task created successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create task."
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggleTask(task: Task) {
    clearMessages();

    try {
      setUpdatingId(task.id);

      const data = await fetchJson(
        `/api/staff/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            completed: !task.completed,
          }),
        }
      );

      const updatedTask = data as Task;

      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function startEditing(task: Task) {
    clearMessages();

    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(
      task.description || ""
    );

    if (task.dueDate) {
      const date = new Date(task.dueDate);

      const localDate = new Date(
        date.getTime() -
          date.getTimezoneOffset() * 60000
      );

      setEditDueDate(
        localDate
          .toISOString()
          .slice(0, 16)
      );
    } else {
      setEditDueDate("");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
  }

  async function saveEdit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingTask) {
      return;
    }

    clearMessages();

    if (!editTitle.trim()) {
      setError(
        "Please enter a task title."
      );
      return;
    }

    try {
      setSaving(true);

      const data = await fetchJson(
        `/api/staff/tasks/${editingTask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description:
              editDescription.trim() || null,
            dueDate:
              editDueDate || null,
          }),
        }
      );

      const updatedTask = data as Task;

      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );

      cancelEditing();

      setSuccess(
        "Task updated successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task: Task) {
    const confirmed =
      window.confirm(
        `Delete "${task.title}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      setDeletingId(task.id);

      await fetchJson(
        `/api/staff/tasks/${task.id}`,
        {
          method: "DELETE",
        }
      );

      setTasks((current) =>
        current.filter(
          (item) => item.id !== task.id
        )
      );

      if (
        editingTask?.id === task.id
      ) {
        cancelEditing();
      }

      setSuccess(
        "Task deleted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete task."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount =
    tasks.length - completedCount;

  const overdueCount = tasks.filter(
    (task) =>
      getDateStatus(task) === "overdue"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Loading your tasks...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <section>
          <p className="text-sm font-semibold text-blue-600">
            EduNova Suite
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Tasks
          </h1>

          <p className="mt-2 text-slate-500">
            Organize your teaching work,
            deadlines and daily responsibilities.
          </p>
        </section>

        {/* MESSAGES */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Tasks
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {completedCount}
            </p>

            {overdueCount > 0 && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {overdueCount} overdue
              </p>
            )}
          </div>
        </section>

        {/* CREATE / EDIT */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingTask
                ? "Edit Task"
                : "Create a Task"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {editingTask
                ? "Update the task details below."
                : "Add something you need to complete."}
            </p>
          </div>

          {editingTask ? (
            <form
              onSubmit={saveEdit}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task Title
                </label>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Prepare mathematics lesson"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Add additional details..."
                />
              </div>

              <div className="max-w-md">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date
                </label>

                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(event) =>
                    setEditDueDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={createTask}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Prepare mathematics lesson"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Add additional details..."
                />
              </div>

              <div className="max-w-md">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date
                </label>

                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {creating
                  ? "Creating..."
                  : "Create Task"}
              </button>
            </form>
          )}
        </section>

        {/* TASK LIST */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your current teaching tasks.
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {tasks.length}{" "}
              {tasks.length === 1
                ? "task"
                : "tasks"}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                ✓
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No tasks yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first task above to
                start organizing your work.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {tasks.map((task) => {
                const overdue =
                  getDateStatus(task) ===
                  "overdue";

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl border p-5 transition ${
                      task.completed
                        ? "border-green-200 bg-green-50/40"
                        : overdue
                        ? "border-red-200 bg-red-50/30"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            toggleTask(task)
                          }
                          disabled={
                            updatingId ===
                            task.id
                          }
                          aria-label={
                            task.completed
                              ? "Mark task as incomplete"
                              : "Mark task as complete"
                          }
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                            task.completed
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-slate-300 bg-white text-transparent hover:border-blue-500"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          ✓
                        </button>

                        <div className="min-w-0">
                          <h3
                            className={`font-semibold ${
                              task.completed
                                ? "text-slate-400 line-through"
                                : "text-slate-900"
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p
                              className={`mt-2 whitespace-pre-wrap text-sm ${
                                task.completed
                                  ? "text-slate-400"
                                  : "text-slate-600"
                              }`}
                            >
                              {
                                task.description
                              }
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                            <span
                              className={`font-medium ${
                                overdue
                                  ? "text-red-600"
                                  : task.completed
                                  ? "text-green-600"
                                  : "text-slate-500"
                              }`}
                            >
                              {task.completed
                                ? "Completed"
                                : task.dueDate
                                ? overdue
                                  ? `Overdue · ${formatDate(
                                      task.dueDate
                                    )}`
                                  : `Due ${formatDate(
                                      task.dueDate
                                    )}`
                                : "No deadline"}
                            </span>

                            {task.createdAt && (
                              <span className="text-slate-400">
                                Created{" "}
                                {formatDate(
                                  task.createdAt
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(task)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteTask(task)
                          }
                          disabled={
                            deletingId ===
                            task.id
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          task.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    {task.updatedAt !==
                      task.createdAt && (
                      <p className="mt-4 text-xs text-slate-400">
                        Last updated{" "}
                        {formatDateTime(
                          task.updatedAt
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}