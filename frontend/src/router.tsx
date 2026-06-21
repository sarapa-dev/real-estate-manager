import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import AppLayout from "./components/layout/AppLayout"
import { Skeleton } from "@/components/ui/skeleton"

// left login page as regular import since its entry point for new users
import LoginPage from "./pages/LoginPage"

const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const PropertiesPage = lazy(() => import("./pages/PropertiesPage"))
const PropertyDetailsPage = lazy(() => import("./pages/PropertyDetailsPage"))
const PropertyFormPage = lazy(() => import("./pages/PropertyFormPage"))
const ClientsPage = lazy(() => import("./pages/ClientsPage"))
const ClientFormPage = lazy(() => import("./pages/ClientFormPage"))
const ClientDetailsPage = lazy(() => import("./pages/ClientDetailsPage"))
const ReservationsPage = lazy(() => import("./pages/ReservationsPage"))
const ReservationFormPage = lazy(() => import("./pages/ReservationFormPage"))
const ReservationDetailsPage = lazy(
  () => import("./pages/ReservationDetailsPage")
)
const CalendarPage = lazy(() => import("./pages/CalendarPage"))
const SettingsPage = lazy(() => import("./pages/SettingsPage"))

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AppLayout />
        </Suspense>
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

      { path: "reservations", element: <ReservationsPage /> },
      { path: "reservations/create", element: <ReservationFormPage /> },
      { path: "reservations/:id", element: <ReservationDetailsPage /> },

      { path: "calendar", element: <CalendarPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },

  // catch all route
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
])
