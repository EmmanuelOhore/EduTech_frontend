import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  FileText,
  Save,
  TrendingUp,
  Upload,
  Users,
  Zap,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import EditProfileDrawer from "../components/EditProfileDrawer";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useUpdateTeacherProfileMutation, useUploadAssetMutation } from "../services/mutation";
import { useFetchJobs, useFetchMyApplications, useFetchMyTeacherProfile, useFetchMyTeacherReferences } from "../services/queries";
import type { ApplicationStatus, TeachingRecord } from "../types/TypeChecks";

/* ── MOCK DATA ──────────────────────────────────────────────── */
const teacher = {
  name: "Ohore Emmanuel",
  email: "emmanuelohore2003@gmail.com",
  subjects: ["Physics"],
  location: "Lagos",
  level: "Advanced",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  profileComplete: 57,
  isVisible: true,
  isVerified: true,
};

const statusMeta: Record<ApplicationStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Under Review", color: "bg-amber-50 text-amber-700 border border-amber-200", icon: Clock },
  ACCEPTED: { label: "Accepted", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-50 text-red-600 border border-red-200", icon: ShieldCheck },
};

const jobTypeLabel = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

type DocumentUploadModalProps = {
  open: boolean;
  title: string;
  subtitle: string;
  ctaLabel: string;
  accept: string;
  existingUrl?: string;
  uploading: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
};

const DocumentUploadModal = ({
  open,
  title,
  subtitle,
  ctaLabel,
  accept,
  existingUrl,
  uploading,
  onClose,
  onUpload,
}: DocumentUploadModalProps) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto w-full max-w-md -translate-y-1/2 rounded-2xl border border-[#dbe4ef] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h2 className="text-base font-black text-[#172033]">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-4 transition hover:border-[#184e77] hover:bg-white ${uploading ? "pointer-events-none opacity-70" : ""}`}>
            <div>
              <p className="text-sm font-bold text-[#172033]">{uploading ? "Uploading..." : ctaLabel}</p>
              <p className="mt-1 text-[11px] text-slate-400">PDF, JPG, PNG or WEBP up to 8MB</p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
              <Upload size={16} />
            </span>
            <input
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          {existingUrl && (
            <a
              href={existingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#184e77] transition hover:bg-[#eef6fb]"
            >
              <FileText size={15} />
              View current uploaded file
            </a>
          )}
        </div>
      </div>
    </>
  );
};

type TeachingRecordModalProps = {
  open: boolean;
  records: TeachingRecord[];
  saving: boolean;
  onClose: () => void;
  onSave: (records: TeachingRecord[]) => Promise<void>;
};

const currentYear = new Date().getFullYear();
const emptyRecord = (): TeachingRecord => ({
  schoolName: "",
  roleTitle: "",
  startYear: currentYear,
  endYear: currentYear,
  description: "",
});

const inCls = "w-full rounded-xl border border-[#dbe4ef] bg-white px-3.5 py-2.5 text-sm text-[#172033] outline-none placeholder:text-slate-400 transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10";

