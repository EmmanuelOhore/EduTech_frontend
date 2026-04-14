import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Send,
  Share2,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useSavedJobs } from "../lib/useSavedJobs";
import { useApplyToJobMutation } from "../services/mutation";
import { useFetchJob, useFetchJobs, useFetchMyApplications } from "../services/queries";

/* ── PER-SUBJECT CONTENT ──────────────────────────────────────── */
const SUBJECT_CONTENT: Record<
  string,
  { requirements: string[]; responsibilities: string[] }
> = {
  Mathematics: {
    requirements: [
      "B.Sc. or B.Ed. in Mathematics or a related field",
      "Valid teaching licence or TRCN registration",
      "Minimum 2 years of classroom teaching experience",
      "Strong grasp of WAEC/NECO/JAMB syllabus requirements",
      "Ability to teach across JSS and SSS levels",
      "Patient, data-driven approach to student assessment",
    ],
    responsibilities: [
      "Deliver structured, engaging lessons aligned to the national curriculum",
      "Set weekly assignments and mark student work with constructive feedback",
      "Prepare students for WAEC, NECO, and scholarship examinations",
      "Maintain detailed records of attendance and academic progress",
      "Communicate regularly with parents and school management",
      "Participate in departmental meetings and professional development sessions",
    ],
  },
  Physics: {
    requirements: [
      "B.Sc. or B.Ed. in Physics or Applied Science",
      "TRCN-certified or eligible for registration",
      "Minimum 2 years of senior secondary teaching experience",
      "Confident managing practical laboratory environments",
      "Familiarity with WAEC and UTME Physics past papers",
      "Strong verbal communication and classroom management skills",
    ],
    responsibilities: [
      "Teach Physics theory and practicals to SS1–SS3 classes",
      "Design and supervise safe laboratory experiments",
      "Prepare comprehensive notes and student study packs",
      "Analyse performance data and adjust teaching strategies accordingly",
      "Collaborate with the Sciences HOD on scheme of work",
      "Provide remedial classes for underperforming students",
    ],
  },
  Chemistry: {
    requirements: [
      "B.Sc. or B.Ed. in Chemistry or Chemical Sciences",
      "Valid TRCN licence preferred",
      "At least 2 years of secondary school teaching experience",
      "Hands-on experience managing a chemistry laboratory",
      "Knowledge of WAEC Chemistry practicals and theory papers",
      "Excellent safety and lab-management awareness",
    ],
    responsibilities: [
      "Deliver Chemistry lessons for JSS3 to SS3 in line with NERDC curriculum",
      "Conduct and supervise practical sessions with proper safety protocols",
      "Mark coursework and provide timely written feedback",
      "Maintain laboratory equipment inventory and stock",
      "Organise inter-house science competitions and STEM events",
      "Support students preparing for WAEC Chemistry practicals",
    ],
  },
  Biology: {
    requirements: [
      "B.Sc. or B.Ed. in Biology, Botany, or Zoology",
      "TRCN-registered or pending registration",
      "3+ years of experience teaching at secondary level",
      "Skilled in preparing and leading biology practical sessions",
      "Excellent record-keeping and lesson-planning abilities",
      "Passion for student development and pastoral care",
    ],
    responsibilities: [
      "Plan and deliver engaging Biology lessons for SS1–SS3",
      "Lead practical dissection and microscopy sessions",
      "Set and mark assessments in line with WAEC mark schemes",
      "Work closely with the Sciences department to align on curriculum delivery",
      "Support the school's science fair and extracurricular STEM activities",
      "Maintain a positive, inclusive classroom environment",
    ],
  },
  "Computer Science": {
    requirements: [
      "B.Sc. in Computer Science, Software Engineering, or ICT",
      "TRCN certification is an added advantage",
      "Proficient in Python, web development fundamentals, and Microsoft Office",
      "Minimum 2 years of classroom or tutorial teaching experience",
      "Comfortable working with students at various skill levels",
      "Strong analytical thinking and problem-solving skills",
    ],
    responsibilities: [
      "Teach Computer Science theory and practical coding to JSS and SSS students",
      "Design and deliver hands-on coding projects and assessments",
      "Maintain the school's computer lab and equipment",
      "Introduce students to real-world applications of computing",
      "Integrate digital tools into the learning experience",
      "Guide students through WAEC/NABTEB ICT examination preparation",
    ],
  },
  "English Language": {
    requirements: [
      "B.A. or B.Ed. in English Language, Literature, or Linguistics",
      "TRCN-registered or eligible",
      "Minimum 2 years of secondary school teaching experience",
      "Excellent written and spoken English communication",
      "Thorough knowledge of WAEC English Language syllabus",
      "Ability to engage diverse learning styles in the classroom",
    ],
    responsibilities: [
      "Teach English Language comprehension, grammar, and essay writing",
      "Deliver oral and written literature components where applicable",
      "Mark assignments and provide detailed improvement feedback",
      "Prepare students for WAEC, NECO, and IELTS examinations",
      "Organise debates, reading clubs, and creative writing sessions",
      "Collaborate with colleagues across subjects to promote literacy",
    ],
  },
  Economics: {
    requirements: [
      "B.Sc. or B.Ed. in Economics or Social Sciences",
      "TRCN certification preferred",
      "2+ years teaching Economics at senior secondary level",
      "Strong understanding of Nigerian and global economic trends",
      "Ability to simplify macroeconomic concepts for teenage learners",
      "Experience with WAEC/NECO Economics marking schemes",
    ],
    responsibilities: [
      "Teach Economics to SS1–SS3 covering macro and microeconomics",
      "Relate economic theory to current Nigerian and world events",
      "Set and mark classwork, homework, and mock examinations",
      "Provide career guidance on economics-related higher education paths",
      "Participate in inter-school economics debates and competitions",
      "Maintain a stimulating and discussion-based classroom environment",
    ],
  },
  French: {
    requirements: [
      "B.A. in French Language or Modern Languages (French major)",
      "Near-native or native French proficiency (C1/C2 level)",
      "TRCN registration or eligibility",
      "Prior experience teaching French at secondary level preferred",
      "Communicative and immersive teaching approach",
      "Knowledge of WAEC French syllabus is a strong advantage",
    ],
    responsibilities: [
      "Deliver French oral and written lessons to JSS and SSS classes",
      "Create an immersive French-speaking environment in the classroom",
      "Prepare students for WAEC French language examinations",
      "Organise French cultural events, films, and language exchanges",
      "Track student progress and communicate feedback clearly",
      "Collaborate with the Languages department head on curriculum planning",
    ],
  },
};

