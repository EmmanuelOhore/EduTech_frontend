import axios from "axios";
import { clearStoredAuth, getStoredAuth } from "../lib/authStorage";
import type {
  ApplicationStatus,
  ChangePasswordPayload,
  CreateJobPayload,
  CreateTeacherReferencePayload,
  FullInstitution,
  Job,
  JobApplication,
  TeachingRecord,
  TeacherProfile,
  TeacherReference,
  TeacherReferenceSummary,
  UploadedAsset,
  UploadCategory,
  UpdateInstitutionPayload,
  UpdateProfilePayload,
  UpdateTeacherProfilePayload,
} from "../types/TypeChecks";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    "https://edutech-backend-659t.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const auth = getStoredAuth();
    if (auth?.token && config.headers) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const prevRequest = error.config;
    const requestUrl =
      typeof prevRequest?.url === "string" ? prevRequest.url : "";
    const isAuthAttempt =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register/teacher") ||
      requestUrl.includes("/auth/register/institution");

    if (
      error?.response?.status === 401 &&
      !prevRequest?.sent &&
      !isAuthAttempt
    ) {
      clearStoredAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const fetchJobs = async () => {
  const response = await api.get("/jobs");
  return response.data.jobs.map(normalizeJob) as Job[];
};

export const fetchJob = async (id: string) => {
  const response = await api.get(`/jobs/${id}`);
  return normalizeJob(response.data.job) as Job;
};

export const fetchInstitutionJobs = async (institutionId: string) => {
  const response = await api.get(`/jobs/institution/${institutionId}`);
  return response.data.jobs.map(normalizeJob) as Job[];
};

export const createJob = async (data: CreateJobPayload) => {
  const response = await api.post("/jobs", data);
  return normalizeJob(response.data.job) as Job;
};

export const updateJob = async (
  id: string,
  data: Partial<CreateJobPayload>,
) => {
  const response = await api.put(`/jobs/${id}`, data);
  return normalizeJob(response.data.job) as Job;
};

export const deleteJob = async (id: string) => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};

export const applyToJob = async (jobId: string, coverLetter?: string) => {
  const response = await api.post("/applications", { jobId, coverLetter });
  return response.data;
};

export const fetchInstitutionApplications = async (institutionId: string) => {
  const response = await api.get(`/applications/institution/${institutionId}`);
  return response.data.applications.map(
    normalizeApplication,
  ) as JobApplication[];
};

export const fetchJobApplications = async (jobId: string) => {
  const response = await api.get(`/applications/job/${jobId}`);
  return response.data.applications.map(
    normalizeApplication,
  ) as JobApplication[];
};

export const fetchMyApplications = async () => {
  const response = await api.get("/applications/my");
  return response.data.applications.map(
    normalizeApplication,
  ) as JobApplication[];
};

export const fetchMyTeacherProfile = async () => {
  const response = await api.get("/teachers/profile");
  return normalizeTeacherProfile(response.data.profile);
};

export const fetchTeacherProfile = async (teacherId: string) => {
  const response = await api.get(`/teachers/${teacherId}`);
  return normalizeTeacherProfile(response.data.profile);
};

export const fetchTeacherReferences = async (
  teacherId: string,
): Promise<TeacherReferenceSummary> => {
  const response = await api.get(`/teacher-references/teacher/${teacherId}`);
  return {
    averageRating: response.data.averageRating ?? 0,
    count: response.data.count ?? 0,
    references: response.data.references.map(
      normalizeTeacherReference,
    ) as TeacherReference[],
  };
};

export const fetchMyTeacherReferences =
  async (): Promise<TeacherReferenceSummary> => {
    const response = await api.get("/teacher-references/my");
    return {
      averageRating: response.data.averageRating ?? 0,
      count: response.data.count ?? 0,
      references: response.data.references.map(
        normalizeTeacherReference,
      ) as TeacherReference[],
    };
  };

