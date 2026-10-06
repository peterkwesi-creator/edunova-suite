"use client";

import { FormEvent, useEffect, useState } from "react";

type Summary = {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
  totalExpenses: number;
  otherIncome: number;
  netCashPosition: number;
};

type Payment = {
  id: string;
  amount: number;
  reference: string | null;
  method: string;
  status: string;
  paidAt: string;
  student: {
    firstName: string;
    lastName: string;
    studentNumber: string;
  };
  fee: {
    title: string;
  };
};

type AccountingEntry = {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  reference: string | null;
  paymentMethod: string | null;
  entryDate: string;
};

type AccountingResponse = {
  summary: Summary;
  recentPayments: Payment[];
  recentEntries: AccountingEntry[];
};

function money(value: number) {
  return `₵${value.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AccountingPage() {
  const [data, setData] =
    useState<AccountingResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    type: "EXPENSE",
    category: "",
    description: "",
    amount: "",
    reference: "",
    paymentMethod: "BANK",
    entryDate: "",
  });

  async function loadAccounting() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/accounting",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to load accounting data."
        );
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load accounting data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounting();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/accounting",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            amount: Number(form.amount),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to save accounting entry."
        );
      }

      setForm({
        type: "EXPENSE",
        category: "",
        description: "",
        amount: "",
        reference: "",
        paymentMethod: "BANK",
        entryDate: "",
      });

      setMessage("Accounting entry saved.");

      await loadAccounting();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save accounting entry."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Accounting
        </h1>

        <p className="mt-3 text-gray-500">
          Loading financial information...
        </p>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Finance
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Accounting
        </h1>

        <p className="mt-2 text-gray-500">
          Monitor school income, fee collections,
          expenses and outstanding balances.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Billed
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {money(summary?.totalBilled ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Fees Collected
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {money(summary?.totalCollected ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Outstanding
          </p>

          <p className="mt-2 text-2xl font-bold text-orange-600">
            {money(summary?.outstanding ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Collection Rate
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {summary?.collectionRate ?? 0}%
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Other Income
          </p>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {money(summary?.otherIncome ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Expenses
          </p>

          <p className="mt-2 text-xl font-bold text-red-600">
            {money(summary?.totalExpenses ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Net Cash Position
          </p>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {money(summary?.netCashPosition ?? 0)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Add Accounting Entry
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record school income or expenses that are
            not automatically generated by fee payments.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <select
            value={form.type}
            onChange={(event) =>
              setForm({
                ...form,
                type: event.target.value,
              })
            }
            className="rounded-lg border px-4 py-3"
          >
            <option value="EXPENSE">
              Expense
            </option>
            <option value="INCOME">
              Income
            </option>
          </select>

          <input
            value={form.category}
            onChange={(event) =>
              setForm({
                ...form,
                category: event.target.value,
              })
            }
            placeholder="Category e.g. Salaries"
            className="rounded-lg border px-4 py-3"
            required
          />

          <input
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
            placeholder="Description"
            className="rounded-lg border px-4 py-3"
            required
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              setForm({
                ...form,
                amount: event.target.value,
              })
            }
            placeholder="Amount"
            className="rounded-lg border px-4 py-3"
            required
          />

          <input
            value={form.reference}
            onChange={(event) =>
              setForm({
                ...form,
                reference: event.target.value,
              })
            }
            placeholder="Reference (optional)"
            className="rounded-lg border px-4 py-3"
          />

          <select
            value={form.paymentMethod}
            onChange={(event) =>
              setForm({
                ...form,
                paymentMethod: event.target.value,
              })
            }
            className="rounded-lg border px-4 py-3"
          >
            <option value="BANK">Bank</option>
            <option value="MOBILE_MONEY">
              Mobile Money
            </option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            type="date"
            value={form.entryDate}
            onChange={(event) =>
              setForm({
                ...form,
                entryDate: event.target.value,
              })
            }
            className="rounded-lg border px-4 py-3"
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Accounting Entry"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Recent Fee Payments
        </h2>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="px-3 py-3">
                  Student
                </th>
                <th className="px-3 py-3">
                  Fee
                </th>
                <th className="px-3 py-3">
                  Method
                </th>
                <th className="px-3 py-3">
                  Reference
                </th>
                <th className="px-3 py-3">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {data?.recentPayments.map(
                (payment) => (
                  <tr
                    key={payment.id}
                    className="border-b"
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">
                        {payment.student.firstName}{" "}
                        {payment.student.lastName}
                      </div>

                      <div className="text-xs text-gray-500">
                        {payment.student.studentNumber}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      {payment.fee.title}
                    </td>

                    <td className="px-3 py-3">
                      {payment.method}
                    </td>

                    <td className="px-3 py-3">
                      {payment.reference || "—"}
                    </td>

                    <td className="px-3 py-3 font-semibold">
                      {money(payment.amount)}
                    </td>
                  </tr>
                )
              )}

              {data?.recentPayments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    No fee payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Accounting Ledger
        </h2>

        <div className="mt-5 space-y-3">
          {data?.recentEntries.map(
            (entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {entry.description}
                  </p>

                  <p className="text-sm text-gray-500">
                    {entry.category}
                    {entry.reference
                      ? ` • ${entry.reference}`
                      : ""}
                  </p>
                </div>

                <p
                  className={`font-bold ${
                    entry.type === "EXPENSE"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {entry.type === "EXPENSE"
                    ? "-"
                    : "+"}
                  {money(entry.amount)}
                </p>
              </div>
            )
          )}

          {data?.recentEntries.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              No manual accounting entries yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}