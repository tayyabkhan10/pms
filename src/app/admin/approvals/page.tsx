import { db } from "@/db";
import { resolveDateRange } from "@/lib/dateRange";
import { ApprovalRow } from "./ApprovalRow";
import { ApprovalsTabs } from "./ApprovalsTabs";
import { HistoryPanel } from "./HistoryPanel";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, preset } = resolveDateRange(params);

  const requests = await db.query.taskUpdateRequests.findMany({
    where: (r, { eq }) => eq(r.requestStatus, "pending"),
    with: { task: true, submitter: true },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  });

  const pendingPanel =
    requests.length === 0 ? (
      <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center">
        <p className="text-sm text-zinc-500">Nothing pending — all caught up.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {requests.map((r) => (
          <ApprovalRow key={r.id} request={r} />
        ))}
      </div>
    );

  return (
    <ApprovalsTabs
      pendingCount={requests.length}
      pendingPanel={pendingPanel}
      historyPanel={<HistoryPanel from={from} to={to} activePreset={preset} />}
    />
  );
}
