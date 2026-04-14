import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  MapPin,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link as RouterLink } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useSavedJobs } from "../lib/useSavedJobs";
import { useApplyToJobMutation } from "../services/mutation";
import { useFetchJobs, useFetchMyApplications } from "../services/queries";
import type { Job } from "../types/TypeChecks";

const ALL_SUBJECTS = [
  "All Subjects",
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Primary Education",
  "Economics",
  "French",
];

const ALL_LOCATIONS = [
  "All Locations",
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Enugu",
  "Kano",
];

const LEVELS = ["All Levels", "BEGINNER", "INTERMEDIATE", "EXPERT"] as const;

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  INTERMEDIATE: "bg-amber-50 text-amber-700 border border-amber-200",
  EXPERT: "bg-purple-50 text-purple-700 border border-purple-200",
};

const TYPE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-blue-50 text-blue-700 border border-blue-200",
  PART_TIME: "bg-orange-50 text-orange-700 border border-orange-200",
  ROTATIONAL: "bg-teal-50 text-teal-700 border border-teal-200",
};

type ApplyModalProps = {
  job: Job | null;
  coverLetter: string;
  isApplying: boolean;
  onCoverLetterChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const ApplyModal = ({
  job,
  coverLetter,
  isApplying,
  onCoverLetterChange,
  onClose,
  onSubmit,
}: ApplyModalProps) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close application form"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20">
        <div className="bg-[#184e77] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-white/65">Application</p>
              <h2 className="mt-1 text-xl font-black">{job.title}</h2>
              <p className="mt-1 text-sm text-white/70">
                {job.institutionName} · {job.location}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Subject", value: job.subject ?? "Not set" },
              { label: "Type", value: TYPE_LABELS[job.employmentType] },
              { label: "Slots", value: `${job.slots ?? 1} open` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
                <p className="text-[11px] text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-[#172033]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
            <p className="text-sm font-black text-[#172033]">What the school will receive</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Your teacher profile and contact email</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> This cover letter</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Your level, location, verification, and document status</p>
            </div>
          </div>

          <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
            Cover Letter
            <textarea
              rows={6}
              value={coverLetter}
              onChange={(e) => onCoverLetterChange(e.target.value)}
              placeholder="Tell the school why you are a good fit for this role..."
              className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-white px-4 py-3 text-sm font-normal text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#dbe4ef] bg-[#f8fafc] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dbe4ef] bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isApplying}
            className="flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#1a6091] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={15} />
            {isApplying ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </section>
    </div>
  );
};

const JobListings = () => {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [location, setLocation] = useState("All Locations");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All Levels");
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const { toggleSavedJob, isSavedJob } = useSavedJobs();
  const jobsQuery = useFetchJobs();
  const myApplicationsQuery = useFetchMyApplications();
  const applyToJob = useApplyToJobMutation();
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const appliedJobIds = useMemo(
    () => new Set([...(myApplicationsQuery.data ?? []).map((app) => app.jobId), ...appliedJobs]),
    [myApplicationsQuery.data, appliedJobs],
  );

  const hasFilters =
    search.trim() !== "" ||
    subject !== "All Subjects" ||
    location !== "All Locations" ||
    level !== "All Levels";

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.subject?.toLowerCase().includes(term) ||
        job.institutionName?.toLowerCase().includes(term);
      const matchesSubject =
        subject === "All Subjects" || job.subject === subject;
      const matchesLocation =
        location === "All Locations" || job.location === location;
      const matchesLevel = level === "All Levels" || job.level === level;
      return matchesSearch && matchesSubject && matchesLocation && matchesLevel;
    });
  }, [jobs, subject, location, level, search]);

  const openApply = (job: Job) => {
    if (appliedJobIds.has(job._id)) {
      toast("You already applied to this job");
      return;
    }
    setCoverLetter(`Dear ${job.institutionName ?? "Hiring Team"},\n\nI am interested in the ${job.title} role. I believe my teaching experience and subject knowledge make me a strong fit for this position.\n\nThank you for considering my application.`);
    setApplyingJob(job);
  };

  const submitApplication = () => {
    if (!applyingJob) return;
    applyToJob.mutate(
      { jobId: applyingJob._id, coverLetter },
      {
        onSuccess: () => {
          setAppliedJobs((current) => current.includes(applyingJob._id) ? current : [...current, applyingJob._id]);
          setApplyingJob(null);
          setCoverLetter("");
        },
      },
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSubject("All Subjects");
    setLocation("All Locations");
    setLevel("All Levels");
  };

  const featuredJobs = filteredJobs.filter((j) => j.featured);
  const regularJobs = filteredJobs.filter((j) => !j.featured);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <ApplyModal
        job={applyingJob}
        coverLetter={coverLetter}
        isApplying={applyToJob.isPending}
        onCoverLetterChange={setCoverLetter}
        onClose={() => setApplyingJob(null)}
        onSubmit={submitApplication}
      />

      {/* ── NAV ───────────────────────────────────────────────── */}
      <TeacherHeader active="jobs" />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271]">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-[320px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-1/4 top-1/2 size-64 -translate-y-1/2 rounded-full bg-[#287271]/20 blur-3xl" />

        <div className="relative mx-auto w-full max-w-screen-xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#7dd3fc] ring-1 ring-white/20">
              <Sparkles size={13} />
              Teaching Opportunities
            </span>
            <h1 className="text-4xl font-black leading-tight text-white md:text-5xl">
              Explore Teaching{" "}
              <span className="text-[#7dd3fc]">Opportunities</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/70">
              Find your ideal teaching position by browsing available jobs
              filtered by subject and location. Apply directly and take the
              next step in your teaching career.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
                <BriefcaseBusiness size={16} className="text-[#7dd3fc]" />
                <span className="text-sm font-bold text-white">
                  {jobs.length}+ Jobs Available
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
                <MapPin size={16} className="text-[#7dd3fc]" />
                <span className="text-sm font-bold text-white">
                  6 Locations
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
                <GraduationCap size={16} className="text-[#7dd3fc]" />
                <span className="text-sm font-bold text-white">
                  {new Set(jobs.map((job) => job.institutionName).filter(Boolean)).size} Schools Hiring
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ────────────────────────────────────────── */}
      <section className="sticky top-16 z-30 border-b border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
        <div className="mx-auto w-full max-w-screen-xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">

            <div className="relative min-w-[200px] flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job title, school, subject…"
                className="h-11 w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] pl-10 pr-4 text-sm outline-none transition focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 appearance-none rounded-xl border border-[#dbe4ef] bg-[#f8fafc] pl-4 pr-9 text-sm font-medium outline-none transition focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10"
              >
                {ALL_SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 appearance-none rounded-xl border border-[#dbe4ef] bg-[#f8fafc] pl-4 pr-9 text-sm font-medium outline-none transition focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10"
              >
                {ALL_LOCATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}
                className="h-11 appearance-none rounded-xl border border-[#dbe4ef] bg-[#f8fafc] pl-4 pr-9 text-sm font-medium outline-none transition focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10"
              >
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex h-11 items-center gap-2 rounded-xl border border-[#dbe4ef] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <X size={14} />
                Clear
              </button>
            )}

            <span className="ml-auto hidden text-sm font-semibold text-slate-500 md:block">
              <span className="font-black text-[#184e77]">{filteredJobs.length}</span>{" "}
              {filteredJobs.length === 1 ? "role" : "roles"} found
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-screen-xl px-6 py-10">

        {/* Active filter pills */}
        {hasFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <SlidersHorizontal size={14} />
              Filters:
            </span>
            {search && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#184e77]/10 px-3 py-1 text-xs font-bold text-[#184e77]">
                "{search}"
                <button onClick={() => setSearch("")}><X size={11} /></button>
              </span>
            )}
            {subject !== "All Subjects" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#184e77]/10 px-3 py-1 text-xs font-bold text-[#184e77]">
                {subject}
                <button onClick={() => setSubject("All Subjects")}><X size={11} /></button>
              </span>
            )}
            {location !== "All Locations" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#184e77]/10 px-3 py-1 text-xs font-bold text-[#184e77]">
                {location}
                <button onClick={() => setLocation("All Locations")}><X size={11} /></button>
              </span>
            )}
            {level !== "All Levels" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#184e77]/10 px-3 py-1 text-xs font-bold text-[#184e77]">
                {level}
                <button onClick={() => setLevel("All Levels")}><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {/* Featured jobs section */}
        {!hasFilters && featuredJobs.length > 0 && (
          <div className="mb-10">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles size={16} className="text-[#184e77]" />
              <h2 className="text-lg font-black text-[#172033]">Featured Roles</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  isSaved={isSavedJob(job._id)}
                  isApplied={appliedJobIds.has(job._id)}
                  onSave={() => toggleSavedJob(job._id)}
                  onApply={() => openApply(job)}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {/* All / filtered jobs */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#172033]">
              {hasFilters
                ? `${filteredJobs.length} matching ${filteredJobs.length === 1 ? "role" : "roles"}`
                : "All Opportunities"}
            </h2>
            {appliedJobIds.size > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#287271]/10 px-3 py-1 text-xs font-bold text-[#287271]">
                <CheckCircle2 size={12} />
                {appliedJobIds.size} applied
              </span>
            )}
          </div>

          {(hasFilters ? filteredJobs : regularJobs).length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(hasFilters ? filteredJobs : regularJobs).map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  isSaved={isSavedJob(job._id)}
                  isApplied={appliedJobIds.has(job._id)}
                  onSave={() => toggleSavedJob(job._id)}
                  onApply={() => openApply(job)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white py-20 text-center">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#f0f7ff]">
                <Search size={24} className="text-[#184e77]/40" />
              </div>
              <h3 className="text-lg font-black text-[#172033]">
                {jobsQuery.isLoading ? "Loading roles..." : "No matching roles found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your filters or search for a different term.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a6091]"
              >
                <X size={14} />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-[#dbe4ef] bg-white">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[#184e77] text-xs font-black text-white">
              E
            </span>
            <span className="text-sm font-black text-[#172033]">EduStaff Connect</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} EduStaff Connect. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs font-semibold text-slate-500">
            <a href="#" className="transition hover:text-[#184e77]">Privacy</a>
            <a href="#" className="transition hover:text-[#184e77]">Terms</a>
            <a href="#" className="transition hover:text-[#184e77]">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
};

/* ── JOB CARD COMPONENT ───────────────────────────────────────── */
type JobCardProps = {
  job: Job;
  isSaved: boolean;
  isApplied: boolean;
  onSave: () => void;
  onApply: () => void;
  featured?: boolean;
};

const JobCard = ({
  job,
  isSaved,
  isApplied,
  onSave,
  onApply,
  featured = false,
}: JobCardProps) => {
  return (
    <article
      className={`group relative flex flex-col rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/[0.08] ${
        featured
          ? "border-[#184e77]/20 ring-1 ring-[#184e77]/10"
          : "border-[#dbe4ef]"
      } shadow-sm shadow-slate-900/[0.04]`}
    >
      {featured && (
        <div className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full bg-[#184e77] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow">
          <Sparkles size={10} />
          Featured
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Avatar + bookmark */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="size-14 overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f0f7ff] shadow-sm">
            {job.institutionImage ? (
              <img
                src={job.institutionImage}
                alt={job.institutionName}
                className="size-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="grid size-full place-items-center text-lg font-black text-[#184e77]">
                {job.institutionName?.[0] ?? "S"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onSave}
            aria-label={isSaved ? "Unsave job" : "Save job"}
            className={`grid size-9 place-items-center rounded-xl border transition-all ${
              isSaved
                ? "border-[#184e77]/30 bg-[#e0f2fe] text-[#184e77]"
                : "border-[#dbe4ef] bg-white text-slate-400 hover:border-[#184e77]/30 hover:bg-[#e0f2fe] hover:text-[#184e77]"
            }`}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>

        {/* Institution name */}
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {job.institutionName}
        </p>

        {/* Job title */}
        <h3 className="text-base font-black leading-snug text-[#172033] transition-colors group-hover:text-[#184e77]">
          {job.title}
        </h3>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.subject && (
            <span className="rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-bold text-[#184e77]">
              {job.subject}
            </span>
          )}
          <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${LEVEL_COLORS[job.level]}`}>
            {job.level.charAt(0) + job.level.slice(1).toLowerCase()}
          </span>
          <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${TYPE_COLORS[job.employmentType]}`}>
            {TYPE_LABELS[job.employmentType]}
          </span>
        </div>

        {/* Location */}
        <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} className="shrink-0 text-slate-400" />
          {job.location}
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
          {job.description}
        </p>

        {/* Salary + posted */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-4">
          <span className="text-xs font-bold text-[#287271]">{job.salaryRange}</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Clock size={11} />
            {job.postedAt}
          </span>
        </div>

        {/* Applicants + slots */}
        {(job.applicants !== undefined || job.slots !== undefined) && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
            {job.applicants !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Users size={11} />
                {job.applicants} applicants
              </span>
            )}
            {job.slots !== undefined && (
              <span className="inline-flex items-center gap-1">
                <BriefcaseBusiness size={11} />
                {job.slots} slot{job.slots > 1 ? "s" : ""} open
              </span>
            )}
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-2 border-t border-[#f1f5f9] p-4">
        <RouterLink
          to={`/jobs/${job._id}`}
          className="flex flex-1 items-center justify-center rounded-xl border border-[#dbe4ef] bg-white py-2.5 text-xs font-bold text-[#184e77] transition hover:border-[#184e77]/40 hover:bg-[#e0f2fe]"
        >
          View Details
        </RouterLink>
        <RouterLink
          to={`/jobs/${job._id}`}
          onClick={(e) => { e.preventDefault(); onApply(); }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black transition ${
            isApplied
              ? "cursor-default bg-[#287271] text-white"
              : "bg-[#184e77] text-white hover:bg-[#1a6091]"
          }`}
        >
          {isApplied ? (
            <>
              <CheckCircle2 size={13} />
              Applied
            </>
          ) : (
            "View & Apply"
          )}
        </RouterLink>
      </div>
    </article>
  );
};

export default JobListings;
