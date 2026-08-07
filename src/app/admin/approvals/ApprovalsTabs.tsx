"use client";

import { useState } from "react";

export function ApprovalsTabs({
  pendingCount,
  pendingPanel,
  historyPanel,
}: {
  pendingCount: number;
  pendingPanel: React.ReactNode;
  historyPanel: React.ReactNode;
}) {
  const [tab, setTab] = useState<"pending" | "history">("pending");

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Approvals</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Task status updates submitted by employees.
      </p>

      <div className="mt-4 flex gap-1 border-b border-zinc-200">
        <button
          onClick={() => setTab("pending")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "pending"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Pending {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "history"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          History
        </button>
      </div>

      <div className="mt-6">
        {tab === "pending" ? pendingPanel : historyPanel}
      </div>
    </div>
  );
}
