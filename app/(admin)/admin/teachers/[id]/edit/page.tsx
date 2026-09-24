"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

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
};

type FormData = {
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

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [form, setForm] = useState<FormData>({
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadTeacher() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/teachers/${id}`, {
          cache: "no-store",
        });

        const text = await response.text();

        let data: Teacher | { error?: string } | null = null;

        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error(
              "The server returned an invalid response."
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            data && "error" in data && data.error
              ? data.error
              : "Failed to load teacher."
          );
        }

        if (!data || !("firstName" in data)) {
          throw new Error(
            "Teacher information was not returned."
          );
        }

        setForm({
          employeeNumber: data.employeeNumber || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          gender: data.gender || "",
          photoUrl: data.photoUrl || null,
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          qualification: data.qualification || "",
          specialization: data.specialization || "",
        });
      } catch (err) {
        console.error(
          "LOAD TEACHER ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
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

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeNumber:
            form.employeeNumber.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          gender: form.gender,
          photoUrl: form.photoUrl,
          phone: form.phone.trim(),
          email:
            form.email.trim() || null,
          address:
            form.address.trim() || null,
          qualification:
            form.qualification.trim() || null,
          specialization:
            form.specialization.trim() || null,
        }),
      });

      const text = await response.text();

      let data: {
        error?: string;
        message?: string;
      } = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "The server returned an invalid response while saving."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save teacher."
        );
      }

      setSuccess(
        data.message ||
          "Teacher information saved successfully."
      );

      setTimeout(() => {
        router.push(
          `/admin/teachers/${id}`
        );
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(
        "SAVE TEACHER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save teacher."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading teacher...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Teacher
          </h1>

          <p className="mt-1 text-gray-500">
            Update teacher information.
          </p>
        </div>

        <Link
          href={`/admin/teachers/${id}`}
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Teacher Photo
          </h2>

          <ImageUpload
            value={form.photoUrl}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                photoUrl: value,
              }))
            }
            uploadFolder="teachers"
            label="Teacher Photo"
          />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Teacher Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Employee Number *
              </label>

              <input
                name="employeeNumber"
                value={form.employeeNumber}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Gender *
              </label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select gender
                </option>
                <option value="MALE">
                  Male
                </option>
                <option value="FEMALE">
                  Female
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                First Name *
              </label>

              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Last Name *
              </label>

              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone *
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Professional Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Qualification
              </label>

              <input
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Specialization
              </label>

              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/teachers/${id}`}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}