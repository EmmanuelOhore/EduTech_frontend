import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { nigeriaLocations, stateOptions } from "../lib/nigeriaLocations";
import { useCreateJobMutation, useCreateRotationalJobMetaMutation, useDeleteJobMutation, useUpdateJobMutation, useCreateJobTemplateMutation, useUpdateJobTemplateMutation, useDeleteJobTemplateMutation } from "../services/mutation";
import { useFetchInstitutionJobs, useFetchJobTemplates } from "../services/queries";
import { generateJobDescription } from "../services/base";
import type { JobTemplate } from "../services/base";
import type { CreateJobPayload, Job } from "../types/TypeChecks";

const SUBJECTS = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Economics", "Computer Science", "History", "French"];
const LEVELS = ["All Levels", "BEGINNER", "INTERMEDIATE", "EXPERT"];
const EMP_TYPES = ["FULL_TIME", "PART_TIME", "ROTATIONAL"];

type JobStatus = "Active" | "Draft";
type JobForm = {
  title: string;
  subject: string;
  state: string;
  lga: string;
  level: Job["level"];
  employmentType: Job["employmentType"];
  salaryRange: string;
  description: string;
  requirements: string;
  responsibilities: string;
  screeningQuestions: string;
  slots: number;
  status: JobStatus;
  // Rotational fields
  rotationMode?: "FIXED_DAYS" | "FLEXIBLE" | "SEASONAL" | "MULTI_BRANCH";
  scheduleSummary?: string;
  expectedSessionsPerWeek?: number;
  requiresWeekendAvailability?: boolean;
  requiresMultiBranchTravel?: boolean;
  rotationalBranches?: string;
};

const statusStyle: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Draft:  "bg-slate-100  text-slate-600  border-slate-200",
  Closed: "bg-red-50     text-red-600    border-red-200",
};

const typeStyle: Record<string, string> = {
  FULL_TIME:  "bg-blue-50  text-blue-700",
  PART_TIME:  "bg-amber-50 text-amber-700",
  ROTATIONAL: "bg-teal-50  text-teal-700",
};

const levelStyle: Record<string, string> = {
  BEGINNER:     "bg-slate-100  text-slate-600",
  INTERMEDIATE: "bg-amber-50   text-amber-700",
  EXPERT:       "bg-purple-50  text-purple-700",
};

const TYPE_LABELS: Record<Job["employmentType"], string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const LEVEL_LABELS: Record<Job["level"], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  EXPERT: "Expert",
};

const ITEMS_PER_PAGE = 5;

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const emptyJobForm: JobForm = {
  title: "",
  subject: "Mathematics",
  state: "Lagos",
  lga: "Lagos Mainland",
  level: "INTERMEDIATE",
  employmentType: "FULL_TIME",
  salaryRange: "",
  description: "",
  requirements: "",
  responsibilities: "",
  screeningQuestions: "",
  slots: 1,
  status: "Active",
  rotationMode: "FIXED_DAYS",
  scheduleSummary: "",
  expectedSessionsPerWeek: undefined,
  requiresWeekendAvailability: false,
  requiresMultiBranchTravel: false,
  rotationalBranches: "",
};

/* ── CREATE JOB PANEL ────────────────────────────────────────── */
interface CreatePanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (job: CreateJobPayload) => void;
  isSaving: boolean;
  editingJob?: Job | null;
}

