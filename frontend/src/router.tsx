import { createBrowserRouter, Navigate } from "react-router"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import AppLayout from "./components/layout/AppLayout"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import PropertiesPage from "./pages/PropertiesPage"
import PropertyDetailsPage from "./pages/PropertyDetailsPage"
import PropertyFormPage from "./pages/PropertyFormPage"
import ClientsPage from "./pages/ClientsPage"
import ClientFormPage from "./pages/ClientFormPage"
import ClientDetailsPage from "./pages/ClientDetailsPage"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
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
      { path: "dashboard", element: <DashboardPage /> },

      { path: "properties", element: <PropertiesPage /> },
      { path: "properties/create", element: <PropertyFormPage /> },
      { path: "properties/:id", element: <PropertyDetailsPage /> },
      { path: "properties/:id/edit", element: <PropertyFormPage /> },

      { path: "clients", element: <ClientsPage /> },
      { path: "clients/create", element: <ClientFormPage /> },
      { path: "clients/:id", element: <ClientDetailsPage /> },
      { path: "clients/:id/edit", element: <ClientFormPage /> },
    ],
  },

  // catch all route
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
])
