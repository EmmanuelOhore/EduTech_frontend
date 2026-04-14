import {
  ArrowLeft,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Search,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useFetchMyApplications } from "../services/queries";

const jobTypeLabel = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

const AcceptedApplicationsPage = () => {
  const { isAuthenticated } = useAuth();
  const applicationsQuery = useFetchMyApplications(isAuthenticated);
  const acceptedApplications = (applicationsQuery.data ?? []).filter((app) => app.status === "ACCEPTED");

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="dashboard" />

      <section className="border-b border-[#dbe4ef] bg-white">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div>
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#184e77] transition hover:underline">
              <ArrowLeft size={15} /> Back to dashboard
            </Link>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Accepted Applications</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#172033]">Jobs That Accepted You</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              These are the school applications that have been accepted. Use this page to track the school, role, subject, location, and when the decision came in.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700">
            <p className="text-3xl font-semibold">{acceptedApplications.length}</p>
            <p className="text-xs">accepted role{acceptedApplications.length === 1 ? "" : "s"}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
        {applicationsQuery.isLoading ? (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-16 text-center text-sm text-slate-400">
            Loading accepted applications...
          </div>
        ) : acceptedApplications.length === 0 ? (
          <div className="rounded-2xl border border-[#dbe4ef] bg-white px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
              <Clock size={20} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[#172033]">No accepted applications yet</h2>
            <p className="mt-2 text-sm text-slate-500">When a school accepts one of your applications, it will appear here.</p>
            <Link to="/jobs" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a6091]">
              Browse Jobs <Search size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {acceptedApplications.map((app) => (
              <article key={app.id} className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={13} /> Accepted
                    </span>
                    <h2 className="mt-3 truncate text-lg font-semibold text-[#172033]">{app.jobTitle}</h2>
                    <p className="mt-1 truncate text-sm text-slate-500">{app.institutionName ?? "School"}</p>
                  </div>
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e0f2fe] text-sm font-semibold text-[#184e77]">
                    {(app.institutionName ?? "S").charAt(0)}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: GraduationCap, label: "Subject", value: app.subject ?? "Not set" },
                    { icon: MapPin, label: "Location", value: app.jobLocation },
                    { icon: BriefcaseBusiness, label: "Job Type", value: jobTypeLabel[app.jobType] },
                    { icon: Calendar, label: "Applied On", value: app.date },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[#f8fafc] p-3">
                        <span className="grid size-8 place-items-center rounded-lg bg-white text-[#184e77]">
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-400">{item.label}</p>
                          <p className="truncate text-sm font-semibold text-[#172033]">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4">
                  <p className="text-xs text-slate-500">The school has accepted this application.</p>
                  <Link to={`/jobs/${app.jobId}`} className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ef] px-4 py-2 text-xs font-semibold text-[#184e77] transition hover:bg-[#e0f2fe]">
                    View Job <Send size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AcceptedApplicationsPage;
