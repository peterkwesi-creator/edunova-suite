"use client";

import ImageUpload from "@/components/ui/ImageUpload";
import { useEffect, useMemo, useState } from "react";

type SchoolClass = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  class: SchoolClass | null;
  _count: {
    results: number;
  };
};

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms?: Term[];
};

type Term = {
  id: string;
  name: string;
  order: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type Result = {
  id: string;
  assessmentScore: number | null;
  examScore: number | null;
  totalScore: number;
  grade: string | null;
  level: string;
  meaning: string;
  remark: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
  } | null;
  position?: number | null;
};

type ReportInfo = {
  id: string;
  academicYearId: string | null;
  termId: string | null;
  photoUrl: string | null;
  vacationDate: string | null;
  reopeningDate: string | null;
  promotionStatus: string | null;
  conduct: string | null;
  attitude: string | null;
  interest: string | null;
  classTeacherRemark: string | null;
  headteacherRemark: string | null;
  classTeacherName: string | null;
  headteacherName: string | null;
  classTeacherSignature: string | null;
  headteacherSignature: string | null;
};

type ReportData = {
  student: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    class: SchoolClass | null;
  };
  reportInfo: ReportInfo | null;
  results: Result[];
  statistics: {
    totalMarks: number;
    average: number;
    position: number | null;
    classSize: number;
    grade: string;
    level: string;
    meaning: string;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  };
};

