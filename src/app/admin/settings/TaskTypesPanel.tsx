import { db } from "@/db";
import { NewTaskTypeForm } from "@/app/admin/task-types/NewTaskTypeForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteTaskType } from "@/app/admin/task-types/actions";

export async function TaskTypesPanel() {
  const rows = await db.query.taskTypes.findMany({
    orderBy: (taskTypes, { asc }) => [asc(taskTypes.name)],
  });

  return (
    <div className="max-w-lg">
      <p className="text-sm text-zinc-500">Feeds the Task Type dropdown on the Daily Task Board.</p>
      <div className="mt-4">
        <NewTaskTypeForm />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-zinc-500">No task types yet.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.name}</td>
                <td className="px-4 py-2 text-right">
                  <ConfirmDeleteButton
                    id={row.id}
                    confirmMessage={`Delete task type "${row.name}"?`}
                    action={deleteTaskType}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
