import {
  ArrowRight,
  BookmarkCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useSavedJobs } from "../lib/useSavedJobs";
import { useFetchJobs, useFetchMyApplications } from "../services/queries";

const jobTypeLabel: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const jobTypeCls: Record<string, string> = {
  FULL_TIME: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  PART_TIME: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  ROTATIONAL: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
};

const SavedJobsPage = () => {
  const { isAuthenticated } = useAuth();
  const jobsQuery = useFetchJobs();
  const applicationsQuery = useFetchMyApplications(isAuthenticated);
  const { savedJobs, toggleSavedJob } = useSavedJobs();
  const [search, setSearch] = useState("");

  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const appliedJobIds = useMemo(
    () => new Set(applications.map((app) => app.jobId)),
    [applications],
  );

  const savedJobCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSaved = savedJobs.includes(job._id);
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.institutionName?.toLowerCase().includes(q) ||
        job.subject?.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);
      return matchesSaved && matchesSearch;
    });
  }, [jobs, savedJobs, search]);

  const appliedCount = savedJobCards.filter((job) => appliedJobIds.has(job._id)).length;
  const readyCount = savedJobCards.filter((job) => !appliedJobIds.has(job._id)).length;

  const stats = [
    {
      label: "Saved Jobs",
      value: savedJobs.length,
      icon: BookmarkCheck,
      color: "bg-[#eef6fb] text-[#184e77]",
      accent: "border-[#184e77]/10",
    },
    {
      label: "Applied From Saved",
      value: appliedCount,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      accent: "border-emerald-100",
    },
    {
      label: "Ready to Apply",
      value: readyCount,
      icon: BriefcaseBusiness,
      color: "bg-amber-50 text-amber-600",
      accent: "border-amber-100",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="saved" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#dbe4ef] bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271]">
        <span className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/5 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-12 left-1/4 size-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative w-full px-6 py-10 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#7dd3fc] ring-1 ring-white/20">
                <BookmarkCheck size={11} /> Saved Jobs
              </span>
              <h1 className="mt-3 text-[28px] font-black leading-tight text-white">
                Jobs You Want to<br className="hidden sm:block" /> Come Back To
              </h1>
              <p className="mt-2 max-w-lg text-sm text-white/60">
                Keep interesting roles here, then open the details page or apply when you're ready.
              </p>
            </div>

            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#184e77] shadow transition hover:shadow-md"
            >
              Browse All Jobs <ArrowRight size={14} />
            </Link>
          </div>

          {/* stat pills in hero */}
          <div className="relative mt-7 flex flex-wrap gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15"
              >
                <s.icon size={14} className="text-white/70" />
                <span className="text-xl font-black text-white">{s.value}</span>
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

        {/* search + count row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, school, subject, or location…"
              className="h-11 w-full rounded-xl border border-[#dbe4ef] bg-white pl-10 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="rounded-xl border border-[#dbe4ef] bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
          <p className="ml-auto text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-[#172033]">{savedJobCards.length}</span>
            {" "}of {savedJobs.length} saved
          </p>
        </div>

        {/* ── States ── */}
        {jobsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[#dbe4ef] bg-white p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-2.5 w-32 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-48 animate-pulse rounded-full bg-slate-100" />
                  </div>
                  <div className="size-9 animate-pulse rounded-xl bg-slate-100" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-6 w-20 animate-pulse rounded-lg bg-slate-100" />
                </div>
                <div className="mt-10 h-9 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : savedJobCards.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#dbe4ef] bg-white py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#eef6fb]">
              <BookmarkCheck size={24} className="text-[#184e77]/50" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#172033]">
                {search ? "No matches found" : "No saved jobs yet"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {search
                  ? "Try a different search term."
                  : "Tap the bookmark icon on any role and it will appear here."}
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
          /* ── Cards ── */
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {savedJobCards.map((job) => {
              const isApplied = appliedJobIds.has(job._id);
              return (
                <article
                  key={job._id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04] transition duration-200 hover:-translate-y-0.5 hover:border-[#184e77]/20 hover:shadow-md"
                >
                  {/* applied ribbon */}
                  {isApplied && (
                    <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white">
                      <CheckCircle2 size={10} /> Applied
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    {/* school + title + remove */}
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f0f7ff] text-sm font-bold text-[#184e77] shadow-sm">
                        {job.institutionImage ? (
                          <img src={job.institutionImage} alt={job.institutionName ?? "School"} className="size-full object-cover" />
                        ) : (
                          (job.institutionName ?? "S").charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {job.institutionName ?? "School"}
                        </p>
                        <h2 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-[#172033] transition-colors group-hover:text-[#184e77]">
                          {job.title}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSavedJob(job._id)}
                        title="Remove from saved"
                        className="shrink-0 flex size-8 items-center justify-center rounded-xl border border-[#dbe4ef] text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.subject && (
                        <span className="rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-semibold text-[#184e77]">
                          {job.subject}
                        </span>
                      )}
                      <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${jobTypeCls[job.employmentType] ?? "bg-slate-100 text-slate-600"}`}>
                        {jobTypeLabel[job.employmentType]}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        <MapPin size={9} /> {job.location}
                      </span>
                    </div>

                    {/* description */}
                    <p className="mt-3 line-clamp-3 flex-1 text-xs leading-[1.75] text-slate-500">
                      {job.description ?? "No description provided."}
                    </p>

                    {/* salary + date */}
                    <div className="mt-4 flex items-center justify-between border-t border-[#f1f5f9] pt-3.5">
                      <div>
                        <p className="text-[10px] text-slate-400">Salary</p>
                        <p className="text-xs font-bold text-[#287271]">
                          {job.salaryRange ?? "Not listed"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} /> {job.postedAt}
                      </span>
                    </div>

                    {/* action buttons */}
                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="flex flex-1 items-center justify-center rounded-xl border border-[#dbe4ef] py-2.5 text-xs font-semibold text-[#172033] transition hover:border-[#184e77]/30 hover:bg-[#eef6fb] hover:text-[#184e77]"
                      >
                        View Details
                      </Link>
                      <Link
                        to={isApplied ? "/dashboard/applications" : `/jobs/${job._id}`}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                          isApplied
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-[#184e77] text-white hover:bg-[#1a6091]"
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 size={12} /> Applied
                          </>
                        ) : (
                          <>
                            Open & Apply <Send size={11} />
                          </>
                        )}
                      </Link>
                    </div>
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

export default SavedJobsPage;