const TeachingRecordModal = ({ open, records, saving, onClose, onSave }: TeachingRecordModalProps) => {
  const [drafts, setDrafts] = useState<TeachingRecord[]>(records.length ? records : [emptyRecord()]);
  const [presentFlags, setPresentFlags] = useState<boolean[]>(
    records.length ? records.map((r) => !r.endYear) : [false],
  );
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      const init = records.length ? records : [emptyRecord()];
      setDrafts(init);
      setPresentFlags(init.map((r) => !r.endYear));
    }
    wasOpen.current = open;
  }, [open, records]);

  if (!open) return null;

  const updateRecord = (index: number, field: keyof TeachingRecord, value: string) => {
    setDrafts((curr) =>
      curr.map((rec, i) =>
        i === index
          ? { ...rec, [field]: field === "startYear" || field === "endYear" ? Number(value) : value }
          : rec,
      ),
    );
  };

  const togglePresent = (index: number) => {
    setPresentFlags((curr) => curr.map((f, i) => (i === index ? !f : f)));
    if (!presentFlags[index]) {
      setDrafts((curr) => curr.map((rec, i) => (i === index ? { ...rec, endYear: undefined } : rec)));
    }
  };

  const addRecord = () => {
    setDrafts((curr) => [...curr, emptyRecord()]);
    setPresentFlags((curr) => [...curr, false]);
  };

  const removeRecord = (index: number) => {
    setDrafts((curr) => curr.filter((_, i) => i !== index));
    setPresentFlags((curr) => curr.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const cleaned = drafts
      .map((rec, i) => ({
        ...rec,
        schoolName: rec.schoolName.trim(),
        roleTitle: rec.roleTitle.trim(),
        description: rec.description?.trim() || undefined,
        endYear: presentFlags[i] ? undefined : Number.isFinite(rec.endYear) ? rec.endYear : undefined,
      }))
      .filter((rec) => rec.schoolName && rec.roleTitle);

    if (cleaned.length === 0) {
      toast.error("Add at least one valid teaching record");
      return;
    }
    await onSave(cleaned);
  };

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* modal — vertically centred */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[90vh] w-full max-w-2xl -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ── gradient header ── */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#184e77] to-[#287271] px-6 py-5">
          <span className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/5" />
          <span className="pointer-events-none absolute -bottom-6 left-1/3 size-20 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <GraduationCap size={16} className="text-white" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Teaching Records</h2>
                <p className="mt-0.5 text-xs text-white/60">Add your experience so schools understand your background</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="relative mt-4 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/20">
              {drafts.length} record{drafts.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-white/50">School name &amp; role are required to save</span>
          </div>
        </div>

        {/* ── scrollable body ── */}
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {drafts.map((record, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-[#f8fafc]">

              {/* card header */}
              <div className="flex items-center justify-between border-b border-[#eef2f7] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-[#184e77] text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-[#172033]">
                    {record.schoolName.trim() || `Record ${index + 1}`}
                  </p>
                </div>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecord(index)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={11} /> Remove
                  </button>
                )}
              </div>

              {/* card fields */}
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">School Name</label>
                  <input
                    value={record.schoolName}
                    onChange={(e) => updateRecord(index, "schoolName", e.target.value)}
                    placeholder="e.g. St. Anthony International School"
                    className={inCls}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Role / Title</label>
                  <input
                    value={record.roleTitle}
                    onChange={(e) => updateRecord(index, "roleTitle", e.target.value)}
                    placeholder="e.g. Physics Teacher"
                    className={inCls}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Start Year</label>
                  <input
                    type="number"
                    value={record.startYear}
                    onChange={(e) => updateRecord(index, "startYear", e.target.value)}
                    placeholder="e.g. 2020"
                    min={1980}
                    max={currentYear}
                    className={inCls}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">End Year</label>
                    <button
                      type="button"
                      onClick={() => togglePresent(index)}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-[#184e77]"
                    >
                      <span className={`flex size-3.5 items-center justify-center rounded border transition ${presentFlags[index] ? "border-[#184e77] bg-[#184e77]" : "border-slate-300 bg-white"}`}>
                        {presentFlags[index] && <span className="size-1.5 rounded-sm bg-white" />}
                      </span>
                      Currently here
                    </button>
                  </div>
                  <input
                    type="number"
                    value={presentFlags[index] ? "" : (record.endYear ?? "")}
                    onChange={(e) => updateRecord(index, "endYear", e.target.value)}
                    placeholder={presentFlags[index] ? "Present" : "e.g. 2024"}
                    disabled={presentFlags[index]}
                    min={record.startYear}
                    max={currentYear}
                    className={`${inCls} ${presentFlags[index] ? "cursor-not-allowed opacity-50" : ""}`}
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Summary <span className="normal-case font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={record.description ?? ""}
                    onChange={(e) => updateRecord(index, "description", e.target.value)}
                    placeholder="Brief summary of your role, subjects taught, and responsibilities…"
                    rows={3}
                    className={`${inCls} resize-none`}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* add record button */}
          <button
            type="button"
            onClick={addRecord}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#184e77]/30 bg-[#eef6fb]/60 py-3 text-sm font-semibold text-[#184e77] transition hover:border-[#184e77]/60 hover:bg-[#eef6fb]"
          >
            <Plus size={14} /> Add another record
          </button>
        </div>

        {/* ── footer ── */}
        <div className="flex shrink-0 gap-3 border-t border-[#eef2f7] bg-[#f8fafc] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#dbe4ef] bg-white py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#184e77] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a6091] disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </>
            ) : (
              <>
                <Save size={14} /> Save Records
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

/* ── COMPONENT ──────────────────────────────────────────────── */
const Dashboard = () => {
  const [visible, setVisible] = useState(teacher.isVisible);
  const [editOpen, setEditOpen] = useState(false);
  const [ninModalOpen, setNinModalOpen] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const { logout, user, isAuthenticated } = useAuth();
  const uploadAsset = useUploadAssetMutation();
  const updateTeacherProfile = useUpdateTeacherProfileMutation();
  const applicationsQuery = useFetchMyApplications(isAuthenticated);
  const myProfileQuery = useFetchMyTeacherProfile(isAuthenticated);
  const referencesQuery = useFetchMyTeacherReferences(isAuthenticated);
  const jobsQuery = useFetchJobs();

  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const teacherProfile = myProfileQuery.data;
  const referenceSummary = referencesQuery.data;
  const recommendedJobs = useMemo(() => jobsQuery.data?.slice(0, 3) ?? [], [jobsQuery.data]);
  const pendingCount = applications.filter((app) => app.status === "PENDING").length;
  const acceptedCount = applications.filter((app) => app.status === "ACCEPTED").length;
  const rejectedCount = applications.filter((app) => app.status === "REJECTED").length;
  const displayTeacher = {
    ...teacher,
    name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || teacher.name,
    email: user?.email ?? teacher.email,
    avatar: user?.profileImage ?? teacher.avatar,
    isVerified: user?.isVerified ?? teacher.isVerified,
    subjects: applications[0]?.subject ? [applications[0].subject] : teacher.subjects,
    location: teacherProfile?.location ?? (applications[0]?.teacherLocation && applications[0].teacherLocation !== "Not set" ? applications[0].teacherLocation : teacher.location),
    level: teacherProfile?.level ?? (applications[0]?.teacherLevel && applications[0].teacherLevel !== "Not set" ? applications[0].teacherLevel : teacher.level),
  };
  const stats = [
    { label: "Total Applications", value: String(applications.length), icon: BookOpen, color: "bg-blue-500", light: "bg-blue-50 text-blue-600", trend: applications.length ? `+${applications.length}` : "0", up: applications.length > 0 },
    { label: "Pending Reviews", value: String(pendingCount), icon: Clock, color: "bg-amber-500", light: "bg-amber-50 text-amber-600", trend: String(pendingCount), up: false },
    { label: "Accepted Applications", value: String(acceptedCount), icon: Calendar, color: "bg-purple-500", light: "bg-purple-50 text-purple-600", trend: acceptedCount ? `+${acceptedCount}` : "-", up: acceptedCount > 0 },
    { label: "Rejected Applications", value: String(rejectedCount), icon: Eye, color: "bg-teal-500", light: "bg-teal-50 text-teal-600", trend: rejectedCount ? String(rejectedCount) : "0", up: false },
  ];
  const activities = applications.slice(0, 4).map((app) => {
    const meta = statusMeta[app.status];
    return {
      icon: meta.icon,
      color: app.status === "ACCEPTED"
        ? "text-emerald-500 bg-emerald-50"
        : app.status === "REJECTED"
          ? "text-red-500 bg-red-50"
          : "text-amber-500 bg-amber-50",
      text: `${meta.label}: ${app.jobTitle}`,
      time: app.date,
    };
  });

  const completionSteps = [
    { label: "Basic profile info", done: Boolean(teacherProfile?.firstName && teacherProfile?.lastName && teacherProfile?.location) },
    { label: "Add profile photo", done: Boolean(teacherProfile?.profileImage) },
    { label: "Verify email address", done: Boolean(user?.isVerified) },
    { label: "Upload NIN document", done: Boolean(teacherProfile?.ninDocumentUrl) },
    { label: "Add teaching certificate", done: Boolean(teacherProfile?.certificateUrl) },
    { label: "Complete availability schedule", done: Boolean(teacherProfile?.isAvailable) },
    { label: "Add teaching experience", done: Boolean(teacherProfile?.teachingRecords.length) },
  ];
  const doneCount = completionSteps.filter((s) => s.done).length;
  const totalSteps = completionSteps.length;
  const pct = Math.round((doneCount / totalSteps) * 100);
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (pct / 100) * circumference;
  const averageRating = referenceSummary?.averageRating ?? 0;
  const referenceCount = referenceSummary?.count ?? 0;
  const ninStatusLabel =
    teacherProfile?.ninStatus === "VERIFIED"
      ? "NIN verified"
      : teacherProfile?.ninStatus === "REJECTED"
        ? "NIN verification rejected"
        : teacherProfile?.ninDocumentUrl
          ? "NIN document uploaded and pending review"
          : "No NIN verification submitted";

  const handleNinUpload = async (file: File) => {
    try {
      const uploaded = await uploadAsset.mutateAsync({ file, category: "teacher-nin-document" });
      await updateTeacherProfile.mutateAsync({ ninDocumentUrl: uploaded.url });
      setNinModalOpen(false);
      toast.success("NIN document uploaded");
    } catch {
      // toast handled in mutation
    }
  };

  const handleSaveRecords = async (records: TeachingRecord[]) => {
    await updateTeacherProfile.mutateAsync({ teachingRecords: records });
    setRecordsModalOpen(false);
    toast.success("Teaching records saved");
  };

  const handleDocumentView = (url?: string) => {
    if (!url) {
      toast.error("No document uploaded yet");
      return;
    }

    const isCloudinaryPdf =
      url.includes("res.cloudinary.com") && /\.pdf($|\?)/i.test(url);

    if (isCloudinaryPdf) {
      toast.error("This PDF is blocked by your current Cloudinary settings. Re-upload as JPG/PNG, or enable PDF delivery in Cloudinary.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">

      {/* ── EDIT PROFILE DRAWER ───────────────────────────────── */}
      <EditProfileDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={teacherProfile}
      />
      <DocumentUploadModal
        open={ninModalOpen}
        title="Upload NIN Document"
        subtitle="This stays private on your dashboard and can be used for verification."
        ctaLabel={teacherProfile?.ninDocumentUrl ? "Replace NIN document" : "Choose NIN document"}
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        existingUrl={teacherProfile?.ninDocumentUrl}
        uploading={uploadAsset.isPending}
        onClose={() => setNinModalOpen(false)}
        onUpload={handleNinUpload}
      />
      <TeachingRecordModal
        open={recordsModalOpen}
        records={teacherProfile?.teachingRecords ?? []}
        saving={updateTeacherProfile.isPending}
        onClose={() => setRecordsModalOpen(false)}
        onSave={handleSaveRecords}
      />

      {/* ── NAV ───────────────────────────────────────────────── */}
      <TeacherHeader active="dashboard" />

      {/* ── PROFILE HERO ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271]">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 left-0 size-72 rounded-full bg-white/5" />

        <div className="relative w-full px-6 py-10 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-8">

            {/* Left: avatar + info */}
            <div className="flex flex-wrap items-start gap-6">
              <div className="relative">
                <div className="size-24 overflow-hidden rounded-2xl ring-4 ring-white/30 shadow-xl">
                  <img src={displayTeacher.avatar} alt={displayTeacher.name} className="size-full object-cover" />
                </div>
                <span className="absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full bg-[#287271] shadow-lg ring-2 ring-white">
                  <Sparkles size={12} className="text-white" />
                </span>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#7dd3fc] ring-1 ring-white/20">
                    <GraduationCap size={12} />
                    Teacher Profile
                  </span>
                  {displayTeacher.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 size={11} />
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-black text-white">{displayTeacher.name}</h1>

                <div className="mt-3 flex flex-wrap gap-2">
                  {displayTeacher.subjects.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/20">
                      <BookOpen size={12} />
                      {s}
                    </span>
                  ))}
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:bg-white/20">
                    <Plus size={12} />
                    Edit Subjects
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/20">
                    <MapPin size={12} />
                    {displayTeacher.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#287271]/60 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/20">
                    <Award size={12} />
                    {displayTeacher.level}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-1.5 text-sm font-bold text-amber-100 ring-1 ring-white/20">
                    <Star size={12} />
                    {referenceCount > 0 ? `${averageRating.toFixed(1)} rating · ${referenceCount} reference${referenceCount === 1 ? "" : "s"}` : "No references yet"}
                  </span>
                </div>

                <p className="mt-3 flex items-center gap-2 text-sm text-white/60">
                  <span>{displayTeacher.email}</span>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                </p>

                {/* Visibility toggle */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setVisible((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${visible ? "bg-emerald-400" : "bg-white/20"}`}
                  >
                    <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${visible ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm font-semibold text-white/70">Profile Visibility</span>
                  {visible && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 size={11} />
                      Visible to Schools
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: completion ring + actions */}
            <div className="flex flex-col items-center gap-4">
              {/* SVG ring */}
              <div className="relative flex items-center justify-center">
                <svg width="96" height="96" className="-rotate-90">
                  <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="36" fill="none"
                    stroke="#7dd3fc" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-xl font-black text-white leading-none">{pct}%</p>
                  <p className="text-[10px] font-semibold text-white/60 leading-none mt-0.5">Complete</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full min-w-[160px]">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#184e77] shadow transition hover:shadow-md"
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
                {teacherProfile?.id && (
                  <Link to={`/teachers/${teacherProfile.id}/profile`} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/20">
                    <Eye size={14} />
                    Public Profile
                  </Link>
                )}
                <Link to="/jobs" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#287271] px-5 text-sm font-black text-white shadow transition hover:bg-[#1f5f5e]">
                  <Search size={14} />
                  Browse Jobs
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── VERIFICATION + RECORDS STRIP ──────────────────────── */}
      <section className="border-b border-[#dbe4ef] bg-white">
        <div className="grid w-full grid-cols-1 divide-y divide-[#dbe4ef] px-6 lg:px-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex items-center justify-between gap-4 py-4 pr-0 sm:pr-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-500">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-[#172033]">NIN Verification Status</p>
                <p className="text-xs text-slate-500">{ninStatusLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNinModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-black text-white transition hover:bg-[#1a6091]"
            >
              <Upload size={13} />
              {teacherProfile?.ninDocumentUrl ? "View / Replace NIN" : "Upload NIN"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 py-4 pl-0 sm:pl-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-500">
                <GraduationCap size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-[#172033]">Teaching Records</p>
                <p className="text-xs text-slate-500">
                  {teacherProfile?.teachingRecords.length
                    ? `${teacherProfile.teachingRecords.length} teaching record${teacherProfile.teachingRecords.length === 1 ? "" : "s"} saved`
                    : "No teaching records yet"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRecordsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#287271] px-4 py-2 text-xs font-black text-white transition hover:bg-[#1f5f5e]"
            >
              <Plus size={13} />
              {teacherProfile?.teachingRecords.length ? "Manage Records" : "Add Record"}
            </button>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="w-full px-6 py-10 lg:px-8">

        {/* ── STATS ROW ─────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const cardContent = (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className={`grid size-10 place-items-center rounded-xl ${stat.light}`}>
                    <Icon size={18} />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${stat.up ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-3xl font-black text-[#172033]">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
                <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.color} opacity-60`} />
              </>
            );
            return stat.label === "Accepted Applications" ? (
              <Link
                key={stat.label}
                to="/dashboard/accepted-applications"
                className="group relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04] transition hover:shadow-md hover:shadow-slate-900/[0.07]"
              >
                {cardContent}
              </Link>
            ) : (
              <article
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04] transition hover:shadow-md hover:shadow-slate-900/[0.07]"
              >
                {cardContent}
              </article>
            );
          })}
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">

            {/* Recent Applications */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                    <Users size={16} />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-[#172033]">Recent Applications</h2>
                    <p className="text-xs text-slate-500">Your latest job applications</p>
                  </div>
                </div>
                <Link to="/dashboard/applications" className="flex items-center gap-1 text-xs font-bold text-[#184e77] transition hover:underline">
                  View All <ArrowRight size={13} />
                </Link>
              </div>
              <div className="divide-y divide-[#f1f5f9]">
                {applicationsQuery.isLoading ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-400">Loading your applications...</div>
                ) : applications.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-[#172033]">No applications yet</p>
                    <p className="mt-1 text-xs text-slate-500">When you apply to jobs, they will appear here with the school status.</p>
                    <Link to="/jobs" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a6091]">
                      Browse Jobs <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : (
                  applications.slice(0, 5).map((app) => {
                    const status = statusMeta[app.status];
                    return (
                      <div key={app.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-[#f8fafc]">
                        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f0f7ff] text-sm font-semibold text-[#184e77]">
                          {(app.institutionName ?? "S").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#172033]">{app.jobTitle}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <BriefcaseBusiness size={11} />
                              {app.institutionName ?? "School"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {app.jobLocation}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar size={10} />
                            {app.date}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-500">
                    <FileText size={16} />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-[#172033]">Documents & Records</h2>
                    <p className="text-xs text-slate-500">Your uploads and saved teaching history</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRecordsModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-bold text-[#184e77] transition hover:underline"
                >
                  Manage <ArrowRight size={13} />
                </button>
              </div>
              <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
                <div className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Documents</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                      <span className="text-sm font-semibold text-[#172033]">Teaching certificate</span>
                      {teacherProfile?.certificateUrl ? (
                        <button type="button" onClick={() => handleDocumentView(teacherProfile.certificateUrl)} className="text-xs font-bold text-[#184e77] hover:underline">View</button>
                      ) : (
                        <span className="text-xs text-slate-400">Not uploaded</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                      <span className="text-sm font-semibold text-[#172033]">NIN document</span>
                      {teacherProfile?.ninDocumentUrl ? (
                        <button type="button" onClick={() => handleDocumentView(teacherProfile.ninDocumentUrl)} className="text-xs font-bold text-[#184e77] hover:underline">View</button>
                      ) : (
                        <button type="button" onClick={() => setNinModalOpen(true)} className="text-xs font-bold text-[#184e77] hover:underline">Upload</button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Teaching records</p>
                  {teacherProfile?.teachingRecords.length ? (
                    <div className="mt-3 space-y-2">
                      {teacherProfile.teachingRecords.slice(0, 2).map((record, index) => (
                        <div key={`${record.schoolName}-${index}`} className="rounded-lg bg-white px-3 py-3">
                          <p className="text-sm font-black text-[#172033]">{record.roleTitle}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{record.schoolName}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{record.startYear} - {record.endYear ?? "Present"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg bg-white px-3 py-5 text-center text-sm text-slate-400">
                      No teaching records added yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Activity Feed */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
              <div className="flex items-center gap-3 border-b border-[#f1f5f9] px-6 py-4">
                <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-500">
                  <Zap size={16} />
                </span>
                <div>
                  <h2 className="text-base font-black text-[#172033]">Recent Activity</h2>
                  <p className="text-xs text-slate-500">What's been happening</p>
                </div>
              </div>
              <div className="divide-y divide-[#f1f5f9]">
                {activities.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-400">Your application activity will appear here.</div>
                ) : activities.map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 px-6 py-4">
                      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${act.color}`}>
                        <Icon size={14} />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#172033] leading-snug">{act.text}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={10} />
                          {act.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-500">
                    <Star size={16} />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-[#172033]">References & Ratings</h2>
                    <p className="text-xs text-slate-500">What schools have said about your work</p>
                  </div>
                </div>
                {teacherProfile?.id && (
                  <Link to={`/teachers/${teacherProfile.id}/profile`} className="flex items-center gap-1 text-xs font-bold text-[#184e77] transition hover:underline">
                    View Profile <ArrowRight size={13} />
                  </Link>
                )}
              </div>
              {referenceCount === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-400">School references will appear here after accepted placements.</div>
              ) : (
                <div className="space-y-4 px-6 py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                      <Star size={15} className="fill-current" />
                      {averageRating.toFixed(1)} average rating
                    </span>
                    <span className="text-sm text-slate-500">{referenceCount} school reference{referenceCount === 1 ? "" : "s"}</span>
                  </div>
                  <div className="grid gap-3">
                    {referenceSummary?.references.slice(0, 2).map((reference) => (
                      <article key={reference.id} className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-black text-[#172033]">{reference.givenBy}</p>
                            <p className="text-xs text-slate-400">{reference.relatedJob}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-black text-amber-700">
                            <Star size={11} className="fill-current" /> {reference.rating}.0
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{reference.referenceText}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">

            {/* Profile Completion */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
              <div className="border-b border-[#f1f5f9] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                    <TrendingUp size={16} />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-[#172033]">Profile Completion</h2>
                    <p className="text-xs text-slate-500">{doneCount} of {totalSteps} steps done</p>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#184e77] to-[#287271] transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-xs font-black text-[#184e77]">{pct}% complete</p>
              </div>
              <div className="divide-y divide-[#f1f5f9]">
                {completionSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-3 px-5 py-3">
                    <div className={`grid size-5 place-items-center rounded-full ${step.done ? "bg-emerald-500" : "border-2 border-[#dbe4ef]"}`}>
                      {step.done && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm ${step.done ? "text-slate-400 line-through" : "font-semibold text-[#172033]"}`}>
                      {step.label}
                    </span>
                    {!step.done && (
                      <ChevronRight size={14} className="ml-auto text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Quick actions */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
              <div className="border-b border-[#f1f5f9] px-5 py-4">
                <h2 className="text-base font-black text-[#172033]">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4">
                {[
                  { label: "Browse Jobs", icon: Search, to: "/jobs", primary: true, action: null },
                  { label: "Edit Profile", icon: Pencil, to: "#", primary: false, action: () => setEditOpen(true) },
                  { label: "Upload Docs", icon: Upload, to: "#", primary: false, action: () => setNinModalOpen(true) },
                  { label: "Teaching Records", icon: BarChart3, to: "#", primary: false, action: () => setRecordsModalOpen(true) },
                ].map((action) => {
                  const Icon = action.icon;
                  const sharedCls = `flex flex-col items-center gap-2 rounded-xl p-3.5 text-center text-xs font-black transition ${
                    action.primary
                      ? "bg-[#184e77] text-white hover:bg-[#1a6091]"
                      : "border border-[#dbe4ef] bg-[#f8fafc] text-[#172033] hover:border-[#184e77]/30 hover:bg-[#e0f2fe] hover:text-[#184e77]"
                  }`;
                  return action.action ? (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.action}
                      className={sharedCls}
                    >
                      <Icon size={18} />
                      {action.label}
                    </button>
                  ) : (
                    <Link
                      key={action.label}
                      to={action.to}
                      className={sharedCls}
                    >
                      <Icon size={18} />
                      {action.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={logout}
                  className="flex flex-col items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-center text-xs font-black text-red-600 transition hover:border-red-200 hover:bg-red-100"
                >
                  <LogOut size={18} />
                  Log Out
                </button>
              </div>
            </section>

          </div>
        </div>

        {/* ── RECOMMENDED JOBS ──────────────────────────────── */}
        <section className="mt-8">
          {/* section header */}
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#184e77] to-[#287271] shadow-sm">
                <Sparkles size={15} className="text-white" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#172033]">Recommended for You</h2>
                <p className="text-xs text-slate-400">Matched to your profile and location</p>
              </div>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#dbe4ef] bg-white px-4 py-2 text-xs font-semibold text-[#184e77] shadow-sm transition hover:border-[#184e77]/30 hover:bg-[#eef6fb]"
            >
              Browse All Jobs <ArrowRight size={12} />
            </Link>
          </div>

          {/* cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobsQuery.isLoading ? (
              /* skeleton */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[#dbe4ef] bg-white p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="size-11 animate-pulse rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-6 w-20 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-6 w-14 animate-pulse rounded-lg bg-slate-100" />
                  </div>
                </div>
              ))
            ) : recommendedJobs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#dbe4ef] bg-white py-14 text-center sm:col-span-2 lg:col-span-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-[#eef6fb]">
                  <BriefcaseBusiness size={20} className="text-[#184e77]/50" />
                </span>
                <p className="text-sm text-slate-400">No jobs available right now. Check back soon!</p>
                <Link to="/jobs" className="mt-1 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1a6091]">
                  Browse All Jobs
                </Link>
              </div>
            ) : (
              recommendedJobs.map((job, idx) => {
                const typeColors: Record<string, string> = {
                  FULL_TIME: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
                  PART_TIME: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
                  ROTATIONAL: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
                };
                const accentBg = idx === 0 ? "from-[#184e77]/5 to-transparent" : idx === 1 ? "from-[#287271]/5 to-transparent" : "from-amber-400/5 to-transparent";
                return (
                  <article
                    key={job._id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04] transition duration-200 hover:-translate-y-0.5 hover:border-[#184e77]/20 hover:shadow-md"
                  >
                    {/* subtle top gradient accent */}
                    <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accentBg} pointer-events-none`} />

                    <div className="relative flex flex-1 flex-col p-5">
                      {/* school + title */}
                      <div className="mb-4 flex items-start gap-3">
                        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f0f7ff] text-sm font-bold text-[#184e77] shadow-sm">
                          {job.institutionImage ? (
                            <img src={job.institutionImage} alt={job.institutionName ?? "School"} className="size-full object-cover" />
                          ) : (
                            (job.institutionName ?? "S").charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {job.institutionName ?? "School"}
                          </p>
                          <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-[#172033] transition-colors group-hover:text-[#184e77]">
                            {job.title}
                          </h3>
                        </div>
                      </div>

                      {/* tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {job.subject && (
                          <span className="rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-semibold text-[#184e77]">
                            {job.subject}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          <MapPin size={9} /> {job.location}
                        </span>
                        <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${typeColors[job.employmentType] ?? "bg-slate-100 text-slate-600"}`}>
                          {jobTypeLabel[job.employmentType]}
                        </span>
                      </div>

                      {/* salary + cta */}
                      <div className="mt-4 flex items-center justify-between border-t border-[#f1f5f9] pt-3.5">
                        <div>
                          <p className="text-[10px] text-slate-400">Salary</p>
                          <p className="text-xs font-bold text-[#287271]">
                            {job.salaryRange ?? "Not listed"}
                          </p>
                        </div>
                        <Link
                          to={`/jobs/${job._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#184e77] px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#1a6091]"
                        >
                          View & Apply <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

      </div>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-[#dbe4ef] bg-white">
        <div className="mx-auto w-full max-w-screen-xl px-6 lg:px-8">
          {/* main footer row */}
          <div className="flex flex-wrap items-center justify-between gap-6 py-8">
            {/* brand */}
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#184e77] to-[#287271] text-xs font-black text-white shadow-sm">
                E
              </span>
              <div>
                <p className="text-sm font-black text-[#172033]">EduStaff Connect</p>
                <p className="text-[11px] text-slate-400">Connecting teachers with schools across Nigeria</p>
              </div>
            </div>

            {/* links */}
            <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
              <a href="#" className="transition hover:text-[#184e77]">Privacy Policy</a>
              <a href="#" className="transition hover:text-[#184e77]">Terms of Use</a>
              <a href="#" className="transition hover:text-[#184e77]">Contact Support</a>
            </div>
          </div>

          {/* bottom bar */}
          <div className="border-t border-[#f1f5f9] py-4">
            <p className="text-center text-[11px] text-slate-400">
              © {new Date().getFullYear()} EduStaff Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Dashboard;
