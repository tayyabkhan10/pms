import { Logo } from "./Logo";

// Shown by Next's loading.tsx while a route segment's Server Components are still fetching —
// same look everywhere (root/admin/employee) via the shared component.
export function PageLoader() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center pb-16 bg-white dark:bg-black">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-600 dark:border-zinc-800 dark:border-t-brand-500" />
        <Logo size={48} />
      </div>
    </div>
  );
}
