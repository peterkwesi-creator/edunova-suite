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
        name: "Tasks",
        href: "/admin/tasks",
        icon: "✅",
      },
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
    <aside className="flex h-full w-full flex-col bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <Link href="/admin/dashboard" className="block">
          <div className="text-xl font-bold tracking-tight">
            EduNova Suite
          </div>

          <div className="mt-1 text-xs font-medium text-slate-400">
            Administrator Portal
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-7">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <span className="flex w-6 shrink-0 items-center justify-center text-base">
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

      <div className="border-t border-slate-800 px-6 py-4">
        <div className="text-xs text-slate-500">
          EduNova Suite
        </div>

        <div className="mt-1 text-xs text-slate-600">
          School Management Platform
        </div>
      </div>
    </aside>
  );
}