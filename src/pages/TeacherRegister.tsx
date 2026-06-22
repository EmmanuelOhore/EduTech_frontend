import { Form, Formik } from "formik";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  FileUp,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { useState, type ElementType, type ReactNode } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { nigeriaLocations, stateOptions } from "../lib/nigeriaLocations";
import { useTeacherRegisterMutation, useUploadAssetMutation } from "../services/mutation";
import type { StaffRole, TeacherRegisterFormValues } from "../types/TypeChecks";
import Inputfield from "../ui/inputfield";

const roleOptions: { value: StaffRole; label: string; hint: string }[] = [
  { value: "TEACHER", label: "Teacher", hint: "Classroom, subject, or lesson delivery" },
  { value: "DRIVER", label: "Driver", hint: "School transport and logistics" },
  { value: "JANITOR", label: "Janitor", hint: "Cleaning, maintenance, and facility support" },
  { value: "ADMIN_STAFF", label: "Admin Staff", hint: "Front desk, records, bursary, or office work" },
];

const subjectOptions = [
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Government",
  "History",
  "French",
  "Geography",
  "Agricultural Science",
];

const initialValues: TeacherRegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  staffRole: "TEACHER",
  state: "",
  lga: "",
  primarySubject: "",
  secondarySubject: "",
  tertiarySubject: "",
  location: "",
  level: "BEGINNER",
  teachingLevel: "",
  teachingPracticeStatus: "NOT_APPLICABLE",
  nyscStatus: "NOT_APPLICABLE",
  referralCode: "",
  nin: "",
  profilePicture: "",
  teachingCertificate: "",
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
  staffRole: Yup.string().oneOf(roleOptions.map((role) => role.value)).required(),
  state: Yup.string().required("Select your state"),
  lga: Yup.string().required("Select your LGA"),
  teachingLevel: Yup.string().when("staffRole", {
    is: "TEACHER",
    then: (schema) => schema.required("Select the level you teach"),
    otherwise: (schema) => schema.notRequired(),
  }),
  primarySubject: Yup.string().when("staffRole", {
    is: "TEACHER",
    then: (schema) => schema.required("Select your main subject"),
    otherwise: (schema) => schema.notRequired(),
  }),
  agreeToTerms: Yup.boolean().oneOf([true], "Accept the terms to continue"),
});

const staffRoleLabel = (role: StaffRole) =>
  roleOptions.find((option) => option.value === role)?.label ?? "Staff";

