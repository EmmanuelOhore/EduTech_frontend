import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Copy,
  Database,
  GraduationCap,
  Info,
  KeyRound,
  Layers,
  ListChecks,
  Mail,
  Minus,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import {
  useDeleteTestUsersMutation,
  useGenerateTestStaffMutation,
} from "../services/mutation";
import { useFetchJobs, useFetchTestDataSummary } from "../services/queries";
import type { ApplicationStatus, GenerateTestStaffResult } from "../types/TypeChecks";

const DEFAULT_PASSWORD = "12345678";
const DELETE_ALL_PHRASE = "DELETE TEST USERS";
const COUNT_PRESETS = [10, 25, 50, 100];

const copyText = (text: string) => {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Could not copy"),
    );
  }
};

const StatCard = ({
  label,
  value,
  note,
  icon: Icon,
  tone,
  accent,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof Users;
  tone: string;
  accent: string;
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/[0.06]">
    <span className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black text-[#172033]">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{note}</p>
      </div>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl transition group-hover:scale-105 ${tone}`}>
        <Icon size={20} />
      </span>
    </div>
  </div>
);

const Segmented = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: typeof Users }[];
}) => (
  <div className="inline-flex w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-1">
    {options.map((option) => {
      const Icon = option.icon;
      const active = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ${
            active
              ? "bg-white text-[#184e77] shadow-sm ring-1 ring-[#dbe4ef]"
              : "text-slate-500 hover:text-[#184e77]"
          }`}
        >
          {Icon && <Icon size={14} />}
          {option.label}
        </button>
      );
    })}
  </div>
);

const fieldClass =
  "h-12 w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10";

