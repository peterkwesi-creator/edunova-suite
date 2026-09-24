"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl: string | null;
  dateOfBirth: string | null;
  className: string;
  guardianName: string | null;
  guardianPhone: string | null;
  address: string | null;
};

export default function StudentProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [student, setStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadStudent() {
      try {
        const { id } = await params;

        const response = await fetch(
          `/api/students/${id}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load student"
          );
        }

        const data =
          await response.json();

        setStudent(data);
      } catch (error) {
        console.error(
          "Load student error:",
          error
        );

        setError(
          "Unable to load student information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">
          Loading student...
        </p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-xl font-bold text-red-600">
          Student Not Found
        </h1>

        <p className="mt-2 text-gray-500">
          {error ||
            "The requested student could not be found."}
        </p>

        <Link
          href="/admin/students"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          Back to Students
        </Link>
      </div>
    );
  }

  const formattedDate =
    student.dateOfBirth
      ? new Date(
          student.dateOfBirth
        ).toLocaleDateString()
      : "Not provided";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/students"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Students
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Student Profile
          </h1>

          <p className="mt-1 text-gray-500">
            View student information and academic details
          </p>
        </div>

        <Link
          href={`/admin/students/${student.id}/edit`}
          className="rounded-lg bg-blue-600 px-5 py-3 text-center font-medium text-white hover:bg-blue-700"
        >
          Edit Student
        </Link>
      </div>

      {/* Student Summary */}
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={`${student.firstName} ${student.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                {student.firstName.charAt(0)}
                {student.lastName.charAt(0)}
              </>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {student.firstName}{" "}
              {student.lastName}
            </h2>

            <p className="mt-1 text-gray-500">
              Admission Number:{" "}
              {student.admissionNumber}
            </p>

            <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {student.className}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-bold text-gray-900">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InfoItem
            label="First Name"
            value={student.firstName}
          />

          <InfoItem
            label="Last Name"
            value={student.lastName}
          />

          <InfoItem
            label="Admission Number"
            value={student.admissionNumber}
          />

          <InfoItem
            label="Gender"
            value={student.gender}
          />

          <InfoItem
            label="Date of Birth"
            value={formattedDate}
          />

          <InfoItem
            label="Class"
            value={student.className}
          />
        </div>
      </div>

      {/* Guardian Information */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-bold text-gray-900">
          Guardian Information
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InfoItem
            label="Guardian Name"
            value={
              student.guardianName ||
              "Not provided"
            }
          />

          <InfoItem
            label="Guardian Phone"
            value={
              student.guardianPhone ||
              "Not provided"
            }
          />

          <InfoItem
            label="Address"
            value={
              student.address ||
              "Not provided"
            }
          />
        </div>
      </div>

      {/* Academic Sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FutureCard
          title="Results"
          description="View academic results"
        />

        <FutureCard
          title="Projections"
          description="Track projected performance"
        />

        <FutureCard
          title="Assignments"
          description="View student assignments"
        />

        <FutureCard
          title="Attendance"
          description="View attendance records"
        />
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function FutureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow transition hover:shadow-md">
      <h3 className="font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

      <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        Coming soon
      </span>
    </div>
  );
}