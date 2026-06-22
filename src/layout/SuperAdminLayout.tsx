import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import NotificationBell from "../components/NotificationBell";

type SuperAdminLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: "Overview", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "School Verification", path: "/admin/schools", icon: CheckCircle2 },
  { label: "Staff KYC", path: "/admin/kyc", icon: FileCheck2 },
  { label: "Staff", path: "/admin/staff", icon: Users },
  { label: "Applications", path: "/admin/applications", icon: ClipboardList },
  { label: "Replacements", path: "/admin/replacements", icon: RefreshCw },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#dbe4ef] bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-[#dbe4ef] px-5">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#184e77] text-sm font-black text-white">
              E
            </span>
            <span className="text-sm font-black">
              EduStaff<span className="text-[#287271]">Connect</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Platform Ops
          </p>
          <div className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                      isActive
                        ? "bg-[#184e77] text-white shadow-sm"
                        : "text-slate-600 hover:bg-[#f0f7ff] hover:text-[#184e77]"
                    }`
                  }
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[#dbe4ef] p-4">
          <div className="mb-3 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#287271] text-xs font-black text-white">
                {`${user?.firstName?.[0] ?? "S"}${user?.lastName?.[0] ?? "A"}`.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#287271]">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#dbe4ef] bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 lg:px-8">
            <div>
              <p className="text-sm font-black text-[#172033]">EduStaff Platform Admin</p>
              <p className="text-xs text-slate-500">Operational controls for verification, KYC, and platform settings.</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="hidden items-center gap-2 rounded-full bg-[#e0f2fe] px-3 py-1.5 text-xs font-black text-[#184e77] sm:flex">
                <ShieldCheck size={14} />
                SUPER ADMIN
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="grid size-10 place-items-center rounded-xl border border-[#dbe4ef] text-slate-500 transition hover:bg-red-50 hover:text-red-600 lg:hidden"
                aria-label="Log out"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-[#eef2f7] px-5 py-2 lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${
                    isActive ? "bg-[#184e77] text-white" : "bg-white text-slate-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-5 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
