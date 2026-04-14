import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  School,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useFetchInstitutionApplications } from "../services/queries";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  badge?: number;
};

const baseNavItems: NavItem[] = [
  { label: "Dashboard",          icon: LayoutDashboard,   path: "/school/dashboard" },
  { label: "Job Management",     icon: BriefcaseBusiness, path: "/school/jobs" },
  { label: "Rotational Sessions",icon: CalendarDays,      path: "/school/sessions" },
  { label: "Teacher Profiles",   icon: Users,             path: "/school/teachers" },
  { label: "Applications",       icon: ClipboardList,     path: "/school/applications" },
  { label: "Statistics",         icon: BarChart3,         path: "/school/statistics" },
  { label: "Teacher References", icon: BookOpen,          path: "/school/references" },
  { label: "School Management",  icon: School,            path: "/school/profile" },
];

/* ── SIDEBAR ──────────────────────────────────────────────────── */
const Sidebar = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const location = useLocation();
  const { logout, auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const applicationsQuery = useFetchInstitutionApplications(institutionId);
  const pendingApplications = (applicationsQuery.data ?? []).filter((application) => application.status === "PENDING").length;
  const navItems: NavItem[] = baseNavItems.map((item) =>
    item.path === "/school/applications"
      ? { ...item, badge: pendingApplications > 0 ? pendingApplications : undefined }
      : item,
  );
  const institutionType = auth?.institution?.type
    ? `${auth.institution.type.charAt(0)}${auth.institution.type.slice(1).toLowerCase()}`
    : "School";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-[#dbe4ef] bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between gap-3 border-b border-[#dbe4ef] px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[#184e77] text-xs font-black text-white shadow-sm">
              E
            </span>
            <span className="text-sm font-black text-[#172033]">
              EduStaff<span className="text-[#287271]">Connect</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="grid size-7 place-items-center rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Main Menu
          </p>
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
              location.pathname === item.path ||
              (item.path === "/school/sessions" && /^\/school\/jobs\/[^/]+\/sessions/.test(location.pathname));
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      isActive
                        ? "bg-[#184e77] font-bold text-white shadow-sm"
                        : "font-semibold text-slate-600 hover:bg-[#f0f7ff] hover:text-[#184e77]"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={isActive ? "text-white" : "text-slate-400"}
                    />
                    {item.label}
                    {item.badge && (
                      <span
                        className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#184e77] text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 border-t border-[#f1f5f9] pt-4">
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Account
            </p>
            <ul className="flex flex-col gap-0.5">
              <li>
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#172033]">
                  <Settings size={16} className="text-slate-400" />
                  Settings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* School strip */}
        <div className="border-t border-[#dbe4ef] p-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#dbe4ef] bg-gradient-to-br from-[#184e77]/5 to-[#287271]/5 p-3">
            {auth?.institution?.logoUrl ? (
              <img
                src={auth.institution.logoUrl}
                alt={auth.institution.name ?? "School logo"}
                className="size-10 shrink-0 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#184e77] text-sm font-black text-white shadow-sm">
                {(auth?.institution?.name ?? "School").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-[#172033]">
                {auth?.institution?.name ?? "School"}
              </p>
              <p className="flex items-center gap-1 truncate text-[10px] text-slate-400">
                <MapPin size={9} /> {auth?.institution?.location ?? "Location"} · {institutionType}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

/* ── LAYOUT ───────────────────────────────────────────────────── */
interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-[#f6f8fb] text-[#172033]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* TopBar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#dbe4ef] bg-white/95 px-6 shadow-sm shadow-slate-900/[0.03] backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid size-9 place-items-center rounded-xl border border-[#dbe4ef] text-slate-500 transition hover:bg-slate-50 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-slate-400 sm:block">
                {today}
              </span>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" />
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                Platform Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="relative grid size-9 place-items-center rounded-xl border border-[#dbe4ef] text-slate-500 transition hover:bg-[#f0f7ff] hover:border-[#184e77]/30 hover:text-[#184e77]">
              <Bell size={16} />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/school/profile")}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#f0f7ff]"
              title="View your profile"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="size-9 rounded-full object-cover ring-2 ring-[#e0f2fe]"
                />
              ) : (
                <div className="grid size-9 place-items-center rounded-full bg-[#184e77] text-sm font-black text-white ring-2 ring-[#e0f2fe]">
                  {user?.firstName.charAt(0) ?? "A"}
                </div>
              )}
              <div className="hidden flex-col sm:flex">
                <span className="text-xs font-black leading-none text-[#172033]">
                  {user ? `${user.firstName} ${user.lastName}` : "Admin User"}
                </span>
                <span className="mt-0.5 text-[10px] leading-none text-slate-400">
                  {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
