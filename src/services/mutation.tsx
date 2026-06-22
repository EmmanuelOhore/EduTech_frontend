import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import api, {
  applyToJob,
  changeMyPassword,
  createTeacherReference,
  createSubject,
  createJob,
  deactivateInstitution,
  deleteSubject,
  deleteTeacherReference,
  deleteJob,
  verifyInstitution,
  updateJob,
  updateApplicationStatus,
  updateMyInstitution,
  updateMyProfile,
  updateMyTeacherProfile,
  updateTeacherKycStatus,
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
  createJobTemplate,
  updateJobTemplate,
  deleteJobTemplate,
  setInstitutionPlan,
  markNotificationRead,
  markAllNotificationsRead,
  raiseReplacement,
  assignSubstitute,
  cancelReplacement,
  generateTestStaff,
  deleteTestUsers,
  setBackgroundCheckConsent,
  setMyGeo,
  clearMyGeo,
  addGuarantor,
  deleteGuarantor,
  submitGuarantorByToken,
  reviewGuarantor,
} from "./base";
import type { AddGuarantorPayload, ApplicationStatus, AuthResponse, ChangePasswordPayload, CreateJobPayload, CreateTeacherReferencePayload, DeleteTestUsersPayload, FullInstitution, GenerateTestStaffPayload, KycStatus, LoginPayload, SchoolRegisterPayload, SubmitGuarantorPayload, TeacherRegisterPayload, UpdateInstitutionPayload, UpdateProfilePayload, UpdateTeacherProfilePayload, UploadedAsset, UploadCategory } from "../types/TypeChecks";
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
      const response = await api.post("/auth/register/staff", data);
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
    mutationFn: async ({
      jobId,
      coverLetter,
      screeningAnswers,
    }: {
      jobId: string;
      coverLetter?: string;
      screeningAnswers?: { question: string; answer: string }[];
    }) => applyToJob(jobId, coverLetter, screeningAnswers),
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

export const useVerifyInstitutionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => verifyInstitution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast.success("School verified");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not verify school");
    },
  });
};

export const useDeactivateInstitutionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => deactivateInstitution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast.success("School deactivated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not deactivate school");
    },
  });
};

export const useUpdateTeacherKycStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      kycStatus,
      rejectionReason,
    }: {
      id: string;
      kycStatus: KycStatus;
      rejectionReason?: string;
    }) => updateTeacherKycStatus(id, kycStatus, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("Staff KYC updated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not update KYC");
    },
  });
};

export const useCreateSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => createSubject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject added");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not add subject");
    },
  });
};

export const useDeleteSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not delete subject");
    },
  });
};

export const useGenerateTestStaffMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateTestStaffPayload) => generateTestStaff(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools", "test-data"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(`Generated ${result.created.users} test staff`);
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not generate test staff");
    },
  });
};

export const useDeleteTestUsersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteTestUsersPayload) => deleteTestUsers(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools", "test-data"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(`Deleted ${result.deleted.users} test users`);
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || err.message || "Could not delete test users");
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

// ── Job Templates ─────────────────────────────────────────────────

export const useCreateJobTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import("./base").JobTemplatePayload) =>
      createJobTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-templates"] });
      toast.success("Template saved");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not save template");
    },
  });
};

export const useUpdateJobTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      data: Partial<import("./base").JobTemplatePayload>;
    }) => updateJobTemplate(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-templates"] });
      toast.success("Template updated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not update template");
    },
  });
};

export const useDeleteJobTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteJobTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-templates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not delete template");
    },
  });
};

// ── Notifications ─────────────────────────────────────────────────

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

// ── Replacements ──────────────────────────────────────────────────

export const useRaiseReplacementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      assignmentId: string;
      triggerEvent: "NO_SHOW" | "RESIGNATION" | "KYC_FAILURE";
      reason?: string;
    }) => raiseReplacement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replacements"] });
      queryClient.invalidateQueries({ queryKey: ["roster"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Replacement request raised");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not raise replacement");
    },
  });
};

export const useAssignSubstituteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; teacherId?: string; auto?: boolean }) =>
      assignSubstitute(vars.id, { teacherId: vars.teacherId, auto: vars.auto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replacements"] });
      queryClient.invalidateQueries({ queryKey: ["replacement-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["roster"] });
      toast.success("Substitute assigned");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not assign substitute");
    },
  });
};

export const useCancelReplacementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => cancelReplacement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replacements"] });
      toast.success("Replacement cancelled");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not cancel");
    },
  });
};

// ── Service Plans ─────────────────────────────────────────────────

export const useSetInstitutionPlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; planType: "BASIC" | "ENTERPRISE" | "PRO" }) =>
      setInstitutionPlan(vars.id, vars.planType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast.success("Plan updated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not update plan");
    },
  });
};

// ── KYC: consent + guarantors ─────────────────────────────────────

export const useSetConsentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consent: boolean) => setBackgroundCheckConsent(consent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("Consent updated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not update consent");
    },
  });
};

// Teacher shares precise GPS location (opt-in). Outranks the centroid.
export const useSetMyGeoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coords: { lat: number; lng: number; accuracyM?: number }) =>
      setMyGeo(coords.lat, coords.lng, coords.accuracyM),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("Location updated — you'll now see jobs nearest to you");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not update location");
    },
  });
};

// Teacher reverts to the state/LGA centroid.
export const useClearMyGeoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearMyGeo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("Precise location cleared");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not clear location");
    },
  });
};

export const useAddGuarantorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddGuarantorPayload) => addGuarantor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guarantors", "my"] });
      toast.success("Guarantor added — share their link to complete verification");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not add guarantor");
    },
  });
};

export const useDeleteGuarantorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGuarantor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guarantors", "my"] });
      toast.success("Guarantor removed");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not remove guarantor");
    },
  });
};

export const useSubmitGuarantorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitGuarantorPayload) => submitGuarantorByToken(payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["guarantor", "portal", vars.token] });
      toast.success("Submitted — thank you!");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not submit");
    },
  });
};

export const useReviewGuarantorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      status: "UNDER_REVIEW" | "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => reviewGuarantor(vars.id, vars.status, vars.rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guarantors", "admin"] });
      toast.success("Guarantor updated");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Could not update guarantor");
    },
  });
};
