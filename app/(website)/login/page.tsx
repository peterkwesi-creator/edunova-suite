"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [portal, setPortal] = useState("TEACHER");
  const [email, setEmail] = useState("teacher@edunova.com");
  const [password, setPassword] = useState("teacher123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function changePortal(value: string) {
    setPortal(value);
    setError("");

    if (value === "ADMIN") {
      setEmail("admin@edunova.com");
      setPassword("admin123");
    }

    if (value === "TEACHER") {
      setEmail("teacher@edunova.com");
      setPassword("teacher123");
    }

    if (value === "STUDENT") {
      setEmail("student@edunova.com");
      setPassword("student123");
    }

    if (value === "PARENT") {
      setEmail("parent@edunova.com");
      setPassword("parent123");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      if (data.role === "ADMIN" || data.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
        return;
      }

      if (data.role === "TEACHER") {
        router.push("/teacher/dashboard");
        return;
      }

      if (data.role === "STUDENT") {
        router.push("/student/dashboard");
        return;
      }

      if (data.role === "PARENT") {
        router.push("/parent/dashboard");
        return;
      }

      setError("Your account has no valid portal role.");
    } catch (error) {
      console.error(error);
      setError(
        "Unable to connect to the login server. Make sure the development server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600">
              EduNova Suite
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Sign in
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Access your school portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="portal"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Portal
              </label>

              <select
                id="portal"
                value={portal}
                onChange={(event) =>
                  changePortal(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">
              Demo accounts
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Admin: admin@edunova.com / admin123
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Teacher: teacher@edunova.com / teacher123
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Student: student@edunova.com / student123
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Parent: parent@edunova.com / parent123
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}