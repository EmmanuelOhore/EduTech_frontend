import { useQuery } from "@tanstack/react-query";
import * as api from "./base";

export const useFetchJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: api.fetchJobs,
  });
};

// Proximity job feed — only runs when a valid point is supplied.
export const useFetchNearbyJobs = (
  point: { lat: number; lng: number } | null,
  opts: { maxKm?: number } = {},
) => {
  return useQuery({
    queryKey: ["jobs", "near", point?.lat, point?.lng, opts.maxKm ?? null],
    queryFn: () =>
      api.fetchNearbyJobs({ lat: point!.lat, lng: point!.lng, maxKm: opts.maxKm }),
    enabled: !!point,
  });
};

// School-side: teachers ranked by proximity to a school.
export const useFetchNearbyTeachers = (
  institutionId?: string,
  params: { maxKm?: number; teachingLevel?: string; kycStatus?: string } = {},
) => {
  return useQuery({
    queryKey: ["nearby-teachers", institutionId, params],
    queryFn: () => api.fetchNearbyTeachers(institutionId!, params),
    enabled: !!institutionId,
  });
};

export const useFetchJobTemplates = (enabled = true) => {
  return useQuery({
    queryKey: ["job-templates"],
    queryFn: api.fetchJobTemplates,
    enabled,
  });
};

// Notifications — polled for near-real-time badge/list updates.
export const useFetchNotifications = (enabled = true) => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.fetchNotifications(30),
    enabled,
    refetchInterval: 20000, // poll every 20s
    refetchOnWindowFocus: true,
  });
};

// Replacements
export const useFetchReplacements = (status?: string, enabled = true) => {
  return useQuery({
    queryKey: ["replacements", status ?? "all"],
    queryFn: () => api.fetchReplacements(status),
    enabled,
  });
};

export const useFetchReplacementCandidates = (id?: string) => {
  return useQuery({
    queryKey: ["replacement-candidates", id],
    queryFn: () => api.fetchReplacementCandidates(id!),
    enabled: Boolean(id),
  });
};

export const useFetchJob = (id?: string) => {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => api.fetchJob(id!),
    enabled: Boolean(id),
  });
};

export const useFetchInstitutionJobs = (institutionId?: string) => {
  return useQuery({
    queryKey: ["jobs", "institution", institutionId],
    queryFn: () => api.fetchInstitutionJobs(institutionId!),
    enabled: Boolean(institutionId),
  });
};

export const useFetchInstitution = (institutionId?: string) => {
  return useQuery({
    queryKey: ["institution", institutionId],
    queryFn: () => api.fetchInstitution(institutionId!),
    enabled: Boolean(institutionId),
  });
};

export const useFetchAllInstitutions = () => {
  return useQuery({
    queryKey: ["institutions"],
    queryFn: api.fetchAllInstitutions,
  });
};

export const useFetchAllTeachers = () => {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: api.fetchAllTeachers,
  });
};

export const useFetchAllApplications = () => {
  return useQuery({
    queryKey: ["applications", "all"],
    queryFn: api.fetchAllApplications,
  });
};

export const useFetchSubjects = () => {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: api.fetchSubjects,
  });
};

export const useFetchTestDataSummary = () => {
  return useQuery({
    queryKey: ["admin-tools", "test-data"],
    queryFn: api.fetchTestDataSummary,
  });
};

export const useFetchInstitutionApplications = (institutionId?: string) => {
  return useQuery({
    queryKey: ["applications", "institution", institutionId],
    queryFn: () => api.fetchInstitutionApplications(institutionId!),
    enabled: Boolean(institutionId),
    staleTime: 0,          // always treat as stale so it refetches on every mount
    refetchOnMount: "always", // ensure fresh NIN/certificate data on every page visit
    refetchOnWindowFocus: true,
  });
};

export const useFetchJobApplications = (jobId?: string) => {
  return useQuery({
    queryKey: ["applications", "job", jobId],
    queryFn: () => api.fetchJobApplications(jobId!),
    enabled: Boolean(jobId),
  });
};

export const useFetchMyApplications = (enabled = true) => {
  return useQuery({
    queryKey: ["applications", "my"],
    queryFn: api.fetchMyApplications,
    enabled,
  });
};

