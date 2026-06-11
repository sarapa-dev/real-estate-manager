import { createBrowserRouter, Navigate } from "react-router"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import AppLayout from "./components/layout/AppLayout"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
    ],
  },

  // catch all route
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
])
