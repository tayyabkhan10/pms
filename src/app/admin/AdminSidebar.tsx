"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  MessageSquareText,
  CalendarDays,
  BarChart3,
  Users,
  Building2,
  Settings,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/app/logout/actions";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tasks", label: "Daily Task Board", icon: ClipboardList },
  { href: "/admin/approvals", label: "Approvals", icon: CheckSquare, badgeKey: "approvals" },
  { href: "/admin/client-updates", label: "Client Update Register", icon: MessageSquareText },
  { href: "/admin/weekly-planner", label: "Weekly Planner", icon: CalendarDays },
  { href: "/admin/workload", label: "Employee Workload", icon: BarChart3 },
] as const;

const NAV2 = [
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/clients", label: "Client Master", icon: Building2 },
  { href: "/admin/recycle-bin", label: "Recycle Bin", icon: Trash2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar({
  userName,
  userEmail,
  avatarUrl,
  pendingApprovals,
}: {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  pendingApprovals: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-sm font-semibold text-zinc-900">Admin Portal</span>
        </div>
        <button
          type="button"
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
          <NavLink
            key={item.href}
            href={item.href}
            active={pathname.startsWith(item.href)}
            icon={item.icon}
            badge={item.href === "/admin/approvals" ? pendingApprovals || undefined : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="my-2 border-t border-zinc-200" />
        {NAV2.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            active={pathname.startsWith(item.href)}
            icon={item.icon}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-zinc-200 px-4 py-4">
        <Link href="/admin/profile" className="flex items-center gap-2 hover:opacity-80">
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
          <span className="text-sm font-semibold text-zinc-900">Admin Portal</span>
        </div>
        <button
          type="button"
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

      {/* Desktop pe fixed sidebar jitni jagah reserve karta hai, taake content overlap na ho */}
      <div className="hidden md:block md:w-60 md:shrink-0" aria-hidden="true" />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 md:w-60 -translate-x-full flex-col overflow-hidden border-r border-zinc-200 bg-white transition-transform md:z-auto md:translate-x-0 ${open ? "translate-x-0" : ""
          }`}
      >
        {content}
      </aside>
    </>
  );
}

function NavLink({
  href,
  children,
  icon: Icon,
  badge,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between rounded-md px-3 py-2 transition ${active
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-zinc-700 hover:bg-brand-50 hover:text-brand-700"
        }`}
    >
      <span className="flex items-center gap-2">
        <Icon size={16} />
        {children}
      </span>
      {badge !== undefined && (
        <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-medium text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}