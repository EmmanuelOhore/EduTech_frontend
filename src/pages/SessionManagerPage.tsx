import { useState } from "react";
import {
  ArrowLeft, Calendar, CheckCircle2, ChevronRight, Clock,
  Edit3, Grid3X3, LayoutList, MapPin, Plus, RefreshCw,
  Trash2, UserCheck, Users, X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import AdminLayout from "../layout/AdminLayout";
import {
  useFetchJob, useFetchJobApplications, useFetchRosterByJob,
} from "../services/queries";
import {
  useCreateAssignmentMutation, useCreateSessionMutation,
  useDeleteAssignmentMutation, useDeleteSessionMutation, useUpdateSessionMutation,
} from "../services/mutation";
import type { CreateSessionPayload, DayOfWeek, RosterSession, SessionTemplate } from "../types/TypeChecks";

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "MON", label: "Monday",    short: "Mon" },
  { key: "TUE", label: "Tuesday",   short: "Tue" },
  { key: "WED", label: "Wednesday", short: "Wed" },
  { key: "THU", label: "Thursday",  short: "Thu" },
  { key: "FRI", label: "Friday",    short: "Fri" },
  { key: "SAT", label: "Saturday",  short: "Sat" },
  { key: "SUN", label: "Sunday",    short: "Sun" },
];

