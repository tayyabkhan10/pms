import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EmployeeSidebar } from "./EmployeeSidebar";

// Same reasoning as src/app/admin/layout.tsx — every /employee/* page is per-session and
// must never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "employee") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <EmployeeSidebar userName={user.name} userEmail={user.email} avatarUrl={user.avatarUrl} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
