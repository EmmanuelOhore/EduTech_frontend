import { useQuery } from "@tanstack/react-query";
import * as api from "./base";

export const useFetchJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: api.fetchJobs,
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

export const useFetchTeacherProfile = (teacherId?: string) => {
  return useQuery({
    queryKey: ["teacher-profile", teacherId],
    queryFn: () => api.fetchTeacherProfile(teacherId!),
    enabled: Boolean(teacherId),
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
