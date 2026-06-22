import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchAllApplications } from "../services/queries";

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  ACCEPTED: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  PENDING: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  REJECTED: { pill: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const AdminApplicationsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const appsQuery = useFetchAllApplications();
  const applications = appsQuery.data ?? [];

  const stats = useMemo(
    () => ({
      total: applications.length,
      accepted: applications.filter((a) => a.status === "ACCEPTED").length,
      pending: applications.filter((a) => a.status === "PENDING").length,
      rejected: applications.filter((a) => a.status === "REJECTED").length,
    }),
    [applications],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesSearch =
        !q ||
        app.teacherName.toLowerCase().includes(q) ||
        app.teacherEmail.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q) ||
        (app.institutionName ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || app.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, status]);

  const statCards = [
    { label: "Total", value: stats.total, icon: Layers, fg: "text-[#184e77]", bg: "bg-[#eef5fb]" },
    { label: "Accepted", value: stats.accepted, icon: CheckCircle2, fg: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending", value: stats.pending, icon: Clock, fg: "text-amber-600", bg: "bg-amber-50" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, fg: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <SuperAdminLayout>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#287271]">
          Recruitment
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#172033]">All Applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Read-only platform view of school hiring activity.
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border border-[#e4ebf3] bg-white px-4 py-3.5 shadow-sm shadow-slate-900/[0.03]"
          >
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${s.bg} ${s.fg}`}>
              <s.icon size={18} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {s.label}
              </p>
              <p className="text-xl font-bold text-[#172033]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-[#e4ebf3] bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
        <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-[#e4ebf3] bg-[#f8fafc] px-3 transition focus-within:border-[#184e77]/40 focus-within:bg-white">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applicant, school, job"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-xl border border-[#e4ebf3] bg-white px-3 text-sm font-medium text-[#172033] outline-none transition focus:border-[#184e77]/40"
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e4ebf3] bg-white shadow-sm shadow-slate-900/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#eef2f7] bg-[#fafbfc] text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Applicant</th>
                <th className="px-5 py-3 font-semibold">School</th>
                <th className="px-5 py-3 font-semibold">Job</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filtered.map((app) => {
                const st = STATUS_STYLE[app.status] ?? STATUS_STYLE.PENDING;
                return (
                  <tr key={app.id} className="transition hover:bg-[#fafbfc]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#184e77] to-[#287271] text-xs font-bold text-white">
                          {initials(app.teacherName)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#172033]">{app.teacherName}</p>
                          <p className="truncate text-xs text-slate-400">{app.teacherEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[#172033]">
                        <Building2 size={14} className="text-slate-400" />
                        {app.institutionName ?? "Unknown school"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#172033]">{app.jobTitle}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                        {app.subject ?? "General"}
                        <span className="text-slate-300">·</span>
                        <MapPin size={11} />
                        {app.jobLocation}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.pill}`}
                      >
                        <span className={`size-1.5 rounded-full ${st.dot}`} />
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{app.date}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {app.publicSlug && (
                          <a
                            href={`/staff/${app.publicSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#e4ebf3] px-2.5 py-1 text-xs font-medium text-[#184e77] transition hover:border-[#184e77]/30 hover:bg-[#eef5fb]"
                          >
                            Profile
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {app.certificateUrl && (
                          <a
                            href={app.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#e4ebf3] px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#184e77]/30 hover:bg-[#eef5fb] hover:text-[#184e77]"
                          >
                            <FileText size={11} />
                            Certificate
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#f0f7ff]">
                      <Search size={20} className="text-[#184e77]/40" />
                    </div>
                    <p className="font-semibold text-[#172033]">No applications found</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search or status filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default AdminApplicationsPage;