const SectionHeader = ({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle: string;
}) => (
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

const SelectField = ({
  label,
  name,
  value,
  onChange,
  children,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) => (
  <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
    {label}
    <select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
    >
      {children}
    </select>
  </label>
);

const UploadZone = ({
  icon: Icon,
  label,
  fileName,
  uploading,
  accept = ".png,.jpg,.jpeg,.webp",
  emptyText = "PNG, JPG or WEBP",
  onFileSelect,
}: {
  icon: ElementType;
  label: string;
  fileName?: string;
  uploading?: boolean;
  accept?: string;
  emptyText?: string;
  onFileSelect: (file: File) => void;
}) => (
  <label
    className={`group flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-[#b7c4d2] bg-[#f8fafc] p-6 text-center transition hover:border-[#184e77] hover:bg-[#e0f2fe]/40 ${uploading ? "pointer-events-none opacity-70" : ""}`}
  >
    <input
      type="file"
      accept={accept}
      className="sr-only"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        onFileSelect(file);
        event.target.value = "";
      }}
    />
    <span className="grid size-10 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77] transition group-hover:bg-[#184e77] group-hover:text-white">
      <Icon size={18} />
    </span>
    <span className="text-sm font-bold text-[#184e77]">{label}</span>
    <span className="text-[11px] text-slate-400">
      {uploading ? "Uploading..." : fileName || emptyText}
    </span>
  </label>
);

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
      <aside className="sticky top-0 hidden h-screen w-[40%] shrink-0 flex-col overflow-y-auto bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271] lg:flex">
        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-sm font-black text-white ring-1 ring-white/20">
                E
              </span>
              <span className="text-base font-black tracking-tight text-white">
                EduStaff<span className="text-[#7dd3fc]">Connect</span>
              </span>
            </Link>

            <div className="mt-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#7dd3fc] ring-1 ring-white/20">
                <Sparkles size={12} />
                Staff onboarding
              </span>
              <h1 className="mt-5 text-3xl font-black leading-tight text-white xl:text-4xl">
                One simple profile for school opportunities.
              </h1>
              <p className="mt-4 text-base leading-7 text-white/70">
                Choose your role, add your location, and we only ask for the extra details your role needs.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {[
                { icon: UserRound, title: "Role-based", body: "Teacher, Driver, Janitor, or Admin Staff." },
                { icon: MapPin, title: "State and LGA", body: "Schools can match staff by actual location." },
                { icon: Award, title: "Public profile", body: "Each staff member gets a shareable profile link." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                    <span className="grid size-8 place-items-center rounded-lg bg-white/15 text-[#7dd3fc]">
                      <Icon size={15} />
                    </span>
                    <p className="mt-3 text-sm font-black text-white">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/60">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-xs text-white/50">Already have an account?</p>
            <Link to="/login" className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#7dd3fc] transition hover:underline">
              Sign in instead <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#dbe4ef] bg-[#184e77] px-6 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-white/15 text-xs font-black text-white">
              E
            </span>
            <span className="text-sm font-black text-white">
              EduStaff<span className="text-[#7dd3fc]">Connect</span>
            </span>
          </Link>
          <Link to="/" className="text-xs font-bold text-white/70">
            Back
          </Link>
        </div>

        <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 xl:px-16">
          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-bold text-[#184e77]">
                <Briefcase size={12} />
                Staff sign up
              </span>
              <h2 className="mt-3 text-3xl font-black text-[#172033] xl:text-4xl">
                Create your staff profile
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Simple form. Teacher details only appear when needed.
              </p>
            </div>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              const subjects = [
                values.primarySubject,
                values.secondarySubject,
                values.tertiarySubject,
              ]
                .filter(Boolean)
                .map((subject, index) => ({ subject, rank: index + 1 }));

              teacherRegister.mutate(
                {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  password: values.password,
                  staffRole: values.staffRole,
                  state: values.state,
                  lga: values.lga,
                  location: `${values.lga}, ${values.state}`,
                  level: values.level || "BEGINNER",
                  teachingLevel: values.staffRole === "TEACHER" ? values.teachingLevel || undefined : undefined,
                  teachingPracticeStatus:
                    values.staffRole === "TEACHER" ? values.teachingPracticeStatus : "NOT_APPLICABLE",
                  nyscStatus: values.staffRole === "TEACHER" ? values.nyscStatus : "NOT_APPLICABLE",
                  subjectExpertise: values.staffRole === "TEACHER" ? subjects : [],
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
            {({ values, setFieldValue }) => {
              const lgaOptions = nigeriaLocations[values.state] ?? [];
              const isTeacher = values.staffRole === "TEACHER";

              return (
                <Form className="flex flex-1 flex-col gap-8">
                  <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                    <SectionHeader
                      step={1}
                      title="Choose your role"
                      subtitle="This keeps the form short and relevant"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {roleOptions.map((role) => {
                        const active = values.staffRole === role.value;
                        return (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setFieldValue("staffRole", role.value)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              active
                                ? "border-[#184e77] bg-[#eef6fb] ring-2 ring-[#184e77]/10"
                                : "border-[#dbe4ef] bg-white hover:border-[#184e77]/40"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-black text-[#172033]">{role.label}</span>
                              {active && <CheckCircle2 size={16} className="text-[#287271]" />}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">{role.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                    <SectionHeader
                      step={2}
                      title="Account and location"
                      subtitle="Schools use this to find staff near them"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Inputfield type="text" name="firstName" label="First Name" placeholder="e.g. Emmanuel" />
                      <Inputfield type="text" name="lastName" label="Last Name" placeholder="e.g. Ohore" />
                      <div className="sm:col-span-2">
                        <Inputfield type="email" name="email" label="Email Address" placeholder="staff@email.com" />
                      </div>
                      <Inputfield type="password" name="password" label="Password" placeholder="At least 6 characters" />
                      <Inputfield type="password" name="confirmPassword" label="Confirm Password" placeholder="Re-enter password" />

                      <SelectField
                        label="State"
                        name="state"
                        value={values.state}
                        onChange={(value) => {
                          setFieldValue("state", value);
                          setFieldValue("lga", "");
                        }}
                      >
                        <option value="">Select state</option>
                        {stateOptions.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </SelectField>

                      <SelectField
                        label="LGA"
                        name="lga"
                        value={values.lga}
                        onChange={(value) => setFieldValue("lga", value)}
                      >
                        <option value="">Select LGA</option>
                        {lgaOptions.map((lga) => (
                          <option key={lga} value={lga}>
                            {lga}
                          </option>
                        ))}
                      </SelectField>

                      <Inputfield type="text" name="nin" label="NIN Number (Optional)" placeholder="Enter NIN if available" />
                      <Inputfield type="text" name="referralCode" label="Referral Code (Optional)" placeholder="Enter code if you have one" />
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                      <SectionHeader
                        step={3}
                        title="Teacher details"
                        subtitle="Only teachers need to complete this section"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SelectField
                          label="Teaching Level"
                          name="teachingLevel"
                          value={values.teachingLevel}
                          onChange={(value) => setFieldValue("teachingLevel", value)}
                        >
                          <option value="">Select level</option>
                          <option value="PRIMARY">Primary</option>
                          <option value="SECONDARY">Secondary</option>
                          <option value="TERTIARY">Tertiary</option>
                        </SelectField>

                        <SelectField
                          label="Experience Level"
                          name="level"
                          value={values.level}
                          onChange={(value) => setFieldValue("level", value)}
                        >
                          <option value="BEGINNER">Beginner - 0 to 2 years</option>
                          <option value="INTERMEDIATE">Intermediate - 3 to 6 years</option>
                          <option value="EXPERT">Expert - 7+ years</option>
                        </SelectField>

                        <SelectField
                          label="Primary Subject"
                          name="primarySubject"
                          value={values.primarySubject}
                          onChange={(value) => setFieldValue("primarySubject", value)}
                        >
                          <option value="">Select main subject</option>
                          {subjectOptions.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </SelectField>

                        <SelectField
                          label="Second Subject (Optional)"
                          name="secondarySubject"
                          value={values.secondarySubject}
                          onChange={(value) => setFieldValue("secondarySubject", value)}
                        >
                          <option value="">Select second subject</option>
                          {subjectOptions.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </SelectField>

                        <SelectField
                          label="Third Subject (Optional)"
                          name="tertiarySubject"
                          value={values.tertiarySubject}
                          onChange={(value) => setFieldValue("tertiarySubject", value)}
                        >
                          <option value="">Select third subject</option>
                          {subjectOptions.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </SelectField>

                        <SelectField
                          label="Teaching Practice"
                          name="teachingPracticeStatus"
                          value={values.teachingPracticeStatus}
                          onChange={(value) => setFieldValue("teachingPracticeStatus", value)}
                        >
                          <option value="NOT_APPLICABLE">Not applicable</option>
                          <option value="NOT_STARTED">Not started</option>
                          <option value="ONGOING">Ongoing</option>
                          <option value="COMPLETED">Completed</option>
                        </SelectField>

                        <SelectField
                          label="NYSC Status"
                          name="nyscStatus"
                          value={values.nyscStatus}
                          onChange={(value) => setFieldValue("nyscStatus", value)}
                        >
                          <option value="NOT_APPLICABLE">Not applicable</option>
                          <option value="NOT_STARTED">Not started</option>
                          <option value="ONGOING">Ongoing</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="EXEMPTED">Exempted</option>
                        </SelectField>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                    <SectionHeader
                      step={isTeacher ? 4 : 3}
                      title="Photo and documents"
                      subtitle="Optional now, useful for stronger public profiles"
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
                          } finally {
                            setUploading((current) => ({ ...current, profilePicture: false }));
                          }
                        }}
                      />
                      <UploadZone
                        icon={FileUp}
                        label={isTeacher ? "Upload Teaching Certificate" : "Upload Supporting Document"}
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
                            toast.success("Document uploaded");
                          } finally {
                            setUploading((current) => ({ ...current, teachingCertificate: false }));
                          }
                        }}
                      />
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      You can complete documents later from your dashboard.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm shadow-slate-900/[0.04]">
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={values.agreeToTerms}
                        onChange={(event) => setFieldValue("agreeToTerms", event.target.checked)}
                        className="mt-0.5 size-4 accent-[#184e77]"
                      />
                      <span>
                        I agree to EduStaff Connect creating my {staffRoleLabel(values.staffRole).toLowerCase()} profile and public profile link.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={teacherRegister.isPending}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#184e77] py-3.5 text-sm font-black text-white shadow transition hover:bg-[#1a6091] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {teacherRegister.isPending ? (
                        "Creating Account..."
                      ) : (
                        <>
                          Create My {staffRoleLabel(values.staffRole)} Profile
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <p className="mt-5 text-center text-sm text-slate-500">
                      Already have an account?{" "}
                      <Link to="/login" className="font-bold text-[#184e77] hover:underline">
                        Sign in
                      </Link>
                      {" · "}
                      <Link to="/school/register" className="font-bold text-[#287271] hover:underline">
                        Register a school instead
                      </Link>
                    </p>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </main>
    </div>
  );
};

export default TeacherRegister;
