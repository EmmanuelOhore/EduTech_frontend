import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const features = [
  {
    icon: GraduationCap,
    title: "For Teachers",
    body: "Create your profile, add subjects, manage availability, and apply for roles that match your experience.",
  },
  {
    icon: Building2,
    title: "For Schools",
    body: "Post openings, review qualified educators, and manage hiring from one focused workspace.",
  },
  {
    icon: TrendingUp,
    title: "Smart Matching",
    body: "Match teachers to opportunities using subject, location, level, and availability signals.",
  },
];

const teacherSteps = [
  {
    number: "01",
    title: "Sign Up",
    body: "Create your free teacher account with basic information.",
  },
  {
    number: "02",
    title: "Build Profile",
    body: "Add your bio, certificates, subjects, and teaching level.",
  },
  {
    number: "03",
    title: "Apply for Jobs",
    body: "Browse listings and apply based on your preferences.",
  },
];

const schoolSteps = [
  {
    number: "01",
    title: "Register",
    body: "Create a school admin account and institution profile.",
  },
  {
    number: "02",
    title: "Post Jobs",
    body: "List openings with subject, level, location, and hiring details.",
  },
  {
    number: "03",
    title: "Review & Hire",
    body: "Browse applications, review teacher profiles, and hire.",
  },
];

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "Active Teachers",
  },
  {
    icon: Building2,
    value: "200+",
    label: "Schools Registered",
  },
  {
    icon: BriefcaseBusiness,
    value: "1,000+",
    label: "Jobs Posted",
  },
  {
    icon: BarChart3,
    value: "95%",
    label: "Match Rate",
  },
];

const navLinks = [
  {
    icon: LayoutDashboard,
    label: "Home",
    href: "/",
  },
  {
    icon: BriefcaseBusiness,
    label: "Job Listings",
    href: "/jobs",
  },
  {
    icon: BarChart3,
    label: "Dashboard",
    href: "/dashboard",
  },
];