const DEFAULT_CONTENT = {
  requirements: [
    "Relevant B.Sc. or B.Ed. degree in the subject area",
    "TRCN-registered or eligible for registration",
    "Minimum 2 years of secondary school teaching experience",
    "Strong classroom management and communication skills",
    "Up-to-date knowledge of WAEC/NECO examination requirements",
    "Passion for education and student development",
  ],
  responsibilities: [
    "Plan and deliver structured, engaging lessons to assigned classes",
    "Assess student progress and provide constructive feedback",
    "Maintain accurate attendance and academic records",
    "Collaborate with colleagues on curriculum and school activities",
    "Communicate proactively with parents and school management",
    "Participate in continuing professional development sessions",
  ],
};

/* ── SCHOOL STUBS (keyed by institutionName) ──────────────────── */
const SCHOOL_STUBS: Record<string, {
  description: string; students: number; teachers: number; established: string; type: string; website: string; email: string;
}> = {
  "Cedar Heights School":    { description: "A leading secondary school in Lagos dedicated to academic excellence, student wellbeing, and preparing young Nigerians for global opportunities.", students: 1200, teachers: 85, established: "2003", type: "Secondary", website: "www.cedarheights.edu.ng", email: "info@cedarheights.edu.ng" },
  "Brightpath Learning Centre": { description: "Brightpath is a premier tutorial and supplementary learning centre in Abuja, focused on helping secondary students achieve their best WAEC and JAMB results.", students: 340, teachers: 22, established: "2011", type: "Tutorial Centre", website: "www.brightpathng.com", email: "hello@brightpathng.com" },
  "Northfield College":      { description: "Northfield is a prestigious college in Port Harcourt with a strong STEM tradition, consistently producing top WAEC candidates in the Rivers State.", students: 900, teachers: 60, established: "1998", type: "Secondary", website: "www.northfieldcollege.ng", email: "admin@northfieldcollege.ng" },
  "Heritage Primary School": { description: "Heritage is a nurturing primary school in Ibadan committed to building strong academic foundations and character values in children aged 3–12.", students: 450, teachers: 30, established: "2007", type: "Primary", website: "www.heritageprimary.ng", email: "contact@heritageprimary.ng" },
  "FutureTech Academy":      { description: "FutureTech is a modern tech-focused secondary school in Lagos that integrates coding, robotics, and digital literacy into every year group.", students: 520, teachers: 38, established: "2017", type: "Secondary", website: "www.futuretech.academy", email: "info@futuretech.academy" },
  "Greenfield Secondary":    { description: "Greenfield is a respected secondary school in Enugu with over two decades of producing science and arts graduates across all Nigerian universities.", students: 780, teachers: 52, established: "2000", type: "Secondary", website: "www.greenfieldsecondary.ng", email: "school@greenfieldsecondary.ng" },
  "Graceland International School": { description: "Graceland is an international school in Lagos offering both Nigerian and British curriculum, with a world-class science department and pastoral programme.", students: 1500, teachers: 110, established: "1995", type: "International", website: "www.gracelandintl.edu.ng", email: "admissions@gracelandintl.edu.ng" },
  "Alliance Grammar School": { description: "Alliance Grammar is a legacy secondary school in Abuja known for its strong humanities and language programmes, with decades of academic distinction.", students: 850, teachers: 65, established: "1980", type: "Secondary", website: "www.alliancegrammar.edu.ng", email: "contact@alliancegrammar.edu.ng" },
  "Premier Secondary Academy": { description: "Premier Academy in Kano is a fast-growing private secondary school offering quality education with a focus on critical thinking and economic literacy.", students: 600, teachers: 44, established: "2009", type: "Secondary", website: "www.premieracademy.ng", email: "info@premieracademy.ng" },
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  INTERMEDIATE: "bg-amber-50 text-amber-700 border border-amber-200",
  EXPERT: "bg-purple-50 text-purple-700 border border-purple-200",
};

