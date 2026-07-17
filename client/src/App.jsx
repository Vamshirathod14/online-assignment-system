import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import StudentLayout from './components/layouts/StudentLayout';
import AdminLayout from './components/layouts/AdminLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const StudentLogin = lazy(() => import('./pages/student/StudentLogin'));
const StudentRegister = lazy(() => import('./pages/student/StudentRegister'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentExam = lazy(() => import('./pages/student/StudentExam'));
const StudentResults = lazy(() => import('./pages/student/StudentResults'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'));
const AdminTests = lazy(() => import('./pages/admin/AdminTests'));
const AdminQuestions = lazy(() => import('./pages/admin/AdminQuestions'));
const AdminResults = lazy(() => import('./pages/admin/AdminResults'));
const AdminColleges = lazy(() => import('./pages/admin/AdminColleges'));
const StudentForgotPassword = lazy(() => import('./pages/student/ForgotPassword'));
const AdminForgotPassword = lazy(() => import('./pages/admin/ForgotPassword'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout>
                <StudentDashboard />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam/:attemptId"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout>
                <StudentResults />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AdminStudents />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tests"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AdminTests />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AdminQuestions />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/results"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AdminResults />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/colleges"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AdminColleges />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
