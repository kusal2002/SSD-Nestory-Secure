import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AssignmentDetailProvider } from './contexts/AssignmentDetailContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ParentDashboard from './pages/parent/Dashboard';
import StoriesPage from './pages/parent/StoriesPage';
import StoryDetailPage from './pages/parent/StoryDetailPage';
import ChildDetailPage from './pages/parent/ChildDetailPage';
import AssignmentsPage from './pages/parent/AssignmentsPage';
import ParentSettingsPage from './pages/parent/FamilySettingsPage';
import ParentAccountSettingsPage from './pages/parent/AccountSettingsPage';
import ParentProgressPage from './pages/parent/ProgressPage';
import ParentLayout from './components/common/ParentLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLayout from './components/admin/AdminLayout';
import AdminSettingsPage from './pages/admin/SettingsPage';
import StoryManagementPage from './pages/admin/storyLibrary/StoryManagementPage';
import ChildDashboard from './pages/child/Dashboard';
import ChildChangePasswordPage from './pages/child/ChangePasswordPage';
import ChildAssignmentDetailPage from './pages/child/AssignmentDetailPage';
import GamificationPage from './pages/gamification/GamificationPage';
import GamificationAdminPage from './pages/admin/gamification/GamificationAdminPage';
import AnalyticsAdminPage from './pages/admin/analytics/AnalyticsAdminPage';
import ReaderPage from './pages/child/ReaderPage';
import GoogleBooksImportPage from './pages/admin/storyLibrary/GoogleBooksImportPage';
import UsersPage from './pages/admin/UsersPage';
import ReadingPage from './pages/child/ReadingPage';
import ChildProgressPage from './pages/child/ProgressPage';
import ChildSettingsPage from './pages/child/SettingsPage';
import FamilyChatPage from './pages/chat/FamilyChatPage';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-nestory-50 to-blue-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-nestory-600 font-semibold">Loading Nestory...</p>
    </div>
  </div>
);

// Protected Route Component (for future use with more complex route guards)
// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   requiredRole?: string;
// }
// 
// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
//   const { isAuthenticated, user, isLoading } = useAuth();
//   
//   if (isLoading) {
//     return <LoadingScreen />;
//   }
//   
//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location.pathname }} replace />;
//   }
//   
//   if (requiredRole && user?.role !== requiredRole) {
//     return <Navigate to={`/${user?.role}`} replace />;
//   }
//   
//   return <>{children}</>;
// };

// Main App Component
const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const isParentRole = user?.role === 'parent';
  const hasValidRole = isParentRole || user?.role === 'admin' || user?.role === 'child';

  const getDefaultRoute = () => {
    if (!isAuthenticated || !hasValidRole) return '/login';
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'child' && user?.mustChangePassword) return '/child/change-password';
    if (user?.role === 'child') return '/child';
    return '/dashboard';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Home page - Landing or redirect based on auth */}
      <Route 
        path="/" 
        element={
          isAuthenticated && hasValidRole 
            ? <Navigate to={getDefaultRoute()} replace />
            : <Landing />
        } 
      />
      
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated && hasValidRole
            ? <Navigate to={getDefaultRoute()} replace />
            : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated && hasValidRole
            ? <Navigate to={getDefaultRoute()} replace />
            : <RegisterPage />
        }
      />
      <Route
        path="/forgot-password"
        element={
          isAuthenticated && hasValidRole
            ? <Navigate to={getDefaultRoute()} replace />
            : <ForgotPasswordPage />
        }
      />
      <Route
        path="/reset-password"
        element={
          isAuthenticated && hasValidRole
            ? <Navigate to={getDefaultRoute()} replace />
            : <ResetPasswordPage />
        }
      />

      {/* Authenticated routes based on role */}
      {isAuthenticated && isParentRole && (
        <Route path="/" element={<ParentLayout />}>
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="story/:storyId" element={<StoryDetailPage />} />
          <Route path="child/:childId" element={<ChildDetailPage />} />
          <Route
            path="assignments"
            element={
              <AssignmentDetailProvider>
                <AssignmentsPage />
              </AssignmentDetailProvider>
            }
          />
          <Route path="family-settings" element={<ParentSettingsPage />} />
          <Route path="account-settings" element={<ParentAccountSettingsPage />} />
          <Route path="progress" element={<ParentProgressPage />} />
          <Route path="gamification" element={<GamificationPage />} />
          <Route path="chat" element={<FamilyChatPage />} />
        </Route>
      )}

      {isAuthenticated && user?.role === 'admin' && (
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="story-management" element={<StoryManagementPage />} />
          <Route path="story-management/import" element={<GoogleBooksImportPage />} />
          <Route path="gamification" element={<GamificationAdminPage />} />
          <Route path="analytics" element={<AnalyticsAdminPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      )}

      {isAuthenticated && user?.role === 'child' && (
        <>
          <Route
            path="/child"
            element={
              user?.mustChangePassword
                ? <Navigate to="/child/change-password" replace />
                : <ChildDashboard />
            }
          />
          <Route path="/child/change-password" element={<ChildChangePasswordPage />} />
          <Route path="/child/assignments/:assignmentId" element={<ChildAssignmentDetailPage />} />
          <Route path="/story/:storyId" element={<StoryDetailPage />} />
          <Route path="/child/gamification" element={<GamificationPage />} />
          <Route path="/reader/:storyId" element={<ReaderPage />} />
          <Route path="/child/read/:sessionId" element={<ReadingPage />} />
          <Route path="/child/progress" element={<ChildProgressPage />} />
          <Route path="/child/chat" element={<FamilyChatPage />} />
          <Route path="/child/settings" element={<ChildSettingsPage />} />
        </>
      )}

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
