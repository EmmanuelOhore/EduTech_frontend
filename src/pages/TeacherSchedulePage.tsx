import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  Hourglass,
  Info,
  MapPin,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useFetchMyAssignments } from "../services/queries";
import type { Assignment } from "../types/TypeChecks";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_LABELS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const TODAY_CODE = DAYS[(new Date().getDay() + 6) % 7];

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const durationLabel = (start?: string, end?: string) => {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h}h` : ""}${h && m ? " " : ""}${m ? `${m}m` : ""}` || "0m";
};

const partOfDay = (start?: string) => {
  const h = Number((start ?? "0").split(":")[0]);
  if (h < 12) return { label: "Morning", bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700 ring-amber-100" };
  if (h < 17) return { label: "Afternoon", bar: "bg-sky-400", chip: "bg-sky-50 text-sky-700 ring-sky-100" };
  return { label: "Evening", bar: "bg-blue-400", chip: "bg-blue-50 text-blue-700 ring-blue-100" };
};

const schoolName = (a: Assignment) =>
  a.institutionName || (a as any).institutionId?.name || "School";

// ── Detail modal ──────────────────────────────────────────────────
const SessionModal = ({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) => {
  if (!assignment) return null;
  const session = assignment.sessionTemplateId as any;
  const tod = partOfDay(session?.startTime);
  const rows = [
    { icon: Building2, label: "School", value: schoolName(assignment) },
    { icon: MapPin, label: "Location", value: session?.branch || "Not specified" },
    { icon: CalendarDays, label: "Day", value: DAY_LABELS[session?.dayOfWeek] ?? "—" },
    { icon: Clock, label: "Time", value: `${fmt12(session?.startTime || "00:00")} – ${fmt12(session?.endTime || "00:00")}` },
    { icon: Hourglass, label: "Duration", value: durationLabel(session?.startTime, session?.endTime) },
    { icon: RefreshCw, label: "Repeats", value: session?.isRecurring ? "Every week" : "One-off session" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative shrink-0 rounded-t-2xl bg-gradient-to-br from-[#15466b] via-[#1c5a82] to-[#236d77] px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${tod.chip}`}>
                {tod.label}
              </span>
              <h2 className="mt-2 text-xl font-black leading-tight">{session?.title || "Session"}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                <CalendarDays size={13} /> {DAY_LABELS[session?.dayOfWeek] ?? "—"}
                <span className="text-white/40">•</span>
                {fmt12(session?.startTime || "00:00")} – {fmt12(session?.endTime || "00:00")}
              </p>
            </div>
            <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/25">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="grid gap-2 overflow-y-auto p-5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-[#eef2f7] bg-[#f8fafc] px-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e0f2fe] text-[#184e77]">
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="truncate text-sm font-bold text-[#172033]">{value}</p>
              </div>
            </div>
          ))}

          {session?.isRecurring && (
            <p className="mt-1 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <RefreshCw size={12} /> This session recurs every {DAY_LABELS[session?.dayOfWeek] ?? "week"}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TeacherSchedulePage() {
  const { isAuthenticated } = useAuth();
  const assignmentsQuery = useFetchMyAssignments(isAuthenticated);
  const assignments: Assignment[] = assignmentsQuery.data ?? [];
  const [filterJob, setFilterJob] = useState<string>("all");
  const [selected, setSelected] = useState<Assignment | null>(null);

  const jobs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of assignments) {
      if (a.jobId && !seen.has(a.jobId)) seen.set(a.jobId, (a as any).jobId?.title || a.institutionName || "Job");
    }
    return Array.from(seen.entries());
  }, [assignments]);

  const filtered = filterJob === "all" ? assignments : assignments.filter((a) => a.jobId === filterJob);

  const byDay = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const day of DAYS) map.set(day, []);
    for (const a of filtered) {
      const session = a.sessionTemplateId as any;
      const day = session?.dayOfWeek as string;
      if (day && map.has(day)) map.get(day)!.push(a);
    }
    // sort each day's sessions by start time
    for (const list of map.values()) {
      list.sort((x, y) => {
        const sx = (x.sessionTemplateId as any)?.startTime ?? "";
        const sy = (y.sessionTemplateId as any)?.startTime ?? "";
        return sx.localeCompare(sy);
      });
    }
    return map;
  }, [filtered]);

  const totalSessions = filtered.length;
  const activeDays = Array.from(byDay.entries()).filter(([, list]) => list.length > 0).length;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="schedule" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#15466b] via-[#1c5a82] to-[#236d77] text-white">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-end justify-between gap-5 px-6 py-8">
          <div>
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white">
              <ArrowLeft size={15} /> Back to dashboard
            </Link>
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-white/55">
              <Sparkles size={12} /> Rotational Schedule
            </p>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight">My Teaching Schedule</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/70">
              Your assigned rotational sessions, set by the schools you work with. Tap any session to see the full details.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-3xl font-black leading-none">{totalSessions}</p>
              <p className="mt-1 text-xs text-white/65">session{totalSessions === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-3xl font-black leading-none">{activeDays}</p>
              <p className="mt-1 text-xs text-white/65">active day{activeDays === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-screen-xl px-6 py-6">
        {/* Filters */}
        {jobs.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterJob("all")}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${filterJob === "all" ? "bg-[#184e77] text-white shadow-sm" : "border border-[#dbe4ef] bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              All Schools
            </button>
            {jobs.map(([jobId, label]) => (
              <button
                key={jobId}
                onClick={() => setFilterJob(jobId)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${filterJob === jobId ? "bg-[#184e77] text-white shadow-sm" : "border border-[#dbe4ef] bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {assignmentsQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border border-[#dbe4ef] bg-white p-5">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : totalSessions === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0f7ff] text-[#184e77]">
              <CalendarDays size={26} />
            </span>
            <h2 className="mt-4 text-lg font-black text-[#172033]">No sessions assigned yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Once a school assigns you to rotational teaching sessions, they will show up here as a weekly schedule.
            </p>
            <Link to="/jobs" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#1a6091]">
              Browse Rotational Jobs <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {DAYS.map((day) => {
              const dayAssignments = byDay.get(day) ?? [];
              if (dayAssignments.length === 0) return null;
              const isToday = day === TODAY_CODE;
              return (
                <div
                  key={day}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm shadow-slate-900/[0.04] ${isToday ? "border-[#184e77]/40 ring-1 ring-[#184e77]/15" : "border-[#dbe4ef]"}`}
                >
                  <div className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${isToday ? "border-[#184e77]/15 bg-[#f0f7ff]" : "border-[#eef2f7] bg-[#f8fafc]"}`}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#172033]">{DAY_LABELS[day]}</h3>
                      {isToday && (
                        <span className="rounded-full bg-[#184e77] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">Today</span>
                      )}
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-slate-500 ring-1 ring-[#dbe4ef]">
                      {dayAssignments.length} session{dayAssignments.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-2.5 p-3">
                    {dayAssignments.map((a) => {
                      const session = a.sessionTemplateId as any;
                      const tod = partOfDay(session?.startTime);
                      return (
                        <button
                          key={a._id}
                          type="button"
                          onClick={() => setSelected(a)}
                          className="group relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-[#eef2f7] bg-white p-3.5 pl-4 text-left transition hover:border-[#184e77]/25 hover:bg-[#f8fbff] hover:shadow-sm"
                        >
                          <span className={`absolute inset-y-0 left-0 w-1.5 ${tod.bar}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-black text-[#172033]">{session?.title || "Session"}</p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${tod.chip}`}>{tod.label}</span>
                            </div>
                            <div className="mt-2 grid gap-1">
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#172033]">
                                <Clock size={12} className="text-slate-400" />
                                {fmt12(session?.startTime || "00:00")} – {fmt12(session?.endTime || "00:00")}
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500">{durationLabel(session?.startTime, session?.endTime)}</span>
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Building2 size={12} className="text-slate-400" /> {schoolName(a)}
                              </span>
                              {session?.branch && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <MapPin size={12} className="text-slate-400" /> {session.branch}
                                </span>
                              )}
                              {session?.isRecurring && (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                                  <RefreshCw size={11} /> Recurring weekly
                                </span>
                              )}
                            </div>
                            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#184e77] opacity-0 transition group-hover:opacity-100">
                              <Info size={11} /> Tap for details
                            </span>
                          </div>
                          <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-[#184e77]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SessionModal assignment={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
