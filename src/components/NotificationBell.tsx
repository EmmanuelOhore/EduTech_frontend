import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useFetchNotifications } from "../services/queries";
import {
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../services/mutation";
import type { AppNotification } from "../services/base";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_DOT: Record<string, string> = {
  APPLICATION_RECEIVED: "bg-blue-500",
  APPLICATION_ACCEPTED: "bg-emerald-500",
  APPLICATION_REJECTED: "bg-red-400",
  ASSIGNMENT_CREATED: "bg-teal-500",
  ASSIGNMENT_REMOVED: "bg-amber-500",
  KYC_STATUS: "bg-blue-500",
  PROFILE_VIEWED: "bg-[#287271]",
  GENERAL: "bg-slate-400",
};

const NotificationBell = ({ align = "right" }: { align?: "left" | "right" }) => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data } = useFetchNotifications(isAuthenticated);
  const markRead = useMarkNotificationReadMutation();
  const markAll = useMarkAllNotificationsReadMutation();

  if (!isAuthenticated) return null;

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const onItemClick = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-4 text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#e5ecf4] bg-white shadow-xl ${align === "left" ? "left-0" : "right-0"}`}>
            <div className="flex items-center justify-between border-b border-[#eef2f7] px-4 py-3">
              <p className="text-sm font-black text-[#172033]">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#184e77] hover:underline"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell size={22} className="text-slate-300" />
                  <p className="text-sm font-semibold text-slate-400">You're all caught up</p>
                  <p className="text-xs text-slate-400">New activity will show up here.</p>
                </div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => onItemClick(n)}
                        className={`flex w-full gap-3 border-b border-[#f1f5f9] px-4 py-3 text-left transition hover:bg-[#f8fafc] ${
                          n.read ? "" : "bg-[#eff6ff]"
                        }`}
                      >
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TYPE_DOT[n.type] ?? TYPE_DOT.GENERAL}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-[#172033]">{n.title}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-slate-500">{n.message}</span>
                          <span className="mt-1 block text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        </span>
                        {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#184e77]" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
