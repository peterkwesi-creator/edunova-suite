"use client";

import { FormEvent, useEffect, useState } from "react";

type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  user: {
    id: string;
    email: string;
    active: boolean;
  } | null;
  children: {
    id: string;
    relationship: string | null;
    isPrimary: boolean;
    student: {
      id: string;
      studentNumber: string;
      firstName: string;
      lastName: string;
      class: {
        name: string;
      } | null;
    };
  }[];
};

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
};

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] =
    useState<Parent | null>(null);

  const [form, setForm] = useState(emptyForm);

  async function loadParents() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/parents",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load parents."
        );
      }

      setParents(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load parents."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParents();
  }, []);

  function openCreate() {
    setEditingParent(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(parent: Parent) {
    setEditingParent(parent);

    setForm({
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone ?? "",
      email: parent.email ?? "",
      address: parent.address ?? "",
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingParent(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveParent(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      alert(
        "First name and last name are required."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingParent
          ? `/api/admin/parents/${editingParent.id}`
          : "/api/admin/parents",
        {
          method: editingParent ? "PUT" : "POST",
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
            "Failed to save parent."
        );
      }

      alert(
        editingParent
          ? "Parent updated successfully."
          : "Parent created successfully."
      );

      closeModal();
      await loadParents();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save parent."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteParent(parent: Parent) {
    if (parent.children.length > 0) {
      alert(
        "This parent is linked to students. Remove those child links before deleting the parent profile."
      );
      return;
    }

    const confirmed = confirm(
      `Delete the parent profile for ${parent.firstName} ${parent.lastName}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/parents/${parent.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete parent."
        );
      }

      await loadParents();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete parent."
      );
    }
  }

  const filteredParents = parents.filter(
    (parent) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) return true;

      return (
        `${parent.firstName} ${parent.lastName}`
          .toLowerCase()
          .includes(query) ||
        (parent.email ?? "")
          .toLowerCase()
          .includes(query) ||
        (parent.phone ?? "")
          .toLowerCase()
          .includes(query)
      );
    }
  );

  const parentsWithAccounts =
    parents.filter(
      (parent) => parent.user !== null
    ).length;

  const parentsWithoutAccounts =
    parents.filter(
      (parent) => parent.user === null
    ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Parents
          </h1>

          <p className="mt-1 text-gray-600">
            Manage parent profiles and portal
            access.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + Add Parent
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Parents
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {parents.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            With Accounts
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {parentsWithAccounts}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Without Accounts
          </p>

          <p className="mt-2 text-3xl font-bold text-orange-600">
            {parentsWithoutAccounts}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search parent name, email or phone..."
          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading parents...
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="font-semibold">
              No parents found.
            </p>

            <p className="mt-2 text-sm">
              Create a parent profile first,
              then create their login account
              from User Management.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="px-5 py-4 font-semibold">
                    Parent
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Contact
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Children
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Account
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredParents.map(
                  (parent) => (
                    <tr
                      key={parent.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {parent.firstName}{" "}
                          {parent.lastName}
                        </p>

                        {parent.address && (
                          <p className="mt-1 text-sm text-gray-500">
                            {parent.address}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        <p>
                          {parent.phone ||
                            "No phone"}
                        </p>

                        <p className="text-gray-500">
                          {parent.email ||
                            "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {parent.children.length ===
                        0 ? (
                          <span className="text-sm text-gray-400">
                            No children linked
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {parent.children.map(
                              (child) => (
                                <div
                                  key={child.id}
                                  className="text-sm"
                                >
                                  <p className="font-medium text-gray-800">
                                    {
                                      child
                                        .student
                                        .firstName
                                    }{" "}
                                    {
                                      child
                                        .student
                                        .lastName
                                    }
                                  </p>

                                  <p className="text-gray-500">
                                    {
                                      child
                                        .student
                                        .studentNumber
                                    }
                                    {child.student
                                      .class
                                      ? ` • ${child.student.class.name}`
                                      : ""}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {parent.user ? (
                          <div>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              ACCOUNT LINKED
                            </span>

                            <p className="mt-2 text-xs text-gray-500">
                              {parent.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            NO ACCOUNT
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              openEdit(parent)
                            }
                            className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          {!parent.user && (
                            <a
                              href="/admin/users"
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Create Account
                            </a>
                          )}

                          <button
                            onClick={() =>
                              deleteParent(parent)
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={
                              parent.children.length >
                              0
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingParent
                    ? "Edit Parent"
                    : "Add Parent"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingParent
                    ? "Update the parent profile."
                    : "Create a parent profile before creating their portal account."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveParent}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    First Name
                  </label>

                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      updateField(
                        "firstName",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Last Name
                  </label>

                  <input
                    value={form.lastName}
                    onChange={(event) =>
                      updateField(
                        "lastName",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border px-4 py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Phone
                </label>

                <input
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value
                    )
                  }
                  rows={3}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border px-5 py-3 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingParent
                    ? "Save Changes"
                    : "Create Parent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}