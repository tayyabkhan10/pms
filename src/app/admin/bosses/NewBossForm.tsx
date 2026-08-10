"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBoss, type ActionState } from "./actions";

const initialState: ActionState = {};

export function NewBossForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, isPending] = useActionState(createBoss, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input
        name="name"
        placeholder="Name"
        required
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
      />
      <input
        name="email"
        type="email"
        placeholder="Email (optional)"
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
      />
      <input
        name="phone"
        placeholder="Phone (optional)"
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add Boss"}
      </button>
      {state.error && <p className="col-span-4 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
