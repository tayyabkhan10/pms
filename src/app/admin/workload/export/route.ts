import { and, gte, lte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
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

  const rows = await db.query.tasks.findMany({
    where: and(gte(tasks.assignedDate, from), lte(tasks.assignedDate, to), isNull(tasks.deletedAt)),
    columns: { statusName: true, clientUpdateSent: true, timeSpentMinutes: true },
    with: { assignee: { columns: { id: true, name: true } } },
  });

  const byEmployee = new Map<
    string,
    { name: string; total: number; completed: number; pendingUpdates: number; minutes: number }
  >();
  for (const row of rows) {
    const key = row.assignee.id;
    const entry = byEmployee.get(key) ?? {
      name: row.assignee.name,
      total: 0,
      completed: 0,
      pendingUpdates: 0,
      minutes: 0,
    };
    entry.total += 1;
    if (row.statusName === "Completed") entry.completed += 1;
    if (!row.clientUpdateSent) entry.pendingUpdates += 1;
    entry.minutes += row.timeSpentMinutes;
    byEmployee.set(key, entry);
  }

  const csv = toCSV(Array.from(byEmployee.values()).sort((a, b) => b.total - a.total), [
    { key: "name", label: "Employee" },
    { key: "total", label: "Total Tasks" },
    { key: "completed", label: "Completed" },
    { key: "pendingUpdates", label: "Pending Updates" },
    { key: "minutes", label: "Time Logged (min)" },
  ]);

  return csvResponse(`workload_${from}_to_${to}.csv`, csv);
}