export const fetchInstitutionTeacherReferences = async (
  institutionId: string,
): Promise<TeacherReferenceSummary> => {
  const response = await api.get(
    `/teacher-references/institution/${institutionId}`,
  );
  return {
    averageRating: response.data.references?.length
      ? Number(
          (
            response.data.references.reduce(
              (sum: number, ref: { rating: number }) => sum + ref.rating,
              0,
            ) / response.data.references.length
          ).toFixed(1),
        )
      : 0,
    count: response.data.count ?? 0,
    references: response.data.references.map(
      normalizeTeacherReference,
    ) as TeacherReference[],
  };
};

export const createTeacherReference = async (
  data: CreateTeacherReferencePayload,
) => {
  const response = await api.post("/teacher-references", data);
  return normalizeTeacherReference(response.data.reference) as TeacherReference;
};

export const deleteTeacherReference = async (id: string) => {
  const response = await api.delete(`/teacher-references/${id}`);
  return response.data;
};

export const updateApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
) => {
  const response = await api.patch(`/applications/${id}/status`, { status });
  return normalizeApplication(response.data.application) as JobApplication;
};

export const uploadAsset = async (
  file: File,
  category: UploadCategory,
): Promise<UploadedAsset> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const response = await api.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.file as UploadedAsset;
};

// ── Profile / Auth endpoints ──────────────────────────────────────
export const updateMyProfile = async (data: UpdateProfilePayload) => {
  const response = await api.patch("/auth/me", data);
  return response.data;
};

export const changeMyPassword = async (data: ChangePasswordPayload) => {
  const response = await api.post("/auth/change-password", data);
  return response.data;
};

export const updateMyTeacherProfile = async (
  data: UpdateTeacherProfilePayload,
) => {
  const {
    firstName,
    lastName,
    profileImage,
    isAvailable,
    _currentIsAvailable,
    location,
    level,
    bio,
    certificateUrl,
    ninDocumentUrl,
    teachingRecords,
  } = data;
  const promises: Promise<unknown>[] = [];

  // 1. User-level fields → PATCH /auth/me
  if (
    firstName !== undefined ||
    lastName !== undefined ||
    profileImage !== undefined
  ) {
    promises.push(api.patch("/auth/me", { firstName, lastName, profileImage }));
  }

  // 2. Teacher profile fields → PUT /teachers/profile
  const teacherBody: Record<string, unknown> = {};
  if (location !== undefined) teacherBody.location = location;
  if (level !== undefined) teacherBody.level = level;
  if (bio !== undefined) teacherBody.bio = bio;
  if (certificateUrl !== undefined) teacherBody.certificateUrl = certificateUrl;
  if (ninDocumentUrl !== undefined) teacherBody.ninDocumentUrl = ninDocumentUrl;
  if (teachingRecords !== undefined)
    teacherBody.teachingRecords = teachingRecords;
  if (Object.keys(teacherBody).length > 0) {
    promises.push(api.put("/teachers/profile", teacherBody));
  }

  // 3. Availability → PATCH /teachers/availability (toggle-only endpoint, call only if changed)
  if (isAvailable !== undefined && isAvailable !== _currentIsAvailable) {
    promises.push(api.patch("/teachers/availability"));
  }

  const results = await Promise.all(promises);
  return results[0];
};

// ── Institution endpoints ─────────────────────────────────────────
export const fetchInstitution = async (
  id: string,
): Promise<FullInstitution> => {
  const response = await api.get(`/institutions/${id}`);
  return response.data.institution as FullInstitution;
};

export const updateMyInstitution = async (
  id: string,
  data: UpdateInstitutionPayload,
) => {
  const response = await api.put(`/institutions/${id}`, data);
  return response.data.institution as FullInstitution;
};

type RawRelated = {
  _id?: string;
  name?: string;
  logoUrl?: string;
};

