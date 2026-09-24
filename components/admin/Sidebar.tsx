"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: "⌂",
      },
    ],
  },
  {
    title: "Academic",
    items: [
      {
        name: "Students",
        href: "/admin/students",
        icon: "🎓",
      },
      {
        name: "Teachers",
        href: "/admin/teachers",
        icon: "👨‍🏫",
      },
      {
        name: "Classes",
        href: "/admin/classes",
        icon: "🏫",
      },
      {
        name: "Subjects",
        href: "/admin/subjects",
        icon: "📚",
      },
      {
        name: "Class Subjects",
        href: "/admin/class-subjects",
        icon: "🔗",
      },
      {
        name: "Academic Years",
        href: "/admin/academic-years",
        icon: "📅",
      },
      {
        name: "Timetable",
        href: "/admin/timetable",
        icon: "🗓️",
      },
      {
        name: "Assignments",
        href: "/admin/assignments",
        icon: "📝",
      },
      {
        name: "Student Assignments",
        href: "/admin/student-assignments",
        icon: "📋",
      },
      {
        name: "Attendance",
        href: "/admin/attendance",
        icon: "✓",
      },
      {
        name: "Report Cards",
        href: "/admin/report-card",
        icon: "📊",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        name: "School Fees",
        href: "/admin/fees",
        icon: "💳",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        name: "Users",
        href: "/admin/users",
        icon: "👥",
      },
      {
        name: "Schools",
        href: "/admin/schools",
        icon: "🏢",
      },
      {
        name: "GES Report",
        href: "/admin/ges-report",
        icon: "📑",
      },
      {
        name: "Website Editor",
        href: "/admin/website",
        icon: "🌐",
      },
      {
        name: "News & Updates",
        href: "/admin/news",
        icon: "📰",
      },
      {
        name: "Contact Messages",
        href: "/admin/contact-messages",
        icon: "✉",
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: "⚙",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-gray-200 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-gray-200 px-6 py-6">
          <Link
            href="/admin/dashboard"
            className="text-2xl font-black tracking-tight text-blue-600"
          >
            EduNova
          </Link>

          <p className="mt-1 text-xs font-medium text-gray-500">
            Administrator Portal
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
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
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
      </div>
    </aside>
  );
}