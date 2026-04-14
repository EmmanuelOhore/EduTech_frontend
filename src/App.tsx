import { Route, Routes } from "react-router-dom";
import AcceptedApplicationsPage from "./pages/AcceptedApplicationsPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import JobListings from "./pages/JobListings";
import JobManagementPage from "./pages/JobManagementPage";
import SchoolJobDetail from "./pages/SchoolJobDetail";
import Login from "./pages/Login";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import SchoolAdminDashboard from "./pages/SchoolAdminDashboard";
import SchoolAdminProfile from "./pages/SchoolAdminProfile";
import SchoolRegister from "./pages/SchoolRegister";
import SessionManagerPage from "./pages/SessionManagerPage";
import RotationalSessionsPage from "./pages/RotationalSessionsPage";
import StatisticsPage from "./pages/StatisticsPage";
import TeacherProfilesPage from "./pages/TeacherProfilesPage";
import TeacherReferencesPage from "./pages/TeacherReferencesPage";
import TeacherPublicProfilePage from "./pages/TeacherPublicProfilePage";
import TeacherRegister from "./pages/TeacherRegister";
import TeacherSchedulePage from "./pages/TeacherSchedulePage";
import ProtectedRoute from "./lib/ProtectedRoute";

function App() {
  return (
    <main>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="login" element={<Login />} />
        <Route path="teacher/register" element={<TeacherRegister />} />
        <Route path="school/register" element={<SchoolRegister />} />
        <Route element={<ProtectedRoute />}>
          <Route path="jobs" element={<JobListings />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="teachers/:id/profile" element={<TeacherPublicProfilePage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/saved-jobs" element={<SavedJobsPage />} />
          <Route path="dashboard/applications" element={<MyApplicationsPage />} />
          <Route path="dashboard/accepted-applications" element={<AcceptedApplicationsPage />} />
          <Route path="dashboard/availability" element={<AvailabilityPage />} />
          <Route path="dashboard/schedule" element={<TeacherSchedulePage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["INSTITUTION_ADMIN", "SUPER_ADMIN"]} />}>
          <Route path="school/dashboard" element={<SchoolAdminDashboard />} />
          <Route path="school/jobs" element={<JobManagementPage />} />
          <Route path="school/jobs/:id" element={<SchoolJobDetail />} />
          <Route path="school/sessions" element={<RotationalSessionsPage />} />
          <Route path="school/jobs/:id/sessions" element={<SessionManagerPage />} />
          <Route path="school/teachers" element={<TeacherProfilesPage />} />
          <Route path="school/applications" element={<ApplicationsPage />} />
          <Route path="school/statistics" element={<StatisticsPage />} />
          <Route path="school/references" element={<TeacherReferencesPage />} />
          <Route path="school/profile" element={<SchoolAdminProfile />} />
        </Route>
      </Routes>
    </main>
  );
}

export default App;
