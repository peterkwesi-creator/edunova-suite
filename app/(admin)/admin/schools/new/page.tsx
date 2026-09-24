"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSchoolPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    primaryColor: "#2563eb",
    secondaryColor: "#0f172a",
    websiteEnabled: true,
    admissionsEnabled: true,

    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",

    academicYearName: "",
    academicYearStartDate: "",
    academicYearEndDate: "",

    termName: "Term 1",
    termStartDate: "",
    termEndDate: "",
  });

  function updateField(
    field: string,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function createSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: createSlug(value),
    }));
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/schools",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create school"
        );
      }

      router.push("/admin/schools");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Add School
        </h1>

        <p className="mt-1 text-gray-500">
          Create a complete school foundation
          on EduNova Suite.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl space-y-8 rounded-2xl border bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            School Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                School Name *
              </label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  handleNameChange(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Central Lyceum School"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Website Slug *
              </label>

              <input
                required
                value={form.slug}
                onChange={(e) =>
                  updateField(
                    "slug",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="central-lyceum-school"
              />

              <p className="mt-1 text-xs text-gray-500">
                Lowercase letters, numbers and
                hyphens only.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                School Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="info@school.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                School Phone
              </label>

              <input
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="+233..."
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              Address
            </label>

            <input
              value={form.address}
              onChange={(e) =>
                updateField(
                  "address",
                  e.target.value
                )
              }
              className="w-full rounded-lg border px-3 py-2"
              placeholder="School address"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              School Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value
                )
              }
              rows={4}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Short description of the school..."
            />
          </div>
        </section>

        <section className="border-t pt-8">
          <h2 className="mb-2 text-xl font-semibold">
            Initial Administrator
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            This administrator will manage the
            new school's EduNova portal.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                First Name *
              </label>

              <input
                required
                value={form.adminFirstName}
                onChange={(e) =>
                  updateField(
                    "adminFirstName",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="John"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Last Name *
              </label>

              <input
                required
                value={form.adminLastName}
                onChange={(e) =>
                  updateField(
                    "adminLastName",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Mensah"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Administrator Email *
              </label>

              <input
                required
                type="email"
                value={form.adminEmail}
                onChange={(e) =>
                  updateField(
                    "adminEmail",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="admin@school.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Administrator Password *
              </label>

              <input
                required
                type="password"
                minLength={6}
                value={form.adminPassword}
                onChange={(e) =>
                  updateField(
                    "adminPassword",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>
        </section>

        <section className="border-t pt-8">
          <h2 className="mb-2 text-xl font-semibold">
            Academic Setup
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            EduNova will automatically create this
            academic year and its first term when
            the school is created.
          </p>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Academic Year *
              </label>

              <input
                required
                value={form.academicYearName}
                onChange={(e) =>
                  updateField(
                    "academicYearName",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="2026/2027"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Academic Year Start *
                </label>

                <input
                  required
                  type="date"
                  value={
                    form.academicYearStartDate
                  }
                  onChange={(e) =>
                    updateField(
                      "academicYearStartDate",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Academic Year End *
                </label>

                <input
                  required
                  type="date"
                  value={
                    form.academicYearEndDate
                  }
                  onChange={(e) =>
                    updateField(
                      "academicYearEndDate",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="font-semibold text-blue-900">
                First Term
              </h3>

              <p className="mt-1 text-sm text-blue-700">
                Term 1 will automatically become
                the current term.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Term Name *
                </label>

                <input
                  required
                  value={form.termName}
                  onChange={(e) =>
                    updateField(
                      "termName",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Term 1"
                />
              </div>

              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Term Start *
                  </label>

                  <input
                    required
                    type="date"
                    value={form.termStartDate}
                    onChange={(e) =>
                      updateField(
                        "termStartDate",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Term End *
                  </label>

                  <input
                    required
                    type="date"
                    value={form.termEndDate}
                    onChange={(e) =>
                      updateField(
                        "termEndDate",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t pt-8">
          <h2 className="mb-3 text-lg font-semibold">
            Website Branding
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Primary Color
              </label>

              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) =>
                  updateField(
                    "primaryColor",
                    e.target.value
                  )
                }
                className="h-11 w-full cursor-pointer rounded-lg border"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Secondary Color
              </label>

              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) =>
                  updateField(
                    "secondaryColor",
                    e.target.value
                  )
                }
                className="h-11 w-full cursor-pointer rounded-lg border"
              />
            </div>
          </div>
        </section>

        <section className="border-t pt-8">
          <h2 className="mb-3 text-lg font-semibold">
            School Website
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.websiteEnabled}
                onChange={(e) =>
                  updateField(
                    "websiteEnabled",
                    e.target.checked
                  )
                }
              />

              <span>
                Enable school website
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.admissionsEnabled
                }
                onChange={(e) =>
                  updateField(
                    "admissionsEnabled",
                    e.target.checked
                  )
                }
              />

              <span>
                Enable online admissions
              </span>
            </label>
          </div>
        </section>

        <div className="flex gap-3 border-t pt-6">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/schools"
              )
            }
            className="rounded-lg border px-5 py-2.5 font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {loading
              ? "Creating School..."
              : "Create School"}
          </button>
        </div>
      </form>
    </div>
  );
}