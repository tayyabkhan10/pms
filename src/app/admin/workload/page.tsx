import { and, gte, lte, isNull, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { resolveDateRange } from "@/lib/dateRange";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, preset } = resolveDateRange(params);

  // Aggregated in SQL (GROUP BY + FILTER) rather than pulling every matching task row into
  // Node.js to sum up — the "Year" preset can span the whole tasks table as it grows, and
  // letting Postgres do the counting (it can use the assignedDate/assignedTo indexes) keeps
  // this cheap regardless of how large that range gets.
  const summary = await db
    .select({
      name: users.name,
      total: sql<number>`count(*)`.mapWith(Number),
      completed: sql<number>`count(*) filter (where ${tasks.statusName} = 'Completed')`.mapWith(Number),
      pendingUpdates: sql<number>`count(*) filter (where ${tasks.clientUpdateSent} = false)`.mapWith(Number),
      minutes: sql<number>`coalesce(sum(${tasks.timeSpentMinutes}), 0)`.mapWith(Number),
    })
    .from(tasks)
    .innerJoin(users, eq(users.id, tasks.assignedTo))
    .where(and(gte(tasks.assignedDate, from), lte(tasks.assignedDate, to), isNull(tasks.deletedAt)))
    .groupBy(tasks.assignedTo, users.name)
    .orderBy(sql`count(*) desc`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Employee Workload</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Task completion and pending-update counts for a date range.
          </p>
        </div>
        <a
          href={`/admin/workload/export?${new URLSearchParams({ ...(preset && { preset }), from, to }).toString()}`}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Export CSV
        </a>
      </div>

      <div className="mt-4">
        <DateRangeFilter activePreset={preset} from={from} to={to} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Employee
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Total Tasks
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Completed
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Pending Updates
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Time Logged
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {summary.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No tasks in this range.
                </td>
              </tr>
            )}
            {summary.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.total}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.completed}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.pendingUpdates}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">
                  {Math.floor(row.minutes / 60)}h {row.minutes % 60}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
