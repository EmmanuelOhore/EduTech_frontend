import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Eye,
  GraduationCap,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { useFetchInstitutionApplications } from "../services/queries";
import type { JobApplication } from "../types/TypeChecks";

const SUBJECTS = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Economics", "Computer Science", "History", "French"];
const LOCATIONS = ["All Locations", "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu"];
const NIN_STATUSES = ["All NIN", "Verified", "Pending", "Rejected", "Not submitted"];

type NinStatus = "Verified" | "Pending" | "Rejected" | "Not submitted";
type TeacherLevel = "Beginner" | "Intermediate" | "Expert";

type AcceptedTeacher = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: TeacherLevel;
  subject: string;
  location: string;
  nin: NinStatus;
  records: number;
  bio: string;
  joined: string;
  available: boolean;
  verified: boolean;
  certificateUrl?: string;
  latestJobTitle: string;
  latestJobId: string;
  latestJobDate: string;
  acceptedJobs: { id: string; jobId: string; title: string; subject?: string; location: string; date: string }[];
};

const ninStyle: Record<NinStatus, { bg: string; icon: typeof CheckCircle2; label: string }> = {
  Verified: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Verified" },
  Pending: { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: ShieldCheck, label: "Pending" },
  Rejected: { bg: "bg-red-50 text-red-600 border-red-200", icon: XCircle, label: "Rejected" },
  "Not submitted": { bg: "bg-slate-100 text-slate-500 border-slate-200", icon: ClipboardList, label: "Not submitted" },
};

const levelStyle: Record<TeacherLevel, string> = {
  Beginner: "bg-slate-100 text-slate-600",
  Intermediate: "bg-amber-50 text-amber-700",
  Expert: "bg-purple-50 text-purple-700",
};

const ITEMS_PER_PAGE = 7;

const toLevel = (value?: string): TeacherLevel => {
  if (value === "BEGINNER" || value === "INTERMEDIATE" || value === "EXPERT") return value[0] + value.slice(1).toLowerCase() as TeacherLevel;
  return "Beginner";
};

const toNin = (value?: string, ninDocumentUrl?: string): NinStatus => {
  // Backend stores uppercase: "PENDING" | "VERIFIED" | "REJECTED"
  // ninStatus may default to "PENDING" even before a document is uploaded,
  // so we use ninDocumentUrl as the reliable indicator that a document was actually submitted.
  const v = (value ?? "").toUpperCase();
  if (v === "VERIFIED") return "Verified";
  if (v === "REJECTED") return "Rejected";
  if (v === "PENDING")  return ninDocumentUrl ? "Pending" : "Not submitted";
  return "Not submitted";
};

