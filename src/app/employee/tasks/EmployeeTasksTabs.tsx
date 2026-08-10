"use client";

import { useState } from "react";

export function EmployeeTasksTabs({
  activeCount,
  activePanel,
  historyPanel,
}: {
  activeCount: number;
  activePanel: React.ReactNode;
  historyPanel: React.ReactNode;
}) {
  const [tab, setTab] = useState<"active" | "history">("active");
  // History's panel is a client component that fetches on mount — keeping it mounted (just
  // hidden) once opened avoids re-querying every time it's switched back to.
  const [historyOpened, setHistoryOpened] = useState(false);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">My Tasks</h1>

      <div className="mt-4 flex gap-1 border-b border-zinc-200">
        <button
          onClick={() => setTab("active")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "active"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Active {activeCount > 0 && `(${activeCount})`}
        </button>
        <button
          onClick={() => {
            setTab("history");
            setHistoryOpened(true);
          }}
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
        <div className={tab === "active" ? "" : "hidden"}>{activePanel}</div>
        {historyOpened && <div className={tab === "history" ? "" : "hidden"}>{historyPanel}</div>}
      </div>
    </div>
  );
}
