"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  active: boolean;
  teacher?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    position: string | null;
  } | null;
  student?: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    class?: {
      name: string;
    } | null;
  } | null;
  parent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
};

type TeacherProfile = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  user: {
    id: string;
  } | null;
};

type StudentProfile = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  class: {
    name: string;
  } | null;
  user: {
    id: string;
  } | null;
};

type ParentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  user: {
    id: string;
  } | null;
};

type ProfilesResponse = {
  teachers: TeacherProfile[];
  students: StudentProfile[];
  parents: ParentProfile[];
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<ProfilesResponse>({
    teachers: [],
    students: [],
    parents: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [linkedProfileId, setLinkedProfileId] = useState("");

  const [newPassword, setNewPassword] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles() {
    try {
      const response = await fetch("/api/admin/users/profiles", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load profiles");
      }

      const data = await response.json();

      setProfiles({
        teachers: data.teachers || [],
        students: data.students || [],
        parents: data.parents || [],
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load teacher, student and parent profiles.");
    }
  }

  useEffect(() => {
    Promise.all([loadUsers(), loadProfiles()]);
  }, []);

  function resetCreateForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setRole("STUDENT");
    setLinkedProfileId("");
  }

  function openCreateModal() {
    resetCreateForm();
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (saving) return;

    setShowCreateModal(false);
    resetCreateForm();
  }

  function getLinkedId() {
    if (role === "TEACHER") {
      return linkedProfileId || null;
    }

    if (role === "STUDENT") {
      return linkedProfileId || null;
    }

    if (role === "PARENT") {
      return linkedProfileId || null;
    }

    return null;
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and last name are required.");
      return;
    }

    if (!email.trim()) {
      alert("Email is required.");
      return;
    }

    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);

    try {
      const linkedId = getLinkedId();

      const body: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role: Role;
        teacherId?: string;
        studentId?: string;
        parentId?: string;
      } = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      };

      if (role === "TEACHER" && linkedId) {
        body.teacherId = linkedId;
      }

      if (role === "STUDENT" && linkedId) {
        body.studentId = linkedId;
      }

      if (role === "PARENT" && linkedId) {
        body.parentId = linkedId;
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      alert("User account created successfully.");

      closeCreateModal();

      await Promise.all([loadUsers(), loadProfiles()]);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create user."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user: User) {
    const action = user.active ? "deactivate" : "activate";

    if (
      !confirm(
        `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !user.active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} user`);
      }

      await loadUsers();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${action} user.`
      );
    }
  }

  async function changeRole(user: User, newRole: Role) {
    if (user.role === newRole) return;

    if (
      !confirm(
        `Change ${user.firstName} ${user.lastName}'s role to ${roleLabels[newRole]}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change role");
      }

      await loadUsers();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to change role."
      );
    }
  }

  function openPasswordModal(user: User) {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordModal(true);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser) return;

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      alert("Password changed successfully.");

      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.active) ||
        (statusFilter === "INACTIVE" && !user.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const inactiveUsers = users.filter((user) => !user.active).length;

  const teachersWithAccounts = profiles.teachers.filter(
    (teacher) => teacher.user === null
  );

  const studentsWithAccounts = profiles.students.filter(
    (student) => student.user === null
  );

  const parentsWithAccounts = profiles.parents.filter(
    (parent) => parent.user === null
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="mt-1 text-gray-600">
            Manage accounts, roles and portal access.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Create User
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalUsers}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Accounts
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {activeUsers}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Inactive Accounts
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {inactiveUsers}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-700">
            Teachers without accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {teachersWithAccounts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
          <p className="text-sm font-semibold text-purple-700">
            Students without accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-900">
            {studentsWithAccounts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-orange-700">
            Parents without accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-orange-900">
            {parentsWithAccounts.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email..."
            className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrators</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
            <option value="PARENT">Parents</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Linked Profile</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.email}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          changeRole(
                            user,
                            event.target.value as Role
                          )
                        }
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="ADMIN">Administrator</option>
                        <option value="TEACHER">Teacher</option>
                        <option value="STUDENT">Student</option>
                        <option value="PARENT">Parent</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {user.teacher ? (
                        <div>
                          <p className="font-semibold text-gray-800">
                            Teacher
                          </p>
                          <p className="text-gray-500">
                            {user.teacher.employeeNumber}
                          </p>
                          {user.teacher.position && (
                            <p className="text-gray-500">
                              {user.teacher.position}
                            </p>
                          )}
                        </div>
                      ) : user.student ? (
                        <div>
                          <p className="font-semibold text-gray-800">
                            Student
                          </p>
                          <p className="text-gray-500">
                            {user.student.studentNumber}
                          </p>
                          {user.student.class && (
                            <p className="text-gray-500">
                              {user.student.class.name}
                            </p>
                          )}
                        </div>
                      ) : user.parent ? (
                        <div>
                          <p className="font-semibold text-gray-800">
                            Parent
                          </p>
                          <p className="text-gray-500">
                            {user.parent.phone || "No phone"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          No linked profile
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                        >
                          Password
                        </button>

                        <button
                          onClick={() => toggleUser(user)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                            user.active
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create User Account
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Give a school member access to their portal.
                </p>
              </div>

              <button
                onClick={closeCreateModal}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={createUser} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    First Name
                  </label>
                  <input
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
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
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    className="w-full rounded-xl border px-4 py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="w-full rounded-xl border px-4 py-3"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Role
                </label>

                <select
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value as Role);
                    setLinkedProfileId("");
                  }}
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="PARENT">Parent</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {role === "TEACHER" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Link Teacher Profile
                  </label>

                  <select
                    value={linkedProfileId}
                    onChange={(event) =>
                      setLinkedProfileId(event.target.value)
                    }
                    className="w-full rounded-xl border px-4 py-3"
                  >
                    <option value="">
                      Create without linking
                    </option>

                    {teachersWithAccounts.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} —{" "}
                        {teacher.employeeNumber}
                        {teacher.position
                          ? ` — ${teacher.position}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === "STUDENT" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Link Student Profile
                  </label>

                  <select
                    value={linkedProfileId}
                    onChange={(event) =>
                      setLinkedProfileId(event.target.value)
                    }
                    className="w-full rounded-xl border px-4 py-3"
                  >
                    <option value="">
                      Create without linking
                    </option>

                    {studentsWithAccounts.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} —{" "}
                        {student.studentNumber}
                        {student.class
                          ? ` — ${student.class.name}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === "PARENT" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Link Parent Profile
                  </label>

                  <select
                    value={linkedProfileId}
                    onChange={(event) =>
                      setLinkedProfileId(event.target.value)
                    }
                    className="w-full rounded-xl border px-4 py-3"
                  >
                    <option value="">
                      Create without linking
                    </option>

                    {parentsWithAccounts.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.firstName} {parent.lastName}
                        {parent.phone
                          ? ` — ${parent.phone}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl border px-5 py-3 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">
              Change Password
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Change the password for{" "}
              <strong>
                {selectedUser.firstName} {selectedUser.lastName}
              </strong>
              .
            </p>

            <form
              onSubmit={changePassword}
              className="mt-5 space-y-5"
            >
              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="New password"
                minLength={6}
                className="w-full rounded-xl border px-4 py-3"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}