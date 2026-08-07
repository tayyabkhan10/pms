"use client";

import { useActionState, useEffect } from "react";
import { createEmployee, type ActionState } from "./actions";

const initialState: ActionState = {};

export function EmployeeCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(createEmployee, initialState);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <Field label="Password" name="password" type="password" required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Designation" name="designation" />
        <Field label="Phone" name="phone" />
      </div>
      <Field label="Hire date" name="hireDate" type="date" />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Creating..." : "Create Employee"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
      />
    </div>
  );
}
