import type { DistanceBandKey, Job } from "../types/TypeChecks";

/**
 * Distance band definitions — must mirror the backend (geo.service.ts) so the
 * grouped UI lines up with what the API returns.
 */
export const DISTANCE_BANDS: {
  key: DistanceBandKey;
  label: string;
  blurb: string;
  icon: string;
}[] = [
  { key: "0-5", label: "Within 5 km", blurb: "Walkable / short hop", icon: "walk" },
  { key: "5-15", label: "5–15 km away", blurb: "Short commute", icon: "bus" },
  { key: "15-30", label: "15–30 km away", blurb: "Across town", icon: "car" },
  { key: "30+", label: "30+ km away", blurb: "Further afield", icon: "road" },
];

/** Round-and-label a distance for teacher-facing display ("3.2 km", "12 km"). */
export function formatKm(km?: number): string {
  if (km === undefined || km === null || Number.isNaN(km)) return "";
  if (km < 10) return `${Math.round(km * 10) / 10} km`;
  return `${Math.round(km)} km`;
}

export interface JobBandGroup {
  key: DistanceBandKey;
  label: string;
  blurb: string;
  icon: string;
  jobs: Job[];
}

/** Group proximity jobs into distance bands, preserving nearest-first order. */
export function groupJobsByBand(jobs: Job[]): JobBandGroup[] {
  return DISTANCE_BANDS.map((b) => ({
    key: b.key,
    label: b.label,
    blurb: b.blurb,
    icon: b.icon,
    jobs: jobs.filter((j) => j.band === b.key),
  })).filter((g) => g.jobs.length > 0);
}
