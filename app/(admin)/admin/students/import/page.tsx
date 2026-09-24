"use client";

import {
  ChangeEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  rowNumber: number;
  admissionNumber: string;
  studentName: string;
  status:
    | "CREATED"
    | "SKIPPED"
    | "FAILED";
  message: string;
};

type ImportResponse = {
  message: string;

  summary: {
    totalRows: number;
    created: number;
    skipped: number;
    failed: number;
    credentialsGenerated: number;
  };

  results: ImportResult[];

  credentials: Array<{
    accountType:
      | "STUDENT"
      | "PARENT";
    name: string;
    admissionNumber: string;
    loginEmail: string;
    temporaryPassword: string;
    status: "NEW" | "EXISTING";
  }>;

  credentialsCsv: string;
};

const TEMPLATE_HEADERS = [
  "Admission Number",
  "First Name",
  "Last Name",
  "Gender",
  "Date of Birth",
  "Phone",
  "Email",
  "Address",
  "Class Name",
  "Parent 1 Name",
  "Parent 1 Phone",
  "Parent 1 Email",
  "Parent 1 Relationship",
  "Parent 2 Name",
  "Parent 2 Phone",
  "Parent 2 Email",
  "Parent 2 Relationship",
];

const TEMPLATE_ROW = [
  "ADM001",
  "Kwame",
  "Mensah",
  "Male",
  "2012-05-14",
  "0240000000",
  "student@example.com",
  "Accra",
  "JHS 1",
  "Kofi Mensah",
  "0241111111",
  "father@example.com",
  "Father",
  "Ama Mensah",
  "0242222222",
  "mother@example.com",
  "Mother",
];

function escapeCsvValue(
  value: string
) {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(
      /"/g,
      '""'
    )}"`;
  }

  return value;
}

