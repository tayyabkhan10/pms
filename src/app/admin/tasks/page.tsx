import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getEmployeeOptions, getTaskTypeOptions } from "@/lib/options";
import { STATUSES, STATUS_STYLES, isOverdue } from "@/lib/status";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { deleteTask } from "./actions";
import { AssignTaskButton } from "./AssignTaskButton";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string; status?: string }>;
}) {
  const { employee, status } = await searchParams;
  const [employees, taskTypes, clientRows] = await Promise.all([
    getEmployeeOptions(),
    getTaskTypeOptions(),
    db.query.clients.findMany({
      where: (clients, { eq }) => eq(clients.isActive, true),
      with: { platform: true },
      orderBy: (clients, { asc }) => [asc(clients.name)],
    }),
  ]);
  const clientOptions = clientRows.map((c) => ({
    id: c.id,
    name: c.name,
    platformName: c.platform.name,
    brandGroup: c.brandGroup,
  }));

  const conditions = [];
  if (employee) conditions.push(eq(tasks.assignedTo, employee));
  if (status) conditions.push(eq(tasks.statusName, status));

  const rows = await db.query.tasks.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { client: true, assignee: true, taskType: true },
    orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Daily Task Board</h1>
        <AssignTaskButton clients={clientOptions} employees={employees} taskTypes={taskTypes} />
      </div>

      <AutoSubmitForm className="mt-4 flex flex-wrap gap-3 text-sm">
        <select
          name="employee"
          defaultValue={employee ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </AutoSubmitForm>

      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Task
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Client
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Employee
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Task Type
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Deadline
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Client Update Sent?
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No tasks yet.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const overdue = isOverdue(row.dueDate, row.statusName, row.completionDate);
              return (
                <tr key={row.id} className={overdue ? "bg-red-50" : undefined}>
                  <td className="px-4 py-2 text-sm text-zinc-900">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-zinc-400">{row.taskId}</div>
                    {row.remainingWork && (
                      <div className="mt-0.5 text-xs text-zinc-500">
                        Remaining: {row.remainingWork}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-600">{row.client.name}</td>
                  <td className="px-4 py-2 text-sm text-zinc-600">{row.assignee.name}</td>
                  <td className="px-4 py-2 text-sm text-zinc-600">{row.taskType.name}</td>
                  <td className={"px-4 py-2 text-sm " + (overdue ? "font-medium text-red-700" : "text-zinc-600")}>
                    {row.dueDate ?? "—"}
                    {overdue && " (overdue)"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.statusName as keyof typeof STATUS_STYLES] ?? "bg-zinc-100 text-zinc-600"}`}
                    >
                      {row.statusName}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-600">
                    {row.clientUpdateSent ? "Yes" : (
                      <span className="font-medium text-red-600">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <ConfirmDeleteButton
                      id={row.id}
                      confirmMessage={`Delete task "${row.title}"?`}
                      action={deleteTask}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
