import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  ShieldX,
  Star,
  User,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { useUpdateApplicationStatusMutation } from "../services/mutation";
import { useFetchInstitutionApplications } from "../services/queries";
import type { ApplicationStatus, JobApplication } from "../types/TypeChecks";

const statusStyle: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

const statusLabel: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const typeLabel: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const ITEMS_PER_PAGE = 5;

// ── helpers ────────────────────────────────────────────────────────
const normalizeNin = (v?: string) => {
  const u = (v ?? "").toUpperCase();
  if (u === "VERIFIED") return { label: "Verified",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: ShieldCheck };
  if (u === "PENDING")  return { label: "Pending review", cls: "bg-amber-50  text-amber-700  border-amber-200",  Icon: ShieldCheck };
  if (u === "REJECTED") return { label: "Rejected",       cls: "bg-red-50    text-red-600    border-red-200",    Icon: ShieldX     };
  return                       { label: "Not submitted",  cls: "bg-slate-100 text-slate-500  border-slate-200",  Icon: ShieldX     };
};

const levelBadge: Record<string, string> = {
  BEGINNER:     "bg-slate-100 text-slate-600",
  INTERMEDIATE: "bg-amber-50  text-amber-700",
  EXPERT:       "bg-purple-50 text-purple-700",
};

