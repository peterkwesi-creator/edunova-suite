
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin/dashboard" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Students", href: "/admin/students" },
      { label: "Teachers", href: "/admin/teachers" },
      { label: "Classes", href: "/admin/classes" },
      { label: "Subjects", href: "/admin/subjects" },
      { label: "Attendance", href: "/admin/attendance" },
      { label: "Results", href: "/admin/results" },
      { label: "Fees", href: "/admin/fees" },
      { label: "Parents", href: "/admin/parents" },
      { label: "Schools", href: "/admin/schools", superAdminOnly: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled) {
          setRole(data?.user?.role ?? null);
        }
      } catch {
        if (!cancelled) setRole(null);
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <Link
          href="/admin/dashboard"
          className="text-xl font-bold text-blue-700"
        >
          EduNova
        </Link>
        <p className="mt-1 text-xs text-gray-500">School Management</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navigation.map((section) => {
          const visibleItems = section.items.filter(
            (item) =>
              !("superAdminOnly" in item && item.superAdminOnly) ||
              role === "SUPER_ADMIN"
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
