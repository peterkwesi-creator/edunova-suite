
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  const session = await verifySession(token);

  if (
    !session ||
    !["ADMIN", "SUPER_ADMIN"].includes(session.role)
  ) {
    redirect("/login");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      role: session.role,
      active: true,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
