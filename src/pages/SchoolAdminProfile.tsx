import { useState } from "react";
import {
  Building2,
  Camera,
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  FileUp,
  Globe,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Save,
  School,
  Shield,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { useFetchInstitution } from "../services/queries";
import {
  useChangePasswordMutation,
  useUpdateInstitutionMutation,
  useUpdateProfileMutation,
  useUploadAssetMutation,
} from "../services/mutation";

/* ── Helpers ─────────────────────────────────────────────────────── */
const SCHOOL_TYPES = ["PRIMARY", "SECONDARY", "TERTIARY", "VOCATIONAL", "OTHER"] as const;

const labelType = (t: string) =>
  t.charAt(0) + t.slice(1).toLowerCase();

const initials = (first?: string, last?: string) =>
  `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`.toUpperCase() || "?";

/* ── Sub-components ──────────────────────────────────────────────── */
const SectionCard = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-[#dbe4ef] bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b border-[#dbe4ef] px-6 py-4">
      <span className="grid size-9 place-items-center rounded-xl bg-[#f0f7ff] text-[#184e77]">
        <Icon size={17} />
      </span>
      <h2 className="text-sm font-black text-[#172033]">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

type FieldProps = {
  label: string;
  value: string;
  editing: boolean;
  name: string;
  type?: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  placeholder?: string;
  textarea?: boolean;
  options?: readonly string[];
};

const Field = ({
  label,
  value,
  editing,
  name,
  type = "text",
  onChange,
  placeholder,
  textarea,
  options,
}: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
      {label}
    </label>
    {editing ? (
      options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="rounded-xl border border-[#dbe4ef] bg-[#f6f8fb] px-3 py-2 text-sm font-semibold text-[#172033] outline-none focus:border-[#184e77] focus:bg-white transition"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {labelType(o)}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          className="resize-none rounded-xl border border-[#dbe4ef] bg-[#f6f8fb] px-3 py-2 text-sm font-semibold text-[#172033] outline-none focus:border-[#184e77] focus:bg-white transition"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="rounded-xl border border-[#dbe4ef] bg-[#f6f8fb] px-3 py-2 text-sm font-semibold text-[#172033] outline-none focus:border-[#184e77] focus:bg-white transition"
        />
      )
    ) : (
      <p className="text-sm font-semibold text-[#172033]">
        {value || (
          <span className="italic text-slate-400">Not set</span>
        )}
      </p>
    )}
  </div>
);

/* ── Main page ───────────────────────────────────────────────────── */
export default function SchoolAdminProfile() {
  const { user, auth } = useAuth();
  const institutionId = auth?.institution?.id;

  // fetch full institution from DB
  const { data: institution, refetch: refetchInstitution } =
    useFetchInstitution(institutionId);

  // mutations
  const updateProfile = useUpdateProfileMutation();
  const changePassword = useChangePasswordMutation();
  const updateInstitution = useUpdateInstitutionMutation();
  const uploadAsset = useUploadAssetMutation();

  /* ── personal info state ── */
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
  const [uploadingAdminPhoto, setUploadingAdminPhoto] = useState(false);

  /* ── school info state ── */
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolFormSeeded, setSchoolFormSeeded] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: "",
    phone: "",
    type: "SECONDARY" as (typeof SCHOOL_TYPES)[number],
    location: "",
    address: "",
    description: "",
    website: "",
    logoUrl: "",
    verificationDocumentUrl: "",
  });
  const [uploadingSchoolAsset, setUploadingSchoolAsset] = useState<"logo" | "verification" | null>(null);

  // seed school form once institution data arrives
  if (institution && !schoolFormSeeded) {
    setSchoolForm({
      name: institution.name ?? "",
      phone: institution.phone ?? "",
      type: institution.type ?? "SECONDARY",
      location: institution.location ?? "",
      address: institution.address ?? "",
      description: institution.description ?? "",
      website: institution.website ?? "",
      logoUrl: institution.logoUrl ?? "",
      verificationDocumentUrl: institution.verificationDocumentUrl ?? "",
    });
    setSchoolFormSeeded(true);
  }

  /* ── password state ── */
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [pwError, setPwError] = useState("");

  /* ── handlers ── */
  const handlePersonalChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setPersonalForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSchoolChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setSchoolForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSavePersonal = async () => {
    await updateProfile.mutateAsync({
      firstName: personalForm.firstName,
      lastName: personalForm.lastName,
    });
    setEditingPersonal(false);
  };

  const handleCancelPersonal = () => {
    setPersonalForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    });
    setEditingPersonal(false);
  };

  const handleSaveSchool = async () => {
    if (!institutionId) return;
    await updateInstitution.mutateAsync({ id: institutionId, data: schoolForm });
    await refetchInstitution();
    setEditingSchool(false);
  };

  const handleCancelSchool = () => {
    if (institution) {
      setSchoolForm({
        name: institution.name,
        phone: institution.phone ?? "",
        type: institution.type,
        location: institution.location,
        address: institution.address ?? "",
        description: institution.description ?? "",
        website: institution.website ?? "",
        logoUrl: institution.logoUrl ?? "",
        verificationDocumentUrl: institution.verificationDocumentUrl ?? "",
      });
    }
    setEditingSchool(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    await changePassword.mutateAsync({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleAdminPhotoUpload = async (file: File) => {
    try {
      setUploadingAdminPhoto(true);
      const uploaded = await uploadAsset.mutateAsync({ file, category: "admin-profile-image" });
      await updateProfile.mutateAsync({ profileImage: uploaded.url });
      toast.success("Admin photo updated");
    } finally {
      setUploadingAdminPhoto(false);
    }
  };

  const handleSchoolAssetUpload = async (file: File, kind: "logo" | "verification") => {
    try {
      setUploadingSchoolAsset(kind);
      const uploaded = await uploadAsset.mutateAsync({
        file,
        category: kind === "logo" ? "institution-logo" : "institution-verification-document",
      });
      setSchoolForm((current) => ({
        ...current,
        [kind === "logo" ? "logoUrl" : "verificationDocumentUrl"]: uploaded.url,
      }));
      toast.success(kind === "logo" ? "School logo uploaded" : "Verification document uploaded");
    } finally {
      setUploadingSchoolAsset(null);
    }
  };

  /* ── render ── */
  return (
    <AdminLayout>
      <div className="w-full px-6 py-8">

        {/* breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-slate-400">
          <span>School</span>
          <ChevronRight size={14} />
          <span className="font-bold text-[#184e77]">Profile</span>
        </div>

        {/* ── Avatar + name card ── */}
        <div className="mb-6 flex flex-col items-center gap-5 rounded-2xl border border-[#dbe4ef] bg-white p-8 shadow-sm sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="avatar"
                className="size-24 rounded-2xl object-cover ring-4 ring-[#e0f2fe]"
              />
            ) : (
              <div className="grid size-24 place-items-center rounded-2xl bg-gradient-to-br from-[#184e77] to-[#287271] text-3xl font-black text-white ring-4 ring-[#e0f2fe]">
                {initials(user?.firstName, user?.lastName)}
              </div>
            )}
            <button
              className="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full border-2 border-white bg-[#184e77] text-white shadow transition hover:bg-[#287271]"
              title="Change photo"
              type="button"
              onClick={() => document.getElementById("admin-photo-upload")?.click()}
            >
              <Camera size={13} />
            </button>
            <input
              id="admin-photo-upload"
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void handleAdminPhotoUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-black text-[#172033]">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">{user?.email}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="flex items-center gap-1.5 rounded-full bg-[#f0f7ff] px-3 py-1 text-xs font-bold text-[#184e77]">
                <Shield size={11} />
                {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Institution Admin"}
              </span>
              {user?.isVerified ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                  <CheckCircle size={11} />
                  Verified
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                  Pending Verification
                </span>
              )}
              {institution && (
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  <School size={11} />
                  {institution.name}
                </span>
              )}
            </div>
            {uploadingAdminPhoto && (
              <p className="mt-3 text-xs font-semibold text-[#184e77]">Uploading admin photo...</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">

          {/* ── Personal Info ── */}
          <SectionCard title="Personal Information" icon={User}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="First Name"
                name="firstName"
                value={editingPersonal ? personalForm.firstName : (user?.firstName ?? "")}
                editing={editingPersonal}
                onChange={handlePersonalChange}
                placeholder="First name"
              />
              <Field
                label="Last Name"
                name="lastName"
                value={editingPersonal ? personalForm.lastName : (user?.lastName ?? "")}
                editing={editingPersonal}
                onChange={handlePersonalChange}
                placeholder="Last name"
              />
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-[#f6f8fb] px-3 py-2">
                  <Mail size={14} className="text-slate-400" />
                  <span className="flex-1 text-sm font-semibold text-slate-500">
                    {user?.email}
                  </span>
                  <span className="text-[10px] italic text-slate-400">
                    Cannot be changed
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {editingPersonal ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelPersonal}
                    className="flex items-center gap-1.5 rounded-xl border border-[#dbe4ef] px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePersonal}
                    disabled={updateProfile.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#287271] disabled:opacity-60"
                  >
                    <Save size={13} />
                    {updateProfile.isPending ? "Saving…" : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPersonalForm({
                      firstName: user?.firstName ?? "",
                      lastName: user?.lastName ?? "",
                    });
                    setEditingPersonal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#dbe4ef] px-4 py-2 text-xs font-bold text-[#184e77] transition hover:bg-[#f0f7ff]"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
            </div>
          </SectionCard>

          {/* ── School Info ── */}
          {institutionId && (
            <SectionCard title="School Information" icon={Building2}>
              {institution ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2 grid gap-4 md:grid-cols-2">
                      <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3 transition hover:border-[#184e77] hover:bg-white ${uploadingSchoolAsset === "logo" ? "pointer-events-none opacity-70" : ""}`}>
                        <div>
                          <p className="text-sm font-semibold text-[#172033]">
                            {uploadingSchoolAsset === "logo" ? "Uploading logo..." : schoolForm.logoUrl ? "Replace school logo" : "Upload school logo"}
                          </p>
                          <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP</p>
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
                            void handleSchoolAssetUpload(file, "logo");
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3 transition hover:border-[#184e77] hover:bg-white ${uploadingSchoolAsset === "verification" ? "pointer-events-none opacity-70" : ""}`}>
                        <div>
                          <p className="text-sm font-semibold text-[#172033]">
                            {uploadingSchoolAsset === "verification" ? "Uploading document..." : schoolForm.verificationDocumentUrl ? "Replace verification document" : "Upload verification document"}
                          </p>
                          <p className="text-[11px] text-slate-400">PDF, JPG, or PNG</p>
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
                            void handleSchoolAssetUpload(file, "verification");
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <Field
                      label="School Name"
                      name="name"
                      value={editingSchool ? schoolForm.name : institution.name}
                      editing={editingSchool}
                      onChange={handleSchoolChange}
                      placeholder="School name"
                    />
                    <Field
                      label="School Type"
                      name="type"
                      value={editingSchool ? schoolForm.type : institution.type}
                      editing={editingSchool}
                      onChange={handleSchoolChange}
                      options={SCHOOL_TYPES}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </label>
                      <div className="flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-[#f6f8fb] px-3 py-2">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500">
                          {institution.email}
                        </span>
                      </div>
                    </div>
                    <Field
                      label="Phone"
                      name="phone"
                      value={editingSchool ? schoolForm.phone : (institution.phone ?? "")}
                      editing={editingSchool}
                      onChange={handleSchoolChange}
                      placeholder="+234 800 000 0000"
                    />
                    <Field
                      label="Location / City"
                      name="location"
                      value={editingSchool ? schoolForm.location : institution.location}
                      editing={editingSchool}
                      onChange={handleSchoolChange}
                      placeholder="e.g. Lagos"
                    />
                    <Field
                      label="Street Address"
                      name="address"
                      value={editingSchool ? schoolForm.address : (institution.address ?? "")}
                      editing={editingSchool}
                      onChange={handleSchoolChange}
                      placeholder="Full street address"
                    />
                    <div className="sm:col-span-2">
                      <Field
                        label="Website"
                        name="website"
                        value={editingSchool ? schoolForm.website : (institution.website ?? "")}
                        editing={editingSchool}
                        onChange={handleSchoolChange}
                        placeholder="https://yourschool.edu.ng"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Field
                        label="Description"
                        name="description"
                        value={editingSchool ? schoolForm.description : (institution.description ?? "")}
                        editing={editingSchool}
                        onChange={handleSchoolChange}
                        placeholder="Brief description of your institution…"
                        textarea
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    {editingSchool ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCancelSchool}
                          className="flex items-center gap-1.5 rounded-xl border border-[#dbe4ef] px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                        >
                          <X size={13} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSchool}
                          disabled={updateInstitution.isPending}
                          className="flex items-center gap-1.5 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#287271] disabled:opacity-60"
                        >
                          <Save size={13} />
                          {updateInstitution.isPending ? "Saving…" : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSchool(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-[#dbe4ef] px-4 py-2 text-xs font-bold text-[#184e77] transition hover:bg-[#f0f7ff]"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <div className="size-5 animate-spin rounded-full border-2 border-[#184e77] border-t-transparent" />
                  <span className="ml-3 text-sm">Loading school data…</span>
                </div>
              )}
            </SectionCard>
          )}

          {/* ── Change Password ── */}
          <SectionCard title="Change Password" icon={Lock}>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {(
                [
                  { key: "current", label: "Current Password", fieldName: "currentPassword" },
                  { key: "new", label: "New Password", fieldName: "newPassword" },
                  { key: "confirm", label: "Confirm New Password", fieldName: "confirmPassword" },
                ] as const
              ).map(({ key, label, fieldName }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-[#f6f8fb] px-3 py-2 focus-within:border-[#184e77] focus-within:bg-white transition">
                    <input
                      type={showPw[key] ? "text" : "password"}
                      name={fieldName}
                      value={pwForm[fieldName]}
                      onChange={(e) =>
                        setPwForm((p) => ({ ...p, [fieldName]: e.target.value }))
                      }
                      className="flex-1 bg-transparent text-sm font-semibold text-[#172033] outline-none"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPw((p) => ({ ...p, [key]: !p[key] }))
                      }
                      className="text-slate-400 transition hover:text-[#184e77]"
                    >
                      {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}

              {pwError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                  {pwError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-[#184e77] px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#287271] disabled:opacity-60"
                >
                  <Lock size={13} />
                  {changePassword.isPending ? "Changing…" : "Change Password"}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* ── Account overview ── */}
          <SectionCard title="Account Overview" icon={Shield}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#dbe4ef] p-4">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Account Status
                </p>
                {user?.isVerified ? (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                    <CheckCircle size={14} /> Verified
                  </span>
                ) : (
                  <span className="text-sm font-bold text-amber-600">
                    Pending Verification
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-[#dbe4ef] p-4">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Role
                </p>
                <span className="flex items-center gap-1.5 text-sm font-bold text-[#184e77]">
                  <Shield size={14} />
                  {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Institution Admin"}
                </span>
              </div>
              {institution && (
                <>
                  <div className="rounded-xl border border-[#dbe4ef] p-4">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Institution Status
                    </p>
                    <span
                      className={`text-sm font-bold ${
                        institution.isActive ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {institution.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#dbe4ef] p-4">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      School Type
                    </p>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-[#172033]">
                      <School size={14} className="text-slate-400" />
                      {labelType(institution.type)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#dbe4ef] p-4">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Location
                    </p>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-[#172033]">
                      <MapPin size={14} className="text-slate-400" />
                      {institution.location || (
                        <span className="italic text-slate-400">Not set</span>
                      )}
                    </span>
                  </div>
                  {institution.website && (
                    <div className="rounded-xl border border-[#dbe4ef] p-4">
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Website
                      </p>
                      <a
                        href={institution.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-bold text-[#184e77] hover:underline"
                      >
                        <Globe size={14} />
                        {institution.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </SectionCard>

        </div>
      </div>
    </AdminLayout>
  );
}
