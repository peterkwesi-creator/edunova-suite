"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/parent/dashboard",
        icon: "⌂",
      },
      {
        name: "My Children",
        href: "/parent/children",
        icon: "👨‍👩‍👧",
      },
    ],
  },
  {
    title: "Academic",
    items: [
      {
        name: "Results",
        href: "/parent/results",
        icon: "📊",
      },
      {
        name: "Assignments",
        href: "/parent/assignments",
        icon: "📝",
      },
      {
        name: "Attendance",
        href: "/parent/attendance",
        icon: "✓",
      },
      {
        name: "Timetable",
        href: "/parent/timetable",
        icon: "🗓️",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        name: "School Fees",
        href: "/parent/fees",
        icon: "💳",
      },
    ],
  },
];

export default function ParentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-gray-200 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-gray-200 px-6 py-6">
          <Link
            href="/parent/dashboard"
            className="text-2xl font-black tracking-tight text-blue-600"
          >
            EduNova
          </Link>

          <p className="mt-1 text-xs font-medium text-gray-500">
            Parent Portal
          </p>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span className="flex w-6 justify-center text-base">
                        {item.icon}
                      </span>

                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <span className="flex w-6 justify-center">
              ←
            </span>

            <span>School Website</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}