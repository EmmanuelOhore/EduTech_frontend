import { useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, UploadCloud, Check, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { uploadAsset } from "../services/base";
import { useFetchGuarantorByToken } from "../services/queries";
import { useSubmitGuarantorMutation } from "../services/mutation";
import type { GuarantorIdType } from "../types/TypeChecks";

const ID_TYPES: { value: GuarantorIdType; label: string }[] = [
  { value: "NIN", label: "National ID (NIN)" },
  { value: "DRIVERS_LICENSE", label: "Driver's licence" },
  { value: "PASSPORT", label: "International passport" },
  { value: "VOTERS_CARD", label: "Voter's card" },
];

const UploadField = ({
  label,
  value,
  uploading,
  onPick,
}: {
  label: string;
  value?: string;
  uploading: boolean;
  onPick: (file: File) => void;
}) => (
  <div>
    <label className="text-sm font-bold text-[#172033]">{label}</label>
    <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#9fb8d0] bg-[#f8fafc] px-4 py-5 text-sm text-slate-500 hover:bg-[#eef6fb]">
      {uploading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
      ) : value ? (
        <span className="flex items-center gap-2 font-bold text-emerald-700"><Check className="h-4 w-4" /> Uploaded — change</span>
      ) : (
        <><UploadCloud className="h-4 w-4" /> Click to upload (JPG, PNG, or PDF)</>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
      />
    </label>
  </div>
);

const GuarantorPortalPage = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useFetchGuarantorByToken(token);
  const submit = useSubmitGuarantorMutation();

  const [idType, setIdType] = useState<GuarantorIdType | "">("");
  const [idNumber, setIdNumber] = useState("");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [proofOfAddressUrl, setProofOfAddressUrl] = useState("");
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingPoa, setUploadingPoa] = useState(false);

  const guarantor = data?.guarantor;
  const alreadyDone = guarantor && guarantor.status !== "INVITED" && guarantor.status !== "REJECTED";

  const upload = async (
    file: File,
    category: "guarantor-id-document" | "guarantor-proof-of-address",
    setUrl: (u: string) => void,
    setBusy: (b: boolean) => void,
  ) => {
    setBusy(true);
    try {
      const asset = await uploadAsset(file, category);
      setUrl(asset.url);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed — try again");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = () => {
    if (!token) return;
    if (!idType) { toast.error("Select an ID type"); return; }
    if (!idDocumentUrl) { toast.error("Upload your ID document"); return; }
    if (!proofOfAddressUrl) { toast.error("Upload your proof of address"); return; }
    submit.mutate({ token, idType, idNumber: idNumber.trim() || undefined, idDocumentUrl, proofOfAddressUrl });
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-10 text-[#172033]">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#184e77] text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-black tracking-tight">EduStaff<span className="text-[#287271]">Connect</span></p>
            <p className="text-xs text-slate-400">Guarantor verification</p>
          </div>
        </div>

        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}

        {isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>This guarantor link is invalid or has expired. Please ask the instructor to re-send it.</p>
          </div>
        )}

        {guarantor && (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
            <h1 className="text-lg font-black">Hello {guarantor.fullName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-bold text-[#172033]">{data?.instructorName}</span> listed you as a guarantor for
              their EduStaff Connect verification. Please confirm your identity below.
            </p>

            {alreadyDone ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                <Check className="h-4 w-4" /> Your documents are in
                {guarantor.status === "APPROVED" ? " and approved. Thank you!" : " and awaiting review. Thank you!"}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {guarantor.status === "REJECTED" && guarantor.rejectionReason && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Previously rejected: {guarantor.rejectionReason}. Please re-submit.</span>
                  </div>
                )}

                <div>
                  <label className="text-sm font-bold text-[#172033]">ID type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as GuarantorIdType)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#dbe4ef] bg-white px-3 text-sm font-semibold"
                  >
                    <option value="">Select an ID type…</option>
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-[#172033]">ID number (optional)</label>
                  <input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#dbe4ef] px-3 text-sm"
                    placeholder="e.g. 12345678901"
                  />
                </div>

                <UploadField
                  label="Valid ID document"
                  value={idDocumentUrl}
                  uploading={uploadingId}
                  onPick={(f) => upload(f, "guarantor-id-document", setIdDocumentUrl, setUploadingId)}
                />

                <UploadField
                  label="Proof of address"
                  value={proofOfAddressUrl}
                  uploading={uploadingPoa}
                  onPick={(f) => upload(f, "guarantor-proof-of-address", setProofOfAddressUrl, setUploadingPoa)}
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submit.isPending || uploadingId || uploadingPoa}
                  className="w-full rounded-xl bg-[#184e77] py-3 text-sm font-black text-white transition hover:bg-[#143d5e] disabled:opacity-60"
                >
                  {submit.isPending ? "Submitting…" : "Submit verification"}
                </button>
                <p className="text-center text-xs text-slate-400">
                  Your details are used only to verify this instructor and are kept private.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default GuarantorPortalPage;
