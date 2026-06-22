import {
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useSavedJobs } from "../lib/useSavedJobs";
import NotificationBell from "./NotificationBell";

type TeacherHeaderProps = {
  active: "jobs" | "applications" | "saved" | "dashboard" | "schedule" | "availability" | "ai-docs" | "profile-views" | "kyc";
};

const navItems = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { key: "jobs", label: "Jobs", path: "/jobs", icon: BriefcaseBusiness },
  { key: "applications", label: "Applications", path: "/dashboard/applications", icon: ClipboardList },
  { key: "saved", label: "Saved Jobs", path: "/dashboard/saved-jobs", icon: BookmarkCheck },
  { key: "profile-views", label: "Profile Views", path: "/dashboard/profile-views", icon: Eye },
  { key: "ai-docs", label: "AI Documents", path: "/dashboard/ai-docs", icon: FileText },
  { key: "schedule", label: "Schedule", path: "/dashboard/schedule", icon: CalendarDays },
  { key: "availability", label: "Availability", path: "/dashboard/availability", icon: UserCheck },
  { key: "kyc", label: "Verification", path: "/dashboard/kyc", icon: ShieldCheck },
] as const;

const navClass = (isActive: boolean) =>
  `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
    isActive
      ? "bg-[#184e77] text-white shadow-sm shadow-[#184e77]/20"
      : "text-slate-600 hover:bg-[#eef6fb] hover:text-[#184e77]"
  }`;

const TeacherHeader = ({ active }: TeacherHeaderProps) => {
  const { logout, user } = useAuth();
  const { savedJobsCount } = useSavedJobs();
  const firstInitial = user?.firstName?.trim().charAt(0).toUpperCase() ?? "E";
  const lastInitial = user?.lastName?.trim().charAt(0).toUpperCase() ?? "";
  const initials = `${firstInitial}${lastInitial}`;

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .staff-sidebar ~ main,
          .staff-sidebar ~ section,
          .staff-sidebar ~ div,
          .staff-sidebar ~ footer {
            margin-left: 16rem;
            width: calc(100% - 16rem);
            max-width: calc(100% - 16rem);
          }

          .staff-sidebar ~ .sticky {
            top: 0;
          }
        }
      `}</style>

      <aside className="staff-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#dbe4ef] bg-white lg:flex lg:flex-col">
        <div className="flex min-h-20 items-center gap-3 border-b border-[#edf2f7] px-5">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#184e77] text-sm font-black text-white">
              E
            </span>
            <span className="truncate text-base font-black tracking-tight text-[#172033]">
              EduStaff<span className="text-[#287271]">Connect</span>
            </span>
          </Link>
          <div className="ml-auto">
            <NotificationBell align="left" />
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const count = item.key === "saved" ? savedJobsCount : 0;
            return (
              <Link key={item.key} to={item.path} className={navClass(active === item.key)}>
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                    active === item.key ? "bg-white/20 text-white" : "bg-[#e0f2fe] text-[#184e77]"
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#edf2f7] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#f8fafc] p-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#287271] text-sm font-black text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#172033]">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Staff"}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.role?.replace("_", " ") ?? "Staff"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-black text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-[#dbe4ef] bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#184e77] text-sm font-black text-white">
              E
            </span>
            <span className="text-sm font-black text-[#172033]">EduStaff</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/dashboard/saved-jobs" className="grid size-9 place-items-center rounded-xl bg-[#eef6fb] text-[#184e77]">
              <BookmarkCheck size={16} />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="grid size-9 place-items-center rounded-xl bg-red-50 text-red-600"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
            <button type="button" className="grid size-9 place-items-center rounded-xl bg-[#f8fafc] text-slate-600">
              <Menu size={17} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default TeacherHeader;
