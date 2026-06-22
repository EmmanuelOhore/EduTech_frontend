import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Check,
  Clock,
  Plus,
  Trash2,
  Copy,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import TeacherHeader from "../components/TeacherHeader";
import KycBadge from "../components/KycBadge";
import { useFetchMyTeacherProfile, useFetchMyGuarantors } from "../services/queries";
import {
  useSetConsentMutation,
  useAddGuarantorMutation,
  useDeleteGuarantorMutation,
} from "../services/mutation";
import type { Guarantor } from "../types/TypeChecks";

const guarantorStatusTone: Record<string, string> = {
  INVITED: "bg-slate-100 text-slate-500",
  SUBMITTED: "bg-[#e0f2fe] text-[#184e77]",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

const guarantorStatusLabel: Record<string, string> = {
  INVITED: "Awaiting their submission",
  SUBMITTED: "Submitted — under review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const ChecklistRow = ({ done, label, hint }: { done: boolean; label: string; hint?: string }) => (
  <div className="flex items-start gap-3 py-2.5">
    <span
      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
        done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {done ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
    </span>
    <div>
      <p className={`text-sm font-bold ${done ? "text-[#172033]" : "text-slate-600"}`}>{label}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  </div>
);

const emptyForm = { fullName: "", relationship: "", email: "", phone: "" };

const TeacherKycPage = () => {
  const { data: profile, isLoading } = useFetchMyTeacherProfile();
  const { data: guarantorData } = useFetchMyGuarantors();
  const setConsent = useSetConsentMutation();
  const addGuarantor = useAddGuarantorMutation();
  const deleteGuarantor = useDeleteGuarantorMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const guarantors = guarantorData?.guarantors ?? [];
  const required = guarantorData?.required ?? 2;
  const approvedGuarantors = guarantors.filter((g) => g.status === "APPROVED").length;

  const hasId = Boolean(profile?.ninDocumentUrl);
  const hasCert = Boolean(profile?.certificateUrl);
  const hasConsent = Boolean(profile?.backgroundCheckConsent);
  const guarantorsComplete = approvedGuarantors >= required;
  const kycStatus = profile?.kycStatus ?? "PENDING";

  const copyLink = (g: Guarantor) => {
    const url = `${window.location.origin}${g.portalPath ?? ""}`;
    navigator.clipboard?.writeText(url);
    toast.success("Guarantor link copied");
  };

  const submitGuarantor = () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }
    addGuarantor.mutate(form, {
      onSuccess: () => {
        setForm(emptyForm);
        setShowForm(false);
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="kyc" />

      <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Verification</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-black">
              <ShieldCheck className="h-6 w-6 text-[#184e77]" /> KYC &amp; verification
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Complete your verification to become eligible for placement and benefits.
            </p>
          </div>
          <KycBadge status={kycStatus} />
        </div>

        {kycStatus === "REJECTED" && profile?.kycRejectionReason && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-black">Your KYC was rejected</p>
              <p className="mt-0.5">{profile.kycRejectionReason}</p>
              <p className="mt-1 text-red-500">Fix the issue below and your reviewer will re-check it.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="mt-10 text-sm text-slate-400">Loading your verification…</p>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {/* Checklist */}
            <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black text-[#172033]">What's required</h2>
              <div className="mt-3 divide-y divide-[#eef2f7]">
                <ChecklistRow done={hasId} label="Government-issued ID" hint={hasId ? undefined : "Upload your NIN / ID in your profile"} />
                <ChecklistRow done={hasCert} label="Academic / professional credentials" hint={hasCert ? undefined : "Upload your certificate in your profile"} />
                <ChecklistRow done={hasConsent} label="Background-check consent" hint={hasConsent ? undefined : "Give consent below"} />
                <ChecklistRow
                  done={guarantorsComplete}
                  label={`Two approved guarantors (${approvedGuarantors}/${required})`}
                  hint={guarantorsComplete ? undefined : "Add guarantors and have them complete their forms"}
                />
              </div>

              {(!hasId || !hasCert) && (
                <Link
                  to="/dashboard"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#184e77] hover:underline"
                >
                  Go to profile to upload documents →
                </Link>
              )}

              {/* Consent */}
              <div className="mt-5 rounded-xl bg-[#f8fafc] p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    disabled={setConsent.isPending}
                    onChange={(e) => setConsent.mutate(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm text-slate-600">
                    I consent to a background check as part of my verification, and confirm the documents I've
                    provided are accurate.
                  </span>
                </label>
              </div>
            </div>

            {/* Guarantors */}
            <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#172033]">Guarantors</h2>
                {guarantors.length < required && (
                  <button
                    type="button"
                    onClick={() => setShowForm((s) => !s)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#184e77] px-3 py-1.5 text-xs font-black text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add guarantor
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                You need {required} guarantors. Each opens their own private link to submit ID, proof of address,
                and confirm contact.
              </p>

              {showForm && (
                <div className="mt-4 space-y-2 rounded-xl border border-[#dbe4ef] p-4">
                  <input
                    placeholder="Full name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#dbe4ef] px-3 text-sm"
                  />
                  <input
                    placeholder="Relationship (e.g. Former employer)"
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#dbe4ef] px-3 text-sm"
                  />
                  <input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#dbe4ef] px-3 text-sm"
                  />
                  <input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#dbe4ef] px-3 text-sm"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={submitGuarantor}
                      disabled={addGuarantor.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#287271] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Save guarantor
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setForm(emptyForm); }}
                      className="rounded-lg border border-[#dbe4ef] px-3 py-2 text-xs font-bold text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {guarantors.length === 0 && !showForm && (
                  <p className="rounded-xl bg-[#f8fafc] p-4 text-sm text-slate-400">No guarantors added yet.</p>
                )}
                {guarantors.map((g) => (
                  <div key={g.id} className="rounded-xl border border-[#dbe4ef] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-[#172033]">{g.fullName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${guarantorStatusTone[g.status] ?? ""}`}>
                        {guarantorStatusLabel[g.status] ?? g.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {[g.relationship, g.email, g.phone].filter(Boolean).join(" · ")}
                    </p>
                    {g.status === "REJECTED" && g.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">{g.rejectionReason}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {g.status === "INVITED" && (
                        <button
                          type="button"
                          onClick={() => copyLink(g)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#dbe4ef] px-2.5 py-1.5 text-xs font-bold text-[#184e77]"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy their link
                        </button>
                      )}
                      {g.status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => deleteGuarantor.mutate(g.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {kycStatus === "APPROVED" && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <Check className="h-4 w-4" /> You're fully verified — you can be placed into schools and access benefits.
          </div>
        )}
        {kycStatus !== "APPROVED" && hasId && hasCert && hasConsent && guarantorsComplete && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#dbe4ef] bg-white p-4 text-sm text-slate-500">
            <Clock className="h-4 w-4" /> Everything's submitted — your reviewer will approve your KYC shortly.
          </div>
        )}
      </div>
    </main>
  );
};

export default TeacherKycPage;
