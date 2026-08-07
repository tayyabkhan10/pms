import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { resolveDateRange } from "@/lib/dateRange";
import { TaskUpdateRow } from "./TaskUpdateRow";
import { EmployeeTasksTabs } from "./EmployeeTasksTabs";
import { TaskHistoryPanel } from "./TaskHistoryPanel";

export default async function EmployeeTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, preset } = resolveDateRange(params);
  const user = await getCurrentUser();

  const rows = user
    ? await db.query.tasks.findMany({
        where: (tasks, { eq, and, ne }) =>
          and(eq(tasks.assignedTo, user.id), ne(tasks.statusName, "Completed")),
        with: {
          client: true,
          taskType: true,
          updateRequests: { orderBy: (r, { desc }) => [desc(r.createdAt)], limit: 1 },
        },
        orderBy: (tasks, { desc }) => [desc(tasks.assignedDate)],
      })
    : [];

  const activePanel =
    rows.length === 0 ? (
      <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center">
        <p className="text-sm text-zinc-500">No active tasks assigned.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {rows.map((task) => (
          <TaskUpdateRow key={task.id} task={task} latestRequest={task.updateRequests[0] ?? null} />
        ))}
      </div>
    );

  return (
    <EmployeeTasksTabs
      activeCount={rows.length}
      activePanel={activePanel}
      historyPanel={
        user ? (
          <TaskHistoryPanel userId={user.id} from={from} to={to} activePreset={preset} />
        ) : null
      }
    />
  );
}
