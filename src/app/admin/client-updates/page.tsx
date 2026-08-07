import { and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { clientUpdateRegister } from "@/db/schema";
import { getClientOptions, getEmployeeOptions } from "@/lib/options";
import { resolveDateRange } from "@/lib/dateRange";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { NewUpdateForm } from "./NewUpdateForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteClientUpdate } from "./actions";

export default async function ClientUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, preset } = resolveDateRange(params);

  const [rows, clients, employees] = await Promise.all([
    db.query.clientUpdateRegister.findMany({
      where: and(
        gte(clientUpdateRegister.updateDate, from),
        lte(clientUpdateRegister.updateDate, to)
      ),
      with: { client: true, employee: true },
      orderBy: (t, { desc }) => [desc(t.updateDate)],
    }),
    getClientOptions(),
    getEmployeeOptions(),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Client Update Register</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Detailed record of every client update sent, with follow-up tracking.
      </p>

      <div className="mt-6">
        <NewUpdateForm clients={clients} employees={employees} />
      </div>

      <div className="mt-6">
        <DateRangeFilter activePreset={preset} from={from} to={to} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Client</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Employee</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Summary</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Follow-up</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No updates logged in this range.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.updateDate}</td>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.client.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.employee.name}</td>
                <td className="px-4 py-2 max-w-xs truncate text-sm text-zinc-600">
                  {row.summary ?? "—"}
                </td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.followUpDate ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <ConfirmDeleteButton
                    id={row.id}
                    confirmMessage="Delete this update record?"
                    action={deleteClientUpdate}
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