const HomePage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const loggedInNavLinks = isAuthenticated ? navLinks : navLinks.slice(0, 1);
  const dashboardPath =
    user?.role === "INSTITUTION_ADMIN" || user?.role === "SUPER_ADMIN"
      ? "/school/dashboard"
      : "/dashboard";
  const firstInitial = user?.firstName?.trim().charAt(0).toUpperCase() ?? "";
  const lastInitial = user?.lastName?.trim().charAt(0).toUpperCase() ?? "";
  const userInitials = `${firstInitial}${lastInitial}` || "E";

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <header className="sticky top-0 z-20 border-b border-[#dbe4ef] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-6 max-tablet:flex-wrap max-phoneL:px-4">
          <Link to="/" className="flex items-center gap-3 font-bold">
            <span className="grid size-9 place-items-center rounded-lg bg-[#184e77] text-sm font-black text-white">
              E
            </span>
            <span>EduStaff Connect</span>
          </Link>

          <nav className="flex items-center gap-2 rounded-lg border border-[#dbe4ef] bg-[#f8fafc] p-1 max-tablet:order-3 max-tablet:w-full max-tablet:justify-center">
            {loggedInNavLinks.map((item, index) => {
              const Icon = item.icon;
              const href = item.href === "/dashboard" ? dashboardPath : item.href;
              return (
                <Link
                  to={href}
                  key={item.label}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition max-phoneL:px-2 max-phoneL:text-xs ${
                    index === 0
                      ? "bg-[#184e77] text-white"
                      : "text-slate-600 hover:bg-white hover:text-[#184e77]"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-bold text-slate-600 tablet:inline">
                {user.firstName}
              </span>
              <button
                type="button"
                onClick={logout}
                className="grid size-9 place-items-center rounded-lg bg-[#e0f2fe] text-sm font-black text-[#184e77]"
                aria-label="Log out"
              >
                {userInitials}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex min-h-10 items-center rounded-lg bg-[#184e77] px-4 text-sm font-black text-white"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      <section
        id="home"
        className="mx-auto grid w-full max-w-6xl justify-items-center px-6 py-20 text-center max-phoneL:px-4 max-phoneL:py-14"
      >
        <p className="mb-5 rounded-lg border border-[#dbe4ef] bg-white px-4 py-2 text-sm font-bold text-[#184e77]">
          New platform for educators
        </p>
        <h1 className="max-w-3xl text-6xl font-black leading-none tracking-normal text-[#111827] max-tablet:text-5xl max-phoneL:text-4xl">
          Connect teachers with schools that need them.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 max-phoneL:text-base">
          A focused recruitment platform for schools and qualified educators to
          find the right match by subject, location, level, and availability.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/teacher/register"
            className="flex min-h-11 items-center gap-2 rounded-lg bg-[#184e77] px-5 text-sm font-bold text-white shadow-lg shadow-[#184e77]/15"
          >
            I am a Teacher <ArrowRight size={16} />
          </Link>
          <Link
            to="/school/register"
            className="flex min-h-11 items-center gap-2 rounded-lg border border-[#b7c4d2] bg-white px-5 text-sm font-bold text-[#184e77]"
          >
            I am a School <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-8 text-sm text-slate-500">
          <span>
            <strong className="block text-2xl text-[#172033]">500+</strong>
            Teachers
          </span>
          <span>
            <strong className="block text-2xl text-[#172033]">200+</strong>
            Schools
          </span>
          <span>
            <strong className="block text-2xl text-[#172033]">95%</strong>
            Match Rate
          </span>
        </div>
        <div className="mt-9 h-72 w-full max-w-3xl overflow-hidden rounded-lg border border-[#dbe4ef] bg-white shadow-2xl shadow-slate-900/10 max-phoneL:h-56">
          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80"
            alt="School recruitment workspace"
            className="h-full w-full object-cover grayscale-[12%] saturate-75"
          />
        </div>
      </section>

      <section id="jobs" className="mx-auto w-full max-w-6xl px-6 py-20 max-phoneL:px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-4xl font-black text-[#172033] max-phoneL:text-3xl">
            Why Choose Our Platform
          </h2>
          <p className="mt-3 text-slate-600">
            Streamlined recruitment for educators and schools with practical
            matching tools.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-5 max-tablet:grid-cols-1">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-lg border border-[#dbe4ef] bg-white p-7 shadow-xl shadow-slate-900/[0.04]"
              >
                <div className="mb-6 grid size-11 place-items-center rounded-lg bg-[#e0f2fe] text-[#184e77]">
                  <Icon size={24} />
                </div>
                <h3 className="mb-3 text-lg font-black">{feature.title}</h3>
                <p className="mb-5 text-sm leading-6 text-slate-600">
                  {feature.body}
                </p>
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#184e77]"
                >
                  Learn more <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section id="dashboard" className="mx-auto w-full max-w-6xl px-6 py-16 max-phoneL:px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-4xl font-black max-phoneL:text-3xl">How It Works</h2>
          <p className="mt-3 text-slate-600">Simple steps to connect and hire.</p>
        </div>

        <div id="teacher-steps">
          <h3 className="mb-5 text-2xl font-black">For Teachers</h3>
          <div className="grid grid-cols-3 gap-5 max-tablet:grid-cols-1">
            {teacherSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-lg border border-[#dbe4ef] bg-white p-6 shadow-xl shadow-slate-900/[0.04]"
              >
                <span className="mb-5 grid size-9 place-items-center rounded-lg bg-[#184e77] text-sm font-black text-white">
                  {step.number}
                </span>
                <h4 className="mb-2 font-black">{step.title}</h4>
                <p className="text-sm leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div id="school-steps" className="mt-12">
          <h3 className="mb-5 text-2xl font-black">For Schools</h3>
          <div className="grid grid-cols-3 gap-5 max-tablet:grid-cols-1">
            {schoolSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-lg border border-[#dbe4ef] bg-white p-6 shadow-xl shadow-slate-900/[0.04]"
              >
                <span className="mb-5 grid size-9 place-items-center rounded-lg bg-[#287271] text-sm font-black text-white">
                  {step.number}
                </span>
                <h4 className="mb-2 font-black">{step.title}</h4>
                <p className="text-sm leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef3f8] py-14">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-4 gap-5 px-6 max-tablet:grid-cols-2 max-phoneL:grid-cols-1 max-phoneL:px-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="rounded-lg border border-[#dbe4ef] bg-white p-7 shadow-xl shadow-slate-900/[0.04]"
              >
                <Icon className="mb-4 text-[#184e77]" size={28} />
                <strong className="block text-4xl font-black text-[#172033]">
                  {stat.value}
                </strong>
                <span className="mt-2 block text-sm font-semibold text-slate-500">
                  {stat.label}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl justify-items-center px-6 py-20 text-center max-phoneL:px-4">
        <CheckCircle2 className="mb-5 text-[#287271]" size={34} />
        <h2 className="text-4xl font-black max-phoneL:text-3xl">
          Ready to get started?
        </h2>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">
          Join teachers and schools connecting through a clearer hiring process.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/teacher/register"
            className="flex min-h-11 items-center gap-2 rounded-lg bg-[#184e77] px-5 text-sm font-bold text-white"
          >
            Sign Up as Teacher <ArrowRight size={16} />
          </Link>
          <Link
            to="/school/register"
            className="flex min-h-11 items-center gap-2 rounded-lg border border-[#b7c4d2] bg-white px-5 text-sm font-bold text-[#184e77]"
          >
            Sign Up as School <ArrowRight size={16} />
          </Link>
        </div>
        <p className="mt-5 text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[#184e77]">
            Sign in as Teacher or School.
          </Link>
        </p>
      </section>

      <footer className="border-t border-[#dbe4ef] bg-[#e8eef5]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] gap-8 px-6 py-9 max-tablet:grid-cols-1 max-phoneL:px-4">
          <div>
            <Link to="/" className="flex items-center gap-3 font-bold">
              <span className="grid size-9 place-items-center rounded-lg bg-[#184e77] text-sm font-black text-white">
                E
              </span>
              <span>EduStaff Connect</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Connecting talented educators with exceptional schools.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-black">Quick Links</h2>
            <div className="grid gap-2 text-sm font-semibold text-slate-600">
              <Link to="/">Home</Link>
              {isAuthenticated && (
                <>
                  <Link to="/jobs">Job Listings</Link>
                  <Link to={dashboardPath}>Dashboard</Link>
                </>
              )}
              {!isAuthenticated && <Link to="/login">Login</Link>}
            </div>
          </div>
          <p className="self-end justify-self-end text-sm text-slate-600 max-tablet:justify-self-start">
            2026 EduStaff Connect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
