"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
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
  student: Student;
  class?: {
    id: string;
    name: string;
  } | null;
  payments: Payment[];
};

type FeeForm = {
  title: string;
  description: string;
  amount: string;
  academicYear: string;
  term: string;
  studentId: string;
  classId: string;
  dueDate: string;
};

type PaymentForm = {
  feeId: string;
  amount: string;
  method: string;
  reference: string;
};

async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
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
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data as T;
}

export default function AdminFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("ALL");
  const [termFilter, setTermFilter] = useState("ALL");

  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  const [form, setForm] = useState<FeeForm>({
    title: "",
    description: "",
    amount: "",
    academicYear: "2026/2027",
    term: "First Term",
    studentId: "",
    classId: "",
    dueDate: "",
  });

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    feeId: "",
    amount: "",
    method: "CASH",
    reference: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [feesData, studentsData] = await Promise.all([
        fetchJson<Fee[]>("/api/admin/fees"),
        fetchJson<Student[]>("/api/students"),
      ]);

      setFees(feesData);
      setStudents(studentsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load fee information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return fees.filter((fee) => {
      const studentName =
        `${fee.student.firstName} ${fee.student.lastName}`.toLowerCase();

      const matchesSearch =
        !query ||
        fee.title.toLowerCase().includes(query) ||
        studentName.includes(query) ||
        fee.student.studentNumber.toLowerCase().includes(query);

      const matchesStudent =
        studentFilter === "ALL" ||
        fee.student.id === studentFilter;

      const matchesTerm =
        termFilter === "ALL" ||
        fee.term === termFilter;

      return (
        matchesSearch &&
        matchesStudent &&
        matchesTerm
      );
    });
  }, [fees, search, studentFilter, termFilter]);

  const statistics = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;

    for (const fee of fees) {
      totalBilled += fee.amount;

      totalPaid += fee.payments
        .filter((payment) => payment.status === "COMPLETED")
        .reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
    }

    return {
      totalBilled,
      totalPaid,
      balance: Math.max(
        totalBilled - totalPaid,
        0
      ),
      feesCount: fees.length,
    };
  }, [fees]);

  function updateForm(
    field: keyof FeeForm,
    value: string
  ) {
    if (field === "studentId") {
      const selectedStudent = students.find(
        (student) => student.id === value
      );

      setForm((current) => ({
        ...current,
        studentId: value,
        classId:
          selectedStudent?.class?.id || "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createFee(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.studentId) {
        throw new Error(
          "Please select a student."
        );
      }

      if (!form.title.trim()) {
        throw new Error(
          "Please enter a fee title."
        );
      }

      if (
        !form.amount ||
        Number(form.amount) <= 0
      ) {
        throw new Error(
          "Please enter a valid amount."
        );
      }

      await fetchJson<Fee>("/api/admin/fees", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          amount: Number(form.amount),
          academicYear: form.academicYear,
          term: form.term,
          studentId: form.studentId,
          classId: form.classId || null,
          dueDate: form.dueDate || null,
        }),
      });

      setSuccess(
        "Fee created successfully."
      );

      setForm({
        title: "",
        description: "",
        amount: "",
        academicYear: "2026/2027",
        term: "First Term",
        studentId: "",
        classId: "",
        dueDate: "",
      });

      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create fee."
      );
    } finally {
      setSaving(false);
    }
  }

  function openPaymentForm(fee: Fee) {
    const balance = getBalance(fee);

    setSelectedFee(fee);

    setPaymentForm({
      feeId: fee.id,
      amount:
        balance > 0
          ? balance.toFixed(2)
          : "",
      method: "CASH",
      reference: "",
    });

    setShowPaymentForm(true);
    setError("");
    setSuccess("");
  }

  async function recordPayment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setPaying(true);
      setError("");
      setSuccess("");

      if (!paymentForm.feeId) {
        throw new Error(
          "No fee selected."
        );
      }

      const amount = Number(
        paymentForm.amount
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          "Please enter a valid payment amount."
        );
      }

      await fetchJson(
        "/api/admin/fees/payments",
        {
          method: "POST",
          body: JSON.stringify({
            feeId: paymentForm.feeId,
            amount,
            method: paymentForm.method,
            reference:
              paymentForm.reference || null,
          }),
        }
      );

      setSuccess(
        "Payment recorded successfully."
      );

      setShowPaymentForm(false);
      setSelectedFee(null);

      setPaymentForm({
        feeId: "",
        amount: "",
        method: "CASH",
        reference: "",
      });

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to record payment."
      );
    } finally {
      setPaying(false);
    }
  }

  function getPaidAmount(fee: Fee) {
    return fee.payments
      .filter(
        (payment) =>
          payment.status === "COMPLETED"
      )
      .reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );
  }

  function getBalance(fee: Fee) {
    return Math.max(
      fee.amount - getPaidAmount(fee),
      0
    );
  }

  function getStatus(fee: Fee) {
    const paid = getPaidAmount(fee);

    if (paid >= fee.amount) {
      return "PAID";
    }

    if (paid > 0) {
      return "PARTIAL";
    }

    return "UNPAID";
  }

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
    if (!date) {
      return "No due date";
    }

    return new Date(
      date
    ).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            School Fees
          </h1>

          <p className="mt-1 text-gray-600">
            Manage student fees, payments and
            outstanding balances.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm((current) => !current);
            setError("");
            setSuccess("");
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {showForm
            ? "Close Form"
            : "+ Add Fee"}
        </button>
      </div>

      {/* ALERTS */}
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

      {/* STATISTICS */}
      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">
            Total Fees
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatMoney(
              statistics.totalBilled
            )}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {statistics.feesCount} fee records
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">
            Total Paid
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatMoney(
              statistics.totalPaid
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">
            Outstanding
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(
              statistics.balance
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">
            Students
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {students.length}
          </p>
        </div>
      </div>

      {/* CREATE FEE FORM */}
      {showForm && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Create Student Fee
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add a fee to a student's account.
          </p>

          <form
            onSubmit={createFee}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Fee Title
              </label>

              <input
                value={form.title}
                onChange={(event) =>
                  updateForm(
                    "title",
                    event.target.value
                  )
                }
                placeholder="e.g. School Fees"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  updateForm(
                    "amount",
                    event.target.value
                  )
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Student
              </label>

              <select
                value={form.studentId}
                onChange={(event) =>
                  updateForm(
                    "studentId",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">
                  Select student
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.firstName}{" "}
                    {student.lastName} —{" "}
                    {student.studentNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Academic Year
              </label>

              <input
                value={form.academicYear}
                onChange={(event) =>
                  updateForm(
                    "academicYear",
                    event.target.value
                  )
                }
                placeholder="2026/2027"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Term
              </label>

              <select
                value={form.term}
                onChange={(event) =>
                  updateForm(
                    "term",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="First Term">
                  First Term
                </option>

                <option value="Second Term">
                  Second Term
                </option>

                <option value="Third Term">
                  Third Term
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Due Date
              </label>

              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  updateForm(
                    "dueDate",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Optional description..."
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Creating..."
                  : "Create Fee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTERS */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search fee or student..."
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={studentFilter}
            onChange={(event) =>
              setStudentFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="ALL">
              All Students
            </option>

            {students.map((student) => (
              <option
                key={student.id}
                value={student.id}
              >
                {student.firstName}{" "}
                {student.lastName}
              </option>
            ))}
          </select>

          <select
            value={termFilter}
            onChange={(event) =>
              setTermFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="ALL">
              All Terms
            </option>

            <option value="First Term">
              First Term
            </option>

            <option value="Second Term">
              Second Term
            </option>

            <option value="Third Term">
              Third Term
            </option>
          </select>
        </div>
      </div>

      {/* FEES TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading fees...
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-gray-700">
              No fee records found.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Create a fee using the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="px-5 py-4 font-semibold">
                    Student
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Fee
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Term
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Amount
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Paid
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Balance
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Due
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredFees.map((fee) => {
                  const paid =
                    getPaidAmount(fee);

                  const balance =
                    getBalance(fee);

                  const status =
                    getStatus(fee);

                  return (
                    <tr
                      key={fee.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-5">
                        <p className="font-semibold text-gray-900">
                          {fee.student.firstName}{" "}
                          {fee.student.lastName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {fee.student.studentNumber}
                        </p>

                        {fee.student.class && (
                          <p className="text-xs text-gray-500">
                            {fee.student.class.name}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-medium text-gray-900">
                          {fee.title}
                        </p>

                        {fee.description && (
                          <p className="max-w-[200px] truncate text-xs text-gray-500">
                            {fee.description}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-600">
                        <p>{fee.term}</p>

                        <p className="text-xs text-gray-400">
                          {fee.academicYear}
                        </p>
                      </td>

                      <td className="px-5 py-5 font-semibold text-gray-900">
                        {formatMoney(
                          fee.amount
                        )}
                      </td>

                      <td className="px-5 py-5 font-semibold text-green-600">
                        {formatMoney(paid)}
                      </td>

                      <td className="px-5 py-5 font-semibold text-red-600">
                        {formatMoney(balance)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-600">
                        {formatDate(
                          fee.dueDate
                        )}
                      </td>

                      <td className="px-5 py-5">
                        {balance > 0 ? (
                          <button
                            onClick={() =>
                              openPaymentForm(
                                fee
                              )
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            Record Payment
                          </button>
                        ) : (
                          <span className="text-sm font-semibold text-green-600">
                            Fully Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentForm &&
        selectedFee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Record Payment
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedFee.student.firstName}{" "}
                    {selectedFee.student.lastName}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowPaymentForm(
                      false
                    );
                    setSelectedFee(null);
                  }}
                  className="text-2xl text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Fee Amount
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {formatMoney(
                      selectedFee.amount
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-gray-500">
                    Outstanding
                  </p>

                  <p className="mt-1 font-bold text-red-600">
                    {formatMoney(
                      getBalance(
                        selectedFee
                      )
                    )}
                  </p>
                </div>
              </div>

              <form
                onSubmit={recordPayment}
                className="mt-6 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Payment Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    max={getBalance(
                      selectedFee
                    )}
                    step="0.01"
                    value={
                      paymentForm.amount
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (current) => ({
                          ...current,
                          amount:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-semibold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Payment Method
                  </label>

                  <select
                    value={
                      paymentForm.method
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (current) => ({
                          ...current,
                          method:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
                  >
                    <option value="CASH">
                      Cash
                    </option>

                    <option value="BANK">
                      Bank Transfer
                    </option>

                    <option value="MOBILE_MONEY">
                      Mobile Money
                    </option>

                    <option value="CARD">
                      Card
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Reference
                    <span className="ml-1 font-normal text-gray-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    value={
                      paymentForm.reference
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (current) => ({
                          ...current,
                          reference:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. transaction reference"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(
                        false
                      );
                      setSelectedFee(null);
                    }}
                    className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={paying}
                    className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paying
                      ? "Recording..."
                      : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}