const STATUS_OPTIONS: { value: "MIXED" | ApplicationStatus; label: string }[] = [
  { value: "MIXED", label: "Mixed" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

const AdminToolsPage = () => {
  const summaryQuery = useFetchTestDataSummary();
  const jobsQuery = useFetchJobs();
  const generateMutation = useGenerateTestStaffMutation();
  const deleteMutation = useDeleteTestUsersMutation();

  const [count, setCount] = useState(25);
  const [roleMode, setRoleMode] = useState<"TEACHERS_ONLY" | "MIXED">("TEACHERS_ONLY");
  const [createApplications, setCreateApplications] = useState(true);
  const [applicationStatusMode, setApplicationStatusMode] = useState<"MIXED" | ApplicationStatus>("MIXED");
  const [jobId, setJobId] = useState("");
  const [batchToDelete, setBatchToDelete] = useState("");
  const [emailToDelete, setEmailToDelete] = useState("");
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
  const [lastResult, setLastResult] = useState<GenerateTestStaffResult | null>(null);

  const summary = summaryQuery.data;
  const activeJobs = useMemo(
    () => (jobsQuery.data ?? []).filter((job) => job.isActive !== false),
    [jobsQuery.data],
  );
  const batches = summary?.batches ?? [];

  const clampedCount = Math.min(200, Math.max(1, count || 0));
  const countValid = count >= 1 && count <= 200;
  const canGenerate = countValid && (!createApplications || activeJobs.length > 0);

  const roleLabel = roleMode === "TEACHERS_ONLY" ? "Teachers only" : "Mixed staff";
  const statusLabel = STATUS_OPTIONS.find((option) => option.value === applicationStatusMode)?.label ?? "Mixed";

  const generate = () => {
    generateMutation.mutate(
      {
        count,
        roleMode,
        createApplications,
        jobId: createApplications ? jobId || undefined : undefined,
        applicationStatusMode,
      },
      {
        onSuccess: (result) => setLastResult(result),
      },
    );
  };

  const deleteByBatch = () => {
    if (!batchToDelete.trim()) return;
    deleteMutation.mutate({ batchId: batchToDelete.trim() });
  };

  const deleteByEmail = () => {
    if (!emailToDelete.trim()) return;
    deleteMutation.mutate({ email: emailToDelete.trim() });
  };

  const deleteAll = () => {
    if (deleteAllConfirm !== DELETE_ALL_PHRASE) return;
    deleteMutation.mutate(
      { deleteAll: true },
      {
        onSuccess: () => setDeleteAllConfirm(""),
      },
    );
  };

  return (
    <SuperAdminLayout>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-gradient-to-br from-[#15466b] via-[#1c5a82] to-[#236d77] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Sparkles size={22} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/55">Admin Tools</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Test Data Generator</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/70">
                Generate realistic staff accounts for testing KYC, applications, public profiles, filters, dashboards, and school review flows.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyText(DEFAULT_PASSWORD)}
            className="group flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/20 transition hover:bg-white/15"
            title="Copy default password"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-white/15">
              <KeyRound size={16} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-widest text-white/55">Default password</span>
              <span className="mt-0.5 flex items-center gap-2 text-sm font-black">
                {DEFAULT_PASSWORD}
                <Copy size={13} className="text-white/50 transition group-hover:text-white" />
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Test users" value={summary?.users ?? 0} note="Generated user accounts" icon={Users} tone="bg-[#e0f2fe] text-[#184e77]" accent="bg-[#184e77]" />
        <StatCard label="Profiles" value={summary?.profiles ?? 0} note="Linked staff profiles" icon={BadgeCheck} tone="bg-emerald-50 text-emerald-700" accent="bg-emerald-500" />
        <StatCard label="Applications" value={summary?.applications ?? 0} note="Generated job applications" icon={BriefcaseBusiness} tone="bg-amber-50 text-amber-700" accent="bg-amber-400" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        {/* ── Generate panel ───────────────────────────────────── */}
        <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.03]">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#184e77] to-[#236d77] text-white shadow-sm">
              <Sparkles size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#172033]">Generate test staff</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Creates real database records with <code className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-xs font-bold text-[#184e77]">isTestData=true</code>. Teacher accounts can also be attached to active jobs as applications.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {/* Number of staff */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-black text-[#172033]">Number of staff</label>
                <span className="text-xs text-slate-400">1 – 200 per batch</span>
              </div>
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.max(1, (c || 1) - 1))}
                  className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#dbe4ef] bg-[#f8fafc] text-slate-500 transition hover:border-[#184e77]/30 hover:text-[#184e77]"
                  aria-label="Decrease"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                  className={`${fieldClass} text-center text-base font-black`}
                />
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.min(200, (c || 0) + 1))}
                  className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#dbe4ef] bg-[#f8fafc] text-slate-500 transition hover:border-[#184e77]/30 hover:text-[#184e77]"
                  aria-label="Increase"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {COUNT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCount(preset)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      count === preset
                        ? "bg-[#184e77] text-white"
                        : "border border-[#dbe4ef] bg-white text-slate-500 hover:border-[#184e77]/30 hover:text-[#184e77]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                {!countValid && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-red-600">
                    <AlertTriangle size={12} /> Enter a value between 1 and 200
                  </span>
                )}
              </div>
            </div>

            {/* Role mix */}
            <div>
              <label className="mb-2 block text-sm font-black text-[#172033]">Role mix</label>
              <Segmented
                value={roleMode}
                onChange={(value) => setRoleMode(value as "TEACHERS_ONLY" | "MIXED")}
                options={[
                  { value: "TEACHERS_ONLY", label: "Teachers only", icon: GraduationCap },
                  { value: "MIXED", label: "Mixed staff", icon: Users },
                ]}
              />
            </div>

            {/* Applications toggle */}
            <button
              type="button"
              onClick={() => setCreateApplications((value) => !value)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                createApplications
                  ? "border-[#184e77]/30 bg-[#f0f7ff]"
                  : "border-[#dbe4ef] bg-[#f8fafc] hover:border-[#184e77]/20"
              }`}
            >
              <span
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  createApplications ? "bg-[#184e77]" : "bg-slate-300"
                }`}
              >
                <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${createApplications ? "translate-x-6" : "translate-x-1"}`} />
              </span>
              <span>
                <span className="block text-sm font-black text-[#172033]">Create job applications too</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Best for testing the school Applications page. Only generated teachers receive applications.
                </span>
              </span>
            </button>

            {createApplications && (
              <div className="grid gap-5 rounded-xl border border-[#eef2f7] bg-[#fafcff] p-4 sm:grid-cols-1">
                <label className="grid gap-2 text-sm font-black text-[#172033]">
                  Job target
                  <select value={jobId} onChange={(event) => setJobId(event.target.value)} className={fieldClass}>
                    <option value="">Spread across active jobs</option>
                    {activeJobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title} - {job.institutionName ?? "School"}
                      </option>
                    ))}
                  </select>
                  {!activeJobs.length && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                      <AlertTriangle size={12} /> Create an active job before generating applications.
                    </span>
                  )}
                </label>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#172033]">Application status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((option) => {
                      const active = applicationStatusMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setApplicationStatusMode(option.value)}
                          className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${
                            active
                              ? "bg-[#184e77] text-white shadow-sm"
                              : "border border-[#dbe4ef] bg-white text-slate-500 hover:border-[#184e77]/30 hover:text-[#184e77]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview + action */}
          <div className="mt-6 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Info size={12} /> What will be created
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#172033] ring-1 ring-[#dbe4ef]">
                <Users size={12} className="text-[#184e77]" /> {clampedCount} accounts
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#172033] ring-1 ring-[#dbe4ef]">
                <Layers size={12} className="text-[#287271]" /> {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#172033] ring-1 ring-[#dbe4ef]">
                <BriefcaseBusiness size={12} className="text-amber-600" />
                {createApplications ? `Applications: ${statusLabel}` : "No applications"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={!canGenerate || generateMutation.isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#184e77] to-[#236d77] px-6 text-sm font-black text-white shadow-sm shadow-[#184e77]/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
            >
              <Database size={17} />
              {generateMutation.isPending ? "Generating…" : "Generate test data"}
            </button>
            <p className="text-xs leading-5 text-slate-500">
              All test accounts use password <span className="font-black text-[#172033]">{DEFAULT_PASSWORD}</span>.
            </p>
          </div>

          {lastResult && (
            <div className="mt-6 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="flex items-center justify-between gap-3 border-b border-emerald-200/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-emerald-500 text-white">
                    <Check size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-emerald-800">Batch created</p>
                    <p className="text-xs text-emerald-700/80">{lastResult.batchId}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: "Users", value: lastResult.created.users },
                    { label: "Profiles", value: lastResult.created.profiles },
                    { label: "Apps", value: lastResult.created.applications },
                  ].map((stat) => (
                    <span key={stat.label} className="rounded-lg bg-white px-2.5 py-1 text-center text-xs font-black text-emerald-700">
                      {stat.value}
                      <span className="ml-1 font-bold text-emerald-600/70">{stat.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 p-4">
                {lastResult.sampleAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => copyText(account.email)}
                    className="group flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left text-xs text-slate-600 ring-1 ring-emerald-100 transition hover:ring-emerald-300"
                  >
                    <span className="truncate">
                      <span className="font-black text-[#172033]">{account.email}</span>
                      <span className="text-slate-400"> / {account.password}</span>
                    </span>
                    <Copy size={13} className="shrink-0 text-slate-300 transition group-hover:text-emerald-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Management column ─────────────────────────────────── */}
        <div className="grid gap-5">
          <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.03]">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={20} />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#172033]">Hard delete test users</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Deletes generated test users only, plus linked test profiles and applications.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5">
              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-black text-[#172033]">
                  <Layers size={13} className="text-slate-400" /> Delete by batch
                </label>
                <select value={batchToDelete} onChange={(event) => setBatchToDelete(event.target.value)} className={fieldClass}>
                  <option value="">Choose a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.batchId} value={batch.batchId}>
                      {batch.batchId} ({batch.users} users)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={deleteByBatch}
                  disabled={!batchToDelete || deleteMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete batch
                </button>
              </div>

              <div className="grid gap-2 border-t border-[#eef2f7] pt-5">
                <label className="flex items-center gap-1.5 text-sm font-black text-[#172033]">
                  <Mail size={13} className="text-slate-400" /> Delete by test email
                </label>
                <input
                  value={emailToDelete}
                  onChange={(event) => setEmailToDelete(event.target.value)}
                  placeholder="name.batch@test.edustaff.local"
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={deleteByEmail}
                  disabled={!emailToDelete.trim() || deleteMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete email
                </button>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm shadow-slate-900/[0.03]">
            <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 p-5">
              <ShieldAlert size={20} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <h3 className="font-black text-red-700">Danger zone</h3>
                <p className="mt-1 text-sm leading-6 text-red-700/80">
                  Permanently deletes <span className="font-black">every</span> generated test user. Type the phrase below to confirm.
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-2 text-xs font-bold text-slate-500">
                Type <span className="rounded bg-red-50 px-1.5 py-0.5 font-black text-red-600">{DELETE_ALL_PHRASE}</span> to enable
              </p>
              <input
                value={deleteAllConfirm}
                onChange={(event) => setDeleteAllConfirm(event.target.value)}
                placeholder={DELETE_ALL_PHRASE}
                className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-sm font-bold tracking-wide outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              />
              <button
                type="button"
                onClick={deleteAll}
                disabled={deleteAllConfirm !== DELETE_ALL_PHRASE || deleteMutation.isPending}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <AlertTriangle size={16} />
                Delete all generated test users
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent batches ─────────────────────────────────────── */}
      <section className="mt-5 rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.03]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#184e77]/10 text-[#184e77]">
              <ListChecks size={18} />
            </span>
            <div>
              <h2 className="font-black text-[#172033]">Recent batches</h2>
              <p className="text-xs text-slate-500">Newest generated groups are shown first.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => summaryQuery.refetch()}
            disabled={summaryQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dbe4ef] px-3 py-2 text-xs font-black text-[#184e77] transition hover:bg-[#f8fafc] disabled:opacity-50"
          >
            <RotateCcw size={14} className={summaryQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-2">
          {batches.map((batch) => (
            <div
              key={batch.batchId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-3 transition hover:border-[#dbe4ef] hover:bg-white"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#184e77] ring-1 ring-[#dbe4ef]">
                  <Database size={15} />
                </span>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => copyText(batch.batchId)}
                    className="group flex items-center gap-1.5 truncate font-black text-[#172033]"
                    title="Copy batch ID"
                  >
                    <span className="truncate">{batch.batchId}</span>
                    <Copy size={12} className="shrink-0 text-slate-300 transition group-hover:text-[#184e77]" />
                  </button>
                  <p className="text-xs text-slate-500">{new Date(batch.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-black text-[#184e77] ring-1 ring-[#dbe4ef]">
                  <Users size={12} /> {batch.users} users
                </span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate({ batchId: batch.batchId })}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!batches.length && (
            <div className="rounded-xl border border-dashed border-[#dbe4ef] p-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f8fafc] text-slate-400">
                <Database size={20} />
              </span>
              <p className="mt-3 font-black text-[#172033]">No generated batches yet.</p>
              <p className="mt-1 text-sm text-slate-500">Generate test staff and batches will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </SuperAdminLayout>
  );
};

export default AdminToolsPage;