const DAY_COLORS: Record<DayOfWeek, { bg: string; border: string; text: string; dot: string }> = {
  MON: { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   dot: "bg-blue-400" },
  TUE: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-400" },
  WED: { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   dot: "bg-teal-400" },
  THU: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-400" },
  FRI: { bg: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-700",   dot: "bg-rose-400" },
  SAT: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400" },
  SUN: { bg: "bg-pink-50",   border: "border-pink-200",   text: "text-pink-700",   dot: "bg-pink-400" },
};

const fmt12 = (t?: string) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

type SessionForm = Omit<CreateSessionPayload, "jobId">;

const emptyForm: SessionForm = {
  title: "", subject: "", classGroup: "", branch: "", location: "",
  dayOfWeek: "MON", startTime: "09:00", endTime: "11:00",
  isRecurring: true, activeFrom: "", activeTo: "", neededTeachers: 1, notes: "",
};

// ── Assignment Panel ───────────────────────────────────────────────
const AssignmentPanel = ({
  session, jobId, acceptedApplications, onClose,
}: {
  session: RosterSession;
  jobId: string;
  acceptedApplications: any[];
  onClose: () => void;
}) => {
  const createAssignment = useCreateAssignmentMutation(jobId);
  const deleteAssignment = useDeleteAssignmentMutation(jobId);
  const assignedTeacherIds = new Set(session.assignments.map(a => a.teacherId));
  const colors = DAY_COLORS[session.dayOfWeek] ?? DAY_COLORS.MON;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-[#dbe4ef] px-6 py-5">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-white" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.border} ${colors.text}`}>
                  <span className={`size-1.5 rounded-full ${colors.dot}`} />
                  {DAYS.find(d => d.key === session.dayOfWeek)?.label}
                </span>
                <span className="text-[11px] text-slate-400">{fmt12(session.startTime)} – {fmt12(session.endTime)}</span>
              </div>
              <h2 className="mt-1.5 text-lg font-bold text-[#172033]">{session.title}</h2>
              <p className="text-xs text-slate-500">
                {session.subject}{session.classGroup ? ` · ${session.classGroup}` : ""}{session.branch ? ` · ${session.branch}` : ""}
              </p>
            </div>
            <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-xl border border-[#dbe4ef] text-slate-400 hover:bg-slate-100">
              <X size={15} />
            </button>
          </div>
          {/* Slot progress */}
          <div className="relative mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">{session.assignments.length} of {session.neededTeachers} slots filled</span>
              <span className={session.assignments.length >= session.neededTeachers ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                {session.assignments.length >= session.neededTeachers ? "Full ✓" : `${session.neededTeachers - session.assignments.length} open`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${session.assignments.length >= session.neededTeachers ? "bg-emerald-500" : "bg-amber-400"}`}
                style={{ width: `${Math.min(100, (session.assignments.length / Math.max(session.neededTeachers, 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 divide-y divide-[#f1f5f9] px-6 py-5 space-y-5">
          {session.assignments.length > 0 && (
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Assigned Teachers</p>
              <div className="space-y-2">
                {session.assignments.map(a => (
                  <div key={a.assignmentId} className="flex items-center justify-between rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-full bg-teal-600 text-sm font-bold text-white shadow-sm">
                        {(a.teacherName ?? "T").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">{a.teacherName ?? "Unknown Teacher"}</p>
                        <p className="text-[11px] text-slate-500">{a.teacherLevel}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAssignment.mutate(a.assignmentId)}
                      disabled={deleteAssignment.isPending}
                      className="rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-500 transition hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
                    >Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={session.assignments.length > 0 ? "pt-5" : ""}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Available Teachers ({acceptedApplications.filter(a => !assignedTeacherIds.has(a.teacherId)).length})
            </p>
            {acceptedApplications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#dbe4ef] px-4 py-8 text-center">
                <p className="text-sm text-slate-400">No accepted teachers yet for this job.</p>
                <p className="mt-1 text-xs text-slate-400">Accept teacher applications to enable assignments.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {acceptedApplications.filter(a => !assignedTeacherIds.has(a.teacherId)).map(app => (
                  <div key={app.id} className="flex items-center justify-between rounded-xl border border-[#dbe4ef] bg-white px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/30">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-full bg-[#e0f2fe] text-sm font-bold text-[#184e77]">
                        {(app.teacherName ?? "T").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">{app.teacherName}</p>
                        <p className="text-[11px] text-slate-500">{app.teacherLevel} · {app.teacherLocation}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => createAssignment.mutate({ teacherId: app.teacherId!, sessionTemplateId: session._id, jobId })}
                      disabled={createAssignment.isPending}
                      className="rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                    >Assign</button>
                  </div>
                ))}
                {acceptedApplications.filter(a => assignedTeacherIds.has(a.teacherId)).map(app => (
                  <div key={app.id} className="flex items-center gap-3 rounded-xl border border-[#dbe4ef] bg-slate-50 px-4 py-3 opacity-50">
                    <CheckCircle2 size={13} className="text-teal-500" />
                    <p className="text-sm text-slate-500">{app.teacherName} — assigned</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Session Form Drawer ────────────────────────────────────────────
const SessionDrawer = ({
  jobId, editSession, onClose,
}: {
  jobId: string;
  editSession?: SessionTemplate | null;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<SessionForm>(editSession ? {
    title: editSession.title, subject: editSession.subject, classGroup: editSession.classGroup ?? "",
    branch: editSession.branch ?? "", location: editSession.location ?? "",
    dayOfWeek: editSession.dayOfWeek, startTime: editSession.startTime, endTime: editSession.endTime,
    isRecurring: editSession.isRecurring, activeFrom: editSession.activeFrom?.slice(0, 10) ?? "",
    activeTo: editSession.activeTo?.slice(0, 10) ?? "", neededTeachers: editSession.neededTeachers, notes: editSession.notes ?? "",
  } : emptyForm);

  const createMutation = useCreateSessionMutation(jobId);
  const updateMutation = useUpdateSessionMutation(jobId);

  const handleSave = () => {
    if (!form.title || !form.subject) { toast.error("Title and subject are required"); return; }
    if (form.startTime >= form.endTime) { toast.error("End time must be after start time"); return; }
    const payload = { ...form, jobId };
    if (editSession) {
      updateMutation.mutate({ id: editSession._id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const colors = DAY_COLORS[form.dayOfWeek] ?? DAY_COLORS.MON;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="border-b border-[#dbe4ef] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600">{editSession ? "Edit" : "New"} Session</p>
              <h2 className="text-lg font-bold text-[#172033]">{editSession ? "Edit Session" : "Create Session Template"}</h2>
            </div>
            <button onClick={onClose} className="grid size-8 place-items-center rounded-xl border border-[#dbe4ef] text-slate-400 hover:bg-slate-100">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 px-6 py-5">
          {[
            { label: "Session Title *", key: "title", ph: "e.g. SS2 Physics Revision" },
            { label: "Subject *", key: "subject", ph: "e.g. Physics" },
            { label: "Class Group", key: "classGroup", ph: "e.g. SS2A" },
            { label: "Branch / Location", key: "branch", ph: "e.g. Ikeja branch" },
          ].map(f => (
            <div key={f.key}>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">{f.label}</label>
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.ph}
                className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          ))}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Day of Week</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map(d => {
                const dc = DAY_COLORS[d.key];
                const sel = form.dayOfWeek === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, dayOfWeek: d.key }))}
                    className={`rounded-lg py-2 text-[10px] font-bold transition ${sel ? `${dc.bg} ${dc.border} ${dc.text} border shadow-sm` : "border border-transparent text-slate-400 hover:bg-slate-50"}`}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
            <p className={`mt-1.5 text-[11px] font-semibold ${colors.text}`}>
              Selected: {DAYS.find(d => d.key === form.dayOfWeek)?.label}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Teacher Slots Needed</label>
            <input type="number" min={1} value={form.neededTeachers}
              onChange={e => setForm(p => ({ ...p, neededTeachers: Number(e.target.value) }))}
              className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dbe4ef] px-4 py-3 transition hover:bg-slate-50">
            <input type="checkbox" checked={form.isRecurring}
              onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 accent-teal-600" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Recurring weekly</p>
              <p className="text-xs text-slate-400">Session repeats on the same day every week</p>
            </div>
          </label>

          {!form.isRecurring && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Active From</label>
                <input type="date" value={form.activeFrom} onChange={e => setForm(p => ({ ...p, activeFrom: e.target.value }))}
                  className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Active To</label>
                <input type="date" value={form.activeTo} onChange={e => setForm(p => ({ ...p, activeTo: e.target.value }))}
                  className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Internal notes about this session..."
              className="w-full resize-none rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>
        </div>

        <div className="border-t border-[#dbe4ef] px-6 py-4">
          <button onClick={handleSave} disabled={isSaving}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60">
            {isSaving ? "Saving..." : editSession ? "Update Session" : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Session Card ───────────────────────────────────────────────────
const SessionCard = ({
  session,
  onEdit,
  onDelete,
  onAssign,
}: {
  session: RosterSession;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) => {
  const filled = session.assignments.length;
  const needed = session.neededTeachers;
  const pct = Math.min(100, needed > 0 ? (filled / needed) * 100 : 0);
  const isFull = filled >= needed && needed > 0;
  const colors = DAY_COLORS[session.dayOfWeek] ?? DAY_COLORS.MON;

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm shadow-slate-900/[0.04] transition hover:shadow-md ${isFull ? "border-emerald-200" : needed > 0 && filled === 0 ? "border-amber-200" : "border-[#dbe4ef]"}`}>
      {/* Coloured day pill strip */}
      <div className={`flex items-center gap-2 px-4 py-2.5 ${colors.bg}`}>
        <span className={`size-2 rounded-full ${colors.dot}`} />
        <span className={`text-[11px] font-bold ${colors.text}`}>{DAYS.find(d => d.key === session.dayOfWeek)?.label}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-500">
          <Clock size={10} />
          {fmt12(session.startTime)} – {fmt12(session.endTime)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug text-[#172033]">{session.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{session.subject}{session.classGroup ? ` · ${session.classGroup}` : ""}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={onEdit} className="grid size-7 place-items-center rounded-lg border border-[#dbe4ef] text-slate-400 transition hover:bg-slate-100">
              <Edit3 size={12} />
            </button>
            <button onClick={onDelete} className="grid size-7 place-items-center rounded-lg border border-[#dbe4ef] text-red-400 transition hover:bg-red-50">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-3 space-y-1 text-xs text-slate-500">
          {session.branch && (
            <div className="flex items-center gap-1.5"><MapPin size={10} className="text-slate-400" /> {session.branch}</div>
          )}
          {session.isRecurring && (
            <div className="flex items-center gap-1.5 text-teal-600 font-medium"><RefreshCw size={10} /> Recurring weekly</div>
          )}
        </div>

        {/* Slot progress */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <Users size={10} /> {filled}/{needed} filled
            </span>
            {isFull ? (
              <span className="text-[10px] font-bold text-emerald-600">● Full</span>
            ) : (
              <span className="text-[10px] font-bold text-amber-500">{needed - filled} open</span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${isFull ? "bg-emerald-500" : filled > 0 ? "bg-amber-400" : "bg-slate-200"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Assigned teacher chips */}
        {session.assignments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {session.assignments.map(a => (
              <span key={a.assignmentId} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700">
                <UserCheck size={9} /> {(a.teacherName ?? "Teacher").split(" ")[0]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <button
        onClick={onAssign}
        className="flex items-center justify-center gap-2 border-t border-[#f1f5f9] bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
      >
        <UserCheck size={12} /> Manage Teachers <ChevronRight size={11} />
      </button>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────
type ViewMode = "grid" | "weekly";

export default function SessionManagerPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const jobQuery = useFetchJob(jobId);
  const rosterQuery = useFetchRosterByJob(jobId);
  const applicationsQuery = useFetchJobApplications(jobId);
  const deleteMutation = useDeleteSessionMutation(jobId);

  const [view, setView] = useState<ViewMode>("grid");
  const [showSessionDrawer, setShowSessionDrawer] = useState(false);
  const [editSession, setEditSession] = useState<SessionTemplate | null>(null);
  const [assignSession, setAssignSession] = useState<RosterSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const job = jobQuery.data;
  const roster: RosterSession[] = rosterQuery.data ?? [];
  const acceptedApplications = (applicationsQuery.data ?? []).filter(a => a.status === "ACCEPTED");

  const filledSlots = roster.reduce((n, s) => n + s.assignments.length, 0);
  const totalSlots  = roster.reduce((n, s) => n + s.neededTeachers, 0);
  const openSlots   = Math.max(0, totalSlots - filledSlots);
  const pctFilled   = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const openEdit   = (s: SessionTemplate) => { setEditSession(s); setShowSessionDrawer(true); };
  const closeDrawer = () => { setShowSessionDrawer(false); setEditSession(null); };
  const handleDelete = (id: string) => { deleteMutation.mutate(id, { onSuccess: () => setConfirmDelete(null) }); };

  // Group sessions by day for weekly view
  const sessionsByDay = DAYS.map(d => ({
    ...d,
    sessions: roster.filter(s => s.dayOfWeek === d.key).sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")),
  })).filter(d => d.sessions.length > 0);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-screen-xl px-6 py-8">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="mb-6">
          <Link
            to="/school/sessions"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#184e77] hover:underline"
          >
            <ArrowLeft size={14} /> Rotational Sessions
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white shadow-sm shadow-teal-600/30">
                <Calendar size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-600">Session Manager</p>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">Rotational</span>
                </div>
                <h1 className="mt-0.5 text-xl font-bold text-[#172033]">{job?.title ?? "Loading..."}</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  {job?.subject}{job?.location ? ` · ${job.location}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setEditSession(null); setShowSessionDrawer(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700"
            >
              <Plus size={16} /> Add Session
            </button>
          </div>
        </div>

        {/* ── Stats bar ────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Sessions",          value: roster.length,            sub: "templates",      accent: "bg-teal-500" },
            { label: "Accepted Teachers", value: acceptedApplications.length, sub: "available",   accent: "bg-blue-500" },
            { label: "Filled Slots",      value: filledSlots,              sub: `of ${totalSlots} total`, accent: "bg-emerald-500" },
            { label: "Open Slots",        value: openSlots,                sub: `${pctFilled}% filled`, accent: openSlots > 0 ? "bg-amber-400" : "bg-emerald-500" },
          ].map(stat => (
            <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
              <div className={`absolute left-0 top-0 h-full w-1 ${stat.accent}`} />
              <p className="pl-2 text-2xl font-bold text-[#172033]">{stat.value}</p>
              <p className="pl-2 text-[11px] font-semibold text-slate-500">{stat.label}</p>
              <p className="pl-2 text-[10px] text-slate-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Overall progress ─────────────────────────────────────── */}
        {totalSlots > 0 && (
          <div className="mb-6 rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Overall roster completion</span>
              <span className={`font-bold ${pctFilled === 100 ? "text-emerald-600" : "text-amber-600"}`}>{pctFilled}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pctFilled === 100 ? "bg-emerald-500" : "bg-teal-500"}`}
                style={{ width: `${pctFilled}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">{filledSlots} of {totalSlots} teacher slots assigned across {roster.length} session{roster.length !== 1 ? "s" : ""}</p>
          </div>
        )}

        {/* ── View toggle + Roster ─────────────────────────────────── */}
        {rosterQuery.isLoading ? (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-16 text-center text-sm text-slate-400">
            Loading sessions...
          </div>
        ) : roster.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white px-6 py-20 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-teal-50">
              <Calendar size={28} className="text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-[#172033]">No sessions yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Create your first session template to start building this rotational schedule.
            </p>
            <button
              onClick={() => setShowSessionDrawer(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Plus size={16} /> Add First Session
            </button>
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                {roster.length} session{roster.length !== 1 ? "s" : ""}
                {view === "weekly" ? ` across ${sessionsByDay.length} day${sessionsByDay.length !== 1 ? "s" : ""}` : ""}
              </p>
              <div className="flex rounded-xl border border-[#dbe4ef] bg-white p-1">
                <button
                  onClick={() => setView("grid")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view === "grid" ? "bg-[#184e77] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Grid3X3 size={12} /> Grid
                </button>
                <button
                  onClick={() => setView("weekly")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view === "weekly" ? "bg-[#184e77] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <LayoutList size={12} /> Weekly
                </button>
              </div>
            </div>

            {view === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roster.map(session => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    onEdit={() => openEdit(session)}
                    onDelete={() => setConfirmDelete(session._id)}
                    onAssign={() => setAssignSession(session)}
                  />
                ))}
              </div>
            ) : (
              /* Weekly view */
              <div className="space-y-4">
                {sessionsByDay.map(day => {
                  const dc = DAY_COLORS[day.key as DayOfWeek];
                  return (
                    <div key={day.key} className="rounded-2xl border border-[#dbe4ef] bg-white overflow-hidden shadow-sm shadow-slate-900/[0.03]">
                      {/* Day header */}
                      <div className={`flex items-center gap-3 px-5 py-3 ${dc.bg}`}>
                        <span className={`size-2.5 rounded-full ${dc.dot}`} />
                        <span className={`text-sm font-bold ${dc.text}`}>{day.label}</span>
                        <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold ${dc.bg} ${dc.border} ${dc.text}`}>
                          {day.sessions.length} session{day.sessions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {/* Sessions in this day */}
                      <div className="divide-y divide-[#f1f5f9]">
                        {day.sessions.map(session => {
                          const filled = session.assignments.length;
                          const needed = session.neededTeachers;
                          const pctS = Math.min(100, needed > 0 ? (filled / needed) * 100 : 0);
                          const full  = filled >= needed && needed > 0;
                          return (
                            <div key={session._id} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center">
                              {/* Time block */}
                              <div className={`flex shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-2 text-center ${dc.bg} ${dc.border}`}>
                                <p className={`text-sm font-bold ${dc.text}`}>{fmt12(session.startTime)}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">to</p>
                                <p className={`text-sm font-bold ${dc.text}`}>{fmt12(session.endTime)}</p>
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[#172033]">{session.title}</p>
                                    <p className="text-xs text-slate-500">{session.subject}{session.classGroup ? ` · ${session.classGroup}` : ""}{session.branch ? ` · ${session.branch}` : ""}</p>
                                  </div>
                                  <div className="flex shrink-0 gap-1">
                                    <button onClick={() => openEdit(session)} className="grid size-6 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><Edit3 size={11} /></button>
                                    <button onClick={() => setConfirmDelete(session._id)} className="grid size-6 place-items-center rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={11} /></button>
                                  </div>
                                </div>
                                {/* Mini progress */}
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                      <div className={`h-full rounded-full ${full ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pctS}%` }} />
                                    </div>
                                  </div>
                                  <span className="shrink-0 text-[11px] font-semibold text-slate-500">{filled}/{needed}</span>
                                  {session.assignments.length > 0 && (
                                    <div className="flex -space-x-1">
                                      {session.assignments.slice(0, 3).map(a => (
                                        <div key={a.assignmentId} className="grid size-5 place-items-center rounded-full bg-teal-600 text-[8px] font-bold text-white ring-1 ring-white">
                                          {(a.teacherName ?? "T").charAt(0)}
                                        </div>
                                      ))}
                                      {session.assignments.length > 3 && (
                                        <div className="grid size-5 place-items-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-600 ring-1 ring-white">
                                          +{session.assignments.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Assign button */}
                              <button
                                onClick={() => setAssignSession(session)}
                                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${full ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"}`}
                              >
                                <UserCheck size={12} /> {full ? "View Roster" : "Assign"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawers */}
      {showSessionDrawer && <SessionDrawer jobId={jobId!} editSession={editSession} onClose={closeDrawer} />}
      {assignSession && (
        <AssignmentPanel
          session={assignSession}
          jobId={jobId!}
          acceptedApplications={acceptedApplications}
          onClose={() => setAssignSession(null)}
        />
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-1 grid size-10 place-items-center rounded-xl bg-red-50">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="mt-3 text-base font-bold text-[#172033]">Delete Session?</h3>
            <p className="mt-1.5 text-sm text-slate-500">
              This will cancel all active teacher assignments for this session. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-[#dbe4ef] py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
