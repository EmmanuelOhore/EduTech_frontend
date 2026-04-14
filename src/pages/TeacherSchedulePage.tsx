import { useMemo, useState } from "react";
import { ArrowLeft, Building2, Calendar, Clock, MapPin, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useFetchMyAssignments } from "../services/queries";
import type { Assignment } from "../types/TypeChecks";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"] as const;
const DAY_LABELS: Record<string, string> = { MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday",SAT:"Saturday",SUN:"Sunday" };

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ampm}`;
};

export default function TeacherSchedulePage() {
  const { isAuthenticated } = useAuth();
  const assignmentsQuery = useFetchMyAssignments(isAuthenticated);
  const assignments: Assignment[] = assignmentsQuery.data ?? [];
  const [filterJob, setFilterJob] = useState<string>("all");

  const jobs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of assignments) {
      if (a.jobId && !seen.has(a.jobId)) seen.set(a.jobId, (a as any).jobId?.title || a.institutionName || "Job");
    }
    return Array.from(seen.entries());
  }, [assignments]);

  const filtered = filterJob === "all" ? assignments : assignments.filter(a => a.jobId === filterJob);

  const byDay = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const day of DAYS) map.set(day, []);
    for (const a of filtered) {
      const session = a.sessionTemplateId as any;
      const day = session?.dayOfWeek as string;
      if (day && map.has(day)) map.get(day)!.push(a);
    }
    return map;
  }, [filtered]);

  const totalSessions = filtered.length;
  const activeDays = Array.from(byDay.entries()).filter(([, list]) => list.length > 0).length;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="schedule" />

      <section className="border-b border-[#dbe4ef] bg-white">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div>
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#184e77] hover:underline">
              <ArrowLeft size={15} /> Back to dashboard
            </Link>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Rotational Schedule</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#172033]">My Teaching Schedule</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Your assigned rotational sessions. These are set by the schools you work with.</p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-teal-200 bg-teal-50 px-6 py-4 text-teal-700">
              <p className="text-3xl font-semibold">{totalSessions}</p>
              <p className="text-xs">session{totalSessions === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-4 text-[#172033]">
              <p className="text-3xl font-semibold">{activeDays}</p>
              <p className="text-xs">active day{activeDays === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-screen-xl px-6 py-6">
        {/* Filters */}
        {jobs.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setFilterJob("all")} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filterJob === "all" ? "bg-teal-600 text-white" : "border border-[#dbe4ef] bg-white text-slate-600 hover:bg-slate-50"}`}>All Schools</button>
            {jobs.map(([jobId, label]) => (
              <button key={jobId} onClick={() => setFilterJob(jobId)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filterJob === jobId ? "bg-teal-600 text-white" : "border border-[#dbe4ef] bg-white text-slate-600 hover:bg-slate-50"}`}>{label}</button>
            ))}
          </div>
        )}

        {assignmentsQuery.isLoading ? (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-16 text-center text-sm text-slate-400">Loading your schedule...</div>
        ) : totalSessions === 0 ? (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-16 text-center">
            <Calendar size={32} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-lg font-semibold text-[#172033]">No sessions assigned yet</h2>
            <p className="mt-2 text-sm text-slate-500">Once a school assigns you to rotational teaching sessions, they will appear here.</p>
            <Link to="/jobs" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a6091]">Browse Rotational Jobs</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DAYS.map(day => {
              const dayAssignments = byDay.get(day) ?? [];
              if (dayAssignments.length === 0) return null;
              return (
                <div key={day} className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
                  <h3 className="mb-3 border-b border-[#dbe4ef] pb-3 text-sm font-semibold text-[#184e77]">{DAY_LABELS[day]}</h3>
                  <div className="space-y-3">
                    {dayAssignments.map(a => {
                      const session = a.sessionTemplateId as any;
                      return (
                        <div key={a._id} className="rounded-xl border border-teal-100 bg-teal-50 p-3">
                          <p className="text-sm font-semibold text-teal-800">{session?.title || "Session"}</p>
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-teal-700">
                              <Clock size={11} /> {fmt12(session?.startTime || "00:00")} – {fmt12(session?.endTime || "00:00")}
                            </div>
                            {(a.institutionName || (a as any).institutionId?.name) && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Building2 size={11} /> {a.institutionName || (a as any).institutionId?.name}
                              </div>
                            )}
                            {session?.branch && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin size={11} /> {session.branch}
                              </div>
                            )}
                            {session?.isRecurring && (
                              <div className="flex items-center gap-1.5 text-xs text-teal-600">
                                <RefreshCw size={10} /> Recurring weekly
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