function downloadCsv(
  filename: string,
  content: string
) {
  const blob = new Blob(
    [content],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

export default function StudentImportPage() {
  const router = useRouter();

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<ImportResponse | null>(
      null
    );

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setResult(null);

    const selectedFile =
      event.target.files?.[0] ||
      null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "Please select a CSV file. If you have an Excel file, save it as CSV first."
      );

      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  async function handleImport() {
    if (!file) {
      setError(
        "Please select a CSV file first."
      );
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/admin/students/import",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Student import failed."
        );
      }

      setResult(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Student import failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const content = [
      TEMPLATE_HEADERS
        .map(escapeCsvValue)
        .join(","),

      TEMPLATE_ROW
        .map(escapeCsvValue)
        .join(","),
    ].join("\n");

    downloadCsv(
      "edunova-student-import-template.csv",
      content
    );
  }

  function downloadCredentials() {
    if (!result) {
      return;
    }

    downloadCsv(
      "edunova-portal-credentials.csv",
      result.credentialsCsv
    );
  }

  function resetImport() {
    setFile(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Import Existing Students
          </h1>

          <p className="mt-1 text-gray-500">
            Import an existing school's
            students and automatically
            generate their portal accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/students"
            )
          }
          className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Students
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!result && (
        <>
          {/* TEMPLATE */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-blue-950">
                  Step 1 — Prepare your CSV
                </h2>

                <p className="mt-1 text-sm text-blue-800">
                  Download the EduNova
                  template and fill it with
                  the school's existing
                  student and parent data.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  downloadTemplate
                }
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                Download CSV Template
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Required columns:
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  "Admission Number",
                  "First Name",
                  "Last Name",
                  "Gender",
                  "Class Name",
                  "Parent 1 Name",
                ].map(
                  (column) => (
                    <span
                      key={column}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                    >
                      {column}
                    </span>
                  )
                )}
              </div>

              <p className="mt-4 text-sm text-gray-600">
                Parent 2 is optional. Phone,
                email, address, date of birth
                and other contact information
                can also be included.
              </p>
            </div>
          </div>

          {/* UPLOAD */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              Step 2 — Upload CSV
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Maximum file size: 10 MB.
              Maximum 2,000 students per
              import.
            </p>

            <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
              <input
                id="student-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={
                  handleFileChange
                }
                className="hidden"
              />

              <label
                htmlFor="student-csv"
                className="inline-flex cursor-pointer rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-800"
              >
                Choose CSV File
              </label>

              {file && (
                <div className="mt-5">
                  <p className="font-semibold text-gray-900">
                    {file.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {(
                      file.size /
                      1024
                    ).toFixed(1)}{" "}
                    KB
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              <strong>
                Important:
              </strong>{" "}
              Newly generated passwords
              are displayed only during
              this import and should be
              saved securely.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={
                  handleImport
                }
                disabled={
                  !file || loading
                }
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading
                  ? "Importing Students..."
                  : "Start Import"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/students"
                  )
                }
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* PROCESS */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              What EduNova will do
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                "Create each student profile.",
                "Match each student to an existing class.",
                "Create a student portal account.",
                "Create Parent 1 and connect them to the student.",
                "Create optional Parent 2 and connect them to the student.",
                "Reuse an existing parent account when the parent already exists.",
                "Allow one parent account to access multiple children.",
                "Generate a credential report for newly created accounts.",
                "Skip students whose admission numbers already exist.",
                "Report invalid rows without stopping the entire import.",
              ].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-xl border border-gray-200 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {index + 1}
                    </span>

                    <p className="text-sm text-gray-700">
                      {item}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}

      {/* RESULT */}
      {result && (
        <>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-2xl font-bold text-green-950">
              Import Completed
            </h2>

            <p className="mt-1 text-sm text-green-800">
              EduNova finished processing
              the uploaded student list.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-5">
                <p className="text-sm text-gray-500">
                  Total Rows
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {
                    result.summary
                      .totalRows
                  }
                </p>
              </div>

              <div className="rounded-xl bg-white p-5">
                <p className="text-sm text-gray-500">
                  Students Created
                </p>

                <p className="mt-1 text-3xl font-bold text-green-700">
                  {
                    result.summary
                      .created
                  }
                </p>
              </div>

              <div className="rounded-xl bg-white p-5">
                <p className="text-sm text-gray-500">
                  Skipped
                </p>

                <p className="mt-1 text-3xl font-bold text-yellow-700">
                  {
                    result.summary
                      .skipped
                  }
                </p>
              </div>

              <div className="rounded-xl bg-white p-5">
                <p className="text-sm text-gray-500">
                  Failed
                </p>

                <p className="mt-1 text-3xl font-bold text-red-700">
                  {
                    result.summary
                      .failed
                  }
                </p>
              </div>
            </div>
          </div>

          {/* CREDENTIALS */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Portal Credentials
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    result.summary
                      .credentialsGenerated
                  }{" "}
                  new portal credentials
                  were generated.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  downloadCredentials
                }
                disabled={
                  result.credentials
                    .length === 0
                }
                className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Download Credentials CSV
              </button>
            </div>

            {result.credentials
              .length > 0 ? (
              <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Type
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Name
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Admission
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Login Email
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Temporary Password
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.credentials.map(
                      (
                        credential,
                        index
                      ) => (
                        <tr
                          key={`${credential.loginEmail}-${index}`}
                          className="border-t"
                        >
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              {
                                credential.accountType
                              }
                            </span>
                          </td>

                          <td className="px-4 py-3 font-medium text-gray-900">
                            {
                              credential.name
                            }
                          </td>

                          <td className="px-4 py-3 text-gray-600">
                            {
                              credential.admissionNumber
                            }
                          </td>

                          <td className="px-4 py-3 font-mono text-xs text-gray-700">
                            {
                              credential.loginEmail
                            }
                          </td>

                          <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                            {
                              credential.temporaryPassword
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                No new credentials were
                generated. Existing accounts
                were reused or all rows were
                skipped.
              </div>
            )}
          </div>

          {/* RESULTS */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              Import Results
            </h2>

            <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Row
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Admission
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Student
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Message
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {result.results.map(
                    (item) => (
                      <tr
                        key={`${item.rowNumber}-${item.admissionNumber}`}
                        className="border-t"
                      >
                        <td className="px-4 py-3 text-gray-600">
                          {
                            item.rowNumber
                          }
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {
                            item.admissionNumber
                          }
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {
                            item.studentName
                          }
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={
                              item.status ===
                              "CREATED"
                                ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"
                                : item.status ===
                                    "SKIPPED"
                                  ? "rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800"
                                  : "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
                            }
                          >
                            {
                              item.status
                            }
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {
                            item.message
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={
                downloadCredentials
              }
              disabled={
                result.credentials
                  .length === 0
              }
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Download Credentials
            </button>

            <button
              type="button"
              onClick={
                resetImport
              }
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Import Another School List
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/students"
                )
              }
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Go to Students
            </button>
          </div>
        </>
      )}
    </div>
  );
}