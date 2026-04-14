import { Form, Formik } from "formik";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  LockKeyhole,
  School,
  ShieldCheck,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useLoginMutation } from "../services/mutation";
import type { AuthResponse, LoginPayload } from "../types/TypeChecks";

const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const getRoleLandingPage = (auth: AuthResponse) => {
  if (auth.user.role === "INSTITUTION_ADMIN" || auth.user.role === "SUPER_ADMIN") {
    return "/school/dashboard";
  }
  return "/jobs";
};

const canUseRedirect = (auth: AuthResponse, redirectTo?: string) => {
  if (!redirectTo) return false;
  if (redirectTo.startsWith("/school")) {
    return auth.user.role === "INSTITUTION_ADMIN" || auth.user.role === "SUPER_ADMIN";
  }
  if (redirectTo === "/dashboard") {
    return auth.user.role === "TEACHER";
  }
  return true;
};

const features = [
  {
    icon: GraduationCap,
    title: "For Teachers",
    desc: "Browse open positions and apply with one click",
  },
  {
    icon: School,
    title: "For Schools",
    desc: "Post jobs and manage applicants effortlessly",
  },
  {
    icon: Users,
    title: "For Admins",
    desc: "Full access to protected dashboards & analytics",
  },
];

const Login = () => {
  const loginMutation = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#f0f4f9]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="relative z-20 border-b border-white/20 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#184e77] to-[#1a7a6e] text-sm font-black text-white shadow-md">
              E
            </span>
            <span className="text-base font-black tracking-tight text-[#172033]">EduStaff Connect</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-[#dbe4ef] bg-white px-4 py-2 text-sm font-bold text-[#184e77] transition-all hover:bg-[#f0f8ff] hover:shadow-sm"
          >
            <ArrowLeft size={15} />
            Back Home
          </Link>
        </div>
      </header>

      {/* ── Body ── */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_1fr] min-h-[calc(100vh-64px)] max-tablet:grid-cols-1">

        {/* ── LEFT — Brand Panel ── */}
        <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d3151] via-[#184e77] to-[#1a7a6e] p-12 max-tablet:p-8 max-phoneL:p-6">

          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-16 bottom-32 h-40 w-40 rounded-full bg-white/5" />

          {/* top badge */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/90">
              <ShieldCheck size={13} />
              Secure Platform
            </span>

            <h1 className="mt-8 text-4xl font-black leading-[1.15] text-white max-phoneL:text-3xl">
              Connecting great{" "}
              <span className="text-[#6edcd4]">teachers</span>
              {" "}with great{" "}
              <span className="text-[#6edcd4]">schools.</span>
            </h1>

            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/70">
              Manage job listings, teacher applications, and school dashboards — all in one place.
            </p>

            {/* feature cards */}
            <div className="mt-10 grid gap-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <span className="mt-0.5 grid size-9 flex-shrink-0 place-items-center rounded-xl bg-white/15">
                    <Icon size={17} className="text-[#6edcd4]" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/60">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* bottom stats strip */}
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            {[
              { val: "2,400+", label: "Teachers" },
              { val: "580+", label: "Schools" },
              { val: "12k+", label: "Applications" },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="text-2xl font-black text-white">{val}</p>
                <p className="text-xs text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT — Form Panel ── */}
        <section className="flex items-center justify-center bg-[#f0f4f9] px-8 py-12 max-phoneL:px-5">
          <div className="w-full max-w-md">

            {/* card */}
            <div className="rounded-3xl border border-[#dbe4ef] bg-white p-8 shadow-xl shadow-slate-900/[0.06] max-phoneL:p-6">

              {/* header */}
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#184e77] to-[#1a7a6e] shadow-md">
                    <BookOpen size={22} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-[#172033]">Welcome back</h2>
                  <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue.</p>
                </div>
              </div>

              <Formik<LoginPayload>
                initialValues={{ email: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                  loginMutation.mutate(values, {
                    onSuccess: (data) => {
                      const auth = data as AuthResponse;
                      navigate(canUseRedirect(auth, redirectTo) ? redirectTo! : getRoleLandingPage(auth), {
                        replace: true,
                      });
                    },
                  });
                }}
              >
                {({ values, errors, touched, handleChange, handleBlur }) => (
                  <Form className="grid gap-5">

                    {/* Email */}
                    <div className="grid gap-1.5">
                      <label htmlFor="email" className="text-sm font-semibold text-[#172033]">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@email.com"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#184e77]/20 focus:border-[#184e77] ${
                          touched.email && errors.email
                            ? "border-red-400 bg-red-50"
                            : "border-[#dbe4ef] bg-[#f8fafc] hover:border-slate-300"
                        }`}
                      />
                      {touched.email && errors.email && (
                        <p className="text-xs font-medium text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-semibold text-[#172033]">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => toast("Password reset is not available yet. Please contact support to reset your password.")}
                          className="text-xs font-semibold text-[#184e77] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#184e77]/20 focus:border-[#184e77] ${
                            touched.password && errors.password
                              ? "border-red-400 bg-red-50"
                              : "border-[#dbe4ef] bg-[#f8fafc] hover:border-slate-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {touched.password && errors.password && (
                        <p className="text-xs font-medium text-red-500">{errors.password}</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#184e77] to-[#1a7a6e] px-5 text-sm font-black text-white shadow-md shadow-[#184e77]/25 transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LockKeyhole size={16} />
                          Sign In
                        </>
                      )}
                    </button>

                    {/* divider */}
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#dbe4ef]" />
                      <span className="text-xs font-medium text-slate-400">New here?</span>
                      <div className="h-px flex-1 bg-[#dbe4ef]" />
                    </div>

                    {/* sign-up buttons */}
                    <div className="grid grid-cols-2 gap-3 max-phoneL:grid-cols-1">
                      <Link
                        to="/teacher/register"
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dbe4ef] bg-white px-4 text-sm font-bold text-[#184e77] shadow-sm transition-all hover:border-[#184e77]/30 hover:bg-[#f0f8ff] hover:shadow-md"
                      >
                        <GraduationCap size={15} />
                        Teacher Sign Up
                      </Link>
                      <Link
                        to="/school/register"
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dbe4ef] bg-white px-4 text-sm font-bold text-[#184e77] shadow-sm transition-all hover:border-[#184e77]/30 hover:bg-[#f0f8ff] hover:shadow-md"
                      >
                        <BriefcaseBusiness size={15} />
                        School Sign Up
                      </Link>
                    </div>

                  </Form>
                )}
              </Formik>
            </div>

            {/* below-card note */}
            <p className="mt-5 text-center text-xs text-slate-400">
              Protected by industry-standard encryption.{" "}
              <span className="font-semibold text-slate-500">Your data is safe.</span>
            </p>
          </div>
        </section>
      </section>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </main>
  );
};

export default Login;
