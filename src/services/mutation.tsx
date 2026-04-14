import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import api, {
  applyToJob,
  changeMyPassword,
  createTeacherReference,
  createJob,
  deleteTeacherReference,
  deleteJob,
  updateJob,
  updateApplicationStatus,
  updateMyInstitution,
  updateMyProfile,
  updateMyTeacherProfile,
  uploadAsset,
  // Rotational feature
  createRotationalJobMeta,
  createSession,
  updateSession,
  deleteSession,
  createAssignment,
  deleteAssignment,
  upsertMyAvailability,
  deleteAvailabilitySlot,
} from "./base";
import type { ApplicationStatus, AuthResponse, ChangePasswordPayload, CreateJobPayload, CreateTeacherReferencePayload, FullInstitution, LoginPayload, SchoolRegisterPayload, TeacherRegisterPayload, UpdateInstitutionPayload, UpdateProfilePayload, UpdateTeacherProfilePayload, UploadedAsset, UploadCategory } from "../types/TypeChecks";
import { getStoredAuth, setStoredAuth } from "../lib/authStorage";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginPayload) => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setStoredAuth(data);
      toast.success("Login successful");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Login failed");
    },
  });
};

export const useTeacherRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TeacherRegisterPayload) => {
      const response = await api.post("/auth/register/teacher", data);
      return response.data;
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setStoredAuth(data);
      toast.success("Teacher account created");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Registration failed");
    },
  });
};

export const useSchoolRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SchoolRegisterPayload) => {
      const response = await api.post("/auth/register/institution", data);
      return response.data;
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setStoredAuth(data);
      toast.success("School admin account created");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Registration failed");
    },
  });
};

export const useCreateJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJobPayload) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job posted");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Job creation failed");
    },
  });
};

export const useDeleteJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not delete job");
    },
  });
};

export const useUpdateJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateJobPayload> }) =>
      updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job updated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not update job");
    },
  });
};

export const useApplyToJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, coverLetter }: { jobId: string; coverLetter?: string }) =>
      applyToJob(jobId, coverLetter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Application submitted");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Application failed");
    },
  });
};

export const useUpdateApplicationStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application updated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not update application");
    },
  });
};

export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: async (data: UpdateProfilePayload) => {
      const result = await updateMyProfile(data);
      // Patch the stored auth so the UI reflects the change immediately
      const storedAuth = getStoredAuth();
      if (storedAuth) {
        setStoredAuth({ ...storedAuth, user: { ...storedAuth.user, ...data } });
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Profile update failed");
    },
  });
};

export const useUpdateTeacherProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateTeacherProfilePayload) => {
      const result = await updateMyTeacherProfile(data);
      // Keep stored auth in sync for user-level fields
      const { firstName, lastName, profileImage } = data;
      if (firstName !== undefined || lastName !== undefined || profileImage !== undefined) {
        const storedAuth = getStoredAuth();
        if (storedAuth) {
          setStoredAuth({ ...storedAuth, user: { ...storedAuth.user, firstName: firstName ?? storedAuth.user.firstName, lastName: lastName ?? storedAuth.user.lastName, profileImage: profileImage ?? storedAuth.user.profileImage } });
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Profile update failed");
    },
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordPayload) => changeMyPassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Password change failed");
    },
  });
};

export const useUpdateInstitutionMutation = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInstitutionPayload }): Promise<FullInstitution> => {
      const institution = await updateMyInstitution(id, data);
      const storedAuth = getStoredAuth();
      if (storedAuth?.institution) {
        setStoredAuth({
          ...storedAuth,
          institution: {
            ...storedAuth.institution,
            ...institution,
            id: institution._id,
          },
        });
      }
      return institution;
    },
    onSuccess: () => {
      toast.success("School info updated successfully");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "School update failed");
    },
  });
};

export const useUploadAssetMutation = () => {
  return useMutation({
    mutationFn: async ({ file, category }: { file: File; category: UploadCategory }): Promise<UploadedAsset> =>
      uploadAsset(file, category),
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Upload failed");
    },
  });
};

export const useCreateTeacherReferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTeacherReferencePayload) => createTeacherReference(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-references"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("Reference added");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not add reference");
    },
  });
};

export const useDeleteTeacherReferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => deleteTeacherReference(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-references"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("Reference deleted");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not delete reference");
    },
  });
};

export const useCreateRotationalJobMetaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import("../types/TypeChecks").CreateRotationalJobMetaPayload) => createRotationalJobMeta(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rotational-meta", variables.jobId] });
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to save rotational settings");
    },
  });
};

export const useCreateSessionMutation = (jobId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import("../types/TypeChecks").CreateSessionPayload) => createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["roster", jobId] });
      toast.success("Session created");
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to create session");
    },
  });
};

export const useUpdateSessionMutation = (jobId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<import("../types/TypeChecks").CreateSessionPayload> }) => updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["roster", jobId] });
      toast.success("Session updated");
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to update session");
    },
  });
};

export const useDeleteSessionMutation = (jobId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["roster", jobId] });
      toast.success("Session deleted");
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to delete session");
    },
  });
};

export const useCreateAssignmentMutation = (jobId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import("../types/TypeChecks").CreateAssignmentPayload) => createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", jobId] });
      queryClient.invalidateQueries({ queryKey: ["assignments", "job", jobId] });
      toast.success("Teacher assigned to session");
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not assign teacher");
    },
  });
};

export const useDeleteAssignmentMutation = (jobId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", jobId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment removed");
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not remove assignment");
    },
  });
};

export const useUpsertAvailabilityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import("../types/TypeChecks").UpsertAvailabilityPayload) => upsertMyAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "my"] });
      toast.success("Availability saved");
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not save availability");
    },
  });
};

export const useDeleteAvailabilityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteAvailabilitySlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "my"] });
      toast.success("Availability removed");
    },
    onError: (error) => {
      const err = error as import("axios").AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not remove availability");
    },
  });
};
