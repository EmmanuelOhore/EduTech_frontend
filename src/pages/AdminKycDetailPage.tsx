import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchAllTeachers, useFetchAdminGuarantors } from "../services/queries";
import { useUpdateTeacherKycStatusMutation, useReviewGuarantorMutation } from "../services/mutation";
import type { AdminGuarantor, KycStatus, StaffRole, TeacherProfile } from "../types/TypeChecks";

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
  {
    label: "NIN document",
    done: Boolean(person.ninDocumentUrl),
    url: person.ninDocumentUrl,
    missing: "No NIN document uploaded",
  },
  {
    label: "Certificate",
    done: Boolean(person.certificateUrl),
    url: person.certificateUrl,
    missing: "No certificate uploaded",
  },
  {
    label: "Contact email",
    done: Boolean(person.email),
    value: person.email,
    missing: "No email on profile",
  },
  {
    label: person.staffRole === "TEACHER" ? "Teaching evidence" : "Role profile",
    done:
      person.staffRole !== "TEACHER" ||
      Boolean(person.teachingRecords.length || person.subjectExpertise.length),
    value:
      person.staffRole === "TEACHER"
        ? `${person.subjectExpertise.length} subject(s), ${person.teachingRecords.length} record(s)`
        : roleLabels[person.staffRole],
    missing: "No subject or teaching record added",
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

const EvidenceItem = ({
  label,
  done,
  url,
  value,
  missing,
}: {
  label: string;
  done: boolean;
  url?: string;
  value?: string;
  missing: string;
}) => (
  <div className="rounded-xl border border-[#eef2f7] bg-white p-3.5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-black text-[#172033]">{label}</p>
        <p className={`mt-1 truncate text-xs ${done ? "text-slate-500" : "text-red-500"}`}>
          {done ? value || "Uploaded" : missing}
        </p>
      </div>
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${done ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
        {done ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      </span>
    </div>
    {url && (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-[#dbe4ef] px-2.5 py-1 text-xs font-bold text-[#184e77] transition hover:bg-[#eef6fb]"
      >
        Open document <ExternalLink size={11} />
      </a>
    )}
  </div>
);

const AdminKycDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const staffQuery = useFetchAllTeachers();
  const guarantorsQuery = useFetchAdminGuarantors();
  const kycMutation = useUpdateTeacherKycStatusMutation();
  const reviewGuarantor = useReviewGuarantorMutation();

  const staff = staffQuery.data ?? [];
  const person = staff.find((p) => p.id === id) ?? null;

  if (staffQuery.isLoading) {
    return (
      <SuperAdminLayout>
        <div className="mx-auto max-w-5xl">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (!person) {
    return (
      <SuperAdminLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-[#dbe4ef] bg-white p-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f8fafc] text-slate-400">
            <UserRound size={20} />
          </span>
          <p className="mt-3 font-black text-[#172033]">Staff profile not found.</p>
          <p className="mt-1 text-sm text-slate-500">It may have been removed or the link is out of date.</p>
          <Link
            to="/admin/kyc"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#123d5f]"
          >
            <ArrowLeft size={16} /> Back to KYC queue
          </Link>
        </div>
      </SuperAdminLayout>
    );
  }

  const status = currentStatus(person);
  const score = completeness(person);
  const guarantors: AdminGuarantor[] = (guarantorsQuery.data ?? []).filter(
    (g) => g.teacherId?._id === person.id,
  );
  const approvedGuarantorCount = guarantors.filter((g) => g.status === "APPROVED").length;

  const updateKyc = (kycStatus: Exclude<KycStatus, "REJECTED">) => {
    kycMutation.mutate({ id: person.id, kycStatus });
  };

  const openReject = () => {
    setRejectionReason(person.kycRejectionReason ?? "");
    setRejecting(true);
  };

  const submitRejection = () => {
    kycMutation.mutate(
      {
        id: person.id,
        kycStatus: "REJECTED",
        rejectionReason: rejectionReason.trim() || "KYC documents need review",
      },
      { onSuccess: () => setRejecting(false) },
    );
  };

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-[#172033]"
        >
          <ArrowLeft size={16} /> Back to review queue
        </button>

        {/* Pinned header + decision bar */}
        <div className="sticky top-4 z-20 mb-5 rounded-2xl border border-[#dbe4ef] bg-white/95 p-5 shadow-sm shadow-slate-900/[0.05] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#287271] text-base font-black text-white">
                {person.profileImage ? (
                  <img src={person.profileImage} alt="" className="size-full object-cover" />
                ) : (
                  getInitials(person)
                )}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-black text-[#172033]">
                    {person.firstName} {person.lastName}
                  </h1>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><Mail size={12} /> {person.email}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase size={12} /> {roleLabels[person.staffRole]}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={12} /> {person.location}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateKyc("UNDER_REVIEW")}
                disabled={kycMutation.isPending || status === "UNDER_REVIEW"}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#e0f2fe] px-3.5 text-sm font-black text-[#184e77] transition hover:bg-[#cfeaf9] disabled:opacity-50"
              >
                <FileText size={15} /> Under review
              </button>
              <button
                type="button"
                onClick={openReject}
                disabled={kycMutation.isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-3.5 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle size={15} /> Reject
              </button>
              <button
                type="button"
                onClick={() => updateKyc("APPROVED")}
                disabled={kycMutation.isPending || status === "APPROVED"}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#184e77] px-4 text-sm font-black text-white transition hover:bg-[#123d5f] disabled:opacity-50"
              >
                <ShieldCheck size={15} /> Approve KYC
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* LEFT: identity + evidence + teaching */}
          <div className="grid content-start gap-5">
            <section className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black text-[#172033]">Evidence completeness</p>
                <p className="text-sm font-black text-[#287271]">{score.percent}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#287271]" style={{ width: `${score.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {score.done} of {score.total} review signals are available.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {evidenceChecks(person).map((item) => (
                  <EvidenceItem key={item.label} {...item} />
                ))}
              </div>
            </section>

            {person.staffRole === "TEACHER" && (
              <section className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
                <p className="mb-3 flex items-center gap-2 text-sm font-black text-[#172033]">
                  <GraduationCap size={16} className="text-[#184e77]" /> Teaching readiness
                </p>
                <div className="flex flex-wrap gap-2">
                  {person.subjectExpertise.length ? (
                    person.subjectExpertise.map((item) => (
                      <span key={`${item.subject}-${item.rank}`} className="rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-black text-[#184e77]">
                        {item.rank}. {item.subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No subjects added yet.</span>
                  )}
                </div>

                {person.teachingRecords.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-[#eef2f7] pt-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Teaching history</p>
                    {person.teachingRecords.map((rec, i) => (
                      <div key={i} className="rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-3">
                        <p className="text-sm font-black text-[#172033]">{rec.roleTitle} · {rec.schoolName}</p>
                        <p className="text-xs text-slate-500">
                          {rec.startYear}{rec.endYear ? ` – ${rec.endYear}` : " – Present"}
                        </p>
                        {rec.description && <p className="mt-1 text-xs leading-5 text-slate-500">{rec.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <div className={`flex items-center gap-2 rounded-2xl border p-4 text-sm font-bold ${
              person.backgroundCheckConsent
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-amber-100 bg-amber-50 text-amber-700"
            }`}>
              {person.backgroundCheckConsent ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {person.backgroundCheckConsent ? "Background-check consent given" : "No background-check consent yet"}
            </div>

            {person.kycRejectionReason && status === "REJECTED" && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-red-600">
                  <AlertTriangle size={16} /> Rejection reason
                </p>
                <p className="mt-2 text-sm leading-6 text-red-600">{person.kycRejectionReason}</p>
              </div>
            )}
          </div>

          {/* RIGHT: guarantors */}
          <div className="grid content-start gap-5">
            <section className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
              <p className="mb-4 flex items-center justify-between text-sm font-black text-[#172033]">
                <span className="flex items-center gap-2"><Users size={16} className="text-[#184e77]" /> Guarantors</span>
                <span className={approvedGuarantorCount >= 2 ? "text-emerald-600" : "text-amber-600"}>
                  {approvedGuarantorCount}/2 approved
                </span>
              </p>
              {guarantors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#dbe4ef] py-8 text-center text-sm text-slate-500">
                  No guarantors added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {guarantors.map((g) => (
                    <div key={g.id} className="rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-[#172033]">{g.fullName}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-[#dbe4ef]">{g.status}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{[g.relationship, g.email, g.phone].filter(Boolean).join(" · ")}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {g.idDocumentUrl && (
                          <a href={g.idDocumentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-[#dbe4ef] bg-white px-2.5 py-1 text-xs font-bold text-[#184e77]">ID <ExternalLink size={10} /></a>
                        )}
                        {g.proofOfAddressUrl && (
                          <a href={g.proofOfAddressUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-[#dbe4ef] bg-white px-2.5 py-1 text-xs font-bold text-[#184e77]">Address <ExternalLink size={10} /></a>
                        )}
                      </div>
                      {(g.status === "SUBMITTED" || g.status === "UNDER_REVIEW") && (
                        <div className="mt-3 flex gap-2">
                          <button type="button" disabled={reviewGuarantor.isPending} onClick={() => reviewGuarantor.mutate({ id: g.id, status: "APPROVED" })} className="rounded-lg bg-[#184e77] px-3 py-1.5 text-xs font-black text-white disabled:opacity-60">Approve</button>
                          <button type="button" disabled={reviewGuarantor.isPending} onClick={() => reviewGuarantor.mutate({ id: g.id, status: "REJECTED", rejectionReason: "Guarantor documents need review" })} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-black text-red-600 disabled:opacity-60">Reject</button>
                        </div>
                      )}
                      {g.status === "REJECTED" && g.rejectionReason && (
                        <p className="mt-2 text-xs text-red-600">{g.rejectionReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4 border-b border-[#eef2f7] p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-600">Reject KYC</p>
                <h2 className="mt-1 text-xl font-black text-[#172033]">{person.firstName} {person.lastName}</h2>
                <p className="mt-1 text-sm text-slate-500">Add a short reason so the review decision is clear later.</p>
              </div>
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close rejection modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <label htmlFor="kyc-rejection-reason" className="text-sm font-bold text-[#172033]">Rejection reason</label>
              <textarea
                id="kyc-rejection-reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={4}
                placeholder="Example: NIN document is unclear, please upload a sharper image."
                className="mt-2 w-full resize-none rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3 text-sm outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/15"
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">This reason is saved on the staff KYC record.</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#eef2f7] bg-[#f8fafc] p-4">
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="rounded-xl border border-[#dbe4ef] bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRejection}
                disabled={kycMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle size={16} /> Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default AdminKycDetailPage;
