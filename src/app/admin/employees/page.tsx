import { db } from "@/db";
import { EmployeesClient } from "./EmployeesClient";

export default async function EmployeesPage() {
  const rows = await db.query.employees.findMany({
    with: { user: true },
    orderBy: (employees, { desc }) => [desc(employees.createdAt)],
  });

  return <EmployeesClient rows={rows} />;
}
