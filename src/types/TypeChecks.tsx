export type LoginPayload = {
  email: string;
  password: string;
};

export type UserRole = "TEACHER" | "INSTITUTION_ADMIN" | "SUPER_ADMIN";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  profileImage?: string;
};

export type AuthInstitution = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: "PRIMARY" | "SECONDARY" | "TERTIARY" | "VOCATIONAL" | "OTHER";
  location: string;
  isVerified: boolean;
  logoUrl?: string;
  verificationDocumentUrl?: string;
};

export type FullInstitution = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  type: "PRIMARY" | "SECONDARY" | "TERTIARY" | "VOCATIONAL" | "OTHER";
  location: string;
  address?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  verificationDocumentUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
};

export type UpdateTeacherProfilePayload = {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  location?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  bio?: string;
  certificateUrl?: string;
  ninDocumentUrl?: string;
  teachingRecords?: TeachingRecord[];
  isAvailable?: boolean;
  /** Pass the profile's original isAvailable so we know whether to call the toggle endpoint */
  _currentIsAvailable?: boolean;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type UpdateInstitutionPayload = {
  name?: string;
  phone?: string;
  type?: FullInstitution["type"];
  location?: string;
  address?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  verificationDocumentUrl?: string;
};

export type AuthResponse = {
  success: boolean;
  token: string;
  user: AuthUser;
  institution?: AuthInstitution;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type TeacherRegisterPayload = RegisterPayload & {
  location: string;
  level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  bio?: string;
  nin?: string;
  profileImage?: string;
  certificateUrl?: string;
  ninDocumentUrl?: string;
};

export type SchoolRegisterPayload = RegisterPayload & {
  schoolName: string;
  schoolLocation: string;
  schoolType: "PRIMARY" | "SECONDARY" | "TERTIARY" | "VOCATIONAL" | "OTHER";
  phone?: string;
  adminProfileImage?: string;
  schoolLogoUrl?: string;
  verificationDocumentUrl?: string;
};

export type UploadCategory =
  | "teacher-profile-image"
  | "teacher-certificate"
  | "teacher-nin-document"
  | "institution-logo"
  | "institution-verification-document"
  | "admin-profile-image";

export type UploadedAsset = {
  url: string;
  publicId: string;
  resourceType: string;
  originalName: string;
};

export type TeachingRecord = {
  schoolName: string;
  roleTitle: string;
  startYear: number;
  endYear?: number;
  description?: string;
};

export type TeacherRegisterFormValues = RegisterPayload & {
  confirmPassword: string;
  subject: string;
  location: string;
  level: "BEGINNER" | "INTERMEDIATE" | "EXPERT" | "";
  referralCode: string;
  nin: string;
  profilePicture: string;
  teachingCertificate: string;
  agreeToTerms: boolean;
};

export type SchoolRegisterFormValues = RegisterPayload & {
  confirmPassword: string;
  schoolName: string;
  schoolLocation: string;
  schoolType: "PRIMARY" | "SECONDARY" | "TERTIARY" | "VOCATIONAL" | "OTHER" | "";
  phone: string;
  schoolLogoUrl: string;
  verificationDocumentUrl: string;
  agreeToTerms: boolean;
};

export type Job = {
  _id: string;
  title: string;
  institutionId?: string;
  institutionName?: string;
  institutionImage?: string;
  location: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "ROTATIONAL";
  level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  subject?: string;
  salaryRange?: string;
  postedAt?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  applicants?: number;
  slots?: number;
  featured?: boolean;
  isActive?: boolean;
  rotationMode?: "FIXED_DAYS" | "FLEXIBLE" | "SEASONAL" | "MULTI_BRANCH";
  scheduleSummary?: string;
  expectedSessionsPerWeek?: number;
  requiresWeekendAvailability?: boolean;
  requiresMultiBranchTravel?: boolean;
};

export type CreateJobPayload = {
  title: string;
  description?: string;
  subjectName: string;
  level: Job["level"];
  location: string;
  employmentType: Job["employmentType"];
  salaryRange?: string;
  slots?: number;
  requirements?: string[];
  responsibilities?: string[];
  isActive?: boolean;
  institutionId?: string;
  rotationMode?: "FIXED_DAYS" | "FLEXIBLE" | "SEASONAL" | "MULTI_BRANCH";
  scheduleSummary?: string;
  expectedSessionsPerWeek?: number;
  requiresWeekendAvailability?: boolean;
  requiresMultiBranchTravel?: boolean;
  /** Internal field — branches string from form, stripped before sending to API */
  _rotationalBranches?: string;
};

export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type JobApplication = {
  id: string;
  teacherId?: string;
  teacherName: string;
  teacherEmail: string;
  teacherAvatar?: string;
  teacherLevel: string;
  teacherLocation: string;
  teacherBio?: string;
  teacherVerified?: boolean;
  teacherAvailable?: boolean;
  teacherJoined?: string;
  ninStatus?: string;
  ninDocumentUrl?: string;
  certificateUrl?: string;
  jobId: string;
  jobTitle: string;
  institutionName?: string;
  jobType: Job["employmentType"];
  jobLevel: Job["level"];
  jobLocation: string;
  subject?: string;
  status: ApplicationStatus;
  coverLetter?: string;
  date: string;
};

export type TeacherReference = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherAvatar?: string;
  teacherLevel: string;
  teacherLocation: string;
  subject?: string;
  relatedJob: string;
  relatedJobId: string;
  jobLocation: string;
  rating: number;
  referenceText: string;
  givenBy: string;
  date: string;
};

export type TeacherReferenceSummary = {
  averageRating: number;
  count: number;
  references: TeacherReference[];
};

export type TeacherProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  location: string;
  level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  bio?: string;
  ninStatus?: string;
  certificateUrl?: string;
  ninDocumentUrl?: string;
  teachingRecords: TeachingRecord[];
  isAvailable: boolean;
  isVerified: boolean;
  createdAt: string;
};

