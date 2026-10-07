import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ParentSidebar from "@/components/parent/ParentSidebar";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <ParentSidebar />

        <main className="min-w-0 flex-1">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}