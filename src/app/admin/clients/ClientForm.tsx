// src/admin/clients/ClientForm.tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "./actions";
import { getRecentTasksForClient } from "./actions";
import { STATUS_STYLES, type StatusName } from "@/lib/status";

const initialState: ActionState = {};

type Option = { id: string; label: string };
type RecentTask = { id: string; title: string; statusName: string; assignedDate: string };

export function ClientForm({
  action,
  platforms,
  bosses,
  employees,
  defaults,
  onSuccess,
  showRecentTasks,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  platforms: Option[];
  bosses: Option[];
  employees: Option[];
  defaults?: {
    id?: string;
    name: string;
    platformId: string;
    bossId: string;
    brandGroup: string;
    isDreamWeaversGroup: boolean;
    defaultEmployeeId: string;
    storeLink: string;
    loginNotes: string;
    generalNotes: string;
    isActive: boolean;
  };
  onSuccess: () => void;
  showRecentTasks?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [recentTasks, setRecentTasks] = useState<RecentTask[] | null>(null);
  const clientId = defaults?.id;

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  useEffect(() => {
    if (!showRecentTasks || !clientId) return;
    let cancelled = false;
    getRecentTasksForClient(clientId).then((rows) => {
      if (!cancelled) setRecentTasks(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [showRecentTasks, clientId]);

  return (
    <form action={formAction} className="space-y-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      <div>
        <label className="block text-sm font-medium text-zinc-700">Client Name</label>
        <input
          name="name"
          defaultValue={defaults?.name}
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Platform</label>
          <select
            name="platformId"
            defaultValue={defaults?.platformId}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          >
            <option value="">Select platform...</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Boss (optional)</label>
          <select
            name="bossId"
            defaultValue={defaults?.bossId}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          >
            <option value="">Not set</option>
            {bosses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Brand / Group</label>
          <input
            name="brandGroup"
            defaultValue={defaults?.brandGroup}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Default Employee (optional)
          </label>
          <select
            name="defaultEmployeeId"
            defaultValue={defaults?.defaultEmployeeId}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          >
            <option value="">Not set</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Store Link</label>
        <input
          name="storeLink"
          defaultValue={defaults?.storeLink}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Login Notes</label>
        <textarea
          name="loginNotes"
          defaultValue={defaults?.loginNotes}
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">General Notes</label>
        <textarea
          name="generalNotes"
          defaultValue={defaults?.generalNotes}
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="isDreamWeaversGroup"
          defaultChecked={defaults?.isDreamWeaversGroup}
        />
        Dream Weavers group client (highlighted separately — different ownership/handling)
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} />
        Active
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {isPending ? "Saving..." : defaults?.id ? "Save Changes" : "Create Client"}
      </button>

      {showRecentTasks && (
        <div className="border-t border-zinc-200 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">Recent Tasks</h3>
          {recentTasks === null ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : recentTasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No tasks for this client yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span className="text-zinc-700">{t.title}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{t.assignedDate}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.statusName as StatusName] ?? "bg-zinc-100 text-zinc-600"}`}
                    >
                      {t.statusName}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