export type CreateTeacherReferencePayload = {
  teacherId: string;
  jobId: string;
  rating: number;
  referenceText: string;
};

export type RotationMode = "FIXED_DAYS" | "FLEXIBLE" | "SEASONAL" | "MULTI_BRANCH";
export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type AssignmentStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";

export type RotationalJobMeta = {
  _id: string;
  jobId: string;
  institutionId: string;
  branches: string[];
  activeWeeks?: { startDate: string; endDate: string; label?: string }[];
  preferredDays?: string[];
  sessionDurationMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TeacherAvailability = {
  _id: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  locationPreference?: string;
  availableForWeekend: boolean;
  availableForEvening: boolean;
  notes?: string;
};

export type SessionTemplate = {
  _id: string;
  institutionId: string;
  jobId: string;
  title: string;
  subject: string;
  classGroup?: string;
  branch?: string;
  location?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  activeFrom?: string;
  activeTo?: string;
  neededTeachers: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
};

export type AssignedTeacher = {
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  teacherLevel: string;
  status: AssignmentStatus;
};

export type RosterSession = SessionTemplate & {
  assignments: AssignedTeacher[];
};

export type Assignment = {
  _id: string;
  teacherId: string;
  institutionId: string;
  jobId: string;
  jobTitle?: string;
  institutionName?: string;
  institutionLogoUrl?: string;
  sessionTemplateId: SessionTemplate;
  specificDate?: string;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
};

export type CreateRotationalJobMetaPayload = {
  jobId: string;
  branches?: string[];
  activeWeeks?: { startDate: string; endDate: string; label?: string }[];
  preferredDays?: string[];
  sessionDurationMinutes?: number;
  notes?: string;
};

export type UpsertAvailabilityPayload = {
  slots: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    locationPreference?: string;
    availableForWeekend?: boolean;
    availableForEvening?: boolean;
    notes?: string;
  }[];
};

export type CreateSessionPayload = {
  jobId: string;
  title: string;
  subject: string;
  classGroup?: string;
  branch?: string;
  location?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  activeFrom?: string;
  activeTo?: string;
  neededTeachers?: number;
  notes?: string;
};

export type CreateAssignmentPayload = {
  teacherId: string;
  sessionTemplateId: string;
  jobId: string;
  notes?: string;
  specificDate?: string;
};
