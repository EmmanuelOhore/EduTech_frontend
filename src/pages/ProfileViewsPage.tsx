import {
  ArrowLeft,
  Building2,
  Clock3,
  Eye,
  Globe2,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import { useFetchMyProfileViews } from "../services/queries";
import type { ProfileView } from "../types/TypeChecks";

const roleLabel = (role: string) =>
  role === "INSTITUTION_ADMIN"
    ? "School admin"
    : role === "SUPER_ADMIN"
      ? "Platform admin"
      : role === "PUBLIC_VISITOR"
        ? "Public visitor"
        : role.replace("_", " ").toLowerCase();

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const viewerIcon = (view: ProfileView) => {
  if (view.isAnonymous || view.viewerRole === "PUBLIC_VISITOR") return Globe2;
  if (view.viewerRole === "INSTITUTION_ADMIN") return Building2;
  if (view.viewerRole === "SUPER_ADMIN") return ShieldCheck;
  return UserRound;
};

const ProfileViewsPage = () => {
  const { isAuthenticated } = useAuth();
  const viewsQuery = useFetchMyProfileViews(isAuthenticated);
  const summary = viewsQuery.data;
  const recentViews = summary?.recentViews ?? [];

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <TeacherHeader active="profile-views" />

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link
                to="/dashboard"
                className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#184e77] transition hover:underline"
              >
                <ArrowLeft size={15} />
                Back to dashboard
              </Link>
              <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Profile insights</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[#172033]">Who viewed your profile</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                See which schools, admins, and public visitors are checking your public profile.
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
              <span className="grid size-11 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                <Eye size={19} />
              </span>
              <p className="mt-4 text-3xl font-black">{summary?.count ?? 0}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Total profile views</p>
            </article>
            <article className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
              <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock3 size={19} />
              </span>
              <p className="mt-4 text-3xl font-black">{summary?.viewsToday ?? 0}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Views today</p>
            </article>
            <article className="rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
              <span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Users size={19} />
              </span>
              <p className="mt-4 text-3xl font-black">{summary?.uniqueViewers ?? 0}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Unique viewer groups</p>
            </article>
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm shadow-slate-900/[0.04]">
            <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h2 className="font-black text-[#172033]">Recent viewers</h2>
                <p className="text-xs text-slate-500">Newest profile views are shown first.</p>
              </div>
            </div>

            {viewsQuery.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : recentViews.length ? (
              <div className="divide-y divide-[#eef2f7]">
                {recentViews.map((view, index) => {
                  const Icon = viewerIcon(view);
                  const anonymous = view.isAnonymous || view.viewerRole === "PUBLIC_VISITOR";
                  return (
                    <article key={`${view.viewedAt}-${index}`} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                        anonymous ? "bg-slate-100 text-slate-500" : "bg-[#e0f2fe] text-[#184e77]"
                      }`}>
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-[#172033]">
                          {anonymous ? "Public visitor" : view.viewerName || "Logged-in viewer"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 font-bold capitalize">
                            {roleLabel(view.viewerRole)}
                          </span>
                          {view.viewerEmail && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f8fafc] px-2.5 py-1">
                              <Mail size={11} />
                              {view.viewerEmail}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-bold text-slate-500">
                        {timeAgo(view.viewedAt)}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-16 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f8fafc] text-slate-400">
                  <Eye size={23} />
                </span>
                <p className="mt-4 font-black text-[#172033]">No profile views yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  When schools or visitors open your public profile, they will appear here.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};

export default ProfileViewsPage;
