import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  MapPin,
  Navigation,
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
import ProximityJobGroups from "../components/ProximityJobGroups";
import JobsHero from "../components/JobsHero";
import { useSavedJobs } from "../lib/useSavedJobs";
import { useGeolocation } from "../lib/useGeolocation";
import { useApplyToJobMutation, useSetMyGeoMutation } from "../services/mutation";
import {
  useFetchJobs,
  useFetchMyApplications,
  useFetchMyTeacherProfile,
  useFetchNearbyJobs,
} from "../services/queries";
import type { Job } from "../types/TypeChecks";

const DISTANCE_OPTIONS = [
  { label: "Any distance", value: 0 },
  { label: "Within 5 km", value: 5 },
  { label: "Within 15 km", value: 15 },
  { label: "Within 30 km", value: 30 },
  { label: "Within 50 km", value: 50 },
] as const;

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
  EXPERT: "bg-blue-50 text-blue-700 border border-blue-200",
};

const TYPE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-blue-50 text-blue-700 border border-blue-200",
  PART_TIME: "bg-orange-50 text-orange-700 border border-orange-200",
  ROTATIONAL: "bg-teal-50 text-teal-700 border border-teal-200",
};

type ApplyModalProps = {
  job: Job | null;
  coverLetter: string;
  screeningAnswers: Record<string, string>;
  isApplying: boolean;
  onCoverLetterChange: (value: string) => void;
  onScreeningAnswerChange: (question: string, answer: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const ApplyModal = ({
  job,
  coverLetter,
  screeningAnswers,
  isApplying,
  onCoverLetterChange,
  onScreeningAnswerChange,
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
      <section className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20">
        <div className="shrink-0 bg-[#184e77] px-6 py-5 text-white">
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

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-6">
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

          {(job.screeningQuestions?.length ?? 0) > 0 && (
            <div className="grid gap-3">
              <p className="text-sm font-black text-[#172033]">School Checklist</p>
              {job.screeningQuestions?.map((item) => (
                <label key={item.question} className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                  {item.question}
                  <input
                    type={item.type === "NUMBER" ? "number" : "text"}
                    value={screeningAnswers[item.question] ?? ""}
                    onChange={(e) => onScreeningAnswerChange(item.question, e.target.value)}
                    placeholder="Your answer"
                    className="h-10 rounded-xl border border-[#dbe4ef] bg-white px-4 text-sm font-normal text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-[#dbe4ef] bg-[#f8fafc] px-6 py-4">
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
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const { toggleSavedJob, isSavedJob } = useSavedJobs();
  const jobsQuery = useFetchJobs();
  const myApplicationsQuery = useFetchMyApplications();
  const applyToJob = useApplyToJobMutation();

  // ── Proximity / "near me" mode ──────────────────────────────────
  const [nearMode, setNearMode] = useState(false);
  const [maxKm, setMaxKm] = useState<number>(0);
  const [gpsPoint, setGpsPoint] = useState<{ lat: number; lng: number } | null>(null);
  const profileQuery = useFetchMyTeacherProfile();
  const profile = profileQuery.data;
  const geo = useGeolocation();
  const setMyGeo = useSetMyGeoMutation();

  const profilePoint =
    profile?.lat != null && profile?.lng != null
      ? { lat: profile.lat, lng: profile.lng }
      : null;
  const activePoint = gpsPoint ?? profilePoint;
  const usingGps = !!gpsPoint || profile?.geoSource === "GPS";
  const nearbyQuery = useFetchNearbyJobs(nearMode ? activePoint : null, {
    maxKm: maxKm || undefined,
  });
  const nearbyJobs = useMemo(() => nearbyQuery.data ?? [], [nearbyQuery.data]);

  const captureExactLocation = async () => {
    const c = await geo.request();
    if (c) {
      setGpsPoint({ lat: c.lat, lng: c.lng });
      setMyGeo.mutate({ lat: c.lat, lng: c.lng, accuracyM: c.accuracyM });
    } else if (geo.status === "denied") {
      toast("Location permission denied — using your saved area instead");
    }
  };

  const enableNearMode = async () => {
    setNearMode(true);
    if (!activePoint) await captureExactLocation();
  };

  const locationLabel = usingGps
    ? "your current location"
    : profile?.location && profile.location !== "Not set"
      ? profile.location
      : "your saved area";
  const accuracyNote = usingGps
    ? "Live GPS"
    : profilePoint
      ? "Approx. from your area"
      : undefined;
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
        location === "All Locations" || job.location === location || job.lga === location;
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
    setScreeningAnswers({});
    setApplyingJob(job);
  };

  const submitApplication = () => {
    if (!applyingJob) return;
    const missingQuestion = applyingJob.screeningQuestions?.find(
      (item) => item.required && !screeningAnswers[item.question]?.trim(),
    );
    if (missingQuestion) {
      toast(`Answer required: ${missingQuestion.question}`);
      return;
    }
    applyToJob.mutate(
      {
        jobId: applyingJob._id,
        coverLetter,
        screeningAnswers: (applyingJob.screeningQuestions ?? []).map((item) => ({
          question: item.question,
          answer: screeningAnswers[item.question] ?? "",
        })),
      },
      {
        onSuccess: () => {
          setAppliedJobs((current) => current.includes(applyingJob._id) ? current : [...current, applyingJob._id]);
          setApplyingJob(null);
          setCoverLetter("");
          setScreeningAnswers({});
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
    <main className="flex min-h-screen flex-col bg-[#f6f8fb] text-[#172033]">
      <ApplyModal
        job={applyingJob}
        coverLetter={coverLetter}
        screeningAnswers={screeningAnswers}
        isApplying={applyToJob.isPending}
        onCoverLetterChange={setCoverLetter}
        onScreeningAnswerChange={(question, answer) => setScreeningAnswers((current) => ({ ...current, [question]: answer }))}
        onClose={() => setApplyingJob(null)}
        onSubmit={submitApplication}
      />

      {/* ── NAV ───────────────────────────────────────────────── */}
      <TeacherHeader active="jobs" />

      {/* ── HERO (dismissible image carousel) ─────────────────── */}
      <JobsHero
        jobsCount={jobs.length}
        locationsCount={6}
        schoolsCount={
          new Set(jobs.map((job) => job.institutionName).filter(Boolean)).size
        }
      />

      {/* ── FILTER BAR ────────────────────────────────────────── */}
      <section className="sticky top-16 z-30 border-b border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
        <div className="mx-auto w-full max-w-screen-xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-2.5">

            {/* Search */}
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job title, school, subject…"
                className="h-10 w-full rounded-xl border border-[#e4ebf3] bg-[#f8fafc] pl-10 pr-9 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 hover:border-[#cdd9e5] focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Divider */}
            <span className="hidden h-6 w-px bg-[#e4ebf3] lg:block" aria-hidden />

            {/* Filters */}
            {[
              { value: subject, set: (v: string) => setSubject(v), opts: ALL_SUBJECTS },
              { value: location, set: (v: string) => setLocation(v), opts: ALL_LOCATIONS },
              { value: level, set: (v: string) => setLevel(v as (typeof LEVELS)[number]), opts: LEVELS as readonly string[] },
            ].map((f, i) => (
              <div key={i} className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="h-10 cursor-pointer appearance-none rounded-xl border border-[#e4ebf3] bg-white pl-3.5 pr-9 text-sm font-medium text-[#172033] outline-none transition hover:border-[#cdd9e5] focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                >
                  {f.opts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            ))}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <X size={14} />
                Clear
              </button>
            )}

            {/* Near-me toggle */}
            <button
              onClick={() => (nearMode ? setNearMode(false) : enableNearMode())}
              className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                nearMode
                  ? "bg-[#184e77] text-white shadow-sm shadow-[#184e77]/25"
                  : "border border-[#e4ebf3] bg-white text-[#184e77] hover:border-[#184e77]/40 hover:bg-[#eef5fb]"
              }`}
            >
              <Navigation size={14} />
              {nearMode ? "Nearby on" : "Jobs near me"}
            </button>

            {nearMode && (
              <div className="relative">
                <select
                  value={maxKm}
                  onChange={(e) => setMaxKm(Number(e.target.value))}
                  className="h-10 cursor-pointer appearance-none rounded-xl border border-[#e4ebf3] bg-white pl-3.5 pr-9 text-sm font-medium text-[#172033] outline-none transition hover:border-[#cdd9e5] focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                >
                  {DISTANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}

            {/* Result count */}
            <span className="ml-auto hidden items-center gap-1 rounded-full bg-[#eef5fb] px-3 py-1.5 text-xs font-semibold text-[#184e77] md:inline-flex">
              {nearMode ? nearbyJobs.length : filteredJobs.length}{" "}
              {(nearMode ? nearbyJobs.length : filteredJobs.length) === 1 ? "role" : "roles"}
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-screen-xl flex-1 px-6 py-10">

        {/* Proximity (near-me) view */}
        {nearMode && (
          <div className="mb-2">
            <div className="mb-5 flex items-center gap-2">
              <Navigation size={16} className="text-[#184e77]" />
              <h2 className="text-lg font-black text-[#172033]">Jobs grouped by distance</h2>
            </div>
            {!activePoint ? (
              <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white py-16 text-center">
                <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#f0f7ff]">
                  <Navigation size={22} className="text-[#184e77]/40" />
                </div>
                <h3 className="text-base font-black text-[#172033]">
                  {geo.status === "locating"
                    ? "Finding your location…"
                    : "Share your location to see nearby roles"}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  We'll group open roles by how far they are from you. You can also
                  set your area in your profile.
                </p>
                <button
                  onClick={captureExactLocation}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a6091]"
                >
                  <Navigation size={14} />
                  Use my location
                </button>
              </div>
            ) : nearbyQuery.isLoading ? (
              <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white py-16 text-center text-sm font-semibold text-slate-500">
                Finding roles near you…
              </div>
            ) : (
              <ProximityJobGroups
                jobs={nearbyJobs}
                locationLabel={locationLabel}
                accuracyNote={accuracyNote}
                appliedJobIds={appliedJobIds}
                isSavedJob={isSavedJob}
                onToggleSave={toggleSavedJob}
                onApply={openApply}
                onRefineLocation={usingGps ? undefined : captureExactLocation}
              />
            )}
          </div>
        )}

        {/* Active filter pills */}
        {!nearMode && hasFilters && (
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
        {!nearMode && !hasFilters && featuredJobs.length > 0 && (
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
        {!nearMode && (
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
        )}
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
