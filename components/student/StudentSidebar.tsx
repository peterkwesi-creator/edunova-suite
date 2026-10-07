"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  {
    section: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/student/dashboard",
        icon: "⌂",
      },
    ],
  },
  {
    section: "ACADEMIC",
    items: [
      {
        label: "My Results",
        href: "/student/results",
        icon: "RG",
      },
      {
        label: "Assignments",
        href: "/student/assignments",
        icon: "AS",
      },
      {
        label: "Attendance",
        href: "/student/attendance",
        icon: "AT",
      },
      {
        label: "Timetable",
        href: "/student/timetable",
        icon: "TT",
      },
      {
        label: "My Notes",
        href: "/student/notes",
        icon: "NT",
      },
      {
        label: "Result Projection",
        href: "/student/projection",
        icon: "PR",
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
    <nav
      aria-label="Student navigation"
      className="flex-1 overflow-y-auto px-4 py-6"
    >
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
                  className={`flex min-h-11 items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] font-bold text-gray-500"
                  >
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

export default function StudentSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-200 px-6 py-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-600">
            EduNova
          </h1>

          <p className="mt-1 text-sm text-gray-500">Student Portal</p>
        </div>

        <NavigationContent pathname={pathname} />

        <div className="border-t border-gray-200 px-4 py-5">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <span aria-hidden="true">←</span>
            <span>School Website</span>
          </Link>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open student navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl text-gray-700 shadow-md md:hidden"
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close student navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        aria-label="Mobile student navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-6">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-blue-600">
              EduNova
            </h1>

            <p className="mt-1 text-sm text-gray-500">Student Portal</p>
          </div>

          <button
            type="button"
            aria-label="Close student navigation"
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
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <span aria-hidden="true">←</span>
            <span>School Website</span>
          </Link>
        </div>
      </aside>
    </>
  );
}