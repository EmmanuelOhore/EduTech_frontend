import { Form, Formik } from "formik";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileUp,
  Globe2,
  GraduationCap,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useTeacherRegisterMutation, useUploadAssetMutation } from "../services/mutation";
import type { TeacherRegisterFormValues } from "../types/TypeChecks";
import Inputfield from "../ui/inputfield";

const benefits = [
  { icon: Globe2, title: "National Reach", body: "Connect with verified schools across Nigeria." },
  { icon: ShieldCheck, title: "Verified Institutions", body: "Every school is reviewed before going live." },
  { icon: Award, title: "One-Click Apply", body: "Your profile does the work — just apply." },
  { icon: TrendingUp, title: "Career Visibility", body: "Get discovered by schools seeking your exact skills." },
];

const stats = [
  { value: "500+", label: "Teachers Registered" },
  { value: "9+", label: "Jobs Available" },
  { value: "6", label: "Locations" },
];

const subjectOptions = [
  "Mathematics", "English Language", "Physics", "Chemistry",
  "Biology", "Computer Science", "Economics", "Government",
  "History", "French", "Geography", "Agricultural Science",
];

const initialValues: TeacherRegisterFormValues = {
  firstName: "", lastName: "", email: "", password: "",
  confirmPassword: "", subject: "", location: "", level: "",
  referralCode: "", nin: "", profilePicture: "", teachingCertificate: "",
  agreeToTerms: false,
};

const validationSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().min(6, "Use at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
  subject: Yup.string().required("Select your main subject"),
  location: Yup.string().required("Location is required"),
  level: Yup.string()
    .oneOf(["BEGINNER", "INTERMEDIATE", "EXPERT"], "Select your level")
    .required("Teacher level is required"),
  agreeToTerms: Yup.boolean().oneOf([true], "Accept the terms to continue"),
});

/* ── FORM SECTION HEADER ──────────────────────────────────────── */
const SectionHeader = ({
  step, title, subtitle,
}: { step: number; title: string; subtitle: string }) => (
  <div className="mb-5 flex items-center gap-4">
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#184e77] text-sm font-black text-white shadow-sm shadow-[#184e77]/30">
      {step}
    </span>
    <div>
      <p className="text-base font-black text-[#172033]">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  </div>
);

/* ── SELECT FIELD (styled) ──────────────────────────────────────── */
const SelectField = ({
  label, name, value, onChange, children,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
    {label}
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
    >
      {children}
    </select>
  </label>
);

/* ── UPLOAD ZONE ──────────────────────────────────────────────── */
const UploadZone = ({
  icon: Icon,
  label,
  fileName,
  uploading,
  onFileSelect,
}: {
  icon: React.ElementType;
  label: string;
  fileName?: string;
  uploading?: boolean;
  onFileSelect: (file: File) => void;
}) => (
  <label
    className={`group flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-[#b7c4d2] bg-[#f8fafc] p-6 text-center transition hover:border-[#184e77] hover:bg-[#e0f2fe]/40 ${uploading ? "pointer-events-none opacity-70" : ""}`}
  >
    <input
      type="file"
      accept=".png,.jpg,.jpeg,.pdf"
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onFileSelect(file);
        e.target.value = "";
      }}
    />
    <span className="grid size-10 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77] transition group-hover:bg-[#184e77] group-hover:text-white">
      <Icon size={18} />
    </span>
    <span className="text-sm font-bold text-[#184e77]">{label}</span>
    <span className="text-[11px] text-slate-400">
      {uploading ? "Uploading..." : fileName || "PNG, JPG, PDF · Max 8MB"}
    </span>
  </label>
);

