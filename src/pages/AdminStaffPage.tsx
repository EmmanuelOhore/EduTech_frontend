import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchAllTeachers } from "../services/queries";
import type { KycStatus, StaffRole, TeacherProfile } from "../types/TypeChecks";

const roleLabels: Record<StaffRole, string> = {
  TEACHER: "Teacher",
  DRIVER: "Driver",
  JANITOR: "Janitor",
  ADMIN_STAFF: "Admin Staff",
};

const roleTone: Record<StaffRole, string> = {
  TEACHER: "bg-[#e0f2fe] text-[#184e77]",
  DRIVER: "bg-amber-50 text-amber-700",
  JANITOR: "bg-teal-50 text-[#287271]",
  ADMIN_STAFF: "bg-violet-50 text-violet-700",
};

const kycTone: Record<KycStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-[#e0f2fe] text-[#184e77]",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
};

const roleIcons: Record<StaffRole, typeof Users> = {
  TEACHER: GraduationCap,
  DRIVER: UserRound,
  JANITOR: ShieldCheck,
  ADMIN_STAFF: Users,
};

const getInitials = (person: TeacherProfile) =>
  `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`.toUpperCase() ||
  "ST";

const currentKyc = (person: TeacherProfile): KycStatus => person.kycStatus ?? "PENDING";

