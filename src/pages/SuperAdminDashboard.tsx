import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchAllApplications, useFetchAllInstitutions, useFetchAllTeachers, useFetchJobs } from "../services/queries";
import type { ApplicationStatus, Job, JobApplication } from "../types/TypeChecks";

const statusTone: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
};

const statusLabel: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const employmentLabel: Record<Job["employmentType"], string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  ROTATIONAL: "Rotational",
};

const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;

const groupCount = <T,>(items: T[], getKey: (item: T) => string | undefined, fallback = "Unknown") => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item) || fallback;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

const recentDayKey = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
};

const toDateKey = (value?: string) => {
  if (!value || value === "—") return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const buildSevenDayTrend = (applications: JobApplication[]) => {
  const days = Array.from({ length: 7 }, (_, index) => recentDayKey(6 - index));
  const counts = applications.reduce<Record<string, number>>((acc, app) => {
    const key = toDateKey(app.date);
    if (key) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return days.map((day) => ({
    day,
    label: new Date(day).toLocaleDateString("en-US", { weekday: "short" }),
    value: counts[day] ?? 0,
  }));
};

const MetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof Building2;
  tone: string;
  to?: string;
}) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#172033]">{value}</p>
        </div>
        <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:shadow-md">
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
      {content}
    </article>
  );
};

const BarList = ({
  title,
  subtitle,
  items,
  total,
}: {
  title: string;
  subtitle: string;
  items: { label: string; value: number }[];
  total: number;
}) => (
  <section className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
    <div className="mb-4">
      <h2 className="font-black text-[#172033]">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
    <div className="grid gap-3">
      {items.length ? items.map((item) => {
        const width = pct(item.value, total);
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-bold text-[#172033]">{item.label}</span>
              <span className="text-xs font-black text-slate-400">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef2f7]">
              <div className="h-full rounded-full bg-[#287271]" style={{ width: `${Math.max(6, width)}%` }} />
            </div>
          </div>
        );
      }) : (
        <p className="rounded-xl border border-dashed border-[#dbe4ef] py-8 text-center text-sm font-semibold text-slate-400">No data yet.</p>
      )}
    </div>
  </section>
);

const TrendChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = 18 + index * 44;
    const y = 110 - (item.value / max) * 72;
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black text-[#172033]">Application Trend</h2>
          <p className="text-xs text-slate-500">Submissions across the last 7 days</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
          <LineChart size={18} />
        </span>
      </div>
      <svg viewBox="0 0 300 140" className="h-44 w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#287271" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#287271" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`18,120 ${points} 282,120`} fill="url(#trendFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#287271" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const x = 18 + index * 44;
          const y = 110 - (item.value / max) * 72;
          return (
            <g key={item.label}>
              <circle cx={x} cy={y} r="4.5" fill="#184e77" />
              <text x={x} y={Math.max(14, y - 10)} textAnchor="middle" fontSize="10" fill="#184e77" fontWeight="800">{item.value}</text>
              <text x={x} y="134" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="700">{item.label}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
};

const Funnel = ({
  total,
  pending,
  accepted,
  rejected,
}: {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}) => {
  const rows = [
    { label: "All applications", value: total, color: "bg-[#184e77]" },
    { label: "Pending review", value: pending, color: "bg-amber-400" },
    { label: "Accepted", value: accepted, color: "bg-emerald-500" },
    { label: "Rejected", value: rejected, color: "bg-red-400" },
  ];

  return (
    <section className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
      <h2 className="font-black text-[#172033]">Application Funnel</h2>
      <p className="text-xs text-slate-500">Pipeline shape across the full platform</p>
      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-bold text-[#172033]">{row.label}</span>
              <span className="text-xs font-black text-slate-400">{row.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#eef2f7]">
              <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max(row.value ? 8 : 0, pct(row.value, total))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const SuperAdminDashboard = () => {
  const schoolsQuery = useFetchAllInstitutions();
  const staffQuery = useFetchAllTeachers();
  const jobsQuery = useFetchJobs();
  const appsQuery = useFetchAllApplications();

  const schools = schoolsQuery.data ?? [];
  const staff = staffQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const applications = appsQuery.data ?? [];

  const pendingSchools = schools.filter((school) => !school.isVerified);
  const verifiedSchools = schools.filter((school) => school.isVerified);
  const pendingKyc = staff.filter((person) => person.kycStatus !== "APPROVED");
  const approvedKyc = staff.filter((person) => person.kycStatus === "APPROVED");
  const pendingApplications = applications.filter((app) => app.status === "PENDING");
  const acceptedApplications = applications.filter((app) => app.status === "ACCEPTED");
  const rejectedApplications = applications.filter((app) => app.status === "REJECTED");
  const activeJobs = jobs.filter((job) => job.isActive !== false);

  const acceptanceRate = pct(acceptedApplications.length, acceptedApplications.length + rejectedApplications.length);
  const pendingReviewLoad = pendingApplications.length + pendingSchools.length + pendingKyc.length;
  const appsPerJob = jobs.length ? (applications.length / jobs.length).toFixed(1) : "0.0";
  const trend = buildSevenDayTrend(applications);
  const topSchools = groupCount(applications, (app) => app.institutionName, "Unknown school").slice(0, 5);
  const jobTypeDemand = groupCount(applications, (app) => employmentLabel[app.jobType], "Unknown type");
  const subjectDemand = groupCount(applications, (app) => app.subject || app.jobTitle, "Unspecified").slice(0, 5);
  const schoolCoverage = pct(verifiedSchools.length, schools.length);

  return (
    <SuperAdminLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Overview</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#172033]">Platform Operations</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Application intelligence, school readiness, staff trust, and job demand in one command view.
          </p>
        </div>
        <Link
          to="/admin/applications"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#184e77] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#123d5f]"
        >
          Open Applications
          <ArrowRight size={15} />
        </Link>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Applications" value={applications.length} helper={`${pendingApplications.length} pending review`} icon={ClipboardList} tone="bg-[#e0f2fe] text-[#184e77]" to="/admin/applications" />
        <MetricCard label="Acceptance Rate" value={`${acceptanceRate}%`} helper={`${acceptedApplications.length} accepted, ${rejectedApplications.length} rejected`} icon={TrendingUp} tone="bg-emerald-50 text-emerald-700" />
        <MetricCard label="Review Load" value={pendingReviewLoad} helper="Apps, schools, and KYC needing action" icon={AlertCircle} tone="bg-amber-50 text-amber-700" />
        <MetricCard label="Apps / Job" value={appsPerJob} helper={`${activeJobs.length} active jobs on platform`} icon={BriefcaseBusiness} tone="bg-[#e0f2fe] text-[#184e77]" />
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Application status</p>
              <h2 className="mt-1 text-xl font-black text-[#172033]">Pipeline Health</h2>
              <p className="mt-1 text-sm text-slate-500">How applications are moving through school review.</p>
            </div>
            <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-black text-[#184e77]">
              {applications.length} total
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[190px_1fr]">
            <div className="relative mx-auto grid size-44 place-items-center rounded-full" style={{
              background: `conic-gradient(#10b981 0 ${pct(acceptedApplications.length, applications.length)}%, #f59e0b ${pct(acceptedApplications.length, applications.length)}% ${pct(acceptedApplications.length + pendingApplications.length, applications.length)}%, #f87171 ${pct(acceptedApplications.length + pendingApplications.length, applications.length)}% 100%)`,
            }}>
              <div className="grid size-32 place-items-center rounded-full bg-white text-center">
                <div>
                  <p className="text-3xl font-black text-[#172033]">{acceptanceRate}%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">acceptance</p>
                </div>
              </div>
            </div>
            <div className="grid content-center gap-3">
              {([
                ["PENDING", pendingApplications.length],
                ["ACCEPTED", acceptedApplications.length],
                ["REJECTED", rejectedApplications.length],
              ] as [ApplicationStatus, number][]).map(([status, value]) => (
                <div key={status} className="flex items-center justify-between rounded-xl border border-[#eef2f7] px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone[status]}`}>{statusLabel[status]}</span>
                  <span className="font-black text-[#172033]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Funnel
          total={applications.length}
          pending={pendingApplications.length}
          accepted={acceptedApplications.length}
          rejected={rejectedApplications.length}
        />
        <TrendChart data={trend} />
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-3">
        <BarList title="Top Schools By Applications" subtitle="Where demand is concentrated" items={topSchools} total={applications.length} />
        <BarList title="Job Type Demand" subtitle="Application mix by employment type" items={jobTypeDemand} total={applications.length} />
        <BarList title="Subject Demand" subtitle="Most requested roles and subjects" items={subjectDemand} total={applications.length} />
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-[#172033]">Needs Attention</h2>
              <p className="text-xs text-slate-500">Highest priority platform work right now.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{pendingReviewLoad} open</span>
          </div>
          <div className="grid gap-3">
            {pendingApplications.slice(0, 4).map((app) => (
              <Link key={app.id} to="/admin/applications" className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3 transition hover:bg-amber-50">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#172033]">{app.teacherName}</p>
                  <p className="truncate text-xs text-slate-500">{app.jobTitle} · {app.institutionName ?? "School"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">App review</span>
              </Link>
            ))}
            {pendingSchools.slice(0, 3).map((school) => (
              <Link key={school._id} to="/admin/schools" className="flex items-center justify-between gap-4 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3 transition hover:bg-[#eef6fb]">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#172033]">{school.name}</p>
                  <p className="truncate text-xs text-slate-500">{school.email} · {school.location}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-black text-[#184e77]">School review</span>
              </Link>
            ))}
            {pendingKyc.slice(0, 3).map((person) => (
              <Link key={person.id} to="/admin/kyc" className="flex items-center justify-between gap-4 rounded-xl border border-[#dbe4ef] bg-white p-3 transition hover:bg-[#f8fafc]">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#172033]">{person.firstName} {person.lastName}</p>
                  <p className="truncate text-xs text-slate-500">{person.email} · {person.staffRole.replace("_", " ")}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-black text-[#184e77]">KYC {person.kycStatus ?? "PENDING"}</span>
              </Link>
            ))}
            {!pendingReviewLoad && (
              <div className="rounded-xl border border-dashed border-[#dbe4ef] bg-[#f8fafc] p-8 text-center text-sm font-semibold text-slate-500">
                No verification, KYC, or application items are waiting right now.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-[#172033]">Readiness Snapshot</h2>
              <p className="text-xs text-slate-500">Supply and institution trust indicators.</p>
            </div>
            <ShieldCheck size={20} className="text-[#287271]" />
          </div>
          <div className="grid gap-3">
            {[
              { label: "School verification", value: schoolCoverage, detail: `${verifiedSchools.length}/${schools.length} verified` },
              { label: "Staff KYC approval", value: pct(approvedKyc.length, staff.length), detail: `${approvedKyc.length}/${staff.length} approved` },
              { label: "Active job coverage", value: pct(activeJobs.length, jobs.length), detail: `${activeJobs.length}/${jobs.length} active jobs` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#eef2f7] p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-black text-[#172033]">{item.label}</span>
                  <span className="text-xs font-black text-slate-400">{item.detail}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef2f7]">
                  <div className="h-full rounded-full bg-[#287271]" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-[#172033]">Recent Applications</h2>
            <p className="text-xs text-slate-500">Newest applicant movement across schools.</p>
          </div>
          <Link to="/admin/applications" className="inline-flex items-center gap-1 text-xs font-black text-[#184e77] hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {applications.slice(0, 8).map((app) => (
            <article key={app.id} className="rounded-xl border border-[#eef2f7] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#172033]">{app.teacherName}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{app.jobTitle}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{app.institutionName ?? "School"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${statusTone[app.status]}`}>
                  {statusLabel[app.status]}
                </span>
              </div>
            </article>
          ))}
          {!applications.length && (
            <p className="rounded-xl border border-dashed border-[#dbe4ef] py-10 text-center text-sm font-semibold text-slate-400 md:col-span-2 xl:col-span-4">
              No applications yet.
            </p>
          )}
        </div>
      </section>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
