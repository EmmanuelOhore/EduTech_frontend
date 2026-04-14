import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Quote,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { useCreateTeacherReferenceMutation, useDeleteTeacherReferenceMutation } from "../services/mutation";
import { useFetchInstitutionApplications, useFetchInstitutionTeacherReferences } from "../services/queries";
import type { JobApplication, TeacherReference } from "../types/TypeChecks";

const ITEMS_PER_PAGE = 6;

type AcceptedTeacherOption = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherLevel: string;
  subject?: string;
  teacherLocation: string;
  acceptedJobs: { jobId: string; title: string; location: string; subject?: string }[];
};

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
      />
    ))}
  </div>
);

const AddPanel = ({
  open,
  teacherOptions,
  onClose,
  onSave,
  isSaving,
}: {
  open: boolean;
  teacherOptions: AcceptedTeacherOption[];
  onClose: () => void;
  onSave: (payload: { teacherId: string; jobId: string; rating: number; referenceText: string }) => void;
  isSaving: boolean;
}) => {
  const initialTeacher = teacherOptions[0];
  const [teacherId, setTeacherId] = useState(initialTeacher?.teacherId ?? "");
  const [jobId, setJobId] = useState(initialTeacher?.acceptedJobs[0]?.jobId ?? "");
  const [rating, setRating] = useState(5);
  const [referenceText, setReferenceText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const selectedTeacher = teacherOptions.find((t) => t.teacherId === teacherId) ?? teacherOptions[0];
  const jobs = selectedTeacher?.acceptedJobs ?? [];

  const handleTeacherChange = (nextTeacherId: string) => {
    setTeacherId(nextTeacherId);
    const next = teacherOptions.find((t) => t.teacherId === nextTeacherId);
    setJobId(next?.acceptedJobs[0]?.jobId ?? "");
  };

  const handleClose = () => {
    setTeacherId(teacherOptions[0]?.teacherId ?? "");
    setJobId(teacherOptions[0]?.acceptedJobs[0]?.jobId ?? "");
    setRating(5);
    setReferenceText("");
    onClose();
  };

  const handleSave = () => {
    if (!teacherId || !jobId || !referenceText.trim()) return;
    onSave({ teacherId, jobId, rating, referenceText: referenceText.trim() });
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={handleClose} />}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#184e77] to-[#1a6091] px-6 py-5">
          <div>
            <h2 className="text-base font-black text-white">Add Teacher Reference</h2>
            <p className="mt-0.5 text-xs text-blue-100/80">Create a rating and written recommendation</p>
          </div>
          <button
            onClick={handleClose}
            className="grid size-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-5">
            {/* Teacher select */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-[#172033]">Select Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => handleTeacherChange(e.target.value)}
                className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10 transition"
              >
                {teacherOptions.map((t) => (
                  <option key={t.teacherId} value={t.teacherId}>
                    {t.teacherName} • {t.subject ?? "General"}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher snapshot */}
            {selectedTeacher && (
              <div className="flex items-center gap-3 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#184e77] to-[#1a6091] text-sm font-black text-white">
                  {selectedTeacher.teacherName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#172033]">{selectedTeacher.teacherName}</p>
                  <p className="truncate text-xs text-slate-400">{selectedTeacher.teacherEmail}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-[#184e77]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#184e77]">
                      {selectedTeacher.teacherLevel}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin size={9} /> {selectedTeacher.teacherLocation}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Job select */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-[#172033]">Related Job</label>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10 transition"
              >
                {jobs.map((job) => (
                  <option key={job.jobId} value={job.jobId}>
                    {job.title} • {job.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Star rating picker */}
            <div>
              <label className="mb-2 block text-xs font-black text-[#172033]">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={
                        value <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      }
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-black text-[#172033]">{hoverRating || rating} / 5</span>
              </div>
            </div>

            {/* Reference text */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-[#172033]">Reference Text</label>
              <textarea
                rows={5}
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="Write a useful reference the teacher can show on their profile..."
                className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10 transition"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">{referenceText.length} characters</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#dbe4ef] px-6 py-4">
          <button
            onClick={handleClose}
            className="flex-1 rounded-xl border border-[#dbe4ef] py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!teacherId || !jobId || !referenceText.trim() || isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#184e77] to-[#1a6091] py-2.5 text-sm font-black text-white shadow-sm hover:shadow-md disabled:opacity-50 transition"
          >
            <Plus size={15} /> {isSaving ? "Saving…" : "Add Reference"}
          </button>
        </div>
      </div>
    </>
  );
};

/* ───────────────────────── Reference Card ───────────────────────── */
const ReferenceCard = ({
  reference,
  onDelete,
}: {
  reference: TeacherReference;
  onDelete: () => void;
}) => (
  <article className="group relative flex flex-col gap-4 rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#184e77]/20">
    {/* Delete button */}
    <button
      onClick={onDelete}
      className="absolute right-4 top-4 grid size-8 place-items-center rounded-xl border border-[#dbe4ef] text-slate-300 opacity-0 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
    >
      <Trash2 size={13} />
    </button>

    {/* Teacher info row */}
    <div className="flex items-center gap-3 pr-8">
      <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f0f7ff]">
        {reference.teacherAvatar ? (
          <img src={reference.teacherAvatar} alt={reference.teacherName} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-sm font-black text-[#184e77]">
            {reference.teacherName.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#172033]">{reference.teacherName}</p>
        <p className="truncate text-[11px] text-slate-400">{reference.teacherEmail}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{reference.givenBy}</p>
      </div>
    </div>

    {/* Rating */}
    <div className="flex items-center gap-2">
      <StarRating rating={reference.rating} />
      <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-600">
        {reference.rating}.0
      </span>
    </div>

    {/* Reference text */}
    <div className="relative rounded-xl bg-[#f8fafc] px-4 py-3">
      <Quote size={14} className="mb-1.5 text-[#184e77]/30" />
      <p className="text-xs leading-5 text-slate-600 line-clamp-3">{reference.referenceText}</p>
      <p className="mt-2 text-[10px] text-slate-400">{reference.date}</p>
    </div>

    {/* Related job */}
    <div className="flex items-start gap-2 rounded-xl border border-[#dbe4ef] bg-[#f0f7ff]/60 px-4 py-3">
      <BookOpen size={13} className="mt-0.5 shrink-0 text-[#184e77]/60" />
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[#172033]">{reference.relatedJob}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
            <MapPin size={9} /> {reference.jobLocation}
          </span>
          {reference.subject && (
            <span className="rounded-md bg-[#184e77]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#184e77]">
              {reference.subject}
            </span>
          )}
        </div>
      </div>
    </div>
  </article>
);

/* ───────────────────────── Main Page ───────────────────────── */
const TeacherReferencesPage = () => {
  const { auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const applicationsQuery = useFetchInstitutionApplications(institutionId);
  const referencesQuery = useFetchInstitutionTeacherReferences(institutionId);
  const createReference = useCreateTeacherReferenceMutation();
  const deleteReference = useDeleteTeacherReferenceMutation();

  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [page, setPage] = useState(1);

  const teacherOptions = useMemo(() => {
    const accepted = (applicationsQuery.data ?? []).filter((app) => app.status === "ACCEPTED");
    const grouped = new Map<string, JobApplication[]>();
    for (const app of accepted) {
      grouped.set(app.teacherEmail, [...(grouped.get(app.teacherEmail) ?? []), app]);
    }
    return [...grouped.entries()]
      .map(([key, apps]): AcceptedTeacherOption => {
        const latest = apps[0];
        const uniqueJobs = Array.from(new Map(apps.map((a) => [a.jobId, a])).values());
        return {
          id: key,
          teacherId: latest.teacherId ?? "",
          teacherName: latest.teacherName,
          teacherEmail: latest.teacherEmail,
          teacherLevel: latest.teacherLevel,
          subject: latest.subject,
          teacherLocation: latest.teacherLocation,
          acceptedJobs: uniqueJobs.map((a) => ({
            jobId: a.jobId,
            title: a.jobTitle,
            location: a.jobLocation,
            subject: a.subject,
          })),
        };
      })
      .filter((t) => t.acceptedJobs.length > 0);
  }, [applicationsQuery.data]);

  const references = useMemo(() => referencesQuery.data?.references ?? [], [referencesQuery.data]);

  const filtered = references.filter((ref) => {
    const q = search.toLowerCase();
    return (
      !q ||
      ref.teacherName.toLowerCase().includes(q) ||
      ref.referenceText.toLowerCase().includes(q) ||
      ref.relatedJob.toLowerCase().includes(q) ||
      ref.givenBy.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleAdd = (payload: { teacherId: string; jobId: string; rating: number; referenceText: string }) => {
    createReference.mutate(payload, { onSuccess: () => setPanelOpen(false) });
  };

  const averageRating = references.length
    ? Number((references.reduce((sum, r) => sum + r.rating, 0) / references.length).toFixed(1))
    : 0;

  const stats = [
    {
      label: "Total References",
      value: references.length,
      icon: BookOpen,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Teachers Covered",
      value: new Set(references.map((r) => r.teacherName)).size,
      icon: Users,
      gradient: "from-teal-500 to-teal-600",
      bg: "bg-teal-50",
      text: "text-teal-700",
    },
    {
      label: "Average Rating",
      value: averageRating || "—",
      icon: Star,
      gradient: "from-amber-400 to-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
      extra: averageRating ? <StarRating rating={Math.round(averageRating)} size={12} /> : null,
    },
  ];

  return (
    <AdminLayout>
      <AddPanel
        open={panelOpen}
        teacherOptions={teacherOptions}
        onClose={() => setPanelOpen(false)}
        onSave={handleAdd}
        isSaving={createReference.isPending}
      />

      <div className="px-6 py-8 xl:px-8">
        {/* Page header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#172033]">Teacher References</h1>
            <p className="mt-1 text-sm text-slate-500">
              Add ratings and written references for teachers your school has already accepted.
            </p>
          </div>
          <button
            onClick={() => setPanelOpen(true)}
            disabled={teacherOptions.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#184e77] to-[#1a6091] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:shadow-md hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={16} /> Add Reference
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm"
              >
                {/* Decorative gradient blob */}
                <div className={`absolute -right-4 -top-4 size-20 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10`} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-4xl font-black text-[#172033]">{stat.value}</p>
                    {stat.extra && <div className="mt-2">{stat.extra}</div>}
                  </div>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <Icon size={18} className="text-white" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white px-5 py-3.5 shadow-sm">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by teacher, job, school, or reference text…"
            className="flex-1 bg-transparent text-sm text-[#172033] outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="flex items-center gap-1 rounded-lg border border-[#dbe4ef] px-2.5 py-1 text-xs font-semibold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition"
            >
              <X size={11} /> Clear
            </button>
          )}
          {filtered.length > 0 && (
            <span className="shrink-0 rounded-lg bg-[#f0f7ff] px-2.5 py-1 text-xs font-black text-[#184e77]">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Content */}
        {applicationsQuery.isLoading || referencesQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white py-24 shadow-sm">
            <div className="size-10 animate-spin rounded-full border-4 border-[#dbe4ef] border-t-[#184e77]" />
            <p className="text-sm font-semibold text-slate-400">Loading references…</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white py-24 shadow-sm">
            <div className="grid size-16 place-items-center rounded-2xl bg-[#f0f7ff]">
              <BookOpen size={28} className="text-[#184e77]/40" />
            </div>
            <p className="text-sm font-black text-slate-400">No references found</p>
            <p className="text-xs text-slate-400">Accepted teachers can receive references here after school review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((reference: TeacherReference) => (
              <ReferenceCard
                key={reference.id}
                reference={reference}
                onDelete={() => deleteReference.mutate(reference.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#dbe4ef] bg-white px-5 py-3.5 shadow-sm">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-bold text-[#172033]">
                {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#172033]">
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of <span className="font-bold text-[#172033]">{filtered.length}</span> references
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 hover:bg-[#f0f7ff] disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`grid size-8 place-items-center rounded-lg border text-xs font-black transition ${
                    page === p
                      ? "border-[#184e77] bg-gradient-to-br from-[#184e77] to-[#1a6091] text-white shadow-sm"
                      : "border-[#dbe4ef] text-slate-500 hover:bg-[#f0f7ff]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 hover:bg-[#f0f7ff] disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TeacherReferencesPage;
