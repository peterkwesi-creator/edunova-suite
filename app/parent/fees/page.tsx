"use client";

import { useEffect, useMemo, useState } from "react";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  class?: {
    id: string;
    name: string;
  } | null;
};

type Payment = {
  id: string;
  amount: number;
  reference?: string | null;
  method: string;
  status: string;
  paidAt: string;
};

type Fee = {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  academicYear: string;
  term: string;
  dueDate?: string | null;
  status: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
  };
  payments: Payment[];
};

type FeesResponse = {
  children: Child[];
  fees: Fee[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  const text = await response.text();

  let data: unknown;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Server returned an invalid response. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load fees.";

    throw new Error(message);
  }

  return data as T;
}

export default function ParentFeesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);

  const [selectedChild, setSelectedChild] =
    useState("ALL");

  const [selectedFee, setSelectedFee] =
    useState<Fee | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFees() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchJson<FeesResponse>(
          "/api/parent/fees"
        );

        setChildren(data.children || []);
        setFees(data.fees || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load school fees."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFees();
  }, []);

  const filteredFees = useMemo(() => {
    if (selectedChild === "ALL") {
      return fees;
    }

    return fees.filter(
      (fee) => fee.student.id === selectedChild
    );
  }, [fees, selectedChild]);

  function getPaid(fee: Fee) {
    return fee.payments
      .filter(
        (payment) =>
          payment.status === "COMPLETED"
      )
      .reduce(
        (total, payment) =>
          total + payment.amount,
        0
      );
  }

  function getBalance(fee: Fee) {
    return Math.max(
      fee.amount - getPaid(fee),
      0
    );
  }

  function getStatus(fee: Fee) {
    const paid = getPaid(fee);

    if (paid >= fee.amount) {
      return "PAID";
    }

    if (paid > 0) {
      return "PARTIAL";
    }

    return "UNPAID";
  }

  const totals = useMemo(() => {
    let billed = 0;
    let paid = 0;

    filteredFees.forEach((fee) => {
      billed += fee.amount;
      paid += getPaid(fee);
    });

    return {
      billed,
      paid,
      balance: Math.max(billed - paid, 0),
    };
  }, [filteredFees]);

  function formatMoney(amount: number) {
    return `GH₵ ${amount.toLocaleString(
      "en-GH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(
    date?: string | null
  ) {
    if (!date) return "No due date";

    return new Date(date).toLocaleDateString(
      "en-GH",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatMethod(method: string) {
    return method
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          School Fees
        </h1>

        <p className="mt-1 text-gray-600">
          View your children's fees, payments and
          outstanding balances.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CHILD FILTER */}
      {!loading && children.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Select Child
          </label>

          <select
            value={selectedChild}
            onChange={(event) =>
              setSelectedChild(
                event.target.value
              )
            }
            className="w-full max-w-md rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All Children
            </option>

            {children.map((child) => (
              <option
                key={child.id}
                value={child.id}
              >
                {child.firstName}{" "}
                {child.lastName} —{" "}
                {child.studentNumber}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">
            Total Fees
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatMoney(totals.billed)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">
            Total Paid
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatMoney(totals.paid)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">
            Outstanding Balance
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(totals.balance)}
          </p>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center text-gray-500 shadow-sm">
          Loading school fees...
        </div>
      ) : filteredFees.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
            ₵
          </div>

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            No fee records found
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            There are currently no fee records for
            the selected child.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredFees.map((fee) => {
            const paid = getPaid(fee);
            const balance = getBalance(fee);
            const status = getStatus(fee);

            const progress =
              fee.amount > 0
                ? Math.min(
                    (paid / fee.amount) * 100,
                    100
                  )
                : 0;

            return (
              <div
                key={fee.id}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        {fee.title}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : status === "PARTIAL"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {fee.student.firstName}{" "}
                      {fee.student.lastName} ·{" "}
                      {fee.student.studentNumber}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {fee.academicYear} ·{" "}
                      {fee.term}
                    </p>

                    {fee.description && (
                      <p className="mt-3 text-sm text-gray-600">
                        {fee.description}
                      </p>
                    )}
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-sm text-gray-500">
                      Fee Amount
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      {formatMoney(fee.amount)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Due:{" "}
                      {formatDate(fee.dueDate)}
                    </p>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      Payment Progress
                    </span>

                    <span className="font-bold text-gray-900">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                {/* MONEY SUMMARY */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">
                      Total
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {formatMoney(fee.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs text-gray-500">
                      Paid
                    </p>

                    <p className="mt-1 font-bold text-green-700">
                      {formatMoney(paid)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-xs text-gray-500">
                      Balance
                    </p>

                    <p className="mt-1 font-bold text-red-700">
                      {formatMoney(balance)}
                    </p>
                  </div>
                </div>

                {/* ACTION */}
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() =>
                      setSelectedFee(fee)
                    }
                    className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    View Payment History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAYMENT HISTORY MODAL */}
      {selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-gray-200 bg-white p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Payment History
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedFee.title}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedFee(null)
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Fee
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {formatMoney(
                      selectedFee.amount
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-xs text-gray-500">
                    Paid
                  </p>

                  <p className="mt-1 font-bold text-green-700">
                    {formatMoney(
                      getPaid(selectedFee)
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-gray-500">
                    Balance
                  </p>

                  <p className="mt-1 font-bold text-red-700">
                    {formatMoney(
                      getBalance(selectedFee)
                    )}
                  </p>
                </div>
              </div>

              {selectedFee.payments.length === 0 ? (
                <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
                  <p className="font-semibold text-gray-700">
                    No payments recorded yet.
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Payment history will appear here
                    when the school records a payment.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                          <th className="px-4 py-3 font-semibold">
                            Date
                          </th>

                          <th className="px-4 py-3 font-semibold">
                            Amount
                          </th>

                          <th className="px-4 py-3 font-semibold">
                            Method
                          </th>

                          <th className="px-4 py-3 font-semibold">
                            Reference
                          </th>

                          <th className="px-4 py-3 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedFee.payments.map(
                          (payment) => (
                            <tr
                              key={payment.id}
                              className="border-b border-gray-100 last:border-0"
                            >
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {formatDate(
                                  payment.paidAt
                                )}
                              </td>

                              <td className="px-4 py-4 font-semibold text-green-600">
                                {formatMoney(
                                  payment.amount
                                )}
                              </td>

                              <td className="px-4 py-4 text-sm text-gray-600">
                                {formatMethod(
                                  payment.method
                                )}
                              </td>

                              <td className="px-4 py-4 text-sm text-gray-600">
                                {payment.reference ||
                                  "—"}
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    payment.status ===
                                    "COMPLETED"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() =>
                    setSelectedFee(null)
                  }
                  className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}