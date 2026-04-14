import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useFetchMyApplications } from "../services/queries";
import type { ApplicationStatus } from "../types/TypeChecks";

/* ─── config ────────────────────────────────────────────────────── */
const statusStyle: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-600 ring-1 ring-red-200",
};

const statusLabel: Record<ApplicationStatus, string> = {
  PENDING: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const statusIcon = {
  PENDING: Clock,
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
};

const jobTypeLabel: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const jobTypeCls: Record<string, string> = {
  FULL_TIME: "bg-emerald-50 text-emerald-700",
  PART_TIME: "bg-violet-50 text-violet-700",
  ROTATIONAL: "bg-amber-50 text-amber-700",
};

/* ─── page ──────────────────────────────────────────────────────── */
const MyApplicationsPage = () => {
  const { isAuthenticated } = useAuth();
  const applicationsQuery = useFetchMyApplications(isAuthenticated);
  const [status, setStatus] = useState<ApplicationStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesStatus = status === "ALL" || app.status === status;
      const matchesSearch =
        !q ||
        app.jobTitle.toLowerCase().includes(q) ||
        app.institutionName?.toLowerCase().includes(q) ||
        app.subject?.toLowerCase().includes(q) ||
        app.jobLocation.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [applications, search, status]);

  const counts = {
    ALL: applications.length,
    PENDING: applications.filter((a) => a.status === "PENDING").length,
    ACCEPTED: applications.filter((a) => a.status === "ACCEPTED").length,
    REJECTED: applications.filter((a) => a.status === "REJECTED").length,
  };

  const filterTabs: { key: ApplicationStatus | "ALL"; label: string; icon: typeof FileText; active: string; pill: string }[] = [
    {
      key: "ALL",
      label: "All",
      icon: FileText,
      active: "border-[#184e77] bg-[#184e77] text-white shadow-sm",
      pill: "bg-white/20 text-white",
    },
    {
      key: "PENDING",
      label: "Pending",
      icon: Clock,
      active: "border-amber-400 bg-amber-500 text-white shadow-sm",
      pill: "bg-white/20 text-white",
    },
    {
      key: "ACCEPTED",
      label: "Accepted",
      icon: CheckCircle2,
      active: "border-emerald-500 bg-emerald-500 text-white shadow-sm",
      pill: "bg-white/20 text-white",
    },
    {
      key: "REJECTED",
      label: "Rejected",
      icon: XCircle,
      active: "border-red-400 bg-red-500 text-white shadow-sm",
      pill: "bg-white/20 text-white",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="applications" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#dbe4ef] bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271]">
        <span className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/5 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-12 left-1/4 size-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative w-full px-6 py-10 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#7dd3fc] ring-1 ring-white/20">
                <FileText size={11} /> My Applications
              </span>
              <h1 className="mt-3 text-[28px] font-black leading-tight text-white">
                Track Your Job Applications
              </h1>
              <p className="mt-2 max-w-lg text-sm text-white/60">
                See every role you applied to and the school's decision in real time.
              </p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#184e77] shadow transition hover:shadow-md"
            >
              Browse Jobs <ArrowRight size={14} />
            </Link>
          </div>

          {/* stats in hero */}
          <div className="relative mt-7 flex flex-wrap gap-3">
            {[
              { label: "Total", value: counts.ALL, color: "text-white" },
              { label: "Pending", value: counts.PENDING, color: "text-amber-300" },
              { label: "Accepted", value: counts.ACCEPTED, color: "text-emerald-300" },
              { label: "Rejected", value: counts.REJECTED, color: "text-red-300" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15"
              >
                <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-xs text-white/60">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* wave */}
        <svg viewBox="0 0 1440 28" fill="none" xmlns="http://www.w3.org/2000/svg"
          className="block w-full" preserveAspectRatio="none" style={{ height: 28 }}>
          <path d="M0 28H1440V10C1200 26 900 2 600 14C300 26 120 4 0 10V28Z" fill="#f6f8fb" />
        </svg>
      </section>

      {/* ── Body ── */}
      <div className="w-full px-6 py-7 lg:px-10">

        {/* filter tabs + search */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* status filter pills */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatus(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? tab.active
                      : "border-[#dbe4ef] bg-white text-slate-500 hover:border-[#184e77]/30 hover:text-[#184e77]"
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? tab.pill : "bg-slate-100 text-slate-500"}`}>
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* search */}
          <div className="relative ml-auto min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applications…"
              className="h-11 w-full rounded-xl border border-[#dbe4ef] bg-white pl-10 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
            />
          </div>
        </div>

        {/* result count */}
        {!applicationsQuery.isLoading && applications.length > 0 && (
          <p className="mb-4 text-xs text-slate-400">
            Showing <span className="font-bold text-[#172033]">{filtered.length}</span> of {applications.length} application{applications.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* ── States ── */}
        {applicationsQuery.isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b border-[#f1f5f9] px-5 py-4 last:border-b-0">
                <div className="size-11 shrink-0 animate-pulse rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-52 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-2.5 w-36 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="h-7 w-24 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#dbe4ef] bg-white py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#eef6fb]">
              <BriefcaseBusiness size={24} className="text-[#184e77]/50" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#172033]">No applications found</h2>
              <p className="mt-1 text-sm text-slate-400">
                {search ? "Try a different search term or clear the filter." : "Apply to a job and it will appear here."}
              </p>
            </div>
            <Link
              to="/jobs"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a6091]"
            >
              Browse Jobs <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
            {/* table header — desktop only */}
            <div className="hidden grid-cols-[1fr_180px_150px_130px_110px_100px] gap-4 border-b border-[#f1f5f9] bg-[#fafcff] px-5 py-3 xl:grid">
              {["Role", "School", "Status", "Location", "Applied", ""].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
              ))}
            </div>

            {/* rows */}
            {filtered.map((app, idx) => {
              const StatusIcon = statusIcon[app.status];
              const isLast = idx === filtered.length - 1;
              return (
                <article
                  key={app.id}
                  className={`group transition hover:bg-[#fafcff] ${isLast ? "" : "border-b border-[#f1f5f9]"}`}
                >
                  <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1fr_180px_150px_130px_110px_100px] xl:items-center">

                    {/* role */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f0f7ff] text-sm font-bold text-[#184e77]">
                        {(app.institutionName ?? "S").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-[#172033] group-hover:text-[#184e77] transition-colors">
                          {app.jobTitle}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {app.subject && (
                            <span className="rounded-md bg-[#e0f2fe] px-2 py-0.5 text-[10px] font-semibold text-[#184e77]">
                              {app.subject}
                            </span>
                          )}
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${jobTypeCls[app.jobType] ?? "bg-slate-100 text-slate-500"}`}>
                            {jobTypeLabel[app.jobType]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* school */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#172033]">
                        {app.institutionName ?? "School"}
                      </p>
                    </div>

                    {/* status badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${statusStyle[app.status]}`}>
                        <StatusIcon size={12} />
                        {statusLabel[app.status]}
                      </span>
                    </div>

                    {/* location */}
                    <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={12} className="shrink-0 text-slate-400" />
                      {app.jobLocation}
                    </p>

                    {/* date */}
                    <p className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                      <Calendar size={12} className="shrink-0" />
                      {app.date}
                    </p>

                    {/* action */}
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-[#dbe4ef] bg-white px-3.5 py-2 text-xs font-bold text-[#184e77] transition hover:border-[#184e77]/30 hover:bg-[#eef6fb]"
                    >
                      View <ExternalLink size={11} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyApplicationsPage;
