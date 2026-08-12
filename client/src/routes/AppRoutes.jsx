// =====================================================================
// AppRoutes — central route table for the entire application.
// =====================================================================

import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import PermissionRoute from '../components/auth/PermissionRoute';

import AppLayout from '../layouts/AppLayout';

import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import SessionExpiredPage from '../pages/auth/SessionExpiredPage';

import DashboardPage from '../pages/dashboard/DashboardPage';
import SearchPage from '../pages/dashboard/SearchPage';

import ProjectsListPage from '../pages/projects/ProjectsListPage';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';

import TasksListPage from '../pages/tasks/TasksListPage';
import MyTasksPage from '../pages/tasks/MyTasksPage';
import TaskDetailPage from '../pages/tasks/TaskDetailPage';

import ReviewQueuePage from '../pages/reviews/ReviewQueuePage';
import ReviewDetailPage from '../pages/reviews/ReviewDetailPage';

import NotificationsPage from '../pages/notifications/NotificationsPage';

import ActivityPage from '../pages/activity/ActivityPage';

import ReportsPage from '../pages/reports/ReportsPage';

import UsersPage from '../pages/users/UsersPage';
import ProfilePage from '../pages/users/ProfilePage';

import DevelopersPage from '../pages/developers/DevelopersPage';

import SettingsPage from '../pages/settings/SettingsPage';
import RolesPage from '../pages/settings/RolesPage';

import NotFoundPage from '../pages/errors/NotFoundPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />

      {/* Protected app shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />

        <Route path="/projects" element={<ProjectsListPage />} />
        <Route
          path="/projects/:projectId"
          element={
            <PermissionRoute permission="project.view">
              <ProjectDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <PermissionRoute permission="task.view">
              <TasksListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/tasks/me"
          element={
            <PermissionRoute permission="task.view">
              <MyTasksPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/tasks/:taskId"
          element={
            <PermissionRoute permission="task.view">
              <TaskDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <PermissionRoute permission="review.view">
              <ReviewQueuePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/reviews/:reviewId"
          element={
            <PermissionRoute permission="review.view">
              <ReviewDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <PermissionRoute permission="notification.view">
              <NotificationsPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <PermissionRoute permission="activity.view">
              <ActivityPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <PermissionRoute permission="report.view">
              <ReportsPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PermissionRoute permission="user.view">
              <UsersPage />
            </PermissionRoute>
          }
        />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/settings/roles"
          element={
            <PermissionRoute permission="user.view">
              <RolesPage />
            </PermissionRoute>
          }
        />

        <Route path="/403" element={<ForbiddenPage />} />
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
