import { db } from "@/db";
import { getBossOptions, getEmployeeOptions, getPlatformOptions } from "@/lib/options";
import { ClientsClient } from "./ClientsClient";

export default async function ClientsPage() {
  const [rows, platforms, bosses, employees, recentTasks] = await Promise.all([
    db.query.clients.findMany({
      with: { platform: true, boss: true, defaultEmployee: true },
      orderBy: (clients, { asc }) => [asc(clients.name)],
    }),
    getPlatformOptions(),
    getBossOptions(),
    getEmployeeOptions(),
    db.query.tasks.findMany({
      columns: { id: true, clientId: true, title: true, statusName: true, assignedDate: true },
      orderBy: (t, { desc }) => [desc(t.assignedDate)],
      limit: 200,
    }),
  ]);

  const tasksByClient: Record<string, typeof recentTasks> = {};
  for (const t of recentTasks) {
    (tasksByClient[t.clientId] ??= []).push(t);
  }
  for (const key in tasksByClient) {
    tasksByClient[key] = tasksByClient[key].slice(0, 5);
  }

  return (
    <ClientsClient
      rows={rows}
      platforms={platforms}
      bosses={bosses}
      employees={employees}
      tasksByClient={tasksByClient}
    />
  );
}
