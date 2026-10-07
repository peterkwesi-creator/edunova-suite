"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  {
    section: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/teacher/dashboard",
        icon: "⌂",
      },
    ],
  },
  {
    section: "TEACHING",
    items: [
      {
        label: "My Results",
        href: "/teacher/results",
        icon: "📊",
      },
      {
        label: "Assignments",
        href: "/teacher/assignments",
        icon: "📝",
      },
      {
        label: "Attendance",
        href: "/teacher/attendance",
        icon: "✓",
      },
      {
        label: "Timetable",
        href: "/teacher/timetable",
        icon: "🗓️",
      },
      {
        label: "Notes",
        href: "/teacher/notes",
        icon: "📌",
      },
      {
        label: "My Students",
        href: "/teacher/students",
        icon: "👨‍🎓",
      },
      {
        label: "Tasks",
        href: "/teacher/tasks",
        icon: "☑",
      },
    ],
  },
];

function NavigationContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-4 py-6">
      {navigation.map((group) => (
        <div key={group.section} className="mb-8">
          <p className="mb-4 px-3 text-xs font-semibold tracking-wide text-gray-400">
            {group.section}
          </p>

          <div className="space-y-1">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="flex w-5 justify-center text-base">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function TeacherSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-200 px-6 py-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-600">
            EduNova
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Teacher Portal
          </p>
        </div>

        <NavigationContent pathname={pathname} />

        <div className="border-t border-gray-200 px-4 py-5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <span>←</span>
            <span>School Website</span>
          </Link>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open teacher navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl text-gray-700 shadow-md md:hidden"
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-blue-600">
              EduNova
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Teacher Portal
            </p>
          </div>

          <button
            type="button"
            aria-label="Close teacher navigation"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <NavigationContent
          pathname={pathname}
          onNavigate={() => setOpen(false)}
        />

        <div className="border-t border-gray-200 px-4 py-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <span>←</span>
            <span>School Website</span>
          </Link>
        </div>
      </aside>
    </>
  );
}