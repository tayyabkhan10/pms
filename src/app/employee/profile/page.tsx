import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AvatarUpload } from "@/components/AvatarUpload";

export default async function EmployeeProfilePage() {
  const user = await getCurrentUser();
  const employee = user
    ? await db.query.employees.findFirst({ where: eq(employees.userId, user.id) })
    : null;

  if (!user) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">My Profile</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Managed by your admin — contact them if anything here needs to change.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm">
        <AvatarUpload name={user.name} url={user.avatarUrl} />
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm">
        <Field label="Full Name" value={user.name} />
        <Field label="Email" value={user.email} />
        <Field label="Designation" value={employee?.designation ?? "—"} />
        <Field label="Phone" value={employee?.phone ?? "—"} />
        <Field label="Hire Date" value={employee?.hireDate ?? "—"} />
        <Field
          label="Status"
          value={
            <span
              className={
                employee?.isActive
                  ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                  : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500"
              }
            >
              {employee?.isActive ? "Active" : "Inactive"}
            </span>
          }
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-900">{value}</span>
    </div>
  );
}
