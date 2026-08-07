import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskUpdateRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const pendingApprovals = await db.$count(
    taskUpdateRequests,
    eq(taskUpdateRequests.requestStatus, "pending")
  );

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <AdminSidebar
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        pendingApprovals={pendingApprovals}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
