"use client";

import { useEffect, useMemo, useState } from "react";

type AcademicYear = {
  id: string;
  name: string;
  isCurrent: boolean;
  terms: {
    id: string;
    name: string;
    order: number;
    isCurrent: boolean;
  }[];
};

type SchoolClass = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
};

type TimetableEntry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  notes: string | null;
  class: SchoolClass;
  subject: Subject;
  teacher: Teacher | null;
};

const days = [
  { value: 1, name: "Monday" },
  { value: 2, name: "Tuesday" },
  { value: 3, name: "Wednesday" },
  { value: 4, name: "Thursday" },
  { value: 5, name: "Friday" },
];

export default function TimetablePage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    classId: "",
    subjectId: "",
    teacherId: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "09:00",
    room: "",
    notes: "",
  });

  const selectedYear = useMemo(
    () => academicYears.find((year) => year.id === academicYearId),
    [academicYears, academicYearId]
  );

  const selectedTerm = useMemo(
    () => selectedYear?.terms.find((term) => term.id === termId),
    [selectedYear, termId]
  );

  async function loadInitialData() {
    try {
      setLoading(true);

      const [yearsResponse, classesResponse, subjectsResponse, teachersResponse] =
        await Promise.all([
          fetch("/api/admin/academic-years"),
          fetch("/api/classes"),
          fetch("/api/subjects"),
          fetch("/api/teachers"),
        ]);

      const [years, classesData, subjectsData, teachersData] =
        await Promise.all([
          yearsResponse.json(),
          classesResponse.json(),
          subjectsResponse.json(),
          teachersResponse.json(),
        ]);

      const yearList = Array.isArray(years) ? years : [];

      setAcademicYears(yearList);

      const classList = Array.isArray(classesData)
        ? classesData
        : classesData.classes || [];

      const subjectList = Array.isArray(subjectsData)
        ? subjectsData
        : subjectsData.subjects || [];

      const teacherList = Array.isArray(teachersData)
        ? teachersData
        : teachersData.teachers || [];

      setClasses(classList);
      setSubjects(subjectList);
      setTeachers(teacherList);

      const currentYear =
        yearList.find((year) => year.isCurrent) || yearList[0];

      if (currentYear) {
        setAcademicYearId(currentYear.id);

    const currentTerm =
        currentYear.terms.find(
        (term: AcademicYear["terms"][number]) => term.isCurrent
        ) || currentYear.terms[0];

        if (currentTerm) {
          setTermId(currentTerm.id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load timetable setup data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadEntries() {
    if (!academicYearId || !termId) {
      setEntries([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        academicYearId,
        termId,
      });

      if (classId) {
        params.set("classId", classId);
      }

      const response = await fetch(
        `/api/admin/timetable?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load timetable.");
        return;
      }

      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load timetable.");
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [academicYearId, termId, classId]);

  function openModal() {
    setForm({
      classId: classId || classes[0]?.id || "",
      subjectId: subjects[0]?.id || "",
      teacherId: "",
      dayOfWeek: "1",
      startTime: "08:00",
      endTime: "09:00",
      room: "",
      notes: "",
    });

    setMessage("");
    setError("");
    setShowModal(true);
  }

  async function createEntry() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academicYearId,
          termId,
          ...form,
          dayOfWeek: Number(form.dayOfWeek),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create timetable entry.");
        return;
      }

      setMessage("Timetable entry created successfully.");
      setShowModal(false);

      await loadEntries();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm("Delete this timetable entry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/timetable/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete entry.");
        return;
      }

      setMessage("Timetable entry deleted.");
      await loadEntries();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }

  const entriesByDay = useMemo(() => {
    const result: Record<number, TimetableEntry[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    for (const entry of entries) {
      if (result[entry.dayOfWeek]) {
        result[entry.dayOfWeek].push(entry);
      }
    }

    return result;
  }, [entries]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
        Loading timetable...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Timetable
          </h1>

          <p className="mt-1 text-gray-500">
            Schedule classes, subjects and teachers for each term.
          </p>
        </div>

        <button
          onClick={openModal}
          disabled={!academicYearId || !termId}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          + Add Period
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Academic Year
          </label>

          <select
            value={academicYearId}
            onChange={(e) => {
              const id = e.target.value;
              setAcademicYearId(id);

              const year = academicYears.find((item) => item.id === id);

              setTermId(
                year?.terms.find((term) => term.isCurrent)?.id ||
                  year?.terms[0]?.id ||
                  ""
              );
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="">Select academic year</option>

            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
                {year.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Term
          </label>

          <select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="">Select term</option>

            {selectedYear?.terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
                {term.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Class
          </label>

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="">All Classes</option>

            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!academicYearId || !termId ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
          Create an academic year and term first.
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div
              key={day.value}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {day.name}
                </h2>
              </div>

              {entriesByDay[day.value].length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No periods scheduled.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {entriesByDay[day.value].map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-24 rounded-lg bg-blue-50 px-3 py-2 text-center">
                          <p className="font-bold text-blue-700">
                            {entry.startTime}
                          </p>

                          <p className="text-xs text-blue-500">
                            {entry.endTime}
                          </p>
                        </div>

                        <div>
                          <h3 className="font-bold text-gray-900">
                            {entry.subject.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-600">
                            {entry.class.name}
                          </p>

                          {entry.teacher && (
                            <p className="mt-1 text-sm text-gray-500">
                              Teacher: {entry.teacher.firstName}{" "}
                              {entry.teacher.lastName}
                            </p>
                          )}

                          {entry.room && (
                            <p className="mt-1 text-sm text-gray-500">
                              Room: {entry.room}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add Timetable Period
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedYear?.name} · {selectedTerm?.name}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Class
                </label>

                <select
                  value={form.classId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      classId: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">Select class</option>

                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subject
                </label>

                <select
                  value={form.subjectId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subjectId: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">Select subject</option>

                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Teacher
                </label>

                <select
                  value={form.teacherId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      teacherId: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">No teacher assigned</option>

                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Day
                </label>

                <select
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dayOfWeek: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  {days.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time
                </label>

                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Time
                </label>

                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Room
                </label>

                <input
                  value={form.room}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      room: e.target.value,
                    })
                  }
                  placeholder="e.g. Room 4"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>

                <input
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={createEntry}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving ? "Saving..." : "Add Period"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}