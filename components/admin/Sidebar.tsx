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
      {
        name: "Tasks",
        href: "/admin/tasks",
        icon: "✓",
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
      {
        name: "GES Report",
        href: "/admin/ges-report",
        icon: "📑",
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
      {
        name: "Accounting",
        href: "/admin/accounting",
        icon: "💰",
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
        icon: "✉️",
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: "⚙️",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <Link href="/admin/dashboard" className="block">
          <div className="text-lg font-bold text-slate-900">
            EduNova Suite
          </div>

          <div className="mt-1 text-xs font-medium text-slate-500">
            Administrator Portal
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-7">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex w-5 items-center justify-center text-base">
                        {item.icon}
                      </span>

                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="flex w-5 items-center justify-center text-base">
            ↗
          </span>

          <span>View Website</span>
        </Link>
      </div>
    </aside>
  );
}