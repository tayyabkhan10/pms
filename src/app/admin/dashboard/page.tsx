import Link from "next/link";
import { and, count, eq, gte, lte, ne, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { STATUSES, STATUS_STYLES, type StatusName } from "@/lib/status";
import { toLocalISODate, todayLocalISODate } from "@/lib/date";
import { StatusDonut } from "./StatusDonut";
import { TrendChart } from "./TrendChart";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalISODate(d);
}

const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All Data" },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

function rangeLabel(range: RangeKey) {
  return RANGE_OPTIONS.find((r) => r.key === range)?.label ?? "Today";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: RangeKey = RANGE_OPTIONS.some((r) => r.key === rangeParam)
    ? (rangeParam as RangeKey)
    : "today";

  const today = todayLocalISODate();
  const trendStart = daysAgo(6);

  // "all" drops the assignedDate condition entirely rather than using a huge date window —
  // cheaper for the DB and avoids ever missing rows near the boundary.
  const rangeCondition =
    range === "all"
      ? undefined
      : and(
          gte(tasks.assignedDate, range === "today" ? today : range === "week" ? daysAgo(6) : daysAgo(29)),
          lte(tasks.assignedDate, today)
        );

  const where = rangeCondition
    ? and(rangeCondition, isNull(tasks.deletedAt))
    : isNull(tasks.deletedAt);

  // Counts come from SQL aggregates (GROUP BY / COUNT), not from pulling every matching row
  // into JS and filtering — "All Data" can span the whole tasks table as it grows, and the old
  // approach re-fetched (with client/assignee joins) and re-counted that entire table on every
  // dashboard load. The two list sections below only need a bounded, capped set of rows since
  // they're just showing examples to act on, not a full export.
  const LIST_CAP = 200;
  const [statusGroups, updateNotSentCount, blockedRows, updateNotSentRows, trendRows] =
    await Promise.all([
      db
        .select({ status: tasks.statusName, n: count() })
        .from(tasks)
        .where(where)
        .groupBy(tasks.statusName),
      db.$count(
        tasks,
        and(where, eq(tasks.clientUpdateSent, false), ne(tasks.statusName, "Not Started"))
      ),
      db.query.tasks.findMany({
        where: and(where, eq(tasks.statusName, "Blocked")),
        with: { client: true, assignee: true },
        orderBy: (t, { desc }) => [desc(t.assignedDate)],
        limit: LIST_CAP,
      }),
      db.query.tasks.findMany({
        where: and(where, eq(tasks.clientUpdateSent, false), ne(tasks.statusName, "Not Started")),
        with: { client: true, assignee: true },
        orderBy: (t, { desc }) => [desc(t.assignedDate)],
        limit: LIST_CAP,
      }),
      db.query.tasks.findMany({
        where: and(
          or(
            and(gte(tasks.assignedDate, trendStart), lte(tasks.assignedDate, today)),
            and(gte(tasks.completionDate, trendStart), lte(tasks.completionDate, today))
          ),
          isNull(tasks.deletedAt)
        ),
        columns: { assignedDate: true, completionDate: true },
      }),
    ]);

  const statusCountMap = new Map(statusGroups.map((g) => [g.status, g.n]));
  const statusCounts = STATUSES.map((name) => ({ name, value: statusCountMap.get(name) ?? 0 }));
  const totalCount = statusGroups.reduce((sum, g) => sum + g.n, 0);
  const completedCount = statusCountMap.get("Completed") ?? 0;
  const pendingCount = totalCount - completedCount;
  const blockedCount = statusCountMap.get("Blocked") ?? 0;

  const trendCounts = new Map<string, { assigned: number; completed: number }>();
  for (const r of trendRows) {
    if (r.assignedDate) {
      const bucket = trendCounts.get(r.assignedDate) ?? { assigned: 0, completed: 0 };
      bucket.assigned += 1;
      trendCounts.set(r.assignedDate, bucket);
    }
    if (r.completionDate) {
      const bucket = trendCounts.get(r.completionDate) ?? { assigned: 0, completed: 0 };
      bucket.completed += 1;
      trendCounts.set(r.completionDate, bucket);
    }
  }

  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const day = daysAgo(6 - i);
    const bucket = trendCounts.get(day);
    return {
      day: day.slice(5), // MM-DD
      Assigned: bucket?.assigned ?? 0,
      Completed: bucket?.completed ?? 0,
    };
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.key}
              href={r.key === "today" ? "/admin/dashboard" : `/admin/dashboard?range=${r.key}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                range === r.key
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Tasks" value={totalCount} />
        <StatCard label="Completed" value={completedCount} tone="green" />
        <StatCard label="Pending" value={pendingCount} tone="brand" />
        <StatCard label="Blocked" value={blockedCount} tone="red" />
        <StatCard label="Update Not Sent" value={updateNotSentCount} tone="red" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Status Breakdown</h2>
          <p className="text-xs text-zinc-500">{rangeLabel(range)}</p>
          <StatusDonut data={statusCounts} />
        </div>
        <div className="rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">7-Day Completion Trend</h2>
          <p className="text-xs text-zinc-500">Tasks assigned vs completed</p>
          <TrendChart data={trendData} />
        </div>
      </div>

      <Section
        title="Blocked Tasks"
        rows={blockedRows}
        totalCount={blockedCount}
        cap={LIST_CAP}
        emptyText={`No blocked tasks — ${rangeLabel(range)}.`}
      />
      <Section
        title="Client Update Not Sent"
        rows={updateNotSentRows}
        totalCount={updateNotSentCount}
        cap={LIST_CAP}
        emptyText={`All client updates sent — ${rangeLabel(range)}.`}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red" | "green" | "brand";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-600"
      : tone === "green"
        ? "text-green-600"
        : tone === "brand"
          ? "text-brand-600"
          : "text-zinc-900";

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

type TaskRow = {
  id: string;
  title: string;
  statusName: string;
  client: { name: string };
  assignee: { name: string };
};

function Section({
  title,
  rows,
  totalCount,
  cap,
  emptyText,
}: {
  title: string;
  rows: TaskRow[];
  totalCount: number;
  cap: number;
  emptyText: string;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {totalCount > cap && (
          <span className="text-xs text-zinc-400">Showing {cap} of {totalCount}</span>
        )}
      </div>
      <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-center text-sm text-zinc-500">{emptyText}</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.title}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.client.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.assignee.name}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.statusName as StatusName] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {row.statusName}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
