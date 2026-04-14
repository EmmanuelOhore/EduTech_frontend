import {
  ArrowLeft,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Star,
  Users,
  RotateCcw,
  GitBranch,
  CalendarRange,
  Repeat2,
  Globe,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { useFetchJobApplications, useFetchJob, useFetchRotationalJobMeta } from "../services/queries";

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  EXPERT: "Expert",
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const defaultRequirements = [
  "Relevant B.Sc. or B.Ed. degree in the subject area",
  "Minimum 2 years of teaching experience",
  "Strong classroom management and communication skills",
  "Knowledge of WAEC, NECO, or school-specific curriculum",
  "Passion for student growth and academic excellence",
];

const defaultResponsibilities = [
  "Plan and deliver structured lessons",
  "Assess student progress and provide feedback",
  "Maintain attendance and academic records",
  "Work with school leadership and colleagues",
  "Support student development and exam preparation",
];

const SchoolJobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const jobQuery = useFetchJob(id);
  const applicationsQuery = useFetchJobApplications(id);
  const rotationalMetaQuery = useFetchRotationalJobMeta(id);
  const job = jobQuery.data;
  const meta = rotationalMetaQuery.data;

  if (jobQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="grid min-h-[60vh] place-items-center">
          <p className="text-sm font-black text-slate-500">Loading job...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!job) {
    return (
      <AdminLayout>
        <div className="grid min-h-[60vh] place-items-center text-center">
          <div>
            <h1 className="text-2xl font-black text-[#172033]">Job not found</h1>
            <Link to="/school/jobs" className="mt-4 inline-flex rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-black text-white">
              Back to job management
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const requirements = job.requirements?.length ? job.requirements : defaultRequirements;
  const responsibilities = job.responsibilities?.length ? job.responsibilities : defaultResponsibilities;
  const applicants = applicationsQuery.data ?? [];

  return (
    <AdminLayout>
      <div className="px-6 py-8 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/school/jobs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#184e77]"
            >
              <ArrowLeft size={14} />
              Back to job management
            </Link>
            <h1 className="mt-3 text-3xl font-black text-[#172033]">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              School-side view for reviewing the posting and managing applicants.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/school/applications"
              className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-white px-4 py-2.5 text-sm font-bold text-[#184e77] transition hover:bg-[#e0f2fe]"
            >
              Review Applications
              <ChevronRight size={14} />
            </Link>
            <Link
              to="/school/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1a6091]"
            >
              Manage Listing
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
          <div className="bg-[#184e77] px-6 py-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  {job.subject && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-[#7dd3fc] ring-1 ring-white/20">
                      <GraduationCap size={11} />
                      {job.subject}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#287271]/60 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">
                    <BriefcaseBusiness size={11} />
                    School View
                  </span>
                </div>
                <h2 className="text-2xl font-black md:text-4xl">{job.title}</h2>
                <p className="mt-2 flex items-center gap-1 text-sm text-white/70">
                  <MapPin size={12} />
                  {job.location}
                </p>
              </div>

              <div className="grid gap-2 text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/15">
                  <Clock size={12} />
                  Posted {job.postedAt}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                  <Users size={11} />
                  {applicants.length} applicant{applicants.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 xl:grid-cols-[1fr_340px]">
            <div className="flex flex-col gap-6">
              {job.employmentType === "ROTATIONAL" && (
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <RotateCcw size={16} className="text-teal-600" />
                    <h3 className="font-semibold text-teal-800">Rotational Role Details</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {job.scheduleSummary && (
                      <div className="flex items-start gap-2 text-sm text-teal-700">
                        <CalendarRange size={14} className="mt-0.5 shrink-0" />
                        <span>{job.scheduleSummary}</span>
                      </div>
                    )}
                    {job.expectedSessionsPerWeek && (
                      <div className="flex items-center gap-2 text-sm text-teal-700">
                        <Repeat2 size={14} />
                        <span>{job.expectedSessionsPerWeek} session{job.expectedSessionsPerWeek > 1 ? "s" : ""}/week</span>
                      </div>
                    )}
                    {job.requiresWeekendAvailability && (
                      <div className="flex items-center gap-2 text-sm text-teal-700">
                        <CalendarRange size={14} />
                        <span>Weekend availability required</span>
                      </div>
                    )}
                    {job.requiresMultiBranchTravel && (
                      <div className="flex items-center gap-2 text-sm text-teal-700">
                        <Globe size={14} />
                        <span>Multi-branch travel required</span>
                      </div>
                    )}
                    {meta?.branches && meta.branches.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-teal-700">
                        <GitBranch size={14} />
                        <span>Branches: {meta.branches.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-teal-200">
                    <Link to={`/school/jobs/${job._id}/sessions`} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                      <CalendarRange size={14} /> Manage Sessions & Roster
                    </Link>
                  </div>
                </div>
              )}
              <section className="rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-6">
                <h3 className="mb-4 text-xl font-black text-[#172033]">Job Description</h3>
                <p className="leading-7 text-slate-600">
                  {job.description || "No description provided for this position."}
                </p>
              </section>

              <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6">
                <h3 className="mb-4 text-xl font-black text-[#172033]">Requirements</h3>
                <ul className="flex flex-col gap-3">
                  {requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#184e77]">
                        <CheckCircle2 size={11} className="text-white" strokeWidth={2.5} />
                      </span>
                      <span className="text-sm leading-6 text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6">
                <h3 className="mb-4 text-xl font-black text-[#172033]">Responsibilities</h3>
                <ul className="flex flex-col gap-3">
                  {responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#184e77]" />
                      <span className="text-sm leading-6 text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="flex flex-col gap-5">
              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5">
                <h3 className="mb-4 text-sm font-black text-[#172033]">Quick Info</h3>
                <div className="flex flex-col gap-4">
                  {[
                    { icon: MapPin, label: "Location", value: job.location },
                    { icon: BriefcaseBusiness, label: "Employment Type", value: TYPE_LABELS[job.employmentType] },
                    { icon: GraduationCap, label: "Level", value: LEVEL_LABELS[job.level] },
                    { icon: Calendar, label: "Open Slots", value: String(job.slots ?? 1) },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f0f7ff] text-[#184e77]">
                          <Icon size={14} />
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                          <p className="text-sm font-bold text-[#172033]">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                  {job.salaryRange && (
                    <div className="flex items-start gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-600">
                        <Star size={14} />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Salary Range</p>
                        <p className="text-sm font-bold text-[#287271]">{job.salaryRange}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5">
                <h3 className="mb-4 text-sm font-black text-[#172033]">Applicants</h3>
                <div className="flex flex-col gap-3">
                  {applicants.slice(0, 5).map((app) => (
                    <div key={app.id} className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#172033]">{app.teacherName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{app.teacherLevel} • {app.teacherLocation}</p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {app.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-400">{app.date}</p>
                        <Link
                          to="/school/applications"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#184e77] hover:underline"
                        >
                          View all <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                  ))}
                  {applicants.length === 0 && (
                    <p className="text-sm text-slate-500">No applicants have been recorded for this job yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5">
                <h3 className="mb-3 text-sm font-black text-[#172033]">School Links</h3>
                <div className="flex flex-col gap-2">
                  <Link to="/school/jobs" className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ef] px-4 py-2.5 text-sm font-semibold text-[#184e77] transition hover:bg-[#e0f2fe]">
                    Job Management
                    <ChevronRight size={14} />
                  </Link>
                  <Link to="/school/applications" className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ef] px-4 py-2.5 text-sm font-semibold text-[#184e77] transition hover:bg-[#e0f2fe]">
                    All Applications
                    <ChevronRight size={14} />
                  </Link>
                  <a href={`mailto:info@school.edu.ng`} className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ef] px-4 py-2.5 text-sm font-semibold text-[#184e77] transition hover:bg-[#e0f2fe]">
                    <Mail size={14} />
                    Contact Support
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-[#dbe4ef] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-[#172033]">School profile links</h3>
              <p className="mt-1 text-sm text-slate-500">Use the management pages to edit, review, and track this role.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/school/jobs" className="rounded-xl bg-[#184e77] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1a6091]">
                Back to Jobs
              </Link>
              <Link to="/school/applications" className="rounded-xl border border-[#dbe4ef] px-4 py-2.5 text-sm font-bold text-[#184e77] transition hover:bg-[#e0f2fe]">
                View Applications
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SchoolJobDetail;
