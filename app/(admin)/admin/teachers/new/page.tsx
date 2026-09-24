"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

type TeacherForm = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl: string | null;
  phone: string;
  email: string;
  address: string;
  qualification: string;
  specialization: string;
};

type CreationResult = {
  teacher: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
  };
  portal: {
    email: string;
    password: string;
  };
};

export default function NewTeacherPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<TeacherForm>({
      employeeNumber: "",
      firstName: "",
      lastName: "",
      gender: "",
      photoUrl: null,
      phone: "",
      email: "",
      address: "",
      qualification: "",
      specialization: "",
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<CreationResult | null>(
      null
    );

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setResult(null);

    try {
      const response =
        await fetch("/api/teachers", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create teacher."
        );
      }

      setResult(data);
    } catch (error) {
      console.error(
        "CREATE TEACHER ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create teacher."
      );
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Teacher Created Successfully
          </h1>

          <p className="mt-1 text-gray-500">
            The teacher portal has been created automatically.
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">
            Teacher Portal Credentials
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-green-700">
                Login email
              </p>

              <p className="font-mono font-semibold text-green-950">
                {result.portal.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-green-700">
                Temporary password
              </p>

              <p className="font-mono font-semibold text-green-950">
                {result.portal.password}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Important:</strong>{" "}
          Save or provide these credentials to the teacher. The temporary password is only displayed here after account creation.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/teachers"
              )
            }
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Go to Teachers
          </button>

          <button
            type="button"
            onClick={() => {
              setResult(null);

              setForm({
                employeeNumber: "",
                firstName: "",
                lastName: "",
                gender: "",
                photoUrl: null,
                phone: "",
                email: "",
                address: "",
                qualification: "",
                specialization: "",
              });
            }}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Add Another Teacher
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Add Teacher
          </h1>

          <p className="mt-1 text-gray-500">
            Register a new teacher and automatically create their portal.
          </p>
        </div>

        <Link
          href="/admin/teachers"
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white p-6 shadow"
      >
        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            Personal Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                First Name *
              </label>

              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="Enter first name"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Last Name *
              </label>

              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                placeholder="Enter last name"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Gender *
              </label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  Select gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Phone *
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="e.g. 0241234567"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="teacher@example.com"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Employee Number *
              </label>

              <input
                name="employeeNumber"
                value={
                  form.employeeNumber
                }
                onChange={handleChange}
                required
                placeholder="e.g. TCH001"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Teacher Photo
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload a clear profile photo for the teacher.
          </p>

          <div className="mt-5">
            <ImageUpload
              value={form.photoUrl}
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    photoUrl:
                      value,
                  })
                )
              }
              uploadFolder="teachers"
              label="Teacher Photo"
              disabled={saving}
            />
          </div>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Professional Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Qualification
              </label>

              <input
                name="qualification"
                value={
                  form.qualification
                }
                onChange={handleChange}
                placeholder="e.g. B.Ed, M.Ed"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Specialization
              </label>

              <input
                name="specialization"
                value={
                  form.specialization
                }
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Address
              </label>

              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Teacher's address"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/admin/teachers"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving
              ? "Creating Teacher & Portal..."
              : "Save Teacher"}
          </button>
        </div>
      </form>
    </div>
  );
}