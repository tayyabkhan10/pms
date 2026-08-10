"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTaskType, type ActionState } from "./actions";

const initialState: ActionState = {};

export function NewTaskTypeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, isPending] = useActionState(createTaskType, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-3">
      <div>
        <input
          name="name"
          placeholder="New task type (e.g. Listing Update)"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
        {state.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
