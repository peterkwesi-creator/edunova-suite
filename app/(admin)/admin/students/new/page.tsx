"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

type SchoolClass = {
  id: string;
  name: string;
};

type PortalCredentials = {
  email: string;
  password: string | null;
  existing?: boolean;
};

type CreationResult = {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };

  portals: {
    student: PortalCredentials;

    parents: {
      first: PortalCredentials;
      second: PortalCredentials | null;
    };
  };
};

type ParentForm = {
  name: string;
  phone: string;
  email: string;
  relationship: string;
};

export default function NewStudentPage() {
  const router = useRouter();

  const [classes, setClasses] =
    useState<SchoolClass[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<CreationResult | null>(null);

  const [form, setForm] = useState({
    admissionNumber: "",
    firstName: "",
    lastName: "",
    gender: "",
    photoUrl: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    address: "",
    classId: "",
  });

  const [parent1, setParent1] =
    useState<ParentForm>({
      name: "",
      phone: "",
      email: "",
      relationship: "Parent",
    });

  const [parent2, setParent2] =
    useState<ParentForm>({
      name: "",
      phone: "",
      email: "",
      relationship: "Parent",
    });

  const [showParent2, setShowParent2] =
    useState(false);

  useEffect(() => {
    async function loadClasses() {
      try {
        const response =
          await fetch("/api/classes");

        if (!response.ok) {
          throw new Error(
            "Failed to load classes."
          );
        }

        const data =
          await response.json();

        setClasses(data);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load classes."
        );
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  function updateField(
    name: string,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateParent1(
    name: keyof ParentForm,
    value: string
  ) {
    setParent1((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateParent2(
    name: keyof ParentForm,
    value: string
  ) {
    setParent2((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (
      !form.admissionNumber ||
      !form.firstName ||
      !form.lastName ||
      !form.gender ||
      !form.classId
    ) {
      setError(
        "Admission number, first name, last name, gender and class are required."
      );
      return;
    }

    if (!parent1.name.trim()) {
      setError(
        "Parent / Guardian 1 name is required."
      );
      return;
    }

    if (
      showParent2 &&
      !parent2.name.trim()
    ) {
      setError(
        "Enter Parent / Guardian 2 name or remove Parent 2."
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch("/api/students", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            admissionNumber:
              form.admissionNumber,
            firstName:
              form.firstName,
            lastName:
              form.lastName,
            gender:
              form.gender,
            photoUrl:
              form.photoUrl || null,
            dateOfBirth:
              form.dateOfBirth || null,
            phone:
              form.phone || null,
            email:
              form.email || null,
            address:
              form.address || null,
            classId:
              form.classId,

            parent1: {
              name:
                parent1.name,
              phone:
                parent1.phone,
              email:
                parent1.email,
              relationship:
                parent1.relationship,
            },

            parent2:
              showParent2
                ? {
                    name:
                      parent2.name,
                    phone:
                      parent2.phone,
                    email:
                      parent2.email,
                    relationship:
                      parent2.relationship,
                  }
                : null,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create student."
        );
      }

      setResult(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create student."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setResult(null);

    setForm({
      admissionNumber: "",
      firstName: "",
      lastName: "",
      gender: "",
      photoUrl: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      address: "",
      classId: "",
    });

    setParent1({
      name: "",
      phone: "",
      email: "",
      relationship: "Parent",
    });

    setParent2({
      name: "",
      phone: "",
      email: "",
      relationship: "Parent",
    });

    setShowParent2(false);
    setError("");
  }

  if (result) {
    return (
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Student Created Successfully
          </h1>

          <p className="mt-1 text-gray-500">
            The student and portal accounts
            have been created automatically.
          </p>
        </div>

        {/* STUDENT PORTAL */}
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">
            Student Portal
          </h2>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-green-700">
                Login email
              </p>

              <p className="font-mono font-semibold text-green-950">
                {
                  result.portals.student
                    .email
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-green-700">
                Temporary password
              </p>

              <p className="font-mono font-semibold text-green-950">
                {
                  result.portals.student
                    .password
                }
              </p>
            </div>
          </div>
        </div>

        {/* PARENT 1 */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-bold text-blue-900">
            Parent / Guardian 1 Portal
          </h2>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-blue-700">
                Login email
              </p>

              <p className="font-mono font-semibold text-blue-950">
                {
                  result.portals.parents
                    .first.email
                }
              </p>
            </div>

            {result.portals.parents.first
              .password ? (
              <div>
                <p className="text-sm text-blue-700">
                  Temporary password
                </p>

                <p className="font-mono font-semibold text-blue-950">
                  {
                    result.portals.parents
                      .first.password
                  }
                </p>
              </div>
            ) : (
              <p className="text-sm text-blue-800">
                This parent already had a
                portal account. Their
                existing password remains
                unchanged.
              </p>
            )}
          </div>
        </div>

        {/* PARENT 2 */}
        {result.portals.parents.second && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6">
            <h2 className="text-xl font-bold text-purple-900">
              Parent / Guardian 2 Portal
            </h2>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-purple-700">
                  Login email
                </p>

                <p className="font-mono font-semibold text-purple-950">
                  {
                    result.portals
                      .parents.second
                      .email
                  }
                </p>
              </div>

              {result.portals.parents
                .second.password ? (
                <div>
                  <p className="text-sm text-purple-700">
                    Temporary password
                  </p>

                  <p className="font-mono font-semibold text-purple-950">
                    {
                      result.portals
                        .parents.second
                        .password
                    }
                  </p>
                </div>
              ) : (
                <p className="text-sm text-purple-800">
                  This parent already had a
                  portal account. Their
                  existing password remains
                  unchanged.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Important:</strong>{" "}
          Save or provide these credentials
          to the appropriate users. Newly
          generated passwords are only
          displayed here after account
          creation.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/students"
              )
            }
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Go to Students
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Add Another Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Add Student
        </h1>

        <p className="mt-1 text-gray-500">
          Register a new student and
          automatically create their
          student and parent portals.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white p-6 shadow"
      >
        {/* STUDENT PHOTO */}
        <div className="mb-8">
          <ImageUpload
            value={
              form.photoUrl || null
            }
            onChange={(url) =>
              updateField(
                "photoUrl",
                url || ""
              )
            }
            uploadFolder="students"
            label="Student Photo"
            description="Drag & drop the student's photo here, click to browse, or paste an image with Ctrl +V"
            disabled={saving}
          />
        </div>

        {/* STUDENT INFORMATION */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Student Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Admission Number *
              </label>

              <input
                value={
                  form.admissionNumber
                }
                onChange={(e) =>
                  updateField(
                    "admissionNumber",
                    e.target.value
                  )
                }
                placeholder="e.g. ADM001"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Class *
              </label>

              <select
                value={form.classId}
                onChange={(e) =>
                  updateField(
                    "classId",
                    e.target.value
                  )
                }
                disabled={
                  loading || saving
                }
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">
                  {loading
                    ? "Loading classes..."
                    : "Select class"}
                </option>

                {classes.map(
                  (schoolClass) => (
                    <option
                      key={
                        schoolClass.id
                      }
                      value={
                        schoolClass.id
                      }
                    >
                      {
                        schoolClass.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                First Name *
              </label>

              <input
                value={form.firstName}
                onChange={(e) =>
                  updateField(
                    "firstName",
                    e.target.value
                  )
                }
                placeholder="First name"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Last Name *
              </label>

              <input
                value={form.lastName}
                onChange={(e) =>
                  updateField(
                    "lastName",
                    e.target.value
                  )
                }
                placeholder="Last name"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Gender *
              </label>

              <select
                value={form.gender}
                onChange={(e) =>
                  updateField(
                    "gender",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Date of Birth
              </label>

              <input
                type="date"
                value={
                  form.dateOfBirth
                }
                onChange={(e) =>
                  updateField(
                    "dateOfBirth",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Phone
              </label>

              <input
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
                placeholder="Student phone number"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
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
                placeholder="student@example.com"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Address
              </label>

              <textarea
                value={form.address}
                onChange={(e) =>
                  updateField(
                    "address",
                    e.target.value
                  )
                }
                placeholder="Student address"
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        {/* PARENT 1 */}
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/40 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Parent / Guardian 1
              <span className="ml-2 text-sm font-normal text-red-600">
                Required
              </span>
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              This parent will automatically
              receive a parent portal account.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Full Name *
              </label>

              <input
                value={parent1.name}
                onChange={(e) =>
                  updateParent1(
                    "name",
                    e.target.value
                  )
                }
                placeholder="e.g. Kwame Mensah"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Relationship
              </label>

              <select
                value={
                  parent1.relationship
                }
                onChange={(e) =>
                  updateParent1(
                    "relationship",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="Parent">
                  Parent
                </option>

                <option value="Father">
                  Father
                </option>

                <option value="Mother">
                  Mother
                </option>

                <option value="Guardian">
                  Guardian
                </option>

                <option value="Grandparent">
                  Grandparent
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Phone
              </label>

              <input
                value={parent1.phone}
                onChange={(e) =>
                  updateParent1(
                    "phone",
                    e.target.value
                  )
                }
                placeholder="024 XXX XXXX"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={parent1.email}
                onChange={(e) =>
                  updateParent1(
                    "email",
                    e.target.value
                  )
                }
                placeholder="parent@example.com"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        {/* PARENT 2 */}
        {!showParent2 ? (
          <div className="mb-8">
            <button
              type="button"
              onClick={() =>
                setShowParent2(true)
              }
              className="rounded-lg border border-purple-300 bg-purple-50 px-5 py-3 font-medium text-purple-800 hover:bg-purple-100"
            >
              + Add Parent / Guardian 2
              <span className="ml-2 text-sm font-normal">
                (Optional)
              </span>
            </button>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-purple-200 bg-purple-50/40 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Parent / Guardian 2
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    Optional
                  </span>
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  This parent will also receive
                  their own parent portal account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowParent2(false);

                  setParent2({
                    name: "",
                    phone: "",
                    email: "",
                    relationship:
                      "Parent",
                  });
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Name *
                </label>

                <input
                  value={
                    parent2.name
                  }
                  onChange={(e) =>
                    updateParent2(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Ama Mensah"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Relationship
                </label>

                <select
                  value={
                    parent2.relationship
                  }
                  onChange={(e) =>
                    updateParent2(
                      "relationship",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="Parent">
                    Parent
                  </option>

                  <option value="Father">
                    Father
                  </option>

                  <option value="Mother">
                    Mother
                  </option>

                  <option value="Guardian">
                    Guardian
                  </option>

                  <option value="Grandparent">
                    Grandparent
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone
                </label>

                <input
                  value={
                    parent2.phone
                  }
                  onChange={(e) =>
                    updateParent2(
                      "phone",
                      e.target.value
                    )
                  }
                  placeholder="024 XXX XXXX"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={
                    parent2.email
                  }
                  onChange={(e) =>
                    updateParent2(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="parent2@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT */}
        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={
              saving || loading
            }
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving
              ? "Creating Student & Portals..."
              : "Save Student"}
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
      </form>
    </div>
  );
}