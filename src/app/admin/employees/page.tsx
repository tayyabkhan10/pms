import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { Pagination } from "@/components/Pagination";
import { EmployeesClient } from "./EmployeesClient";

const PAGE_SIZE = 50;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [rows, total] = await Promise.all([
    db.query.employees.findMany({
      where: isNull(employees.deletedAt),
      with: { user: true },
      orderBy: (employees, { desc }) => [desc(employees.createdAt)],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    db.$count(employees, isNull(employees.deletedAt)),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex justify-end">
        <a
          href="/admin/employees/export"
          className="rounded-md border mb-2 border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Export CSV
        </a>
      </div>
      <EmployeesClient rows={rows} />
      <Pagination page={page} totalPages={totalPages} searchParams={{}} />
    </div>
  );
}
