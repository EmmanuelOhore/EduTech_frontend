import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { useFetchInstitutionApplications, useFetchInstitutionJobs } from "../services/queries";
import type { Job, JobApplication } from "../types/TypeChecks";

const TIME_RANGES = ["7 Days", "30 Days", "90 Days", "1 Year"] as const;

type TimeRange = (typeof TIME_RANGES)[number];

type TooltipPayload = {
  color?: string;
  fill?: string;
  name?: string;
  value?: string | number;
};

type TrendPoint = {
  label: string;
  applications: number;
  jobs: number;
};

type HireRatePoint = {
  label: string;
  rate: number;
};

type ActivityItem = {
  type: string;
  details: string;
  date: Date;
  status: string;
  statusColor: string;
};

const RANGE_DAYS: Record<TimeRange, number> = {
  "7 Days": 7,
  "30 Days": 30,
  "90 Days": 90,
  "1 Year": 365,
};

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const parseDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const shiftDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const shiftMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const sameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const changeMeta = (current: number, previous: number) => {
  if (previous === 0) {
    return {
      label: current === 0 ? "0%" : "+100%",
      up: current >= previous,
    };
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.abs(delta).toFixed(1);
  return {
    label: `${delta >= 0 ? "+" : "-"}${rounded}%`,
    up: delta >= 0,
  };
};

const percent = (num: number, denom: number) => {
  if (!denom) return 0;
  return (num / denom) * 100;
};

const buildTrendData = (range: TimeRange, now: Date, jobs: Job[], applications: JobApplication[]): TrendPoint[] => {
  if (range === "7 Days") {
    return Array.from({ length: 7 }, (_, index) => {
      const day = shiftDays(startOfDay(now), index - 6);
      return {
        label: day.toLocaleDateString("en-US", { weekday: "short" }),
        applications: applications.filter((app) => {
          const date = parseDate(app.date);
          return date ? sameDay(date, day) : false;
        }).length,
        jobs: jobs.filter((job) => {
          const date = parseDate(job.postedAt);
          return date ? sameDay(date, day) : false;
        }).length,
      };
    });
  }

  if (range === "30 Days") {
    return Array.from({ length: 5 }, (_, index) => {
      const binStart = shiftDays(startOfDay(now), -29 + index * 6);
      const binEnd = shiftDays(binStart, 5);
      return {
        label: `${binStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        applications: applications.filter((app) => {
          const date = parseDate(app.date);
          return date ? date >= binStart && date <= binEnd : false;
        }).length,
        jobs: jobs.filter((job) => {
          const date = parseDate(job.postedAt);
          return date ? date >= binStart && date <= binEnd : false;
        }).length,
      };
    });
  }

  const months = range === "90 Days" ? 3 : 12;
  return Array.from({ length: months }, (_, index) => {
    const monthDate = shiftMonths(new Date(now.getFullYear(), now.getMonth(), 1), index - (months - 1));
    return {
      label: monthDate.toLocaleDateString("en-US", { month: "short" }),
      applications: applications.filter((app) => {
        const date = parseDate(app.date);
        return date
          ? date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear()
          : false;
      }).length,
      jobs: jobs.filter((job) => {
        const date = parseDate(job.postedAt);
        return date
          ? date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear()
          : false;
      }).length,
    };
  });
};

const buildHireRateData = (range: TimeRange, now: Date, applications: JobApplication[]): HireRatePoint[] => {
  const trend = buildTrendData(range, now, [], applications);
  return trend.map((item) => {
    const total = applications.filter((app) => {
      if (range === "7 Days") {
        return item.label === parseDate(app.date)?.toLocaleDateString("en-US", { weekday: "short" });
      }
      return true;
    }).length;
    const accepted = applications.filter((app) => app.status === "ACCEPTED");
    let acceptedInBin = 0;
    if (range === "7 Days") {
      acceptedInBin = accepted.filter((app) => item.label === parseDate(app.date)?.toLocaleDateString("en-US", { weekday: "short" })).length;
    } else if (range === "30 Days") {
      acceptedInBin = accepted.filter((app) => {
        const date = parseDate(app.date);
        if (!date) return false;
        const start = new Date(now);
        start.setDate(now.getDate() - 29 + trend.findIndex((point) => point.label === item.label) * 6);
        const end = shiftDays(start, 5);
        return date >= startOfDay(start) && date <= end;
      }).length;
    } else {
      acceptedInBin = accepted.filter((app) => {
        const date = parseDate(app.date);
        if (!date) return false;
        const monthIndex = trend.findIndex((point) => point.label === item.label);
        const monthDate = shiftMonths(new Date(now.getFullYear(), now.getMonth(), 1), monthIndex - (trend.length - 1));
        return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
      }).length;
    }
    return {
      label: item.label,
      rate: total ? Number(percent(acceptedInBin, item.applications).toFixed(0)) : 0,
    };
  });
};

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#dbe4ef] bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-[11px] font-black text-[#172033]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-black text-[#172033]">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const activityIcon: Record<string, typeof Activity> = {
  "New Application": Activity,
  "Job Posted": BriefcaseBusiness,
  "Application Accepted": CheckCircle2,
  "Application Rejected": XCircle,
  "Application Pending": Clock,
};

const StatisticsPage = () => {
  const [range, setRange] = useState<TimeRange>("30 Days");
  const { auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const jobsQuery = useFetchInstitutionJobs(institutionId);
  const applicationsQuery = useFetchInstitutionApplications(institutionId);

  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);

  const now = useMemo(() => new Date(), []);
  const currentRangeDays = RANGE_DAYS[range];
  const currentStart = useMemo(() => shiftDays(startOfDay(now), -(currentRangeDays - 1)), [currentRangeDays, now]);
  const previousStart = useMemo(() => shiftDays(currentStart, -currentRangeDays), [currentRangeDays, currentStart]);
  const previousEnd = useMemo(() => shiftDays(currentStart, -1), [currentStart]);

  const withinWindow = (date: Date | null, start: Date, end: Date) => Boolean(date && date >= start && date <= end);

  const jobsCurrent = useMemo(
    () => jobs.filter((job) => withinWindow(parseDate(job.postedAt), currentStart, now)),
    [jobs, currentStart, now],
  );
  const jobsPrevious = useMemo(
    () => jobs.filter((job) => withinWindow(parseDate(job.postedAt), previousStart, previousEnd)),
    [jobs, previousStart, previousEnd],
  );
  const applicationsCurrent = useMemo(
    () => applications.filter((app) => withinWindow(parseDate(app.date), currentStart, now)),
    [applications, currentStart, now],
  );
  const applicationsPrevious = useMemo(
    () => applications.filter((app) => withinWindow(parseDate(app.date), previousStart, previousEnd)),
    [applications, previousStart, previousEnd],
  );

  const acceptedCurrent = useMemo(
    () => applicationsCurrent.filter((app) => app.status === "ACCEPTED"),
    [applicationsCurrent],
  );
  const acceptedPrevious = useMemo(
    () => applicationsPrevious.filter((app) => app.status === "ACCEPTED"),
    [applicationsPrevious],
  );

  const uniqueTeachersCurrent = useMemo(
    () => new Map(acceptedCurrent.map((app) => [app.teacherEmail || app.teacherName, app])),
    [acceptedCurrent],
  );
  const uniqueTeachersPrevious = useMemo(
    () => new Map(acceptedPrevious.map((app) => [app.teacherEmail || app.teacherName, app])),
    [acceptedPrevious],
  );

  const totalOpenSlots = jobs.reduce((sum, job) => sum + (job.slots ?? 1), 0);
  const totalFilledSlots = applications.filter((app) => app.status === "ACCEPTED").length;
  const fillRate = Number(Math.min(100, percent(totalFilledSlots, totalOpenSlots || 1)).toFixed(0));

  const avgTimeToHire = useMemo(() => {
    const durations = applications
      .filter((app) => app.status === "ACCEPTED")
      .map((app) => {
        const appliedDate = parseDate(app.date);
        const relatedJob = jobs.find((job) => job._id === app.jobId);
        const postedDate = parseDate(relatedJob?.postedAt);
        if (!appliedDate || !postedDate) return null;
        return Math.max(1, Math.round((appliedDate.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)));
      })
      .filter((value): value is number => value !== null);

    if (!durations.length) return "0d";
    const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    return `${avg.toFixed(1)}d`;
  }, [applications, jobs]);

  const verifiedRoster = Array.from(uniqueTeachersCurrent.values()).filter((app) => app.teacherVerified).length;
  const subjectBuckets = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((job) => {
      const key = job.subject || "General";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
    const palette = ["#184e77", "#287271", "#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
    return Array.from(counts.entries())
      .map(([name, count], index) => ({
        name,
        value: total ? Number(((count / total) * 100).toFixed(0)) : 0,
        color: palette[index % palette.length],
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [jobs]);

  const locationData = useMemo(() => {
    const buckets = new Map<string, { teachers: number; jobs: number }>();
    jobs.forEach((job) => {
      const key = job.location || "Unknown";
      const current = buckets.get(key) ?? { teachers: 0, jobs: 0 };
      current.jobs += 1;
      buckets.set(key, current);
    });
    Array.from(uniqueTeachersCurrent.values()).forEach((app) => {
      const key = app.teacherLocation || "Unknown";
      const current = buckets.get(key) ?? { teachers: 0, jobs: 0 };
      current.teachers += 1;
      buckets.set(key, current);
    });
    return Array.from(buckets.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.teachers + b.jobs - (a.teachers + a.jobs))
      .slice(0, 6);
  }, [jobs, uniqueTeachersCurrent]);

  const levelData = useMemo(() => {
    const total = uniqueTeachersCurrent.size || 1;
    const buckets = new Map<string, number>();
    Array.from(uniqueTeachersCurrent.values()).forEach((app) => {
      buckets.set(app.teacherLevel, (buckets.get(app.teacherLevel) ?? 0) + 1);
    });
    const palette: Record<string, string> = {
      EXPERT: "#8b5cf6",
      INTERMEDIATE: "#f59e0b",
      BEGINNER: "#94a3b8",
      Expert: "#8b5cf6",
      Intermediate: "#f59e0b",
      Beginner: "#94a3b8",
    };
    return Array.from(buckets.entries()).map(([name, count]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value: Number(((count / total) * 100).toFixed(0)),
      count,
      color: palette[name] ?? "#184e77",
    }));
  }, [uniqueTeachersCurrent]);

  const ninData = useMemo(() => {
    const total = uniqueTeachersCurrent.size || 1;
    const buckets = new Map<string, number>();
    Array.from(uniqueTeachersCurrent.values()).forEach((app) => {
      const key = app.ninStatus || "Not submitted";
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    const palette: Record<string, string> = {
      Verified: "#10b981",
      Pending: "#f59e0b",
      Rejected: "#ef4444",
      "Not submitted": "#94a3b8",
    };
    return Array.from(buckets.entries()).map(([status, count]) => ({
      status,
      count,
      fill: palette[status] ?? "#184e77",
      percent: Number(((count / total) * 100).toFixed(0)),
    }));
  }, [uniqueTeachersCurrent]);

  const trendData = useMemo(() => buildTrendData(range, now, jobs, applications), [range, now, jobs, applications]);
  const hireRateData = useMemo(() => buildHireRateData(range, now, applications), [range, now, applications]);

  const quickInsights = useMemo(() => {
    const peakMonth = [...trendData].sort((a, b) => b.applications - a.applications)[0];
    const topSubject = subjectBuckets[0];
    const topLocation = locationData[0];
    const ninVerifiedCount = ninData.find((item) => item.status === "Verified")?.count ?? 0;
    return {
      peakMonth,
      topSubject,
      topLocation,
      ninVerifiedCount,
    };
  }, [trendData, subjectBuckets, locationData, ninData]);

  const applicationRate = Number(percent(applications.length, jobs.length || 1).toFixed(0));
  const applicationRateCurrent = Number(percent(applicationsCurrent.length, jobsCurrent.length || 1).toFixed(0));
  const applicationRatePrevious = Number(percent(applicationsPrevious.length, jobsPrevious.length || 1).toFixed(0));

  const primaryStats = [
    {
      label: "Total Jobs",
      value: String(jobs.length),
      change: changeMeta(jobsCurrent.length, jobsPrevious.length),
      icon: BriefcaseBusiness,
      iconBg: "bg-blue-500",
      accent: "bg-blue-500",
      sub: "posted by this school",
    },
    {
      label: "Total Applications",
      value: String(applications.length),
      change: changeMeta(applicationsCurrent.length, applicationsPrevious.length),
      icon: GraduationCap,
      iconBg: "bg-purple-500",
      accent: "bg-purple-500",
      sub: "received across your jobs",
    },
    {
      label: "Accepted Teachers",
      value: String(uniqueTeachersCurrent.size),
      change: changeMeta(uniqueTeachersCurrent.size, uniqueTeachersPrevious.size),
      icon: Users,
      iconBg: "bg-teal-500",
      accent: "bg-teal-500",
      sub: "on your roster in this period",
    },
    {
      label: "Application Rate",
      value: `${applicationRate}%`,
      change: changeMeta(applicationRateCurrent, applicationRatePrevious),
      icon: BarChart3,
      iconBg: "bg-orange-500",
      accent: "bg-orange-400",
      sub: "applications per job",
    },
  ];

  const secondaryStats = [
    { label: "Fill Rate", value: `${fillRate}%`, note: "accepted against open slots", icon: Zap, iconBg: "bg-emerald-500" },
    { label: "Avg. Time to Hire", value: avgTimeToHire, note: "from posting to accepted application", icon: Clock, iconBg: "bg-indigo-500" },
    { label: "Verified Teachers", value: String(verifiedRoster), note: "accepted teachers with verified accounts", icon: ShieldCheck, iconBg: "bg-pink-500" },
    { label: "Open Slots", value: String(totalOpenSlots), note: "positions currently published", icon: Building2, iconBg: "bg-cyan-500" },
  ];

  const activityLog = useMemo(() => {
    const items: ActivityItem[] = [
      ...jobs.map((job) => ({
        type: "Job Posted",
        details: `${job.title} was ${job.isActive === false ? "saved as draft" : "published"}`,
        date: parseDate(job.postedAt) ?? now,
        status: job.isActive === false ? "Draft" : "Active",
        statusColor: job.isActive === false
          ? "bg-slate-100 text-slate-600 border-slate-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200",
      })),
      ...applications.map((app) => ({
        type:
          app.status === "ACCEPTED"
            ? "Application Accepted"
            : app.status === "REJECTED"
              ? "Application Rejected"
              : "New Application",
        details: `${app.teacherName} ${app.status === "PENDING" ? "applied for" : app.status === "ACCEPTED" ? "was accepted for" : "was rejected for"} ${app.jobTitle}`,
        date: parseDate(app.date) ?? now,
        status: app.status === "PENDING" ? "Pending" : app.status === "ACCEPTED" ? "Accepted" : "Rejected",
        statusColor:
          app.status === "PENDING"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : app.status === "ACCEPTED"
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-red-50 text-red-600 border-red-200",
      })),
    ];

    return items
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8);
  }, [applications, jobs, now]);

  if (jobsQuery.isLoading || applicationsQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="grid min-h-[60vh] place-items-center px-6 py-8 xl:px-8">
          <p className="text-sm font-black text-slate-500">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-8 xl:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#172033]">Statistics & Analytics</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live hiring insights for {auth?.institution?.name ?? "your school"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-[#dbe4ef] bg-white p-1.5 shadow-sm">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-xl px-4 py-1.5 text-xs font-black transition-all ${
                  range === r
                    ? "bg-[#184e77] text-white shadow-sm"
                    : "text-slate-500 hover:bg-[#f0f7ff] hover:text-[#184e77]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {primaryStats.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.label} className="relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className={`absolute inset-x-0 top-0 h-1 ${s.accent}`} />
                <div className="p-5 pt-6">
                  <div className="mb-4 flex items-start justify-between">
                    <span className={`grid size-11 place-items-center rounded-2xl ${s.iconBg} shadow-sm`}>
                      <Icon size={20} className="text-white" />
                    </span>
                    <span className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black ${s.change.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      {s.change.up ? <TrendingUp size={10} /> : <ArrowUpRight size={10} className="rotate-180" />}
                      {s.change.label}
                    </span>
                  </div>
                  <p className="text-3xl font-black tracking-tight text-[#172033]">{s.value}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-600">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{s.sub}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {secondaryStats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-[#dbe4ef] bg-white px-5 py-4 shadow-sm shadow-slate-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-md">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${s.iconBg} shadow-sm`}>
                  <Icon size={18} className="text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-black leading-none text-[#172033]">{s.value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{s.label}</p>
                  <p className="text-[11px] text-slate-400">{s.note}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3 rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-[#172033]">Applications & Jobs Trend</h3>
                <p className="text-xs text-slate-400">Activity trend for {range.toLowerCase()}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <span className="size-2.5 rounded-full bg-[#184e77]" /> Applications
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <span className="size-2.5 rounded-full bg-[#287271]" /> Jobs Posted
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#184e77" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#184e77" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#287271" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#287271" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="applications" stroke="#184e77" strokeWidth={2.5} fill="url(#gradApp)" dot={false} activeDot={{ r: 5, fill: "#184e77" }} name="Applications" />
                <Area type="monotone" dataKey="jobs" stroke="#287271" strokeWidth={2.5} fill="url(#gradJobs)" dot={false} activeDot={{ r: 5, fill: "#287271" }} name="Jobs Posted" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="lg:col-span-2 rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
            <h3 className="mb-1 text-base font-black text-[#172033]">Quick Insights</h3>
            <p className="mb-5 text-xs text-slate-400">Key highlights for {range}</p>

            <div className="flex flex-col gap-3">
              {[
                {
                  icon: TrendingUp,
                  iconBg: "bg-emerald-50 text-emerald-600",
                  label: "Peak Period",
                  value: quickInsights.peakMonth?.label ?? "No data",
                  sub: `${quickInsights.peakMonth?.applications ?? 0} applications`,
                },
                {
                  icon: Star,
                  iconBg: "bg-blue-50 text-blue-600",
                  label: "Top Subject",
                  value: quickInsights.topSubject?.name ?? "No subject yet",
                  sub: `${quickInsights.topSubject?.value ?? 0}% of jobs`,
                },
                {
                  icon: MapPin,
                  iconBg: "bg-teal-50 text-teal-600",
                  label: "Top Location",
                  value: quickInsights.topLocation?.name ?? "No location yet",
                  sub: `${quickInsights.topLocation?.teachers ?? 0} accepted teachers`,
                },
                {
                  icon: Zap,
                  iconBg: "bg-purple-50 text-purple-600",
                  label: "Fill Rate",
                  value: `${fillRate}%`,
                  sub: "of available slots filled",
                },
                {
                  icon: ShieldCheck,
                  iconBg: "bg-amber-50 text-amber-600",
                  label: "NIN Verified",
                  value: `${ninData.find((item) => item.status === "Verified")?.percent ?? 0}%`,
                  sub: `${quickInsights.ninVerifiedCount} accepted teachers`,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[#f8fafc] p-3">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${item.iconBg}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400">{item.label}</p>
                      <p className="text-sm font-black text-[#172033]">{item.value}</p>
                    </div>
                    <p className="shrink-0 text-[11px] text-slate-400">{item.sub}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
            <div className="mb-1">
              <h3 className="text-base font-black text-[#172033]">Hire Rate Trend</h3>
              <p className="text-xs text-slate-400">Accepted applications as a share of total applications</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={hireRateData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f0f7ff" }} />
                <Bar dataKey="rate" name="Hire Rate %" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {hireRateData.map((entry, i) => (
                    <Cell key={i} fill={entry.rate >= 70 ? "#10b981" : entry.rate >= 40 ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
            <div className="mb-1">
              <h3 className="text-base font-black text-[#172033]">NIN Verification Status</h3>
              <p className="text-xs text-slate-400">Accepted teacher verification breakdown</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={ninData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="count" paddingAngle={3}>
                      {ninData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-black text-[#172033]">{uniqueTeachersCurrent.size}</p>
                    <p className="text-[10px] text-slate-400">roster</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {ninData.map((d) => (
                  <div key={d.status} className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
                    <div>
                      <p className="text-xs font-black text-[#172033]">{d.count}</p>
                      <p className="text-[10px] text-slate-400">{d.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
            <div className="mb-1">
              <h3 className="text-base font-black text-[#172033]">Teacher Level Split</h3>
              <p className="text-xs text-slate-400">Experience level of accepted teachers</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={levelData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="count" paddingAngle={3}>
                      {levelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-black text-[#172033]">{uniqueTeachersCurrent.size}</p>
                    <p className="text-[10px] text-slate-400">teachers</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {levelData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                    <div>
                      <p className="text-xs font-black text-[#172033]">{d.value}%</p>
                      <p className="text-[10px] text-slate-400">{d.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
            <div className="mb-5">
              <h3 className="text-base font-black text-[#172033]">Subject Distribution</h3>
              <p className="text-xs text-slate-400">Share of your school's jobs by subject</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-44 shrink-0">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={subjectBuckets} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="count" paddingAngle={2}>
                      {subjectBuckets.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-black text-[#172033]">{subjectBuckets.length}</p>
                    <p className="text-[10px] text-slate-400">subjects</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {subjectBuckets.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="truncate text-[11px] font-semibold text-slate-600">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: d.color }} />
                      </div>
                      <span className="w-7 text-right text-[11px] font-black text-[#172033]">{d.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
            <div className="mb-5">
              <h3 className="text-base font-black text-[#172033]">Location Distribution</h3>
              <p className="text-xs text-slate-400">Jobs and accepted teachers by location</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={locationData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f0f7ff" }} />
                <Bar dataKey="teachers" name="Accepted Teachers" fill="#184e77" radius={[0, 6, 6, 0]} maxBarSize={14} />
                <Bar dataKey="jobs" name="Jobs" fill="#287271" radius={[0, 6, 6, 0]} maxBarSize={14} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(v) => <span style={{ color: "#64748b", fontWeight: 600 }}>{v}</span>}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
            <div>
              <h3 className="text-base font-black text-[#172033]">Recent Activity</h3>
              <p className="text-xs text-slate-400">Real events from your jobs and applications</p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_2.5fr_1.5fr_100px] items-center gap-4 border-b border-[#f8fafc] bg-[#fafcff] px-6 py-2.5">
            {["Activity Type", "Details", "Date", "Status"].map((h) => (
              <span key={h} className="text-[10px] font-black uppercase tracking-wider text-slate-400">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-[#f8fafc]">
            {activityLog.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-black text-slate-400">No analytics activity yet</p>
                <p className="mt-1 text-xs text-slate-400">Post jobs and receive applications to populate this view.</p>
              </div>
            ) : (
              activityLog.map((item, i) => {
                const Icon = activityIcon[item.type] ?? Activity;
                return (
                  <div key={i} className="grid grid-cols-[1fr_2.5fr_1.5fr_100px] items-center gap-4 px-6 py-3.5 transition hover:bg-[#f8fafc]">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f0f7ff] text-[#184e77]">
                        <Icon size={13} />
                      </span>
                      <p className="truncate text-xs font-black text-[#172033]">{item.type}</p>
                    </div>
                    <p className="truncate text-xs text-slate-500">{item.details}</p>
                    <p className="text-xs text-slate-400">{formatShortDate(item.date)}</p>
                    <span className={`inline-flex items-center justify-center rounded-xl border px-2.5 py-1 text-[10px] font-black ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default StatisticsPage;