const TYPE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-blue-50 text-blue-700 border border-blue-200",
  PART_TIME: "bg-orange-50 text-orange-700 border border-orange-200",
  ROTATIONAL: "bg-teal-50 text-teal-700 border border-teal-200",
};

/* ── COMPONENT ──────────────────────────────────────────────────── */
const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const jobQuery = useFetchJob(id);
  const jobsQuery = useFetchJobs();
  const myApplicationsQuery = useFetchMyApplications();
  const job = jobQuery.data;
  const [applied, setApplied] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const { toggleSavedJob, isSavedJob } = useSavedJobs();
  const applyToJob = useApplyToJobMutation();
  const hasAlreadyApplied = useMemo(
    () => Boolean(job && (applied || (myApplicationsQuery.data ?? []).some((app) => app.jobId === job._id))),
    [applied, job, myApplicationsQuery.data],
  );

  if (jobQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8fb] text-[#172033]">
        <p className="text-sm font-black text-slate-500">Loading job...</p>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8fb] text-center text-[#172033]">
        <div>
          <h1 className="text-2xl font-black">Job not found</h1>
          <Link to="/jobs" className="mt-4 inline-flex rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-black text-white">
            Back to jobs
          </Link>
        </div>
      </main>
    );
  }

  const fallbackContent =
    SUBJECT_CONTENT[job.subject ?? ""] ?? DEFAULT_CONTENT;
  const requirements =
    job.requirements && job.requirements.length > 0
      ? job.requirements
      : fallbackContent.requirements;
  const responsibilities =
    job.responsibilities && job.responsibilities.length > 0
      ? job.responsibilities
      : fallbackContent.responsibilities;
  const school =
    SCHOOL_STUBS[job.institutionName ?? ""] ?? {
      description: "A verified educational institution hiring through EduStaff Connect.",
      students: 600, teachers: 45, established: "2005", type: "Secondary",
      website: "www.school.edu.ng", email: "info@school.edu.ng",
    };
  const saved = isSavedJob(job._id);

  const handleApply = () => {
    if (hasAlreadyApplied) { toast("You already applied to this role."); return; }
    setCoverLetter(`Dear ${job.institutionName ?? "Hiring Team"},\n\nI am interested in the ${job.title} role. I believe my teaching experience and subject knowledge make me a strong fit for this position.\n\nThank you for considering my application.`);
    setApplyOpen(true);
  };

  const submitApplication = () => {
    applyToJob.mutate(
      { jobId: job._id, coverLetter },
      {
        onSuccess: () => {
          setApplied(true);
          setApplyOpen(false);
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      {applyOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close application form"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setApplyOpen(false)}
          />
          <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20">
            <div className="bg-[#184e77] px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-white/65">Application</p>
                  <h2 className="mt-1 text-xl font-black">{job.title}</h2>
                  <p className="mt-1 text-sm text-white/70">{job.institutionName} · {job.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyOpen(false)}
                  className="grid size-8 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="grid gap-5 p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Subject", value: job.subject ?? "Not set" },
                  { label: "Type", value: TYPE_LABELS[job.employmentType] },
                  { label: "Openings", value: `${job.slots ?? 1} open` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
                    <p className="text-[11px] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-[#172033]">{item.value}</p>
                  </div>
                ))}
              </div>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Cover Letter
                <textarea
                  rows={7}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the school why you are a good fit for this role..."
                  className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-white px-4 py-3 text-sm font-normal text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#dbe4ef] bg-[#f8fafc] px-6 py-4">
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="rounded-xl border border-[#dbe4ef] bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApplication}
                disabled={applyToJob.isPending}
                className="flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#1a6091] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {applyToJob.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <TeacherHeader active="jobs" />

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271]">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 left-0 size-72 rounded-full bg-white/5" />

        <div className="relative mx-auto w-full max-w-screen-xl px-6 py-10">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link to="/" className="transition hover:text-white/80">Home</Link>
            <ChevronRight size={12} />
            <Link to="/jobs" className="transition hover:text-white/80">Job Listings</Link>
            <ChevronRight size={12} />
            <span className="text-white/80">{job.title}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-6">
            {/* Left: title + school */}
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                {job.subject && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-[#7dd3fc] ring-1 ring-white/20">
                    <GraduationCap size={11} />
                    {job.subject}
                  </span>
                )}
                {job.featured && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#287271]/60 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">
                    <Sparkles size={11} />
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black leading-tight text-white md:text-4xl">{job.title}</h1>

              <div className="mt-4 flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-sm">
                  {job.institutionImage ? (
                    <img src={job.institutionImage} alt={job.institutionName} className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-lg font-black text-white">
                      {job.institutionName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-black text-white">{job.institutionName}</p>
                  <p className="flex items-center gap-1 text-sm text-white/60">
                    <MapPin size={12} />
                    {job.location}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${LEVEL_COLORS[job.level]}`}>
                  {job.level.charAt(0) + job.level.slice(1).toLowerCase()}
                </span>
                <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${TYPE_COLORS[job.employmentType]}`}>
                  {TYPE_LABELS[job.employmentType]}
                </span>
                {job.salaryRange && (
                  <span className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/20">
                    {job.salaryRange}
                  </span>
                )}
                {job.applicants !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/15">
                    <Users size={11} />
                    {job.applicants} applicants
                  </span>
                )}
              </div>
            </div>

            {/* Right: posted info */}
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/15">
                <Clock size={12} />
                Posted {job.postedAt}
              </span>
              {job.slots !== undefined && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                  <BriefcaseBusiness size={11} />
                  {job.slots} slot{job.slots > 1 ? "s" : ""} remaining
                </span>
              )}
              <Link
                to="/jobs"
                className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-white/80"
              >
                <ArrowLeft size={12} />
                Back to listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN BODY ───────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-screen-xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* ── LEFT: CONTENT ─────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Job Description */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white p-7 shadow-sm shadow-slate-900/[0.04]">
              <h2 className="mb-4 text-xl font-black text-[#172033]">Job Description</h2>
              <p className="leading-7 text-slate-600">
                {job.description
                  ? job.description
                  : "No description provided for this position."}
              </p>
              {job.description && (
                <p className="mt-4 leading-7 text-slate-600">
                  The successful candidate will join a committed team of educators
                  in a well-resourced environment. You will be expected to deliver
                  quality instruction, maintain professional relationships with
                  colleagues and parents, and contribute positively to the school
                  community.
                </p>
              )}
            </section>

            {/* Requirements */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white p-7 shadow-sm shadow-slate-900/[0.04]">
              <h2 className="mb-5 text-xl font-black text-[#172033]">Requirements</h2>
              <ul className="flex flex-col gap-3">
                {requirements.map((req) => (
                  <li key={req} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#184e77]">
                      <CheckCircle2 size={11} className="text-white" strokeWidth={2.5} />
                    </span>
                    <span className="text-sm leading-6 text-slate-600">{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Responsibilities */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white p-7 shadow-sm shadow-slate-900/[0.04]">
              <h2 className="mb-5 text-xl font-black text-[#172033]">Responsibilities</h2>
              <ul className="flex flex-col gap-3">
                {responsibilities.map((res) => (
                  <li key={res} className="flex items-start gap-3">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#184e77]" />
                    <span className="text-sm leading-6 text-slate-600">{res}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* About the School */}
            <section className="rounded-2xl border border-[#dbe4ef] bg-white p-7 shadow-sm shadow-slate-900/[0.04]">
              <h2 className="mb-5 text-xl font-black text-[#172033]">About the School</h2>
              <div className="flex items-start gap-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-[#f0f7ff]">
                  {job.institutionImage ? (
                    <img src={job.institutionImage} alt={job.institutionName} className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-2xl font-black text-[#184e77]">
                      {job.institutionName?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-[#172033]">{job.institutionName}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-bold text-[#184e77]">
                      {school.type}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      Est. {school.established}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                      <Star size={10} fill="currentColor" />
                      4.5 / 5
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">{school.description}</p>

              {/* Stats grid */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { icon: GraduationCap, label: "Students", value: school.students.toLocaleString(), color: "bg-blue-50 text-blue-600" },
                  { icon: Users, label: "Teachers", value: school.teachers.toString(), color: "bg-teal-50 text-teal-600" },
                  { icon: BriefcaseBusiness, label: "Type", value: school.type, color: "bg-purple-50 text-purple-600" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex items-start gap-3 rounded-xl bg-[#f8fafc] p-4">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${s.color}`}>
                        <Icon size={15} />
                      </span>
                      <div>
                        <p className="text-xs text-slate-400">{s.label}</p>
                        <p className="text-sm font-black text-[#172033]">{s.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact links */}
              <div className="mt-5 flex flex-col gap-2 border-t border-[#f1f5f9] pt-5">
                <a href="#" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#184e77]">
                  <MapPin size={14} className="text-slate-400" />
                  {job.location}, Nigeria
                </a>
                <a href={`https://${school.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#184e77]">
                  <Globe size={14} className="text-slate-400" />
                  {school.website}
                </a>
                <a href={`mailto:${school.email}`} className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#184e77]">
                  <Mail size={14} className="text-slate-400" />
                  {school.email}
                </a>
              </div>
            </section>

          </div>

          {/* ── RIGHT: SIDEBAR ────────────────────────────────── */}
          <aside className="flex flex-col gap-5">

            {/* Apply card */}
            <div className="sticky top-24 flex flex-col gap-4">

              {/* Metadata card */}
              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
                <h3 className="mb-4 text-sm font-black text-[#172033]">Quick Info</h3>
                <div className="flex flex-col gap-4">
                  {[
                    { icon: MapPin, label: "Location", value: job.location },
                    { icon: BriefcaseBusiness, label: "Employment Type", value: TYPE_LABELS[job.employmentType] },
                    { icon: GraduationCap, label: "Experience Level", value: job.level.charAt(0) + job.level.slice(1).toLowerCase() },
                    { icon: Calendar, label: "Start Date", value: "ASAP" },
                    { icon: Clock, label: "Posted", value: job.postedAt ?? "—" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f0f7ff] text-[#184e77]">
                          <Icon size={14} />
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                          <p className="text-sm font-bold text-[#172033]">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                  {job.salaryRange && (
                    <div className="flex items-start gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-600">
                        <Phone size={14} />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Salary Range</p>
                        <p className="text-sm font-bold text-[#287271]">{job.salaryRange}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA card */}
              {!hasAlreadyApplied ? (
                <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
                  <button
                    onClick={handleApply}
                    disabled={applyToJob.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#184e77] py-3.5 text-sm font-black text-white shadow transition hover:bg-[#1a6091] active:scale-[0.98]"
                  >
                    <Send size={15} />
                    {applyToJob.isPending ? "Applying..." : "Apply Now"}
                  </button>
                  <button
                    onClick={() => { toggleSavedJob(job._id); toast(saved ? "Removed from saved jobs" : "Job saved!"); }}
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${saved ? "border-[#184e77]/30 bg-[#e0f2fe] text-[#184e77]" : "border-[#dbe4ef] bg-white text-slate-600 hover:border-[#184e77]/30 hover:bg-[#e0f2fe] hover:text-[#184e77]"}`}
                  >
                    {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    {saved ? "Saved" : "Save Job"}
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); toast("Link copied!"); }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dbe4ef] bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Share2 size={15} />
                    Share Job
                  </button>
                  <p className="mt-4 text-center text-[11px] text-slate-400">
                    {job.applicants ?? 0} others applied · {job.slots ?? 1} position{(job.slots ?? 1) > 1 ? "s" : ""} open
                  </p>
                </div>
              ) : (
                /* ── APPLICATION SUBMITTED STATE ───────────── */
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 text-center shadow-sm shadow-slate-900/[0.04]">
                  <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-base font-black text-[#172033]">Application Submitted!</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Your application has been sent to {job.institutionName}. They will review it soon.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      { icon: Zap, label: "Quick Apply", color: "bg-blue-50 text-blue-600" },
                      { icon: Phone, label: "Direct Contact", color: "bg-teal-50 text-teal-600" },
                      { icon: CheckCircle2, label: "Fast Response", color: "bg-purple-50 text-purple-600" },
                    ].map((b) => {
                      const Icon = b.icon;
                      return (
                        <div key={b.label} className="flex flex-col items-center gap-1.5">
                          <span className={`grid size-9 place-items-center rounded-xl ${b.color}`}>
                            <Icon size={15} />
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">{b.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-400"
                    >
                      <CheckCircle2 size={14} />
                      Already Applied
                    </button>
                    <button
                      onClick={() => { toggleSavedJob(job._id); toast(saved ? "Removed from saved jobs" : "Saved for later!"); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#287271] py-3 text-sm font-bold text-white transition hover:bg-[#1f5f5e]"
                    >
                      {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      {saved ? "Saved" : "Save for Later"}
                    </button>
                  </div>
                </div>
              )}

              {/* More jobs from this school */}
              <div className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
                <p className="mb-3 text-sm font-black text-[#172033]">More from this school</p>
                <div className="flex flex-col gap-2">
                  {(jobsQuery.data ?? [])
                    .filter((j) => j.institutionName === job.institutionName && j._id !== job._id)
                    .slice(0, 2)
                    .map((j) => (
                      <Link
                        key={j._id}
                        to={`/jobs/${j._id}`}
                        className="flex items-center justify-between gap-2 rounded-xl bg-[#f8fafc] px-3 py-3 text-xs font-semibold text-[#172033] transition hover:bg-[#e0f2fe] hover:text-[#184e77]"
                      >
                        <span className="truncate">{j.title}</span>
                        <ChevronRight size={13} className="shrink-0 text-slate-400" />
                      </Link>
                    ))}
                  {(jobsQuery.data ?? []).filter((j) => j.institutionName === job.institutionName && j._id !== job._id).length === 0 && (
                    <p className="text-xs text-slate-400">No other listings from this school.</p>
                  )}
                </div>
                <Link to="/jobs" className="mt-4 flex items-center gap-1 text-xs font-bold text-[#184e77] transition hover:underline">
                  Browse all jobs <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="mt-8 border-t border-[#dbe4ef] bg-white">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[#184e77] text-xs font-black text-white">E</span>
            <span className="text-sm font-black text-[#172033]">EduStaff Connect</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} EduStaff Connect. All rights reserved.</p>
          <div className="flex gap-5 text-xs font-semibold text-slate-500">
            <a href="#" className="transition hover:text-[#184e77]">Privacy</a>
            <a href="#" className="transition hover:text-[#184e77]">Terms</a>
            <a href="#" className="transition hover:text-[#184e77]">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default JobDetail;
