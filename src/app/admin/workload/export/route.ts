import { and, gte, lte, isNull, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { resolveDateRange } from "@/lib/dateRange";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const { from, to } = resolveDateRange({
    preset: searchParams.get("preset") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  // Same SQL-side aggregation as /admin/workload — see that page for why.
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

  const csv = toCSV(summary, [
    { key: "name", label: "Employee" },
    { key: "total", label: "Total Tasks" },
    { key: "completed", label: "Completed" },
    { key: "pendingUpdates", label: "Pending Updates" },
    { key: "minutes", label: "Time Logged (min)" },
  ]);

  return csvResponse(`workload_${from}_to_${to}.csv`, csv);
}
