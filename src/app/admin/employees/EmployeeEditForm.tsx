"use client";

import { useActionState, useEffect } from "react";
import { updateEmployee, resetPassword, type ActionState } from "./actions";

const initialState: ActionState = {};

export function EmployeeEditForm({
  id,
  name,
  email,
  isActive,
  designation,
  phone,
  hireDate,
  onSuccess,
}: {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  designation: string;
  phone: string;
  hireDate: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateEmployee, initialState);
  const [pwState, pwAction, pwPending] = useActionState(resetPassword, initialState);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={id} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" defaultValue={name} required />
          <Field label="Email" name="email" type="email" defaultValue={email} required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Designation" name="designation" defaultValue={designation} />
          <Field label="Phone" name="phone" defaultValue={phone} />
        </div>
        <Field label="Hire date" name="hireDate" type="date" defaultValue={hireDate} />

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="isActive" defaultChecked={isActive} />
          Active
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-green-600">Saved.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="border-t border-zinc-200 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900">Reset Password</h3>
        <form action={pwAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="id" value={id} />
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700">New password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={pwPending}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            {pwPending ? "Updating..." : "Update Password"}
          </button>
        </form>
        {pwState.error && <p className="mt-2 text-sm text-red-600">{pwState.error}</p>}
        {pwState.success && <p className="mt-2 text-sm text-green-600">Password updated.</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
      />
    </div>
  );
}
