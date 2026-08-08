"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CalendarDays, UserRound, Menu, X } from "lucide-react";
import { logout } from "@/app/logout/actions";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/employee/tasks", label: "My Tasks", icon: ClipboardList },
  { href: "/employee/weekly-planner", label: "Weekly Planner", icon: CalendarDays },
  { href: "/employee/profile", label: "Profile", icon: UserRound },
] as const;

export function EmployeeSidebar({
  userName,
  userEmail,
  avatarUrl,
}: {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-sm font-semibold text-zinc-900">Employee Portal</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2">
        <ThemeToggle />
        <NotificationBell />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4 text-sm">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${
              pathname.startsWith(item.href)
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-zinc-700 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-200 px-4 py-4">
        <Link href="/employee/profile" className="flex items-center gap-2 hover:opacity-80">
          <Avatar name={userName} url={avatarUrl} size={32} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-700">{userName}</p>
            <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          </div>
        </Link>
        <form action={logout} className="mt-3">
          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-sm font-semibold text-zinc-900">Employee Portal</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-zinc-900/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-zinc-200 bg-white transition-transform md:static md:z-auto md:w-60 md:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        {content}
      </aside>
    </>
  );
}
