import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireAdmin();

  const rows = await db.query.employees.findMany({
    where: isNull(employees.deletedAt),
    with: { user: true },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  const csv = toCSV(
    rows.map((r) => ({
      name: r.user.name,
      email: r.user.email,
      designation: r.designation ?? "",
      phone: r.phone ?? "",
      hireDate: r.hireDate ?? "",
      isActive: r.user.isActive ? "Yes" : "No",
    })),
    [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "designation", label: "Designation" },
      { key: "phone", label: "Phone" },
      { key: "hireDate", label: "Hire Date" },
      { key: "isActive", label: "Active" },
    ]
  );

  return csvResponse("employees.csv", csv);
}