export const useFetchMyTeacherProfile = (enabled = true) => {
  return useQuery({
    queryKey: ["teacher-profile", "my"],
    queryFn: api.fetchMyTeacherProfile,
    enabled,
  });
};

export const useFetchMyProfileViews = (enabled = true) => {
  return useQuery({
    queryKey: ["profile-views", "my"],
    queryFn: api.fetchMyProfileViews,
    enabled,
  });
};

export const useFetchTeacherProfile = (teacherId?: string) => {
  return useQuery({
    queryKey: ["teacher-profile", teacherId],
    queryFn: () => api.fetchTeacherProfile(teacherId!),
    enabled: Boolean(teacherId),
  });
};

export const useFetchPublicStaffProfile = (slug?: string) => {
  return useQuery({
    queryKey: ["staff-profile", "public", slug],
    queryFn: () => api.fetchPublicStaffProfile(slug!),
    enabled: Boolean(slug),
  });
};

export const useFetchTeacherReferences = (teacherId?: string) => {
  return useQuery({
    queryKey: ["teacher-references", "teacher", teacherId],
    queryFn: () => api.fetchTeacherReferences(teacherId!),
    enabled: Boolean(teacherId),
  });
};

export const useFetchMyTeacherReferences = (enabled = true) => {
  return useQuery({
    queryKey: ["teacher-references", "my"],
    queryFn: api.fetchMyTeacherReferences,
    enabled,
  });
};

export const useFetchInstitutionTeacherReferences = (institutionId?: string) => {
  return useQuery({
    queryKey: ["teacher-references", "institution", institutionId],
    queryFn: () => api.fetchInstitutionTeacherReferences(institutionId!),
    enabled: Boolean(institutionId),
  });
};

export const useFetchRotationalJobMeta = (jobId?: string) => {
  return useQuery({
    queryKey: ["rotational-meta", jobId],
    queryFn: () => api.fetchRotationalJobMeta(jobId!),
    enabled: Boolean(jobId),
  });
};

export const useFetchMyAvailability = (enabled = true) => {
  return useQuery({
    queryKey: ["availability", "my"],
    queryFn: api.fetchMyAvailability,
    enabled,
  });
};

export const useFetchTeacherAvailability = (teacherId?: string) => {
  return useQuery({
    queryKey: ["availability", "teacher", teacherId],
    queryFn: () => api.fetchTeacherAvailability(teacherId!),
    enabled: Boolean(teacherId),
  });
};

export const useFetchSessionsByJob = (jobId?: string) => {
  return useQuery({
    queryKey: ["sessions", "job", jobId],
    queryFn: () => api.fetchSessionsByJob(jobId!),
    enabled: Boolean(jobId),
  });
};

export const useFetchRosterByJob = (jobId?: string) => {
  return useQuery({
    queryKey: ["roster", jobId],
    queryFn: () => api.fetchRosterByJob(jobId!),
    enabled: Boolean(jobId),
  });
};

export const useFetchMyAssignments = (enabled = true) => {
  return useQuery({
    queryKey: ["assignments", "my"],
    queryFn: api.fetchMyAssignments,
    enabled,
  });
};

export const useFetchAssignmentsByJob = (jobId?: string) => {
  return useQuery({
    queryKey: ["assignments", "job", jobId],
    queryFn: () => api.fetchAssignmentsByJob(jobId!),
    enabled: Boolean(jobId),
  });
};

// ── Guarantors / KYC ──────────────────────────────────────────────
export const useFetchMyGuarantors = (enabled = true) => {
  return useQuery({
    queryKey: ["guarantors", "my"],
    queryFn: api.fetchMyGuarantors,
    enabled,
  });
};

export const useFetchGuarantorByToken = (token?: string) => {
  return useQuery({
    queryKey: ["guarantor", "portal", token],
    queryFn: () => api.fetchGuarantorByToken(token!),
    enabled: Boolean(token),
  });
};

export const useFetchAdminGuarantors = (
  status?: import("../types/TypeChecks").GuarantorStatus,
) => {
  return useQuery({
    queryKey: ["guarantors", "admin", status ?? "all"],
    queryFn: () => api.fetchAdminGuarantors(status),
  });
};
