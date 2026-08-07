"use client";

import { useState } from "react";

export function SettingsTabs({
  platformsPanel,
  bossesPanel,
  taskTypesPanel,
}: {
  platformsPanel: React.ReactNode;
  bossesPanel: React.ReactNode;
  taskTypesPanel: React.ReactNode;
}) {
  const [tab, setTab] = useState<"platforms" | "bosses" | "taskTypes">("platforms");

  const tabs = [
    { key: "platforms" as const, label: "Platforms" },
    { key: "bosses" as const, label: "Bosses" },
    { key: "taskTypes" as const, label: "Task Types" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Settings</h1>

      <div className="mt-4 flex gap-1 border-b border-zinc-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "platforms" && platformsPanel}
        {tab === "bosses" && bossesPanel}
        {tab === "taskTypes" && taskTypesPanel}
      </div>
    </div>
  );
}
