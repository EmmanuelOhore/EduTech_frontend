import {
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  FileUp,
  GraduationCap,
  Lock,
  MapPin,
  Save,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useChangePasswordMutation, useUpdateTeacherProfileMutation, useUploadAssetMutation } from "../services/mutation";
import type { TeacherProfile } from "../types/TypeChecks";

/* ─── types ────────────────────────────────────────────────────── */
type Tab = "personal" | "teaching" | "security";

interface Props {
  open: boolean;
  onClose: () => void;
  profile: TeacherProfile | undefined;
}

/* ─── helpers ──────────────────────────────────────────────────── */
const LEVELS = [
  { value: "BEGINNER", label: "Beginner", desc: "0–2 years of experience" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "3–6 years of experience" },
  { value: "EXPERT", label: "Expert", desc: "7+ years of experience" },
] as const;

const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
  </div>
);

const inputCls =
  "w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#184e77] focus:bg-white focus:ring-2 focus:ring-[#184e77]/10";

/* ─── component ────────────────────────────────────────────────── */
const EditProfileDrawer = ({ open, onClose, profile }: Props) => {
  const [tab, setTab] = useState<Tab>("personal");

  /* personal */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImage, setProfileImage] = useState("");

  /* teaching */
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "EXPERT">("BEGINNER");
  const [bio, setBio] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [ninDocumentUrl, setNinDocumentUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [uploadingAsset, setUploadingAsset] = useState<"profile" | "certificate" | "nin" | null>(null);

  /* security */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState("");

  const updateMutation = useUpdateTeacherProfileMutation();
  const pwMutation = useChangePasswordMutation();
  const uploadAsset = useUploadAssetMutation();

  const drawerRef = useRef<HTMLDivElement>(null);

  /* sync profile into form when drawer opens */
  useEffect(() => {
    if (open && profile) {
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
      setProfileImage(profile.profileImage ?? "");
      setLocation(profile.location ?? "");
      setLevel(profile.level ?? "BEGINNER");
      setBio(profile.bio ?? "");
      setCertificateUrl(profile.certificateUrl ?? "");
      setNinDocumentUrl(profile.ninDocumentUrl ?? "");
      setIsAvailable(profile.isAvailable ?? true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwError("");
    }
  }, [open, profile]);

  /* trap focus & close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* save profile */
  const handleSaveProfile = () => {
    updateMutation.mutate(
      {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        profileImage: profileImage.trim() || undefined,
        location: location.trim() || undefined,
        level,
        bio: bio.trim() || undefined,
        certificateUrl: certificateUrl.trim() || undefined,
        ninDocumentUrl: ninDocumentUrl.trim() || undefined,
        isAvailable,
        _currentIsAvailable: profile?.isAvailable,
      },
      { onSuccess: onClose },
    );
  };

  const handleAssetUpload = async (
    file: File,
    kind: "profile" | "certificate" | "nin",
  ) => {
    try {
      setUploadingAsset(kind);
      const uploaded = await uploadAsset.mutateAsync({
        file,
        category:
          kind === "profile"
            ? "teacher-profile-image"
            : kind === "certificate"
              ? "teacher-certificate"
              : "teacher-nin-document",
      });

      if (kind === "profile") setProfileImage(uploaded.url);
      if (kind === "certificate") setCertificateUrl(uploaded.url);
      if (kind === "nin") setNinDocumentUrl(uploaded.url);

      toast.success(`${kind === "nin" ? "NIN document" : kind === "certificate" ? "Certificate" : "Profile photo"} uploaded`);
    } catch {
      // toast handled in mutation
    } finally {
      setUploadingAsset(null);
    }
  };

  /* save password */
  const handleSavePassword = () => {
    setPwError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    pwMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          onClose();
        },
      },
    );
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "personal", label: "Personal", icon: User },
    { id: "teaching", label: "Teaching", icon: GraduationCap },
    { id: "security", label: "Security", icon: Lock },
  ];

  const initials = `${profile?.firstName?.charAt(0) ?? ""}${profile?.lastName?.charAt(0) ?? ""}`;
  const isSaving = updateMutation.isPending;
  const isPwSaving = pwMutation.isPending;

  return (
    <>
      {/* ── backdrop ── */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* ── drawer ── */}
      <div
        ref={drawerRef}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-modal="true"
        role="dialog"
        aria-label="Edit Profile"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-[#dbe4ef] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#172033]">Edit Profile</h2>
            <p className="mt-0.5 text-xs text-slate-400">Update your information below</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* avatar strip */}
        <div className="flex items-center gap-4 border-b border-[#dbe4ef] bg-[#f8fafc] px-6 py-4">
          <div className="relative">
            <div className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#184e77] to-[#287271] text-xl font-black text-white ring-2 ring-[#184e77]/20">
              {profileImage ? (
                <img src={profileImage} alt="avatar" className="size-full object-cover" onError={() => setProfileImage("")} />
              ) : (
                initials || "T"
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#184e77] text-white ring-2 ring-white">
              <Camera size={10} />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#172033] truncate">
              {firstName || profile?.firstName} {lastName || profile?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-1 border-b border-[#dbe4ef] px-6 pt-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 pb-2.5 pt-1 text-xs font-semibold transition ${
                tab === t.id
                  ? "border-b-2 border-[#184e77] text-[#184e77]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Personal tab ── */}
          {tab === "personal" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className={inputCls}
                  />
                </Field>
                <Field label="Last name">
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Email address" hint="Email cannot be changed here. Contact support to update it.">
                <input
                  value={profile?.email ?? ""}
                  disabled
                  className={`${inputCls} cursor-not-allowed opacity-50`}
                />
              </Field>

              <Field label="Profile photo" hint="Upload a square image for the best result.">
                <div className="space-y-3">
                  <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3.5 py-3 transition hover:border-[#184e77] hover:bg-white ${uploadingAsset === "profile" ? "pointer-events-none opacity-70" : ""}`}>
                    <div>
                      <p className="text-sm font-semibold text-[#172033]">
                        {uploadingAsset === "profile" ? "Uploading photo..." : profileImage ? "Replace profile photo" : "Upload profile photo"}
                      </p>
                      <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP up to 8MB</p>
                    </div>
                    <span className="grid size-9 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                      <FileUp size={16} />
                    </span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void handleAssetUpload(file, "profile");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {profileImage && (
                    <img
                      src={profileImage}
                      alt="Profile preview"
                      className="h-28 w-28 rounded-2xl object-cover ring-1 ring-[#dbe4ef]"
                    />
                  )}
                </div>
              </Field>

              <div className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
                <p className="text-xs font-semibold text-slate-500">Quick tip</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Use a professional headshot for a better impression with schools. Square images work best.
                </p>
              </div>
            </div>
          )}

          {/* ── Teaching tab ── */}
          {tab === "teaching" && (
            <div className="flex flex-col gap-5">
              <Field label="Location">
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lagos, Abuja..."
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Experience level">
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                        level === l.value
                          ? "border-[#184e77] bg-[#eef6fb] text-[#184e77]"
                          : "border-[#dbe4ef] bg-[#f8fafc] text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <GraduationCap size={16} className="mb-1" />
                      <span className="text-xs font-bold">{l.label}</span>
                      <span className="mt-0.5 text-[10px] leading-tight opacity-70">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Professional bio" hint="Max 500 characters. Describe your experience, subjects, and teaching style.">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="Tell schools about your teaching background, specialisations, and approach…"
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-right text-[11px] text-slate-400">{bio.length}/500</p>
              </Field>

              <Field label="Teaching certificate" hint="Upload once and reuse it across applications.">
                <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3.5 py-3 transition hover:border-[#184e77] hover:bg-white ${uploadingAsset === "certificate" ? "pointer-events-none opacity-70" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-[#172033]">
                      {uploadingAsset === "certificate" ? "Uploading certificate..." : certificateUrl ? "Replace certificate" : "Upload certificate"}
                    </p>
                    <p className="text-[11px] text-slate-400">{certificateUrl ? "Saved to your teacher profile" : "PDF, JPG, or PNG up to 8MB"}</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                    <FileUp size={16} />
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void handleAssetUpload(file, "certificate");
                      e.target.value = "";
                    }}
                  />
                </label>
              </Field>

              <Field label="NIN document" hint="This can be used for later verification checks.">
                <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3.5 py-3 transition hover:border-[#184e77] hover:bg-white ${uploadingAsset === "nin" ? "pointer-events-none opacity-70" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-[#172033]">
                      {uploadingAsset === "nin" ? "Uploading NIN document..." : ninDocumentUrl ? "Replace NIN document" : "Upload NIN document"}
                    </p>
                    <p className="text-[11px] text-slate-400">{ninDocumentUrl ? "Saved to your teacher profile" : "PDF, JPG, or PNG up to 8MB"}</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                    <FileUp size={16} />
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void handleAssetUpload(file, "nin");
                      e.target.value = "";
                    }}
                  />
                </label>
              </Field>

              {/* availability toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#172033]">Available for placements</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Schools can only contact you when this is on.
                  </p>
                </div>
                <button
                  onClick={() => setIsAvailable((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    isAvailable ? "bg-[#184e77]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      isAvailable ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── Security tab ── */}
          {tab === "security" && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-700">Password requirements</p>
                <ul className="mt-2 space-y-1 text-xs text-amber-600">
                  <li className="flex items-center gap-1.5"><ChevronRight size={10} /> At least 8 characters</li>
                  <li className="flex items-center gap-1.5"><ChevronRight size={10} /> Include uppercase and lowercase letters</li>
                  <li className="flex items-center gap-1.5"><ChevronRight size={10} /> Include at least one number</li>
                </ul>
              </div>

              <Field label="Current password">
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={`${inputCls} pr-10`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              <Field label="New password">
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={`${inputCls} pr-10`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm new password">
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`${inputCls} pr-10`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              {/* strength bar */}
              {newPassword && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-400">Password strength</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => {
                      const strength =
                        (newPassword.length >= 8 ? 1 : 0) +
                        (/[A-Z]/.test(newPassword) ? 1 : 0) +
                        (/[0-9]/.test(newPassword) ? 1 : 0) +
                        (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0);
                      return (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= strength
                              ? strength <= 1
                                ? "bg-red-400"
                                : strength === 2
                                  ? "bg-amber-400"
                                  : strength === 3
                                    ? "bg-blue-400"
                                    : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {pwError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
                  {pwError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t border-[#dbe4ef] bg-white px-6 py-4">
          {tab !== "security" ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#dbe4ef] py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#184e77] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a6091] disabled:opacity-60"
              >
                {isSaving ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save size={14} />
                )}
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#dbe4ef] py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                disabled={isPwSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#184e77] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a6091] disabled:opacity-60"
              >
                {isPwSaving ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Lock size={14} />
                )}
                {isPwSaving ? "Updating…" : "Update password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditProfileDrawer;
