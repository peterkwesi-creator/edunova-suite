"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Teacher = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  qualification: string | null;
  specialization: string | null;
  position: string | null;
  createdAt: string;
};

export default function TeacherProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [teacher, setTeacher] =
    useState<Teacher | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadTeacher() {
      try {
        const response = await fetch(
          `/api/teachers/${id}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load teacher."
          );
        }

        setTeacher(data);
      } catch (error) {
        console.error(
          "LOAD TEACHER ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load teacher."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTeacher();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading teacher...
        </p>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-5 text-red-700">
          {error || "Teacher not found."}
        </div>

        <Link
          href="/admin/teachers"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          ← Back to Teachers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Teacher Profile
          </h1>

          <p className="mt-1 text-gray-500">
            View teacher information and
            professional details.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/admin/teachers/${id}/edit`}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Edit Teacher
          </Link>

          <Link
            href="/admin/teachers"
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg">
              {teacher.photoUrl ? (
                <img
                  src={teacher.photoUrl}
                  alt={`${teacher.firstName} ${teacher.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-4xl font-bold text-gray-400">
                  {teacher.firstName
                    .charAt(0)
                    .toUpperCase()}
                  {teacher.lastName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="text-center text-white sm:text-left">
              <h2 className="text-3xl font-bold">
                {teacher.firstName}{" "}
                {teacher.lastName}
              </h2>

              <p className="mt-1 text-blue-100">
                {teacher.position ||
                  "Teacher"}
              </p>

              <p className="mt-2 text-sm text-blue-100">
                Employee Number:{" "}
                {teacher.employeeNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gray-900">
          Teacher Information
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Employee Number
            </p>

            <p className="mt-1 font-medium">
              {teacher.employeeNumber}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Gender
            </p>

            <p className="mt-1 font-medium">
              {teacher.gender}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Phone
            </p>

            <p className="mt-1 font-medium">
              {teacher.phone}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email
            </p>

            <p className="mt-1 font-medium">
              {teacher.email ||
                "Not provided"}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm text-gray-500">
              Address
            </p>

            <p className="mt-1 font-medium">
              {teacher.address ||
                "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gray-900">
          Professional Information
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Qualification
            </p>

            <p className="mt-1 font-medium">
              {teacher.qualification ||
                "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Specialization
            </p>

            <p className="mt-1 font-medium">
              {teacher.specialization ||
                "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Position
            </p>

            <p className="mt-1 font-medium">
              {teacher.position ||
                "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-blue-900">
          Academic Assignments
        </h2>

        <p className="mt-2 text-blue-800">
          Class and subject assignments will
          appear here.
        </p>
      </div>
    </div>
  );
}