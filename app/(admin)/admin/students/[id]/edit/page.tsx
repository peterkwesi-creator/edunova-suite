"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

type SchoolClass = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  classId: string | null;
};

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    guardianName: "",
    guardianPhone: "",
    classId: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [studentResponse, classesResponse] =
          await Promise.all([
            fetch(`/api/students/${id}`, {
              cache: "no-store",
            }),
            fetch("/api/classes", {
              cache: "no-store",
            }),
          ]);

        if (!studentResponse.ok) {
          const data =
            await studentResponse
              .json()
              .catch(() => null);

          throw new Error(
            data?.error ||
              "Failed to load student."
          );
        }

        if (!classesResponse.ok) {
          throw new Error(
            "Failed to load classes."
          );
        }

        const student: Student =
          await studentResponse.json();

        const classesData: SchoolClass[] =
          await classesResponse.json();

        setClasses(classesData);

        setForm({
          admissionNumber:
            student.admissionNumber || "",
          firstName:
            student.firstName || "",
          lastName:
            student.lastName || "",
          gender:
            student.gender || "",
          photoUrl:
            student.photoUrl || "",
          dateOfBirth: student.dateOfBirth
            ? new Date(
                student.dateOfBirth
              )
                .toISOString()
                .split("T")[0]
            : "",
          phone:
            student.phone || "",
          email:
            student.email || "",
          address:
            student.address || "",
          guardianName:
            student.guardianName || "",
          guardianPhone:
            student.guardianPhone || "",
          classId:
            student.classId || "",
        });
      } catch (error) {
        console.error(
          "Load student error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load student."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  function updateField(
    name: string,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

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

    setSaving(true);

    try {
      const response = await fetch(
        `/api/students/${id}`,
        {
          method: "PUT",
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
            guardianName:
              form.guardianName || null,
            guardianPhone:
              form.guardianPhone || null,
            classId:
              form.classId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update student."
        );
      }

      router.push(
        `/admin/students/${id}`
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Update student error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update student."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">
          Loading student...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/students/${id}`
            )
          }
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Student
        </button>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Edit Student
        </h1>

        <p className="mt-1 text-gray-500">
          Update the student's information.
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
            description="Drag & drop a new student photo here, click to browse, or paste an image with Ctrl + V"
            disabled={saving}
          />
        </div>

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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            >
              <option value="">
                Select class
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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              disabled={saving}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Guardian Name
            </label>

            <input
              value={
                form.guardianName
              }
              onChange={(e) =>
                updateField(
                  "guardianName",
                  e.target.value
                )
              }
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Guardian Phone
            </label>

            <input
              value={
                form.guardianPhone
              }
              onChange={(e) =>
                updateField(
                  "guardianPhone",
                  e.target.value
                )
              }
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/students/${id}`
              )
            }
            disabled={saving}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}