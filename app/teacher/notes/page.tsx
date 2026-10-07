"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  class: {
    id: string;
    name: string;
  } | null;
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
  };
  author: {
    firstName: string;
    lastName: string;
    role: string;
  };
};

type ClassOption = {
  id: string;
  name: string;
};

async function fetchJson(
  url: string,
  options?: RequestInit
) {
  const response = await fetch(
    url,
    options
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  const text =
    await response.text();

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
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
    const errorData =
      data as {
        error?: string;
      };

    throw new Error(
      errorData?.error ||
        `${url} failed with status ${response.status}`
    );
  }

  return data;
}

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    "en-GH",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function TeacherNotesPage() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [notes, setNotes] =
    useState<Note[]>([]);

  const [recipientType, setRecipientType] =
    useState<
      "student" | "class"
    >("student");

  const [studentId, setStudentId] =
    useState("");

  const [classId, setClassId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        studentData,
        noteData,
      ] = await Promise.all([
        fetchJson(
          "/api/teacher/students"
        ),
        fetchJson(
          "/api/staff/student-notes"
        ),
      ]);

      setStudents(
        Array.isArray(
          studentData
        )
          ? studentData
          : []
      );

      setNotes(
        Array.isArray(noteData)
          ? noteData
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load student notes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const classes =
    useMemo<ClassOption[]>(
      () => {
        const map =
          new Map<
            string,
            ClassOption
          >();

        for (const student of students) {
          if (!student.class) {
            continue;
          }

          if (
            !map.has(
              student.class.id
            )
          ) {
            map.set(
              student.class.id,
              {
                id:
                  student.class.id,
                name:
                  student.class.name,
              }
            );
          }
        }

        return Array.from(
          map.values()
        ).sort((a, b) =>
          a.name.localeCompare(
            b.name
          )
        );
      },
      [students]
    );

  const selectedClassStudents =
    useMemo(
      () =>
        students.filter(
          (student) =>
            student.class?.id ===
            classId
        ),
      [students, classId]
    );

  async function createNote(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      recipientType ===
        "student" &&
      !studentId
    ) {
      setError(
        "Please select a student."
      );
      return;
    }

    if (
      recipientType === "class" &&
      !classId
    ) {
      setError(
        "Please select a class."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Please enter a note title."
      );
      return;
    }

    if (!content.trim()) {
      setError(
        "Please enter the note."
      );
      return;
    }

    if (
      recipientType === "class" &&
      selectedClassStudents.length === 0
    ) {
      setError(
        "There are no students in the selected class."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const body =
        recipientType ===
        "class"
          ? {
              classId,
              title:
                title.trim(),
              content:
                content.trim(),
            }
          : {
              studentId,
              title:
                title.trim(),
              content:
                content.trim(),
            };

      const data =
        await fetchJson(
          "/api/staff/student-notes",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(body),
          }
        );

      if (
        recipientType ===
        "class"
      ) {
       const responseData = data as {
        count?: number;
};

      const count =
       typeof responseData.count === "number"
         ? responseData.count
         : selectedClassStudents.length;

        setSuccess(
          `Note sent successfully to ${count} student${
            count === 1
              ? ""
              : "s"
          } in the selected class.`
        );
      } else {
        setNotes(
          (current) => [
            data as Note,
            ...current,
          ]
        );

        setSuccess(
          "Student note created successfully."
        );
      }

      setStudentId("");
      setClassId("");
      setTitle("");
      setContent("");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create student note."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <p className="text-slate-500">
              Loading student notes...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            EduNova Suite
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Student Notes
          </h1>

          <p className="mt-2 text-slate-500">
            Send private feedback to an
            individual student or a note to
            an entire class.
          </p>
        </div>

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

        {/* CREATE NOTE */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Send Note
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose whether this note is for one
            student or your entire assigned class.
          </p>

          <form
            onSubmit={createNote}
            className="mt-6 space-y-5"
          >
            {/* RECIPIENT TYPE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Send To
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType(
                      "student"
                    );
                    setClassId("");
                    setSuccess("");
                    setError("");
                  }}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    recipientType ===
                    "student"
                      ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-bold text-slate-900">
                    Individual Student
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Send a private note to one
                    student.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecipientType(
                      "class"
                    );
                    setStudentId("");
                    setSuccess("");
                    setError("");
                  }}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    recipientType ===
                    "class"
                      ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-bold text-slate-900">
                    Entire Class
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Send the same note to every
                    student in the class.
                  </p>
                </button>
              </div>
            </div>

            {/* STUDENT */}
            {recipientType ===
              "student" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Student
                </label>

                <select
                  value={studentId}
                  onChange={(event) =>
                    setStudentId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">
                    Select a student
                  </option>

                  {students.map(
                    (student) => (
                      <option
                        key={
                          student.id
                        }
                        value={
                          student.id
                        }
                      >
                        {
                          student.firstName
                        }{" "}
                        {
                          student.lastName
                        }{" "}
                        —{" "}
                        {student.class
                          ?.name ||
                          "No class"}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* CLASS */}
            {recipientType ===
              "class" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Class
                </label>

                <select
                  value={classId}
                  onChange={(event) =>
                    setClassId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">
                    Select a class
                  </option>

                  {classes.map(
                    (schoolClass) => (
                      <option
                        key={
                          schoolClass.id
                        }
                        value={
                          schoolClass.id
                        }
                      >
                        {
                          schoolClass.name
                        }
                      </option>
                    )
                  )}
                </select>

                {classId && (
                  <p className="mt-2 text-sm text-indigo-600">
                    This will send the note to{" "}
                    <strong>
                      {
                        selectedClassStudents.length
                      }
                    </strong>{" "}
                    student
                    {selectedClassStudents.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    in this class.
                  </p>
                )}
              </div>
            )}

            {/* TITLE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Note Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="e.g. Excellent participation"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* CONTENT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Note
              </label>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
                rows={6}
                placeholder="Write your note or feedback..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving
                ? "Sending..."
                : recipientType ===
                    "class"
                  ? "Send To Entire Class"
                  : "Save Student Note"}
            </button>
          </form>
        </section>

        {/* NOTES */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Student Notes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Notes you have written for your
                students.
              </p>
            </div>

            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
              {notes.length}
            </span>
          </div>

          {notes.length ===
          0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-slate-500">
                You have not written any student
                notes yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {notes.map(
                (note) => (
                  <article
                    key={note.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {note.title}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-indigo-600">
                          {
                            note
                              .student
                              .firstName
                          }{" "}
                          {
                            note
                              .student
                              .lastName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            note
                              .student
                              .studentNumber
                          }
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(
                          note.createdAt
                        )}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {
                        note.content
                      }
                    </p>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}