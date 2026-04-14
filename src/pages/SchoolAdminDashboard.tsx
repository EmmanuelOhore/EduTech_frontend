import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  MapPin,
  School,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import {
  useFetchInstitution,
  useFetchInstitutionApplications,
  useFetchInstitutionJobs,
  useFetchInstitutionTeacherReferences,
} from "../services/queries";

const quickLinks = [
  { label: "Job Management",    icon: BriefcaseBusiness, to: "/school/jobs",         desc: "Create, edit, and manage school job postings for teachers.",          color: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" },
  { label: "Teacher Profiles",  icon: Users,             to: "/school/teachers",     desc: "Browse and review teacher profiles, qualifications, and certificates.", color: "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white" },
  { label: "Applications",      icon: ClipboardList,     to: "/school/applications", desc: "Review, approve, or reject teacher applications for posted jobs.",     color: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white" },
  { label: "Statistics",        icon: BarChart3,         to: "/school/statistics",   desc: "View analytics and insights on jobs, applications, and profiles.",    color: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white" },
  { label: "School Management", icon: School,            to: "/school/profile",      desc: "Update school details, location, and institution information.",       color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" },
];

/* ── PRIMARY KPI CARD ─────────────────────────────────────────── */
type PrimaryStat = {
  label: string;
  value: number;
  change: string;
  isUp: boolean;
  sub: string;
  icon: typeof BriefcaseBusiness;
  iconBg: string;
  accent: string;
  progress: number;
  to: string;
};

const PrimaryStatCard = ({ stat }: { stat: PrimaryStat }) => {
  const Icon = stat.icon;
  return (
    <Link
      to={stat.to}
      className="group relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04] transition-all hover:-translate-y-0.5 hover:border-[#184e77]/20 hover:shadow-md"
    >
      {/* Coloured accent bar at top */}
      <div className={`absolute inset-x-0 top-0 h-1 ${stat.accent}`} />

      <div className="p-5 pt-6">
        {/* Icon + badge row */}
        <div className="mb-4 flex items-start justify-between">
          <span className={`grid size-11 place-items-center rounded-2xl ${stat.iconBg} shadow-sm`}>
            <Icon size={20} className="text-white" />
          </span>
          <span
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black ${
              stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {stat.isUp && <TrendingUp size={10} />}
            {stat.change}
          </span>
        </div>

        {/* Value + label */}
        <p className="text-3xl font-black tracking-tight text-[#172033]">{stat.value}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-600">{stat.label}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{stat.sub}</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${stat.accent}`}
              style={{ width: `${stat.progress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">{stat.progress}% of target</p>
        </div>
      </div>
    </Link>
  );
};

/* ── SECONDARY METRIC CHIP ────────────────────────────────────── */
type SecondaryStat = {
  label: string;
  value: string | number;
  note: string;
  icon: typeof ShieldCheck;
  iconBg: string;
};

const SecondaryStatCard = ({ stat }: { stat: SecondaryStat }) => {
  const Icon = stat.icon;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#dbe4ef] bg-white px-5 py-4 shadow-sm shadow-slate-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${stat.iconBg} shadow-sm`}>
        <Icon size={18} className="text-white" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none text-[#172033]">{stat.value}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
        <p className="text-[11px] text-slate-400">{stat.note}</p>
      </div>
    </div>
  );
};

/* ── MAIN COMPONENT ───────────────────────────────────────────── */
const SchoolAdminDashboard = () => {
  const { auth, user } = useAuth();
  const institutionId = auth?.institution?.id;
  const institutionQuery = useFetchInstitution(institutionId);
  const jobsQuery = useFetchInstitutionJobs(institutionId);
  const applicationsQuery = useFetchInstitutionApplications(institutionId);
  const referencesQuery = useFetchInstitutionTeacherReferences(institutionId);
  const [trendRange, setTrendRange] = useState("Last 30 Days");
  const institution = institutionQuery.data;
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const references = useMemo(() => referencesQuery.data?.references ?? [], [referencesQuery.data]);

  const acceptedTeacherMap = useMemo(() => {
    const grouped = new Map<string, { teacherName: string; teacherEmail: string; teacherAvatar?: string; teacherLevel: string; teacherLocation: string; ninStatus?: string }>();
    for (const application of applications.filter((item) => item.status === "ACCEPTED")) {
      const key = application.teacherId || application.teacherEmail;
      if (!grouped.has(key)) {
        grouped.set(key, {
          teacherName: application.teacherName,
          teacherEmail: application.teacherEmail,
          teacherAvatar: application.teacherAvatar,
          teacherLevel: application.teacherLevel,
          teacherLocation: application.teacherLocation,
          ninStatus: application.ninStatus,
        });
      }
    }
    return grouped;
  }, [applications]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.isActive !== false).length;
  const totalApplications = applications.length;
  const pendingReviews = applications.filter((application) => application.status === "PENDING").length;
  const acceptedTeachers = acceptedTeacherMap.size;
  const ninVerified = [...acceptedTeacherMap.values()].filter((teacher) => teacher.ninStatus === "VERIFIED").length;

  const applicationsLast30 = applications.filter((application) => {
    const date = new Date(application.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 29);
    return !Number.isNaN(date.getTime()) && date >= cutoff;
  });

  const trendBuckets = useMemo(() => {
    const days = trendRange === "Last 7 Days" ? 7 : trendRange === "Last 3 Months" ? 90 : 30;
    const now = new Date();
    const buckets = new Map<string, number>();

    for (let i = days - 1; i >= 0; i -= (days === 90 ? 10 : 3)) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.set(key, 0);
    }

    for (const application of applications) {
      const date = new Date(application.date);
      if (Number.isNaN(date.getTime())) continue;
      const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0 || diff >= days) continue;
      const roundedDate = new Date(now);
      const step = days === 90 ? 10 : 3;
      roundedDate.setDate(now.getDate() - Math.floor(diff / step) * step);
      const key = roundedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return [...buckets.entries()].map(([date, count]) => ({ date, applications: count }));
  }, [applications, trendRange]);

  const subjectData = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const job of jobs) {
      const subject = job.subject ?? "General";
      grouped.set(subject, (grouped.get(subject) ?? 0) + 1);
    }
    return [...grouped.entries()].map(([subject, count]) => ({
      subject: subject.length > 10 ? `${subject.slice(0, 10)}…` : subject,
      jobs: count,
    }));
  }, [jobs]);

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((application) => ({
          name: application.teacherName,
          role: application.jobTitle,
          location: application.teacherLocation,
          level: application.teacherLevel,
          status: application.status === "ACCEPTED" ? "Accepted" : application.status === "REJECTED" ? "Rejected" : "Pending",
          statusColor:
            application.status === "ACCEPTED"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : application.status === "REJECTED"
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
          avatar: application.teacherAvatar,
        })),
    [applications],
  );

  const recentActivities = useMemo(() => {
    const applicationActivities = applications.slice(0, 4).map((application, index) => ({
      id: `application-${index}`,
      text:
        application.status === "ACCEPTED"
          ? `Application accepted: ${application.teacherName} for ${application.jobTitle}`
          : application.status === "REJECTED"
            ? `Application rejected: ${application.teacherName} for ${application.jobTitle}`
            : `New application received for ${application.jobTitle}`,
      date: application.date,
      status: application.status === "PENDING" ? "Pending" : application.status === "ACCEPTED" ? "Accepted" : "Rejected",
      color:
        application.status === "ACCEPTED"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : application.status === "REJECTED"
            ? "bg-red-50 text-red-600 border-red-200"
            : "bg-amber-50 text-amber-700 border-amber-200",
    }));

    const referenceActivities = references.slice(0, 2).map((reference, index) => ({
      id: `reference-${index}`,
      text: `Reference added for ${reference.teacherName}`,
      date: reference.date,
      status: "Reference",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    }));

    return [...applicationActivities, ...referenceActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [applications, references]);

  const activeJobListings = useMemo(
    () =>
      jobs
        .filter((job) => job.isActive !== false)
        .slice(0, 3)
        .map((job) => ({
          id: job._id,
          title: job.title,
          subject: job.subject ?? "General",
          type: job.employmentType === "FULL_TIME" ? "Full Time" : job.employmentType === "PART_TIME" ? "Part Time" : "Rotational",
          level: job.level.charAt(0) + job.level.slice(1).toLowerCase(),
          applicants: job.applicants ?? 0,
          slots: job.slots ?? 1,
          levelColor:
            job.level === "EXPERT"
              ? "bg-purple-50 text-purple-700"
              : job.level === "INTERMEDIATE"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700",
          typeColor:
            job.employmentType === "FULL_TIME"
              ? "bg-blue-50 text-blue-700"
              : job.employmentType === "PART_TIME"
                ? "bg-orange-50 text-orange-700"
                : "bg-teal-50 text-teal-700",
        })),
    [jobs],
  );

  const primaryStats: PrimaryStat[] = [
    { label: "Total Jobs", value: totalJobs, change: `${activeJobs} active`, isUp: true, sub: "Posted by your school", icon: BriefcaseBusiness, iconBg: "bg-blue-500", accent: "bg-blue-500", progress: totalJobs > 0 ? Math.min(100, Math.round((activeJobs / totalJobs) * 100)) : 0, to: "/school/jobs" },
    { label: "Active Teachers", value: acceptedTeachers, change: references.length ? `${references.length} references` : "No references yet", isUp: true, sub: "Accepted into your school", icon: Users, iconBg: "bg-teal-500", accent: "bg-teal-500", progress: acceptedTeachers > 0 ? Math.min(100, Math.round((ninVerified / acceptedTeachers) * 100)) : 0, to: "/school/teachers" },
    { label: "Total Applications", value: totalApplications, change: applicationsLast30.length ? `+${applicationsLast30.length} recent` : "0 recent", isUp: totalApplications > 0, sub: "Across your job listings", icon: ClipboardList, iconBg: "bg-purple-500", accent: "bg-purple-500", progress: totalApplications > 0 ? Math.min(100, Math.round((pendingReviews / totalApplications) * 100)) : 0, to: "/school/applications" },
    { label: "Pending Reviews", value: pendingReviews, change: pendingReviews ? `${pendingReviews} waiting` : "All reviewed", isUp: false, sub: "Needs attention", icon: FileText, iconBg: "bg-orange-500", accent: "bg-orange-400", progress: totalApplications > 0 ? Math.min(100, Math.round((pendingReviews / totalApplications) * 100)) : 0, to: "/school/applications" },
  ];

  const secondaryStats: SecondaryStat[] = [
    { label: "NIN Verified", value: `${ninVerified}/${acceptedTeachers || 0}`, note: "of accepted teachers", icon: ShieldCheck, iconBg: "bg-emerald-500" },
    { label: "Active Jobs", value: activeJobs, note: "currently open", icon: GraduationCap, iconBg: "bg-indigo-500" },
    { label: "References", value: references.length, note: "published by your school", icon: BookOpen, iconBg: "bg-pink-500" },
    { label: "School Status", value: institution?.isVerified ? "Verified" : "Pending", note: institution?.type ? `${institution.type.toLowerCase()} institution` : "institution", icon: Building2, iconBg: "bg-cyan-500" },
  ];

  return (
    <AdminLayout>
      {/* ── WELCOME BANNER ──────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#184e77] via-[#1a6091] to-[#287271] px-8 py-8">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/30" />
          <div className="absolute -bottom-10 right-40 size-48 rounded-full bg-white/20" />
          <div className="absolute left-1/3 top-0 size-32 rounded-full bg-white/10" />
        </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold text-blue-200">Welcome back 👋</p>
            <h2 className="text-2xl font-black text-white">{user ? `${user.firstName} ${user.lastName}` : "School Admin"}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-blue-200">
              <Building2 size={13} /> {institution?.name ?? auth?.institution?.name ?? "School"} · {institution?.location ?? auth?.institution?.location ?? "Location"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/school/jobs"
              className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              <BriefcaseBusiness size={15} /> Post a Job
            </Link>
            <Link
              to="/school/applications"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#184e77] shadow-sm transition hover:shadow-md"
            >
              <Zap size={15} /> Quick Actions
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 xl:px-8">

        {/* ── PRIMARY KPI CARDS ───────────────────────────── */}
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {primaryStats.map((s) => <PrimaryStatCard key={s.label} stat={s} />)}
        </div>

        {/* ── SECONDARY PLATFORM METRICS ──────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {secondaryStats.map((s) => <SecondaryStatCard key={s.label} stat={s} />)}
        </div>

        {/* ── CHARTS ROW ──────────────────────────────────── */}
        <div className="mb-8 grid gap-6 lg:grid-cols-5">

          {/* Application Trend */}
          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04] lg:col-span-3">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-[#172033]">Application Trend</h3>
                <p className="text-xs text-slate-400">Daily inbound teacher applications</p>
              </div>
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value)}
                className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-[#184e77]"
              >
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 3 Months</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendBuckets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#184e77" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#184e77" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #dbe4ef", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                  labelStyle={{ fontWeight: 700, color: "#172033" }}
                />
                <Area type="monotone" dataKey="applications" stroke="#184e77" strokeWidth={2.5} fill="url(#appGradient)" dot={{ fill: "#184e77", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5.5, fill: "#184e77" }} name="Applications" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Subject Distribution */}
          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04] lg:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-[#172033]">Subject Distribution</h3>
                <p className="text-xs text-slate-400">Jobs posted by subject</p>
              </div>
              <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-[11px] font-bold text-[#184e77]">Active</span>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={subjectData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #dbe4ef", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                  labelStyle={{ fontWeight: 700, color: "#172033" }}
                  cursor={{ fill: "#f0f7ff" }}
                />
                <Bar dataKey="jobs" fill="#287271" radius={[6, 6, 0, 0]} name="Jobs" maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        {/* ── APPLICATIONS + ACTIVITY ─────────────────────── */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* Recent Applications */}
          <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
              <div>
                <h3 className="text-base font-black text-[#172033]">Recent Applications</h3>
                <p className="text-xs text-slate-400">Applicants for your active job listings</p>
              </div>
              <Link
                to="/school/applications"
                className="flex items-center gap-1 rounded-lg border border-[#dbe4ef] px-3 py-1.5 text-xs font-bold text-[#184e77] transition hover:bg-[#f0f7ff]"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_44px] items-center gap-4 border-b border-[#f8fafc] bg-[#fafcff] px-6 py-2.5 sm:grid">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Teacher</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Level</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</span>
              <span />
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {recentApplications.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-400">Applications for your school will appear here.</div>
              ) : recentApplications.map((app) => (
                <div key={`${app.name}-${app.role}`} className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-[#f8fafc] sm:grid sm:grid-cols-[2fr_2fr_1fr_1fr_44px]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 shrink-0 overflow-hidden rounded-xl border border-[#dbe4ef]">
                      {app.avatar ? (
                        <img src={app.avatar} alt={app.name} className="size-full object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center text-xs font-black text-[#184e77]">
                          {app.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#172033]">{app.name}</p>
                      <p className="flex items-center gap-1 truncate text-[11px] text-slate-400"><MapPin size={9} /> {app.location}</p>
                    </div>
                  </div>
                  <p className="hidden truncate text-xs font-semibold text-slate-600 sm:block">{app.role}</p>
                  <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 sm:inline-flex items-center">
                    <Star size={9} className="mr-1 text-amber-400" />{app.level}
                  </span>
                  <span className={`shrink-0 rounded-xl border px-2.5 py-1 text-[11px] font-black ${app.statusColor}`}>{app.status}</span>
                  <Link
                    to="/school/applications"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-[#e0f2fe] hover:text-[#184e77]"
                    title="Open applications"
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-4">
              <div>
                <h3 className="text-base font-black text-[#172033]">Recent Activity</h3>
                <p className="text-xs text-slate-400">Platform events & updates</p>
              </div>
              <Link
                to="/school/statistics"
                className="flex items-center gap-1 text-xs font-bold text-[#184e77] transition hover:underline"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {recentActivities.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">Recent school activity will appear here.</div>
              ) : recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-[#f8fafc]">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#f0f7ff] text-[#184e77]">
                    <FileText size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug text-[#172033]">{act.text}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{act.date}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black ${act.color}`}>{act.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── QUICK ACCESS CARDS ──────────────────────────── */}
        <section className="mb-8">
          <div className="mb-4">
            <h3 className="text-base font-black text-[#172033]">Quick Access</h3>
            <p className="text-xs text-slate-400">Jump to any section quickly</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex flex-col rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04] transition-all hover:-translate-y-0.5 hover:border-[#184e77]/20 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`grid size-10 place-items-center rounded-xl transition ${item.color}`}>
                      <Icon size={17} />
                    </span>
                    <ArrowRight size={14} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#184e77]" />
                  </div>
                  <p className="text-sm font-black text-[#172033]">{item.label}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── POSTED JOBS SNAPSHOT ────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#172033]">Active Job Listings</h3>
              <p className="text-xs text-slate-400">Your currently open positions</p>
            </div>
            <Link to="/school/jobs" className="flex items-center gap-1 rounded-lg border border-[#dbe4ef] px-3 py-1.5 text-xs font-bold text-[#184e77] transition hover:bg-[#f0f7ff]">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeJobListings.length === 0 ? (
              <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-14 text-center text-sm text-slate-400 sm:col-span-2 lg:col-span-3">
                No active job listings yet.
              </div>
            ) : activeJobListings.map((job) => (
              <article key={job.id} className="group overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04] transition hover:shadow-md">
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur ${job.typeColor}`}>{job.type}</span>
                    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur ${job.levelColor}`}>{job.level}</span>
                  </div>
                </div>
                <div className="p-5">
                  <span className="rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-bold text-[#184e77]">{job.subject}</span>
                  <h4 className="mt-2 text-sm font-black text-[#172033]">{job.title}</h4>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users size={11} />{job.applicants} applicants</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" />{job.slots} slot{job.slots > 1 ? "s" : ""} open</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to="/school/applications" className="flex-1 rounded-xl border border-[#dbe4ef] py-2 text-center text-[11px] font-bold text-[#184e77] transition hover:bg-[#f0f7ff]">View Applications</Link>
                    <Link to={`/school/jobs/${job.id}`} className="flex-1 rounded-xl bg-[#184e77] py-2 text-center text-[11px] font-black text-white transition hover:bg-[#1a6091]">Manage Listing</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

      </div>
    </AdminLayout>
  );
};

export default SchoolAdminDashboard;
