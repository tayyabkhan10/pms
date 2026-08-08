import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const employee = searchParams.get("employee") || undefined;
  const status = searchParams.get("status") || undefined;
  const priority = searchParams.get("priority") || undefined;

  const conditions = [isNull(tasks.deletedAt)];
  if (employee) conditions.push(eq(tasks.assignedTo, employee));
  if (status) conditions.push(eq(tasks.statusName, status));
  if (priority) conditions.push(eq(tasks.priority, priority));

  const rows = await db.query.tasks.findMany({
    where: and(...conditions),
    with: { client: true, assignee: true, taskType: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const csv = toCSV(
    rows.map((r) => ({
      taskId: r.taskId,
      title: r.title,
      client: r.client.name,
      employee: r.assignee.name,
      taskType: r.taskType.name,
      priority: r.priority,
      status: r.statusName,
      assignedDate: r.assignedDate,
      dueDate: r.dueDate ?? "",
      completionDate: r.completionDate ?? "",
      timeSpentMinutes: r.timeSpentMinutes,
      clientUpdateSent: r.clientUpdateSent ? "Yes" : "No",
    })),
    [
      { key: "taskId", label: "Task ID" },
      { key: "title", label: "Title" },
      { key: "client", label: "Client" },
      { key: "employee", label: "Employee" },
      { key: "taskType", label: "Task Type" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "assignedDate", label: "Assigned Date" },
      { key: "dueDate", label: "Due Date" },
      { key: "completionDate", label: "Completion Date" },
      { key: "timeSpentMinutes", label: "Time Spent (min)" },
      { key: "clientUpdateSent", label: "Client Update Sent" },
    ]
  );

  return csvResponse("tasks.csv", csv);
}
