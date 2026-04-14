import { Form, Formik } from "formik";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  LayoutDashboard,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useSchoolRegisterMutation, useUploadAssetMutation } from "../services/mutation";
import type { SchoolRegisterFormValues } from "../types/TypeChecks";
import Inputfield from "../ui/inputfield";

const benefits = [
  { icon: Users, title: "Qualified Teachers", body: "Access profiles built around subject expertise and verified experience." },
  { icon: ClipboardList, title: "Application Tracking", body: "Manage job listings and hiring progress in one workspace." },
  { icon: BarChart3, title: "Hiring Insights", body: "Track applicants, matches, and staffing needs as you grow." },
  { icon: ShieldCheck, title: "Verified Platform", body: "Structured onboarding ensures only serious schools are listed." },
];

const stats = [
  { value: "9+", label: "Active Jobs" },
  { value: "500+", label: "Teachers" },
  { value: "99%", label: "Uptime" },
];

const schoolType = [
  { value: "PRIMARY", label: "Primary School" },
  { value: "SECONDARY", label: "Secondary School" },
  { value: "TERTIARY", label: "Tertiary Institution" },
  { value: "VOCATIONAL", label: "Vocational School" },
  { value: "OTHER", label: "Other" },
];

const initialValues: SchoolRegisterFormValues = {
  firstName: "", lastName: "", email: "", password: "",
  confirmPassword: "", schoolName: "", schoolLocation: "",
  schoolType: "", phone: "", schoolLogoUrl: "", verificationDocumentUrl: "", agreeToTerms: false,
};