type RawJob = {
  _id: string;
  title: string;
  institutionId?: string | RawRelated;
  institutionImage?: string;
  location: string;
  employmentType: Job["employmentType"];
  level: Job["level"];
  subjectId?: string | RawRelated;
  subject?: string;
  salaryRange?: string;
  createdAt?: string;
  postedAt?: string;
  applicants?: number;
  slots?: number;
  featured?: boolean;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  isActive?: boolean;
  // Rotational fields
  rotationMode?: Job["rotationMode"];
  scheduleSummary?: string;
  expectedSessionsPerWeek?: number;
  requiresWeekendAvailability?: boolean;
  requiresMultiBranchTravel?: boolean;
};

type RawApplication = {
  _id: string;
  status: ApplicationStatus;
  coverLetter?: string;
  createdAt?: string;
  teacherId?: {
    _id?: string;
    location?: string;
    level?: string;
    bio?: string;
    isAvailable?: boolean;
    createdAt?: string;
    ninStatus?: string;
    ninDocumentUrl?: string;
    certificateUrl?: string;
    userId?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImage?: string;
      isVerified?: boolean;
    };
  };
  jobId?: RawJob;
};

type RawTeacherProfile = {
  _id: string;
  userId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    isVerified?: boolean;
  };
  location?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  bio?: string;
  ninStatus?: string;
  certificateUrl?: string;
  ninDocumentUrl?: string;
  teachingRecords?: TeachingRecord[];
  isAvailable?: boolean;
  createdAt?: string;
};

type RawTeacherReference = {
  _id: string;
  rating: number;
  referenceText: string;
  givenBy: string;
  createdAt?: string;
  teacherId?: RawTeacherProfile;
  institutionId?: RawRelated;
  jobId?: RawJob;
};