const TeacherProfileModal = ({
  teacher,
  onClose,
}: {
  teacher: AcceptedTeacher | null;
  onClose: () => void;
}) => {
  if (!teacher) return null;
  const ninConfig = ninStyle[teacher.nin];
  const NinIcon = ninConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close teacher profile"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-2xl">
        <div className="bg-[#184e77] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/15 text-lg font-black">
                {teacher.avatar ? (
                  <img src={teacher.avatar} alt={teacher.name} className="size-full object-cover" />
                ) : (
                  teacher.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/65">Accepted Teacher Profile</p>
                <h2 className="mt-1 truncate text-xl font-black">{teacher.name}</h2>
                <p className="mt-1 truncate text-sm text-white/70">{teacher.latestJobTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
            <div className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">Roster Summary</p>
                  <p className="mt-1 text-sm font-semibold text-[#172033]">
                    {teacher.available === false ? "Not currently available" : "Available for active school work"}
                  </p>
                </div>
                <span className={`rounded-xl border px-3 py-1 text-xs font-semibold ${
                  teacher.verified
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}>
                  {teacher.verified ? "Verified user" : "Verification pending"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {teacher.bio || "This teacher has not added a bio yet."}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  to={`/school/jobs/${teacher.latestJobId}`}
                  className="rounded-xl bg-white p-3 transition hover:border hover:border-[#184e77]/20 hover:bg-[#f0f7ff]"
                >
                  <p className="text-[11px] text-slate-400">Latest Role</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#172033]">
                    {teacher.latestJobTitle}
                  </p>
                </Link>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] text-slate-400">Accepted Roles</p>
                  <p className="mt-1 text-sm font-semibold text-[#172033]">
                    {teacher.records} job{teacher.records === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] text-slate-400">Joined</p>
                  <p className="mt-1 text-sm font-semibold text-[#172033]">{teacher.joined}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] text-slate-400">Availability</p>
                  <p className="mt-1 text-sm font-semibold text-[#172033]">
                    {teacher.available === false ? "Not available" : "Available"}
                  </p>
                </div>
              </div>
              {teacher.certificateUrl ? (
                <a
                  href={teacher.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-white px-4 py-2 text-sm font-semibold text-[#184e77] transition hover:bg-[#e0f2fe]"
                >
                  View Certificate <ExternalLink size={14} />
                </a>
              ) : (
                <p className="mt-4 text-xs text-slate-400">No certificate has been uploaded yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-[#dbe4ef] bg-white p-4">
              <p className="text-xs text-slate-400">Accepted Assignments</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {teacher.acceptedJobs.map((item) => (
                  <Link
                    key={item.id}
                    to={`/school/jobs/${item.jobId}`}
                    className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3 text-left transition hover:border-[#184e77]/25 hover:bg-[#f0f7ff]"
                    title="Open job details"
                  >
                    <p className="text-[11px] text-slate-400">Job</p>
                    <p className="truncate text-sm font-semibold text-[#172033]">{item.title}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {item.subject ?? "General"} • {item.location}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.date}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Mail, label: "Email", value: teacher.email },
              { icon: Star, label: "Teacher Level", value: teacher.level },
              { icon: MapPin, label: "Teacher Location", value: teacher.location },
              { icon: BookOpen, label: "Primary Subject", value: teacher.subject },
              { icon: GraduationCap, label: "Joined", value: teacher.joined },
              { icon: CheckCircle2, label: "Accepted Jobs", value: String(teacher.records) },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[#f8fafc] p-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#e0f2fe] text-[#184e77]">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">{item.label}</p>
                    <p className="truncate text-sm font-semibold text-[#172033]">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
            <p className="text-xs text-slate-400">NIN Status</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <span className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-black ${ninConfig.bg}`}>
                <NinIcon size={11} />
                {ninConfig.label}
              </span>
              <Link
                to="/school/applications"
                className="inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a6091]"
              >
                View Applications
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherProfilesPage = () => {
  const { auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const applicationsQuery = useFetchInstitutionApplications(institutionId);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [location, setLocation] = useState("All Locations");
  const [nin, setNin] = useState("All NIN");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AcceptedTeacher | null>(null);

  const acceptedTeachers = useMemo(() => {
    const accepted = (applicationsQuery.data ?? []).filter((app) => app.status === "ACCEPTED");
    const grouped = new Map<string, JobApplication[]>();

    for (const app of accepted) {
      const key = app.teacherEmail || app.teacherName;
      const current = grouped.get(key) ?? [];
      current.push(app);
      grouped.set(key, current);
    }

    return [...grouped.entries()]
      .map(([key, apps]): AcceptedTeacher => {
        const ordered = [...apps].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        const latest = ordered[0];
        return {
          id: key,
          name: latest.teacherName,
          email: latest.teacherEmail,
          avatar: latest.teacherAvatar,
          level: toLevel(latest.teacherLevel) as TeacherLevel,
          subject: latest.subject || latest.jobTitle,
          location: latest.teacherLocation,
          nin: toNin(latest.ninStatus, latest.ninDocumentUrl),
          records: apps.length,
          bio: latest.teacherBio || "Accepted teacher on the school roster.",
          joined: latest.teacherJoined || latest.date,
          available: latest.teacherAvailable !== false,
          verified: Boolean(latest.teacherVerified),
          certificateUrl: latest.certificateUrl,
          latestJobTitle: latest.jobTitle,
          latestJobId: latest.jobId,
          latestJobDate: latest.date,
          acceptedJobs: ordered.map((app) => ({
            id: app.id,
            jobId: app.jobId,
            title: app.jobTitle,
            subject: app.subject,
            location: app.jobLocation,
            date: app.date,
          })),
        };
      })
      .sort((a, b) => new Date(b.latestJobDate).getTime() - new Date(a.latestJobDate).getTime());
  }, [applicationsQuery.data]);

  const filtered = acceptedTeachers.filter((teacher) => {
    const q = search.toLowerCase();
    const matchQ = !q || teacher.name.toLowerCase().includes(q) || teacher.email.toLowerCase().includes(q) || teacher.latestJobTitle.toLowerCase().includes(q);
    const matchS = subject === "All Subjects" || teacher.subject === subject;
    const matchL = location === "All Locations" || teacher.location === location;
    const matchN = nin === "All NIN" || teacher.nin === nin;
    return matchQ && matchS && matchL && matchN;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const paginated = filtered.slice((pageSafe - 1) * ITEMS_PER_PAGE, pageSafe * ITEMS_PER_PAGE);

  const activeCount = acceptedTeachers.filter((t) => t.available).length;
  const verifiedCount = acceptedTeachers.filter((t) => t.verified).length;
  const totalPlacements = acceptedTeachers.reduce((sum, teacher) => sum + teacher.records, 0);

  return (
    <AdminLayout>
      <TeacherProfileModal teacher={selected} onClose={() => setSelected(null)} />

      <div className="px-6 py-8 xl:px-8">
        {/* ── Page header ──────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#287271]">School Roster</p>
            <h1 className="mt-0.5 text-2xl font-black text-[#172033]">Teacher Profiles</h1>
          </div>
          <p className="text-sm text-slate-500">
            Accepted teachers from your job applications.
          </p>
        </div>

        {/* ── Roster Health Panel ───────────────────────────────── */}
        <div className="mb-6 grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">

          {/* Left: headline tile */}
          <div className="relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
            <div className="absolute -right-6 -top-6 size-28 rounded-full bg-[#184e77]/[0.04]" />
            <div className="absolute -right-2 -bottom-8 size-20 rounded-full bg-[#287271]/[0.06]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Roster Size</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-4xl font-black text-[#172033]">{acceptedTeachers.length}</span>
                  <span className="mb-1 text-sm font-semibold text-slate-400">teacher{acceptedTeachers.length !== 1 ? "s" : ""}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Accepted from job applications</p>
              </div>
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#184e77] text-white shadow-sm">
                <Users size={20} />
              </div>
            </div>

            {/* Availability bar */}
            <div className="relative mt-4 space-y-2.5">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Available now</span>
                  <span className="font-bold text-slate-700">{activeCount} / {acceptedTeachers.length}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: acceptedTeachers.length > 0 ? `${(activeCount / acceptedTeachers.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Email verified</span>
                  <span className="font-bold text-slate-700">{verifiedCount} / {acceptedTeachers.length}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: acceptedTeachers.length > 0 ? `${(verifiedCount / acceptedTeachers.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mid: NIN compliance */}
          {(() => {
            const ninPending  = acceptedTeachers.filter(t => t.nin === "Pending").length;
            const ninVerified = acceptedTeachers.filter(t => t.nin === "Verified").length;
            const ninRejected = acceptedTeachers.filter(t => t.nin === "Rejected").length;
            const ninNone     = acceptedTeachers.filter(t => t.nin === "Not submitted").length;
            const total       = acceptedTeachers.length || 1;
            return (
              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">NIN Compliance</p>
                  <ShieldCheck size={15} className="text-[#287271]" />
                </div>
                {/* Stacked bar */}
                <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(ninVerified / total) * 100}%` }} />
                  <div className="h-full bg-amber-400 transition-all"  style={{ width: `${(ninPending  / total) * 100}%` }} />
                  <div className="h-full bg-red-400 transition-all"    style={{ width: `${(ninRejected / total) * 100}%` }} />
                </div>
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: "Verified",       count: ninVerified, dot: "bg-emerald-500" },
                    { label: "Pending review", count: ninPending,  dot: "bg-amber-400"  },
                    { label: "Rejected",       count: ninRejected, dot: "bg-red-400"    },
                    { label: "Not submitted",  count: ninNone,     dot: "bg-slate-200"  },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${row.dot}`} />
                        <span className="text-slate-500">{row.label}</span>
                      </div>
                      <span className="font-bold text-slate-700">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Right: Placements */}
          <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Placements</p>
              <TrendingUp size={15} className="text-amber-500" />
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-black text-[#172033]">{totalPlacements}</span>
              <span className="mb-1 text-sm font-semibold text-slate-400">total roles</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Approved placements across all jobs</p>
            <div className="mt-4 space-y-1.5">
              {acceptedTeachers.slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center justify-between text-[11px]">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e0f2fe] text-[9px] font-black text-[#184e77]">
                      {t.avatar ? <img src={t.avatar} alt={t.name} className="size-full object-cover" /> : t.name.charAt(0)}
                    </div>
                    <span className="truncate text-slate-600">{t.name.split(" ")[0]}</span>
                  </div>
                  <span className="font-bold text-slate-700">{t.records} role{t.records !== 1 ? "s" : ""}</span>
                </div>
              ))}
              {acceptedTeachers.length > 3 && (
                <p className="text-[10px] text-slate-400">+{acceptedTeachers.length - 3} more teacher{acceptedTeachers.length - 3 !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white px-5 py-4 shadow-sm shadow-slate-900/[0.04]">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or role..."
              className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] py-2 pl-9 pr-4 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:bg-white"
            />
          </div>

          {[
            { value: subject, setter: setSubject, options: SUBJECTS },
            { value: location, setter: setLocation, options: LOCATIONS },
            { value: nin, setter: setNin, options: NIN_STATUSES },
          ].map((f, i) => (
            <select
              key={i}
              value={f.value}
              onChange={(e) => {
                f.setter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#184e77]"
            >
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}

          {(search || subject !== "All Subjects" || location !== "All Locations" || nin !== "All NIN") && (
            <button
              onClick={() => {
                setSearch("");
                setSubject("All Subjects");
                setLocation("All Locations");
                setNin("All NIN");
                setPage(1);
              }}
              className="flex items-center gap-1 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
          <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr_1fr_1fr_110px] items-center border-b border-[#f1f5f9] bg-[#fafcff] px-6 py-3">
            {["Teacher", "Level", "Subject", "Location", "NIN Status", "Accepted Roles", "Actions"].map((h) => (
              <span key={h} className="text-[10px] font-black uppercase tracking-wider text-slate-400">{h}</span>
            ))}
          </div>

          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="grid size-16 place-items-center rounded-2xl bg-[#f0f7ff]">
                <Users size={28} className="text-[#184e77]/40" />
              </div>
              <p className="text-sm font-black text-slate-400">
                {applicationsQuery.isLoading ? "Loading accepted teachers..." : "No accepted teachers found"}
              </p>
              <p className="text-xs text-slate-400">
                Accepted applications from this school will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f8fafc]">
              {paginated.map((teacher) => {
                const ninConfig = ninStyle[teacher.nin];
                const NinIcon = ninConfig.icon;
                return (
                  <div
                    key={teacher.id}
                    className="grid grid-cols-[2.2fr_1fr_1fr_1fr_1fr_1fr_110px] items-center gap-2 px-6 py-3.5 transition hover:bg-[#f8fafc]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="size-10 shrink-0 overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f8fafc]">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.name} className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center text-xs font-black text-[#184e77]">
                            {teacher.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#172033]">{teacher.name}</p>
                        <p className="truncate text-[11px] text-slate-400">{teacher.email}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${levelStyle[teacher.level]}`}>
                      <Star size={9} />{teacher.level}
                    </span>

                    <span className="truncate rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-bold text-[#184e77]">
                      {teacher.subject}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={10} className="shrink-0 text-slate-400" />{teacher.location}
                    </span>

                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-black ${ninConfig.bg}`}>
                      <NinIcon size={11} />{ninConfig.label}
                    </span>

                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <GraduationCap size={12} className="text-[#287271]" />
                      {teacher.records} role{teacher.records !== 1 ? "s" : ""}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelected(teacher)}
                        className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-400 transition hover:border-[#184e77]/30 hover:bg-[#f0f7ff] hover:text-[#184e77]"
                        title="View profile"
                      >
                        <Eye size={14} />
                      </button>
                      <Link
                        to={`/school/jobs/${teacher.latestJobId}`}
                        className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-400 transition hover:border-[#184e77]/30 hover:bg-[#f0f7ff] hover:text-[#184e77]"
                        title="View latest job"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#f1f5f9] bg-[#fafcff] px-6 py-3">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-bold text-[#172033]">
                {filtered.length === 0 ? 0 : (pageSafe - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#172033]">
                {Math.min(pageSafe * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#172033]">{filtered.length}</span>{" "}
              accepted teachers
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`grid size-8 place-items-center rounded-lg border text-xs font-black transition ${
                    pageSafe === p
                      ? "border-[#184e77] bg-[#184e77] text-white"
                      : "border-[#dbe4ef] text-slate-500 hover:bg-[#f0f7ff]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe === totalPages}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-40"
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

export default TeacherProfilesPage;
