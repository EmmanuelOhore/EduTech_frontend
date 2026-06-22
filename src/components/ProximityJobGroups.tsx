import {
  Bookmark,
  BookmarkCheck,
  Bus,
  Car,
  CheckCircle2,
  ChevronDown,
  Footprints,
  MapPin,
  Milestone,
  Navigation,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { formatKm, groupJobsByBand } from "../lib/geo";
import type { DistanceBandKey, Job } from "../types/TypeChecks";

const BAND_ICON: Record<string, typeof Footprints> = {
  walk: Footprints,
  bus: Bus,
  car: Car,
  road: Milestone,
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  ROTATIONAL: "Rotational",
};

/** Restrained per-band tint — used only on the icon chip + a small dot. */
const BAND_TINT: Record<DistanceBandKey, { soft: string; fg: string; dot: string }> = {
  "0-5": { soft: "bg-emerald-50", fg: "text-emerald-600", dot: "bg-emerald-500" },
  "5-15": { soft: "bg-teal-50", fg: "text-teal-600", dot: "bg-teal-500" },
  "15-30": { soft: "bg-amber-50", fg: "text-amber-600", dot: "bg-amber-500" },
  "30+": { soft: "bg-slate-100", fg: "text-slate-500", dot: "bg-slate-400" },
};

type Props = {
  jobs: Job[];
  locationLabel: string;
  accuracyNote?: string;
  appliedJobIds: Set<string>;
  isSavedJob: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onApply: (job: Job) => void;
  onRefineLocation?: () => void;
};

const Avatar = ({ name, img, className = "" }: { name?: string; img?: string; className?: string }) =>
  img ? (
    <img
      src={img}
      alt={name ?? "School"}
      className={`object-cover ${className}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  ) : (
    <span className={`grid place-items-center bg-[#eef5fb] font-semibold text-[#184e77] ${className}`}>
      {name?.[0] ?? "S"}
    </span>
  );

const ProximityJobGroups = ({
  jobs,
  locationLabel,
  accuracyNote,
  appliedJobIds,
  isSavedJob,
  onToggleSave,
  onApply,
  onRefineLocation,
}: Props) => {
  const groups = useMemo(() => groupJobsByBand(jobs), [jobs]);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    groups.length ? { [groups[0].key]: true } : {},
  );

  const nearestKm = useMemo(
    () =>
      jobs.reduce<number | null>(
        (min, j) =>
          j.distanceKm == null ? min : min == null ? j.distanceKm : Math.min(min, j.distanceKm),
        null,
      ),
    [jobs],
  );

  const toggle = (key: DistanceBandKey) =>
    setOpen((cur) => ({ ...cur, [key]: !cur[key] }));

  /* ── Summary header — clean white card ─────────────────────── */
  const stats = [
    { label: "Nearest", value: nearestKm != null ? formatKm(nearestKm) : "—" },
    { label: "Roles", value: String(jobs.length) },
    { label: "Areas", value: String(groups.length) },
  ];

  const header = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border border-[#e4ebf3] bg-white px-5 py-4 shadow-sm shadow-slate-900/[0.03]">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#184e77] text-white">
        <Navigation size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[#172033]">Jobs near you</p>
        <p className="truncate text-xs text-slate-500">
          Sorted by distance from {locationLabel}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-5">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-5">
            {i > 0 && <span className="h-8 w-px bg-slate-200" aria-hidden />}
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {s.label}
              </p>
              <p className="text-sm font-bold text-[#172033]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex w-full items-center justify-between gap-2 border-t border-[#f1f5f9] pt-3 sm:w-auto sm:border-0 sm:pt-0">
        {accuracyNote && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {accuracyNote}
          </span>
        )}
        {onRefineLocation && (
          <button
            type="button"
            onClick={onRefineLocation}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#184e77] transition hover:text-[#1a6091]"
          >
            <Navigation size={13} />
            Use exact location
          </button>
        )}
      </div>
    </div>
  );

  if (jobs.length === 0) {
    return (
      <div className="grid gap-3">
        {header}
        <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-white py-16 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#f0f7ff]">
            <Navigation size={22} className="text-[#184e77]/40" />
          </div>
          <h3 className="text-base font-semibold text-[#172033]">No roles near you yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Nothing within range of {locationLabel}. Try widening the distance, or
            check back as new schools post.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {header}

      {groups.map((group) => {
        const Icon = BAND_ICON[group.icon] ?? MapPin;
        const tint = BAND_TINT[group.key];
        const isOpen = !!open[group.key];
        const groupNearest = group.jobs.reduce<number | null>(
          (m, j) =>
            j.distanceKm == null ? m : m == null ? j.distanceKm : Math.min(m, j.distanceKm),
          null,
        );
        const previews = group.jobs.slice(0, 3);
        const extra = group.jobs.length - previews.length;

        return (
          <section
            key={group.key}
            className="overflow-hidden rounded-2xl border border-[#e4ebf3] bg-white shadow-sm shadow-slate-900/[0.03]"
          >
            <button
              type="button"
              onClick={() => toggle(group.key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-[#fafbfc]"
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tint.soft} ${tint.fg}`}>
                <Icon size={18} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${tint.dot}`} aria-hidden />
                  <span className="text-sm font-semibold text-[#172033]">{group.label}</span>
                  <span className="text-xs text-slate-400">
                    · {group.jobs.length} {group.jobs.length === 1 ? "role" : "roles"}
                  </span>
                </div>
                <p className="mt-0.5 pl-3.5 text-xs text-slate-400">{group.blurb}</p>
              </div>

              {/* Collapsed preview: stacked avatars + nearest */}
              {!isOpen && (
                <div className="hidden items-center gap-3 sm:flex">
                  <div className="flex -space-x-2">
                    {previews.map((j) => (
                      <span
                        key={j._id}
                        className="size-7 overflow-hidden rounded-full ring-2 ring-white"
                      >
                        <Avatar
                          name={j.institutionName}
                          img={j.institutionImage}
                          className="size-full text-[10px]"
                        />
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="grid size-7 place-items-center rounded-full bg-[#f1f5f9] text-[10px] font-bold text-slate-500 ring-2 ring-white">
                        +{extra}
                      </span>
                    )}
                  </div>
                  {groupNearest != null && (
                    <span className="text-xs font-medium text-slate-400">
                      from {formatKm(groupNearest)}
                    </span>
                  )}
                </div>
              )}

              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-300 transition-transform duration-200 ${
                  isOpen ? "" : "-rotate-90"
                }`}
              />
            </button>

            {isOpen && (
              <ul className="border-t border-[#f1f5f9]">
                {group.jobs.map((job, idx) => {
                  const applied = appliedJobIds.has(job._id);
                  const saved = isSavedJob(job._id);
                  return (
                    <li
                      key={job._id}
                      className={`flex items-center gap-3.5 px-4 py-3 transition hover:bg-[#fafbfc] ${
                        idx > 0 ? "border-t border-[#f4f7fa]" : ""
                      }`}
                    >
                      <span className="size-11 shrink-0 overflow-hidden rounded-xl border border-[#e4ebf3]">
                        <Avatar
                          name={job.institutionName}
                          img={job.institutionImage}
                          className="size-full text-sm"
                        />
                      </span>

                      <div className="min-w-0 flex-1">
                        <RouterLink
                          to={`/jobs/${job._id}`}
                          className="block truncate text-sm font-semibold text-[#172033] transition hover:text-[#184e77]"
                        >
                          {job.title}
                        </RouterLink>
                        <p className="truncate text-xs text-slate-500">{job.institutionName}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {job.subject && (
                            <span className="rounded-md bg-[#eef5fb] px-2 py-0.5 text-[10px] font-medium text-[#184e77]">
                              {job.subject}
                            </span>
                          )}
                          {job.employmentType && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {TYPE_LABELS[job.employmentType]}
                            </span>
                          )}
                          {job.applicants !== undefined && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <Users size={11} />
                              {job.applicants}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: distance + salary */}
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#eef5fb] px-2.5 py-1 text-xs font-bold text-[#184e77]">
                          <MapPin size={11} />
                          {formatKm(job.distanceKm)}
                        </span>
                        {job.salaryRange && (
                          <span className="text-[11px] font-medium text-slate-400">
                            {job.salaryRange}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleSave(job._id)}
                        aria-label={saved ? "Unsave job" : "Save job"}
                        className={`grid size-9 shrink-0 place-items-center rounded-lg border transition ${
                          saved
                            ? "border-[#184e77]/30 bg-[#eef5fb] text-[#184e77]"
                            : "border-[#e4ebf3] bg-white text-slate-400 hover:border-[#184e77]/30 hover:text-[#184e77]"
                        }`}
                      >
                        {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onApply(job)}
                        disabled={applied}
                        className={`hidden shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition sm:inline-flex ${
                          applied
                            ? "cursor-default bg-[#287271] text-white"
                            : "bg-[#184e77] text-white hover:bg-[#1a6091]"
                        }`}
                      >
                        {applied ? (
                          <>
                            <CheckCircle2 size={13} />
                            Applied
                          </>
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ProximityJobGroups;
