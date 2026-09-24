"use client";

import { useEffect, useMemo, useState } from "react";

type Term = {
  id: string;
  name: string;
  order: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms: Term[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dateInput(value: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showYearModal, setShowYearModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);

  const [selectedYear, setSelectedYear] =
    useState<AcademicYear | null>(null);

  const [yearName, setYearName] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");

  const [termName, setTermName] = useState("Term 1");
  const [termOrder, setTermOrder] = useState("1");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [termCurrent, setTermCurrent] = useState(true);

  async function loadAcademicYears() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/academic-years");

      if (!response.ok) {
        throw new Error("Failed to load academic years.");
      }

      const data = await response.json();
      setAcademicYears(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load academic years.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const currentYear = useMemo(
    () => academicYears.find((year) => year.isCurrent),
    [academicYears]
  );

  const currentTerm = useMemo(
    () =>
      currentYear?.terms.find((term) => term.isCurrent),
    [currentYear]
  );

  async function createAcademicYear() {
    setMessage("");
    setError("");

    if (!yearName || !yearStart || !yearEnd) {
      setError("Please complete all academic year fields.");
      return;
    }

    try {
      const response = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: yearName,
          startDate: yearStart,
          endDate: yearEnd,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create academic year.");
        return;
      }

      setMessage("Academic year created successfully.");

      setShowYearModal(false);
      setYearName("");
      setYearStart("");
      setYearEnd("");

      await loadAcademicYears();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }

  async function setCurrentYear(id: string) {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/academic-years/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCurrent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to activate academic year.");
        return;
      }

      setMessage("Current academic year updated.");
      await loadAcademicYears();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }

  async function deleteYear(id: string) {
    const confirmed = window.confirm(
      "Delete this academic year? All its terms will also be deleted."
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/academic-years/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete academic year.");
        return;
      }

      setMessage("Academic year deleted.");
      await loadAcademicYears();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }

  function openTermModal(year: AcademicYear) {
    setSelectedYear(year);

    const nextOrder =
      year.terms.length > 0
        ? Math.max(...year.terms.map((term) => term.order)) + 1
        : 1;

    setTermName(`Term ${nextOrder}`);
    setTermOrder(String(nextOrder));
    setTermStart(dateInput(year.startDate));
    setTermEnd(dateInput(year.endDate));
    setTermCurrent(year.terms.length === 0);

    setError("");
    setMessage("");
    setShowTermModal(true);
  }

  async function createTerm() {
    if (!selectedYear) return;

    setMessage("");
    setError("");

    if (!termName || !termStart || !termEnd || !termOrder) {
      setError("Please complete all term fields.");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/academic-years/${selectedYear.id}/terms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: termName,
            order: Number(termOrder),
            startDate: termStart,
            endDate: termEnd,
            isCurrent: termCurrent,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create term.");
        return;
      }

      setMessage("Term created successfully.");
      setShowTermModal(false);

      await loadAcademicYears();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }

  async function setCurrentTerm(termId: string) {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/terms/${termId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCurrent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to activate term.");
        return;
      }

      setMessage("Current term updated.");
      await loadAcademicYears();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }

  async function deleteTerm(termId: string) {
    const confirmed = window.confirm("Delete this term?");

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/terms/${termId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete term.");
        return;
      }

      setMessage("Term deleted.");
      await loadAcademicYears();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Academic Years & Terms
          </h1>
          <p className="mt-1 text-gray-500">
            Manage academic years, school terms and the current academic period.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setMessage("");
            setShowYearModal(true);
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + New Academic Year
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Academic Years</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {academicYears.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Current Academic Year</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {currentYear?.name || "Not set"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Current Term</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {currentTerm?.name || "Not set"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
          Loading academic years...
        </div>
      ) : academicYears.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            No academic years yet
          </h2>
          <p className="mt-2 text-gray-500">
            Create your first academic year to begin organizing the school calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {academicYears.map((year) => (
            <div
              key={year.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {year.name}
                    </h2>

                    {year.isCurrent && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        CURRENT YEAR
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    {formatDate(year.startDate)} —{" "}
                    {formatDate(year.endDate)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!year.isCurrent && (
                    <button
                      onClick={() => setCurrentYear(year.id)}
                      className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      Set Current
                    </button>
                  )}

                  <button
                    onClick={() => openTermModal(year)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + Add Term
                  </button>

                  {!year.isCurrent && (
                    <button
                      onClick={() => deleteYear(year.id)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                {year.terms.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No terms have been created for this academic year.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {year.terms.map((term) => (
                      <div
                        key={term.id}
                        className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                            {term.order}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {term.name}
                              </h3>

                              {term.isCurrent && (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                  CURRENT
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                              {formatDate(term.startDate)} —{" "}
                              {formatDate(term.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!term.isCurrent && year.isCurrent && (
                            <button
                              onClick={() => setCurrentTerm(term.id)}
                              className="rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                            >
                              Set Current
                            </button>
                          )}

                          {!term.isCurrent && (
                            <button
                              onClick={() => deleteTerm(term.id)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                New Academic Year
              </h2>

              <button
                onClick={() => setShowYearModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Academic Year
                </label>

                <input
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowYearModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={createAcademicYear}
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermModal && selectedYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add Term
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedYear.name}
                </p>
              </div>

              <button
                onClick={() => setShowTermModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Term Name
                  </label>

                  <input
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                    placeholder="Term 1"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Order
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={termOrder}
                    onChange={(e) => setTermOrder(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={termStart}
                    onChange={(e) => setTermStart(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={termEnd}
                    onChange={(e) => setTermEnd(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={termCurrent}
                  onChange={(e) => setTermCurrent(e.target.checked)}
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-gray-700">
                  Make this the current term
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowTermModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={createTerm}
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Create Term
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}