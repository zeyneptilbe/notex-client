import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { AuthLayout } from "../components/layout/AuthLayout";
import { MainLayout } from "../components/layout/MainLayout";

// Pages
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import PostDetail from "../pages/PostDetail";
import CreatePost from "../pages/CreatePost";
import EditPost from "../pages/EditPost";
import Profile from "../pages/Profile";
import Favorites from "../pages/Favorites";
import Teams from "../pages/Teams";
import NotFound from "../pages/NotFound";
import Notifications from "../pages/Notifications";
import Drafts from "../pages/Drafts";

// Admin Pages
import {
  UsersManagement,
  CategoriesManagement,
  UnitsManagement,
  TeamsManagement,
  TagsManagement,
  RolesManagement,
  PendingApproval,
} from "../pages/admin";

export const router = createBrowserRouter([
  // Public Routes
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Login />,
      },
    ],
  },

  // Protected Routes
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "posts",
        element: <Dashboard />,
      },
      {
        path: "posts/new",
        element: <CreatePost />,
      },
      {
        path: "posts/:slug",
        element: <PostDetail />,
      },
      {
        path: "posts/:slug/edit",
        element: <EditPost />,
      },
      {
        path: "favorites",
        element: <Favorites />,
      },
      {
        path: "teams",
        element: <Teams />,
      },
      {
        path: "profile/:id",
        element: <Profile />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "drafts",
        element: <Drafts />,
      },
      // Admin Routes
      {
        path: "admin/users",
        element: (
          <AdminRoute>
            <UsersManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <AdminRoute>
            <CategoriesManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/units",
        element: (
          <AdminRoute>
            <UnitsManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/teams",
        element: (
          <AdminRoute>
            <TeamsManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/tags",
        element: (
          <AdminRoute>
            <TagsManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/roles",
        element: (
          <AdminRoute>
            <RolesManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/pending-approval",
        element: (
          <AdminRoute>
            <PendingApproval />
          </AdminRoute>
        ),
      },
    ],
  },

  // 404
  {
    path: "*",
    element: <NotFound />,
  },
]);
