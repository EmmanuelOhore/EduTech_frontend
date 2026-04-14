import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useFetchTeacherProfile, useFetchTeacherReferences } from "../services/queries";

/* ─── tiny helpers ─────────────────────────────────────────────── */

const StarRow = ({ rating, max = 5 }: { rating: number; max?: number }) => (
  <span className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        size={12}
        className={
          i < Math.round(rating)
            ? "fill-amber-400 text-amber-400"
            : "fill-transparent text-amber-300/50"
        }
      />
    ))}
  </span>
);

const NinBadge = ({ status }: { status: string | null }) => {
  const s = (status ?? "NOT_SUBMITTED").toUpperCase();
  const map: Record<string, string> = {
    VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    REJECTED: "bg-red-50 text-red-600 ring-red-200",
    NOT_SUBMITTED: "bg-slate-100 text-slate-500 ring-slate-200",
  };
  const cls = map[s] ?? map["NOT_SUBMITTED"];
  const label = s === "NOT_SUBMITTED" ? "Not submitted" : s.charAt(0) + s.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
      {label}
    </span>
  );
};

const AvailabilityDot = ({ available }: { available: boolean }) => (
  <span className="flex items-center gap-1.5">
    <span
      className={`inline-block size-2 rounded-full ${available ? "bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.35)]" : "bg-slate-400"}`}
    />
    <span className="text-sm font-semibold text-[#172033]">
      {available ? "Available" : "Not available"}
    </span>
  </span>
);

/* ─── page ─────────────────────────────────────────────────────── */

const TeacherPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const profileQuery = useFetchTeacherProfile(id);
  const referencesQuery = useFetchTeacherReferences(id);
  const profile = profileQuery.data;
  const references = referencesQuery.data?.references ?? [];
  const averageRating = referencesQuery.data?.averageRating ?? 0;

  /* loading */
  if (profileQuery.isLoading || referencesQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8fb]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="size-8 animate-spin rounded-full border-2 border-[#184e77]/20 border-t-[#184e77]" />
          <span className="text-sm">Loading profile…</span>
        </div>
      </main>
    );
  }

  /* not found */
  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8fb] text-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#172033]">Teacher profile not found</h1>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a6091]"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const initials = `${profile.firstName.charAt(0)}${profile.lastName?.charAt(0) ?? ""}`;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#184e77] via-[#1a6091] to-[#287271]">
        {/* subtle decorative blobs */}
        <span className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/5 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-16 left-1/3 size-64 rounded-full bg-[#287271]/30 blur-3xl" />

        <div className="relative w-full px-6 py-8 lg:px-10">
          {/* back link */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={14} /> Back
          </Link>

          {/* main hero row */}
          <div className="mt-7 flex flex-wrap items-start justify-between gap-8">

            {/* left – identity */}
            <div className="flex items-start gap-5">
              {/* avatar */}
              <div className="relative shrink-0">
                <div className="grid size-[88px] place-items-center overflow-hidden rounded-2xl bg-white/15 text-3xl font-black text-white ring-2 ring-white/25 shadow-lg">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                {profile.isAvailable && (
                  <span
                    title="Available"
                    className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white/30 shadow"
                  >
                    <span className="size-2 rounded-full bg-white" />
                  </span>
                )}
              </div>

              {/* name + badges */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#7dd3fc] ring-1 ring-white/20">
                    <BookOpen size={10} /> Public Teacher Profile
                  </span>
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-semibold text-emerald-100 ring-1 ring-emerald-400/30">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>

                <h1 className="mt-2.5 text-[28px] font-black leading-tight text-white">
                  {profile.firstName} {profile.lastName}
                </h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/15">
                    <MapPin size={11} /> {profile.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#287271]/50 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-[#287271]/70">
                    <GraduationCap size={11} /> {profile.level}
                  </span>
                  {references.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/20">
                      <Star size={11} className="fill-amber-300 text-amber-300" />
                      {averageRating.toFixed(1)} rating
                    </span>
                  )}
                </div>

                <p className="mt-3 flex items-center gap-2 text-[13px] text-white/60">
                  <Mail size={12} /> {profile.email}
                </p>
              </div>
            </div>

            {/* right – reference summary card */}
            <div className="min-w-[200px] rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/50">
                Reference Summary
              </p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-[42px] font-black leading-none text-white">
                  {references.length > 0 ? averageRating.toFixed(1) : "—"}
                </p>
                {references.length > 0 && (
                  <div className="mb-1">
                    <StarRow rating={averageRating} />
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-white/60">Average school rating</p>
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-xs text-white/50">
                  <span className="text-sm font-bold text-white">{references.length}</span>{" "}
                  reference{references.length !== 1 ? "s" : ""} published
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* wave divider */}
        <svg
          viewBox="0 0 1440 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
          preserveAspectRatio="none"
          style={{ height: 28 }}
        >
          <path d="M0 28H1440V10C1200 26 900 2 600 14C300 26 120 4 0 10V28Z" fill="#f6f8fb" />
        </svg>
      </section>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="w-full px-6 py-8 lg:px-10">

        {/* About + Profile Details */}
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">

          {/* About */}
          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#172033]">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#eef6fb]">
                <BookOpen size={13} className="text-[#184e77]" />
              </span>
              About
            </h2>
            <p className="mt-4 text-sm leading-[1.85] text-slate-500">
              {profile.bio || (
                <span className="italic text-slate-400">
                  This teacher has not added a public bio yet.
                </span>
              )}
            </p>
          </section>

          {/* Profile Details */}
          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#172033]">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#eef6fb]">
                <ShieldCheck size={13} className="text-[#184e77]" />
              </span>
              Profile Details
            </h2>

            <div className="mt-4 divide-y divide-[#f1f5f9]">
              {/* Location */}
              <div className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <MapPin size={13} className="text-[#287271]" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Location</p>
                  <p className="text-sm font-semibold text-[#172033]">{profile.location}</p>
                </div>
              </div>
              {/* Level */}
              <div className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <GraduationCap size={13} className="text-[#287271]" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Level</p>
                  <p className="text-sm font-semibold text-[#172033]">{profile.level}</p>
                </div>
              </div>
              {/* Availability */}
              <div className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <Clock size={13} className="text-[#287271]" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Availability</p>
                  <AvailabilityDot available={profile.isAvailable} />
                </div>
              </div>
              {/* Joined */}
              <div className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <Calendar size={13} className="text-[#287271]" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Joined</p>
                  <p className="text-sm font-semibold text-[#172033]">{profile.createdAt}</p>
                </div>
              </div>
              {/* NIN Status */}
              <div className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <ShieldCheck size={13} className="text-[#287271]" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">NIN Status</p>
                  <NinBadge status={profile.ninStatus ?? null} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#172033]">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#eef6fb]">
                <BookOpen size={13} className="text-[#184e77]" />
              </span>
              Professional Documents
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[#eef2f7] bg-[#f8fafc] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#172033]">Teaching Certificate</p>
                  <p className="text-[11px] text-slate-400">Shared by the teacher on their public profile</p>
                </div>
                {profile.certificateUrl ? (
                  <a href={profile.certificateUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#184e77] hover:underline">
                    View Document
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Not added yet</span>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#172033]">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#eef6fb]">
                <GraduationCap size={13} className="text-[#184e77]" />
              </span>
              Teaching Records
            </h2>
            {profile.teachingRecords.length === 0 ? (
              <div className="mt-4 rounded-xl bg-[#f8fafc] px-4 py-10 text-center text-sm text-slate-400">
                No teaching records added yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {profile.teachingRecords.map((record, index) => (
                  <article key={`${record.schoolName}-${index}`} className="rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#172033]">{record.roleTitle}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{record.schoolName}</p>
                      </div>
                      <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                        {record.startYear} - {record.endYear ?? "Present"}
                      </span>
                    </div>
                    {record.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-500">{record.description}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Ratings & References */}
        <section className="mt-5 rounded-2xl border border-[#dbe4ef] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-[#172033]">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#eef6fb]">
                  <Star size={13} className="text-[#184e77]" />
                </span>
                Ratings &amp; References
              </h2>
              <p className="mt-1 pl-9 text-xs text-slate-400">
                References from schools after accepted placements.
              </p>
            </div>
            {references.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-2.5 ring-1 ring-amber-100">
                <StarRow rating={averageRating} />
                <span className="text-sm font-bold text-amber-700">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-600">
                  ({references.length} review{references.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>

          {references.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-[#f8fafc] py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef6fb]">
                <Briefcase size={20} className="text-[#184e77]/50" />
              </span>
              <p className="text-sm text-slate-400">No school references yet.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {references.map((reference) => (
                <article
                  key={reference.id}
                  className="group rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-5 transition hover:border-[#184e77]/20 hover:shadow-sm"
                >
                  {/* card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#184e77]/10 text-sm font-black text-[#184e77]">
                        {reference.givenBy?.charAt(0) ?? "S"}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#172033]">{reference.givenBy}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {reference.relatedJob}
                          {reference.jobLocation ? ` · ${reference.jobLocation}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-100">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {reference.rating}.0
                      </span>
                      <StarRow rating={reference.rating} />
                    </div>
                  </div>

                  {/* reference text */}
                  <p className="mt-3.5 border-t border-[#e8edf3] pt-3.5 text-sm leading-[1.8] text-slate-500">
                    {reference.referenceText}
                  </p>

                  {/* date */}
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar size={10} />
                    {reference.date}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
};

export default TeacherPublicProfilePage;