const emptyForm = {
  academicYearId: "",
  termId: "",
  photoUrl: "",
  vacationDate: "",
  reopeningDate: "",
  promotionStatus: "PROMOTED",
  conduct: "",
  attitude: "",
  interest: "",
  classTeacherRemark: "",
  headteacherRemark: "",
  classTeacherName: "",
  headteacherName: "",
  classTeacherSignature: "",
  headteacherSignature: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatInputDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function getAttendanceRate(
  attendance: ReportData["attendance"]
) {
  if (attendance.total === 0) {
    return 0;
  }

  return Math.round(
    (attendance.present / attendance.total) * 100
  );
}

export default function AdminReportCardPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<
    AcademicYear[]
  >([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [selectedClassId, setSelectedClassId] =
    useState("");

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [selectedYearId, setSelectedYearId] =
    useState("");

  const [selectedTermId, setSelectedTermId] =
    useState("");

  const [report, setReport] =
    useState<ReportData | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [loadingClasses, setLoadingClasses] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const selectedYear = useMemo(
    () =>
      academicYears.find(
        (year) => year.id === selectedYearId
      ),
    [academicYears, selectedYearId]
  );

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoadingClasses(true);

        const response = await fetch(
          "/api/classes"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load classes."
          );
        }

        const data = await response.json();

        setClasses(
          Array.isArray(data)
            ? data
            : data.classes ?? []
        );
      } catch (error) {
        console.error(error);

        setMessage(
          "Unable to load classes."
        );
      } finally {
        setLoadingClasses(false);
      }
    }

    loadClasses();
  }, []);

  useEffect(() => {
    async function loadAcademicYears() {
      try {
        const response = await fetch(
          "/api/admin/academic-years"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load academic years."
          );
        }

        const data = await response.json();

        const years: AcademicYear[] =
          Array.isArray(data)
            ? data
            : data.academicYears ?? [];

        setAcademicYears(years);

        const currentYear =
          years.find(
            (year) => year.isCurrent
          );

        if (currentYear) {
          setSelectedYearId(
            currentYear.id
          );

          if (
            currentYear.terms &&
            currentYear.terms.length > 0
          ) {
            setTerms(
              currentYear.terms
            );

            const currentTerm =
              currentYear.terms.find(
                (term) =>
                  term.isCurrent
              );

            if (currentTerm) {
              setSelectedTermId(
                currentTerm.id
              );
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (!selectedYearId) {
      setTerms([]);
      setSelectedTermId("");
      return;
    }

    async function loadTerms() {
      try {
        const response = await fetch(
          `/api/admin/academic-years/${selectedYearId}/terms`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load terms."
          );
        }

        const data = await response.json();

        const loadedTerms: Term[] =
          Array.isArray(data)
            ? data
            : data.terms ?? [];

        setTerms(loadedTerms);

        const currentTerm =
          loadedTerms.find(
            (term) =>
              term.isCurrent
          );

        if (currentTerm) {
          setSelectedTermId(
            currentTerm.id
          );
        } else if (
          loadedTerms.length > 0
        ) {
          setSelectedTermId(
            loadedTerms[0].id
          );
        } else {
          setSelectedTermId("");
        }
      } catch (error) {
        console.error(error);
        setTerms([]);
      }
    }

    loadTerms();
  }, [selectedYearId]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setSelectedStudentId("");
      setReport(null);
      return;
    }

    async function loadStudents() {
      try {
        setLoadingStudents(true);

        const response = await fetch(
          `/api/admin/report-card?classId=${encodeURIComponent(
            selectedClassId
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load students."
          );
        }

        const data =
          await response.json();

        setStudents(
          Array.isArray(data)
            ? data
            : []
        );

        setSelectedStudentId("");
        setReport(null);
      } catch (error) {
        console.error(error);

        setStudents([]);

        setMessage(
          "Unable to load students."
        );
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedStudentId) {
      setReport(null);
      return;
    }

    async function loadReport() {
      try {
        setLoadingReport(true);
        setMessage("");

        const response = await fetch(
          `/api/admin/report-card?studentId=${encodeURIComponent(
            selectedStudentId
          )}&academicYearId=${encodeURIComponent(
            selectedYearId
          )}&termId=${encodeURIComponent(
            selectedTermId
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load report card."
          );
        }

        const data: ReportData =
          await response.json();

        setReport(data);

        const savedInfo =
          data.reportInfo;

        setForm({
          academicYearId:
            savedInfo?.academicYearId ??
            selectedYearId ??
            "",

          termId:
            savedInfo?.termId ??
            selectedTermId ??
            "",

          photoUrl:
            savedInfo?.photoUrl ??
            "",

          vacationDate:
            formatInputDate(
              savedInfo?.vacationDate
            ),

          reopeningDate:
            formatInputDate(
              savedInfo?.reopeningDate
            ),

          promotionStatus:
            savedInfo?.promotionStatus ??
            "PROMOTED",

          conduct:
            savedInfo?.conduct ??
            "",

          attitude:
            savedInfo?.attitude ??
            "",

          interest:
            savedInfo?.interest ??
            "",

          classTeacherRemark:
            savedInfo?.classTeacherRemark ??
            "",

          headteacherRemark:
            savedInfo?.headteacherRemark ??
            "",

          classTeacherName:
            savedInfo?.classTeacherName ??
            "",

          headteacherName:
            savedInfo?.headteacherName ??
            "",

          classTeacherSignature:
            savedInfo?.classTeacherSignature ??
            "",

          headteacherSignature:
            savedInfo?.headteacherSignature ??
            "",
        });
      } catch (error) {
        console.error(error);

        setReport(null);

        setMessage(
          "Unable to load report card."
        );
      } finally {
        setLoadingReport(false);
      }
    }

    loadReport();
  }, [
    selectedStudentId,
    selectedYearId,
    selectedTermId,
  ]);

  function updateForm(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveReport() {
    if (!report) {
      setMessage(
        "Please select a student first."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/report-card",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            studentId:
              report.student.id,

            academicYearId:
              form.academicYearId ||
              null,

            termId:
              form.termId ||
              null,

            photoUrl:
              form.photoUrl ||
              null,

            vacationDate:
              form.vacationDate ||
              null,

            reopeningDate:
              form.reopeningDate ||
              null,

            promotionStatus:
              form.promotionStatus ||
              null,

            conduct:
              form.conduct ||
              null,

            attitude:
              form.attitude ||
              null,

            interest:
              form.interest ||
              null,

            classTeacherRemark:
              form.classTeacherRemark ||
              null,

            headteacherRemark:
              form.headteacherRemark ||
              null,

            classTeacherName:
              form.classTeacherName ||
              null,

            headteacherName:
              form.headteacherName ||
              null,

            classTeacherSignature:
              form.classTeacherSignature ||
              null,

            headteacherSignature:
              form.headteacherSignature ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save report."
        );
      }

      setMessage(
        "Report card information saved successfully."
      );

      setReport((current) =>
        current
          ? {
              ...current,
              reportInfo:
                data.reportInfo ??
                current.reportInfo,
            }
          : current
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save report."
      );
    } finally {
      setSaving(false);
    }
  }

  function printReport() {
    window.print();
  }

  const attendanceRate =
    report
      ? getAttendanceRate(
          report.attendance
        )
      : 0;

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #report-card-print,
          #report-card-print * {
            visibility: visible;
          }

          #report-card-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* HEADER */}
        <div className="no-print">
          <h1 className="text-3xl font-black text-gray-900">
            Report Cards
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Generate, manage and print
            professional student terminal
            reports.
          </p>
        </div>

        {/* SELECTION PANEL */}
        <div className="no-print rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Select Report
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Class
              </label>

              <select
                value={selectedClassId}
                onChange={(event) =>
                  setSelectedClassId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  {loadingClasses
                    ? "Loading classes..."
                    : "Select class"}
                </option>

                {classes.map(
                  (schoolClass) => (
                    <option
                      key={schoolClass.id}
                      value={
                        schoolClass.id
                      }
                    >
                      {schoolClass.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* STUDENT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Student
              </label>

              <select
                value={selectedStudentId}
                onChange={(event) =>
                  setSelectedStudentId(
                    event.target.value
                  )
                }
                disabled={
                  !selectedClassId ||
                  loadingStudents
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingStudents
                    ? "Loading students..."
                    : "Select student"}
                </option>

                {students.map(
                  (student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.firstName}{" "}
                      {student.lastName} —{" "}
                      {student.studentNumber}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ACADEMIC YEAR */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Academic Year
              </label>

              <select
                value={
                  form.academicYearId
                }
                onChange={(event) => {
                  const value =
                    event.target.value;

                  updateForm(
                    "academicYearId",
                    value
                  );

                  setSelectedYearId(
                    value
                  );
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select academic year
                </option>

                {academicYears.map(
                  (year) => (
                    <option
                      key={year.id}
                      value={year.id}
                    >
                      {year.name}
                      {year.isCurrent
                        ? " — Current"
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TERM */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Term
              </label>

              <select
                value={form.termId}
                onChange={(event) =>
                  updateForm(
                    "termId",
                    event.target.value
                  )
                }
                disabled={
                  !form.academicYearId
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  Select term
                </option>

                {terms.map((term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                    {term.isCurrent
                      ? " — Current"
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {message}
            </div>
          )}
        </div>

        {/* EDITOR */}
        {report && (
          <div className="no-print grid gap-6 xl:grid-cols-2">
            {/* REPORT INFORMATION */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Report Information
              </h2>

              <div className="mt-5 space-y-5">
                {/* STUDENT PHOTO */}
                <ImageUpload
                  value={
                    form.photoUrl ||
                    null
                  }
                  onChange={(url) =>
                    updateForm(
                      "photoUrl",
                      url || ""
                    )
                  }
                  uploadFolder="schools"
                  label="Student Photo"
                  description="Drag & drop the student's photo here, click to browse, or paste an image with Ctrl + V"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Vacation Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.vacationDate
                      }
                      onChange={(event) =>
                        updateForm(
                          "vacationDate",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Reopening Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.reopeningDate
                      }
                      onChange={(event) =>
                        updateForm(
                          "reopeningDate",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Promotion Status
                  </label>

                  <select
                    value={
                      form.promotionStatus
                    }
                    onChange={(event) =>
                      updateForm(
                        "promotionStatus",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                  >
                    <option value="PROMOTED">
                      Promoted
                    </option>

                    <option value="PROMOTED_ON_TRIAL">
                      Promoted on Trial
                    </option>

                    <option value="RETAINED">
                      Retained
                    </option>

                    <option value="PENDING">
                      Pending
                    </option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Conduct
                    </label>

                    <input
                      value={
                        form.conduct
                      }
                      onChange={(event) =>
                        updateForm(
                          "conduct",
                          event.target.value
                        )
                      }
                      placeholder="Excellent"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Attitude
                    </label>

                    <input
                      value={
                        form.attitude
                      }
                      onChange={(event) =>
                        updateForm(
                          "attitude",
                          event.target.value
                        )
                      }
                      placeholder="Very Good"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Interest
                    </label>

                    <input
                      value={
                        form.interest
                      }
                      onChange={(event) =>
                        updateForm(
                          "interest",
                          event.target.value
                        )
                      }
                      placeholder="Very Good"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* REMARKS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Remarks & Signatures
              </h2>

              <div className="mt-5 space-y-5">
                {/* CLASS TEACHER */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Class Teacher
                  </label>

                  <input
                    value={
                      form.classTeacherName
                    }
                    onChange={(event) =>
                      updateForm(
                        "classTeacherName",
                        event.target.value
                      )
                    }
                    placeholder="Class teacher name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Class Teacher's Remark
                  </label>

                  <textarea
                    value={
                      form.classTeacherRemark
                    }
                    onChange={(event) =>
                      updateForm(
                        "classTeacherRemark",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Class teacher's remark..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                  />
                </div>

                <ImageUpload
                  value={
                    form.classTeacherSignature ||
                    null
                  }
                  onChange={(url) =>
                    updateForm(
                      "classTeacherSignature",
                      url || ""
                    )
                  }
                  uploadFolder="schools"
                  label="Class Teacher Signature"
                  description="Drag & drop the signature image here, click to browse, or paste with Ctrl + V"
                />

                {/* HEADTEACHER */}
                <div className="border-t border-gray-200 pt-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Headteacher
                  </label>

                  <input
                    value={
                      form.headteacherName
                    }
                    onChange={(event) =>
                      updateForm(
                        "headteacherName",
                        event.target.value
                      )
                    }
                    placeholder="Headteacher name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Headteacher's Remark
                  </label>

                  <textarea
                    value={
                      form.headteacherRemark
                    }
                    onChange={(event) =>
                      updateForm(
                        "headteacherRemark",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Headteacher's remark..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                  />
                </div>

                <ImageUpload
                  value={
                    form.headteacherSignature ||
                    null
                  }
                  onChange={(url) =>
                    updateForm(
                      "headteacherSignature",
                      url || ""
                    )
                  }
                  uploadFolder="schools"
                  label="Headteacher Signature"
                  description="Drag & drop the signature image here, click to browse, or paste with Ctrl + V"
                />

                <button
                  onClick={saveReport}
                  disabled={saving}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Report Information"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loadingReport && (
          <div className="no-print rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Loading report card...
          </div>
        )}

        {/* REPORT CARD */}
        {report && !loadingReport && (
          <div
            id="report-card-print"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
          >
            {/* PRINT BUTTON */}
            <div className="no-print mb-6 flex justify-end">
              <button
                onClick={printReport}
                className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
              >
                Print Report Card
              </button>
            </div>

            {/* SCHOOL HEADER */}
            <div className="border-b-2 border-gray-900 pb-5 text-center">
              <h1 className="text-3xl font-black uppercase tracking-wide text-gray-900">
                EduNova School
              </h1>

              <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Student Terminal Report
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {selectedYear?.name ||
                  "Academic Year"}{" "}
                •{" "}
                {terms.find(
                  (term) =>
                    term.id ===
                    form.termId
                )?.name ||
                  "Term"}
              </p>
            </div>

            {/* STUDENT DETAILS */}
            <div className="mt-6 grid gap-6 md:grid-cols-[120px_1fr]">
              <div className="flex justify-center">
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt="Student"
                    className="h-32 w-28 rounded-xl border-2 border-gray-300 object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-28 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-center text-xs text-gray-400">
                    Student
                    <br />
                    Photo
                  </div>
                )}
              </div>

              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Student Name
                  </p>

                  <p className="font-bold text-gray-900">
                    {report.student.firstName}{" "}
                    {report.student.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Student Number
                  </p>

                  <p className="font-bold text-gray-900">
                    {report.student.studentNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Class
                  </p>

                  <p className="font-bold text-gray-900">
                    {report.student.class
                      ?.name ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Gender
                  </p>

                  <p className="font-bold text-gray-900">
                    {report.student.gender ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Class Position
                  </p>

                  <p className="font-bold text-gray-900">
                    {report.statistics
                      .position
                      ? `${report.statistics.position} / ${report.statistics.classSize}`
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Promotion
                  </p>

                  <p className="font-bold text-gray-900">
                    {form.promotionStatus.replaceAll(
                      "_",
                      " "
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* RESULTS */}
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-black uppercase">
                Academic Performance
              </h2>

              <div className="overflow-hidden rounded-xl border border-gray-300">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 text-left">
                        Subject
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-center">
                        Assessment
                        <br />
                        /50
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-center">
                        Exam
                        <br />
                        /50
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-center">
                        Total
                        <br />
                        /100
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-center">
                        Position
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-center">
                        Grade
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-center">
                        Level
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-left">
                        Meaning / Remark
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.results.map(
                      (result) => (
                        <tr
                          key={result.id}
                        >
                          <td className="border border-gray-300 px-2 py-2 font-semibold">
                            {result.subject.name}
                          </td>

                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {result.assessmentScore ??
                              0}
                          </td>

                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {result.examScore ??
                              0}
                          </td>

                          <td className="border border-gray-300 px-2 py-2 text-center font-bold">
                            {result.totalScore}
                          </td>

                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {result.position ??
                              "—"}
                          </td>

                          <td className="border border-gray-300 px-2 py-2 text-center font-bold">
                            {result.grade ??
                              "—"}
                          </td>

                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {result.level}
                          </td>

                          <td className="border border-gray-300 px-2 py-2">
                            <span className="font-semibold">
                              {result.meaning}
                            </span>

                            {result.remark && (
                              <span className="block text-xs text-gray-500">
                                {result.remark}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}

                    {report.results.length ===
                      0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                          >
                            No results have been
                            entered for this
                            student.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SUMMARY */}
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-300 p-4">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Average
                </p>

                <p className="mt-1 text-2xl font-black">
                  {report.statistics.average.toFixed(
                    2
                  )}
                  %
                </p>
              </div>

              <div className="rounded-xl border border-gray-300 p-4">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Overall Grade
                </p>

                <p className="mt-1 text-2xl font-black">
                  {report.statistics.grade}
                </p>
              </div>

              <div className="rounded-xl border border-gray-300 p-4">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Attendance
                </p>

                <p className="mt-1 text-2xl font-black">
                  {attendanceRate}%
                </p>
              </div>

              <div className="rounded-xl border border-gray-300 p-4">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Total Marks
                </p>

                <p className="mt-1 text-2xl font-black">
                  {report.statistics.totalMarks}
                </p>
              </div>
            </div>

            {/* ATTENDANCE */}
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-black uppercase">
                Attendance Summary
              </h2>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="rounded-lg border border-gray-300 p-3 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Present
                  </p>

                  <p className="text-xl font-black">
                    {report.attendance.present}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-300 p-3 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Absent
                  </p>

                  <p className="text-xl font-black">
                    {report.attendance.absent}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-300 p-3 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Late
                  </p>

                  <p className="text-xl font-black">
                    {report.attendance.late}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-300 p-3 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Excused
                  </p>

                  <p className="text-xl font-black">
                    {report.attendance.excused}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-300 p-3 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Attendance
                  </p>

                  <p className="text-xl font-black">
                    {attendanceRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* CHARACTER */}
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-black uppercase">
                General Assessment
              </h2>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-gray-300 p-4">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Conduct
                  </p>

                  <p className="mt-1 font-semibold">
                    {form.conduct ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-300 p-4">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Attitude
                  </p>

                  <p className="mt-1 font-semibold">
                    {form.attitude ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-300 p-4">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Interest
                  </p>

                  <p className="mt-1 font-semibold">
                    {form.interest ||
                      "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* REMARKS */}
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-gray-300 p-5">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Class Teacher's Remark
                </p>

                <p className="mt-2 min-h-20 text-sm leading-6">
                  {form.classTeacherRemark ||
                    "No remark provided."}
                </p>

                <div className="mt-5 border-t border-gray-300 pt-3">
                  <p className="font-bold">
                    {form.classTeacherName ||
                      "Class Teacher"}
                  </p>

                  {form.classTeacherSignature && (
                    <img
                      src={
                        form.classTeacherSignature
                      }
                      alt="Class teacher signature"
                      className="mt-2 h-12 max-w-40 object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-300 p-5">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Headteacher's Remark
                </p>

                <p className="mt-2 min-h-20 text-sm leading-6">
                  {form.headteacherRemark ||
                    "No remark provided."}
                </p>

                <div className="mt-5 border-t border-gray-300 pt-3">
                  <p className="font-bold">
                    {form.headteacherName ||
                      "Headteacher"}
                  </p>

                  {form.headteacherSignature && (
                    <img
                      src={
                        form.headteacherSignature
                      }
                      alt="Headteacher signature"
                      className="mt-2 h-12 max-w-40 object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* DATES */}
            <div className="mt-8 grid gap-4 border-t border-gray-300 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">
                  Vacation Date
                </p>

                <p className="font-bold">
                  {formatDate(
                    form.vacationDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-500">
                  Reopening Date
                </p>

                <p className="font-bold">
                  {formatDate(
                    form.reopeningDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-500">
                  Final Status
                </p>

                <p className="font-bold uppercase">
                  {form.promotionStatus.replaceAll(
                    "_",
                    " "
                  )}
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-8 border-t-2 border-gray-900 pt-4 text-center text-xs text-gray-500">
              <p>
                This report is an official
                academic record of the student.
              </p>

              <p className="mt-1">
                Generated through EduNova Suite.
              </p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!report &&
          !loadingReport &&
          !selectedStudentId && (
            <div className="no-print rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <div className="text-4xl">
                📊
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Select a student
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Choose a class and student
                above to generate their
                terminal report card.
              </p>
            </div>
          )}
      </div>
    </>
  );
}