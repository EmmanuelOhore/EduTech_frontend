import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Users,
  X,
} from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchReplacementCandidates, useFetchReplacements } from "../services/queries";
import { useAssignSubstituteMutation, useCancelReplacementMutation } from "../services/mutation";
import type { ReplacementRequest, SubstituteCandidate } from "../services/base";

const TRIGGER_LABEL: Record<ReplacementRequest["triggerEvent"], string> = {
  NO_SHOW: "No-show",
  RESIGNATION: "Resignation",
  KYC_FAILURE: "KYC failure",
};

const statusTone: Record<ReplacementRequest["status"], string> = {
  OPEN: "bg-amber-50 text-amber-700 ring-amber-100",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const teacherName = (t?: { userId?: { firstName?: string; lastName?: string } }) =>
  [t?.userId?.firstName, t?.userId?.lastName].filter(Boolean).join(" ") || "Instructor";

const sessionLine = (r: ReplacementRequest) => {
  const s = r.sessionTemplateId;
  return `${r.institutionId?.name ?? "School"} · ${s?.dayOfWeek ?? "Day"} ${s?.startTime ?? "--"}-${s?.endTime ?? "--"} · ${s?.subject ?? "Subject"}`;
};

function slaInfo(r: ReplacementRequest): { label: string; overdue: boolean; minutesLeft: number } {
  if (r.status !== "OPEN") return { label: "", overdue: false, minutesLeft: 0 };
  const ms = new Date(r.slaDueAt).getTime() - Date.now();
  if (ms <= 0) return { label: "SLA overdue", overdue: true, minutesLeft: 0 };
  const minutesLeft = Math.floor(ms / 60000);
  const h = Math.floor(minutesLeft / 60);
  const m = minutesLeft % 60;
  return { label: `${h}h ${m}m left`, overdue: false, minutesLeft };
}

const candidateScore = (candidate: SubstituteCandidate) => {
  let score = 0;
  if (candidate.subjectMatch) score += 35;
  if (candidate.levelMatch) score += 20;
  if (candidate.kycStatus === "APPROVED") score += 20;
  if (candidate.rating) score += Math.min(15, Math.round(candidate.rating * 3));
  if (candidate.activeSchools < candidate.maxSchools) score += 10;
  return Math.min(score, 100);
};

const CandidateCard = ({
  candidate,
  request,
  best,
  assigning,
  onAssign,
}: {
  candidate: SubstituteCandidate;
  request: ReplacementRequest;
  best: boolean;
  assigning: boolean;
  onAssign: () => void;
}) => {
  const initials = candidate.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "T";
  const score = candidateScore(candidate);
  const sessionSubject = (request.sessionTemplateId?.subject ?? "").toLowerCase();
  const nearCap = candidate.activeSchools >= candidate.maxSchools - 1;
  const kycApproved = candidate.kycStatus === "APPROVED";

  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm shadow-slate-900/[0.03] ${best ? "border-[#287271] ring-2 ring-[#287271]/10" : "border-[#e5ecf4]"}`}>
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#184e77] text-sm font-black text-white">
          {candidate.profileImage ? (
            <img src={candidate.profileImage} alt={candidate.name} className="size-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-black text-[#172033]">{candidate.name}</p>
            {best && (
              <span className="rounded-full bg-[#287271]/10 px-2 py-0.5 text-[10px] font-black text-[#287271]">
                Best match
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-500">
              {(candidate.level ?? "level unknown").toLowerCase()}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {candidate.subjects.length ? (
              candidate.subjects.map((subject) => (
                <span
                  key={subject}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    subject.toLowerCase() === sessionSubject
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[#eef2f7] text-slate-500"
                  }`}
                >
                  {subject}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">No subjects listed</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onAssign}
          disabled={assigning}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-black text-white transition hover:bg-[#123d5f] disabled:opacity-60"
        >
          <Check size={13} />
          Assign
        </button>
      </div>

      <div className="mt-4 grid gap-3 border-t border-[#eef2f7] pt-3 sm:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Match score</span>
            <span>{score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#287271]" style={{ width: `${score}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-600">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            <span className="truncate">{candidate.location || "Location unknown"}</span>
          </span>
          <span className={`inline-flex items-center gap-1.5 ${nearCap ? "text-amber-600" : "text-slate-600"}`}>
            <Building2 size={13} />
            {candidate.activeSchools}/{candidate.maxSchools} schools
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <CalendarClock size={13} className="text-slate-400" />
            {candidate.activeSessions} sessions
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Star size={13} className={candidate.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
            {candidate.rating ? `${candidate.rating} (${candidate.referenceCount})` : "No reviews"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {kycApproved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <ShieldCheck size={11} />
            KYC verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <ShieldAlert size={11} />
            KYC {(candidate.kycStatus ?? "pending").toLowerCase()}
          </span>
        )}
        {candidate.subjectMatch && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Subject match
          </span>
        )}
        {candidate.levelMatch && (
          <span className="rounded-full bg-[#e0f2fe] px-2 py-0.5 text-[10px] font-bold text-[#184e77]">
            Level match
          </span>
        )}
      </div>
    </article>
  );
};

const SubstituteModal = ({ request, onClose }: { request: ReplacementRequest; onClose: () => void }) => {
  const { data: candidates, isLoading } = useFetchReplacementCandidates(request._id);
  const assign = useAssignSubstituteMutation();
  const s = request.sessionTemplateId;
  const sla = slaInfo(request);

  const doAssign = (teacherId?: string, auto?: boolean) =>
    assign.mutate({ id: request._id, teacherId, auto }, { onSuccess: onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <section className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-[#172033] px-6 py-5 text-white">
          <span className="absolute -right-16 -top-16 size-44 rounded-full bg-[#287271]/40" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/50">Substitute matching</p>
              <h2 className="mt-1 text-2xl font-black">{s?.title ?? "Session"}</h2>
              <p className="mt-1 text-sm text-white/65">{sessionLine(request)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15">
                  Dropped: {teacherName(request.originalTeacherId)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${sla.overdue ? "bg-red-500/20 text-red-100" : "bg-blue-500/20 text-blue-100"}`}>
                  {sla.overdue ? "SLA overdue" : sla.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f7] px-6 py-4">
          <div>
            <p className="text-sm font-black text-[#172033]">Eligible substitutes</p>
            <p className="text-xs text-slate-500">Available, conflict-free, and below school-cap candidates are ranked first.</p>
          </div>
          <button
            type="button"
            onClick={() => doAssign(undefined, true)}
            disabled={assign.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#287271] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1f5f5e] disabled:opacity-60"
          >
            <Sparkles size={15} />
            Auto-assign best
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-5">
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[#dbe4ef] bg-white px-4 py-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding substitutes...
            </div>
          ) : (candidates?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white px-4 py-14 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-black text-[#172033]">No eligible substitutes</p>
              <p className="mt-1 text-xs text-slate-400">No available, conflict-free instructors match this slot right now.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {candidates!.map((candidate, index) => (
                <CandidateCard
                  key={candidate.teacherId}
                  candidate={candidate}
                  request={request}
                  best={index === 0}
                  assigning={assign.isPending}
                  onAssign={() => doAssign(candidate.teacherId)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const DispatchRow = ({
  request,
  onFind,
  onCancel,
  cancelling,
}: {
  request: ReplacementRequest;
  onFind: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) => {
  const sla = slaInfo(request);
  const s = request.sessionTemplateId;
  const open = request.status === "OPEN";

  return (
    <article
      className={`grid gap-4 border-b border-[#eef2f7] bg-white px-5 py-4 transition hover:bg-[#fbfdff] xl:grid-cols-[1.35fr_1fr_0.75fr_1fr_0.85fr] ${
        sla.overdue ? "border-l-4 border-l-red-400" : open ? "border-l-4 border-l-amber-300" : "border-l-4 border-l-emerald-300"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset ${statusTone[request.status]}`}>
            {request.status === "OPEN" ? <AlertTriangle size={11} /> : <Check size={11} />}
            {request.status}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {TRIGGER_LABEL[request.triggerEvent]}
          </span>
        </div>
        <p className="mt-3 truncate text-base font-black text-[#172033]">{s?.title ?? "Session"}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{rInstitutionName(request)}</p>
      </div>

      <div className="min-w-0 text-sm">
        <p className="font-bold text-[#172033]">{s?.dayOfWeek ?? "Day"} {s?.startTime ?? "--"}-{s?.endTime ?? "--"}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{s?.subject ?? "Subject"} coverage</p>
      </div>

      <div>
        {open ? (
          <div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${sla.overdue ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
              <Clock size={12} />
              {sla.label}
            </span>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${sla.overdue ? "bg-red-500" : "bg-[#287271]"}`}
                style={{ width: `${Math.max(8, Math.min(100, (sla.minutesLeft / 1440) * 100))}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
            <CheckCircle2 size={12} />
            Complete
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">Dropped</p>
        <p className="truncate text-sm font-black text-[#172033]">{teacherName(request.originalTeacherId)}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          Replacement: {request.replacementTeacherId ? teacherName(request.replacementTeacherId) : "Not assigned"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
        {open ? (
          <>
            <button
              type="button"
              onClick={onFind}
              className="inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-3 py-2 text-xs font-black text-white transition hover:bg-[#123d5f]"
            >
              Find substitute <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="rounded-xl border border-[#dbe4ef] px-3 py-2 text-xs font-black text-slate-500 transition hover:bg-[#f8fafc] disabled:opacity-60"
            >
              Cancel
            </button>
          </>
        ) : (
          <span className="rounded-xl bg-[#f8fafc] px-3 py-2 text-xs font-black text-slate-500">
            No action needed
          </span>
        )}
      </div>
    </article>
  );
};

const rInstitutionName = (request: ReplacementRequest) =>
  request.institutionId?.name ?? request.jobId?.title ?? "School";

const AdminReplacementsPage = () => {
  const [tab, setTab] = useState<"OPEN" | "RESOLVED" | "ALL">("OPEN");
  const statusFilter = tab === "ALL" ? undefined : tab;
  const { data: requests, isLoading } = useFetchReplacements(statusFilter);
  const cancel = useCancelReplacementMutation();
  const [active, setActive] = useState<ReplacementRequest | null>(null);

  const list = requests ?? [];

  const metrics = useMemo(() => {
    const open = list.filter((request) => request.status === "OPEN");
    const overdue = open.filter((request) => slaInfo(request).overdue);
    const resolved = list.filter((request) => request.status === "RESOLVED");
    const nextDue = open
      .map((request) => slaInfo(request).minutesLeft)
      .filter((minutes) => minutes > 0)
      .sort((a, b) => a - b)[0];
    return {
      open: open.length,
      overdue: overdue.length,
      resolved: resolved.length,
      nextDue,
    };
  }, [list]);

  return (
    <SuperAdminLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Continuity control</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#172033]">Replacements</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor coverage gaps, protect SLA windows, and dispatch vetted substitutes quickly.
          </p>
        </div>
        <div className="flex rounded-2xl border border-[#dbe4ef] bg-white p-1 shadow-sm shadow-slate-900/[0.03]">
          {(["OPEN", "RESOLVED", "ALL"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                tab === item ? "bg-[#184e77] text-white shadow-sm" : "text-slate-500 hover:bg-[#f8fafc] hover:text-[#184e77]"
              }`}
            >
              {item === "ALL" ? "All" : item.charAt(0) + item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
          <TimerReset className="text-amber-500" size={19} />
          <p className="mt-3 text-2xl font-black text-[#172033]">{metrics.open}</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Open incidents</p>
        </div>
        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
          <Radar className="text-red-500" size={19} />
          <p className="mt-3 text-2xl font-black text-[#172033]">{metrics.overdue}</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">SLA risks</p>
        </div>
        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
          <CheckCircle2 className="text-emerald-500" size={19} />
          <p className="mt-3 text-2xl font-black text-[#172033]">{metrics.resolved}</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Resolved</p>
        </div>
        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
          <Clock className="text-[#184e77]" size={19} />
          <p className="mt-3 text-2xl font-black text-[#172033]">{metrics.nextDue ?? 0}m</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Next SLA</p>
        </div>
      </section>

      <section className="mb-5 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.03]">
        <div className="grid gap-4 border-b border-[#eef2f7] bg-[#f8fafc] px-5 py-4 md:grid-cols-[0.85fr_1fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Dispatch protocol</p>
            <p className="mt-1 text-sm font-bold text-[#172033]">Triage each gap by SLA, session impact, and substitute readiness.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-amber-50 text-amber-600">1</span>
            <div>
              <p className="text-sm font-black text-[#172033]">Confirm gap</p>
              <p className="text-xs text-slate-500">No-show, resignation, or KYC failure.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#e0f2fe] text-[#184e77]">2</span>
            <div>
              <p className="text-sm font-black text-[#172033]">Dispatch coverage</p>
              <p className="text-xs text-slate-500">Find a conflict-free, verified substitute.</p>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#dbe4ef] bg-white px-5 py-12 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading replacement incidents...
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dbe4ef] bg-white py-16 text-center shadow-sm shadow-slate-900/[0.03]">
          <Check className="mx-auto h-9 w-9 text-emerald-400" />
          <p className="mt-3 text-base font-black text-[#172033]">Continuity is clear</p>
          <p className="mt-1 text-sm text-slate-400">No {tab === "ALL" ? "" : tab.toLowerCase()} replacement requests right now.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
          <div className="grid gap-4 bg-[#f8fafc] px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400 xl:grid-cols-[1.35fr_1fr_0.75fr_1fr_0.85fr]">
            <span>Incident</span>
            <span>Session</span>
            <span>SLA</span>
            <span>Coverage</span>
            <span className="xl:text-right">Action</span>
          </div>
          <div>
            {list.map((request) => (
              <DispatchRow
                key={request._id}
                request={request}
                onFind={() => setActive(request)}
                onCancel={() => cancel.mutate(request._id)}
                cancelling={cancel.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {active && <SubstituteModal request={active} onClose={() => setActive(null)} />}
    </SuperAdminLayout>
  );
};

export default AdminReplacementsPage;
