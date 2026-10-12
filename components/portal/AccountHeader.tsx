
"use client";

import { useEffect, useRef, useState } from "react";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
};

type AccountHeaderProps = {
  title: string;
};

export default function AccountHeader({ title }: AccountHeaderProps) {
  const [profile, setProfile] = useState<Profile>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<"profile" | "password" | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/profile", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();
        const user = data.user ?? data.profile ?? data;

        if (cancelled) return;

        const nextProfile: Profile = {
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email ?? "",
        };

        setProfile(nextProfile);
        setFirstName(nextProfile.firstName);
        setLastName(nextProfile.lastName);
      } catch {
        // Keep the portal usable if profile loading fails.
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function openModal(nextModal: "profile" | "password") {
    setError("");
    setMessage("");
    setMenuOpen(false);
    setModal(nextModal);

    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? data.message ?? "Could not update profile.");
      }

      const updatedUser = data.user ?? data.profile ?? data;

      const nextProfile = {
        firstName: updatedUser.firstName ?? firstName.trim(),
        lastName: updatedUser.lastName ?? lastName.trim(),
        email: updatedUser.email ?? profile.email,
      };

      setProfile(nextProfile);
      setFirstName(nextProfile.firstName);
      setLastName(nextProfile.lastName);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ?? data.message ?? "Could not change password.",
        );
      }

      setMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      window.location.assign("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed.");
      setMenuOpen(false);
      setLoading(false);
    }
  }

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim() || "Account";

  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
      .toUpperCase() || "A";

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {fullName}
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-gray-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {initials}
            </span>

            <span className="hidden text-left sm:block">
              <span className="block max-w-48 truncate text-sm font-semibold text-gray-900">
                {fullName}
              </span>
              <span className="block max-w-48 truncate text-xs text-gray-500">
                {profile.email}
              </span>
            </span>

            <span className="text-gray-500" aria-hidden="true">
              ▾
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={() => openModal("profile")}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit profile
              </button>

              <button
                type="button"
                onClick={() => openModal("password")}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Change password
              </button>

              <div className="my-2 border-t border-gray-100" />

              <button
                type="button"
                onClick={() => void logout()}
                disabled={loading}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Log out"}
              </button>
            </div>
          )}
        </div>
      </header>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
              setModal(null);
              setError("");
              setMessage("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2
                id="account-modal-title"
                className="text-lg font-bold text-gray-900"
              >
                {modal === "profile" ? "Edit profile" : "Change password"}
              </h2>

              <button
                type="button"
                aria-label="Close"
                disabled={loading}
                onClick={() => {
                  setModal(null);
                  setError("");
                  setMessage("");
                }}
                className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
              >
                {message}
              </p>
            )}

            {modal === "profile" ? (
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label
                    htmlFor="account-first-name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    First name
                  </label>
                  <input
                    id="account-first-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                    maxLength={80}
                    autoComplete="given-name"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-last-name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Last name
                  </label>
                  <input
                    id="account-last-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                    maxLength={80}
                    autoComplete="family-name"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>
              </form>
            ) : (
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
