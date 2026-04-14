import { ArrowRight, CalendarDays, CheckCircle2, Clock, Plus, RotateCcw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { useFetchInstitutionJobs } from "../services/queries";

const MODE_LABELS: Record<string, string> = {
  FIXED_DAYS: "Fixed Days",
  FLEXIBLE: "Flexible",
  SEASONAL: "Seasonal",
  MULTI_BRANCH: "Multi-Branch",
};

const MODE_COLORS: Record<string, string> = {
  FIXED_DAYS:   "bg-blue-50 text-blue-700 border-blue-200",
  FLEXIBLE:     "bg-purple-50 text-purple-700 border-purple-200",
  SEASONAL:     "bg-amber-50 text-amber-700 border-amber-200",
  MULTI_BRANCH: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function RotationalSessionsPage() {
  const { auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const jobsQuery = useFetchInstitutionJobs(institutionId);

  const rotationalJobs = (jobsQuery.data ?? []).filter(j => j.employmentType === "ROTATIONAL");

  return (
    <AdminLayout>
      <div className="mx-auto max-w-screen-xl px-6 py-8">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/30">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Rotational Teaching</p>
                <h1 className="text-2xl font-bold text-[#172033]">Session Manager</h1>
              </div>
            </div>
            <p className="mt-2 max-w-lg text-sm text-slate-500">
              All rotational job postings with their teaching sessions and roster assignments in one place.
            </p>
          </div>
          <Link
            to="/school/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
          >
            <Plus size={15} /> Post Rotational Job
          </Link>
        </div>

        {/* ── Summary Strip ────────────────────────────────────────── */}
        {rotationalJobs.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Rotational Jobs", value: rotationalJobs.length, icon: RotateCcw, color: "text-teal-600 bg-teal-50" },
              { label: "Sessions / Week", value: rotationalJobs.reduce((n, j) => n + (j.expectedSessionsPerWeek ?? 0), 0), icon: Clock, color: "text-blue-600 bg-blue-50" },
              { label: "Weekend Required", value: rotationalJobs.filter(j => j.requiresWeekendAvailability).length, icon: CalendarDays, color: "text-amber-600 bg-amber-50" },
              { label: "Multi-Branch", value: rotationalJobs.filter(j => j.requiresMultiBranchTravel).length, icon: Users, color: "text-purple-600 bg-purple-50" },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white p-4">
                  <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${stat.color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#172033]">{stat.value}</p>
                    <p className="text-[11px] text-slate-500">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Job Cards ────────────────────────────────────────────── */}
        {jobsQuery.isLoading ? (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-16 text-center text-sm text-slate-400">
            Loading rotational jobs...
          </div>
        ) : rotationalJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white px-6 py-20 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-teal-50">
              <CalendarDays size={28} className="text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-[#172033]">No rotational jobs yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Create a job posting with employment type set to "Rotational" to start building teaching schedules.
            </p>
            <Link
              to="/school/jobs"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Plus size={16} /> Post a Rotational Job
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rotationalJobs.map(job => {
              const modeLabel = job.rotationMode ? MODE_LABELS[job.rotationMode] : null;
              const modeColor = job.rotationMode ? MODE_COLORS[job.rotationMode] : "bg-slate-100 text-slate-600 border-slate-200";
              return (
                <Link
                  key={job._id}
                  to={`/school/jobs/${job._id}/sessions`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04] transition hover:border-teal-300 hover:shadow-md hover:shadow-teal-500/[0.08]"
                >
                  {/* Top accent bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-teal-600" />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {modeLabel && (
                          <span className={`mb-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${modeColor}`}>
                            <RotateCcw size={9} /> {modeLabel}
                          </span>
                        )}
                        <h3 className="font-semibold leading-snug text-[#172033] group-hover:text-teal-700">{job.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{job.subject ?? "General"} · {job.location}</p>
                      </div>
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl border border-teal-100 bg-teal-50 text-teal-500 transition group-hover:bg-teal-600 group-hover:text-white">
                        <ArrowRight size={14} />
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 border-t border-[#f1f5f9] pt-3">
                      {job.scheduleSummary && (
                        <p className="text-xs text-slate-500 line-clamp-2">{job.scheduleSummary}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {job.expectedSessionsPerWeek != null && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock size={10} className="text-teal-500" />
                            {job.expectedSessionsPerWeek} sessions/wk
                          </span>
                        )}
                        {job.requiresWeekendAvailability && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-600">
                            <CalendarDays size={10} /> Weekend required
                          </span>
                        )}
                        {job.requiresMultiBranchTravel && (
                          <span className="flex items-center gap-1 text-[11px] text-purple-600">
                            <Users size={10} /> Multi-branch
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-[11px] ${job.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                          <CheckCircle2 size={10} /> {job.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#f1f5f9] bg-teal-50/50 px-5 py-3">
                    <p className="text-xs font-semibold text-teal-600 group-hover:text-teal-700">
                      Manage Sessions & Roster →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