const normalizeJob = (job: RawJob): Job => {
  const institution =
    job.institutionId && typeof job.institutionId === "object"
      ? job.institutionId
      : null;
  const subject =
    job.subjectId && typeof job.subjectId === "object" ? job.subjectId : null;

  return {
    _id: String(job._id),
    title: job.title,
    institutionId: institution?._id
      ? String(institution._id)
      : typeof job.institutionId === "string"
        ? job.institutionId
        : undefined,
    institutionName: institution?.name,
    institutionImage: institution?.logoUrl ?? job.institutionImage,
    location: job.location,
    employmentType: job.employmentType,
    level: job.level,
    subject: subject?.name ?? job.subject,
    salaryRange: job.salaryRange,
    postedAt: job.createdAt
      ? new Date(job.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : job.postedAt,
    applicants: job.applicants ?? 0,
    slots: job.slots ?? 1,
    featured: job.featured ?? false,
    description: job.description,
    requirements: job.requirements ?? [],
    responsibilities: job.responsibilities ?? [],
    isActive: job.isActive ?? true,
    // Rotational fields
    rotationMode: job.rotationMode,
    scheduleSummary: job.scheduleSummary,
    expectedSessionsPerWeek: job.expectedSessionsPerWeek,
    requiresWeekendAvailability: job.requiresWeekendAvailability,
    requiresMultiBranchTravel: job.requiresMultiBranchTravel,
  };
};

const normalizeApplication = (application: RawApplication): JobApplication => {
  const user = application.teacherId?.userId;
  const job = application.jobId ? normalizeJob(application.jobId) : null;

  return {
    id: String(application._id),
    teacherId: application.teacherId
      ? String((application.teacherId as { _id?: string })._id ?? "")
      : undefined,
    teacherName:
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Teacher",
    teacherEmail: user?.email ?? "No email",
    teacherAvatar: user?.profileImage,
    teacherLevel: application.teacherId?.level ?? "Not set",
    teacherLocation: application.teacherId?.location ?? "Not set",
    teacherBio: application.teacherId?.bio,
    teacherVerified: user?.isVerified,
    teacherAvailable: application.teacherId?.isAvailable,
    teacherJoined: application.teacherId?.createdAt
      ? new Date(application.teacherId.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : undefined,
    ninStatus: application.teacherId?.ninStatus,
    ninDocumentUrl: application.teacherId?.ninDocumentUrl,
    certificateUrl: application.teacherId?.certificateUrl,
    jobId: job?._id ?? "",
    jobTitle: job?.title ?? "Unknown job",
    institutionName: job?.institutionName,
    jobType: job?.employmentType ?? "FULL_TIME",
    jobLevel: job?.level ?? "BEGINNER",
    jobLocation: job?.location ?? "Not set",
    subject: job?.subject,
    status: application.status,
    coverLetter: application.coverLetter,
    date: application.createdAt
      ? new Date(application.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
  };
};

const normalizeTeacherProfile = (
  profile: RawTeacherProfile,
): TeacherProfile => ({
  id: String(profile._id),
  userId: String(profile.userId?._id ?? ""),
  firstName: profile.userId?.firstName ?? "",
  lastName: profile.userId?.lastName ?? "",
  email: profile.userId?.email ?? "",
  profileImage: profile.userId?.profileImage,
  location: profile.location ?? "Not set",
  level: profile.level ?? "BEGINNER",
  bio: profile.bio,
  ninStatus: profile.ninStatus,
  certificateUrl: profile.certificateUrl,
  ninDocumentUrl: profile.ninDocumentUrl,
  teachingRecords: profile.teachingRecords ?? [],
  isAvailable: profile.isAvailable ?? true,
  isVerified: Boolean(profile.userId?.isVerified),
  createdAt: profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—",
});

const normalizeTeacherReference = (
  reference: RawTeacherReference,
): TeacherReference => ({
  id: String(reference._id),
  teacherId: String(reference.teacherId?._id ?? ""),
  teacherName:
    [
      reference.teacherId?.userId?.firstName,
      reference.teacherId?.userId?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Teacher",
  teacherEmail: reference.teacherId?.userId?.email ?? "No email",
  teacherAvatar: reference.teacherId?.userId?.profileImage,
  teacherLevel: reference.teacherId?.level ?? "BEGINNER",
  teacherLocation: reference.teacherId?.location ?? "Not set",
  subject:
    reference.jobId && typeof reference.jobId.subjectId === "object"
      ? reference.jobId.subjectId?.name
      : undefined,
  relatedJob: reference.jobId?.title ?? "Unknown job",
  relatedJobId: String(reference.jobId?._id ?? ""),
  jobLocation: reference.jobId?.location ?? "Not set",
  rating: reference.rating,
  referenceText: reference.referenceText,
  givenBy: reference.givenBy || reference.institutionId?.name || "School",
  date: reference.createdAt
    ? new Date(reference.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—",
});

// ── Rotational Job Meta ───────────────────────────────────────────
export const fetchRotationalJobMeta = async (
  jobId: string,
): Promise<import("../types/TypeChecks").RotationalJobMeta | null> => {
  try {
    const response = await api.get(`/rotational-meta/job/${jobId}`);
    return response.data.meta;
  } catch {
    return null;
  }
};

export const createRotationalJobMeta = async (
  data: import("../types/TypeChecks").CreateRotationalJobMetaPayload,
) => {
  const response = await api.post("/rotational-meta", data);
  return response.data.meta;
};

export const updateRotationalJobMeta = async (
  id: string,
  data: Partial<import("../types/TypeChecks").CreateRotationalJobMetaPayload>,
) => {
  const response = await api.put(`/rotational-meta/${id}`, data);
  return response.data.meta;
};

export const deleteRotationalJobMeta = async (id: string) => {
  const response = await api.delete(`/rotational-meta/${id}`);
  return response.data;
};

// ── Teacher Availability ──────────────────────────────────────────
export const fetchMyAvailability = async (): Promise<
  import("../types/TypeChecks").TeacherAvailability[]
> => {
  const response = await api.get("/availability/my");
  return response.data.availability;
};

export const fetchTeacherAvailability = async (
  teacherId: string,
): Promise<import("../types/TypeChecks").TeacherAvailability[]> => {
  const response = await api.get(`/availability/teacher/${teacherId}`);
  return response.data.availability;
};

export const upsertMyAvailability = async (
  data: import("../types/TypeChecks").UpsertAvailabilityPayload,
) => {
  const response = await api.put("/availability", data);
  return response.data.availability;
};

export const deleteAvailabilitySlot = async (id: string) => {
  const response = await api.delete(`/availability/${id}`);
  return response.data;
};

// ── Session Templates ─────────────────────────────────────────────
export const fetchSessionsByJob = async (
  jobId: string,
): Promise<import("../types/TypeChecks").SessionTemplate[]> => {
  const response = await api.get(`/sessions/job/${jobId}`);
  return response.data.sessions;
};

export const fetchSessionById = async (id: string) => {
  const response = await api.get(`/sessions/${id}`);
  return response.data;
};

export const createSession = async (
  data: import("../types/TypeChecks").CreateSessionPayload,
): Promise<import("../types/TypeChecks").SessionTemplate> => {
  const response = await api.post("/sessions", data);
  return response.data.session;
};

export const updateSession = async (
  id: string,
  data: Partial<import("../types/TypeChecks").CreateSessionPayload>,
): Promise<import("../types/TypeChecks").SessionTemplate> => {
  const response = await api.put(`/sessions/${id}`, data);
  return response.data.session;
};

export const deleteSession = async (id: string) => {
  const response = await api.delete(`/sessions/${id}`);
  return response.data;
};

// ── Assignments ───────────────────────────────────────────────────

type RawAssignmentTeacher = {
  _id?: string;
  userId?: { firstName?: string; lastName?: string; profileImage?: string };
  level?: string;
  location?: string;
};

type RawRosterAssignment = {
  _id: string;
  teacherId: RawAssignmentTeacher | string;
  status: import("../types/TypeChecks").AssignmentStatus;
};

type RawRosterItem = import("../types/TypeChecks").SessionTemplate & {
  assignments: RawRosterAssignment[];
};

export const fetchMyAssignments = async (): Promise<
  import("../types/TypeChecks").Assignment[]
> => {
  const response = await api.get("/assignments/my");
  return response.data.assignments;
};

export const fetchRosterByJob = async (
  jobId: string,
): Promise<import("../types/TypeChecks").RosterSession[]> => {
  const response = await api.get(`/assignments/roster/${jobId}`);
  const raw: RawRosterItem[] = response.data.roster ?? [];
  return raw.map((session) => ({
    ...session,
    _id: String(session._id),
    assignments: (session.assignments ?? []).map((a) => {
      const profile = a.teacherId as RawAssignmentTeacher | undefined;
      const user = profile?.userId;
      return {
        assignmentId: String(a._id),
        teacherId: profile?._id ? String(profile._id) : String(a.teacherId),
        teacherName:
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          "Teacher",
        teacherAvatar: user?.profileImage,
        teacherLevel: profile?.level ?? "BEGINNER",
        status: a.status,
      };
    }),
  }));
};

export const fetchAssignmentsByJob = async (jobId: string) => {
  const response = await api.get(`/assignments/job/${jobId}`);
  return response.data.assignments;
};

export const createAssignment = async (
  data: import("../types/TypeChecks").CreateAssignmentPayload,
) => {
  const response = await api.post("/assignments", data);
  return response.data.assignment;
};

export const deleteAssignment = async (id: string) => {
  const response = await api.delete(`/assignments/${id}`);
  return response.data;
};

export const updateAssignmentStatus = async (
  id: string,
  status: import("../types/TypeChecks").AssignmentStatus,
) => {
  const response = await api.patch(`/assignments/${id}/status`, { status });
  return response.data.assignment;
};

export default api;