const validationSchema = Yup.object({
  firstName: Yup.string().required("Admin first name is required"),
  lastName: Yup.string().required("Admin last name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().min(6, "Use at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
  schoolName: Yup.string().required("School name is required"),
  schoolLocation: Yup.string().required("School location is required"),
  schoolType: Yup.string()
    .oneOf(["PRIMARY", "SECONDARY", "TERTIARY", "VOCATIONAL", "OTHER"])
    .required("Select school type"),
  agreeToTerms: Yup.boolean().oneOf([true], "Accept the terms to continue"),
});

/* ── SECTION HEADER ───────────────────────────────────────────── */
const SectionHeader = ({
  step, title, subtitle, accent = false,
}: { step: number; title: string; subtitle: string; accent?: boolean }) => (
  <div className="mb-5 flex items-center gap-4">
    <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-sm ${accent ? "bg-[#287271] shadow-[#287271]/30" : "bg-[#184e77] shadow-[#184e77]/30"}`}>
      {step}
    </span>
    <div>
      <p className="text-base font-black text-[#172033]">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  </div>
);

/* ── SELECT FIELD ─────────────────────────────────────────────── */
const SelectField = ({
  label, name, value, onChange, children,
}: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; children: React.ReactNode;
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

/* ── MAIN COMPONENT ───────────────────────────────────────────── */
const SchoolRegister = () => {
  const schoolRegister = useSchoolRegisterMutation();
  const uploadAsset = useUploadAssetMutation();
  const navigate = useNavigate();
  const [schoolAssets, setSchoolAssets] = useState({ logo: "", verificationDocument: "" });
  const [uploading, setUploading] = useState({ logo: false, verificationDocument: false });

  return (
    <div className="flex min-h-screen bg-[#f6f8fb] text-[#172033]">

      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-[42%] shrink-0 flex-col overflow-y-auto bg-gradient-to-br from-[#0d2d44] via-[#184e77] to-[#1a6091] lg:flex">

        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-56 rounded-full bg-white/5" />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <div>
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-sm font-black text-white ring-1 ring-white/20">E</span>
              <span className="text-base font-black tracking-tight text-white">
                EduStaff<span className="text-[#7dd3fc]">Connect</span>
              </span>
            </Link>

            <div className="mt-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#7dd3fc] ring-1 ring-white/20">
                <Sparkles size={12} />
                Admin Portal
              </span>
              <h1 className="mt-5 text-3xl font-black leading-tight text-white xl:text-4xl">
                Create your school hiring workspace.
              </h1>
              <p className="mt-4 text-base leading-7 text-white/70">
                Register your school, set up the admin account, and start
                posting teaching opportunities to a verified talent pool.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/15">
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-white/60">{s.label}</p>
                </div>
              ))}
            </div>

            {/* School image */}
            <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-white/10">
              <img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=320&fit=crop&crop=center"
                alt="School campus"
                className="h-40 w-full object-cover opacity-80"
              />
            </div>

            {/* Benefits */}
            <div className="mt-6 grid grid-cols-2 gap-3">
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

          {/* Bottom */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-xs text-white/50">Looking to join as a teacher instead?</p>
            <Link to="/teacher/register" className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#7dd3fc] transition hover:underline">
              Register as a teacher <ArrowRight size={14} />
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

        {/* ── DEMO BANNER ─────────────────────────────────── */}
        <div className="border-b border-[#dbe4ef] bg-[#e0f2fe] px-6 py-3 sm:px-10 xl:px-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#184e77]">
              <Eye size={13} />
              <span>Demo mode · Skip registration and preview the admin dashboard directly</span>
            </div>
            <Link
              to="/school/dashboard"
              className="flex items-center gap-1.5 rounded-xl bg-[#184e77] px-4 py-2 text-xs font-black text-white transition hover:bg-[#1a6091]"
            >
              <LayoutDashboard size={13} />
              Enter School Dashboard
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 xl:px-16 2xl:px-20">

          {/* Form header */}
          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-bold text-[#184e77]">
                <BriefcaseBusiness size={12} />
                School sign up
              </span>
              <h2 className="mt-3 text-3xl font-black text-[#172033] xl:text-4xl">
                Create your admin account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Register your school to start posting jobs · Takes 3 minutes
              </p>
            </div>
            <span className="hidden shrink-0 rounded-xl bg-[#eef6fb] px-3 py-2 text-xs font-bold text-[#184e77] sm:block">
              Admin onboarding
            </span>
          </div>

          {/* Steps indicator */}
          <div className="mb-10 flex items-center gap-2">
            {["School Details", "Admin Details", "Verification"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className={`grid size-6 place-items-center rounded-full text-[10px] font-black text-white ${i === 0 ? "bg-[#184e77]" : i === 1 ? "bg-[#287271]" : "bg-slate-400"}`}>
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
              schoolRegister.mutate(
                {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  password: values.password,
                  schoolName: values.schoolName,
                  schoolLocation: values.schoolLocation,
                  schoolType: values.schoolType as Exclude<SchoolRegisterFormValues["schoolType"], "">,
                  phone: values.phone || undefined,
                  schoolLogoUrl: values.schoolLogoUrl || undefined,
                  verificationDocumentUrl: values.verificationDocumentUrl || undefined,
                },
                {
                  onSuccess: () => navigate("/school/dashboard", { replace: true }),
                },
              );
            }}
          >
            {({ values, setFieldValue }) => (
              <Form className="flex flex-1 flex-col gap-8">

                {/* ── SECTION 1: School Details ────────────────── */}
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                  <SectionHeader
                    step={1}
                    title="School Details"
                    subtitle="Tell us about your institution"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                        School Name
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="e.g. Cedar Heights Secondary School"
                            value={values.schoolName}
                            onChange={(e) => setFieldValue("schoolName", e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                          />
                        </div>
                      </label>
                    </div>

                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                      School Location
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="City, State"
                          value={values.schoolLocation}
                          onChange={(e) => setFieldValue("schoolLocation", e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                        />
                      </div>
                    </label>

                    <SelectField
                      label="School Type"
                      name="schoolType"
                      value={values.schoolType}
                      onChange={(v) => setFieldValue("schoolType", v)}
                    >
                      <option value="">Select school type</option>
                      {schoolType.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </SelectField>

                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                      Phone Number (Optional)
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={values.phone}
                          onChange={(e) => setFieldValue("phone", e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* ── SECTION 2: Admin Details ─────────────────── */}
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                  <SectionHeader
                    step={2}
                    title="Admin Details"
                    subtitle="The person who will manage this school account"
                    accent
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Inputfield type="text" name="firstName" label="Admin First Name" placeholder="Enter first name" />
                    <Inputfield type="text" name="lastName" label="Admin Last Name" placeholder="Enter last name" />
                    <div className="sm:col-span-2">
                      <Inputfield type="email" name="email" label="Admin Email Address" placeholder="admin@school.com" />
                    </div>
                    <Inputfield type="password" name="password" label="Password" placeholder="At least 6 characters" />
                    <Inputfield type="password" name="confirmPassword" label="Confirm Password" placeholder="Re-enter password" />
                  </div>
                </div>

                {/* ── SECTION 3: Verification ──────────────────── */}
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                  <SectionHeader
                    step={3}
                    title="Verification"
                    subtitle="School documents help us verify your institution"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label
                      className={`group flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#b7c4d2] bg-[#f8fafc] p-8 text-center transition hover:border-[#184e77] hover:bg-[#e0f2fe]/30 ${uploading.logo ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploading((current) => ({ ...current, logo: true }));
                            const uploaded = await uploadAsset.mutateAsync({ file, category: "institution-logo" });
                            setSchoolAssets((current) => ({ ...current, logo: uploaded.originalName }));
                            setFieldValue("schoolLogoUrl", uploaded.url);
                            toast.success("School logo uploaded");
                          } catch {
                            // toast handled in mutation
                          } finally {
                            setUploading((current) => ({ ...current, logo: false }));
                            e.target.value = "";
                          }
                        }}
                      />
                      <span className="grid size-12 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77] transition group-hover:bg-[#184e77] group-hover:text-white">
                        <Building2 size={20} />
                      </span>
                      <div>
                        <p className="text-sm font-black text-[#184e77]">Upload School Logo</p>
                        <p className="mt-1 text-xs text-slate-400">PNG, JPG, or WEBP for your school identity</p>
                      </div>
                      <span className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-[#dbe4ef]">
                        {uploading.logo ? "Uploading..." : schoolAssets.logo || "Choose File"}
                      </span>
                    </label>
                    <label
                      className={`group flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#b7c4d2] bg-[#f8fafc] p-8 text-center transition hover:border-[#184e77] hover:bg-[#e0f2fe]/30 ${uploading.verificationDocument ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploading((current) => ({ ...current, verificationDocument: true }));
                            const uploaded = await uploadAsset.mutateAsync({ file, category: "institution-verification-document" });
                            setSchoolAssets((current) => ({ ...current, verificationDocument: uploaded.originalName }));
                            setFieldValue("verificationDocumentUrl", uploaded.url);
                            toast.success("School document uploaded");
                          } catch {
                            // toast handled in mutation
                          } finally {
                            setUploading((current) => ({ ...current, verificationDocument: false }));
                            e.target.value = "";
                          }
                        }}
                      />
                      <span className="grid size-12 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77] transition group-hover:bg-[#184e77] group-hover:text-white">
                        <FileText size={20} />
                      </span>
                      <div>
                        <p className="text-sm font-black text-[#184e77]">Upload School Document</p>
                        <p className="mt-1 text-xs text-slate-400">CAC certificate, approval letter, or school ID</p>
                      </div>
                      <span className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-[#dbe4ef]">
                        {uploading.verificationDocument ? "Uploading..." : schoolAssets.verificationDocument || "Choose File"}
                      </span>
                    </label>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    You can complete institution verification after account creation
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
                      The information provided is accurate and belongs to our institution.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={schoolRegister.isPending}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#184e77] py-3.5 text-sm font-black text-white shadow transition hover:bg-[#1a6091] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {schoolRegister.isPending ? (
                      "Creating Account…"
                    ) : (
                      <>
                        Create School Admin Account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p className="mt-5 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to="/" className="font-bold text-[#184e77] hover:underline">
                      Sign in
                    </Link>
                    {" · "}
                    <Link to="/teacher/register" className="font-bold text-[#287271] hover:underline">
                      Register as a teacher instead
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

export default SchoolRegister;
