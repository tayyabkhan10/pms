import { and, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { clients, employees, tasks } from "@/db/schema";
import { RestoreButton } from "@/components/RestoreButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  permanentlyDeleteClient,
  permanentlyDeleteEmployee,
  permanentlyDeleteTask,
  restoreClient,
  restoreEmployee,
  restoreTask,
} from "./actions";

const RETENTION_DAYS = 7;

function daysLeft(deletedAt: Date) {
  const elapsedMs = Date.now() - deletedAt.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(RETENTION_DAYS - elapsedDays));
}

export default async function RecycleBinPage() {
  // Items older than the retention window simply stop showing here (and can no longer be
  // restored) rather than being hard-deleted — a real purge risks foreign-key violations
  // against historical records that still reference the employee/client/task (e.g. a
  // completed task naming a since-"deleted" employee), so this ages them out safely instead.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const [deletedTasks, deletedClients, deletedEmployees] = await Promise.all([
    db.query.tasks.findMany({
      where: and(isNotNull(tasks.deletedAt), gte(tasks.deletedAt, cutoff)),
      with: { client: true, assignee: true },
      orderBy: (t, { desc }) => [desc(t.deletedAt)],
    }),
    db.query.clients.findMany({
      where: and(isNotNull(clients.deletedAt), gte(clients.deletedAt, cutoff)),
      orderBy: (c, { desc }) => [desc(c.deletedAt)],
    }),
    db.query.employees.findMany({
      where: and(isNotNull(employees.deletedAt), gte(employees.deletedAt, cutoff)),
      with: { user: true },
      orderBy: (e, { desc }) => [desc(e.deletedAt)],
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Recycle Bin</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Deleted items stay here for {RETENTION_DAYS} days and can be restored by an admin. After
        that they're permanently removed.
      </p>

      <Section title="Employees">
        {deletedEmployees.length === 0 ? (
          <Empty />
        ) : (
          <Table
            headers={["Name", "Email", "Days Left", ""]}
            rows={deletedEmployees.map((e) => [
              e.user.name,
              e.user.email,
              `${daysLeft(e.deletedAt!)} days`,
              <div key={e.userId} className="flex items-center gap-3">
                <RestoreButton id={e.userId} action={restoreEmployee} />
                <ConfirmDeleteButton
                  id={e.userId}
                  label="Delete Permanently"
                  confirmMessage={`Permanently delete ${e.user.name}? This cannot be undone.`}
                  action={permanentlyDeleteEmployee}
                />
              </div>,
            ])}
          />
        )}
      </Section>

      <Section title="Clients">
        {deletedClients.length === 0 ? (
          <Empty />
        ) : (
          <Table
            headers={["Name", "Days Left", ""]}
            rows={deletedClients.map((c) => [
              c.name,
              `${daysLeft(c.deletedAt!)} days`,
              <div key={c.id} className="flex items-center gap-3">
                <RestoreButton id={c.id} action={restoreClient} />
                <ConfirmDeleteButton
                  id={c.id}
                  label="Delete Permanently"
                  confirmMessage={`Permanently delete client "${c.name}"? This cannot be undone.`}
                  action={permanentlyDeleteClient}
                />
              </div>,
            ])}
          />
        )}
      </Section>

      <Section title="Tasks">
        {deletedTasks.length === 0 ? (
          <Empty />
        ) : (
          <Table
            headers={["Task", "Client", "Employee", "Days Left", ""]}
            rows={deletedTasks.map((t) => [
              t.title,
              t.client.name,
              t.assignee.name,
              `${daysLeft(t.deletedAt!)} days`,
              <div key={t.id} className="flex items-center gap-3">
                <RestoreButton id={t.id} action={restoreTask} />
                <ConfirmDeleteButton
                  id={t.id}
                  label="Delete Permanently"
                  confirmMessage={`Permanently delete task "${t.title}"? This cannot be undone.`}
                  action={permanentlyDeleteTask}
                />
              </div>,
            ])}
          />
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-zinc-500">Nothing here.</p>;
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-sm text-zinc-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
