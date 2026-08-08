import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { getBossOptions, getEmployeeOptions, getPlatformOptions } from "@/lib/options";
import { Pagination } from "@/components/Pagination";
import { ClientsClient } from "./ClientsClient";

const PAGE_SIZE = 50;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [rows, platforms, bosses, employees, total] = await Promise.all([
    db.query.clients.findMany({
      where: isNull(clients.deletedAt),
      with: { platform: true, boss: true, defaultEmployee: true },
      orderBy: (clients, { asc }) => [asc(clients.name)],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    getPlatformOptions(),
    getBossOptions(),
    getEmployeeOptions(),
    db.$count(clients, isNull(clients.deletedAt)),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex justify-end">
        <a
          href="/admin/clients/export"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Export CSV
        </a>
      </div>
      <ClientsClient rows={rows} platforms={platforms} bosses={bosses} employees={employees} />
      <Pagination page={page} totalPages={totalPages} searchParams={{}} />
    </div>
  );
}
