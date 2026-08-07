"use client";

export function AutoSubmitForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      className={className}
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      {children}
    </form>
  );
}
