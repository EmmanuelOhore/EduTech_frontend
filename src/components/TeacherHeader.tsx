import { BookmarkCheck, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useSavedJobs } from "../lib/useSavedJobs";

type TeacherHeaderProps = {
  active: "jobs" | "applications" | "saved" | "dashboard" | "schedule" | "availability";
};

const linkClass = (isActive: boolean) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-white/15 text-white ring-1 ring-white/20"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

const TeacherHeader = ({ active }: TeacherHeaderProps) => {
  const { logout, user } = useAuth();
  const { savedJobsCount } = useSavedJobs();
  const profileInitial = (user?.firstName ?? "E").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-[#184e77]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-screen-xl items-center justify-between gap-6 px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-sm font-semibold text-white ring-1 ring-white/20">
            E
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            EduStaff<span className="text-[#7dd3fc]">Connect</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/jobs" className={linkClass(active === "jobs")}>Job Listings</Link>
          <Link to="/dashboard/applications" className={linkClass(active === "applications")}>My Applications</Link>
          <Link to="/dashboard/saved-jobs" className={linkClass(active === "saved")}>Saved Jobs</Link>
          <Link to="/dashboard" className={linkClass(active === "dashboard")}>Dashboard</Link>
          <Link to="/dashboard/schedule" className={linkClass(active === "schedule")}>My Schedule</Link>
          <Link to="/dashboard/availability" className={linkClass(active === "availability")}>Availability</Link>
        </nav>

        <div className="flex items-center gap-3">
          {savedJobsCount > 0 && (
            <Link
              to="/dashboard/saved-jobs"
              className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20 md:inline-flex"
            >
              <BookmarkCheck size={12} />
              {savedJobsCount} saved
            </Link>
          )}
          <div className="grid size-9 place-items-center rounded-full bg-[#287271] text-sm font-semibold text-white ring-2 ring-white/20">
            {profileInitial}
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20"
            aria-label="Log out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TeacherHeader;
