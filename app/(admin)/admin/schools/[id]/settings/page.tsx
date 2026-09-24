"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

type School = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  description: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  websiteEnabled: boolean;
  admissionsEnabled: boolean;
};

export default function SchoolSettingsPage() {
  const params = useParams();
  const id = params.id as string;

  const [school, setSchool] =
    useState<School | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadSchool() {
      try {
        const response = await fetch(
          `/api/schools/${id}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load school"
          );
        }

        const data = await response.json();

        setSchool(data);
      } catch (error) {
        console.error(error);

        setMessage(
          "Failed to load school."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadSchool();
    }
  }, [id]);

  function updateField(
    field: keyof School,
    value: string | boolean
  ) {
    if (!school) {
      return;
    }

    setSchool({
      ...school,
      [field]: value,
    });
  }

  async function saveChanges() {
    if (!school) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/schools/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(school),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save changes"
        );
      }

      setSchool(data);

      setMessage(
        "School settings saved successfully."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save school settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading school settings...
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          School could not be found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          School Settings
        </h1>

        <p className="mt-1 text-gray-500">
          Customize how {school.name} appears
          across EduNova.
        </p>
      </div>

      <div className="space-y-6">
        {/* BASIC INFORMATION */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Basic Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                School Name
              </label>

              <input
                value={school.name}
                onChange={(e) =>
                  updateField(
                    "name",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-2.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Slug
              </label>

              <input
                value={school.slug}
                onChange={(e) =>
                  updateField(
                    "slug",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-2.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={school.email || ""}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-2.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Phone
              </label>

              <input
                value={school.phone || ""}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-2.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Address
              </label>

              <input
                value={school.address || ""}
                onChange={(e) =>
                  updateField(
                    "address",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-2.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                value={
                  school.description || ""
                }
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-lg border px-4 py-2.5"
              />
            </div>
          </div>
        </section>

        {/* BRANDING */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Branding
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload the school's logo and choose
            the colours used throughout the
            school website.
          </p>

          <div className="mt-6 space-y-6">
            <ImageUpload
              value={school.logo}
              onChange={(url) =>
                updateField(
                  "logo",
                  url || ""
                )
              }
              uploadFolder="schools"
              label="School Logo"
              description="Drag & drop the school logo here, click to browse, or paste an image with Ctrl + V"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Primary Colour
                </label>

                <div className="flex gap-3">
                  <input
                    type="color"
                    value={
                      school.primaryColor ||
                      "#2563eb"
                    }
                    onChange={(e) =>
                      updateField(
                        "primaryColor",
                        e.target.value
                      )
                    }
                    className="h-11 w-16 cursor-pointer"
                  />

                  <input
                    value={
                      school.primaryColor ||
                      "#2563eb"
                    }
                    onChange={(e) =>
                      updateField(
                        "primaryColor",
                        e.target.value
                      )
                    }
                    className="flex-1 rounded-lg border px-4"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Secondary Colour
                </label>

                <div className="flex gap-3">
                  <input
                    type="color"
                    value={
                      school.secondaryColor ||
                      "#0f172a"
                    }
                    onChange={(e) =>
                      updateField(
                        "secondaryColor",
                        e.target.value
                      )
                    }
                    className="h-11 w-16 cursor-pointer"
                  />

                  <input
                    value={
                      school.secondaryColor ||
                      "#0f172a"
                    }
                    onChange={(e) =>
                      updateField(
                        "secondaryColor",
                        e.target.value
                      )
                    }
                    className="flex-1 rounded-lg border px-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WEBSITE */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Website & Admissions
          </h2>

          <div className="mt-5 space-y-4">
            <label className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">
                  School Website
                </p>

                <p className="text-sm text-gray-500">
                  Allow the public school website
                  to be visible.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  school.websiteEnabled
                }
                onChange={(e) =>
                  updateField(
                    "websiteEnabled",
                    e.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">
                  Online Admissions
                </p>

                <p className="text-sm text-gray-500">
                  Allow prospective students to
                  apply online.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  school.admissionsEnabled
                }
                onChange={(e) =>
                  updateField(
                    "admissionsEnabled",
                    e.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>
          </div>
        </section>

        {/* SAVE */}

        <div className="flex items-center justify-between">
          {message && (
            <p className="text-sm text-gray-600">
              {message}
            </p>
          )}

          <button
            onClick={saveChanges}
            disabled={saving}
            className="ml-auto rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}