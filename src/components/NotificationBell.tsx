"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

const POLL_MS = 30000;
const DROPDOWN_WIDTH = 320;

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const data = await getMyNotifications();
    setItems(data.items);
    setUnreadCount(data.unreadCount);
  }

  useEffect(() => {
    setMounted(true);
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const left = Math.min(rect.right - DROPDOWN_WIDTH, window.innerWidth - DROPDOWN_WIDTH - 8);
      setCoords({ top: rect.bottom + 8, left: Math.max(8, left) });
    }
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="relative rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Portaled to <body> so it isn't clipped by the sidebar's overflow-hidden (which it
          needs for the mobile slide-in animation) — a plain `absolute` dropdown was getting
          cut off / unusable inside that container. */}
      {mounted &&
        open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
            className="z-100 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-black"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead().then(refresh)}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">No notifications yet.</p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "#"}
                    onClick={() => {
                      if (!n.isRead) markNotificationRead(n.id).then(refresh);
                      setOpen(false);
                    }}
                    className={`block border-b border-zinc-100 px-3 py-2 text-sm last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900 ${
                      n.isRead ? "text-zinc-500" : "font-medium text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                      )}
                      <span className="truncate">{n.title}</span>
                    </div>
                    {n.body && <p className="mt-0.5 truncate text-xs text-zinc-400">{n.body}</p>}
                  </Link>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
