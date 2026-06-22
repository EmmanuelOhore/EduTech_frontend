import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchAllApplications } from "../services/queries";

const AdminApplicationsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const appsQuery = useFetchAllApplications();
  const applications = appsQuery.data ?? [];

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

  return (
    <SuperAdminLayout>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Recruitment</p>
        <h1 className="mt-1 text-3xl font-black">All Applications</h1>
        <p className="mt-1 text-sm text-slate-500">Read-only platform view of school hiring activity.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-[#dbe4ef] bg-white p-3">
        <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-[#dbe4ef] bg-[#f8fafc] px-3">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search applicant, school, job" className="h-11 w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-lg border border-[#dbe4ef] bg-white px-3 text-sm font-semibold">
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#dbe4ef] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f7]">
              {filtered.map((app) => (
                <tr key={app.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-black">{app.teacherName}</p>
                    <p className="text-xs text-slate-500">{app.teacherEmail}</p>
                  </td>
                  <td className="px-4 py-4">{app.institutionName ?? "Unknown school"}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold">{app.jobTitle}</p>
                    <p className="text-xs text-slate-500">{app.subject ?? "General"} · {app.jobLocation}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${app.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : app.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">{app.date}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {app.publicSlug && <a href={`/staff/${app.publicSlug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#dbe4ef] px-2.5 py-1 text-xs font-bold">Profile <ExternalLink size={11} className="ml-1 inline" /></a>}
                      {app.certificateUrl && <a href={app.certificateUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[#dbe4ef] px-2.5 py-1 text-xs font-bold">Certificate</a>}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-semibold text-slate-500">No applications found.</td>
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