/* ── MAIN COMPONENT ───────────────────────────────────────────── */
const TeacherRegister = () => {
  const teacherRegister = useTeacherRegisterMutation();
  const uploadAsset = useUploadAssetMutation();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState({
    profilePicture: "",
    teachingCertificate: "",
  });
  const [uploading, setUploading] = useState({
    profilePicture: false,
    teachingCertificate: false,
  });

  return (
    <div className="flex min-h-screen bg-[#f6f8fb] text-[#172033]">

      {/* ── LEFT PANEL (gradient) ─────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-[42%] shrink-0 flex-col overflow-y-auto bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271] lg:flex">

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-56 rounded-full bg-white/5" />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-sm font-black text-white ring-1 ring-white/20">E</span>
              <span className="text-base font-black tracking-tight text-white">
                EduStaff<span className="text-[#7dd3fc]">Connect</span>
              </span>
            </Link>

            <div className="mt-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#7dd3fc] ring-1 ring-white/20">
                <Sparkles size={12} />
                Teacher Community
              </span>
              <h1 className="mt-5 text-3xl font-black leading-tight text-white xl:text-4xl">
                Build your teaching profile in clear steps.
              </h1>
              <p className="mt-4 text-base leading-7 text-white/70">
                Create your account, add your subject expertise, and prepare
                your profile for school applications across Nigeria.
              </p>
            </div>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/15">
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-white/60">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                    <span className="grid size-8 place-items-center rounded-lg bg-white/15 text-[#7dd3fc]">
                      <Icon size={15} />
                    </span>
                    <p className="mt-3 text-sm font-black text-white">{b.title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/60">{b.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom trust strip */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-xs text-white/50">Already have an account?</p>
            <Link to="/" className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#7dd3fc] transition hover:underline">
              Sign in instead <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL (form) ────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-y-auto">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-[#dbe4ef] bg-[#184e77] px-6 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-white/15 text-xs font-black text-white">E</span>
            <span className="text-sm font-black text-white">EduStaff<span className="text-[#7dd3fc]">Connect</span></span>
          </Link>
          <Link to="/" className="text-xs font-bold text-white/70">← Back</Link>
        </div>

        <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 xl:px-16 2xl:px-20">

          {/* Form header */}
          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-bold text-[#184e77]">
                <GraduationCap size={12} />
                Teacher sign up
              </span>
              <h2 className="mt-3 text-3xl font-black text-[#172033] xl:text-4xl">
                Create your teacher account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Takes about 3 minutes · Free forever
              </p>
            </div>
            <span className="hidden shrink-0 rounded-xl bg-[#eef6fb] px-3 py-2 text-xs font-bold text-[#184e77] sm:block">
              Public onboarding
            </span>
          </div>

          {/* Progress steps */}
          <div className="mb-10 flex items-center gap-2">
            {["Account Details", "Teaching Profile", "Documents"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-[#184e77] text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  <span className="hidden text-xs font-semibold text-slate-600 sm:block">{label}</span>
                </div>
                {i < 2 && <span className="h-px w-6 bg-[#dbe4ef] sm:w-10" />}
              </div>
            ))}
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              teacherRegister.mutate(
                {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  password: values.password,
                  location: values.location,
                  level: values.level as "BEGINNER" | "INTERMEDIATE" | "EXPERT",
                  nin: values.nin || undefined,
                  profileImage: values.profilePicture || undefined,
                  certificateUrl: values.teachingCertificate || undefined,
                },
                {
                  onSuccess: () => navigate("/jobs", { replace: true }),
                },
              );
            }}
          >
            {({ values, setFieldValue }) => (
              <Form className="flex flex-1 flex-col gap-8">

                {/* ── SECTION 1: Account Details ──────────────── */}
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                  <SectionHeader
                    step={1}
                    title="Account Details"
                    subtitle="Your login credentials for EduStaff Connect"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Inputfield type="text" name="firstName" label="First Name" placeholder="e.g. Emmanuel" />
                    <Inputfield type="text" name="lastName" label="Last Name" placeholder="e.g. Ohore" />
                    <div className="sm:col-span-2">
                      <Inputfield type="email" name="email" label="Email Address" placeholder="teacher@email.com" />
                    </div>
                    <Inputfield type="password" name="password" label="Password" placeholder="At least 6 characters" />
                    <Inputfield type="password" name="confirmPassword" label="Confirm Password" placeholder="Re-enter password" />
                  </div>
                </div>

                {/* ── SECTION 2: Teaching Profile ─────────────── */}
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                  <SectionHeader
                    step={2}
                    title="Teaching Profile"
                    subtitle="Help schools understand your expertise and location"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Subject Expertise"
                      name="subject"
                      value={values.subject}
                      onChange={(v) => setFieldValue("subject", v)}
                    >
                      <option value="">Select your subject</option>
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </SelectField>

                    <SelectField
                      label="Teacher Level"
                      name="level"
                      value={values.level}
                      onChange={(v) => setFieldValue("level", v)}
                    >
                      <option value="">Select your level</option>
                      <option value="BEGINNER">Beginner — 0–2 years</option>
                      <option value="INTERMEDIATE">Intermediate — 3–6 years</option>
                      <option value="EXPERT">Expert — 7+ years</option>
                    </SelectField>

                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                      Location
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="City, State (e.g. Lagos, Nigeria)"
                          value={values.location}
                          onChange={(e) => setFieldValue("location", e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                        />
                      </div>
                    </label>

                    <Inputfield type="text" name="nin" label="NIN Number (Optional)" placeholder="Enter NIN if available" />
                    <Inputfield type="text" name="referralCode" label="Referral Code (Optional)" placeholder="Enter code if you have one" />
                  </div>
                </div>

                {/* ── SECTION 3: Documents ────────────────────── */}
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                  <SectionHeader
                    step={3}
                    title="Documents"
                    subtitle="Upload your photo and certificate — you can skip these for now"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <UploadZone
                      icon={Upload}
                      label="Upload Profile Photo"
                      fileName={selectedFiles.profilePicture}
                      uploading={uploading.profilePicture}
                      onFileSelect={async (file) => {
                        try {
                          setUploading((current) => ({ ...current, profilePicture: true }));
                          const uploaded = await uploadAsset.mutateAsync({
                            file,
                            category: "teacher-profile-image",
                          });
                          setSelectedFiles((files) => ({ ...files, profilePicture: uploaded.originalName }));
                          setFieldValue("profilePicture", uploaded.url);
                          toast.success("Profile photo uploaded");
                        } catch {
                          // toast handled in mutation
                        } finally {
                          setUploading((current) => ({ ...current, profilePicture: false }));
                        }
                      }}
                    />
                    <UploadZone
                      icon={FileUp}
                      label="Upload Teaching Certificate"
                      fileName={selectedFiles.teachingCertificate}
                      uploading={uploading.teachingCertificate}
                      onFileSelect={async (file) => {
                        try {
                          setUploading((current) => ({ ...current, teachingCertificate: true }));
                          const uploaded = await uploadAsset.mutateAsync({
                            file,
                            category: "teacher-certificate",
                          });
                          setSelectedFiles((files) => ({ ...files, teachingCertificate: uploaded.originalName }));
                          setFieldValue("teachingCertificate", uploaded.url);
                          toast.success("Teaching certificate uploaded");
                        } catch {
                          // toast handled in mutation
                        } finally {
                          setUploading((current) => ({ ...current, teachingCertificate: false }));
                        }
                      }}
                    />
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    Documents can be added later from your dashboard
                  </p>
                </div>

                {/* ── TERMS + SUBMIT ───────────────────────────── */}
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={values.agreeToTerms}
                      onChange={(e) => setFieldValue("agreeToTerms", e.target.checked)}
                      className="mt-0.5 size-4 accent-[#184e77]"
                    />
                    <span>
                      I agree to the{" "}
                      <button type="button" onClick={() => toast("Terms of Service page is coming soon.")} className="font-bold text-[#184e77] hover:underline">Terms of Service</button>
                      {" "}and{" "}
                      <button type="button" onClick={() => toast("Privacy Policy page is coming soon.")} className="font-bold text-[#184e77] hover:underline">Privacy Policy</button>.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={teacherRegister.isPending}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#184e77] py-3.5 text-sm font-black text-white shadow transition hover:bg-[#1a6091] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {teacherRegister.isPending ? (
                      "Creating Account…"
                    ) : (
                      <>
                        Create My Teacher Account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Social auth */}
                  <div className="mt-5">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="h-px flex-1 bg-[#dbe4ef]" />
                      or continue with
                      <span className="h-px flex-1 bg-[#dbe4ef]" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => toast("Google sign up is coming soon. Please use the form for now.")}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dbe4ef] bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Mail size={16} className="text-red-500" />
                        Google
                      </button>
                      <button
                        type="button"
                        onClick={() => toast("LinkedIn sign up is coming soon. Please use the form for now.")}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dbe4ef] bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <User size={16} className="text-blue-600" />
                        LinkedIn
                      </button>
                    </div>
                  </div>

                  <p className="mt-5 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to="/" className="font-bold text-[#184e77] hover:underline">
                      Sign in
                    </Link>
                    {" · "}
                    <Link to="/school/register" className="font-bold text-[#287271] hover:underline">
                      Register a school instead
                    </Link>
                  </p>
                </div>

              </Form>
            )}
          </Formik>
        </div>
      </main>
    </div>
  );
};

export default TeacherRegister;