// ── View Modal ─────────────────────────────────────────────────────
const ViewModal = ({
  app,
  onClose,
  onUpdateStatus,
  isUpdating,
}: {
  app: JobApplication | null;
  onClose: () => void;
  onUpdateStatus: (status: ApplicationStatus) => void;
  isUpdating: boolean;
}) => {
  if (!app) return null;
  const nin = normalizeNin(app.ninStatus);
  const NinIcon = nin.Icon;
  const levelKey = (app.teacherLevel ?? "BEGINNER").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <section className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271] px-6 py-6 text-white">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-8 right-20 size-28 rounded-full bg-white/[0.04]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="grid size-16 place-items-center overflow-hidden rounded-2xl bg-white/20 text-2xl font-black ring-2 ring-white/30">
                  {app.teacherAvatar
                    ? <img src={app.teacherAvatar} alt={app.teacherName} className="size-full object-cover" />
                    : app.teacherName.charAt(0)}
                </div>
                {/* Availability dot */}
                <span className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-white ${app.teacherAvailable !== false ? "bg-emerald-400" : "bg-slate-400"}`} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Teacher Application</p>
                <h2 className="mt-0.5 text-xl font-black leading-tight">{app.teacherName}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${levelBadge[levelKey] ?? levelBadge.BEGINNER} bg-white/90`}>
                    {app.teacherLevel}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/70">
                    <MapPin size={10} /> {app.teacherLocation}
                  </span>
                  {app.teacherVerified && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      <CheckCircle2 size={9} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-xl border px-3 py-1 text-xs font-bold ${statusStyle[app.status]}`}>
                {statusLabel[app.status]}
              </span>
              <button onClick={onClose} className="grid size-8 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body: 2-column ─────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* LEFT — Teacher public profile */}
          <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#f1f5f9] bg-[#f8fafc] p-5">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">About</p>
              <p className="text-sm leading-6 text-slate-600">
                {app.teacherBio || "This teacher has not added a bio yet."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact & Details</p>
              {[
                { Icon: Mail,             label: "Email",      value: app.teacherEmail },
                { Icon: MapPin,           label: "Location",   value: app.teacherLocation },
                { Icon: Star,             label: "Level",      value: app.teacherLevel },
                { Icon: Calendar,         label: "Joined",     value: app.teacherJoined ?? "Not set" },
                { Icon: BriefcaseBusiness,label: "Status",     value: app.teacherAvailable !== false ? "Available" : "Not available" },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm shadow-slate-900/[0.03]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e0f2fe] text-[#184e77]">
                    <Icon size={12} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400">{label}</p>
                    <p className="truncate text-xs font-semibold text-[#172033]">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* NIN */}
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">NIN Verification</p>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${nin.cls}`}>
                <NinIcon size={13} />
                {nin.label}
              </div>
            </div>

            {/* Certificate */}
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Certificate</p>
              {app.certificateUrl ? (
                <a
                  href={app.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#184e77] transition hover:bg-[#e0f2fe]"
                >
                  <Award size={13} /> View Certificate <ExternalLink size={11} className="ml-auto" />
                </a>
              ) : (
                <p className="rounded-xl border border-dashed border-[#dbe4ef] px-3 py-2.5 text-xs text-slate-400">
                  No certificate uploaded yet.
                </p>
              )}
            </div>

            {/* Link to full public profile */}
            {app.teacherId && (
              <Link
                to={`/teachers/${app.teacherId}/profile`}
                className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-[#184e77]/20 bg-[#184e77]/5 px-3 py-2.5 text-xs font-semibold text-[#184e77] transition hover:bg-[#184e77]/10"
              >
                <User size={12} /> View Full Public Profile
              </Link>
            )}
          </div>

          {/* RIGHT — Application detail */}
          <div className="flex flex-1 flex-col overflow-y-auto">

            {/* Job match card */}
            <div className="border-b border-[#f1f5f9] p-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Applied For</p>
              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#184e77]/10 text-[#184e77]">
                    <BookOpen size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#172033]">{app.jobTitle}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{app.subject ?? "General"} · {app.jobLocation}</p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full border border-[#184e77]/20 bg-[#184e77]/5 px-2.5 py-0.5 text-[10px] font-bold text-[#184e77]">
                    {typeLabel[app.jobType] ?? app.jobType}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Required Level", value: app.jobLevel },
                    { label: "Job Location",   value: app.jobLocation },
                    { label: "Applied On",     value: app.date },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-[#f8fafc] px-3 py-2.5">
                      <p className="text-[10px] text-slate-400">{label}</p>
                      <p className="mt-0.5 text-xs font-bold text-[#172033]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cover letter */}
            <div className="flex-1 p-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Cover Letter</p>
              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.04]">
                {app.coverLetter ? (
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{app.coverLetter}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <FileText size={24} className="text-slate-300" />
                    <p className="text-sm font-semibold text-slate-400">No cover letter submitted</p>
                    <p className="text-xs text-slate-400">The teacher did not include a cover letter with this application.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Decision bar — sticky at bottom */}
            <div className="sticky bottom-0 border-t border-[#dbe4ef] bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {app.status === "PENDING"
                      ? "Review this application and make a decision."
                      : `Application is currently ${statusLabel[app.status].toLowerCase()}.`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">This will update the teacher's application status immediately.</p>
                </div>
                <div className="flex gap-2">
                  {app.status !== "REJECTED" && (
                    <button
                      onClick={() => onUpdateStatus("REJECTED")}
                      disabled={isUpdating}
                      className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle size={15} />
                      {app.status === "ACCEPTED" ? "Revoke" : "Reject"}
                    </button>
                  )}
                  {app.status !== "ACCEPTED" && (
                    <button
                      onClick={() => onUpdateStatus("ACCEPTED")}
                      disabled={isUpdating}
                      className="flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#184e77]/20 transition hover:bg-[#1a6091] disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      {app.status === "REJECTED" ? "Reconsider" : "Accept"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ApplicationsPage = () => {
  const { auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const applicationsQuery = useFetchInstitutionApplications(institutionId);
  const updateStatus = useUpdateApplicationStatusMutation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [jobFilter, setJobFilter] = useState("ALL");
  const [viewing, setViewing] = useState<JobApplication | null>(null);
  const [page, setPage] = useState(1);
  const apps = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const jobs = useMemo(() => Array.from(new Set(apps.map((app) => app.jobTitle))), [apps]);

  const filtered = apps.filter((app) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      app.teacherName.toLowerCase().includes(q) ||
      app.teacherEmail.toLowerCase().includes(q) ||
      app.jobTitle.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    const matchesJob = jobFilter === "ALL" || app.jobTitle === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const pending = apps.filter((app) => app.status === "PENDING").length;
  const accepted = apps.filter((app) => app.status === "ACCEPTED").length;
  const rejected = apps.filter((app) => app.status === "REJECTED").length;

  const handleUpdateStatus = (status: ApplicationStatus) => {
    if (!viewing) return;
    updateStatus.mutate(
      { id: viewing.id, status },
      {
        onSuccess: (updated) => setViewing(updated),
      },
    );
  };

  return (
    <AdminLayout>
      <ViewModal
        app={viewing}
        onClose={() => setViewing(null)}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updateStatus.isPending}
      />

      <div className="px-6 py-8 xl:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#172033]">Job Applications</h1>
          <p className="mt-1 text-sm text-slate-500">Review teachers who applied to your school roles.</p>
        </div>

        {/* ── Pipeline strip ───────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
          <div className="grid grid-cols-2 divide-x divide-[#f1f5f9] sm:grid-cols-4">
            {[
              { label: "Total",    value: apps.length, sub: "applications",  bar: "bg-[#184e77]", pct: 100 },
              { label: "Pending",  value: pending,     sub: "awaiting review", bar: "bg-amber-400",  pct: apps.length ? Math.round((pending  / apps.length) * 100) : 0 },
              { label: "Accepted", value: accepted,    sub: "approved",      bar: "bg-emerald-500", pct: apps.length ? Math.round((accepted / apps.length) * 100) : 0 },
              { label: "Rejected", value: rejected,    sub: "declined",      bar: "bg-red-400",    pct: apps.length ? Math.round((rejected / apps.length) * 100) : 0 },
            ].map(stat => (
              <div key={stat.label} className="relative p-5">
                <p className="text-2xl font-black text-[#172033]">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{stat.sub}</p>
                {/* Mini bottom progress bar */}
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-100">
                  <div className={`h-full ${stat.bar} transition-all`} style={{ width: `${stat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Overall pipeline bar */}
          {apps.length > 0 && (
            <div className="border-t border-[#f1f5f9] px-5 py-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold">Application pipeline</span>
                <span>{apps.length} total</span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-emerald-500" style={{ width: `${apps.length ? (accepted / apps.length) * 100 : 0}%` }} />
                <div className="h-full bg-amber-400"  style={{ width: `${apps.length ? (pending  / apps.length) * 100 : 0}%` }} />
                <div className="h-full bg-red-400"    style={{ width: `${apps.length ? (rejected / apps.length) * 100 : 0}%` }} />
              </div>
              <div className="mt-1.5 flex gap-4">
                {[{ label: "Accepted", color: "bg-emerald-500", val: accepted }, { label: "Pending", color: "bg-amber-400", val: pending }, { label: "Rejected", color: "bg-red-400", val: rejected }].map(l => (
                  <span key={l.label} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className={`size-2 rounded-full ${l.color}`} /> {l.label} ({l.val})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm">
          <label className="grid min-w-[220px] flex-1 gap-1 text-xs text-slate-400">
            Search
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Teacher, email, or job"
                className="h-10 w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] pl-9 pr-3 text-sm outline-none focus:border-[#184e77]"
              />
            </div>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Status
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ApplicationStatus | "ALL");
                setPage(1);
              }}
              className="h-10 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 text-sm text-slate-600 outline-none focus:border-[#184e77]"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Job
            <select
              value={jobFilter}
              onChange={(e) => {
                setJobFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 text-sm text-slate-600 outline-none focus:border-[#184e77]"
            >
              <option value="ALL">All jobs</option>
              {jobs.map((job) => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_120px] gap-3 border-b border-[#f1f5f9] bg-[#fafcff] px-6 py-3 text-[10px] uppercase tracking-wide text-slate-400">
            <span>Teacher</span>
            <span>Job</span>
            <span>Date</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {applicationsQuery.isLoading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading applications...</div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">No applications yet.</div>
          ) : (
            <div className="divide-y divide-[#f8fafc]">
              {paginated.map((app) => (
                <div key={app.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_120px] items-center gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#172033]">{app.teacherName}</p>
                    <p className="truncate text-xs text-slate-400">{app.teacherEmail}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#172033]">{app.jobTitle}</p>
                    <p className="truncate text-xs text-slate-400">{app.subject ?? "Subject not set"} · {typeLabel[app.jobType]}</p>
                  </div>
                  <p className="text-xs text-slate-400"><Calendar size={12} className="mr-1 inline" />{app.date}</p>
                  <span className={`w-fit rounded-xl border px-3 py-1 text-xs font-semibold ${statusStyle[app.status]}`}>
                    {statusLabel[app.status]}
                  </span>
                  <button
                    onClick={() => setViewing(app)}
                    className="rounded-xl border border-[#dbe4ef] px-4 py-2 text-xs font-semibold text-[#184e77] transition hover:bg-[#e0f2fe]"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#f1f5f9] bg-[#fafcff] px-6 py-3">
            <p className="text-xs text-slate-400">{filtered.length} applications</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 transition hover:bg-[#f0f7ff] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="flex h-8 items-center rounded-lg border border-[#184e77] bg-[#184e77] px-3 text-xs font-bold text-white">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 transition hover:bg-[#f0f7ff] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ApplicationsPage;
