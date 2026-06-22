import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  FileCheck2,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchAllTeachers } from "../services/queries";
import type { KycStatus, StaffRole, TeacherProfile } from "../types/TypeChecks";

const roleLabels: Record<StaffRole, string> = {
  TEACHER: "Teacher",
  DRIVER: "Driver",
  JANITOR: "Janitor",
  ADMIN_STAFF: "Admin Staff",
};

const statusTone: Record<KycStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  UNDER_REVIEW: "bg-[#e0f2fe] text-[#184e77] ring-[#bae6fd]",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  REJECTED: "bg-red-50 text-red-600 ring-red-100",
};

const statusLabel: Record<KycStatus, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const getInitials = (person: TeacherProfile) =>
  `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`.toUpperCase() || "ST";

const currentStatus = (person: TeacherProfile): KycStatus => person.kycStatus ?? "PENDING";

const evidenceChecks = (person: TeacherProfile) => [
  { done: Boolean(person.ninDocumentUrl) },
  { done: Boolean(person.certificateUrl) },
  { done: Boolean(person.email) },
  {
    done:
      person.staffRole !== "TEACHER" ||
      Boolean(person.teachingRecords.length || person.subjectExpertise.length),
  },
];

const completeness = (person: TeacherProfile) => {
  const checks = evidenceChecks(person);
  const done = checks.filter((item) => item.done).length;
  return { done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
};

const StatusBadge = ({ status }: { status: KycStatus }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset ${statusTone[status]}`}>
    {statusLabel[status]}
  </span>
);

const MetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
  active,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof ShieldCheck;
  active: boolean;
  tone: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border bg-white p-4 text-left shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:shadow-md ${
      active ? "border-[#184e77] ring-2 ring-[#184e77]/10" : "border-[#dbe4ef]"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-[#172033]">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
      </div>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </span>
    </div>
  </button>
);

const QueueCard = ({ person, onOpen }: { person: TeacherProfile; onOpen: () => void }) => {
  const score = completeness(person);
  const status = currentStatus(person);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-2xl border border-[#dbe4ef] bg-white p-4 text-left shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:border-[#184e77]/40 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#184e77] text-sm font-black text-white">
          {person.profileImage ? (
            <img src={person.profileImage} alt="" className="size-full object-cover" />
          ) : (
            getInitials(person)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-black text-[#172033]">
                {person.firstName} {person.lastName}
              </p>
              <p className="truncate text-xs text-slate-500">{person.email}</p>
            </div>
            <StatusBadge status={status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 font-bold text-slate-600">
              {roleLabels[person.staffRole]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f8fafc] px-2.5 py-1 font-bold text-slate-600">
              <MapPin size={11} />
              {person.location}
            </span>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Evidence</span>
              <span>{score.done}/{score.total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#287271]" style={{ width: `${score.percent}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end border-t border-[#eef2f7] pt-3 text-xs font-black text-[#184e77]">
        Review profile
        <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};

const AdminKycPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<KycStatus | "all">("all");
  const staffQuery = useFetchAllTeachers();

  const staff = staffQuery.data ?? [];
  const counts = {
    all: staff.length,
    pending: staff.filter((person) => currentStatus(person) === "PENDING").length,
    review: staff.filter((person) => currentStatus(person) === "UNDER_REVIEW").length,
    approved: staff.filter((person) => currentStatus(person) === "APPROVED").length,
    rejected: staff.filter((person) => currentStatus(person) === "REJECTED").length,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((person) => {
      const matchesSearch =
        !q ||
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q) ||
        person.staffRole.toLowerCase().includes(q) ||
        person.location.toLowerCase().includes(q);
      const matchesStatus = status === "all" || currentStatus(person) === status;
      return matchesSearch && matchesStatus;
    });
  }, [staff, search, status]);

  return (
    <SuperAdminLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Trust & readiness</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#172033]">Staff KYC Review</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Review identity evidence, teaching readiness, and profile completeness before staff are trusted in hiring workflows.
          </p>
        </div>
        <div className="rounded-2xl border border-[#dbe4ef] bg-white px-4 py-3 text-right shadow-sm shadow-slate-900/[0.03]">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Review queue</p>
          <p className="mt-1 text-2xl font-black text-[#172033]">{counts.pending + counts.review}</p>
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="All staff" value={counts.all} helper="Every profile" icon={UserRound} tone="bg-[#e0f2fe] text-[#184e77]" active={status === "all"} onClick={() => setStatus("all")} />
        <MetricCard label="Pending" value={counts.pending} helper="Needs first look" icon={ShieldAlert} tone="bg-amber-50 text-amber-700" active={status === "PENDING"} onClick={() => setStatus("PENDING")} />
        <MetricCard label="Reviewing" value={counts.review} helper="In progress" icon={FileCheck2} tone="bg-[#e0f2fe] text-[#184e77]" active={status === "UNDER_REVIEW"} onClick={() => setStatus("UNDER_REVIEW")} />
        <MetricCard label="Approved" value={counts.approved} helper="Verified staff" icon={ShieldCheck} tone="bg-emerald-50 text-emerald-600" active={status === "APPROVED"} onClick={() => setStatus("APPROVED")} />
        <MetricCard label="Rejected" value={counts.rejected} helper="Needs fixes" icon={XCircle} tone="bg-red-50 text-red-500" active={status === "REJECTED"} onClick={() => setStatus("REJECTED")} />
      </section>

      <div className="mb-5 rounded-xl border border-[#dbe4ef] bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-[#dbe4ef] bg-[#f8fafc] px-3 transition focus-within:border-[#184e77] focus-within:ring-2 focus-within:ring-[#184e77]/10">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, role, location"
              className="h-11 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as KycStatus | "all")}
            className="h-11 rounded-lg border border-[#dbe4ef] bg-white px-3 text-sm font-semibold text-[#172033] outline-none focus:border-[#184e77]"
          >
            <option value="all">All KYC statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <section className="rounded-xl border border-[#dbe4ef] bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-[#172033]">Review queue</h2>
            <p className="text-xs text-slate-500">{filtered.length} profile{filtered.length === 1 ? "" : "s"} in this view</p>
          </div>
        </div>

        {staffQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((person) => (
              <QueueCard key={person.id} person={person} onOpen={() => navigate(`/admin/kyc/${person.id}`)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#dbe4ef] py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f8fafc] text-slate-400">
              <Search size={20} />
            </span>
            <p className="mt-3 font-black text-[#172033]">No staff match this KYC view.</p>
            <p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p>
          </div>
        )}
      </section>
    </SuperAdminLayout>
  );
};

export default AdminKycPage;