const CreateJobPanel = ({ open, onClose, onSave, isSaving, editingJob }: CreatePanelProps) => {
  const [form, setForm] = useState(emptyJobForm);
  const [isGenerating, setIsGenerating] = useState(false);

  // Account-backed job templates (shared across the school's devices & teammates)
  const templatesQuery = useFetchJobTemplates(open);
  const templates = templatesQuery.data ?? [];
  const createTemplate = useCreateJobTemplateMutation();
  const updateTemplate = useUpdateJobTemplateMutation();
  const removeTemplate = useDeleteJobTemplateMutation();

  // Template-manager UI state
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    // Reset transient UI whenever the modal opens or closes, so nothing
    // carries over from the previous time it was used.
    setLibraryOpen(false);
    setTemplateSearch("");
    setShowSaveForm(false);
    setNewTemplateName("");
    setRenamingId(null);
    setIsGenerating(false);

    if (!editingJob) {
      setForm(emptyJobForm);
      return;
    }

    setForm({
      title: editingJob.title,
      subject: editingJob.subject ?? "Mathematics",
      state: editingJob.state ?? "Lagos",
      lga: editingJob.lga ?? editingJob.location ?? "Lagos Mainland",
      level: editingJob.level,
      employmentType: editingJob.employmentType,
      salaryRange: editingJob.salaryRange ?? "",
      description: editingJob.description ?? "",
      requirements: editingJob.requirements?.join("\n") ?? "",
      responsibilities: editingJob.responsibilities?.join("\n") ?? "",
      screeningQuestions: editingJob.screeningQuestions?.map((question) => question.question).join("\n") ?? "",
      slots: editingJob.slots ?? 1,
      status: editingJob.isActive ? "Active" : "Draft",
    });
  }, [editingJob, open]);

  // Apply a saved template's full content into the form.
  const applyTemplate = (t: JobTemplate) => {
    setForm((current) => ({
      ...current,
      description: t.description || current.description,
      requirements: t.requirements.join("\n"),
      responsibilities: t.responsibilities.join("\n"),
      screeningQuestions: t.screeningQuestions.join("\n"),
    }));
    setLibraryOpen(false);
    toast.success(`Applied "${t.name}"`);
  };

  // Save the current draft as a new named template.
  const handleSaveTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) {
      toast.error("Give the template a name");
      return;
    }
    createTemplate.mutate(
      {
        name,
        description: form.description,
        requirements: splitLines(form.requirements),
        responsibilities: splitLines(form.responsibilities),
        screeningQuestions: splitLines(form.screeningQuestions),
      },
      {
        onSuccess: () => {
          setNewTemplateName("");
          setShowSaveForm(false);
        },
      }
    );
  };

  const handleRename = (id: string) => {
    const name = renameValue.trim();
    if (!name) {
      toast.error("Name can't be empty");
      return;
    }
    updateTemplate.mutate(
      { id, data: { name } },
      { onSuccess: () => setRenamingId(null) }
    );
  };

  // Overwrite an existing template's content with the current draft.
  const handleOverwrite = (t: JobTemplate) => {
    updateTemplate.mutate({
      id: t._id,
      data: {
        description: form.description,
        requirements: splitLines(form.requirements),
        responsibilities: splitLines(form.responsibilities),
        screeningQuestions: splitLines(form.screeningQuestions),
      },
    });
  };

  // Templates matching the library search box.
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(templateSearch.trim().toLowerCase())
  );

  // Offline fallback: static template used when the AI call is unavailable.
  // Only fills fields the school has left empty, so it never wipes their input.
  const fillStaticDraft = () => {
    const title = form.title.trim() || `${form.subject} Staff`;
    setForm((current) => ({
      ...current,
      description: current.description || `${title} needed to support strong learning outcomes, daily school operations, and a safe, organized environment.`,
      requirements: current.requirements || [
        `Relevant qualification or proven experience in ${current.subject}`,
        "Strong communication and classroom management skills",
        "Ability to work with school leadership and parents professionally",
        "Reliable, punctual, and comfortable with school policies",
      ].join("\n"),
      responsibilities: current.responsibilities || [
        "Prepare and deliver clear weekly plans",
        "Track learner progress and give timely feedback",
        "Maintain a safe, orderly, and engaging learning environment",
        "Report important updates to school leadership",
      ].join("\n"),
      screeningQuestions: current.screeningQuestions || [
        "Do you have at least 2 years of relevant experience?",
        "What is your expected monthly salary?",
        `Are you available to work in ${current.lga}, ${current.state}?`,
      ].join("\n"),
    }));
  };

  // Primary path: AI-generated draft. Falls back to the static template if the
  // AI provider is unavailable (e.g. no API key configured), so the button
  // always does something useful.
  const generateDraft = async () => {
    if (isGenerating) return;
    if (!form.title.trim()) {
      toast.error("Add a job title first");
      return;
    }
    setIsGenerating(true);
    try {
      const draft = await generateJobDescription({
        title: form.title.trim(),
        subject: form.subject,
        level: form.level,
        employmentType: form.employmentType,
        state: form.state,
        lga: form.lga,
        salaryRange: form.salaryRange || undefined,
      });
      setForm((current) => ({
        ...current,
        description: draft.description || current.description,
        requirements: draft.requirements.length
          ? draft.requirements.join("\n")
          : current.requirements,
        responsibilities: draft.responsibilities.length
          ? draft.responsibilities.join("\n")
          : current.responsibilities,
        screeningQuestions: draft.screeningQuestions.length
          ? draft.screeningQuestions.join("\n")
          : current.screeningQuestions,
      }));
      toast.success("AI draft generated");
    } catch {
      fillStaticDraft();
      toast("AI unavailable — used a quick template instead");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const location = [form.lga, form.state].filter(Boolean).join(", ");
    const payload: CreateJobPayload = {
      title: form.title,
      subjectName: form.subject,
      location,
      state: form.state,
      lga: form.lga,
      level: form.level,
      employmentType: form.employmentType,
      description: form.description || undefined,
      salaryRange: form.salaryRange || undefined,
      requirements: splitLines(form.requirements),
      responsibilities: splitLines(form.responsibilities),
      screeningQuestions: splitLines(form.screeningQuestions).map((question) => ({
        question,
        type: question.toLowerCase().includes("salary") ? "NUMBER" : "TEXT",
        required: true,
      })),
      slots: form.slots,
      isActive: form.status === "Active",
    };
    if (form.employmentType === "ROTATIONAL") {
      payload.rotationMode = form.rotationMode;
      payload.scheduleSummary = form.scheduleSummary || undefined;
      payload.expectedSessionsPerWeek = form.expectedSessionsPerWeek || undefined;
      payload.requiresWeekendAvailability = form.requiresWeekendAvailability;
      payload.requiresMultiBranchTravel = form.requiresMultiBranchTravel;
      payload._rotationalBranches = form.rotationalBranches || undefined;
    }
    onSave(payload);
    setForm(emptyJobForm);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center p-4 transition duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Close create job form"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        className={`relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20 transition duration-200 ${
          open ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.98]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#dbe4ef] bg-[#f8fafc] px-6 py-5">
          <div>
            <p className="text-xs text-slate-400">{editingJob ? "Update the details for this posting" : "Fill in the details for the new posting"}</p>
            <h2 className="mt-1 text-xl font-black text-[#172033]">{editingJob ? "Edit Job" : "Create Job"}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-[#dbe4ef] text-slate-400 transition hover:bg-slate-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
            <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5">
              <div className="mb-4">
                <p className="text-sm font-black text-[#172033]">Job basics</p>
                <p className="text-xs text-slate-400">Title, subject, location, pay, and status.</p>
              </div>
              <div className="grid gap-4">

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-[#172033]">Job Title <span className="text-red-400">*</span></label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Senior Mathematics Teacher"
                className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:bg-white"
              />
            </div>

            {/* Subject + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-black text-[#172033]">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:bg-white"
                >
                  {SUBJECTS.slice(1).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black text-[#172033]">State</label>
                <select
                  value={form.state}
                  onChange={(e) => {
                    const nextState = e.target.value;
                    setForm({ ...form, state: nextState, lga: nigeriaLocations[nextState]?.[0] ?? "" });
                  }}
                  className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:bg-white"
                >
                  {stateOptions.map((state) => <option key={state}>{state}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black text-[#172033]">LGA</label>
              <select
                value={form.lga}
                onChange={(e) => setForm({ ...form, lga: e.target.value })}
                className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:bg-white"
              >
                {(nigeriaLocations[form.state] ?? []).map((lga) => <option key={lga}>{lga}</option>)}
              </select>
            </div>

            {/* Level + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-black text-[#172033]">Teacher Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as Job["level"] })}
                  className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:bg-white"
                >
                  {LEVELS.slice(1).map((l) => <option key={l} value={l}>{LEVEL_LABELS[l as Job["level"]]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black text-[#172033]">Employment Type</label>
                <select
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value as Job["employmentType"] })}
                  className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:bg-white"
                >
                  {EMP_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t as Job["employmentType"]]}</option>)}
                </select>
              </div>
            </div>

            {/* Slots + Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-black text-[#172033]">Open Slots</label>
                <input
                  type="number"
                  min={1}
                  value={form.slots}
                  onChange={(e) => setForm({ ...form, slots: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#172033] outline-none focus:border-[#184e77] focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black text-[#172033]">Salary Range <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={form.salaryRange}
                  onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                  placeholder="e.g. ₦150k – ₦200k"
                  className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:bg-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-[#172033]">Job Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:bg-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-[#172033]">Publish Status</label>
              <div className="flex gap-2">
                {(["Active", "Draft"] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm({ ...form, status: s })}
                    className={`flex-1 rounded-xl border py-2 text-xs font-black transition ${
                      form.status === s
                        ? "border-[#184e77] bg-[#184e77] text-white"
                        : "border-[#dbe4ef] bg-[#f8fafc] text-slate-600 hover:border-[#184e77]/40"
                    }`}
                  >
                    {s === "Active" ? "Publish Now" : "Save as Draft"}
                  </button>
                ))}
              </div>
            </div>

            {/* Rotational Config — only shows when ROTATIONAL is selected */}
            {form.employmentType === "ROTATIONAL" && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <RotateCcw size={14} className="text-teal-600" />
                  <p className="text-xs font-black text-teal-800">Rotational Schedule Details</p>
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-teal-800">Rotation Mode</label>
                    <select
                      value={form.rotationMode ?? "FIXED_DAYS"}
                      onChange={(e) => setForm({ ...form, rotationMode: e.target.value as JobForm["rotationMode"] })}
                      className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm text-[#172033] outline-none focus:border-teal-400"
                    >
                      <option value="FIXED_DAYS">Fixed Days — same days each week</option>
                      <option value="FLEXIBLE">Flexible — school assigns ad-hoc</option>
                      <option value="SEASONAL">Seasonal — active only for certain weeks</option>
                      <option value="MULTI_BRANCH">Multi-Branch — teacher rotates locations</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-teal-800">Schedule Summary <span className="font-normal text-teal-600">(shown to teachers)</span></label>
                    <input
                      value={form.scheduleSummary ?? ""}
                      onChange={(e) => setForm({ ...form, scheduleSummary: e.target.value })}
                      placeholder="e.g. Wednesday evenings and Saturday mornings"
                      className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-teal-800">Sessions / Week</label>
                      <input
                        type="number"
                        min={1}
                        value={form.expectedSessionsPerWeek ?? ""}
                        onChange={(e) => setForm({ ...form, expectedSessionsPerWeek: Number(e.target.value) || undefined })}
                        placeholder="e.g. 3"
                        className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-teal-800">Branches <span className="font-normal text-teal-600">(comma-separated)</span></label>
                      <input
                        value={form.rotationalBranches ?? ""}
                        onChange={(e) => setForm({ ...form, rotationalBranches: e.target.value })}
                        placeholder="e.g. Ikeja, Lekki"
                        className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: "requiresWeekendAvailability" as const, label: "Requires weekend availability" },
                      { key: "requiresMultiBranchTravel" as const, label: "Requires travel between branches" },
                    ].map((opt) => (
                      <label key={opt.key} className="flex cursor-pointer items-center gap-2.5 text-sm text-teal-800">
                        <input
                          type="checkbox"
                          checked={form[opt.key] ?? false}
                          onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })}
                          className="h-3.5 w-3.5 rounded border-teal-300 accent-teal-600"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-[#172033]">Requirements & Responsibilities</p>
                  <p className="text-xs text-slate-400">Write one item per line. Generate with AI, or save reusable templates.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateDraft}
                    disabled={isGenerating}
                    className="rounded-lg border border-[#184e77]/20 bg-[#e0f2fe] px-3 py-1.5 text-xs font-bold text-[#184e77] transition hover:bg-[#bfdbfe] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating ? "Generating…" : "✨ Generate with AI"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSaveForm((s) => !s); }}
                    className="rounded-lg bg-[#287271] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1f5f5e]"
                  >
                    Save as Template
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLibraryOpen(true); setShowSaveForm(false); }}
                    className="rounded-lg border border-[#dbe4ef] bg-white px-3 py-1.5 text-xs font-bold text-[#184e77] transition hover:bg-[#e0f2fe]"
                  >
                    Templates ({templates.length})
                  </button>
                </div>
              </div>

              {showSaveForm && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#287271]/20 bg-[#287271]/5 p-3">
                  <input
                    autoFocus
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
                    placeholder="Template name (e.g. Science Teacher — SS1–SS3)"
                    className="flex-1 rounded-lg border border-[#dbe4ef] bg-white px-3 py-2 text-sm outline-none focus:border-[#287271]"
                  />
                  <button type="button" onClick={handleSaveTemplate} disabled={createTemplate.isPending} className="rounded-lg bg-[#287271] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1f5f5e] disabled:opacity-60">
                    {createTemplate.isPending ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={() => { setShowSaveForm(false); setNewTemplateName(""); }} className="rounded-lg px-2 py-2 text-xs text-slate-400">Cancel</button>
                </div>
              )}

              {/* ── Template Library modal ── */}
              {libraryOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                  onClick={() => { setLibraryOpen(false); setRenamingId(null); }}
                >
                  <div
                    className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
                      <div>
                        <p className="text-base font-black text-[#172033]">Template Library</p>
                        <p className="text-xs text-slate-400">
                          {templates.length} saved template{templates.length === 1 ? "" : "s"} · click one to apply
                        </p>
                      </div>
                      <button type="button" onClick={() => setLibraryOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="border-b border-[#eef2f7] p-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          placeholder="Search templates…"
                          className="w-full rounded-lg border border-[#dbe4ef] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#184e77]"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                      {templatesQuery.isLoading ? (
                        <p className="px-2 py-8 text-center text-sm text-slate-400">Loading…</p>
                      ) : templates.length === 0 ? (
                        <div className="px-2 py-10 text-center">
                          <p className="text-sm font-semibold text-[#172033]">No templates yet</p>
                          <p className="mt-1 text-xs text-slate-400">Fill the requirements & responsibilities, then “Save as Template”.</p>
                        </div>
                      ) : filteredTemplates.length === 0 ? (
                        <p className="px-2 py-8 text-center text-sm text-slate-400">No templates match “{templateSearch}”.</p>
                      ) : (
                        <ul className="space-y-2">
                          {filteredTemplates.map((t) => (
                            <li key={t._id} className="rounded-xl border border-[#e5ecf4] transition hover:border-[#184e77]/40">
                              {renamingId === t._id ? (
                                <div className="flex items-center gap-2 p-3">
                                  <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleRename(t._id)}
                                    className="flex-1 rounded-lg border border-[#dbe4ef] px-3 py-1.5 text-sm outline-none focus:border-[#184e77]"
                                  />
                                  <button type="button" onClick={() => handleRename(t._id)} className="rounded-lg bg-[#287271] px-3 py-1.5 text-xs font-bold text-white">Save</button>
                                  <button type="button" onClick={() => setRenamingId(null)} className="text-xs text-slate-400">Cancel</button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-3">
                                  <button type="button" onClick={() => applyTemplate(t)} className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-bold text-[#172033]">{t.name}</p>
                                    <p className="truncate text-xs text-slate-400">
                                      {t.requirements.length} requirements · {t.responsibilities.length} responsibilities · {t.screeningQuestions.length} questions
                                    </p>
                                  </button>
                                  <button type="button" onClick={() => applyTemplate(t)} className="shrink-0 rounded-lg bg-[#184e77] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#123a5a]">
                                    Apply
                                  </button>
                                  <div className="flex shrink-0 items-center gap-1 text-slate-400">
                                    <button type="button" title="Rename" onClick={() => { setRenamingId(t._id); setRenameValue(t.name); }} className="rounded-lg p-1.5 transition hover:bg-slate-100 hover:text-[#184e77]">
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button type="button" title="Replace with current draft" onClick={() => handleOverwrite(t)} className="rounded-lg p-1.5 transition hover:bg-slate-100 hover:text-[#287271]">
                                      <RotateCcw className="h-4 w-4" />
                                    </button>
                                    <button type="button" title="Delete" onClick={() => removeTemplate.mutate(t._id)} className="rounded-lg p-1.5 transition hover:bg-red-50 hover:text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-[#172033]">Requirements</label>
                  <textarea
                    rows={7}
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    placeholder={"B.Ed. or B.Sc. in related field\n2+ years teaching experience\nStrong classroom management"}
                    className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-white px-4 py-2.5 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-[#172033]">Responsibilities</label>
                  <textarea
                    rows={7}
                    value={form.responsibilities}
                    onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                    placeholder={"Prepare weekly lesson notes\nAssess students and give feedback\nCommunicate with parents and school leadership"}
                    className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-white px-4 py-2.5 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-[#172033]">Checklist Questions</label>
                  <textarea
                    rows={5}
                    value={form.screeningQuestions}
                    onChange={(e) => setForm({ ...form, screeningQuestions: e.target.value })}
                    placeholder={"Do you have 2+ years experience?\nWhat is your expected salary?\nWhen can you resume?"}
                    className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-white px-4 py-2.5 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77]"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">One question per line. Applicants must answer these before submitting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#dbe4ef] bg-[#f8fafc] px-6 py-4">
          <button
            onClick={onClose}
            className="min-w-32 rounded-xl border border-[#dbe4ef] bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || isSaving}
            className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#1a6091] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} /> {isSaving ? "Saving..." : editingJob ? "Save Job" : "Create Job"}
          </button>
        </div>
      </section>
    </div>
  );
};

const DeleteConfirmModal = ({
  job,
  isDeleting,
  onClose,
  onConfirm,
}: {
  job: Job | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close delete confirmation"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-2xl shadow-slate-950/20">
        <div className="border-b border-[#dbe4ef] bg-[#fff7f7] px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wide text-red-500">Delete Job</p>
          <h2 className="mt-1 text-lg font-black text-[#172033]">Remove this posting?</h2>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-[#f3d6d6] bg-[#fffafa] p-4">
            <p className="text-sm font-semibold text-[#172033]">{job.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {job.subject} • {job.location} • {job._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            This will permanently delete the job posting and remove it from teacher listings. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dbe4ef] bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={14} />
              {isDeleting ? "Deleting..." : "Delete Job"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ── MAIN COMPONENT ───────────────────────────────────────────── */
const JobManagementPage = () => {
  const [search, setSearch]       = useState("");
  const [subject, setSubject]     = useState("All Subjects");
  const [location, setLocation]   = useState("All Locations");
  const [level, setLevel]         = useState("All Levels");
  const [panelOpen, setPanelOpen] = useState(false);
  const [page, setPage]           = useState(1);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const { auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const jobsQuery = useFetchInstitutionJobs(institutionId);
  const createJob = useCreateJobMutation();
  const updateJob = useUpdateJobMutation();
  const deleteJob = useDeleteJobMutation();
  const createRotationalMeta = useCreateRotationalJobMetaMutation();
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const locationOptions = useMemo(
    () => ["All Locations", ...Array.from(new Set(jobs.map((job) => job.lga || job.location).filter(Boolean)))],
    [jobs],
  );

  /* Filtering */
  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchQ   = !q || j.title.toLowerCase().includes(q) || j.subject?.toLowerCase().includes(q);
    const matchS   = subject  === "All Subjects"  || j.subject  === subject;
    const matchL   = location === "All Locations" || j.lga === location || j.location === location;
    const matchLvl = level    === "All Levels"    || j.level    === level;
    return matchQ && matchS && matchL && matchLvl;
  });

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCreate = (data: CreateJobPayload) => {
    if (editingJob) {
      updateJob.mutate({ id: editingJob._id, data });
      setEditingJob(null);
      return;
    }

    const { _rotationalBranches, ...jobData } = data as CreateJobPayload & { _rotationalBranches?: string };
    createJob.mutate({ ...jobData, institutionId }, {
      onSuccess: (createdJob) => {
        if (createdJob.employmentType === "ROTATIONAL") {
          const branches = _rotationalBranches
            ? _rotationalBranches.split(",").map((b: string) => b.trim()).filter(Boolean)
            : [];
          createRotationalMeta.mutate({
            jobId: createdJob._id,
            branches,
            preferredDays: [],
          });
        }
      },
    });
  };

  const handleDelete = () => {
    if (!deletingJob) return;
    deleteJob.mutate(deletingJob._id, {
      onSuccess: () => setDeletingJob(null),
    });
  };

  return (
    <AdminLayout>
      <DeleteConfirmModal
        job={deletingJob}
        isDeleting={deleteJob.isPending}
        onClose={() => setDeletingJob(null)}
        onConfirm={handleDelete}
      />
      <CreateJobPanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setEditingJob(null);
        }}
        onSave={handleCreate}
        isSaving={createJob.isPending || updateJob.isPending}
        editingJob={editingJob}
      />

      <div className="px-6 py-8 xl:px-8">

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#172033]">Job Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage all school job postings and openings</p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null);
              setPanelOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#1a6091] hover:shadow-md"
          >
            <Plus size={16} /> Create New Job
          </button>
        </div>

        {/* ── QUICK STATS ─────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Jobs",    value: jobs.length,                                          color: "bg-blue-500" },
            { label: "Active",        value: jobs.filter((j) => j.isActive).length,    color: "bg-emerald-500" },
            { label: "Draft",         value: jobs.filter((j) => !j.isActive).length,   color: "bg-slate-400" },
            { label: "Total Applicants", value: jobs.reduce((a, j) => a + (j.applicants ?? 0), 0), color: "bg-purple-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-[#dbe4ef] bg-white px-5 py-4 shadow-sm shadow-slate-900/[0.04]">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${s.color} shadow-sm`}>
                <BriefcaseBusiness size={18} className="text-white" />
              </span>
              <div>
                <p className="text-2xl font-black text-[#172033]">{s.value}</p>
                <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ──────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white px-5 py-4 shadow-sm shadow-slate-900/[0.04]">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search jobs..."
              className="w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] py-2 pl-9 pr-4 text-sm text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:bg-white"
            />
          </div>

          {/* Subject */}
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#184e77]"
          >
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>

          {/* Location */}
          <select
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(1); }}
            className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#184e77]"
          >
            {locationOptions.map((l) => <option key={l}>{l}</option>)}
          </select>

          {/* Level */}
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#184e77]"
          >
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>

          {/* Reset */}
          {(search || subject !== "All Subjects" || location !== "All Locations" || level !== "All Levels") && (
            <button
              onClick={() => { setSearch(""); setSubject("All Subjects"); setLocation("All Locations"); setLevel("All Levels"); setPage(1); }}
              className="flex items-center gap-1 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>

        {/* ── TABLE ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_100px] items-center border-b border-[#f1f5f9] bg-[#fafcff] px-6 py-3">
            {["Job Title", "Subject", "Location", "Level", "Type", "Posted", "Actions"].map((h) => (
              <span key={h} className="text-[10px] font-black uppercase tracking-wider text-slate-400">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="grid size-16 place-items-center rounded-2xl bg-[#f0f7ff]">
                <BriefcaseBusiness size={28} className="text-[#184e77]/40" />
              </div>
              <p className="text-sm font-black text-slate-400">
                {jobsQuery.isLoading ? "Loading jobs..." : "No jobs found"}
              </p>
              <p className="text-xs text-slate-400">Try adjusting your filters or create a new job</p>
              <button
                onClick={() => {
                  setEditingJob(null);
                  setPanelOpen(true);
                }}
                className="mt-1 flex items-center gap-2 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-black text-white transition hover:bg-[#1a6091]"
              >
                <Plus size={13} /> Create Job
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#f8fafc]">
              {paginated.map((job) => (
                <div
                  key={job._id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_100px] items-center gap-2 px-6 py-4 transition hover:bg-[#f8fafc]"
                >
                  {/* Title */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#172033]">{job.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">{job._id.slice(-8).toUpperCase()}</span>
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-black ${statusStyle[job.isActive ? "Active" : "Draft"]}`}>{job.isActive ? "Active" : "Draft"}</span>
                    </div>
                  </div>
                  {/* Subject */}
                  <span className="truncate rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-bold text-[#184e77]">{job.subject}</span>
                  {/* Location */}
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={10} className="shrink-0 text-slate-400" />{job.location}
                  </span>
                  {/* Level */}
                  <span className={`truncate rounded-lg px-2.5 py-1 text-[11px] font-bold ${levelStyle[job.level]}`}>{LEVEL_LABELS[job.level]}</span>
                  {/* Type */}
                  <span className={`truncate rounded-lg px-2.5 py-1 text-[11px] font-bold ${typeStyle[job.employmentType]}`}>{TYPE_LABELS[job.employmentType]}</span>
                  {/* Posted */}
                  <div>
                    <p className="text-xs text-slate-500">{job.postedAt}</p>
                    <p className="flex items-center gap-0.5 text-[11px] text-slate-400">
                      <Users size={9} /> {job.applicants ?? 0}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {job.employmentType === "ROTATIONAL" && (
                      <Link
                        to={`/school/jobs/${job._id}/sessions`}
                        title="Manage sessions & roster"
                        className="grid size-8 place-items-center rounded-lg border border-teal-200 text-teal-500 transition hover:bg-teal-50 hover:text-teal-700"
                      >
                        <RotateCcw size={13} />
                      </Link>
                    )}
                    <Link
                      to={`/school/jobs/${job._id}`}
                      title="View school job details"
                      className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-400 transition hover:border-[#184e77]/30 hover:bg-[#f0f7ff] hover:text-[#184e77]"
                    >
                      <Eye size={14} />
                    </Link>
                    <button
                      onClick={() => {
                        setEditingJob(job);
                        setPanelOpen(true);
                      }}
                      className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-400 transition hover:border-[#184e77]/30 hover:bg-[#f0f7ff] hover:text-[#184e77]"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingJob(job)}
                      disabled={deleteJob.isPending}
                      className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#f1f5f9] bg-[#fafcff] px-6 py-3">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-bold text-[#172033]">
                {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#172033]">
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#172033]">{filtered.length}</span> results
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`grid size-8 place-items-center rounded-lg border text-xs font-black transition ${
                    page === p
                      ? "border-[#184e77] bg-[#184e77] text-white"
                      : "border-[#dbe4ef] text-slate-500 hover:bg-[#f0f7ff]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="grid size-8 place-items-center rounded-lg border border-[#dbe4ef] text-slate-500 transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default JobManagementPage;