const profileScore = (person: TeacherProfile) => {
  const checks = [
    Boolean(person.email),
    Boolean(person.location && person.location !== "Not set"),
    Boolean(person.profileImage),
    Boolean(person.ninDocumentUrl),
    Boolean(person.certificateUrl),
    person.staffRole !== "TEACHER" ||
      Boolean(person.teachingRecords.length || person.subjectExpertise.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const roleCount = (staff: TeacherProfile[], role: StaffRole) =>
  staff.filter((person) => person.staffRole === role).length;

const KycPill = ({ status }: { status: KycStatus }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-black ${kycTone[status]}`}>
    {status.replace("_", " ")}
  </span>
);

const RoleTile = ({
  role,
  count,
  total,
  active,
  onClick,
}: {
  role: StaffRole;
  count: number;
  total: number;
  active: boolean;
  onClick: () => void;
}) => {
  const Icon = roleIcons[role];
  const percent = total ? Math.round((count / total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#184e77] ring-2 ring-[#184e77]/10" : "border-[#dbe4ef]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 place-items-center rounded-xl ${roleTone[role]}`}>
          <Icon size={19} />
        </span>
        <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-xs font-black text-slate-500">
          {percent}%
        </span>
      </div>
      <p className="mt-4 text-2xl font-black text-[#172033]">{count}</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{roleLabels[role]}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#287271]" style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
};

const StaffAvatar = ({ person }: { person: TeacherProfile }) => (
  <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#184e77] text-xs font-black text-white">
    {person.profileImage ? (
      <img src={person.profileImage} alt="" className="size-full object-cover" />
    ) : (
      getInitials(person)
    )}
  </span>
);

const AdminStaffPage = () => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<StaffRole | "all">("all");
  const [kyc, setKyc] = useState<KycStatus | "all">("all");
  const staffQuery = useFetchAllTeachers();
  const staff = staffQuery.data ?? [];

  const counts = {
    all: staff.length,
    available: staff.filter((person) => person.isAvailable).length,
    approved: staff.filter((person) => currentKyc(person) === "APPROVED").length,
    publicProfiles: staff.filter((person) => Boolean(person.publicSlug)).length,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((person) => {
      const matchesSearch =
        !q ||
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q) ||
        person.location.toLowerCase().includes(q) ||
        person.staffRole.toLowerCase().includes(q) ||
        person.subjectExpertise.some((item) => item.subject.toLowerCase().includes(q));
      const matchesRole = role === "all" || person.staffRole === role;
      const matchesKyc = kyc === "all" || currentKyc(person) === kyc;
      return matchesSearch && matchesRole && matchesKyc;
    });
  }, [staff, search, role, kyc]);

  return (
    <SuperAdminLayout>
      <section className="mb-6 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
        <div className="grid gap-0 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="relative overflow-hidden bg-[#184e77] p-6 text-white">
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-widest text-white/65">Directory</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">All Staff</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Browse staff across roles, locations, profile readiness, public visibility, and KYC state.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15">
                  {counts.all} total profiles
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15">
                  {counts.available} available
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15">
                  {counts.publicProfiles} public profiles
                </span>
              </div>
            </div>
            <span className="absolute -right-16 -top-16 size-44 rounded-full bg-white/10" />
            <span className="absolute -bottom-14 right-28 size-32 rounded-full bg-[#287271]/50" />
          </div>

          <div className="grid grid-cols-2 gap-px bg-[#eef2f7]">
            <div className="bg-white p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Approved</p>
              <p className="mt-2 text-3xl font-black text-[#172033]">{counts.approved}</p>
              <p className="mt-1 text-xs text-slate-500">Trusted profiles</p>
            </div>
            <div className="bg-white p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Available</p>
              <p className="mt-2 text-3xl font-black text-[#172033]">{counts.available}</p>
              <p className="mt-1 text-xs text-slate-500">Ready for jobs</p>
            </div>
            <div className="bg-white p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Public</p>
              <p className="mt-2 text-3xl font-black text-[#172033]">{counts.publicProfiles}</p>
              <p className="mt-1 text-xs text-slate-500">Shareable profiles</p>
            </div>
            <Link to="/admin/kyc" className="group bg-[#f8fafc] p-5 transition hover:bg-[#eef6fb]">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                <ShieldCheck size={18} />
              </span>
              <p className="mt-3 text-sm font-black text-[#184e77]">Open KYC queue</p>
              <p className="mt-1 text-xs text-slate-500">Review approvals separately</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(["TEACHER", "DRIVER", "JANITOR", "ADMIN_STAFF"] as StaffRole[]).map((item) => (
          <RoleTile
            key={item}
            role={item}
            count={roleCount(staff, item)}
            total={staff.length}
            active={role === item}
            onClick={() => setRole((current) => current === item ? "all" : item)}
          />
        ))}
      </section>

      <div className="mb-5 rounded-2xl border border-[#dbe4ef] bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 transition focus-within:border-[#184e77] focus-within:ring-2 focus-within:ring-[#184e77]/10">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, role, subject, location"
              className="h-11 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole | "all")}
            className="h-11 rounded-xl border border-[#dbe4ef] bg-white px-3 text-sm font-semibold text-[#172033] outline-none focus:border-[#184e77]"
          >
            <option value="all">All roles</option>
            <option value="TEACHER">Teacher</option>
            <option value="DRIVER">Driver</option>
            <option value="JANITOR">Janitor</option>
            <option value="ADMIN_STAFF">Admin staff</option>
          </select>
          <select
            value={kyc}
            onChange={(event) => setKyc(event.target.value as KycStatus | "all")}
            className="h-11 rounded-xl border border-[#dbe4ef] bg-white px-3 text-sm font-semibold text-[#172033] outline-none focus:border-[#184e77]"
          >
            <option value="all">All KYC</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h2 className="font-black text-[#172033]">Staff roster</h2>
            <p className="text-xs text-slate-500">{filtered.length} result{filtered.length === 1 ? "" : "s"} in this directory view</p>
          </div>
          {(role !== "all" || kyc !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRole("all");
                setKyc("all");
              }}
              className="rounded-xl border border-[#dbe4ef] px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-[#f8fafc]"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[1.45fr_0.8fr_0.95fr_0.75fr_0.75fr_0.9fr] gap-4 bg-[#f8fafc] px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
              <span>Staff member</span>
              <span>Role</span>
              <span>Location</span>
              <span>KYC</span>
              <span>Profile</span>
              <span>Actions</span>
            </div>

            {staffQuery.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : filtered.length ? (
              <div className="divide-y divide-[#eef2f7]">
                {filtered.map((person) => {
                  const score = profileScore(person);
                  return (
                    <article
                      key={person.id}
                      className="grid grid-cols-[1.45fr_0.8fr_0.95fr_0.75fr_0.75fr_0.9fr] items-center gap-4 px-5 py-4 transition hover:bg-[#f8fafc]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <StaffAvatar person={person} />
                        <div className="min-w-0">
                          <p className="truncate font-black text-[#172033]">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="truncate text-xs text-slate-500">{person.email}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {person.isAvailable && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                Available
                              </span>
                            )}
                            {person.publicSlug && (
                              <span className="rounded-full bg-[#e0f2fe] px-2 py-0.5 text-[10px] font-black text-[#184e77]">
                                Public
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${roleTone[person.staffRole]}`}>
                        {roleLabels[person.staffRole]}
                      </span>

                      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                        <MapPin size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">{person.location}</span>
                      </div>

                      <KycPill status={currentKyc(person)} />

                      <div>
                        <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Ready</span>
                          <span>{score}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[#287271]" style={{ width: `${score}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">{person.profileViewCount ?? 0} views</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {person.publicSlug ? (
                          <a
                            href={`/staff/${person.publicSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#dbe4ef] px-2.5 py-1.5 text-xs font-black text-[#184e77] transition hover:bg-[#eef6fb]"
                          >
                            Profile <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="rounded-lg border border-[#eef2f7] px-2.5 py-1.5 text-xs font-black text-slate-300">
                            No link
                          </span>
                        )}
                        <a
                          href={person.ninDocumentUrl || person.certificateUrl || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1 rounded-lg border border-[#dbe4ef] px-2.5 py-1.5 text-xs font-black ${
                            person.ninDocumentUrl || person.certificateUrl
                              ? "text-slate-600 hover:bg-[#f8fafc]"
                              : "pointer-events-none text-slate-300"
                          }`}
                        >
                          Docs <FileText size={11} />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-16 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f8fafc] text-slate-400">
                  <BookOpen size={22} />
                </span>
                <p className="mt-4 font-black text-[#172033]">No staff found</p>
                <p className="mt-1 text-sm text-slate-500">Try another role, KYC status, or search term.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SuperAdminLayout>
  );
};

export default AdminStaffPage;
