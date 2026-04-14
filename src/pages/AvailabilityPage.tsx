import { useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Edit3, MapPin, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useFetchMyAvailability } from "../services/queries";
import { useDeleteAvailabilityMutation, useUpsertAvailabilityMutation } from "../services/mutation";
import type { DayOfWeek, TeacherAvailability } from "../types/TypeChecks";

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "MON", label: "Monday",    short: "Mon" },
  { key: "TUE", label: "Tuesday",   short: "Tue" },
  { key: "WED", label: "Wednesday", short: "Wed" },
  { key: "THU", label: "Thursday",  short: "Thu" },
  { key: "FRI", label: "Friday",    short: "Fri" },
  { key: "SAT", label: "Saturday",  short: "Sat" },
  { key: "SUN", label: "Sunday",    short: "Sun" },
];

type AvailForm = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  locationPreference: string;
  availableForWeekend: boolean;
  availableForEvening: boolean;
  notes: string;
};

const emptyForm = (day: DayOfWeek): AvailForm => ({
  dayOfWeek: day,
  startTime: "09:00",
  endTime: "17:00",
  locationPreference: "",
  availableForWeekend: ["SAT","SUN"].includes(day),
  availableForEvening: false,
  notes: "",
});

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
};

export default function AvailabilityPage() {
  const { isAuthenticated } = useAuth();
  const availQuery = useFetchMyAvailability(isAuthenticated);
  const upsertMutation = useUpsertAvailabilityMutation();
  const deleteMutation = useDeleteAvailabilityMutation();

  const [editDay, setEditDay] = useState<DayOfWeek | null>(null);
  const [form, setForm] = useState<AvailForm | null>(null);

  const availability: TeacherAvailability[] = availQuery.data ?? [];
  const byDay = new Map(availability.map(a => [a.dayOfWeek, a]));
  const setDays = availability.length;

  const openEdit = (day: DayOfWeek) => {
    const existing = byDay.get(day);
    setForm(existing ? {
      dayOfWeek: day,
      startTime: existing.startTime,
      endTime: existing.endTime,
      locationPreference: existing.locationPreference ?? "",
      availableForWeekend: existing.availableForWeekend,
      availableForEvening: existing.availableForEvening,
      notes: existing.notes ?? "",
    } : emptyForm(day));
    setEditDay(day);
  };

  const handleSave = () => {
    if (!form) return;
    if (form.startTime >= form.endTime) { toast.error("End time must be after start time"); return; }
    upsertMutation.mutate({ slots: [form] }, { onSuccess: () => setEditDay(null) });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setEditDay(null) });
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="availability" />

      <section className="border-b border-[#dbe4ef] bg-white">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div>
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#184e77] hover:underline">
              <ArrowLeft size={15} /> Back to dashboard
            </Link>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Scheduling</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#172033]">My Availability</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tell schools when you are free to teach. This information is used when assigning you to rotational sessions.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-6 py-4 text-teal-700">
            <p className="text-3xl font-semibold">{setDays}</p>
            <p className="text-xs">day{setDays === 1 ? "" : "s"} configured</p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
        {availQuery.isLoading ? (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-16 text-center text-sm text-slate-400">Loading availability...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DAYS.map(day => {
              const slot = byDay.get(day.key);
              return (
                <div key={day.key} className={`rounded-2xl border bg-white p-5 shadow-sm shadow-slate-900/[0.04] ${slot ? "border-teal-200" : "border-[#dbe4ef]"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${slot ? "text-teal-700" : "text-slate-400"}`}>{day.label}</span>
                    {slot && <CheckCircle2 size={15} className="text-teal-600" />}
                  </div>
                  {slot ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock size={12} />
                        {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
                      </div>
                      {slot.locationPreference && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin size={12} /> {slot.locationPreference}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {slot.availableForWeekend && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">Weekend OK</span>}
                        {slot.availableForEvening && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">Evening OK</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Not set</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openEdit(day.key)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#dbe4ef] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
                      {slot ? <><Edit3 size={11} /> Edit</> : <><Plus size={11} /> Set</>}
                    </button>
                    {slot && (
                      <button onClick={() => handleDelete(slot._id)} disabled={deleteMutation.isPending} className="flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-2.5 py-2 text-xs text-red-500 transition hover:bg-red-100">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {editDay && form && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditDay(null)} />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dbe4ef] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Availability</p>
                <h2 className="text-lg font-semibold text-[#172033]">{DAYS.find(d => d.key === editDay)?.label}</h2>
              </div>
              <button onClick={() => setEditDay(null)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 space-y-5 px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => f ? { ...f, startTime: e.target.value } : f)} className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => f ? { ...f, endTime: e.target.value } : f)} className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Location Preference (optional)</label>
                <input type="text" placeholder="e.g. Lagos Island, Ikeja" value={form.locationPreference} onChange={e => setForm(f => f ? { ...f, locationPreference: e.target.value } : f)} className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-600">Preferences</label>
                {[
                  { key: "availableForWeekend" as const, label: "Available for weekend sessions" },
                  { key: "availableForEvening" as const, label: "Available for evening sessions (after 5pm)" },
                ].map(opt => (
                  <label key={opt.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dbe4ef] px-4 py-3 hover:bg-slate-50">
                    <input type="checkbox" checked={form[opt.key]} onChange={e => setForm(f => f ? { ...f, [opt.key]: e.target.checked } : f)} className="h-4 w-4 rounded border-slate-300 accent-teal-600" />
                    <span className="text-sm text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Notes (optional)</label>
                <textarea rows={3} placeholder="Any additional notes for schools..." value={form.notes} onChange={e => setForm(f => f ? { ...f, notes: e.target.value } : f)} className="w-full rounded-xl border border-[#dbe4ef] px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="border-t border-[#dbe4ef] px-6 py-4">
              <button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60">
                {upsertMutation.isPending ? "Saving..." : "Save Availability"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
