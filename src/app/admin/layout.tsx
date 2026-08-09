import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskUpdateRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";

// Every /admin/* page needs the signed-in admin's session and live DB data — never static.
// Without this, Next's build occasionally tries to prerender a page here at build time
// (e.g. /admin/settings), where it has no request/cookies and the DB connection attempt can
// hang until the build times out and fails the deployment.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, pendingApprovals] = await Promise.all([
    getCurrentUser(),
    db.$count(taskUpdateRequests, eq(taskUpdateRequests.requestStatus, "pending")),
  ]);

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

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
