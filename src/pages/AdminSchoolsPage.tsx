import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchAllInstitutions } from "../services/queries";
import { useDeactivateInstitutionMutation, useVerifyInstitutionMutation, useSetInstitutionPlanMutation } from "../services/mutation";
import type { FullInstitution } from "../types/TypeChecks";

const openDoc = (url?: string) => {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
};

const planLabels = {
  NONE: "No plan",
  BASIC: "Basic",
  ENTERPRISE: "Enterprise",
  PRO: "PRO",
};

const planTone = {
  NONE: "bg-slate-100 text-slate-500",
  BASIC: "bg-sky-50 text-[#184e77]",
  ENTERPRISE: "bg-teal-50 text-[#287271]",
  PRO: "bg-violet-50 text-violet-700",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SC";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({
  label,
  value,
  note,
  icon: Icon,
  tone,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof Building2;
  tone: string;
  accent: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/[0.06] ${
      active ? "border-[#184e77] ring-2 ring-[#184e77]/15" : "border-[#dbe4ef]"
    }`}
  >
    <span className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-[#172033]">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{note}</p>
      </div>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl transition group-hover:scale-105 ${tone}`}>
        <Icon size={20} />
      </span>
    </div>
  </button>
);

const StatusBadge = ({ school }: { school: FullInstitution }) => {
  if (!school.isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600 ring-1 ring-inset ring-red-100">
        <XCircle size={13} />
        Inactive
      </span>
    );
  }

  return school.isVerified ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-inset ring-emerald-100">
      <CheckCircle2 size={13} />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-inset ring-amber-100">
      <Clock3 size={13} />
      Pending review
    </span>
  );
};

const PlanBadge = ({ planType }: { planType?: FullInstitution["planType"] }) => {
  const plan = planType ?? "NONE";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${planTone[plan]}`}>
      {planLabels[plan]}
    </span>
  );
};

const DocumentButton = ({
  label,
  url,
  viewed,
  onView,
}: {
  label: string;
  url?: string;
  viewed?: boolean;
  onView?: () => void;
}) => (
  <button
    type="button"
    onClick={() => {
      openDoc(url);
      onView?.();
    }}
    disabled={!url}
    className="group inline-flex w-full items-center gap-3 rounded-xl border border-[#dbe4ef] bg-white px-3 py-2.5 text-xs font-bold text-[#172033] transition hover:border-[#184e77]/40 hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-40"
  >
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-lg transition ${
        viewed ? "bg-emerald-50 text-emerald-600" : "bg-[#eef6fb] text-[#184e77]"
      }`}
    >
      {viewed ? <CheckCircle2 size={16} /> : <FileText size={15} />}
    </span>
    <span className="flex-1 text-left">
      {label}
      {!url && <span className="ml-1 font-medium text-slate-400">(not uploaded)</span>}
    </span>
    {viewed ? (
      <span className="text-[10px] font-black uppercase tracking-wide text-emerald-600">Viewed</span>
    ) : (
      url && <ExternalLink size={13} className="text-slate-400 transition group-hover:text-[#184e77]" />
    )}
  </button>
);

const QueueSkeleton = () => (
  <div className="divide-y divide-[#eef2f7]">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-4">
        <span className="size-12 shrink-0 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <span className="block h-3.5 w-40 animate-pulse rounded bg-slate-100" />
          <span className="block h-3 w-56 animate-pulse rounded bg-slate-100" />
        </div>
        <span className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
      </div>
    ))}
  </div>
);

const AdminSchoolsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [viewedDocs, setViewedDocs] = useState<Record<string, boolean>>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const schoolsQuery = useFetchAllInstitutions();
  const verifyMutation = useVerifyInstitutionMutation();
  const deactivateMutation = useDeactivateInstitutionMutation();
  const setPlanMutation = useSetInstitutionPlanMutation();

  const schools = schoolsQuery.data ?? [];
  const totalVerified = schools.filter((school) => school.isVerified).length;
  const totalPending = schools.filter((school) => !school.isVerified && school.isActive).length;
  const totalInactive = schools.filter((school) => !school.isActive).length;

  const counts: Record<string, number> = {
    all: schools.length,
    pending: totalPending,
    verified: totalVerified,
    inactive: totalInactive,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((school) => {
      const matchesSearch =
        !q ||
        school.name.toLowerCase().includes(q) ||
        school.email.toLowerCase().includes(q) ||
        school.location.toLowerCase().includes(q);
      const matchesStatus =
        status === "all" ||
        (status === "verified" && school.isVerified) ||
        (status === "pending" && !school.isVerified && school.isActive) ||
        (status === "inactive" && !school.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [schools, search, status]);

  const selectedSchool =
    filtered.find((school) => school._id === selectedSchoolId) ?? filtered[0] ?? null;

  // Reset the deactivate confirmation whenever the selected school changes.
  useEffect(() => {
    setConfirmDeactivate(false);
  }, [selectedSchool?._id]);

  const markViewed = (key: string) =>
    setViewedDocs((prev) => ({ ...prev, [key]: true }));

  const handleVerify = (school: FullInstitution) => {
    verifyMutation.mutate(school._id);
  };

  const handleDeactivate = (school: FullInstitution) => {
    deactivateMutation.mutate(school._id, { onSuccess: () => setConfirmDeactivate(false) });
  };

  const handlePlanChange = (
    school: FullInstitution,
    planType: "BASIC" | "ENTERPRISE" | "PRO",
  ) => {
    setPlanMutation.mutate({ id: school._id, planType });
  };

  const hasDocs = (school: FullInstitution) =>
    Boolean(school.utilityBillUrl || school.authorizationLetterUrl);

  const requiredDocsViewed = (school: FullInstitution) => {
    const keys: string[] = [];
    if (school.utilityBillUrl) keys.push(`${school._id}-utility`);
    if (school.authorizationLetterUrl) keys.push(`${school._id}-auth`);
    if (!keys.length) return true; // nothing to review
    return keys.every((k) => viewedDocs[k]);
  };

  return (
    <SuperAdminLayout>
      <div className="mb-6 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-gradient-to-br from-[#15466b] via-[#1c5a82] to-[#236d77] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/55">Schools</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">School Verification</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/70">
                Review school documents, approve legitimate institutions, and keep service plans tidy from one workspace.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => schoolsQuery.refetch()}
              disabled={schoolsQuery.isFetching}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15 disabled:opacity-50"
            >
              <RotateCcw size={15} className={schoolsQuery.isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/55">Review queue</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-black">
                <Clock3 size={14} className="text-amber-300" />
                {totalPending} pending {totalPending === 1 ? "school" : "schools"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total schools" value={schools.length} note="All registered institutions" icon={Building2} tone="bg-[#e0f2fe] text-[#184e77]" accent="bg-[#184e77]" active={status === "all"} onClick={() => setStatus("all")} />
        <StatCard label="Pending" value={totalPending} note="Needs document review" icon={Clock3} tone="bg-amber-50 text-amber-700" accent="bg-amber-400" active={status === "pending"} onClick={() => setStatus("pending")} />
        <StatCard label="Verified" value={totalVerified} note="Approved to operate" icon={ShieldCheck} tone="bg-emerald-50 text-emerald-700" accent="bg-emerald-500" active={status === "verified"} onClick={() => setStatus("verified")} />
        <StatCard label="Inactive" value={totalInactive} note="Paused or deactivated" icon={XCircle} tone="bg-red-50 text-red-600" accent="bg-red-500" active={status === "inactive"} onClick={() => setStatus("inactive")} />
      </section>

      <div className="mb-5 rounded-2xl border border-[#dbe4ef] bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 transition focus-within:border-[#184e77] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#184e77]/10">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search school, email, location"
              className="h-11 w-full bg-transparent text-sm outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 transition hover:text-slate-600"
                aria-label="Clear search"
              >
                <XCircle size={16} />
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["verified", "Verified"],
              ["inactive", "Inactive"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                  status === value
                    ? "bg-[#184e77] text-white shadow-sm"
                    : "border border-[#dbe4ef] bg-white text-slate-600 hover:bg-[#f8fafc] hover:text-[#184e77]"
                }`}
              >
                {label}
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-black ${
                    status === value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {counts[value] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.03]">
          <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#184e77]/10 text-[#184e77]">
                <Building2 size={18} />
              </span>
              <div>
                <h2 className="font-black text-[#172033]">Institution queue</h2>
                <p className="text-xs text-slate-500">
                  {schoolsQuery.isLoading
                    ? "Loading institutions…"
                    : `${filtered.length} result${filtered.length === 1 ? "" : "s"} in this view`}
                </p>
              </div>
            </div>
          </div>

          {schoolsQuery.isLoading ? (
            <QueueSkeleton />
          ) : schoolsQuery.isError ? (
            <div className="px-4 py-14 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-red-500">
                <AlertTriangle size={20} />
              </span>
              <p className="mt-3 font-black text-[#172033]">Couldn't load institutions.</p>
              <p className="mt-1 text-sm text-slate-500">Something went wrong fetching the queue.</p>
              <button
                type="button"
                onClick={() => schoolsQuery.refetch()}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#184e77] px-4 text-sm font-black text-white transition hover:bg-[#123d5f]"
              >
                <RotateCcw size={15} />
                Try again
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#eef2f7]">
              {filtered.map((school) => {
                const isSelected = selectedSchool?._id === school._id;
                return (
                  <button
                    key={school._id}
                    type="button"
                    onClick={() => setSelectedSchoolId(school._id)}
                    className={`relative grid w-full gap-4 px-4 py-4 text-left transition hover:bg-[#f8fafc] lg:grid-cols-[minmax(240px,1.4fr)_0.8fr_0.8fr_1.3fr] ${
                      isSelected ? "bg-[#eef6fb]" : "bg-white"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-1 rounded-r-full transition-all ${
                        isSelected ? "bg-[#184e77]" : "bg-transparent"
                      }`}
                    />
                    <div className="flex min-w-0 gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#184e77] to-[#287271] text-sm font-black text-white">
                        {getInitials(school.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black text-[#172033]">{school.name}</p>
                        <p className="truncate text-xs text-slate-500">{school.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2 lg:hidden">
                          <StatusBadge school={school} />
                          <PlanBadge planType={school.planType} />
                        </div>
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                      <p className="mt-1 text-sm font-bold text-[#172033]">{school.type}</p>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[#172033]">
                        <MapPin size={13} className="text-slate-400" />
                        {school.location}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <div className="hidden lg:flex lg:flex-wrap lg:justify-end lg:gap-2">
                        <StatusBadge school={school} />
                        <PlanBadge planType={school.planType} />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-black transition ${
                          isSelected
                            ? "bg-[#184e77] text-white"
                            : "border border-[#dbe4ef] text-[#184e77]"
                        }`}
                      >
                        {isSelected ? "Reviewing" : "Review"}
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  </button>
                );
              })}

              {!filtered.length && (
                <div className="px-4 py-14 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f8fafc] text-slate-400">
                    <Search size={20} />
                  </span>
                  <p className="mt-3 font-black text-[#172033]">No schools match this view.</p>
                  <p className="mt-1 text-sm text-slate-500">Try a different search term or status filter.</p>
                  {(search || status !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatus("all");
                      }}
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-[#dbe4ef] px-4 text-sm font-bold text-[#184e77] transition hover:bg-[#f0f7ff]"
                    >
                      <RotateCcw size={14} />
                      Reset filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          {selectedSchool ? (
            <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
              <div className="relative border-b border-[#eef2f7] bg-gradient-to-br from-[#f8fafc] to-[#eef6fb] p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#287271] to-[#184e77] text-sm font-black text-white shadow-sm">
                    {getInitials(selectedSchool.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Selected school</p>
                    <h2 className="mt-1 truncate text-xl font-black text-[#172033]">{selectedSchool.name}</h2>
                    <p className="truncate text-sm text-slate-500">{selectedSchool.email}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge school={selectedSchool} />
                  <PlanBadge planType={selectedSchool.planType} />
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                    <p className="mt-1 text-sm font-bold text-[#172033]">{selectedSchool.type}</p>
                  </div>
                  <div className="rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[#172033]">
                      <MapPin size={13} className="text-slate-400" />
                      {selectedSchool.location}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 rounded-xl border border-[#eef2f7] p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Phone size={13} className="text-slate-400" /> Phone
                    </span>
                    <span className="truncate font-bold text-[#172033]">{selectedSchool.phone || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-[#eef2f7] pt-2">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Globe size={13} className="text-slate-400" /> Website
                    </span>
                    {selectedSchool.website ? (
                      <a
                        href={selectedSchool.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-bold text-[#184e77] hover:underline"
                      >
                        {selectedSchool.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="font-bold text-[#172033]">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-[#eef2f7] pt-2">
                    <span className="flex items-center gap-2 text-slate-500">
                      <CalendarDays size={13} className="text-slate-400" /> Registered
                    </span>
                    <span className="font-bold text-[#172033]">{formatDate(selectedSchool.createdAt)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#172033]">Verification documents</p>
                    {hasDocs(selectedSchool) && (
                      <span
                        className={`text-[10px] font-black uppercase tracking-wide ${
                          requiredDocsViewed(selectedSchool) ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {requiredDocsViewed(selectedSchool) ? "All reviewed" : "Review needed"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Open each document before approving the school.
                  </p>
                  <div className="mt-3 grid gap-2">
                    <DocumentButton
                      label="Recent utility bill"
                      url={selectedSchool.utilityBillUrl}
                      viewed={viewedDocs[`${selectedSchool._id}-utility`]}
                      onView={() => markViewed(`${selectedSchool._id}-utility`)}
                    />
                    <DocumentButton
                      label="Authorization letter"
                      url={selectedSchool.authorizationLetterUrl}
                      viewed={viewedDocs[`${selectedSchool._id}-auth`]}
                      onView={() => markViewed(`${selectedSchool._id}-auth`)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-[#172033]">Service plan</label>
                  <select
                    value={selectedSchool.planType ?? "NONE"}
                    onChange={(event) =>
                      handlePlanChange(
                        selectedSchool,
                        event.target.value as "BASIC" | "ENTERPRISE" | "PRO",
                      )
                    }
                    disabled={setPlanMutation.isPending}
                    className="mt-2 h-12 w-full rounded-xl border border-[#dbe4ef] bg-white px-3 text-sm font-bold text-[#172033] outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10 disabled:opacity-60"
                    title="Set service plan"
                  >
                    <option value="NONE" disabled>No plan selected</option>
                    <option value="BASIC">Basic - Placement only</option>
                    <option value="ENTERPRISE">Enterprise - Managed scheduling</option>
                    <option value="PRO">PRO - Full service</option>
                  </select>
                </div>

                <div className="grid gap-2 border-t border-[#eef2f7] pt-4">
                  {!selectedSchool.isVerified &&
                    selectedSchool.isActive &&
                    hasDocs(selectedSchool) &&
                    !requiredDocsViewed(selectedSchool) && (
                      <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                        <AlertTriangle size={14} />
                        Open both documents before approving.
                      </p>
                    )}
                  <button
                    type="button"
                    onClick={() => handleVerify(selectedSchool)}
                    disabled={
                      selectedSchool.isVerified ||
                      verifyMutation.isPending ||
                      !requiredDocsViewed(selectedSchool)
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#184e77] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#123d5f] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShieldCheck size={17} />
                    {selectedSchool.isVerified
                      ? "Already verified"
                      : verifyMutation.isPending
                        ? "Approving…"
                        : "Approve school"}
                  </button>

                  {confirmDeactivate ? (
                    <div className="grid gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-bold text-red-700">
                        Deactivate {selectedSchool.name}? They will lose access until reactivated.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeactivate(false)}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dbe4ef] bg-white text-xs font-black text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(selectedSchool)}
                          disabled={deactivateMutation.isPending}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-600 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          {deactivateMutation.isPending ? "Working…" : "Confirm"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeactivate(true)}
                      disabled={!selectedSchool.isActive}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <XCircle size={17} />
                      {selectedSchool.isActive ? "Deactivate school" : "Already inactive"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white p-8 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f8fafc] text-slate-400">
                <ShieldCheck size={20} />
              </span>
              <p className="mt-3 font-black text-[#172033]">Select a school</p>
              <p className="mt-1 text-sm text-slate-500">The review panel will appear here.</p>
            </div>
          )}
        </aside>
      </section>
    </SuperAdminLayout>
  );
};

export default AdminSchoolsPage;
